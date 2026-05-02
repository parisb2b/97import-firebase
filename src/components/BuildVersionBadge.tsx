export function BuildVersionBadge() {
  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        padding: '10px 12px',
        fontSize: 12,
        color: '#64748b',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        boxSizing: 'border-box',
      }}
      aria-label="Version déployée"
    >
      v0.43.3 · 02/05/2026 15:40 · c68ec95
    </div>
  );
}
