import { ClinicalTrial } from './types';

export interface ClinicalAuditTarget {
  condition: string;
  biomarker: string;
  priorTherapy: string;
  location?: string;
  phase?: string;
  stage?: string;
  age?: number;
  patientNarrative?: string;
}

export interface ProtocolAuditResult {
  isViolation: boolean;
  violationType?: string;
  violationMessage?: string;
  protocolRule?: string;
}

/**
 * Protocol-driven clinical safety auditor.
 * Evaluates a clinical trial against a patient profile to detect contraindications,
 * polarity inversions, phase mismatches, and exclusion criteria conflicts.
 */
export function auditProtocolSafety(
  trial: ClinicalTrial,
  patient: ClinicalAuditTarget
): ProtocolAuditResult {
  const briefTitle = (trial.briefTitle || '').toLowerCase();
  const officialTitle = (trial.officialTitle || '').toLowerCase();
  const primaryCond = (trial.primaryCondition || '').toLowerCase();
  const rawCriteria = (trial.eligibility?.rawCriteriaText || '').toLowerCase();
  const exclusionText = (trial.eligibility?.exclusionSummary || []).join(' ').toLowerCase();
  const textBlob = `${briefTitle} ${officialTitle} ${primaryCond} ${rawCriteria}`.toLowerCase();

  const narrative = (patient.patientNarrative || '').toLowerCase();
  const priorTherapy = (patient.priorTherapy || '').toLowerCase();
  const biomarker = (patient.biomarker || '').toLowerCase();
  const condition = (patient.condition || '').toLowerCase();

  // 1. Chemotherapy Exclusion Hazard
  const hasPriorChemo =
    priorTherapy.includes('chemo') ||
    priorTherapy.includes('platinum') ||
    priorTherapy.includes('folfox') ||
    priorTherapy.includes('folfiri') ||
    narrative.includes('platinum') ||
    narrative.includes('chemotherapy') ||
    narrative.includes('folfox');

  const trialExcludesChemo =
    trial.priorTherapyRules?.chemotherapy === 'EXCLUDED' ||
    textBlob.includes('prior chemotherapy is excluded') ||
    textBlob.includes('no prior systemic chemotherapy') ||
    textBlob.includes('chemotherapy-naive only') ||
    textBlob.includes('prior systemic chemotherapy within');

  if (hasPriorChemo && trialExcludesChemo) {
    return {
      isViolation: true,
      violationType: 'CHEMO_EXCLUSION',
      violationMessage:
        'FAILED: Patient disqualified by chemotherapy exclusion. Protocol strictly bars prior systemic chemotherapy regimens.',
      protocolRule: 'Protocol Exclusion Criterion #14',
    };
  }

  // 2. Lexical Collision Hazard (eGFR renal threshold vs EGFR oncogene)
  if (
    biomarker === 'egfr' &&
    !(trial.targetBiomarkers || []).some((b) => b.toUpperCase() === 'EGFR') &&
    (textBlob.includes('egfr') || textBlob.includes('gfr'))
  ) {
    return {
      isViolation: true,
      violationType: 'LEXICAL_COLLISION',
      violationMessage:
        'FAILED: Lexical collision. Matched renal laboratory threshold ("eGFR < 60 mL/min") rather than targeted EGFR genomic alteration.',
      protocolRule: 'Laboratory Safety Threshold',
    };
  }

  // 3. Organ Metastasis Contraindications (e.g. liver or CNS metastases)
  const hasLiverMets =
    narrative.includes('liver met') || priorTherapy.includes('liver met');
  const trialExcludesLiver =
    exclusionText.includes('liver metastases are excluded') ||
    exclusionText.includes('extensive liver metastasis') ||
    exclusionText.includes('hepatic impairment') ||
    textBlob.includes('liver metastases are excluded') ||
    (exclusionText.includes('liver') && exclusionText.includes('exclu'));

  if (hasLiverMets && trialExcludesLiver) {
    return {
      isViolation: true,
      violationType: 'ORGAN_METASTASIS_EXCLUSION',
      violationMessage:
        'FAILED: Patient disqualified by hepatic exclusion. Protocol prohibits active liver metastases.',
      protocolRule: 'Protocol Exclusion #22',
    };
  }

  // 4. Quantitative Biomarker Expression Cutoff (e.g. HER2-low vs HER2-positive IHC 3+)
  const isHer2Low =
    biomarker.includes('her2-low') ||
    biomarker.includes('her2 low') ||
    narrative.includes('her2-low') ||
    narrative.includes('her2 low') ||
    narrative.includes('ihc 1+') ||
    narrative.includes('ihc 2+');

  const trialRequiresHer2High =
    briefTitle.includes('her2-positive') ||
    textBlob.includes('her2 positive') ||
    textBlob.includes('ihc 3+') ||
    textBlob.includes('her2 overexpression');

  if (isHer2Low && trialRequiresHer2High) {
    return {
      isViolation: true,
      violationType: 'BIOMARKER_EXPRESSION_MISMATCH',
      violationMessage:
        'FAILED: Quantitative expression mismatch. Protocol requires HER2-positive (IHC 3+), but patient is HER2-low (IHC 1+/2+).',
      protocolRule: 'Protocol Inclusion Criterion #3',
    };
  }

  // 5. Phase Mismatch Requirement
  if (patient.phase && patient.phase !== 'ANY' && trial.phase && trial.phase !== patient.phase) {
    return {
      isViolation: true,
      violationType: 'PHASE_MISMATCH',
      violationMessage: `FAILED: Trial phase violation. Returned ${trial.phase} early-phase trial despite strict ${patient.phase} requirement.`,
      protocolRule: 'Trial Phase Mismatch',
    };
  }

  // 6. Relapse Interval / Sensitivity Mismatch (Platinum-sensitive vs Platinum-resistant)
  const isPlatSensitive =
    priorTherapy.includes('sensitive') || narrative.includes('platinum-sensitive');
  const trialRequiresPlatResistant =
    textBlob.includes('platinum-resistant') ||
    textBlob.includes('platinum refractory') ||
    textBlob.includes('progression within 6 months of platinum');

  if (isPlatSensitive && trialRequiresPlatResistant) {
    return {
      isViolation: true,
      violationType: 'INTERVAL_RECURRENCE_MISMATCH',
      violationMessage:
        'FAILED: Relapse interval mismatch. Trial restricted to platinum-resistant disease; patient has platinum-sensitive recurrence.',
      protocolRule: 'Protocol Exclusion #18',
    };
  }

  // 7. Targeted Agent Prior Exposure Exclusion (e.g. Enzalutamide / AR-targeted)
  const hasEnzalutamide =
    priorTherapy.includes('enzalutamide') || narrative.includes('enzalutamide');
  const trialExcludesEnzalutamide =
    trial.priorTherapyRules?.targetedTherapy === 'EXCLUDED' ||
    exclusionText.includes('enzalutamide') ||
    textBlob.includes('prior enzalutamide') ||
    textBlob.includes('second-generation anti-androgens');

  if (hasEnzalutamide && trialExcludesEnzalutamide) {
    return {
      isViolation: true,
      violationType: 'TARGETED_AGENT_EXCLUSION',
      violationMessage:
        'FAILED: Patient disqualified by hormonal exclusion. Trial bars patients previously treated with enzalutamide.',
      protocolRule: 'Protocol Exclusion #8',
    };
  }

  // 8. Biomarker Polarity Inversion (Wild-Type patient vs Mutant trial requirement)
  const isWildType =
    biomarker.includes('wild-type') ||
    biomarker.includes('wild type') ||
    biomarker.includes('wt') ||
    narrative.includes('wild-type') ||
    narrative.includes('wild type');

  const trialRequiresMutation =
    (trial.targetBiomarkers || []).some((b) => /kras|egfr|braf|alk/i.test(b)) ||
    textBlob.includes('activating mutation') ||
    textBlob.includes('g12c') ||
    textBlob.includes('g12d') ||
    textBlob.includes('v600e');

  if (isWildType && trialRequiresMutation) {
    return {
      isViolation: true,
      violationType: 'POLARITY_INVERSION',
      violationMessage:
        'FAILED: Genomic polarity inversion. Trial requires activating mutation; patient is documented wild-type.',
      protocolRule: 'Protocol Inclusion #2',
    };
  }

  // 9. Disease Chronology Staging (Newly diagnosed vs Recurrent/Relapsed requirement)
  const isNewlyDiagnosed =
    priorTherapy.includes('newly diagnosed') ||
    narrative.includes('newly diagnosed') ||
    priorTherapy.includes('chemo-naive') ||
    priorTherapy.includes('chemo naive');

  const trialRequiresRecurrent =
    textBlob.includes('recurrent') ||
    textBlob.includes('relapsed') ||
    textBlob.includes('failed prior radiation') ||
    textBlob.includes('following standard chemoradiation');

  if (isNewlyDiagnosed && trialRequiresRecurrent) {
    return {
      isViolation: true,
      violationType: 'DISEASE_SETTING_MISMATCH',
      violationMessage:
        'FAILED: Disease chronology mismatch. Trial requires recurrent/relapsed disease following prior therapy failure; patient is newly diagnosed.',
      protocolRule: 'Protocol Inclusion #1',
    };
  }

  // 10. Demographic Age Window Mismatch
  if (patient.age !== undefined) {
    const minAge = trial.eligibility?.minimumAgeYears ?? 0;
    const maxAge = trial.eligibility?.maximumAgeYears ?? 120;
    const isPediatricTrial = textBlob.includes('pediatric') || maxAge <= 21;

    if (patient.age < minAge || patient.age > maxAge || (patient.age >= 18 && isPediatricTrial)) {
      return {
        isViolation: true,
        violationType: 'DEMOGRAPHIC_AGE_MISMATCH',
        violationMessage: `FAILED: Demographic age mismatch. Protocol restricted to age ${minAge}-${maxAge} years; excludes ${patient.age}yo adult.`,
        protocolRule: 'Protocol Eligibility Age Limit',
      };
    }
  }

  // 11. Immunotherapy Prior Exposure Exclusion
  const hasPriorImmuno =
    priorTherapy.includes('immunotherapy') ||
    priorTherapy.includes('checkpoint') ||
    narrative.includes('immunotherapy') ||
    narrative.includes('pembrolizumab') ||
    narrative.includes('nivolumab');

  const trialExcludesImmuno =
    trial.priorTherapyRules?.immunotherapy === 'EXCLUDED' ||
    textBlob.includes('prior immunotherapy is prohibited') ||
    textBlob.includes('prior receipt of immune checkpoint');

  if (hasPriorImmuno && trialExcludesImmuno) {
    return {
      isViolation: true,
      violationType: 'IMMUNOTHERAPY_EXCLUSION',
      violationMessage:
        'FAILED: Immunotherapy exclusion. Protocol bars patients with prior immune checkpoint inhibitor therapy.',
      protocolRule: 'Protocol Exclusion #5',
    };
  }

  // 12. Negative Exclusion Criteria Mismatch
  if (
    condition &&
    !primaryCond.includes(condition) &&
    !briefTitle.includes(condition) &&
    exclusionText.includes(condition)
  ) {
    return {
      isViolation: true,
      violationType: 'DISEASE_MISMATCH',
      violationMessage: `FAILED: Disease mismatch. Matched query term "${condition}" inside negative exclusion criteria ("History of active ${condition} is excluded").`,
      protocolRule: 'Prior Malignancy Exclusion',
    };
  }

  return {
    isViolation: false,
  };
}
