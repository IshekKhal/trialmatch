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
      {/* Header with Navigation */}
      <header className="app-header">
        <div className="brand-section">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Dna size={22} color="#FFFFFF" />
            </div>
            <div>
              <h1 className="brand-title">
                Trial<span>Match</span>
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Precision Oncology Protocol Matching &amp; Verification
              </div>
            </div>
          </Link>
          <span className="brand-badge">Path One: Sanity Context Agent</span>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--bg-panel)',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              transition: 'all 0.15s ease',
            }}
          >
            <Swords size={16} />
            The Duel (Live Match)
          </Link>

          <Link
            href="/benchmark"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0B1120',
              background: 'var(--blue-accent)',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--blue-accent)',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.3)',
            }}
          >
            <BarChart3 size={16} />
            3-Arm Benchmark
          </Link>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              background: 'var(--bg-panel-subtle)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Award size={14} color="var(--amber-main)" />
            DEV x Sanity 2026
          </span>
        </div>
      </header>

      {/* Main Benchmark Runner Component */}
      <BenchmarkRunner initialSummary={initialSummary} />
    </main>
  );
}
