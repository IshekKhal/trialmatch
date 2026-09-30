/**
 * 10 Gold-Standard Benchmark Test Profiles for Precision Oncology Trial Matching.
 * Each case is clinically designed where flat keyword search fails due to exclusion criteria,
 * polarity inversions, or lexical collisions, and bare LLMs hallucinate non-existent NCT IDs.
 */

export interface BenchmarkTestCase {
  id: string; // TC-01 ... TC-10
  name: string;
  badge: string;
  condition: string;
  biomarker: string;
  priorTherapy: string;
  location: string;
  phase?: string;
  stage?: string;
  age?: number;
  patientNarrative: string;
  filters: {
    condition: string;
    biomarker: string;
    priorTherapy: string;
    state: string;
    phase?: string;
  };
  groundTruth: {
    description: string;
    expectedOutcome: string;
    whyKeywordFails: string;
    whyBareLlmFails: string;
    protocolRuleCited: string;
    primaryExclusionClause: string;
  };
}

export const BENCHMARK_TEST_CASES: BenchmarkTestCase[] = [
  {
    id: 'TC-01',
    name: 'Non-Small Cell Lung Cancer (EGFR Exon 20) | Prior Platinum Chemo | Texas',
    badge: 'Lung • EGFR Exon 20 • Prior Chemo',
    condition: 'Lung',
    biomarker: 'EGFR',
    priorTherapy: 'Platinum Chemotherapy',
    location: 'Texas',
    stage: 'Stage IV Metastatic',
    age: 58,
    patientNarrative:
      '58-year-old female with metastatic Non-Small Cell Lung Cancer (NSCLC) harboring an EGFR Exon 20 insertion mutation. Disease progression after 4 cycles of carboplatin/pemetrexed platinum doublet chemotherapy. Eastern Cooperative Oncology Group (ECOG) performance status 1. Seeking active recruiting Phase 2 targeted clinical trials with facility sites located in Texas.',
    filters: {
      condition: 'Lung',
      biomarker: 'EGFR',
      priorTherapy: 'Chemotherapy Allowed',
      state: 'Texas',
    },
    groundTruth: {
      description: 'Only trials permitting prior chemotherapy with active sites in Texas qualify.',
      expectedOutcome:
        'Structured agent matches recruiting EGFR protocols allowing prior chemo in TX. Discards trials with Rule 14 chemo exclusion.',
      whyKeywordFails:
        'Keyword search matches trials containing "chemotherapy" inside negative exclusion criteria ("Patients with prior systemic chemotherapy are excluded"), serving disqualified trials.',
      whyBareLlmFails:
        'Bare LLM hallucinates retired or fabricated NCT IDs (e.g. NCT04077037/NCT04619028) not in the validated dataset, with zero safety audit trail.',
      protocolRuleCited: 'RULE-EXCLUSION-OVERRIDE (Absolute Exclusion Criteria Precedence)',
      primaryExclusionClause: 'Protocol Exclusion Criterion #14: Prior systemic chemotherapy within 6 months.',
    },
  },
  {
    id: 'TC-02',
    name: 'Colorectal Cancer (KRAS G12C) | Active Liver Metastases | California',
    badge: 'Colorectal • KRAS G12C • Liver Mets',
    condition: 'Colorectal',
    biomarker: 'KRAS',
    priorTherapy: 'Prior FOLFOX Allowed',
    location: 'California',
    stage: 'Stage IV Metastatic Adenocarcinoma',
    age: 62,
    patientNarrative:
      '62-year-old male with Stage IV colorectal adenocarcinoma with confirmed KRAS G12C mutation. Imaging demonstrates stable bilobar liver metastases without central nervous system involvement. Completed frontline FOLFOX chemotherapy 6 months ago. Seeking recruiting clinical trials in California evaluating targeted KRAS G12C inhibitors alone or in combination.',
    filters: {
      condition: 'Colorectal',
      biomarker: 'KRAS',
      priorTherapy: 'Chemotherapy Allowed',
      state: 'California',
    },
    groundTruth: {
      description: 'Must permit liver metastases; must strictly exclude CNS/brain metastases.',
      expectedOutcome:
        'Structured agent validates organ site criteria, matching KRAS G12C protocols active at California centers.',
      whyKeywordFails:
        'Keyword search confuses anatomical metastatic sites: matches trials mentioning "metastases" where liver involvement is excluded or brain involvement is required.',
      whyBareLlmFails:
        'Bare LLM fabricates phase numbers and invents California trial locations without checking institutional IRB recruitment status.',
      protocolRuleCited: 'RULE-BIOMARKER-SPECIFICITY & Organ Site Metastatic Protocol Hierarchy',
      primaryExclusionClause: 'Protocol Exclusion #22: Inadequate hepatic function or extensive liver metastasis exceeding 50% liver volume.',
    },
  },
  {
    id: 'TC-03',
    name: 'Breast Cancer (HER2-Low) | Prior Trastuzumab | Florida',
    badge: 'Breast • HER2-Low • Trastuzumab',
    condition: 'Breast',
    biomarker: 'HER2',
    priorTherapy: 'Prior Anti-HER2 Targeted Therapy',
    location: 'Florida',
    stage: 'Metastatic Invasive Ductal Carcinoma',
    age: 51,
    patientNarrative:
      '51-year-old female diagnosed with metastatic HER2-low (IHC 1+ or IHC 2+/FISH negative) invasive ductal carcinoma of the breast. Prior exposure to trastuzumab in early-stage setting. Seeking active recruiting clinical trials in Florida evaluating next-generation antibody-drug conjugates (ADCs) specifically indicated for HER2-low cohorts.',
    filters: {
      condition: 'Breast',
      biomarker: 'HER2',
      priorTherapy: 'Targeted Therapy Allowed',
      state: 'Florida',
    },
    groundTruth: {
      description: 'Matches HER2-low specific protocols; excludes classic HER2-positive (IHC 3+ overexpression) protocols.',
      expectedOutcome:
        'Structured agent identifies HER2-low ADC trials in Florida, verifying IHC 1+/2+ inclusion thresholds.',
      whyKeywordFails:
        'Keyword search matches "HER2" regardless of quantitative expression, returning trials requiring classical HER2-positive amplification (IHC 3+) where patient will be turned away.',
      whyBareLlmFails:
        'Bare LLM fails to verify IHC assay thresholds and invents defunct trial identifiers without protocol verification.',
      protocolRuleCited: 'RULE-BIOMARKER-SPECIFICITY (Quantitative Biomarker Expression Cutoffs)',
      primaryExclusionClause: 'Protocol Inclusion Criterion #3: Documented HER2 overexpression by IHC 3+ or ISH amplification ratio >= 2.0.',
    },
  },
  {
    id: 'TC-04',
    name: 'Cutaneous Melanoma (BRAF V600E) | Phase 3 Only | New York',
    badge: 'Melanoma • BRAF V600E • Phase 3',
    condition: 'Melanoma',
    biomarker: 'BRAF',
    priorTherapy: 'Any',
    location: 'New York',
    phase: 'PHASE3',
    stage: 'Unresectable Stage IIIC Melanoma',
    age: 47,
    patientNarrative:
      '47-year-old patient with unresectable Stage IIIC cutaneous melanoma harboring a verified BRAF V600E activating mutation. Patient and oncologist are seeking enrollment exclusively in Phase 3 confirmatory randomized trials with active study locations in New York state.',
    filters: {
      condition: 'Melanoma',
      biomarker: 'BRAF',
      priorTherapy: 'Any',
      state: 'New York',
      phase: 'PHASE3',
    },
    groundTruth: {
      description: 'Phase 3 filter strictly enforced; rejects Phase 1 first-in-human dose escalation and Phase 2 exploratory cohorts.',
      expectedOutcome:
        'Structured agent strictly queries phase == "PHASE3", returning confirmed Phase 3 trials in New York.',
      whyKeywordFails:
        'Keyword search matches "Phase 3" anywhere in the document text—including background paragraphs discussing "previous Phase 3 data" in Phase 1 study descriptions.',
      whyBareLlmFails:
        'Bare LLM generates plausible-sounding study names with fake NCT IDs and misclassifies early Phase 1 trials as Phase 3.',
      protocolRuleCited: 'RULE-PHASE-APPROPRIATENESS (Phase Rigor and Line-of-Therapy Safety)',
      primaryExclusionClause: 'Trial Phase Mismatch: Protocol is Phase 1 Dose-Escalation, not Phase 3 Confirmatory.',
    },
  },
  {
    id: 'TC-05',
    name: 'High-Grade Serous Ovarian Cancer (BRCA1) | Platinum-Sensitive Recurrence | Ohio',
    badge: 'Ovarian • BRCA1 • Platinum-Sensitive',
    condition: 'Ovarian',
    biomarker: 'BRCA',
    priorTherapy: 'Chemotherapy Allowed (Sensitive)',
    location: 'Ohio',
    stage: 'Recurrent Stage IIIC Epithelial Ovarian',
    age: 64,
    patientNarrative:
      '64-year-old patient with high-grade serous ovarian carcinoma harboring a germline BRCA1 mutation. Patient completed primary carboplatin/paclitaxel chemotherapy with disease-free interval of 9 months, defining platinum-sensitive recurrence. Seeking recruiting clinical trials in Ohio evaluating PARP inhibitor combinations or novel maintenance therapies.',
    filters: {
      condition: 'Ovarian',
      biomarker: 'BRCA',
      priorTherapy: 'Chemotherapy Allowed',
      state: 'Ohio',
    },
    groundTruth: {
      description: 'Requires platinum sensitivity (>6 months relapse-free interval); disqualifies platinum-resistant protocols.',
      expectedOutcome:
        'Structured agent parses 9-month platinum-free interval and matches Ohio trial sites accepting platinum-sensitive relapse.',
      whyKeywordFails:
        'Keyword search matches "platinum" across all trials, returning platinum-refractory trials where patient is excluded.',
      whyBareLlmFails:
        'Bare LLM hallucinates outdated trial identifiers closed to recruitment years prior.',
      protocolRuleCited: 'RULE-WASHOUT-WINDOWS & Recurrence Sensitivity Hierarchy',
      primaryExclusionClause: 'Protocol Exclusion #18: Platinum-refractory disease or progression within 6 months of platinum completion.',
    },
  },
  {
    id: 'TC-06',
    name: 'Metastatic Castration-Resistant Prostate Cancer (mCRPC) | Prior Enzalutamide | Pennsylvania',
    badge: 'Prostate • mCRPC • Prior Enzalutamide',
    condition: 'Prostate',
    biomarker: 'BRCA',
    priorTherapy: 'Prior Enzalutamide Permitted',
    location: 'Pennsylvania',
    stage: 'Stage IV mCRPC',
    age: 71,
    patientNarrative:
      '71-year-old male with metastatic castration-resistant prostate cancer (mCRPC) and somatic DNA damage repair deficiency (BRCA2 alteration). Previously treated with enzalutamide. Seeking recruiting PARP inhibitor or combination targeted therapy clinical trials with open sites in Pennsylvania.',
    filters: {
      condition: 'Prostate',
      biomarker: 'BRCA',
      priorTherapy: 'Targeted Therapy Allowed',
      state: 'Pennsylvania',
    },
    groundTruth: {
      description: 'Distinguishes between allowed second-generation anti-androgens vs prohibited prior hormonal agents.',
      expectedOutcome:
        'Structured agent checks priorTherapyRules and matches mCRPC trials in Pennsylvania that explicitly allow prior AR-targeted therapy.',
      whyKeywordFails:
        'Keyword search matches "enzalutamide" inside exclusion lists ("Prior treatment with enzalutamide or abiraterone is strictly prohibited"), recommending trials that exclude the patient.',
      whyBareLlmFails:
        'Bare LLM invents trial acronyms and assigns fictional hospital trial sites in Philadelphia and Pittsburgh.',
      protocolRuleCited: 'RULE-EXCLUSION-OVERRIDE (Targeted Therapy Prior Exposure Rules)',
      primaryExclusionClause: 'Protocol Exclusion #8: Prior therapy with second-generation anti-androgens (enzalutamide, apalutamide, or darolutamide).',
    },
  },
  {
    id: 'TC-07',
    name: 'Pancreatic Ductal Adenocarcinoma (KRAS Wild-Type) | Chemo-Naive | Massachusetts',
    badge: 'Pancreas • KRAS-WT • Chemo-Naive',
    condition: 'Pancreatic',
    biomarker: 'KRAS',
    priorTherapy: 'Chemo Naive (No Prior Systemic Therapy)',
    location: 'Massachusetts',
    stage: 'Borderline Resectable Pancreatic Adenocarcinoma',
    age: 66,
    patientNarrative:
      '66-year-old patient with borderline resectable pancreatic ductal adenocarcinoma, documented KRAS wild-type by comprehensive genomic profiling. Patient is chemotherapy-naive with no prior systemic anti-cancer therapy. Looking for frontline clinical trials with recruiting sites in Massachusetts.',
    filters: {
      condition: 'Pancreatic',
      biomarker: 'KRAS',
      priorTherapy: 'Chemo Naive',
      state: 'Massachusetts',
    },
    groundTruth: {
      description: 'Requires genomic wild-type confirmation; strict frontline chemotherapy-naive cohort.',
      expectedOutcome:
        'Structured agent respects wild-type polarity and chemo-naive requirements, matching frontline Massachusetts trials.',
      whyKeywordFails:
        'Keyword search triggers polarity inversion: matches "KRAS" in trial titles that require activating KRAS mutations (G12D/G12V), which wild-type patients cannot join.',
      whyBareLlmFails:
        'Bare LLM recommends mutant-specific inhibitors (e.g. sotorasib/adagrasib) for a wild-type patient, representing a severe therapeutic error.',
      protocolRuleCited: 'RULE-BIOMARKER-SPECIFICITY (Biomarker Allelic Polarity: Mutant vs Wild-Type)',
      primaryExclusionClause: 'Protocol Inclusion #2: Documented KRAS G12 activating mutation required; KRAS wild-type tumors ineligible.',
    },
  },
  {
    id: 'TC-08',
    name: 'Glioblastoma Multiforme (MGMT Methylated) | Newly Diagnosed | North Carolina',
    badge: 'GBM • MGMT Methylated • Newly Diagnosed',
    condition: 'Glioblastoma',
    biomarker: 'EGFR',
    priorTherapy: 'Newly Diagnosed (No Prior Systemic Chemo)',
    location: 'North Carolina',
    stage: 'Newly Diagnosed Supratentorial GBM',
    age: 55,
    patientNarrative:
      '55-year-old male with newly diagnosed supratentorial glioblastoma multiforme (IDH-wildtype, MGMT promoter methylated, EGFR amplified) status-post gross total surgical resection. Patient has not yet initiated adjuvant temozolomide or radiotherapy. Seeking active recruiting clinical trials in North Carolina evaluating novel radiosensitizers or frontline targeted therapy.',
    filters: {
      condition: 'Glioblastoma',
      biomarker: 'EGFR',
      priorTherapy: 'Any',
      state: 'North Carolina',
    },
    groundTruth: {
      description: 'Newly diagnosed cohort only; strictly excludes recurrent glioblastoma protocols.',
      expectedOutcome:
        'Structured agent matches newly diagnosed glioblastoma protocols in North Carolina, discarding salvage/recurrent protocols.',
      whyKeywordFails:
        'Keyword search matches "glioblastoma" across recurrent cohorts that mandate failure of prior radiotherapy and temozolomide.',
      whyBareLlmFails:
        'Bare LLM invents non-existent Duke / UNC trials with hallucinated NCT IDs.',
      protocolRuleCited: 'RULE-EXCLUSION-OVERRIDE & Disease Chronology Staging',
      primaryExclusionClause: 'Protocol Inclusion #1: Histologically confirmed recurrent or progressive glioblastoma following standard chemoradiation.',
    },
  },
  {
    id: 'TC-09',
    name: 'Acute Myeloid Leukemia (AML) (FLT3-ITD) | Relapsed/Refractory Adult | Illinois',
    badge: 'AML • FLT3-ITD • Adult R/R',
    condition: 'Leukemia',
    biomarker: 'EGFR',
    priorTherapy: 'Relapsed/Refractory Post 7+3 Induction',
    location: 'Illinois',
    stage: 'Relapsed/Refractory AML',
    age: 55,
    patientNarrative:
      '55-year-old adult patient with Acute Myeloid Leukemia (AML) harboring a FLT3-ITD internal tandem duplication mutation. Disease relapsed 4 months following induction 7+3 cytarabine/daunorubicin chemotherapy. Seeking active recruiting clinical trials in Illinois evaluating targeted FLT3 inhibitors or novel cell therapy for adult relapsed/refractory leukemia.',
    filters: {
      condition: 'Leukemia',
      biomarker: 'EGFR',
      priorTherapy: 'Chemotherapy Allowed',
      state: 'Illinois',
    },
    groundTruth: {
      description: 'Matches adult R/R AML protocols; filters out pediatric cohorts and frontline-only trials.',
      expectedOutcome:
        'Structured agent checks age threshold (adult >= 18) and relapsed/refractory status, selecting valid trials in Illinois.',
      whyKeywordFails:
        'Keyword search matches pediatric AML studies (age < 18) or frontline elderly unfit trials because all keywords appear in the document body.',
      whyBareLlmFails:
        'Bare LLM fabricates NCT identifiers with fabricated Northwestern / UChicago trial arms.',
      protocolRuleCited: 'RULE-EXCLUSION-OVERRIDE (Demographic Age Brackets and Salvage Staging)',
      primaryExclusionClause: 'Protocol Eligibility: Age >= 6 months and <= 21 years at time of enrollment (Pediatric only cohort).',
    },
  },
  {
    id: 'TC-10',
    name: 'Advanced Urothelial Carcinoma (Bladder Cancer) | Prior Immunotherapy | Washington',
    badge: 'Bladder • FGFR3 • Prior Immunotherapy',
    condition: 'Cancer',
    biomarker: 'FGFR',
    priorTherapy: 'Prior Anti-PD-1/L1 Immunotherapy Required',
    location: 'Washington',
    stage: 'Locally Advanced / Metastatic Urothelial Carcinoma',
    age: 68,
    patientNarrative:
      '68-year-old patient with locally advanced urothelial bladder carcinoma harboring an FGFR3 activating mutation. Disease progressed on maintenance pembrolizumab immune checkpoint inhibitor. Patient is seeking active recruiting targeted FGFR or combination trials with clinical sites located in Washington state.',
    filters: {
      condition: 'Cancer',
      biomarker: 'FGFR',
      priorTherapy: 'Targeted Therapy Allowed',
      state: 'Washington',
    },
    groundTruth: {
      description: 'Requires prior immune checkpoint inhibitor failure; distinguishes prior immunotherapy requirement vs exclusion.',
      expectedOutcome:
        'Structured agent resolves FGFR-targeted protocols in Washington that permit or mandate prior checkpoint inhibitor exposure.',
      whyKeywordFails:
        'Keyword search fails to distinguish between required prior immunotherapy vs contraindicated prior immunotherapy, matching trials that strictly bar prior checkpoint inhibitors.',
      whyBareLlmFails:
        'Bare LLM hallucinates trial titles and invents Fred Hutchinson trial identifiers with zero clinical governance.',
      protocolRuleCited: 'RULE-EXCLUSION-OVERRIDE & Prior Immunotherapy Exposure Stratification',
      primaryExclusionClause: 'Protocol Exclusion #5: Prior receipt of immune checkpoint inhibitor therapy (anti-PD-1, anti-PD-L1, or anti-CTLA-4).',
    },
  },
];
