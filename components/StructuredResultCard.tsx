'use client';

import React from 'react';
import { ExternalLink, ShieldCheck, MapPin, CheckCircle2, Dna } from 'lucide-react';
import { StructuredMatch } from '@/lib/types';

interface StructuredResultCardProps {
  match: StructuredMatch;
  index: number;
}

export function StructuredResultCard({ match, index }: StructuredResultCardProps) {
  const { trial, matchRationale, matchedBiomarkers, priorTherapyCompatibility, locationMatch } = match;

  const primaryLocation =
    trial.locations && trial.locations.length > 0 ? trial.locations[0] : null;
  const facilityDisplay =
    locationMatch ||
    (primaryLocation
      ? `${primaryLocation.facility || 'Clinical Center'}, ${primaryLocation.city || ''}, ${primaryLocation.state || ''}`
      : 'Active Trial Location');

  return (
    <div className="result-card structured-card">
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
          <span className="mini-badge safe" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={11} />
            Verified Protocol Match
          </span>
          {trial.phase && trial.phase !== 'NA' && (
            <span className="mini-badge phase">{trial.phase}</span>
          )}
        </div>
      </div>

      <h4 className="card-title">
        {trial.officialTitle || trial.briefTitle}
      </h4>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Biomarkers:</span>
        {(trial.targetBiomarkers || []).map((bio) => {
          const isTargeted = matchedBiomarkers.some(
            (m) => m.toLowerCase() === bio.toLowerCase()
          );
          return (
            <span
              key={bio}
              className="mini-badge biomarker"
              style={
                isTargeted
                  ? { background: 'rgba(16, 185, 129, 0.2)', color: 'var(--emerald-main)', borderColor: 'var(--emerald-border)' }
                  : undefined
              }
            >
              <Dna size={10} style={{ display: 'inline', marginRight: '3px' }} />
              {bio}
            </span>
          );
        })}
      </div>

      <div className="card-location">
        <MapPin size={13} color="var(--text-muted)" />
        <span>{facilityDisplay}</span>
      </div>

      <div className="rationale-box">
        <div className="rationale-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} color="var(--emerald-main)" />
          Deterministic Protocol Grounding
        </div>
        <div>{matchRationale}</div>
      </div>
    </div>
  );
}
