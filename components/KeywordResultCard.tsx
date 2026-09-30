'use client';

import React from 'react';
import { ExternalLink, AlertTriangle, MapPin, Search } from 'lucide-react';
import { NaiveKeywordMatch } from '@/lib/types';

interface KeywordResultCardProps {
  match: NaiveKeywordMatch;
  index: number;
}

export function KeywordResultCard({ match, index }: KeywordResultCardProps) {
  const { trial, matchedKeywords, isSafetyViolation, violationMessage, violationRule } = match;

  const primaryLocation =
    trial.locations && trial.locations.length > 0 ? trial.locations[0] : null;
  const facilityDisplay = primaryLocation
    ? `${primaryLocation.facility || 'Clinical Center'}, ${primaryLocation.city || ''}, ${primaryLocation.state || ''}`
    : 'Active Trial Location';

  return (
    <div className={`result-card keyword-card ${isSafetyViolation ? 'violation-card' : ''}`}>
      <div className="card-top">
        <a
          href={`https://clinicaltrials.gov/study/${trial.nctId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nct-id-link"
          title="Open in ClinicalTrials.gov"
        >
          {trial.nctId}
          <ExternalLink size={12} />
        </a>

        <div className="badge-row">
          {isSafetyViolation ? (
            <span className="mini-badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={11} />
              Safety Hazard Detected
            </span>
          ) : (
            <span className="mini-badge phase" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Search size={11} />
              Keyword Match
            </span>
          )}
          {trial.phase && trial.phase !== 'NA' && (
            <span className="mini-badge phase">{trial.phase}</span>
          )}
        </div>
      </div>

      <h4 className="card-title">
        {trial.officialTitle || trial.briefTitle}
      </h4>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Matched Text Tokens:</span>
        {matchedKeywords.map((kw) => (
          <span
            key={kw}
            className="mini-badge phase"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            "{kw}"
          </span>
        ))}
      </div>

      <div className="card-location">
        <MapPin size={13} color="var(--text-muted)" />
        <span>{facilityDisplay}</span>
      </div>

      {isSafetyViolation ? (
        <div className="violation-banner">
          <div className="violation-title">
            <AlertTriangle size={13} />
            {violationRule || 'Critical Protocol Safety Breach'}
          </div>
          <div className="violation-detail">{violationMessage}</div>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Matched flat string in raw text without protocol constraint validation.
        </div>
      )}
    </div>
  );
}
