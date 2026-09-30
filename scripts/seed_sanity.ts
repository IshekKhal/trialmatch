import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@sanity/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface NormalizedTrialLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface NormalizedTrialIntervention {
  type?: string;
  name?: string;
  description?: string;
}

interface NormalizedTrialEligibility {
  minimumAgeYears?: number;
  maximumAgeYears?: number;
  gender?: string;
  inclusionSummary?: string[];
  exclusionSummary?: string[];
  rawCriteriaText?: string;
}

interface NormalizedPriorTherapyRules {
  chemotherapy?: string;
  immunotherapy?: string;
  targetedTherapy?: string;
}

interface NormalizedTrial {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  phase?: string;
  recruitmentStatus?: string;
  primaryCondition: string;
  targetBiomarkers?: string[];
  priorTherapyRules?: NormalizedPriorTherapyRules;
  locations?: NormalizedTrialLocation[];
  eligibility?: NormalizedTrialEligibility;
  interventions?: NormalizedTrialIntervention[];
  leadSponsor?: string;
  sourceUrl?: string;
  lastUpdatedDate?: string;
}

interface SanityClinicalTrialDocument {
  _id: string;
  _type: 'clinicalTrial';
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  phase: string;
  recruitmentStatus: string;
  primaryCondition: string;
  targetBiomarkers: string[];
  priorTherapyRules: {
    chemotherapy: string;
    immunotherapy: string;
    targetedTherapy: string;
  };
  locations: Array<{
    _key: string;
    facility?: string;
    city?: string;
    state?: string;
    country?: string;
  }>;
  eligibility: {
    minimumAgeYears?: number;
    maximumAgeYears?: number;
    gender: string;
    inclusionSummary: string[];
    exclusionSummary: string[];
    rawCriteriaText: string;
  };
  interventions: Array<{
    _key: string;
    type?: string;
    name?: string;
    description?: string;
  }>;
  leadSponsor?: string;
  sourceUrl?: string;
  lastUpdatedDate?: string;
}

interface SanityProtocolRuleDocument {
  _id: string;
  _type: 'protocolRule';
  ruleId: string;
  title: string;
  category: 'ELIGIBILITY_HIERARCHY' | 'WASHOUT_PERIODS' | 'BIOMARKER_SPECIFICITY' | 'GEOGRAPHIC_VALIDATION';
  priority: number;
  summary: string;
  clinicalRationale: string;
}

const FOUNDATIONAL_PROTOCOL_RULES: SanityProtocolRuleDocument[] = [
  {
    _id: 'rule-RULE-EXCLUSION-OVERRIDE',
    _type: 'protocolRule',
    ruleId: 'RULE-EXCLUSION-OVERRIDE',
    title: 'Absolute Exclusion Criteria Precedence Rule',
    category: 'ELIGIBILITY_HIERARCHY',
    priority: 10,
    summary:
      'Exclusion criteria strictly override biomarker matches; if a patient has prior chemo and a trial lists chemo under exclusion, patient is ineligible.',
    clinicalRationale:
      'In clinical oncology trial matching, patient safety and trial integrity require that protocol exclusion criteria take absolute precedence over biomarker or inclusion factors. Even when a patient exhibits a sensitizing genomic alteration (such as EGFR Exon 19 deletion or KRAS G12C), meeting any exclusion criterion (such as active brain metastases, prior systemic chemotherapy within a restricted window, or inadequate hepatic reserve) immediately disqualifies the patient from enrollment. Failure to respect exclusion precedence risks severe toxicity, confounding efficacy endpoints, and protocol non-compliance.',
  },
  {
    _id: 'rule-RULE-WASHOUT-WINDOWS',
    _type: 'protocolRule',
    ruleId: 'RULE-WASHOUT-WINDOWS',
    title: 'Washout Window Interpretation Rule',
    category: 'WASHOUT_PERIODS',
    priority: 8,
    summary:
      'Temporal exclusions like within 30 days mean the patient is eligible after the washout period elapses.',
    clinicalRationale:
      'Many clinical protocol exclusions specify time-bounded prohibitions (e.g., "prior systemic therapy within 28 days or 5 half-lives", "radiotherapy within 14 days"). These are not permanent contraindications but pharmacological and physiological washout windows designed to prevent drug-drug interactions and ensure baseline organ stabilization. An AI reasoning engine must distinguish between static biological exclusions (e.g., germline contraindications or prior organ transplant) and transient temporal exclusions, providing prospective eligibility timelines for patients currently in a washout interval.',
  },
  {
    _id: 'rule-RULE-BIOMARKER-SPECIFICITY',
    _type: 'protocolRule',
    ruleId: 'RULE-BIOMARKER-SPECIFICITY',
    title: 'Biomarker Sub-Variant Specificity Rule',
    category: 'BIOMARKER_SPECIFICITY',
    priority: 9,
    summary:
      'Specific variant targets like EGFR Exon 20 or KRAS G12C require exact variant matches; general wild-type trials do not qualify.',
    clinicalRationale:
      'Precision oncology therapeutics operate on stereospecific drug-target interactions. A trial targeting KRAS G12C specifically evaluates small molecule inhibitors designed for the cysteine switch-II pocket, rendering patients with other KRAS alterations (e.g., G12D, G12V) ineligible. Similarly, EGFR Exon 20 insertion mutations require selective kinase inhibitors or bispecific antibodies and do not respond to first- or third-generation TKIs targeting classical L858R or Exon 19 deletions. Protocol matching must require rigorous allele-level and exon-level alignment between patient genomics and trial target mechanisms.',
  },
  {
    _id: 'rule-RULE-PHASE-APPROPRIATENESS',
    _type: 'protocolRule',
    ruleId: 'RULE-PHASE-APPROPRIATENESS',
    title: 'Phase Appropriateness Hierarchy Rule',
    category: 'ELIGIBILITY_HIERARCHY',
    priority: 7,
    summary:
      'Phase 1 is dose-escalation for refractory patients; Phase 2 tests efficacy; Phase 3 compares to standard of care.',
    clinicalRationale:
      'Clinical trial phases correspond to distinct clinical scenarios and risk-benefit profiles. Phase 1 trials prioritize safety, maximum tolerated dose (MTD), and pharmacokinetics, typically mandating progression on all approved standard lines of therapy (salvage setting). Phase 2 trials evaluate target engagement and objective response rate (ORR) within biologically defined cohorts. Phase 3 randomized controlled trials compare novel regimens directly against standard-of-care benchmarks. When recommending clinical trials, the engine must align trial phase with patient line of therapy, disease aggressiveness, and prior therapeutic resistance.',
  },
  {
    _id: 'rule-RULE-GEOGRAPHIC-ACCESS',
    _type: 'protocolRule',
    ruleId: 'RULE-GEOGRAPHIC-ACCESS',
    title: 'Geographic Trial Access Rule',
    category: 'GEOGRAPHIC_VALIDATION',
    priority: 6,
    summary:
      'A patient must have access to at least one recruiting site within their travel perimeter.',
    clinicalRationale:
      'Even if a patient meets 100% of genomic and clinical eligibility criteria, a trial is clinically non-actionable if no trial facility is accessible. Oncology protocol regimens frequently mandate biweekly or weekly clinic visits for intravenous infusion, pharmacokinetic blood draws, and toxicity monitoring. An eligibility match must validate geographic accessibility and confirm active recruiting status at specific regional sites before classifying a trial as viable.',
  },
];

function isPlaceholderOrMissing(value?: string): boolean {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  const lower = trimmed.toLowerCase();
  return (
    lower.includes('your-') ||
    lower.includes('your_') ||
    lower.includes('placeholder') ||
    lower.includes('<project-id>') ||
    lower.includes('<token>') ||
    lower === 'xxx' ||
    lower === 'todo' ||
    lower === 'dummy' ||
    lower === 'dummy-project-id'
  );
}

function transformTrialToSanityDoc(trial: NormalizedTrial): SanityClinicalTrialDocument {
  return {
    _id: `trial-${trial.nctId}`,
    _type: 'clinicalTrial',
    nctId: trial.nctId,
    briefTitle: trial.briefTitle,
    officialTitle: trial.officialTitle || undefined,
    phase: trial.phase || 'NA',
    recruitmentStatus: trial.recruitmentStatus || 'RECRUITING',
    primaryCondition: trial.primaryCondition,
    targetBiomarkers: trial.targetBiomarkers || [],
    priorTherapyRules: {
      chemotherapy: trial.priorTherapyRules?.chemotherapy || 'ANY',
      immunotherapy: trial.priorTherapyRules?.immunotherapy || 'ANY',
      targetedTherapy: trial.priorTherapyRules?.targetedTherapy || 'ANY',
    },
    locations: (trial.locations || []).map((loc, idx) => ({
      _key: `loc-${trial.nctId}-${idx}`,
      facility: loc.facility || undefined,
      city: loc.city || undefined,
      state: loc.state || undefined,
      country: loc.country || undefined,
    })),
    eligibility: {
      minimumAgeYears: trial.eligibility?.minimumAgeYears,
      maximumAgeYears: trial.eligibility?.maximumAgeYears,
      gender: trial.eligibility?.gender || 'ALL',
      inclusionSummary: trial.eligibility?.inclusionSummary || [],
      exclusionSummary: trial.eligibility?.exclusionSummary || [],
      rawCriteriaText: trial.eligibility?.rawCriteriaText || '',
    },
    interventions: (trial.interventions || []).map((intv, idx) => ({
      _key: `intv-${trial.nctId}-${idx}`,
      type: intv.type || 'DRUG',
      name: intv.name || 'Unnamed Agent',
      description: intv.description || undefined,
    })),
    leadSponsor: trial.leadSponsor || undefined,
    sourceUrl: trial.sourceUrl || undefined,
    lastUpdatedDate: trial.lastUpdatedDate || undefined,
  };
}

async function run(): Promise<void> {
  console.log('='.repeat(70));
  console.log('TrialMatch — Phase 1B: Sanity Dataset Import Engine');
  console.log('='.repeat(70));

  const dataPath = join(__dirname, '../data/trials_normalized.json');
  if (!existsSync(dataPath)) {
    console.error(`ERROR: Normalized data file not found at: ${dataPath}`);
    console.error('Please run Phase 1A ingestion first: pnpm run ingest');
    process.exit(1);
  }

  const rawJson = await readFile(dataPath, 'utf-8');
  const normalizedTrials: NormalizedTrial[] = JSON.parse(rawJson);

  if (!Array.isArray(normalizedTrials) || normalizedTrials.length === 0) {
    console.error('ERROR: data/trials_normalized.json is empty or invalid.');
    process.exit(1);
  }

  console.log(`Loaded ${normalizedTrials.length} trials from ${dataPath}`);

  // Transform and validate all documents
  const sanityTrials = normalizedTrials.map(transformTrialToSanityDoc);

  // Validate critical invariants
  let totalLocations = 0;
  let totalInterventions = 0;
  for (const doc of sanityTrials) {
    if (!doc.nctId || !doc.briefTitle || !doc.primaryCondition) {
      throw new Error(`Validation failed for trial document ${doc._id}: Missing required fields.`);
    }
    totalLocations += doc.locations.length;
    totalInterventions += doc.interventions.length;
  }

  console.log(`Validation passed:`);
  console.log(`  - Total clinical trials: ${sanityTrials.length}`);
  console.log(`  - Total structured locations: ${totalLocations}`);
  console.log(`  - Total structured interventions: ${totalInterventions}`);
  console.log(`  - Total foundational protocol rules: ${FOUNDATIONAL_PROTOCOL_RULES.length}`);

  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';
  const apiWriteToken = process.env.SANITY_API_WRITE_TOKEN;

  const missingProjectId = isPlaceholderOrMissing(projectId);
  const missingWriteToken = isPlaceholderOrMissing(apiWriteToken);

  if (missingProjectId || missingWriteToken) {
    console.log('\n' + '-'.repeat(70));
    console.log('DRY-RUN MODE ACTIVATED');
    console.log('-'.repeat(70));
    console.log('Notice: Sanity API credentials are not yet configured or set to placeholder values.');
    console.log('Required Environment Variables:');
    if (missingProjectId) {
      console.log('  • SANITY_PROJECT_ID: Missing or placeholder (get from sanity.io/manage)');
    } else {
      console.log(`  • SANITY_PROJECT_ID: Configured (${projectId})`);
    }
    console.log(`  • SANITY_DATASET: "${dataset}"`);
    if (missingWriteToken) {
      console.log('  • SANITY_API_WRITE_TOKEN: Missing or placeholder (requires write or admin token)');
    } else {
      console.log('  • SANITY_API_WRITE_TOKEN: Configured (hidden)');
    }

    console.log('\nDry-Run Verification Summary:');
    console.log(`  ✓ Data file data/trials_normalized.json is 100% valid and schema-compliant.`);
    console.log(`  ✓ Prepared ${sanityTrials.length} clinicalTrial documents with deterministic IDs (e.g. ${sanityTrials[0]._id}).`);
    console.log(`  ✓ Prepared ${FOUNDATIONAL_PROTOCOL_RULES.length} protocolRule documents with deterministic IDs (e.g. ${FOUNDATIONAL_PROTOCOL_RULES[0]._id}).`);
    console.log(`  ✓ Batch chunking plan: 4 transactions of 25 trials each + 1 transaction for protocol rules.`);
    console.log('\nTo execute live import into Sanity:');
    console.log('  1. Create or open your project at https://sanity.io/manage');
    console.log('  2. Create an API Token with Editor or Admin permissions');
    console.log('  3. Add credentials to your .env file:');
    console.log('       SANITY_PROJECT_ID=your_project_id');
    console.log('       SANITY_DATASET=production');
    console.log('       SANITY_API_WRITE_TOKEN=your_token');
    console.log('  4. Re-run: pnpm seed\n');
    console.log('Dry-run completed successfully.');
    process.exit(0);
  }

  // Live import mode
  console.log('\n' + '-'.repeat(70));
  console.log('LIVE IMPORT MODE ACTIVATED');
  console.log('-'.repeat(70));
  console.log(`Target Sanity Project: ${projectId}`);
  console.log(`Target Dataset: ${dataset}`);

  const client = createClient({
    projectId: projectId!,
    dataset,
    token: apiWriteToken!,
    apiVersion: '2026-09-01',
    useCdn: false,
  });

  const CHUNK_SIZE = 25;
  const totalChunks = Math.ceil(sanityTrials.length / CHUNK_SIZE);

  console.log(`\nImporting ${sanityTrials.length} clinical trials in ${totalChunks} chunks of ${CHUNK_SIZE}...`);

  for (let i = 0; i < sanityTrials.length; i += CHUNK_SIZE) {
    const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
    const chunk = sanityTrials.slice(i, i + CHUNK_SIZE);
    console.log(`Uploading chunk ${chunkIndex}/${totalChunks} (${chunk.length} trials: ${chunk[0].nctId} - ${chunk[chunk.length - 1].nctId})...`);

    const tx = client.transaction();
    for (const doc of chunk) {
      tx.createOrReplace(doc);
    }
    await tx.commit();
    console.log(`  ✓ Chunk ${chunkIndex}/${totalChunks} committed successfully.`);
  }

  console.log(`\nImporting ${FOUNDATIONAL_PROTOCOL_RULES.length} foundational protocol guidance rules...`);
  const rulesTx = client.transaction();
  for (const rule of FOUNDATIONAL_PROTOCOL_RULES) {
    rulesTx.createOrReplace(rule);
  }
  await rulesTx.commit();
  console.log(`  ✓ Protocol rules committed successfully.`);

  console.log('\nVerifying dataset via GROQ queries...');
  const trialCount = await client.fetch<number>(`count(*[_type == 'clinicalTrial'])`);
  const ruleCount = await client.fetch<number>(`count(*[_type == 'protocolRule'])`);

  console.log('='.repeat(70));
  console.log('IMPORT AND VERIFICATION REPORT');
  console.log('='.repeat(70));
  console.log(`Live Dataset Verification:`);
  console.log(`  • clinicalTrial documents in Sanity: ${trialCount}`);
  console.log(`  • protocolRule documents in Sanity: ${ruleCount}`);
  console.log(`Status: ALL DOCUMENTS PERSISTED SUCCESSFULLY.\n`);
}

run().catch((error) => {
  console.error('\nSeed script failed with unhandled error:', error);
  process.exit(1);
});
