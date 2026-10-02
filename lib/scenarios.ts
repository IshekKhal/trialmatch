import { ClinicalScenario } from './types';

export const CLINICAL_SCENARIOS: ClinicalScenario[] = [
  {
    id: 'lung-egfr-exon20-tx',
    title: 'Lung Cancer (EGFR Exon 20) | Prior Platinum Chemo | Texas',
    badge: 'Lung • EGFR Exon 20',
    prompt:
      '58-year-old female with metastatic Non-Small Cell Lung Cancer (NSCLC) harboring an EGFR Exon 20 insertion mutation. Disease progression after 4 cycles of carboplatin/pemetrexed platinum doublet chemotherapy. Eastern Cooperative Oncology Group (ECOG) performance status 1. Seeking active recruiting Phase 2 targeted clinical trials with facility sites located in Texas.',
    extracted: {
      condition: 'Lung',
      biomarker: 'EGFR',
      priorTherapy: 'Chemotherapy Allowed',
      state: 'Texas',
    },
  },
  {
    id: 'crc-kras-g12c-ca',
    title: 'Colorectal Cancer (KRAS G12C) | Liver Metastases | California',
    badge: 'CRC • KRAS G12C',
    prompt:
      '62-year-old male with Stage IV colorectal adenocarcinoma with confirmed KRAS G12C mutation. Imaging demonstrates stable bilobar liver metastases without central nervous system involvement. Completed frontline FOLFOX chemotherapy 6 months ago. Seeking recruiting clinical trials in California evaluating targeted KRAS G12C inhibitors alone or in combination.',
    extracted: {
      condition: 'Colorectal',
      biomarker: 'KRAS',
      priorTherapy: 'Chemotherapy Allowed',
      state: 'California',
    },
  },
  {
    id: 'breast-her2-low-fl',
    title: 'Breast Cancer (HER2-Low) | Prior Trastuzumab | Florida',
    badge: 'Breast • HER2-Low',
    prompt:
      '51-year-old female diagnosed with metastatic HER2-low (IHC 1+ or IHC 2+/FISH negative) invasive ductal carcinoma of the breast. Prior exposure to trastuzumab in early-stage setting. Seeking active recruiting clinical trials in Florida evaluating next-generation antibody-drug conjugates (ADCs) specifically indicated for HER2-low cohorts.',
    extracted: {
      condition: 'Breast',
      biomarker: 'HER2',
      priorTherapy: 'Targeted Therapy Allowed',
      state: 'Florida',
    },
  },
  {
    id: 'melanoma-braf-v600e-ny',
    title: 'Melanoma (BRAF V600E) | Phase 3 Only | New York',
    badge: 'Melanoma • BRAF V600E',
    prompt:
      '47-year-old patient with unresectable Stage IIIC cutaneous melanoma harboring a verified BRAF V600E activating mutation. Patient and oncologist are seeking enrollment exclusively in Phase 3 confirmatory randomized trials with active study locations in New York state.',
    extracted: {
      condition: 'Melanoma',
      biomarker: 'BRAF',
      priorTherapy: 'Any',
      state: 'New York',
      phase: 'PHASE3',
    },
  },
  {
    id: 'ovarian-brca1-oh',
    title: 'Ovarian Cancer (BRCA1) | Platinum-Sensitive Recurrence | Ohio',
    badge: 'Ovarian • BRCA1',
    prompt:
      '64-year-old patient with high-grade serous ovarian carcinoma harboring a germline BRCA1 mutation. Patient completed primary carboplatin/paclitaxel chemotherapy with disease-free interval of 9 months, defining platinum-sensitive recurrence. Seeking recruiting clinical trials in Ohio evaluating PARP inhibitor combinations or novel maintenance therapies.',
    extracted: {
      condition: 'Ovarian',
      biomarker: 'BRCA',
      priorTherapy: 'Chemotherapy Allowed',
      state: 'Ohio',
    },
  },
  {
    id: 'prostate-mcrpc-pa',
    title: 'Prostate Cancer (mCRPC) | Prior Enzalutamide Allowed | Pennsylvania',
    badge: 'Prostate • mCRPC',
    prompt:
      '71-year-old male with metastatic castration-resistant prostate cancer (mCRPC) and somatic DNA damage repair deficiency (BRCA2 alteration). Previously treated with enzalutamide. Seeking recruiting PARP inhibitor or combination targeted therapy clinical trials with open sites in Pennsylvania.',
    extracted: {
      condition: 'Prostate',
      biomarker: 'BRCA',
      priorTherapy: 'Targeted Therapy Allowed',
      state: 'Pennsylvania',
    },
  },
  {
    id: 'pancreatic-kras-wt-ma',
    title: 'Pancreatic Cancer (KRAS Wild-Type) | Chemo Naive | Massachusetts',
    badge: 'Pancreas • KRAS-WT',
    prompt:
      '66-year-old patient with borderline resectable pancreatic ductal adenocarcinoma, documented KRAS wild-type by comprehensive genomic profiling. Patient is chemotherapy-naive with no prior systemic anti-cancer therapy. Looking for frontline clinical trials with recruiting sites in Massachusetts.',
    extracted: {
      condition: 'Pancreatic',
      biomarker: 'KRAS',
      priorTherapy: 'Chemo Naive',
      state: 'Massachusetts',
    },
  },
  {
    id: 'gbm-mgmt-nc',
    title: 'Glioblastoma (MGMT Methylated) | Newly Diagnosed | North Carolina',
    badge: 'GBM • MGMT Methylated',
    prompt:
      '55-year-old male with newly diagnosed supratentorial glioblastoma multiforme (IDH-wildtype, MGMT promoter methylated, EGFR amplified) status-post gross total surgical resection. Patient has not yet initiated adjuvant temozolomide or radiotherapy. Seeking active recruiting clinical trials in North Carolina evaluating novel radiosensitizers or frontline targeted therapy.',
    extracted: {
      condition: 'Glioblastoma',
      biomarker: 'EGFR',
      priorTherapy: 'Any',
      state: 'North Carolina',
    },
  },
];
