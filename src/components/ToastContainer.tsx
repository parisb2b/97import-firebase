// src/components/ToastContainer.tsx
// Container global de notifications Toast
// À monter dans App.tsx / main.tsx

import { useToast, ToastType } from '../lib/useToast';

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#10B981', border: '#059669', icon: '✅' },
  error:   { bg: '#EF4444', border: '#DC2626', icon: '❌' },
  info:    { bg: '#3B82F6', border: '#2563EB', icon: 'ℹ️' },
  warning: { bg: '#F59E0B', border: '#D97706', icon: '⚠️' },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => {
        const colors = COLORS[toast.type];

        const toastStyle: React.CSSProperties = {
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: 8,
          padding: '12px 16px',
          minWidth: 280,
          maxWidth: 400,
          color: 'white',
          fontSize: 14,
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          pointerEvents: 'auto',
          animation: 'slideInRight 0.3s ease-out',
        };

        return (
          <div
            key={toast.id}
            style={toastStyle}
            onClick={() => dismiss(toast.id)}
          >
            <span style={{ fontSize: 18 }}>{colors.icon}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <span style={{ fontSize: 16, opacity: 0.8 }}>✕</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
