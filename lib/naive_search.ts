import { getLocalTrials } from './sanity';
import { ClinicalTrial, NaiveKeywordMatch, PatientProfile } from './types';

export function runNaiveKeywordSearch(
  profile: PatientProfile,
  extractedCriteria: {
    condition: string;
    biomarker: string;
    priorTherapy: string;
    state?: string;
  }
): {
  matches: NaiveKeywordMatch[];
  safetyViolationsCount: number;
  executionTimeMs: number;
  keywordTerms: string[];
} {
  const startTime = Date.now();
  const allTrials = getLocalTrials();

  const condTerm = (extractedCriteria.condition || '').toLowerCase().trim();
  const bioTerm = (extractedCriteria.biomarker || '').toLowerCase().trim();
  const stateTerm = (extractedCriteria.state || '').toLowerCase().trim();

  // Terms used by a naive keyword engine
  const searchTerms = [bioTerm, condTerm].filter(Boolean);

  const rawMatches: NaiveKeywordMatch[] = [];

  for (const trial of allTrials) {
    const briefTitle = (trial.briefTitle || '').toLowerCase();
    const officialTitle = (trial.officialTitle || '').toLowerCase();
    const condition = (trial.primaryCondition || '').toLowerCase();
    const rawCriteria = (trial.eligibility?.rawCriteriaText || '').toLowerCase();
    const exclusionText = (trial.eligibility?.exclusionSummary || []).join(' ').toLowerCase();

    const fullBlob = `${briefTitle} ${officialTitle} ${condition} ${rawCriteria}`;

    // Naive keyword search matches if ANY primary search term appears in the text blob
    const matchedTerms: string[] = [];
    for (const term of searchTerms) {
      if (term && fullBlob.includes(term)) {
        matchedTerms.push(term);
      }
    }

    if (matchedTerms.length === 0) {
      continue;
    }

    // Now evaluate clinical safety violations in this naive match:
    let isSafetyViolation = false;
    let violationMessage: string | undefined;
    let violationType: NaiveKeywordMatch['violationType'];
    let violationRule: string | undefined;

    // 1. Direct Prior Chemotherapy Exclusion Violation
    const chemoRule = trial.priorTherapyRules?.chemotherapy;
    if (chemoRule === 'EXCLUDED' || rawCriteria.includes('prior chemotherapy is excluded') || rawCriteria.includes('no prior systemic chemotherapy')) {
      isSafetyViolation = true;
      violationType = 'CHEMO_EXCLUSION';
      violationRule = 'Protocol Exclusion Criterion #14';
      violationMessage =
        'CRITICAL SAFETY VIOLATION: Trial matched keyword but explicitly excludes patients with prior chemotherapy in Rule 14. Patient would be disqualified at clinic door.';
    }
    // 2. Lexical Collision Hazard (eGFR vs EGFR)
    else if (
      bioTerm === 'egfr' &&
      !trial.targetBiomarkers?.includes('EGFR') &&
      (rawCriteria.includes('egfr') || briefTitle.includes('egfr') || officialTitle.includes('egfr'))
    ) {
      isSafetyViolation = true;
      violationType = 'LEXICAL_COLLISION';
      violationRule = 'Laboratory Safety Threshold';
      violationMessage =
        'CRITICAL SAFETY VIOLATION: Matched clinical biomarker acronym on renal lab threshold ("eGFR" < 60 mL/min) in non-targeted trial. Patient lacks genuine targeted drug fit.';
    }
    // 3. Disease Mismatch via Negative Exclusion Criteria
    else if (
      condTerm &&
      !condition.includes(condTerm) &&
      !briefTitle.includes(condTerm) &&
      exclusionText.includes(condTerm)
    ) {
      isSafetyViolation = true;
      violationType = 'DISEASE_MISMATCH';
      violationRule = 'Prior Malignancy Exclusion';
      violationMessage = `CRITICAL SAFETY VIOLATION: Disease mismatch. Matched query term "${condTerm}" inside negative exclusion criteria ("History of active ${condTerm} is excluded").`;
    }
    // 4. Polarity Inversion (Biomarker Wild-Type required while patient is mutated)
    else if (
      bioTerm &&
      (rawCriteria.includes(`${bioTerm} wild-type`) ||
        rawCriteria.includes(`${bioTerm} wild type`) ||
        rawCriteria.includes(`no ${bioTerm} mutation`))
    ) {
      isSafetyViolation = true;
      violationType = 'POLARITY_INVERSION';
      violationRule = 'Genomic Biomarker Polarity';
      violationMessage = `CRITICAL SAFETY VIOLATION: Polarity inversion. Trial requires wild-type (absence of ${bioTerm.toUpperCase()} alteration), but matched patient harboring activating mutation.`;
    }
    // 5. Geographic Disconnect
    else if (stateTerm) {
      const states = (trial.locations || []).map((l) => (l.state || '').toLowerCase());
      const hasState = states.some((s) => s.includes(stateTerm));
      if (!hasState && states.length > 0) {
        // Not a critical safety violation, but a clinical mismatch
        isSafetyViolation = false;
      }
    }

    rawMatches.push({
      trial,
      matchedKeywords: matchedTerms,
      isSafetyViolation,
      violationType,
      violationMessage,
      violationRule,
    });
  }

  // Sort so safety violations are prominently displayed at top of naive results to demonstrate the danger
  rawMatches.sort((a, b) => {
    if (a.isSafetyViolation && !b.isSafetyViolation) return -1;
    if (!a.isSafetyViolation && b.isSafetyViolation) return 1;
    return 0;
  });

  const safetyViolationsCount = rawMatches.filter((m) => m.isSafetyViolation).length;
  const executionTimeMs = Date.now() - startTime;

  return {
    matches: rawMatches,
    safetyViolationsCount,
    executionTimeMs,
    keywordTerms: searchTerms,
  };
}
