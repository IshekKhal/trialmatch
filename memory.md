# TrialMatch — Implementation Memory & Master Build Log

## What Was Built
- 2026-09-30 [Architecture & Setup]: System architecture designed for TrialMatch (Path One submission for DEV x Sanity Challenge). Verified `pnpm` v11.21.0, `@sanity/client` v8.9.0, `@modelcontextprotocol/sdk` v1.31.0, Next.js v16.3.7, and Vercel AI SDK v7.0.123. Checked agent-reach channels.
- 2026-09-30 [Phase 1A - ClinicalTrials.gov Ingestion]: Standalone TypeScript ingestion script (`scripts/ingest_trials.ts`) querying ClinicalTrials.gov API v2. Ingested 100 active, recruiting oncology trials, parsed biomarkers, normalized prior therapy rules (chemo/immuno/targeted), mapped 1,144 facility locations, extracted structured inclusion/exclusion bullet points, validated via Zod schema, and wrote `data/trials_normalized.json` (1.2 MB).

## Key Decisions (Never Re-Litigate)
- [Package Manager]: Use `pnpm` exclusively across all development, scripts, and sub-chat prompts (v11.21.0 verified on machine).
- [Challenge Target]: DEV Community x Sanity Challenge Path One ("Ship an Agent That Queries Real Content"). Deadline: October 4, 2026.
- [Target Corpus]: Exactly 100 active, recruiting oncology clinical trials with verified genomic biomarkers from ClinicalTrials.gov API v2, indexed in Sanity Studio dataset and Sanity Knowledge Base.
- [Evaluation Strategy]: 3-Arm Evaluation benchmark (Structured Sanity Agent vs Naive Keyword Search vs Bare LLM) across 10 complex patient profiles to prove necessity of structured schemas.

## Current Implementation State
Phase 1A complete. Clean dataset of 100 precision oncology trials saved at `/Users/devabhishek/withaiprojects/sanitychallenge/path1/data/trials_normalized.json`. Ready for Phase 1B (Sanity Studio schema setup and dataset import script).

## Known Gotchas
- Sanity Knowledge Bases (beta) have a hard ceiling of 150 documents. We constrain our oncology trial dataset to ~100 highly curated trials to fit comfortably within this budget while maximizing biomarker diversity.
- Sanity Context MCP requires an Organization API Token with "Context Viewer" permissions; using a Project API token triggers a 403 Forbidden.
- ClinicalTrials.gov API v2 accepts `ContactsLocationsModule` in `fields` query parameter; requesting `LocationsModule` throws a 400 Bad Request error.
- Biomarker NLP: Case-insensitive scanning for `MET` creates false positives on standard English past-tense verb "met" (e.g. "patient has met criteria"). Guarded with contextual validation to ensure genuine MET proto-oncogene alterations.
- Prior Therapy NLP: Exclusion criteria mentioning therapies within temporal windows (e.g. "Chemotherapy within 30 days") represent temporal washouts rather than absolute therapy exclusions, meaning prior therapy is clinically permitted if past the washout window.
