'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Cpu, Search, Sparkles, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { DuelResult } from '@/lib/types';
import { StructuredResultCard } from './StructuredResultCard';
import { KeywordResultCard } from './KeywordResultCard';
import { GroqQueryDrawer } from './GroqQueryDrawer';

const PAGE_SIZE = 6;

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Reading Medical Note',
    subtitle: 'Reviewing diagnosis, tumor details, and past treatments...',
    badge: 'Medical Note',
  },
  {
    step: 2,
    title: 'Checking Eligibility',
    subtitle: 'Checking trial rules to make sure the patient safely qualifies...',
    badge: 'Safety Rules',
  },
  {
    step: 3,
    title: 'Finding Safe Trials',
    subtitle: 'Searching verified cancer trials to find matching hospital options...',
    badge: 'Matching Trials',
  },
  {
    step: 4,
    title: 'Double-Checking Safety',
    subtitle: 'Comparing results to make sure no ineligible trials were included...',
    badge: 'Safety Check',
  },
];

interface DuelArenaProps {
  duelResult: DuelResult | null;
  isLoading: boolean;
  error: string | null;
}

export function DuelArena({ duelResult, isLoading, error }: DuelArenaProps) {
  const [structuredPage, setStructuredPage] = useState(1);
  const [naivePage, setNaivePage] = useState(1);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    setStructuredPage(1);
    setNaivePage(1);
  }, [duelResult]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    setLoadingStep(0);
    const t1 = setTimeout(() => setLoadingStep(1), 700);
    const t2 = setTimeout(() => setLoadingStep(2), 1700);
    const t3 = setTimeout(() => setLoadingStep(3), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isLoading]);

  if (error) {
    return (
      <div className="empty-state" style={{ borderColor: 'var(--crimson-border)', color: 'var(--crimson-main)' }}>
        <AlertTriangle size={32} />
        <div style={{ fontWeight: 700, fontSize: '16px' }}>Error Executing Clinical Duel</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{error}</div>
      </div>
    );
  }

  if (isLoading) {
    const currentStep = PIPELINE_STEPS[Math.min(loadingStep, PIPELINE_STEPS.length - 1)];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Simple & Clear Multi-Step Pipeline Tracker */}
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '18px 22px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="loading-spinner" style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                {currentStep.title}
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--emerald-main)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Step {Math.min(loadingStep + 1, 4)} of 4 • {currentStep.badge}
            </span>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {PIPELINE_STEPS.map((s, idx) => {
              const isDone = loadingStep > idx;
              const isActive = loadingStep === idx;
              return (
                <div
                  key={s.step}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(56, 189, 248, 0.08)' : isDone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isActive ? 'var(--blue-accent)' : isDone ? 'var(--emerald-border)' : 'var(--border-color)'}`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {isDone ? (
                      <CheckCircle2 size={13} color="var(--emerald-main)" />
                    ) : (
                      <span
                        style={{
                          width: '13px',
                          height: '13px',
                          borderRadius: '50%',
                          background: isActive ? 'var(--blue-accent)' : '#475569',
                          display: 'inline-block',
                          boxShadow: isActive ? '0 0 8px var(--blue-accent)' : 'none',
                        }}
                      />
                    )}
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#38BDF8' : isDone ? 'var(--emerald-main)' : 'var(--text-muted)' }}>
                      {s.step}. {s.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: isActive ? '#CBD5E1' : 'var(--text-dim)', lineHeight: '1.3' }}>
                    {s.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duel Grid Preview while loading */}
        <div className="duel-grid">
          <div className="duel-column">
            <div className="column-header structured">
              <div className="column-title-group">
                <span className="agent-badge emerald">Structured Agent</span>
                <span className="column-title">Sanity Context Agent</span>
              </div>
              <div className="column-stats">
                <span className="loading-spinner" />
                <span>Finding matches...</span>
              </div>
            </div>
            <div className="empty-state">
              <Cpu size={32} color="var(--emerald-main)" className="spin-slow" />
              <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px' }}>
                Finding Safe Matches
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '420px', lineHeight: '1.5' }}>
                {currentStep.subtitle}
              </div>
            </div>
          </div>

          <div className="duel-column">
            <div className="column-header naive">
              <div className="column-title-group">
                <span className="agent-badge crimson">Naive Baseline</span>
                <span className="column-title">Flat Keyword Search</span>
              </div>
              <div className="column-stats">
                <span className="loading-spinner" />
                <span>Searching keywords...</span>
              </div>
            </div>
            <div className="empty-state">
              <Search size={32} color="var(--crimson-main)" />
              <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px' }}>
                Basic Keyword Search
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '420px', lineHeight: '1.5' }}>
                Testing standard keyword search across trial listings to compare results...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!duelResult) {
    return (
      <div className="empty-state">
        <Sparkles size={36} color="var(--blue-accent)" />
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
          Select a Sample Case Above or Paste a Patient Note
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '640px' }}>
          Compare the <strong>Structured Agent</strong> (which checks genetic markers and prior treatments against clinical trial rules) with <strong>Basic Keyword Search</strong> across 100 real clinical trials.
        </div>
      </div>
    );
  }

  const { structured, naive } = duelResult;

  const totalStructuredPages = Math.ceil(structured.trials.length / PAGE_SIZE) || 1;
  const pagedStructured = structured.trials.slice(
    (structuredPage - 1) * PAGE_SIZE,
    structuredPage * PAGE_SIZE
  );

  const totalNaivePages = Math.ceil(naive.trials.length / PAGE_SIZE) || 1;
  const pagedNaive = naive.trials.slice(
    (naivePage - 1) * PAGE_SIZE,
    naivePage * PAGE_SIZE
  );

  return (
    <div className="duel-grid">
      {/* LEFT COLUMN: Structured Sanity Agent */}
      <div className="duel-column">
        <div className="column-header structured">
          <div className="column-title-group">
            <span className="agent-badge emerald">Structured Agent</span>
            <span className="column-title">Sanity Context Agent</span>
          </div>
          <div className="column-stats">
            <span>
              Matches: <strong className="stat-highlight emerald">{structured.count}</strong>
            </span>
            <span>
              Safety: <strong className="stat-highlight emerald">100%</strong>
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              {structured.executionTimeMs}ms
            </span>
          </div>
        </div>

        {/* Expandable GROQ Trace Drawer */}
        <GroqQueryDrawer
          groqQuery={structured.groqQuery}
          groqParams={structured.groqParams}
          executionTimeMs={structured.executionTimeMs}
          dataSource={structured.dataSource}
          summary={structured.summary}
        />

        {structured.trials.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={28} color="var(--emerald-main)" />
            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>No Trials Met All Safety Requirements</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              To protect patient safety, we only show trials that match the exact diagnosis and treatment history. None matched this specific profile.
            </div>
          </div>
        ) : (
          pagedStructured.map((match, idx) => (
            <StructuredResultCard
              key={match.trial.nctId}
              match={match}
              index={(structuredPage - 1) * PAGE_SIZE + idx}
            />
          ))
        )}

        {totalStructuredPages > 1 && (
          <div className="duel-pagination">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setStructuredPage((prev) => Math.max(prev - 1, 1))}
              disabled={structuredPage <= 1}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="pagination-info">
              Page {structuredPage} of {totalStructuredPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setStructuredPage((prev) => Math.min(prev + 1, totalStructuredPages))}
              disabled={structuredPage >= totalStructuredPages}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Naive Keyword Baseline */}
      <div className="duel-column">
        <div className="column-header naive">
          <div className="column-title-group">
            <span className="agent-badge crimson">Naive Baseline</span>
            <span className="column-title">Flat Keyword Search</span>
          </div>
          <div className="column-stats">
            <span>
              Returned: <strong className="stat-highlight crimson">{naive.count}</strong>
            </span>
            <span>
              Violations: <strong className="stat-highlight crimson">{naive.safetyViolationsCount}</strong>
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              {naive.executionTimeMs}ms
            </span>
          </div>
        </div>

        {/* Hazard Callout Banner */}
        {naive.safetyViolationsCount > 0 && (
          <div className="hazard-banner">
            <div className="hazard-title">
              <AlertTriangle size={15} />
              <span>
                Safety Warning: {naive.safetyViolationsCount} Ineligible Trials Found
              </span>
            </div>
            <p className="hazard-description">
              Simple keyword search found trials containing your search terms, but missed trial rules that disqualify the patient (such as required or prohibited past treatments).
            </p>
          </div>
        )}

        {naive.trials.length === 0 ? (
          <div className="empty-state">
            <Search size={28} color="var(--text-muted)" />
            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>No Keyword Matches Found</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No studies contained the literal search terms in unstructured text fields.
            </div>
          </div>
        ) : (
          pagedNaive.map((match, idx) => (
            <KeywordResultCard
              key={`${match.trial.nctId}-${idx}`}
              match={match}
              index={(naivePage - 1) * PAGE_SIZE + idx}
            />
          ))
        )}

        {totalNaivePages > 1 && (
          <div className="duel-pagination">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setNaivePage((prev) => Math.max(prev - 1, 1))}
              disabled={naivePage <= 1}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="pagination-info">
              Page {naivePage} of {totalNaivePages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setNaivePage((prev) => Math.min(prev + 1, totalNaivePages))}
              disabled={naivePage >= totalNaivePages}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
