'use client';

import React, { useState, useEffect } from 'react';
import { BenchmarkSuiteSummary } from '@/lib/eval_runner';
import { BenchmarkTable } from './BenchmarkTable';
import { Play, RotateCw, Download, Check, AlertCircle, Sparkles, FileText } from 'lucide-react';

interface BenchmarkRunnerProps {
  initialSummary?: BenchmarkSuiteSummary | null;
}

export function BenchmarkRunner({ initialSummary }: BenchmarkRunnerProps) {
  const [summary, setSummary] = useState<BenchmarkSuiteSummary | null>(initialSummary || null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch benchmark on mount if not provided
  useEffect(() => {
    if (!initialSummary) {
      fetchBenchmark(false);
    }
  }, [initialSummary]);

  async function fetchBenchmark(forceRefresh: boolean) {
    setIsRunning(true);
    setError(null);
    try {
      const url = forceRefresh ? '/api/benchmark?refresh=true' : '/api/benchmark';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Benchmark fetch failed with status ${res.status}`);
      }
      const data: BenchmarkSuiteSummary = await res.json();
      setSummary(data);
      if (forceRefresh) {
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 3500);
      }
    } catch (err: any) {
      console.error('Error fetching benchmark:', err);
      setError(err?.message || 'Failed to execute benchmark suite');
    } finally {
      setIsRunning(false);
    }
  }

  const handleCopyMarkdown = async () => {
    if (!summary) return;
    try {
      const res = await fetch('/data/eval_summary.md');
      let text = '';
      if (res.ok) {
        text = await res.text();
      } else {
        text = `# TrialMatch 3-Arm Benchmark Summary\n\nArm 1 Precision: ${summary.arm1Stats.avgPrecision}%\nArm 2 Precision: ${summary.arm2Stats.avgPrecision}%\nArm 3 Precision: ${summary.arm3Stats.avgPrecision}%\nTotal Safety Violations in Naive Search: ${summary.arm2Stats.totalSafetyViolations}`;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
          borderRadius: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              10-Patient Gold Standard Clinical Benchmark
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--emerald-main)',
                background: 'var(--emerald-bg)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid var(--emerald-border)',
              }}
            >
              100 TRIALS
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Automated comparative evaluation: Structured Sanity Agent vs Naive Keyword vs Bare LLM.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleCopyMarkdown}
            disabled={!summary || isRunning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-panel-subtle)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: summary && !isRunning ? 'pointer' : 'not-allowed',
              opacity: summary && !isRunning ? 1 : 0.6,
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={16} color="var(--emerald-main)" /> : <FileText size={16} />}
            {copied ? 'Copied DEV Post Report!' : 'Copy Submission Report'}
          </button>

          <button
            onClick={() => fetchBenchmark(true)}
            disabled={isRunning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isRunning ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            {isRunning ? (
              <>
                <RotateCw size={16} className="spin" />
                <span>Running Evaluation (10 Cases)...</span>
              </>
            ) : justCompleted ? (
              <>
                <Check size={16} />
                <span>Evaluation Complete!</span>
              </>
            ) : (
              <>
                <RotateCw size={16} />
                <span>Run Live Benchmark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: 'var(--crimson-bg)',
            border: '1px solid var(--crimson-border)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--crimson-main)',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Overlay State */}
      {isRunning && !summary && (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--blue-accent)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Executing 3-Arm Evaluation Suite
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Querying live Sanity GROQ, evaluating keyword exclusion criteria, and testing zero-data LLM hallucinations...
            </p>
          </div>
        </div>
      )}

      {/* Table Results */}
      {summary && <BenchmarkTable summary={summary} />}
    </div>
  );
}
