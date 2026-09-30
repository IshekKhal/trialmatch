'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Scoreboard } from '@/components/Scoreboard';
import { ScenarioChips } from '@/components/ScenarioChips';
import { PatientInputBar } from '@/components/PatientInputBar';
import { DuelArena } from '@/components/DuelArena';
import { CLINICAL_SCENARIOS } from '@/lib/scenarios';
import { ClinicalScenario, DuelResult, PatientProfile, ScoreboardStats } from '@/lib/types';
import { Dna, ShieldAlert, Award } from 'lucide-react';

export default function Home() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(CLINICAL_SCENARIOS[0].id);
  const [currentProfile, setCurrentProfile] = useState<PatientProfile>({
    freeText: CLINICAL_SCENARIOS[0].prompt,
    condition: CLINICAL_SCENARIOS[0].extracted.condition,
    biomarker: CLINICAL_SCENARIOS[0].extracted.biomarker,
    priorTherapy: CLINICAL_SCENARIOS[0].extracted.priorTherapy,
    state: CLINICAL_SCENARIOS[0].extracted.state,
    phase: CLINICAL_SCENARIOS[0].extracted.phase,
  });
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ScoreboardStats | null>(null);

  // Fetch initial scoreboard stats
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/trials');
        if (res.ok) {
          const json = await res.json();
          if (json.stats) setStats(json.stats);
        }
      } catch (e) {
        console.error('Failed to load initial dataset stats', e);
      }
    }
    loadStats();
  }, []);

  // Run the Duel with given patient profile
  const runDuel = useCallback(async (profile: PatientProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Duel execution failed with status ${res.status}`);
      }

      const data: DuelResult = await res.json();
      setDuelResult(data);
    } catch (err: any) {
      console.error('Duel execution error:', err);
      setError(err.message || 'An error occurred while executing the clinical duel.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute default preset scenario on mount
  useEffect(() => {
    runDuel(currentProfile);
  }, []);

  // Handle Preset Chip click: fills profile and immediately runs Duel with zero typing
  const handleSelectScenario = (scenario: ClinicalScenario) => {
    setActiveScenarioId(scenario.id);
    const newProfile: PatientProfile = {
      freeText: scenario.prompt,
      condition: scenario.extracted.condition,
      biomarker: scenario.extracted.biomarker,
      priorTherapy: scenario.extracted.priorTherapy,
      state: scenario.extracted.state,
      phase: scenario.extracted.phase,
    };
    setCurrentProfile(newProfile);
    runDuel(newProfile);
  };

  // Handle manual input submission
  const handleInputSubmit = (profile: PatientProfile) => {
    setActiveScenarioId(''); // Clear active preset tag since it is customized
    setCurrentProfile(profile);
    runDuel(profile);
  };

  return (
    <main className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
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
          <span className="brand-badge">Path One: Sanity Context Agent</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              background: 'var(--bg-panel)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Award size={14} color="var(--amber-main)" />
            DEV x Sanity Challenge 2026
          </span>
        </div>
      </header>

      {/* Scoreboard */}
      <Scoreboard
        totalCorpus={stats?.totalTrials || duelResult?.scoreboard.totalCorpus || 100}
        structuredMatches={duelResult?.scoreboard.structuredMatchCount || 0}
        naiveMatches={duelResult?.scoreboard.naiveMatchCount || 0}
        safetyViolations={duelResult?.scoreboard.safetyViolationsCount || 0}
        structuredAccuracy={duelResult?.scoreboard.structuredSafetyAccuracy || 100}
        naiveAccuracy={duelResult?.scoreboard.naiveSafetyAccuracy || 35}
        dataSource={duelResult?.structured.dataSource || stats?.dataSource || 'local-normalized'}
        isSearching={isLoading}
      />

      {/* Preset Chips */}
      <ScenarioChips
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
        disabled={isLoading}
      />

      {/* Patient Profile Input Bar */}
      <PatientInputBar
        initialProfile={currentProfile}
        onSubmit={handleInputSubmit}
        isLoading={isLoading}
      />

      {/* The Duel Arena (Side-by-Side Split Screen) */}
      <DuelArena duelResult={duelResult} isLoading={isLoading} error={error} />
    </main>
  );
}
