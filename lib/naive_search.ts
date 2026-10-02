import { auditProtocolSafety } from './protocol_auditor';
import { getLocalTrials } from './sanity';
import { ClinicalTrial, NaiveKeywordMatch, PatientProfile } from './types';
import { normalizeCondition } from './agent';

export function runNaiveKeywordSearch(
  profile: PatientProfile,
  extractedCriteria: {
    condition: string;
    biomarker: string;
    priorTherapy: string;
    state?: string;
    stage?: string;
    phase?: string;
  }
): {
  matches: NaiveKeywordMatch[];
  safetyViolationsCount: number;
  executionTimeMs: number;
  keywordTerms: string[];
} {
  const startTime = Date.now();
  const allTrials = getLocalTrials();

  const condNormalized = normalizeCondition(extractedCriteria.condition || profile.condition || '');
  const condTerm = condNormalized.toLowerCase().trim();
  const bioTerm = (extractedCriteria.biomarker || profile.biomarker || '').toLowerCase().trim();
  const stateTerm = (extractedCriteria.state || profile.location || profile.state || '').toLowerCase().trim();

  // Terms used by a naive keyword engine
  const searchTerms = [bioTerm, condTerm].filter(Boolean);

  const rawMatches: NaiveKeywordMatch[] = [];

  for (const trial of allTrials) {
    const briefTitle = (trial.briefTitle || '').toLowerCase();
    const officialTitle = (trial.officialTitle || '').toLowerCase();
    const condition = (trial.primaryCondition || '').toLowerCase();
    const rawCriteria = (trial.eligibility?.rawCriteriaText || '').toLowerCase();

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

    // Evaluate clinical safety violations using protocol auditor
    const audit = auditProtocolSafety(trial, {
      condition: condNormalized,
      biomarker: extractedCriteria.biomarker || profile.biomarker || '',
      priorTherapy: extractedCriteria.priorTherapy || profile.priorTherapy || 'Chemotherapy Allowed',
      location: extractedCriteria.state || profile.location || profile.state,
      phase: profile.phase || extractedCriteria.phase,
      stage: profile.stage || extractedCriteria.stage,
      age: profile.age,
      patientNarrative: profile.freeText,
    });

    rawMatches.push({
      trial,
      matchedKeywords: matchedTerms,
      isSafetyViolation: audit.isViolation,
      violationType: audit.violationType,
      violationMessage: audit.violationMessage,
      violationRule: audit.protocolRule,
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
