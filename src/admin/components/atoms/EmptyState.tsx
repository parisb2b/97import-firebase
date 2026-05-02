// src/admin/components/atoms/EmptyState.tsx
// V52 Checkpoint B — Composant EmptyState uniforme.
//
// Remplace les fallbacks demo hardcodes (D2604006, JM/TD) par un etat
// vide coherent quand une collection est vraiment vide.
//
// Pattern d'usage :
//   {items.length === 0
//     ? <EmptyState icon="📋" title="Aucun devis recent"
//                   description="Les derniers devis apparaitront ici des qu'ils seront crees." />
//     : items.map(...)}

import { CSSProperties } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  style?: CSSProperties;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <div
      className="v45-fade-in"
      style={{
        padding: '40px 24px',
        textAlign: 'center',
        background: '#F9FAFB',
        border: '1px dashed #E5E7EB',
        borderRadius: 12,
        color: '#6B7280',
        ...style,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 8 }} aria-hidden>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="v45-trans-fast v45-focus v45-btn-primary"
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#1565C0',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
