# TrialMatch — Implementation Memory & Master Build Log

## What Was Built
- 2026-09-30 [Architecture & Setup]: System architecture designed for TrialMatch (Path One submission for DEV x Sanity Challenge). Verified `pnpm` v11.21.0, `@sanity/client` v8.9.0, `@modelcontextprotocol/sdk` v1.31.0, Next.js v16.3.7, and Vercel AI SDK v7.0.123. Checked agent-reach channels.

## Key Decisions (Never Re-Litigate)
- [Package Manager]: Use `pnpm` exclusively across all development, scripts, and sub-chat prompts (v11.21.0 verified on machine).
- [Challenge Target]: DEV Community x Sanity Challenge Path One ("Ship an Agent That Queries Real Content"). Deadline: October 4, 2026.
- [Target Corpus]: ~100 active, recruiting oncology clinical trials from ClinicalTrials.gov API v2, indexed in Sanity Studio dataset and Sanity Knowledge Base.
- [Evaluation Strategy]: 3-Arm Evaluation benchmark (Structured Sanity Agent vs Naive Keyword Search vs Bare LLM) across 10 complex patient profiles to prove necessity of structured schemas.

## Current Implementation State
Workspace initialized at `/Users/devabhishek/withaiprojects/sanitychallenge/path1`. Awaiting Abhishek's sign-off on architecture and Phase 1 roadmap before executing sub-chat prompts.

## Known Gotchas
- Sanity Knowledge Bases (beta) have a hard ceiling of 150 documents. We constrain our oncology trial dataset to ~100 highly curated trials to fit comfortably within this budget while maximizing biomarker diversity.
- Sanity Context MCP requires an Organization API Token with "Context Viewer" permissions; using a Project API token triggers a 403 Forbidden.
- ClinicalTrials.gov API v2 returns unformatted, dense criteria text in `eligibilityModule.eligibilityCriteria`; an ingestion normalization step is required to extract structured biomarker arrays and prior therapy rules before publishing to Sanity.
