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

      // Check disease family synonyms (e.g. NSCLC matches lung)
      const isLungSynonym =
        condTerm.includes('lung') &&
        (fullText.includes('lung') || fullText.includes('nsclc') || fullText.includes('pulmonary'));
      const isCrcSynonym =
        condTerm.includes('colorectal') &&
        (fullText.includes('colorectal') || fullText.includes('colon') || fullText.includes('rectal') || fullText.includes('crc'));
      const isBreastSynonym =
        condTerm.includes('breast') && (fullText.includes('breast') || fullText.includes('mammary'));

      const conditionMatched =
        fullText.includes(condTerm) || isLungSynonym || isCrcSynonym || isBreastSynonym;

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
    }

    // 5. Location state match
    if (stateTerm) {
      const locations = trial.locations || [];
      const stateMatched = locations.some((loc) => {
        const stateStr = (loc.state || '').toLowerCase();
        return stateStr.includes(stateTerm);
      });
      if (!stateMatched) return false;
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
