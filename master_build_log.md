# TrialMatch — Master Build Log

> **Protocol**: Append-only. No deletions unless a component is explicitly deprecated. Every entry records exact decisions, errors, research findings, sub-chat prompts issued, and code verification.

---

## Log Entry 001 | Project Initialization & Competitive Architecture
* **Timestamp**: 2026-09-30T11:25:00+05:30
* **Author / Coordinator**: Master Architect
* **Lead / Product Architect**: Abhishek
* **Phase**: 0 — Groundwork & Alignment

### 1. Vision & Problem Statement
* Clinical trial eligibility in oncology is a high-stakes matching problem. Flat keyword search returns false positives because it cannot evaluate complex exclusion criteria (e.g. prior therapy lines, biomarker mutations, washout periods).
* Bare LLMs hallucinate non-existent NCT IDs or recommend completed/closed trials.
* TrialMatch uses Sanity as a structured clinical trial repository and Knowledge Base, queried by an agent via Sanity Context MCP (Model Context Protocol).
* Target: DEV Community x Sanity Challenge (Path One: "Ship an Agent That Queries Real Content"). Deadline: October 4, 2026.

### 2. Market & Competitive Intelligence
* **Primary Competitor**: ZéroJour (by Sam Labbe) — 82 CVE security advisories parsed into structured fields. Evaluated on an 11-question 3-arm benchmark:
  * Sanity Agent: 9/11
  * Keyword Search: 1/11
  * Bare LLM: 0/11
* **TrialMatch Moat**: Healthcare matching has higher stakes than CVEs. A 10-patient benchmark demonstrating safety exclusions will prove why structured content is non-negotiable.

### 3. Tooling & Environment Decisions (LOCKED)
* **Package Manager**: `pnpm` exclusively (v11.21.0 verified on local system).
* **Sanity Client**: `@sanity/client` v8.9.0.
* **MCP SDK**: `@modelcontextprotocol/sdk` v1.31.0.
* **Web Framework**: Next.js v16.3.7.
* **AI Orchestration**: Vercel AI SDK (`ai` v7.0.123).
* **Late-2026 Model Tiers (Verified via Live Web Search)**:
  * **Frontier / Reasoning Flagships**: GPT-6 Astra ($10/$50), Claude Fable 5.1 ($10/$50), Gemini 3.1 Pro ($2/$12).
  * **Workhorse Reasoning**: Claude Opus 5.5 ($4/$20), GPT-6 Sol ($2/$10), Claude Sonnet 5 ($2/$10).
  * **High-Volume / Fast Workhorses**: Gemini 3.8 Flash ($0.75/$3.75), GPT-6 Luna, Claude Haiku 4.5 ($1.00/$5.00).
* **Selected TrialMatch Agent Model**: Gemini 3.8 Flash or Claude Haiku 4.5 for high-volume agent routing and GROQ query formulation; GPT-6 Sol or Claude Opus 5.5 for benchmark evaluation auditing.

### 4. Architectural Gotchas Identified
* **Gotcha 1 (Sanity Knowledge Base Beta Limit)**: Sanity Knowledge Bases currently index up to 150 documents. We strictly scope our initial oncology trial ingestion to 100 high-yield precision oncology trials.
* **Gotcha 2 (Sanity Context MCP Auth)**: Context MCP requires an Organization API Token with "Context Viewer" permissions; using a Project API token produces a 403 Forbidden.
* **Gotcha 3 (ClinicalTrials.gov Data Format)**: Raw eligibility criteria in API v2 are free-text strings. An automated normalization script must parse these into structured biomarker arrays and prior therapy rules before inserting into Sanity.

### 5. Master Build Log Governance
* The Master Chat maintains and writes `master_build_log.md`.
* Each sub-chat prompt requires the sub-chat to return a structured debrief block upon completion.
* The Master Chat reviews the code, audits it, and appends the entry chronologically. Zero deletions.

---

## Log Entry 002 | Competitive UI/UX Teardown (ZéroJour Inspection)
* **Timestamp**: 2026-09-30T11:28:15+05:30
* **Author / Coordinator**: Master Architect
* **Lead / Product Architect**: Abhishek
* **Phase**: 0 — Groundwork & UX Architecture

### 1. Direct Inspection of slabbdev/zerojour
* Inspected repository via GitHub CLI (`gh api`).
* **Input Architecture**: ZeroJour avoids multi-field complex forms. It uses a single input area backed by clickable "Example Question Chips" (`.exq`). A user or judge clicks one chip, and it immediately populates and runs.
* **Output Architecture ("The Duel")**: ZeroJour's interface is a split-screen duel:
  * Left Panel: Sanity Context (Structured GROQ + KB) with green WIN indicators, exact GROQ queries, and tool execution traces.
  * Right Panel: Naive Flat Keyword Search with red LOSE indicators, showing why keyword search missed version bounds or failed.
  * Top Bar: High-level scoreboard showing running evaluation tallies.
* **Friction Level**: Ultra-low. Zero build step for the demo UI (uses lightweight HTTP server with vanilla HTML/CSS), plus dedicated CLI evaluation runners (`npm run eval`).

### 2. Architectural Decisions for TrialMatch UX
* **Adopt the "Duel" Paradigm**: TrialMatch will feature a side-by-side duel view (Structured Agent vs Naive Keyword Search) with clickable clinical scenario chips (e.g. "EGFR Exon 20 Lung Cancer (TX)", "KRAS G12C Colon Cancer (CA)").
* **Safety Failure Highlighting**: When the keyword arm returns a trial that the patient is medically excluded from, the UI will highlight the safety violation in red (e.g. "SAFETY VIOLATION: Patient excluded by prior chemotherapy protocol").
* **Sub-Chat Prompts Format**: All sub-chat prompts are stored in `prompt.txt` as clean, raw text files without markdown decor.

---

## Log Entry 003 | Phase 1A Completion: ClinicalTrials.gov Ingestion Engine
* **Timestamp**: 2026-09-30T11:41:00+05:30
* **Author / Coordinator**: Implementation Agent
* **Lead / Product Architect**: Abhishek
* **Phase**: 1A — Data Ingestion & Biomarker Enrichment

### 1. Ingestion Pipeline Implementation
* Built standalone TypeScript ingestion script at `scripts/ingest_trials.ts` executed via `tsx` under `pnpm`.
* Queries official ClinicalTrials.gov API v2 (`https://clinicaltrials.gov/api/v2/studies`).
* Handles API v2 field naming schema (`ContactsLocationsModule`).
* Employs token-based pagination across 6 pages (5.77 seconds total execution time).
* Validates every record and the complete 100-trial dataset against strict Zod schemas (`NormalizedDatasetSchema`).
* Saves normalized dataset to `data/trials_normalized.json` (1.2 MB).

### 2. Extraction & Normalization Metrics
* **Total Trials**: Exactly 100 active, recruiting precision oncology clinical trials.
* **Biomarkers Distribution**:
  * EGFR: 45
  * HER2: 38
  * ALK: 14
  * BRAF: 11
  * KRAS: 10
  * MET: 8
  * ROS1: 6
  * BRCA1: 6
  * RET: 5
  * G12C: 4
  * BRCA2: 4
  * BRCA: 4
  * V600E: 2
  * NTRK: 2
  * Exon 20: 1
* **Phase Breakdown**: Phase 2 (38), Phase 1 (30), NA (24), Phase 3 (7), Phase 4 (1).
* **Sample NCT IDs**: NCT05376891, NCT05362760, NCT06518382, NCT06830694, NCT07492342.

---

## Log Entry 004 | Phase 1B Verification & Model Architecture Lock
* **Timestamp**: 2026-09-30T12:08:00+05:30
* **Author / Coordinator**: Master Architect
* **Lead / Product Architect**: Abhishek
* **Phase**: 1B — Sanity Studio Schemas & Batch Seeding Engine

### 1. Verification of Phase 1B
* **Schemas**: Implemented `clinicalTrial` and `protocolRule` schemas with strict types, custom validations, and structureTool configuration.
* **Batch Import Script**: `scripts/seed_sanity.ts` verified via local dry-run. It validates all 100 trials, 1,144 locations, 244 interventions, and 5 protocol rules.
* **Array Object Keys Gotcha**: Implemented deterministic key generation (`loc-${nctId}-${idx}` and `intv-${nctId}-${idx}`) to satisfy Sanity's mutation requirements for array items.
* **Compiler Status**: `pnpm tsc --noEmit` exits with code 0 across the entire workspace.

### 2. Model Architecture Decisions (LOCKED)
* **Agent Engine**: **Claude Haiku 4.5** (`@ai-sdk/anthropic`). Selected for top-tier tool calling and zero-hallucination GROQ query generation.
* **Benchmark Judge**: **Gemini 3.8 Flash** (`@ai-sdk/google`). Selected for high reasoning capabilities, large context window, and ultra-low evaluation cost.
* **Dataset Seeding**: Ready for live Sanity project insertion upon credential input in `.env`.

---

## Log Entry 005 | Phase 1C Completion: Next.js Web App, Sanity Agent & The Duel UI
* **Timestamp**: 2026-09-30T12:30:00+05:30
* **Author / Coordinator**: Implementation Agent
* **Lead / Product Architect**: Abhishek
* **Phase**: 1C — Next.js Web Application, Sanity Context Agent & The Duel Side-by-Side UI

### 1. Implementation Summary
* **Next.js Web Application**: Built modern, high-performance Next.js 16 application with React 19 in `path1` using `pnpm`.
* **Live Sanity Seeding**: Seeded all 100 oncology clinical trials and 5 foundational protocol guidance rules into Sanity Project `6xsr2k42` (`production` dataset). Verified via live GROQ counts.
* **Dual Data Engine (`lib/sanity.ts`)**: Auto-detects live Sanity connection (`@sanity/client`) with instant fallback to local normalized dataset (`data/trials_normalized.json`).
* **Structured Agent (`lib/agent.ts`)**: Converts patient narrative into deterministic GROQ query enforcing strict biomarker targeting, active recruitment, prior therapy permission, and site location.
* **Naive Keyword Search (`lib/naive_search.ts`)**: Unconstrained flat text search highlighting clinical hazards: chemo exclusion breaches, lexical collisions (e.g. eGFR renal lab vs EGFR oncogene), and disease mismatches.
* **The Duel UI (`components/DuelArena.tsx`)**: Side-by-side split screen with live Scoreboard, 8 quick-fill clinical preset chips, responsive free-text input with filter overrides, and expandable GROQ query drawer.
* **Build & Test Verification**: `pnpm build` creates production bundles in 758ms with 0 errors. All 8 presets and custom patient queries verified via automated integration tests.



