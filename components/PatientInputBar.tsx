'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, Play, RotateCcw, FileText } from 'lucide-react';
import { PatientProfile } from '@/lib/types';

interface PatientInputBarProps {
  initialProfile?: PatientProfile;
  onSubmit: (profile: PatientProfile) => void;
  isLoading: boolean;
}

export function PatientInputBar({
  initialProfile,
  onSubmit,
  isLoading,
}: PatientInputBarProps) {
  const [freeText, setFreeText] = useState(initialProfile?.freeText || '');
  const [showFilters, setShowFilters] = useState(false);
  const [condition, setCondition] = useState(initialProfile?.condition || '');
  const [biomarker, setBiomarker] = useState(initialProfile?.biomarker || '');
  const [priorTherapy, setPriorTherapy] = useState(initialProfile?.priorTherapy || '');
  const [state, setState] = useState(initialProfile?.state || '');

  // Update when initialProfile changes (e.g. when chip is clicked)
  React.useEffect(() => {
    if (initialProfile) {
      setFreeText(initialProfile.freeText || '');
      setCondition(initialProfile.condition || '');
      setBiomarker(initialProfile.biomarker || '');
      setPriorTherapy(initialProfile.priorTherapy || '');
      setState(initialProfile.state || '');
    }
  }, [initialProfile]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!freeText.trim() && !condition.trim() && !biomarker.trim()) return;

    // Only include structured filter overrides if the user explicitly opened the override panel
    onSubmit({
      freeText,
      condition: showFilters && condition.trim() ? condition.trim() : undefined,
      biomarker: showFilters && biomarker.trim() ? biomarker.trim() : undefined,
      priorTherapy: showFilters && priorTherapy.trim() ? priorTherapy.trim() : undefined,
      state: showFilters && state.trim() ? state.trim() : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setFreeText('');
    setCondition('');
    setBiomarker('');
    setPriorTherapy('');
    setState('');
  };

  return (
    <form className="input-section" onSubmit={handleSubmit}>
      <div className="input-label-row">
        <label htmlFor="patient-input" className="input-title">
          <FileText size={16} color="var(--blue-accent)" />
          Patient Clinical Profile & Treatment History
        </label>
        <button
          type="button"
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={13} />
          {showFilters ? 'Hide Structured Overrides' : 'Filter Overrides'}
        </button>
      </div>

      <textarea
        id="patient-input"
        className="patient-textarea"
        placeholder="Enter unstructured patient oncological record (e.g., '58yo with Non-Small Cell Lung Cancer, EGFR Exon 20 insertion, prior platinum chemotherapy completed 4 months ago, looking for recruiting trials in Texas')..."
        value={freeText}
        onChange={(e) => {
          setFreeText(e.target.value);
          // If the user is modifying text without the filter panel open, clear old preset overrides
          if (!showFilters) {
            setCondition('');
            setBiomarker('');
            setPriorTherapy('');
            setState('');
          }
        }}
        onKeyDown={handleKeyDown}
        rows={3}
      />

      {showFilters && (
        <div className="structured-filter-panel">
          <div className="filter-field">
            <label className="filter-label">Primary Condition</label>
            <input
              type="text"
              className="filter-input"
              placeholder="e.g. Lung, Colorectal, Breast"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">Target Biomarker</label>
            <input
              type="text"
              className="filter-input"
              placeholder="e.g. EGFR, KRAS, BRAF, HER2"
              value={biomarker}
              onChange={(e) => setBiomarker(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">Prior Chemotherapy Rule</label>
            <input
              type="text"
              className="filter-input"
              placeholder="e.g. Chemotherapy Allowed"
              value={priorTherapy}
              onChange={(e) => setPriorTherapy(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">US State</label>
            <input
              type="text"
              className="filter-input"
              placeholder="e.g. Texas, California, Florida"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="action-row">
        {freeText && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Clear
          </button>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || (!freeText.trim() && !biomarker.trim() && !condition.trim())}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner" />
              Executing Duel...
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              Run Clinical Duel
            </>
          )}
        </button>
      </div>
    </form>
  );
}
