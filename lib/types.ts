export type RecruitmentStatus =
  | 'RECRUITING'
  | 'ACTIVE_NOT_RECRUITING'
  | 'ENROLLING_BY_INVITATION'
  | string;

export type TrialPhase = 'PHASE1' | 'PHASE2' | 'PHASE3' | 'PHASE4' | 'NA' | string;

export type PriorTherapyValue = 'REQUIRED' | 'ALLOWED' | 'EXCLUDED' | 'ANY';

export interface TrialLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface TrialIntervention {
  type?: string;
  name?: string;
  description?: string;
}

export interface TrialEligibility {
  minimumAgeYears?: number | null;
  maximumAgeYears?: number | null;
  gender?: string;
  inclusionSummary?: string[];
  exclusionSummary?: string[];
  rawCriteriaText?: string;
}

export interface PriorTherapyRules {
  chemotherapy?: PriorTherapyValue;
  immunotherapy?: PriorTherapyValue;
  targetedTherapy?: PriorTherapyValue;
}

export interface ClinicalTrial {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  phase?: TrialPhase;
  recruitmentStatus?: RecruitmentStatus;
  primaryCondition?: string;
  targetBiomarkers?: string[];
  priorTherapyRules?: PriorTherapyRules;
  locations?: TrialLocation[];
  eligibility?: TrialEligibility;
  interventions?: TrialIntervention[];
  leadSponsor?: string;
  sourceUrl?: string;
  lastUpdatedDate?: string;
}

export interface PatientProfile {
  freeText: string;
  condition?: string;
  biomarker?: string;
  priorTherapy?: string;
  state?: string;
  phase?: string;
}

export interface ClinicalScenario {
  id: string;
  title: string;
  badge: string;
  prompt: string;
  extracted: {
    condition: string;
    biomarker: string;
    priorTherapy: string;
    state: string;
    phase?: string;
  };
}

export interface StructuredMatch {
  trial: ClinicalTrial;
  matchScore: number;
  matchRationale: string;
  matchedBiomarkers: string[];
  priorTherapyCompatibility: string;
  locationMatch?: string;
}

export interface NaiveKeywordMatch {
  trial: ClinicalTrial;
  matchedKeywords: string[];
  isSafetyViolation: boolean;
  violationType?: 'CHEMO_EXCLUSION' | 'LEXICAL_COLLISION' | 'POLARITY_INVERSION' | 'DISEASE_MISMATCH';
  violationMessage?: string;
  violationRule?: string;
}

export interface DuelResult {
  patientProfile: PatientProfile;
  structured: {
    trials: StructuredMatch[];
    count: number;
    groqQuery: string;
    groqParams: Record<string, any>;
    summary: string;
    executionTimeMs: number;
    dataSource: 'sanity-live' | 'local-normalized';
  };
  naive: {
    trials: NaiveKeywordMatch[];
    count: number;
    safetyViolationsCount: number;
    executionTimeMs: number;
    keywordTerms: string[];
  };
  scoreboard: {
    totalCorpus: number;
    structuredMatchCount: number;
    naiveMatchCount: number;
    safetyViolationsCount: number;
    structuredSafetyAccuracy: number; // 100%
    naiveSafetyAccuracy: number; // e.g. 35% or 40%
  };
}

export interface ScoreboardStats {
  totalTrials: number;
  recruitingTrials: number;
  biomarkerCount: number;
  totalLocations: number;
  dataSource: 'sanity-live' | 'local-normalized';
}
