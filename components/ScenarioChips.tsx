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

function getScenarioLabel(scenario: ClinicalScenario, index: number): string {
  switch (scenario.id) {
    case 'lung-egfr-exon20-tx':
      return '1. Lung (EGFR Exon 20) | Texas';
    case 'crc-kras-g12c-ca':
      return '2. Colorectal (KRAS G12C) | California';
    case 'breast-her2-low-fl':
      return '3. Breast (HER2-Low) | Florida';
    case 'melanoma-braf-v600e-ny':
      return '4. Melanoma (BRAF V600E) | New York';
    case 'ovarian-brca1-oh':
      return '5. Ovarian (BRCA1) | Ohio';
    case 'prostate-mcrpc-pa':
      return '6. Prostate (mCRPC) | Pennsylvania';
    case 'pancreatic-kras-wt-ma':
      return '7. Pancreatic (KRAS WT) | Massachusetts';
    case 'gbm-mgmt-nc':
      return '8. Glioblastoma (MGMT) | North Carolina';
    default:
      return `${index + 1}. ${scenario.extracted.condition} (${scenario.extracted.biomarker}) | ${scenario.extracted.state}`;
  }
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
          <Sparkles size={13} color="var(--blue-accent)" />
          Quick-Fill Clinical Scenarios (1-Click Duel Trigger)
        </div>
      </div>
      <div className="chips-grid">
        {CLINICAL_SCENARIOS.map((scenario, index) => {
          const isActive = activeScenarioId === scenario.id;
          const fullLabel = getScenarioLabel(scenario, index);
          const shortText = fullLabel.replace(/^\d+\.\s*/, '');
          return (
            <button
              key={scenario.id}
              type="button"
              className={`preset-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScenario(scenario)}
              disabled={disabled}
              title={`${scenario.title}\n\n${scenario.prompt}`}
            >
              <span className="chip-tag">#{index + 1}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

