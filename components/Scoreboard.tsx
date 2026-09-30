'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, Database, Activity } from 'lucide-react';

interface ScoreboardProps {
  totalCorpus?: number;
  structuredMatches?: number;
  naiveMatches?: number;
  safetyViolations?: number;
  structuredAccuracy?: number;
  naiveAccuracy?: number;
  dataSource?: 'sanity-live' | 'local-normalized';
  isSearching?: boolean;
}

export function Scoreboard({
  totalCorpus = 100,
  structuredMatches = 0,
  naiveMatches = 0,
  safetyViolations = 0,
  structuredAccuracy = 100,
  naiveAccuracy = 35,
  dataSource = 'local-normalized',
  isSearching = false,
}: ScoreboardProps) {
  return (
    <div className="scoreboard-container">
      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={13} color="var(--blue-accent)" />
          Curated Corpus
        </div>
        <div className="metric-value">{totalCorpus}</div>
        <div className="metric-sub">
          {dataSource === 'sanity-live' ? 'Sanity Live Dataset' : 'Local Ingested Trials'}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={13} color="var(--emerald-main)" />
          Structured Agent Safety
        </div>
        <div className="metric-value emerald">{structuredAccuracy}%</div>
        <div className="metric-sub">
          {isSearching
            ? 'Evaluating...'
            : `${structuredMatches} matches • 0 protocol breaches`}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={13} color="var(--crimson-main)" />
          Keyword Search Hazard
        </div>
        <div className="metric-value crimson">
          {safetyViolations > 0 ? `${safetyViolations} Violations` : '0 Breaches'}
        </div>
        <div className="metric-sub">
          {isSearching
            ? 'Scanning text...'
            : `${naiveMatches} matches • ~${100 - naiveAccuracy}% hazard rate`}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={13} color="var(--blue-accent)" />
          Safety Delta
        </div>
        <div className="metric-value" style={{ color: 'var(--blue-accent)' }}>
          +{100 - (naiveMatches > 0 ? naiveAccuracy : 100)}%
        </div>
        <div className="metric-sub">Structured GROQ precision advantage</div>
      </div>
    </div>
  );
}
