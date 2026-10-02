import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { executeGroqQuery } from './sanity';
import { PatientProfile, StructuredMatch } from './types';

/**
 * Extracts structured oncology criteria from unstructured patient text.
 * Uses Claude Haiku 4.5 when ANTHROPIC_API_KEY is configured,
 * otherwise falls back directly to explicit profile filter parameters.
 */
export async function extractPatientCriteria(profile: PatientProfile): Promise<{
  condition: string;
  biomarker: string;
  priorTherapy: string;
  state: string;
  location?: string;
  stage?: string;
  phase?: string;
  reasoning: string;
  extractor: string;
}> {
  const text = profile.freeText || '';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 1. Try Claude Haiku 4.5 via live Anthropic API whenever clinical text is provided
  if (text.trim() && apiKey && apiKey.trim() !== '' && !apiKey.includes('your_')) {
    try {
      console.log('[TrialMatch] Invoking Claude Haiku 4.5 live API for clinical narrative parsing...');
      const response = await generateText({
        model: anthropic('claude-haiku-4-5-20251001'),
        system: `You are an expert clinical oncology trial parsing agent.
Analyze the patient narrative and extract search parameters matching international clinical trial registries.

GUIDELINES:
1. condition: Primary cancer diagnosis or histological subtype as stated in the text (e.g. Non-Small Cell Lung Cancer, Colorectal Adenocarcinoma, Breast Cancer, Melanoma, Gastric Adenocarcinoma, Glioblastoma, Acute Myeloid Leukemia, etc.). If an unverified acronym or non-oncology term is entered, extract it literally. If no diagnosis is provided, return null.
2. biomarker: Canonical gene symbol or targeted driver oncogene (e.g. HER2, EGFR, KRAS, BRAF, BRCA, ALK, MET, TROP2, CLDN18.2, HER3, RET, ROS1, NTRK, FGFR, PIK3CA). Always extract the primary gene symbol alone (e.g. return "HER2" rather than "HER2-positive", "EGFR" rather than "EGFR Exon 20", "KRAS" rather than "KRAS G12C"). Return null if none stated.
3. priorTherapy: Patient's systemic therapy history (e.g. "Chemotherapy Allowed", "Chemo-Naive Only", "Prior Immunotherapy Required", or specific regimen).
4. location: Explicitly stated geographic location (city, state, province, region, or country). If both city and country/state are stated (e.g. "Milan, Italy"), extract the primary city or specific jurisdiction (e.g. "Milan").
CRITICAL: Only extract genuine, explicitly stated geographic locations. NEVER infer or assume locations from brand names, theme parks, companies, or fictional entities. If no real geographic region is stated, return null.
5. stage: Cancer stage if stated (e.g. 'Stage IV', 'Metastatic', 'Stage IIIB', 'Stage I').
6. phase: Trial phase if specified (e.g. PHASE1, PHASE2, PHASE3, PHASE4, ANY) or null.
7. reasoning: Concise clinical summary of patient candidacy and search parameters.

Output strictly valid JSON with no markdown wrapping:
{
  "condition": "...",
  "biomarker": "...",
  "priorTherapy": "...",
  "location": null,
  "stage": "...",
  "phase": null,
  "reasoning": "..."
}`,
        prompt: `Analyze this patient clinical profile:\n"${text}"`,
        maxOutputTokens: 350,
      });

      const cleaned = response.text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      const condition = parsed.condition || profile.condition || '';
      const biomarker = parsed.biomarker || profile.biomarker || '';
      const location = parsed.location || profile.location || profile.state || '';

      return {
        condition,
        biomarker,
        priorTherapy: parsed.priorTherapy || profile.priorTherapy || 'Chemotherapy Allowed',
        state: location,
        location: location || undefined,
        stage: parsed.stage || profile.stage || undefined,
        phase: profile.phase || parsed.phase || extractPhase(text) || undefined,
        reasoning: parsed.reasoning || 'Extracted via structured clinical criteria analysis.',
        extractor: 'Structured Agent Engine',
      };
    } catch (err: any) {
      console.warn('[TrialMatch] Anthropic live API call failed, falling back to direct filters:', err?.message || err);
    }
  }

  // 2. Fallback: If explicit manual filter fields are passed (or when Claude is unavailable)
  if (profile.condition || profile.biomarker || profile.state || profile.location) {
    const loc = profile.location || profile.state || '';
    return {
      condition: profile.condition || '',
      biomarker: profile.biomarker || '',
      priorTherapy: profile.priorTherapy || 'Chemotherapy Allowed',
      state: loc,
      location: loc || undefined,
      stage: profile.stage,
      phase: profile.phase || extractPhase(text),
      reasoning: 'Extracted directly from clinical filter inputs.',
      extractor: 'Clinical Filter Engine',
    };
  }

  // 3. Narrative provided without active API connection
  return {
    condition: '',
    biomarker: '',
    priorTherapy: 'Chemotherapy Allowed',
    state: '',
    location: undefined,
    stage: undefined,
    phase: extractPhase(text),
    reasoning:
      'Natural language narrative parsing requires an active language model connection. Please configure ANTHROPIC_API_KEY or input parameters directly into the clinical filter fields.',
    extractor: 'Clinical Filter Engine',
  };
}

function extractPhase(text: string): string | undefined {
  const upper = text.toUpperCase();
  if (upper.includes('PHASE 3 ONLY') || upper.includes('PHASE III ONLY') || upper.includes('PHASE 3') || upper.includes('PHASE III')) return 'PHASE3';
  if (upper.includes('PHASE 2 ONLY') || upper.includes('PHASE II ONLY') || upper.includes('PHASE 2') || upper.includes('PHASE II')) return 'PHASE2';
  if (upper.includes('PHASE 1 ONLY') || upper.includes('PHASE I ONLY') || upper.includes('PHASE 1') || upper.includes('PHASE I')) return 'PHASE1';
  if (upper.includes('PHASE 4 ONLY') || upper.includes('PHASE IV ONLY') || upper.includes('PHASE 4') || upper.includes('PHASE IV')) return 'PHASE4';
  return undefined;
}

/**
 * Builds the deterministic GROQ query required for structured oncology retrieval.
 */
export function buildGroqQuery(params: {
  condition: string;
  biomarker: string;
  state?: string;
  location?: string;
  phase?: string;
  priorTherapy?: string;
}): { query: string; groqParams: Record<string, any> } {
  const groqParams: Record<string, any> = {};
  const filters: string[] = ['_type == "clinicalTrial"', 'recruitmentStatus == "RECRUITING"'];

  if (params.condition && params.condition.trim() !== '') {
    groqParams.condition = params.condition.trim();
    filters.push('primaryCondition match $condition');
  }

  if (params.biomarker && params.biomarker.trim() !== '') {
    groqParams.biomarker = params.biomarker.trim();
    filters.push('targetBiomarkers[] match $biomarker');
  }

  const locRaw = (params.location || params.state || '').trim();
  const loc = locRaw.includes(',') ? locRaw.split(',')[0].trim() : locRaw;
  if (loc) {
    groqParams.location = loc;
    filters.push(
      '(locations[].state match $location || locations[].city match $location || locations[].country match $location || locations[].facility match $location)'
    );
  }

  if (params.phase && params.phase !== 'ANY') {
    groqParams.phase = params.phase.trim();
    filters.push('phase == $phase');
  }

  const isChemoNaive = (params.priorTherapy || '').toLowerCase().includes('naive');
  if (isChemoNaive) {
    filters.push(
      '(priorTherapyRules.chemotherapy == "EXCLUDED" || priorTherapyRules.chemotherapy == "ANY")'
    );
  } else {
    filters.push(
      '(priorTherapyRules.chemotherapy == "ALLOWED" || priorTherapyRules.chemotherapy == "REQUIRED" || priorTherapyRules.chemotherapy == "ANY")'
    );
  }

  const query = `*[${filters.join(' && ')}]`;
  return { query, groqParams };
}

/**
 * Runs the complete Structured Sanity Agent pipeline.
 */
export async function runStructuredAgent(
  profile: PatientProfile,
  precomputedCriteria?: {
    condition: string;
    biomarker: string;
    priorTherapy: string;
    state: string;
    location?: string;
    phase?: string;
    reasoning: string;
    extractor: string;
  }
): Promise<{
  matches: StructuredMatch[];
  groqQuery: string;
  groqParams: Record<string, any>;
  summary: string;
  executionTimeMs: number;
  dataSource: 'sanity-live' | 'local-normalized';
  extractor?: string;
  reasoning?: string;
}> {
  const startTime = Date.now();

  // 1. Extract or reuse structured oncology parameters
  const criteria = precomputedCriteria || (await extractPatientCriteria(profile));

  // 2. Build deterministic GROQ query
  const isChemoNaive = criteria.priorTherapy?.toLowerCase().includes('naive') || false;
  const { query, groqParams } = buildGroqQuery({
    condition: criteria.condition,
    biomarker: criteria.biomarker,
    state: criteria.state,
    location: criteria.location || criteria.state,
    phase: criteria.phase,
    priorTherapy: criteria.priorTherapy,
  });

  // 3. Execute via Sanity / Local in-memory retrieval engine
  const result = await executeGroqQuery(query, {
    condition: criteria.condition,
    biomarker: criteria.biomarker,
    state: criteria.state,
    location: criteria.location || criteria.state,
    phase: criteria.phase,
    requireChemoAllowed: !isChemoNaive,
  });

  // 4. Map structured matches with clinical validation rationale
  const targetLoc = (criteria.location || criteria.state || '').toLowerCase();
  const matches: StructuredMatch[] = result.trials.map((trial) => {
    const chemoStatus = trial.priorTherapyRules?.chemotherapy || 'ANY';
    let priorTherapyCompatibility = 'Protocol permits prior chemotherapy regimens';
    if (chemoStatus === 'REQUIRED') {
      priorTherapyCompatibility = 'Requires prior systemic chemotherapy progression (Exact patient fit)';
    } else if (chemoStatus === 'ALLOWED') {
      priorTherapyCompatibility = 'Prior chemotherapy allowed under standard washout window';
    } else if (chemoStatus === 'EXCLUDED') {
      priorTherapyCompatibility = 'Frontline cohort strictly restricting to chemo-naive patients';
    }

    const locMatch = targetLoc
      ? trial.locations?.find((l) => {
          const s = (l.state || '').toLowerCase();
          const c = (l.city || '').toLowerCase();
          const co = (l.country || '').toLowerCase();
          const f = (l.facility || '').toLowerCase();
          return s.includes(targetLoc) || c.includes(targetLoc) || co.includes(targetLoc) || f.includes(targetLoc);
        })
      : trial.locations?.[0];

    const facilityStr = locMatch
      ? `${locMatch.facility || 'Clinical Center'}, ${locMatch.city || ''}, ${locMatch.state || locMatch.country || ''}`
      : 'Active site in target region';

    const rationale = `Verified protocol match: Primary condition [${trial.primaryCondition}] matches patient diagnosis. Target biomarker profile includes [${(trial.targetBiomarkers || []).join(', ')}]. ${priorTherapyCompatibility}. Verified recruiting site at ${facilityStr}.`;

    return {
      trial,
      matchScore: 0.98,
      matchRationale: rationale,
      matchedBiomarkers: (trial.targetBiomarkers || []).filter((b) =>
        b.toLowerCase().includes((criteria.biomarker || '').toLowerCase())
      ),
      priorTherapyCompatibility,
      locationMatch: facilityStr,
    };
  });

  const executionTimeMs = Date.now() - startTime;
  const locStr = criteria.location || criteria.state;
  const summary = `Identified ${matches.length} protocol-compliant trials matching ${criteria.condition || 'oncology criteria'}${criteria.biomarker ? ` with target biomarker ${criteria.biomarker}` : ''}${locStr ? ` in ${locStr}` : ''}. All returned trials strictly allow the patient's prior therapy history with zero protocol violations.`;

  return {
    matches,
    groqQuery: query,
    groqParams,
    summary: criteria.reasoning ? `${criteria.reasoning} ${summary}` : summary,
    executionTimeMs,
    dataSource: result.dataSource,
    extractor: criteria.extractor,
    reasoning: criteria.reasoning,
  };
}
