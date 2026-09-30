# TrialMatch — Implementation Memory & Master Build Log

## What Was Built
- 2026-09-30 [Architecture & Setup]: System architecture designed for TrialMatch (Path One submission for DEV x Sanity Challenge). Verified `pnpm` v11.21.0, `@sanity/client` v8.9.0, `@modelcontextprotocol/sdk` v1.31.0, Next.js v16.3.7, and Vercel AI SDK v7.0.123. Checked agent-reach channels.
- 2026-09-30 [Phase 1A - ClinicalTrials.gov Ingestion]: Standalone TypeScript ingestion script (`scripts/ingest_trials.ts`) querying ClinicalTrials.gov API v2. Ingested 100 active, recruiting oncology trials, parsed biomarkers, normalized prior therapy rules (chemo/immuno/targeted), mapped 1,144 facility locations, extracted structured inclusion/exclusion bullet points, validated via Zod schema, and wrote `data/trials_normalized.json` (1.2 MB).

- 2026-09-30 [Phase 1B - Sanity Schemas & Seed Engine]: Created Sanity Studio schemas (`studio/schemas/clinicalTrial.ts`, `studio/schemas/protocolRule.ts`, `studio/schemas/index.ts`), Studio configuration (`studio/sanity.config.ts`, `studio/sanity.cli.ts`), `.env.example`, and batch seed engine (`scripts/seed_sanity.ts`). Implemented deterministic IDs (`trial-${nctId}`, `rule-${ruleId}`), transaction chunking (25 docs/batch), automated array `_key` injection for locations and interventions, 5 foundational protocol rules, and safe dry-run exit when credentials are placeholders.

- 2026-09-30 [Phase 1C - Next.js Web Application & The Duel UI]: Built full Next.js 16 web application with React 19 in `path1` using `pnpm`. Implemented The Duel interactive split-screen (Structured Sanity Agent vs Naive Keyword Search), 8 quick-fill clinical preset chips, live Scoreboard with protocol compliance metrics, expandable GROQ trace drawer, and dual-backend engine connecting to live Sanity (Project `6xsr2k42`, dataset `production`, seeded with 100 trials and 5 protocol rules) with in-memory fallback.

## Key Decisions (Never Re-Litigate)
- [Package Manager]: Use `pnpm` exclusively across all development, scripts, and sub-chat prompts (v11.21.0 verified on machine).
- [Challenge Target]: DEV Community x Sanity Challenge Path One ("Ship an Agent That Queries Real Content"). Deadline: October 4, 2026.
- [Target Corpus]: Exactly 100 active, recruiting oncology clinical trials with verified genomic biomarkers from ClinicalTrials.gov API v2, indexed in Sanity Studio dataset and Sanity Knowledge Base.
- [Evaluation Strategy]: 3-Arm Evaluation benchmark (Structured Sanity Agent vs Naive Keyword Search vs Bare LLM) across 10 complex patient profiles to prove necessity of structured schemas.
- [Sanity Schema Strategy]: `clinicalTrial` contains structured metadata (biomarkers, priorTherapyRules, locations, eligibility) for GROQ filtering, while `protocolRule` documents store prose medical guidance for the Sanity Knowledge Base vector/semantic index.

## Current Implementation State
Phases 1A, 1B, and 1C complete.
- Normalized dataset of 100 precision oncology trials in `data/trials_normalized.json`.
- Complete Sanity Studio schema suite in `studio/schemas/`.
- Live Sanity dataset seeded: 100 `clinicalTrial` documents and 5 `protocolRule` documents in project `6xsr2k42`.
- Next.js web application running at `http://localhost:3000` with The Duel UI.
- Ready for Phase 1D (3-Arm Benchmark Suite & automated DEV Submission article generator).

## Known Gotchas
- Sanity Knowledge Bases (beta) have a hard ceiling of 150 documents. We constrain our oncology trial dataset to ~100 highly curated trials to fit comfortably within this budget while maximizing biomarker diversity.
- Sanity Context MCP requires an Organization API Token with "Context Viewer" permissions; using a Project API token triggers a 403 Forbidden.
- Array Object Keys: In Sanity, objects inside an array (e.g. `locations`, `interventions`) MUST have unique `_key` strings; otherwise Sanity mutation transactions fail. The seed script automatically generates deterministic keys `loc-${nctId}-${idx}` and `intv-${nctId}-${idx}`.
- NodeNext Module Resolution: TypeScript with `moduleResolution: "NodeNext"` requires explicit `.js` extensions for relative imports (`import {schemaTypes} from './schemas/index.js'`) and `"types": ["node"]` in `tsconfig.json`.
- ClinicalTrials.gov API v2 accepts `ContactsLocationsModule` in `fields` query parameter; requesting `LocationsModule` throws a 400 Bad Request error.
- Biomarker NLP: Case-insensitive scanning for `MET` creates false positives on standard English past-tense verb "met" (e.g. "patient has met criteria"). Guarded with contextual validation to ensure genuine MET proto-oncogene alterations.
- Prior Therapy NLP: Exclusion criteria mentioning therapies within temporal windows (e.g. "Chemotherapy within 30 days") represent temporal washouts rather than absolute therapy exclusions, meaning prior therapy is clinically permitted if past the washout window.
