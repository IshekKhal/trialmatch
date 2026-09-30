'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, Cpu, Search, Sparkles } from 'lucide-react';
import { DuelResult } from '@/lib/types';
import { StructuredResultCard } from './StructuredResultCard';
import { KeywordResultCard } from './KeywordResultCard';
import { GroqQueryDrawer } from './GroqQueryDrawer';

interface DuelArenaProps {
  duelResult: DuelResult | null;
  isLoading: boolean;
  error: string | null;
}

export function DuelArena({ duelResult, isLoading, error }: DuelArenaProps) {
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
    return (
      <div className="duel-grid">
        <div className="duel-column">
          <div className="column-header structured">
            <div className="column-title-group">
              <span className="agent-badge emerald">Structured Agent</span>
              <span className="column-title">Sanity Context Agent</span>
            </div>
            <div className="column-stats">
              <span className="loading-spinner" />
              <span>Querying GROQ Schema...</span>
            </div>
          </div>
          <div className="empty-state">
            <Cpu size={30} color="var(--emerald-main)" className="spin-slow" />
            <div style={{ color: '#E2E8F0', fontWeight: 600 }}>Executing Deterministic GROQ Evaluation</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Parsing clinical biomarkers, prior therapy rules, and site coordinates...
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
              <span>Scanning Text Blobs...</span>
            </div>
          </div>
          <div className="empty-state">
            <Search size={30} color="var(--crimson-main)" />
            <div style={{ color: '#E2E8F0', fontWeight: 600 }}>Scanning Unstructured Titles &amp; Criteria</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Checking flat string containment across 100 raw protocol records...
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
          Select a Clinical Scenario Above or Run a Custom Patient Narrative
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '640px' }}>
          The Duel pits the <strong>Structured Sanity Agent</strong> (enforcing schema-level biomarker matching and prior therapy protocol rules) against <strong>Naive Keyword Search</strong> (unconstrained flat text search) across 100 real ClinicalTrials.gov oncology trials.
        </div>
      </div>
    );
  }

  const { structured, naive } = duelResult;

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
            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>No Trials Met Strict Clinical Criteria</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Zero protocol violations permitted. The patient's exact biomarker/prior therapy profile had no matching active slots.
            </div>
          </div>
        ) : (
          structured.trials.map((match, idx) => (
            <StructuredResultCard key={match.trial.nctId} match={match} index={idx} />
          ))
        )}
      </div>

      {/* RIGHT COLUMN: Naive Keyword Search */}
      <div className="duel-column">
        <div className="column-header naive">
          <div className="column-title-group">
            <span className="agent-badge crimson">Naive Baseline</span>
            <span className="column-title">Flat Keyword Search</span>
          </div>
          <div className="column-stats">
            <span>
              Matches: <strong className="stat-highlight">{naive.count}</strong>
            </span>
            <span>
              Violations: <strong className="stat-highlight crimson">{naive.safetyViolationsCount}</strong>
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              {naive.executionTimeMs}ms
            </span>
          </div>
        </div>

        {naive.safetyViolationsCount > 0 && (
          <div
            style={{
              background: 'var(--crimson-bg)',
              border: '1px solid var(--crimson-border)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12px',
              color: '#FECACA',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} color="var(--crimson-main)" style={{ flexShrink: 0 }} />
            <div>
              <strong>High Clinical Hazard:</strong> Naive search returned{' '}
              <strong style={{ color: 'var(--crimson-main)' }}>{naive.safetyViolationsCount}</strong> trials that match keyword tokens but directly exclude the patient's prior therapy, disease stage, or biomarker status!
            </div>
          </div>
        )}

        {naive.trials.length === 0 ? (
          <div className="empty-state">
            <Search size={28} color="var(--text-dim)" />
            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>No Keyword Matches Found</div>
          </div>
        ) : (
          naive.trials.map((match, idx) => (
            <KeywordResultCard
              key={`${match.trial.nctId}-${idx}`}
              match={match}
              index={idx}
            />
          ))
        )}
      </div>
    </div>
  );
}
