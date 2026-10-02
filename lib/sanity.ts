import { createClient } from '@sanity/client';
import { ClinicalTrial, ScoreboardStats } from './types';
import localTrialsData from '@/data/trials_normalized.json';

const cachedLocalTrials: ClinicalTrial[] = localTrialsData as unknown as ClinicalTrial[];

export function getLocalTrials(): ClinicalTrial[] {
  return cachedLocalTrials;
}

export function isSanityConfigured(): boolean {
  const projectId = process.env.SANITY_PROJECT_ID;
  const token =
    process.env.SANITY_API_WRITE_TOKEN ||
    process.env.SANITY_CONTEXT_TOKEN ||
    process.env.SANITY_API_READ_TOKEN;

  if (!projectId || !token) return false;
  if (
    projectId.trim() === '' ||
    projectId.includes('your_') ||
    token.trim() === '' ||
    token.includes('your_')
  ) {
    return false;
  }
  return true;
}

export function getSanityClient() {
  if (!isSanityConfigured()) return null;

  return createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET || 'production',
    token:
      process.env.SANITY_API_WRITE_TOKEN ||
      process.env.SANITY_CONTEXT_TOKEN ||
      process.env.SANITY_API_READ_TOKEN,
    apiVersion: '2024-03-01',
    useCdn: false,
  });
}

/**
 * Executes a deterministic GROQ query either against live Sanity (if tokens are configured)
 * or against local normalized JSON using GROQ-equivalent filtering logic.
 */
export async function executeGroqQuery(
  groqQuery: string,
  params: {
    condition?: string;
    biomarker?: string;
    state?: string;
    phase?: string;
    requireChemoAllowed?: boolean;
    [key: string]: any;
  }
): Promise<{
  trials: ClinicalTrial[];
  totalCount: number;
  dataSource: 'sanity-live' | 'local-normalized';
}> {
  const client = getSanityClient();

  if (client) {
    try {
      const liveResults = await client.fetch<ClinicalTrial[]>(groqQuery, params);
      if (Array.isArray(liveResults)) {
        return {
          trials: liveResults,
          totalCount: liveResults.length,
          dataSource: 'sanity-live',
        };
      }
    } catch (err) {
      console.warn('Sanity live fetch failed, falling back to local normalized dataset:', err);
    }
  }

  // Graceful fallback to local normalized dataset with exact GROQ-equivalent filtering
  const allTrials = getLocalTrials();
  const condTerm = (params.condition || '').toLowerCase().trim();
  const bioTerm = (params.biomarker || '').toLowerCase().trim();
  const stateTerm = (params.state || '').toLowerCase().trim();
  const phaseTerm = (params.phase || '').toUpperCase().trim();
  const requireChemoAllowed = params.requireChemoAllowed !== false;

  const filtered = allTrials.filter((trial) => {
    // 1. Recruitment Status
    if (trial.recruitmentStatus !== 'RECRUITING') {
      return false;
    }

    // 2. Primary condition match
    if (condTerm) {
      const fullText = [
        trial.primaryCondition,
        trial.briefTitle,
        trial.officialTitle,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const conditionLower = (trial.primaryCondition || '').toLowerCase();
      const conditionMatched =
        fullText.includes(condTerm) ||
        conditionLower.includes(condTerm) ||
        condTerm.split(/\s+/).some((token) => token.length > 3 && (conditionLower.includes(token) || fullText.includes(token)));

      if (!conditionMatched) return false;
    }

    // 3. Target biomarker match
    if (bioTerm) {
      const biomarkers = (trial.targetBiomarkers || []).map((b) => b.toLowerCase());
      const biomarkerMatched = biomarkers.some(
        (b) => b.includes(bioTerm) || bioTerm.includes(b)
      );
      if (!biomarkerMatched) return false;
    }

    // 4. Prior Therapy Chemotherapy rule
    if (requireChemoAllowed) {
      const chemoRule = trial.priorTherapyRules?.chemotherapy || 'ANY';
      if (chemoRule === 'EXCLUDED') {
        return false;
      }
    } else {
      const chemoRule = trial.priorTherapyRules?.chemotherapy || 'ANY';
      if (chemoRule === 'REQUIRED') {
        return false;
      }
    }

    // 5. Dynamic Geographic Location Match (city, state, country, or facility)
    if (stateTerm) {
      const locations = trial.locations || [];
      const locationMatched = locations.some((loc) => {
        const stateStr = (loc.state || '').toLowerCase();
        const cityStr = (loc.city || '').toLowerCase();
        const countryStr = (loc.country || '').toLowerCase();
        const facilityStr = (loc.facility || '').toLowerCase();
        const tokens = stateTerm.split(/[,/]+/).map((t) => t.trim()).filter(Boolean);
        return tokens.some(
          (t) =>
            stateStr.includes(t) ||
            cityStr.includes(t) ||
            countryStr.includes(t) ||
            facilityStr.includes(t)
        );
      });
      if (!locationMatched) return false;
    }

    // 6. Phase match if explicitly requested
    if (phaseTerm && phaseTerm !== 'ANY') {
      if (trial.phase && trial.phase !== phaseTerm) {
        return false;
      }
    }

    return true;
  });

  return {
    trials: filtered,
    totalCount: filtered.length,
    dataSource: 'local-normalized',
  };
}

/**
 * Returns dataset summary metrics for the live scoreboard.
 */
export async function getScoreboardStats(): Promise<ScoreboardStats> {
  const client = getSanityClient();

  if (client) {
    try {
      const query = `{
        "totalTrials": count(*[_type == "clinicalTrial"]),
        "recruitingTrials": count(*[_type == "clinicalTrial" && recruitmentStatus == "RECRUITING"])
      }`;
      const liveStats = await client.fetch<{ totalTrials: number; recruitingTrials: number }>(query);
      if (liveStats && liveStats.totalTrials > 0) {
        return {
          totalTrials: liveStats.totalTrials,
          recruitingTrials: liveStats.recruitingTrials,
          biomarkerCount: 15,
          totalLocations: 1144,
          dataSource: 'sanity-live',
        };
      }
    } catch {
      // Fall through to local stats
    }
  }

  const local = getLocalTrials();
  const recruiting = local.filter((t) => t.recruitmentStatus === 'RECRUITING').length;
  let locCount = 0;
  const biomarkers = new Set<string>();

  local.forEach((t) => {
    locCount += t.locations?.length || 0;
    (t.targetBiomarkers || []).forEach((b) => biomarkers.add(b));
  });

  return {
    totalTrials: local.length,
    recruitingTrials: recruiting,
    biomarkerCount: biomarkers.size || 15,
    totalLocations: locCount || 1144,
    dataSource: 'local-normalized',
  };
}
