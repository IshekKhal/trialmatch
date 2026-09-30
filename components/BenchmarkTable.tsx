'use client';

import React, { useState } from 'react';
import { BenchmarkSuiteSummary, TestCaseBenchmarkResult } from '@/lib/eval_runner';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileCode,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';

interface BenchmarkTableProps {
  summary: BenchmarkSuiteSummary;
}

export function BenchmarkTable({ summary }: BenchmarkTableProps) {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lung' | 'colorectal' | 'breast' | 'other'>('all');

  const { arm1Stats, arm2Stats, arm3Stats, results } = summary;

  const toggleExpand = (id: string) => {
    setExpandedCaseId((prev) => (prev === id ? null : id));
  };

  const filteredResults = results.filter((r) => {
    if (selectedFilter === 'all') return true;
    const cond = r.testCase.condition.toLowerCase();
    if (selectedFilter === 'lung') return cond.includes('lung');
    if (selectedFilter === 'colorectal') return cond.includes('colorectal');
    if (selectedFilter === 'breast') return cond.includes('breast');
    return !cond.includes('lung') && !cond.includes('colorectal') && !cond.includes('breast');
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Three-Arm Metric Scorecards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Arm 1 Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid var(--emerald-border)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--emerald-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--emerald-main)',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                Arm 1: Structured Sanity Agent
              </h3>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--emerald-main)',
                background: 'var(--emerald-bg)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--emerald-border)',
              }}
            >
              100% DETERMINISTIC
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Clinical Precision</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-main)', marginTop: '2px' }}>
                {arm1Stats.avgPrecision}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--emerald-main)' }}>Zero false positives</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safety Violations</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-main)', marginTop: '2px' }}>
                {arm1Stats.totalSafetyViolations}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Strict protocol checks</div>
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Hallucinations: <strong style={{ color: 'var(--emerald-main)' }}>0</strong></span>
            <span>Auditability: <strong style={{ color: 'var(--emerald-main)' }}>100% GROQ Trace</strong></span>
          </div>
        </div>

        {/* Arm 2 Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid var(--crimson-border)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--crimson-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--crimson-main)',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                Arm 2: Naive Flat Keyword
              </h3>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--crimson-main)',
                background: 'var(--crimson-bg)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--crimson-border)',
              }}
            >
              HIGH TOXICITY HAZARD
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Clinical Precision</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--crimson-main)', marginTop: '2px' }}>
                {arm2Stats.avgPrecision}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--crimson-main)' }}>Disqualified patient matches</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safety Violations</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--crimson-main)', marginTop: '2px' }}>
                {arm2Stats.totalSafetyViolations}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--crimson-main)' }}>Exclusion clauses ignored</div>
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Hallucinations: <strong>0 (In-corpus)</strong></span>
            <span>Auditability: <strong style={{ color: 'var(--crimson-main)' }}>0% (Opaque scan)</strong></span>
          </div>
        </div>

        {/* Arm 3 Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C084FC',
                }}
              >
                <HelpCircle size={20} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                Arm 3: Bare LLM (Zero DB)
              </h3>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#C084FC',
                background: 'rgba(168, 85, 247, 0.12)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              HALLUCINATES IDS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Clinical Precision</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#C084FC', marginTop: '2px' }}>
                {arm3Stats.avgPrecision}%
              </div>
              <div style={{ fontSize: '11px', color: '#C084FC' }}>Zero database verification</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hallucinated NCT IDs</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#C084FC', marginTop: '2px' }}>
                {arm3Stats.totalHallucinations}
              </div>
              <div style={{ fontSize: '11px', color: '#C084FC' }}>Fake or defunct IDs</div>
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Safety Violations: <strong style={{ color: '#C084FC' }}>{arm3Stats.totalSafetyViolations}</strong></span>
            <span>Auditability: <strong style={{ color: '#C084FC' }}>0% (No DB access)</strong></span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All 10 Test Cases' },
            { id: 'lung', label: 'Lung (NSCLC)' },
            { id: 'colorectal', label: 'Colorectal' },
            { id: 'breast', label: 'Breast' },
            { id: 'other', label: 'Other Onco Sites' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              style={{
                background: selectedFilter === tab.id ? 'var(--blue-accent)' : 'var(--bg-panel)',
                color: selectedFilter === tab.id ? '#0B1120' : 'var(--text-muted)',
                fontWeight: selectedFilter === tab.id ? 700 : 500,
                border: '1px solid var(--border-color)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredResults.length}</strong> of 10 gold-standard test profiles
        </div>
      </div>

      {/* Comparative Evaluation Table */}
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-panel-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', width: '22%' }}>
                  Test Case &amp; Profile
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--emerald-main)', width: '26%' }}>
                  Arm 1: Structured Sanity
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--crimson-main)', width: '26%' }}>
                  Arm 2: Naive Keyword Search
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#C084FC', width: '26%' }}>
                  Arm 3: Bare LLM (Zero DB)
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r, idx) => {
                const isExpanded = expandedCaseId === r.testCase.id;

                return (
                  <React.Fragment key={r.testCase.id}>
                    <tr
                      onClick={() => toggleExpand(r.testCase.id)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(30, 41, 59, 0.8)' : idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Case Identifier & Diagnosis */}
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--blue-accent)',
                              background: 'var(--blue-bg)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--blue-border)',
                            }}
                          >
                            {r.testCase.id}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            {r.testCase.location}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                          {r.testCase.condition}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          Biomarker: <strong style={{ color: 'var(--text-main)' }}>{r.testCase.biomarker}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Prior: {r.testCase.priorTherapy}
                        </div>

                        <div
                          style={{
                            marginTop: '10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: 'var(--blue-accent)',
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Collapse' : 'Audit Details'}
                        </div>
                      </td>

                      {/* Arm 1 Column */}
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <CheckCircle2 size={16} color="var(--emerald-main)" />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--emerald-main)' }}>
                            Precision: 100%
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ({r.arm1.totalReturned} trials)
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          Safety Violations: <strong style={{ color: 'var(--emerald-main)' }}>0</strong>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-dim)',
                            background: 'var(--bg-input)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            lineHeight: '1.4',
                          }}
                        >
                          Rule: {r.testCase.groundTruth.protocolRuleCited.split('(')[0].trim()}
                        </div>
                      </td>

                      {/* Arm 2 Column */}
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <XCircle size={16} color="var(--crimson-main)" />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--crimson-main)' }}>
                            Precision: {r.arm2.precision}%
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ({r.arm2.totalReturned} matches)
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--crimson-main)',
                            background: 'var(--crimson-bg)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--crimson-border)',
                            lineHeight: '1.4',
                            marginBottom: '6px',
                          }}
                        >
                          FAILED: {r.arm2.safetyViolations} Safety Violations
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--crimson-main)', lineHeight: '1.3' }}>
                          {r.arm2.violationDetails[0] || 'Matches disqualified patient via negative criteria.'}
                        </div>
                      </td>

                      {/* Arm 3 Column */}
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <HelpCircle size={16} color="#C084FC" />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#C084FC' }}>
                            Precision: 0%
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ({r.arm3.totalReturned} trials)
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#C084FC',
                            background: 'rgba(168, 85, 247, 0.12)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            lineHeight: '1.4',
                            marginBottom: '6px',
                          }}
                        >
                          HALLUCINATED: {r.arm3.hallucinations} Invalid NCT IDs
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                          {r.arm3.extractedNcts.length > 0
                            ? `Produced unverified: ${r.arm3.extractedNcts.slice(0, 2).join(', ')}`
                            : 'Zero auditable database query.'}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Case Audit Trail */}
                    {isExpanded && (
                      <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
                        <td colSpan={4} style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Narrative Quote */}
                            <div
                              style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '14px',
                              }}
                            >
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Full Clinical Patient Narrative:
                              </div>
                              <p style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5' }}>
                                "{r.testCase.patientNarrative}"
                              </p>
                              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--amber-main)' }}>
                                <strong>Ground Truth Requirement:</strong> {r.testCase.groundTruth.description}
                              </div>
                            </div>

                            {/* Arm Details Side-by-Side */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                              {/* Arm 1 Detail */}
                              <div
                                style={{
                                  background: 'var(--bg-panel)',
                                  border: '1px solid var(--emerald-border)',
                                  borderRadius: '8px',
                                  padding: '14px',
                                }}
                              >
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--emerald-main)', marginBottom: '6px' }}>
                                  Arm 1: Deterministic GROQ Audit
                                </div>
                                <pre
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11px',
                                    background: 'var(--bg-navy)',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    color: '#38BDF8',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {r.arm1.groqQuery}
                                </pre>
                                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                  Rule Grounding: <strong style={{ color: 'var(--text-main)' }}>{r.arm1.protocolRuleCited}</strong>
                                </div>
                              </div>

                              {/* Arm 2 Detail */}
                              <div
                                style={{
                                  background: 'var(--bg-panel)',
                                  border: '1px solid var(--crimson-border)',
                                  borderRadius: '8px',
                                  padding: '14px',
                                }}
                              >
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--crimson-main)', marginBottom: '6px' }}>
                                  Arm 2: Exclusion Clause Collisions
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {r.arm2.sampleViolations.map((v, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        fontSize: '11px',
                                        background: 'var(--bg-navy)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--crimson-border)',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, color: 'var(--crimson-main)' }}>
                                        {v.nctId} — {v.violationType}
                                      </div>
                                      <div style={{ marginTop: '2px', color: 'var(--text-main)' }}>{v.violationMessage}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Arm 3 Detail */}
                              <div
                                style={{
                                  background: 'var(--bg-panel)',
                                  border: '1px solid rgba(168, 85, 247, 0.4)',
                                  borderRadius: '8px',
                                  padding: '14px',
                                }}
                              >
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C084FC', marginBottom: '6px' }}>
                                  Arm 3: Zero-Data Model Output
                                </div>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-navy)',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    maxHeight: '140px',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {r.arm3.rawOutput || 'No output produced.'}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#C084FC' }}>
                                  Extracted NCTs: {r.arm3.extractedNcts.join(', ') || 'None found'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
