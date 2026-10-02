'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Scoreboard } from '@/components/Scoreboard';
import { ScenarioChips } from '@/components/ScenarioChips';
import { PatientInputBar } from '@/components/PatientInputBar';
import { DuelArena } from '@/components/DuelArena';
import { CLINICAL_SCENARIOS } from '@/lib/scenarios';
import { ClinicalScenario, DuelResult, PatientProfile, ScoreboardStats } from '@/lib/types';
import { Dna, ShieldAlert, Award, Swords, BarChart3 } from 'lucide-react';

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

  // Handle Preset Chip click: fills profile and immediately runs Duel with zero typing (clicking active chip toggles off)
  const handleSelectScenario = (scenario: ClinicalScenario) => {
    if (activeScenarioId === scenario.id) {
      setActiveScenarioId('');
      setCurrentProfile({ freeText: '' });
      return;
    }
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
      {/* Frosted Translucent Header with Apple Polish */}
      <header className="app-header">
        <Link href="/" className="brand-section">
          <div className="brand-icon-box">
            <Dna size={20} />
          </div>
          <div className="brand-meta-group">
            <h1 className="brand-title">
              Trial<span className="brand-highlight">Match</span>
            </h1>
            <span className="brand-subtitle-text">
              Precision Oncology Protocol Matching &amp; Verification
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <div className="nav-tabs-pill-group" role="tablist">
          <Link
            href="/"
            role="tab"
            aria-selected={true}
            className="nav-tab-pill active"
          >
            <Swords size={13} />
            <span>The Duel (Live Match)</span>
          </Link>

          <Link
            href="/benchmark"
            role="tab"
            aria-selected={false}
            className="nav-tab-pill"
          >
            <BarChart3 size={13} />
            <span>3-Arm Benchmark</span>
          </Link>
        </div>

        {/* Live Status Beacon & Challenge Badge */}
        <div className="header-status-group">
          <div className="status-beacon-pill">
            <span className="status-beacon-dot" />
            <span>Sanity Context MCP: Connected</span>
          </div>

          <div className="header-badge-pill">
            <Award size={13} />
            <span>DEV x Sanity 2026</span>
          </div>
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
        onClear={() => {
          setActiveScenarioId('');
          setCurrentProfile({ freeText: '' });
        }}
        onTextChange={(newText) => {
          if (activeScenarioId && newText.trim() !== currentProfile.freeText?.trim()) {
            setActiveScenarioId('');
          }
        }}
        isLoading={isLoading}
      />

      {/* The Duel Arena (Side-by-Side Split Screen) */}
      <DuelArena duelResult={duelResult} isLoading={isLoading} error={error} />
    </main>
  );
}
