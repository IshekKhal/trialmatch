'use client';

import React from 'react';
import { CLINICAL_SCENARIOS } from '@/lib/scenarios';
import { ClinicalScenario } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface ScenarioChipsProps {
  onSelectScenario: (scenario: ClinicalScenario) => void;
  activeScenarioId?: string;
  disabled?: boolean;
}

export function ScenarioChips({
  onSelectScenario,
  activeScenarioId,
  disabled = false,
}: ScenarioChipsProps) {
  return (
    <div className="chips-section">
      <div className="chips-header">
        <div className="chips-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="var(--blue-accent)" />
          Quick-Fill Clinical Scenarios (1-Click Duel Trigger)
        </div>
      </div>
      <div className="chips-grid">
        {CLINICAL_SCENARIOS.map((scenario, index) => {
          const isActive = activeScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              className={`preset-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScenario(scenario)}
              disabled={disabled}
              title={scenario.prompt}
            >
              <span className="chip-tag">Preset {index + 1}</span>
              <span>{scenario.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
