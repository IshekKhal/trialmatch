# TrialMatch: Precision Oncology Clinical Trial Matching Agent

[![Sanity](https://img.shields.io/badge/Sanity-Studio%20v3-F03E2F?logo=sanity&logoColor=white)](https://trialmatch-oncology.sanity.studio)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A precision oncology clinical trial discovery and verification agent powered by **Sanity Context MCP** and structured GROQ queries. Grounded in 100 real clinical trial protocols from ClinicalTrials.gov, verified against a 3-arm benchmark across 10 gold-standard patient cases.

Built for the **[DEV Community x Sanity Challenge 2026](https://dev.to/challenges/sanity-2026-09-16)** (Path One: *Ship an Agent That Queries Real Content*).

---

## The Clinical Problem

Matching cancer patients to clinical trials using standard text search or ungrounded language models produces dangerous results:

1. **Negative Exclusion Blindness**: A patient with non-small cell lung cancer who received prior chemotherapy searches for `EGFR lung cancer chemotherapy`. A keyword search matches trial `NCT07799935` because both words appear in the text, ignoring Rule 14 which explicitly excludes patients with prior systemic chemotherapy.
2. **Lexical Acronym Collision**: Keyword search matches nephrology trials because the lab measurement `eGFR` (estimated Glomerular Filtration Rate) collides with the oncogene `EGFR`.
3. **Model Hallucination**: Ungrounded LLMs (like raw Gemini or GPT) invent fake 8-digit ClinicalTrials.gov identifiers (`NCT04847387`, `NCT04746654`) that do not exist in active oncology registries.

**TrialMatch solves this by treating Sanity as an epistemic anchor.** Patient narratives are translated into deterministic GROQ queries executed against structured Sanity content schemas with typed biomarkers, normalized therapy rules, and facility coordinates.

---

## Live Links

* **Live Web Application**: [https://trialmatch.vercel.app](https://trialmatch.vercel.app)
* **Interactive 3-Arm Benchmark**: [https://trialmatch.vercel.app/benchmark](https://trialmatch.vercel.app/benchmark)
* **Hosted Sanity Studio**: [https://trialmatch-oncology.sanity.studio](https://trialmatch-oncology.sanity.studio)
* **Sanity GROQ MCP Endpoint**: `https://api.sanity.io/v1/context/organizations/oz3yptidu/mcp/trialmatch`
* **Sanity Knowledge Base MCP Endpoint**: `https://api.sanity.io/v1/context/organizations/oz3yptidu/mcp/trialmatch-kb`

---

## System Architecture

```
                      CLINICAL PATIENT NARRATIVE
         ("58yo female, NSCLC EGFR Exon 20, prior platinum chemo, TX")
                                   │
                                   ▼
                  CLAUDE HAIKU (Schema Extractor)
         Extracts: condition="Lung", biomarker="EGFR", state="TX",
                   priorChemo="ALLOWED"
                                   │
                                   ▼
                  SANITY CONTEXT MCP (GROQ Engine)
         Translates extracted primitives into deterministic GROQ
                                   │
                                   ▼
        ┌─────────────────────────────────────────────────────┐
        │              SANITY CONTENT LAKE (6xsr2k42)          │
        │                                                     │
        │  *[_type == "clinicalTrial" &&                     │
        │    recruitmentStatus == "RECRUITING" &&             │
        │    primaryCondition match $condition &&             │
        │    targetBiomarkers[] match $biomarker &&           │
        │    (priorTherapyRules.chemotherapy == "ALLOWED" ||  │
        │     priorTherapyRules.chemotherapy == "REQUIRED") &&│
        │    locations[].state match $state]                  │
        └──────────────────────────┬──────────────────────────┘
                                   │
                                   ▼
                   VERIFIED MATCHES (Zero Violations)
        * NCT05376891: Phase 2 EGFR Exon 20 Target (Houston, TX)
        * NCT06234137: Novel EGFR Tyrosine Kinase (Dallas, TX)
```

---

## Empirical Benchmark: 3-Arm Evaluation

We evaluated 10 gold-standard patient profiles across three discovery engines:

| Evaluation Metric | Arm 1: Structured Sanity Agent | Arm 2: Naive Keyword Search | Arm 3: Bare LLM (Zero DB) | Clinical Implication |
| :--- | :---: | :---: | :---: | :--- |
| **Medical Precision** | **100%** | 78% | 0% | Arm 1 guarantees verified candidacy; Arms 2 and 3 return disqualified cohorts |
| **Safety Violations** | **0** | **60** | 20 | Naive search misses negative exclusion clauses; Bare LLM bypasses protocol rules |
| **Hallucinated NCT IDs** | **0** | 0 | **20 (100% fake)** | Bare LLM invents non-existent trial identifiers |
| **Auditability Rate** | **100%** | 0% | 0% | Arm 1 provides exact GROQ queries and protocol rule citations |
| **Avg Returned Trials** | 1.2 | 41.5 | 2.0 | Arm 1 strictly limits results to actionable, recruiting matches |

Run the benchmark locally:
```bash
pnpm eval
```

---

## Project Structure

```
trialmatch/
├── app/
│   ├── page.tsx               # Master Duel Arena (Sanity Agent vs Keyword Baseline)
│   ├── benchmark/page.tsx     # Interactive 3-Arm Evaluation Dashboard
│   ├── layout.tsx             # Root layout with Geist typography
│   └── globals.css            # Medical obsidian design system (#080C14)
├── components/
│   ├── DuelArena.tsx          # Dual-column comparison with column pagination
│   ├── ScenarioChips.tsx      # 8 pre-configured oncology clinical scenarios
│   ├── BenchmarkRunner.tsx    # Interactive benchmark runner & case inspector
│   └── Scoreboard.tsx         # Real-time metric comparison scoreboard
├── studio/
│   ├── sanity.config.ts       # Sanity Studio v3 configuration
│   └── schemas/
│       ├── clinicalTrial.ts   # Core schema: biomarkers, therapy rules, facilities
│       ├── protocolRule.ts    # Knowledge base schema: exclusion overrides & washouts
│       └── index.ts           # Schema registry
├── lib/
│   ├── agent.ts               # Agent query generator (narrative to GROQ)
│   ├── sanity.ts              # Sanity client & live Context MCP bindings
│   ├── eval_cases.ts          # 10 gold-standard oncology test profiles
│   └── eval_runner.ts         # Automated 3-arm benchmark execution engine
├── scripts/
│   └── ingest_trials.ts       # ClinicalTrials.gov API v2 data ingestion pipeline
└── data/
    ├── trials_normalized.json # 100 curated oncology trials (1.2 MB)
    ├── eval_results.json      # Raw 3-arm benchmark evaluation outputs
    └── eval_summary.md        # Comprehensive 419-line benchmark report
```

---

## Sanity Content Schema

Clinical trial protocols are modeled into queryable primitives rather than text blobs:

```typescript
// studio/schemas/clinicalTrial.ts (excerpt)
defineField({
  name: 'targetBiomarkers',
  title: 'Target Biomarkers',
  type: 'array',
  of: [{type: 'string'}],
  options: {
    list: ['EGFR', 'KRAS', 'BRAF', 'HER2', 'ALK', 'BRCA1', 'BRCA2', 'Exon 20', 'G12C', 'V600E'],
  },
}),
defineField({
  name: 'priorTherapyRules',
  title: 'Prior Therapy Rules',
  type: 'object',
  fields: [
    defineField({
      name: 'chemotherapy',
      type: 'string',
      options: { list: ['REQUIRED', 'ALLOWED', 'EXCLUDED', 'ANY'] },
    }),
    defineField({
      name: 'immunotherapy',
      type: 'string',
      options: { list: ['REQUIRED', 'ALLOWED', 'EXCLUDED', 'ANY'] },
    }),
  ],
}),
defineField({
  name: 'locations',
  title: 'Trial Locations',
  type: 'array',
  of: [{
    type: 'object',
    fields: [
      { name: 'facility', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'state', type: 'string' },
      { name: 'country', type: 'string' },
    ],
  }],
})
```

---

## Quickstart (Local Development)

### Prerequisites
* Node.js 20+
* pnpm 9+

### Setup
```bash
# Clone the repository
git clone https://github.com/devabhishek/trialmatch.git
cd trialmatch

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
```

Add your Sanity and Anthropic/Gemini credentials to `.env`:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID="6xsr2k42"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_READ_TOKEN="your-token"
ANTHROPIC_API_KEY="your-key"
```

### Run Locally
```bash
# Start Next.js development server
pnpm dev

# In a separate terminal, launch Sanity Studio locally (optional)
cd studio && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## License

This project is licensed under the [MIT License](LICENSE).
