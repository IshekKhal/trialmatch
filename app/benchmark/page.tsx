import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { BenchmarkRunner } from '@/components/BenchmarkRunner';
import { BenchmarkSuiteSummary } from '@/lib/eval_runner';
import { Dna, Swords, BarChart3, Award } from 'lucide-react';

export const metadata = {
  title: 'TrialMatch — 3-Arm Clinical Evaluation Benchmark',
  description:
    '10 Gold-Standard Oncology Cases evaluated across Structured Sanity Agent, Naive Flat Keyword Search, and Bare LLM.',
};

export default function BenchmarkPage() {
  let initialSummary: BenchmarkSuiteSummary | null = null;

  try {
    const resultsPath = path.join(process.cwd(), 'data', 'eval_results.json');
    if (fs.existsSync(resultsPath)) {
      initialSummary = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to preload benchmark results on server:', err);
  }

  return (
    <main className="app-container">
      {/* Frosted Translucent Header with Apple Polish */}
      <header className="app-header">
        <Link href="/" className="brand-section">
          <div className="brand-icon-box">
            <Dna size={20} />
          </div>
          <div className="brand-meta-group">
            <h1 className="brand-title">
              Trial<span className="brand-highlight">Match</span>
            </h1>
            <span className="brand-subtitle-text">
              Precision Oncology Protocol Matching &amp; Verification
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <div className="nav-tabs-pill-group" role="tablist">
          <Link
            href="/"
            role="tab"
            aria-selected={false}
            className="nav-tab-pill"
          >
            <Swords size={13} />
            <span>The Duel (Live Match)</span>
          </Link>

          <Link
            href="/benchmark"
            role="tab"
            aria-selected={true}
            className="nav-tab-pill active"
          >
            <BarChart3 size={13} />
            <span>3-Arm Benchmark</span>
          </Link>
        </div>

        {/* Live Status Beacon & Challenge Badge */}
        <div className="header-status-group">
          <div className="status-beacon-pill">
            <span className="status-beacon-dot" />
            <span>Sanity Context MCP: Connected</span>
          </div>

          <div className="header-badge-pill">
            <Award size={13} />
            <span>DEV x Sanity 2026</span>
          </div>
        </div>
      </header>

      {/* Main Benchmark Runner Component */}
      <BenchmarkRunner initialSummary={initialSummary} />
    </main>
  );
}
