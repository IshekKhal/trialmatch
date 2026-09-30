import { ClinicalScenario } from './types';

export const CLINICAL_SCENARIOS: ClinicalScenario[] = [
  {
    id: 'lung-egfr-exon20-tx',
    title: 'Lung Cancer (EGFR Exon 20) | Prior Platinum Chemo | Texas',
    badge: 'Lung • EGFR Exon 20',
    prompt:
      'I am a 58yo patient with metastatic Non-Small Cell Lung Cancer harboring an EGFR Exon 20 insertion mutation. I previously progressed after 4 cycles of carboplatin/pemetrexed platinum chemotherapy. Looking for recruiting Phase 2 trials with trial sites in Texas.',
    extracted: {
      condition: 'Lung',
      biomarker: 'EGFR',
      priorTherapy: 'Platinum Chemotherapy',
      state: 'Texas',
    },
  },
  {
    id: 'crc-kras-g12c-ca',
    title: 'Colorectal Cancer (KRAS G12C) | Liver Metastases | California',
    badge: 'CRC • KRAS G12C',
    prompt:
      '62-year-old male with Stage IV metastatic colorectal adenocarcinoma with confirmed KRAS G12C mutation and stable liver metastases. Prior FOLFOX chemotherapy completed 6 months ago. Seeking recruiting clinical trials in California evaluating targeted KRAS inhibition or combination therapy.',
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
      '51yo female diagnosed with metastatic HER2-low (IHC 1+/2+, FISH negative) invasive ductal breast carcinoma. Patient received prior anti-HER2 trastuzumab-based targeted regimens. Seeking active recruiting protocols at academic medical centers in Florida.',
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
      '47yo patient with unresectable Stage IIIC cutaneous melanoma harboring a confirmed BRAF V600E mutation. Looking strictly for recruiting Phase 3 confirmatory trials located in New York state.',
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
      '64yo patient with high-grade serous ovarian carcinoma with germline BRCA1 mutation, presenting with first platinum-sensitive recurrence >6 months after primary carboplatin/paclitaxel chemotherapy. Looking for recruiting trials in Ohio.',
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
      '71yo male with metastatic castration-resistant prostate cancer (mCRPC) and DNA damage repair deficiency (BRCA2 alteration). Previously treated with enzalutamide. Seeking recruiting PARP inhibitor or combination trials in Pennsylvania.',
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
      '66yo patient with borderline resectable pancreatic ductal adenocarcinoma, documented KRAS wild-type. Patient is chemotherapy-naive with no prior systemic anti-cancer treatment. Searching for frontline clinical trials in Massachusetts.',
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
      '55yo male with newly diagnosed supratentorial glioblastoma multiforme (IDH-wildtype, MGMT promoter methylated) following maximal safe surgical resection. Seeking recruiting clinical trials in North Carolina evaluating novel radiosensitizers or targeted agents.',
    extracted: {
      condition: 'Glioblastoma',
      biomarker: 'EGFR',
      priorTherapy: 'Any',
      state: 'North Carolina',
    },
  },
];
