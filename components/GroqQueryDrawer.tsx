'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Terminal, Clock, HardDrive } from 'lucide-react';

interface GroqQueryDrawerProps {
  groqQuery: string;
  groqParams: Record<string, any>;
  executionTimeMs: number;
  dataSource: 'sanity-live' | 'local-normalized';
  summary?: string;
}

export function GroqQueryDrawer({
  groqQuery,
  groqParams,
  executionTimeMs,
  dataSource,
  summary,
}: GroqQueryDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(groqQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="groq-drawer">
      <button
        type="button"
        className="groq-drawer-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="var(--emerald-main)" />
          <span>View GROQ Query &amp; Safety Audit Trace</span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--emerald-main)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {executionTimeMs}ms
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="groq-drawer-content">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Execution: <strong>{executionTimeMs}ms</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HardDrive size={12} /> Engine: <strong>{dataSource === 'sanity-live' ? 'Sanity Production Dataset' : 'Local Ingested Engine'}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="filter-toggle-btn"
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              {copied ? <Check size={12} color="var(--emerald-main)" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy GROQ'}
            </button>
          </div>

          {summary && (
            <div style={{ marginBottom: '12px', color: '#E2E8F0', fontSize: '12px', lineHeight: '1.4' }}>
              <span style={{ color: 'var(--emerald-main)', fontWeight: 700 }}>CLINICAL SUMMARY: </span>
              {summary}
            </div>
          )}

          <div style={{ marginBottom: '8px', color: 'var(--text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Deterministic GROQ Query:
          </div>
          <pre
            style={{
              background: '#04070D',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #1E293B',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxWidth: '100%',
              boxSizing: 'border-box',
              color: '#38BDF8',
              marginBottom: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.5',
            }}
          >
            {groqQuery}
          </pre>

          <div style={{ color: 'var(--text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Bound Query Parameters:
          </div>
          <div>
            {Object.entries(groqParams).map(([key, value]) => (
              <span key={key} className="query-param-badge">
                ${key}: <strong>{String(value)}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
