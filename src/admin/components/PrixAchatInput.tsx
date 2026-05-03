// src/admin/components/PrixAchatInput.tsx — V79
// Composant de saisie de prix avec selecteur de devise (CNY/USD/EUR).

import { useState } from 'react';

interface PrixAchatInputProps {
  value: number;
  onChange: (prix: number, devise: 'CNY' | 'USD' | 'EUR') => void;
  label?: string;
  disabled?: boolean;
}

export function PrixAchatInput({ value, onChange, label, disabled }: PrixAchatInputProps) {
  const [devise, setDevise] = useState<'CNY' | 'USD' | 'EUR'>('CNY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0, devise)}
          disabled={disabled}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '1px solid #E5E7EB', fontSize: 14, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <select
          value={devise}
          onChange={e => setDevise(e.target.value as any)}
          style={{
            padding: '10px 8px', borderRadius: 10,
            border: '1px solid #E5E7EB', fontSize: 13,
            background: '#fff', cursor: 'pointer',
          }}
        >
          <option value="CNY">¥ CNY</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
        </select>
      </div>
    </div>
  );
}
