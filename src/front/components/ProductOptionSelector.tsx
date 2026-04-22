// src/front/components/ProductOptionSelector.tsx
// Composant de sélection d'options (dropdowns) pour la fiche produit

import { useState, useEffect, useMemo } from 'react';
import {
  OptionsConfig,
  getRefFromSelection,
  dropdownEstVisible,
  filtrerChoixSelonConditions,
} from '../../lib/productGroupHelpers';

interface Props {
  optionsConfig: OptionsConfig;
  onSelectionChange: (ref: string | null, selection: Record<string, string>) => void;
}

export default function ProductOptionSelector({ optionsConfig, onSelectionChange }: Props) {
  // Initialiser avec le premier choix de chaque dropdown (fiche parente)
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const dd of optionsConfig.dropdowns) {
      const firstChoice = dd.choices[0];
      if (firstChoice) initial[dd.label] = firstChoice.label;
    }
    return initial;
  });

  // Notifier la sélection initiale au parent au premier render
  useEffect(() => {
    const ref = getRefFromSelection(optionsConfig, selection);
    onSelectionChange(ref, selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dropdownsVisibles = useMemo(() => {
    return optionsConfig.dropdowns.filter(dd => dropdownEstVisible(dd, selection));
  }, [optionsConfig.dropdowns, selection]);

  function handleChoiceChange(dropdownLabel: string, choiceLabel: string) {
    const newSelection = { ...selection, [dropdownLabel]: choiceLabel };

    // Après changement, certains dropdowns peuvent devenir invisibles ou avoir des choix invalides
    // On s'assure que chaque dropdown a un choix valide
    for (const dd of optionsConfig.dropdowns) {
      const choixValides = filtrerChoixSelonConditions(dd.choices, newSelection);
      if (choixValides.length > 0 && !choixValides.find(c => c.label === newSelection[dd.label])) {
        newSelection[dd.label] = choixValides[0].label;
      }
    }

    setSelection(newSelection);

    const ref = getRefFromSelection(optionsConfig, newSelection);
    onSelectionChange(ref, newSelection);
  }

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>⚙️ Configurez votre produit</div>

      {dropdownsVisibles.map(dd => {
        const choixFiltres = filtrerChoixSelonConditions(dd.choices, selection);
        return (
          <div key={dd.label} style={dropdownWrapStyle}>
            <div style={dropdownLabelStyle}>{dd.label}</div>
            <select
              value={selection[dd.label] || ''}
              onChange={e => handleChoiceChange(dd.label, e.target.value)}
              style={selectStyle}
            >
              {choixFiltres.map(c => (
                <option key={c.label} value={c.label}>
                  {c.label}{c.description ? ` — ${c.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      <div style={refInfoStyle}>
        Référence sélectionnée : <strong>{getRefFromSelection(optionsConfig, selection) || '—'}</strong>
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 20,
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#0F172A',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const dropdownWrapStyle: React.CSSProperties = {
  marginBottom: 14,
};

const dropdownLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  fontSize: 14,
  color: '#0F172A',
  background: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  outline: 'none',
};

const refInfoStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 12,
  padding: '8px 12px',
  background: '#fff',
  borderRadius: 6,
  fontFamily: 'monospace',
};
