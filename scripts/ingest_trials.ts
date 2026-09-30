import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// ==========================================
// 1. TYPED DATA INTERFACES & SCHEMAS
// ==========================================

export interface NormalizedClinicalTrial {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  phase: 'PHASE1' | 'PHASE2' | 'PHASE3' | 'PHASE4' | 'NA';
  recruitmentStatus: 'RECRUITING';
  primaryCondition: string;
  targetBiomarkers: string[];
  priorTherapyRules: {
    chemotherapy: 'REQUIRED' | 'ALLOWED' | 'EXCLUDED' | 'ANY';
    immunotherapy: 'REQUIRED' | 'ALLOWED' | 'EXCLUDED' | 'ANY';
    targetedTherapy: 'REQUIRED' | 'ALLOWED' | 'EXCLUDED' | 'ANY';
  };
  locations: Array<{
    facility: string;
    city: string;
    state: string;
    country: string;
  }>;
  eligibility: {
    minimumAgeYears: number;
    maximumAgeYears?: number;
    gender: 'ALL' | 'FEMALE' | 'MALE';
    inclusionSummary: string[];
    exclusionSummary: string[];
    rawCriteriaText: string;
  };
  interventions: Array<{
    type: string;
    name: string;
    description?: string;
  }>;
  leadSponsor: string;
  sourceUrl: string;
  lastUpdatedDate: string;
}

export const LocationSchema = z.object({
  facility: z.string().min(1),
  city: z.string(),
  state: z.string().min(1),
  country: z.string()
});

export const PriorTherapyRuleSchema = z.enum(['REQUIRED', 'ALLOWED', 'EXCLUDED', 'ANY']);

export const PriorTherapyRulesSchema = z.object({
  chemotherapy: PriorTherapyRuleSchema,
  immunotherapy: PriorTherapyRuleSchema,
  targetedTherapy: PriorTherapyRuleSchema
});

export const InterventionSchema = z.object({
  type: z.string(),
  name: z.string(),
  description: z.string().optional()
});

export const EligibilitySchema = z.object({
  minimumAgeYears: z.number().int().nonnegative(),
  maximumAgeYears: z.number().int().positive().optional(),
  gender: z.enum(['ALL', 'FEMALE', 'MALE']),
  inclusionSummary: z.array(z.string()),
  exclusionSummary: z.array(z.string()),
  rawCriteriaText: z.string()
});

export const NormalizedClinicalTrialSchema = z.object({
  nctId: z.string().regex(/^NCT\d{8}$/),
  briefTitle: z.string().min(1),
  officialTitle: z.string().optional(),
  phase: z.enum(['PHASE1', 'PHASE2', 'PHASE3', 'PHASE4', 'NA']),
  recruitmentStatus: z.literal('RECRUITING'),
  primaryCondition: z.string().min(1),
  targetBiomarkers: z.array(z.string()).min(1),
  priorTherapyRules: PriorTherapyRulesSchema,
  locations: z.array(LocationSchema),
  eligibility: EligibilitySchema,
  interventions: z.array(InterventionSchema),
  leadSponsor: z.string().min(1),
  sourceUrl: z.string().url(),
  lastUpdatedDate: z.string().min(1)
});

export const NormalizedDatasetSchema = z.array(NormalizedClinicalTrialSchema).length(100);

// ==========================================
// 2. BIOMARKER & ELIGIBILITY PARSING LOGIC
// ==========================================

const TARGET_BIOMARKER_PATTERNS: Array<{
  name: string;
  regex: RegExp;
  validator?: (text: string, matchIndex: number) => boolean;
}> = [
  { name: 'EGFR', regex: /\b(?:EGFR|ERBB1|HER1)\b/i },
  { name: 'Exon 20', regex: /\b(?:Exon\s*20(?:ins|del)?|ins20)\b/i },
  { name: 'KRAS', regex: /\bKRAS\b/i },
  { name: 'G12C', regex: /\bG12C\b/i },
  { name: 'BRAF', regex: /\bBRAF\b/i },
  { name: 'V600E', regex: /\bV600E\b/i },
  { name: 'HER2', regex: /\b(?:HER2|HER-2|ERBB2)\b/i },
  { name: 'ALK', regex: /\bALK\b/ },
  { name: 'BRCA1', regex: /\bBRCA1\b/i },
  { name: 'BRCA2', regex: /\bBRCA2\b/i },
  { name: 'BRCA', regex: /\bBRCA\b/i },
  { name: 'ROS1', regex: /\b(?:ROS1|ROS-1)\b/i },
  {
    name: 'MET',
    regex: /\b(?:c-MET|METex\d*|MET\s+(?:mutation|alteration|amplification|positive|overexpression|inhibitor|rearranged|fusion|skipping))\b|\bMET\b/,
    validator: (text: string, matchIndex: number) => {
      // Avoid matching standard English past tense verb "met"
      const snippet = text.slice(Math.max(0, matchIndex - 35), Math.min(text.length, matchIndex + 45));
      const isPastTenseVerb = /\b(?:have|has|had|having|who|that|patient|patients|participant|participants)\s+met\b|\bmet\s+(?:the|all|any|inclusion|exclusion|eligibility|criteria|endpoints?|requirements?|needs?)\b/i;
      return !isPastTenseVerb.test(snippet);
    }
  },
  { name: 'RET', regex: /\bRET\b/ },
  { name: 'NTRK', regex: /\b(?:NTRK|NTRK1|NTRK2|NTRK3)\b/i },
  { name: 'FGFR', regex: /\b(?:FGFR|FGFR1|FGFR2|FGFR3|FGFR4)\b/i }
];

function extractBiomarkers(fullText: string): string[] {
  const matched = new Set<string>();

  for (const { name, regex, validator } of TARGET_BIOMARKER_PATTERNS) {
    if (validator) {
      const allMatches = [...fullText.matchAll(new RegExp(regex, 'g'))];
      for (const m of allMatches) {
        if (m.index !== undefined && validator(fullText, m.index)) {
          matched.add(name);
          break;
        }
      }
    } else {
      if (regex.test(fullText)) {
        matched.add(name);
      }
    }
  }

  return Array.from(matched);
}

function parsePriorTherapyRules(
  criteriaText: string,
  inclusionText: string,
  exclusionText: string
): NormalizedClinicalTrial['priorTherapyRules'] {
  function evaluateTherapy(
    therapyPattern: RegExp,
    reqInclusionRegexes: RegExp[],
    excInclusionRegexes: RegExp[]
  ): 'REQUIRED' | 'ALLOWED' | 'EXCLUDED' | 'ANY' {
    // 1. Check if explicitly REQUIRED in inclusion criteria
    for (const r of reqInclusionRegexes) {
      if (r.test(inclusionText)) {
        return 'REQUIRED';
      }
    }

    // 2. Check if explicitly EXCLUDED in inclusion criteria (e.g. chemo-naive)
    for (const r of excInclusionRegexes) {
      if (r.test(inclusionText)) {
        return 'EXCLUDED';
      }
    }

    // 3. Scan exclusion criteria lines
    const excLines = exclusionText.split('\n');
    let hasWashoutOnly = false;
    for (const line of excLines) {
      if (therapyPattern.test(line)) {
        const isWashout = /(?:within|<=|<|less than)\s+\d+\s*(?:days?|weeks?|months?)/i.test(line);
        const isAbsoluteExclusion = /(?:any prior|prior.*(?:prohibited|not permitted|excluded|ineligible)|must not have received|no prior)/i.test(line);
        
        if (isAbsoluteExclusion && !isWashout) {
          return 'EXCLUDED';
        }
        if (!isWashout && /(?:prohibited|not allowed|not permitted|excluded)/i.test(line)) {
          return 'EXCLUDED';
        }
        if (isWashout) {
          hasWashoutOnly = true;
        }
      }
    }

    // A washout rule implies prior therapy is clinically permitted if past the window
    if (hasWashoutOnly) {
      return 'ALLOWED';
    }

    // 4. Check for ALLOWED statements
    const allowRegexes = [
      new RegExp(`(?:allowed|permitted|acceptable|may have received|with or without prior)\\s+[^.\\n]*?${therapyPattern.source}`, 'i'),
      new RegExp(`${therapyPattern.source}[^.\\n]*?(?:allowed|permitted|acceptable)`, 'i')
    ];
    for (const r of allowRegexes) {
      if (r.test(inclusionText) || r.test(criteriaText)) {
        return 'ALLOWED';
      }
    }

    return 'ANY';
  }

  // Chemotherapy
  const chemoPattern = /(?:chemotherapy|chemo|platinum|taxane|anthracycline|fluoropyrimidine)/i;
  const chemoReq = [
    /(?:progressed|relapsed|recurred|failed|refractory)\s+(?:on|after|to)\s+[^.\n]*?(?:chemotherapy|chemo|platinum|systemic therapy)/i,
    /(?:must have received|prior receipt of|at least \d+ prior lines? of|prior therapy with)[^.\n]*?(?:chemotherapy|chemo|platinum)/i,
    /(?:chemotherapy|chemo|platinum)[^.\n]*?(?:is required|required|mandatory|prior to study entry)/i,
    /(?:failure of|after failure of)\s+[^.\n]*?(?:chemotherapy|chemo|platinum)/i
  ];
  const chemoExc = [
    /(?:chemotherapy|chemo)[-\s]na[iï]ve/i,
    /(?:no prior|without prior|naive to|has not received|must not have received)\s+[^.\n]*?(?:chemotherapy|chemo|platinum)/i
  ];

  // Immunotherapy
  const immunoPattern = /(?:immunotherapy|checkpoint inhibitor|anti-PD-?1|anti-PD-?L1|anti-CTLA-?4|pembrolizumab|nivolumab|atezolizumab)/i;
  const immunoReq = [
    /(?:progressed|relapsed|failed|refractory)\s+(?:on|after|to)\s+[^.\n]*?(?:immunotherapy|checkpoint inhibitor|anti-PD-?1|anti-PD-?L1)/i,
    /(?:must have received|prior receipt of|prior therapy with)\s+[^.\n]*?(?:immunotherapy|checkpoint inhibitor|anti-PD-?1)/i,
    /(?:immunotherapy|checkpoint inhibitor|anti-PD-?1)[^.\n]*?(?:is required|required|mandatory)/i
  ];
  const immunoExc = [
    /(?:immunotherapy|checkpoint inhibitor)[-\s]na[iï]ve/i,
    /(?:no prior|without prior|naive to|must not have received)\s+[^.\n]*?(?:immunotherapy|checkpoint inhibitor|anti-PD-?1)/i
  ];

  // Targeted Therapy
  const targetedPattern = /(?:targeted therapy|targeted agent|tyrosine kinase inhibitor|TKI|EGFR inhibitor|KRAS inhibitor|BRAF inhibitor|HER2 inhibitor)/i;
  const targetedReq = [
    /(?:progressed|relapsed|failed|refractory)\s+(?:on|after|to)\s+[^.\n]*?(?:targeted therapy|TKI|tyrosine kinase inhibitor|targeted agent|EGFR inhibitor)/i,
    /(?:must have received|prior receipt of)\s+[^.\n]*?(?:targeted therapy|TKI|targeted agent)/i,
    /(?:targeted therapy|TKI)[^.\n]*?(?:is required|required|mandatory)/i
  ];
  const targetedExc = [
    /(?:targeted therapy|TKI)[-\s]na[iï]ve/i,
    /(?:no prior|without prior|naive to|must not have received)\s+[^.\n]*?(?:targeted therapy|TKI|targeted agent)/i
  ];

  return {
    chemotherapy: evaluateTherapy(chemoPattern, chemoReq, chemoExc),
    immunotherapy: evaluateTherapy(immunoPattern, immunoReq, immunoExc),
    targetedTherapy: evaluateTherapy(targetedPattern, targetedReq, targetedExc)
  };
}

function parseCriteriaSummaries(rawText: string): {
  inclusionSummary: string[];
  exclusionSummary: string[];
  inclusionText: string;
  exclusionText: string;
} {
  if (!rawText || rawText.trim() === '') {
    return {
      inclusionSummary: [],
      exclusionSummary: [],
      inclusionText: '',
      exclusionText: ''
    };
  }

  const incRegex = /(?:key\s+)?inclusion\s+criteria\s*:?/i;
  const excRegex = /(?:key\s+)?exclusion\s+criteria\s*:?/i;

  const incMatch = rawText.match(incRegex);
  const excMatch = rawText.match(excRegex);

  let inclusionText = '';
  let exclusionText = '';

  if (incMatch && excMatch) {
    if (incMatch.index! < excMatch.index!) {
      inclusionText = rawText.slice(incMatch.index! + incMatch[0].length, excMatch.index!);
      exclusionText = rawText.slice(excMatch.index! + excMatch[0].length);
    } else {
      exclusionText = rawText.slice(excMatch.index! + excMatch[0].length, incMatch.index!);
      inclusionText = rawText.slice(incMatch.index! + incMatch[0].length);
    }
  } else if (incMatch) {
    inclusionText = rawText.slice(incMatch.index! + incMatch[0].length);
  } else if (excMatch) {
    exclusionText = rawText.slice(excMatch.index! + excMatch[0].length);
  } else {
    inclusionText = rawText;
  }

  function extractItems(sectionText: string): string[] {
    const lines = sectionText.split('\n');
    const items: string[] = [];
    let currentItem = '';

    const bulletRegex = /^\s*(?:[*•\-–—+]|\(?\d+[\.\)]|\([a-z]\))\s+/i;
    const headerFillerRegex = /^(?:patients|participants|subjects|individuals)\s+(?:must|will)\s+(?:meet|be\s+eligible|satisfy)/i;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (currentItem) {
          items.push(currentItem);
          currentItem = '';
        }
        continue;
      }

      if (headerFillerRegex.test(line)) {
        continue;
      }

      if (bulletRegex.test(rawLine)) {
        if (currentItem) {
          items.push(currentItem);
        }
        currentItem = line.replace(bulletRegex, '').trim();
      } else if (currentItem) {
        currentItem += ' ' + line;
      } else {
        currentItem = line;
      }
    }

    if (currentItem) {
      items.push(currentItem);
    }

    return items
      .map(item => item.replace(/\s+/g, ' ').trim())
      .filter(item => item.length > 3);
  }

  return {
    inclusionSummary: extractItems(inclusionText),
    exclusionSummary: extractItems(exclusionText),
    inclusionText,
    exclusionText
  };
}

function parsePhase(phases?: string[]): NormalizedClinicalTrial['phase'] {
  if (!phases || phases.length === 0) return 'NA';
  const first = phases[0];
  if (first === 'EARLY_PHASE1' || first === 'PHASE1') return 'PHASE1';
  if (first === 'PHASE2') return 'PHASE2';
  if (first === 'PHASE3') return 'PHASE3';
  if (first === 'PHASE4') return 'PHASE4';
  if (phases.includes('PHASE1') || phases.includes('EARLY_PHASE1')) return 'PHASE1';
  if (phases.includes('PHASE2')) return 'PHASE2';
  if (phases.includes('PHASE3')) return 'PHASE3';
  if (phases.includes('PHASE4')) return 'PHASE4';
  return 'NA';
}

function parseAgeYears(ageStr?: string): number | undefined {
  if (!ageStr) return undefined;
  const match = ageStr.match(/(\d+)\s*(year|month|week|day)/i);
  if (!match) {
    const numOnly = ageStr.match(/(\d+)/);
    return numOnly ? parseInt(numOnly[1], 10) : undefined;
  }
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('year')) return val;
  if (unit.startsWith('month')) return Math.floor(val / 12);
  if (unit.startsWith('week')) return Math.floor(val / 52);
  if (unit.startsWith('day')) return Math.floor(val / 365);
  return val;
}

function parseGender(sex?: string): 'ALL' | 'FEMALE' | 'MALE' {
  if (!sex) return 'ALL';
  const s = sex.toUpperCase();
  if (s === 'FEMALE') return 'FEMALE';
  if (s === 'MALE') return 'MALE';
  return 'ALL';
}

// ==========================================
// 3. STUDY NORMALIZATION ENGINE
// ==========================================

function normalizeStudy(study: any): NormalizedClinicalTrial | null {
  const ps = study.protocolSection;
  if (!ps || !ps.identificationModule) return null;

  const nctId = ps.identificationModule.nctId;
  const briefTitle = ps.identificationModule.briefTitle;
  const officialTitle = ps.identificationModule.officialTitle;

  if (!nctId || !briefTitle) return null;

  // 1. Target Biomarkers Extraction
  const rawCriteria = ps.eligibilityModule?.eligibilityCriteria || '';
  const searchCorpus = `${briefTitle} ${officialTitle || ''} ${rawCriteria}`;
  const targetBiomarkers = extractBiomarkers(searchCorpus);

  // Filter: Precision oncology requirement (must have targeted genomic biomarkers)
  if (targetBiomarkers.length === 0) {
    return null;
  }

  // 2. Recruitment status
  const recruitmentStatus = 'RECRUITING';

  // 3. Phase
  const phases = ps.designModule?.phases;
  const phase = parsePhase(phases);

  // 4. Primary condition
  const primaryCondition = ps.conditionsModule?.conditions?.[0] || 'Oncology';

  // 5. Inclusions / Exclusions criteria
  const { inclusionSummary, exclusionSummary, inclusionText, exclusionText } = parseCriteriaSummaries(rawCriteria);

  // 6. Prior therapy rules
  const priorTherapyRules = parsePriorTherapyRules(rawCriteria, inclusionText, exclusionText);

  // 7. Age and gender
  const minAge = parseAgeYears(ps.eligibilityModule?.minimumAge);
  const minimumAgeYears = minAge !== undefined ? minAge : 18;
  const parsedMaxAge = parseAgeYears(ps.eligibilityModule?.maximumAge);
  const maximumAgeYears = parsedMaxAge && parsedMaxAge > 0 ? parsedMaxAge : undefined;
  const gender = parseGender(ps.eligibilityModule?.sex);

  // 8. Locations mapping
  const rawLocs = ps.contactsLocationsModule?.locations || ps.locationsModule?.locations || [];
  const locations: NormalizedClinicalTrial['locations'] = [];
  for (const loc of rawLocs) {
    if (loc.facility && loc.state && loc.facility.trim() !== '' && loc.state.trim() !== '') {
      locations.push({
        facility: loc.facility.trim(),
        city: (loc.city || '').trim(),
        state: loc.state.trim(),
        country: (loc.country || 'United States').trim()
      });
    }
  }

  // 9. Interventions
  const rawInterventions = ps.armsInterventionsModule?.interventions || [];
  const interventions: NormalizedClinicalTrial['interventions'] = rawInterventions.map((i: any) => {
    const item: { type: string; name: string; description?: string } = {
      type: i.type || 'DRUG',
      name: i.name || 'Investigational Agent'
    };
    if (i.description && i.description.trim() !== '') {
      item.description = i.description.trim();
    }
    return item;
  });

  // 10. Sponsor & Metadata
  const leadSponsor = ps.sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown Sponsor';
  const sourceUrl = `https://clinicaltrials.gov/study/${nctId}`;
  const lastUpdatedDate =
    ps.statusModule?.lastUpdatePostDateStruct?.date ||
    ps.statusModule?.lastUpdateSubmitDate ||
    new Date().toISOString().split('T')[0];

  const trial: NormalizedClinicalTrial = {
    nctId,
    briefTitle,
    officialTitle: officialTitle || undefined,
    phase,
    recruitmentStatus,
    primaryCondition,
    targetBiomarkers,
    priorTherapyRules,
    locations,
    eligibility: {
      minimumAgeYears,
      maximumAgeYears,
      gender,
      inclusionSummary,
      exclusionSummary,
      rawCriteriaText: rawCriteria
    },
    interventions,
    leadSponsor,
    sourceUrl,
    lastUpdatedDate
  };

  return trial;
}

// ==========================================
// 4. API FETCHING & INGESTION PIPELINE
// ==========================================

async function fetchStudiesPage(pageToken?: string): Promise<{ studies: any[]; nextPageToken?: string }> {
  // Primary endpoint with API v2 contactsLocationsModule field name
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  const queryParams = new URLSearchParams({
    'filter.overallStatus': 'RECRUITING',
    'query.cond': 'cancer OR oncology',
    pageSize: '100',
    fields: 'NCTId,BriefTitle,OfficialTitle,OverallStatus,Phase,ConditionsModule,ArmsInterventionsModule,EligibilityModule,ContactsLocationsModule,SponsorCollaboratorsModule,LastUpdatePostDate'
  });

  if (pageToken) {
    queryParams.set('pageToken', pageToken);
  }

  const url = `${baseUrl}?${queryParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ClinicalTrials.gov API returned status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return {
    studies: data.studies || [],
    nextPageToken: data.nextPageToken
  };
}

async function main() {
  console.log('================================================================');
  console.log('TRIALMATCH INGESTION ENGINE: ClinicalTrials.gov API v2 Ingestion');
  console.log('================================================================');
  console.log('Target: 100 Active, Recruiting Oncology Clinical Trials with Biomarkers');

  const normalizedTrials: NormalizedClinicalTrial[] = [];
  const seenNctIds = new Set<string>();
  let pageToken: string | undefined = undefined;
  let pageNumber = 1;
  const startTime = Date.now();

  while (normalizedTrials.length < 100) {
    console.log(`\n[Page ${pageNumber}] Fetching up to 100 raw studies from API...`);
    const { studies, nextPageToken } = await fetchStudiesPage(pageToken);

    if (studies.length === 0) {
      console.warn('No more studies returned from API.');
      break;
    }

    console.log(`[Page ${pageNumber}] Received ${studies.length} studies. Normalizing & filtering...`);

    let pageMatches = 0;
    for (const rawStudy of studies) {
      const trial = normalizeStudy(rawStudy);
      if (trial && !seenNctIds.has(trial.nctId)) {
        // Validate individual trial with Zod schema
        const validation = NormalizedClinicalTrialSchema.safeParse(trial);
        if (validation.success) {
          seenNctIds.add(trial.nctId);
          normalizedTrials.push(validation.data);
          pageMatches++;
        } else {
          console.warn(`Validation warning for ${trial.nctId}:`, validation.error.format());
        }

        if (normalizedTrials.length === 100) {
          break;
        }
      }
    }

    console.log(`[Page ${pageNumber}] Added ${pageMatches} precision oncology trials. Total: ${normalizedTrials.length}/100`);

    if (normalizedTrials.length >= 100 || !nextPageToken) {
      break;
    }

    pageToken = nextPageToken;
    pageNumber++;
  }

  console.log('\n================================================================');
  console.log(`Ingestion completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log(`Total collected: ${normalizedTrials.length} trials`);

  // Final Dataset Verification with Zod
  console.log('Validating complete dataset against NormalizedDatasetSchema...');
  const datasetValidation = NormalizedDatasetSchema.safeParse(normalizedTrials);

  if (!datasetValidation.success) {
    console.error('CRITICAL: Dataset validation failed!', datasetValidation.error.format());
    process.exit(1);
  }

  console.log('✓ Zod Schema verification passed! Exactly 100 valid trials confirmed.');

  // Output destination: data/trials_normalized.json
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outputDir = join(__dirname, '..', 'data');
  const outputPath = join(outputDir, 'trials_normalized.json');

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(datasetValidation.data, null, 2), 'utf-8');

  console.log(`✓ Saved normalized dataset to: ${outputPath}`);

  // Summary Metrics
  const biomarkerCounts: Record<string, number> = {};
  const phaseCounts: Record<string, number> = {};
  const priorChemoCounts: Record<string, number> = {};
  let totalLocations = 0;

  for (const t of normalizedTrials) {
    for (const b of t.targetBiomarkers) {
      biomarkerCounts[b] = (biomarkerCounts[b] || 0) + 1;
    }
    phaseCounts[t.phase] = (phaseCounts[t.phase] || 0) + 1;
    priorChemoCounts[t.priorTherapyRules.chemotherapy] =
      (priorChemoCounts[t.priorTherapyRules.chemotherapy] || 0) + 1;
    totalLocations += t.locations.length;
  }

  console.log('\n--- Dataset Summary Metrics ---');
  console.log('Biomarkers Distribution:', biomarkerCounts);
  console.log('Phases Distribution:', phaseCounts);
  console.log('Prior Chemotherapy Rules Distribution:', priorChemoCounts);
  console.log(`Total Valid Locations Extracted: ${totalLocations}`);
  console.log('Sample NCT IDs:', normalizedTrials.slice(0, 5).map(t => t.nctId));
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Fatal execution error in ingest_trials.ts:', err);
  process.exit(1);
});
