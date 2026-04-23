// src/admin/components/Toast.tsx
// Toast auto-dismiss qui remplace les alert() bloquants

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number; // en ms, default 3500
  onClose: () => void;
  details?: string[]; // liste d'infos additionnelles (ex: champs manquants)
}

export default function Toast({
  message,
  type = 'success',
  duration = 3500,
  onClose,
  details = [],
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timerIn = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const timerOut = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // attendre fin animation avant de démonter
    }, duration);

    return () => {
      clearTimeout(timerIn);
      clearTimeout(timerOut);
    };
  }, [duration, onClose]);

  const config = {
    success: { bg: '#10B981', icon: '✅' },
    warning: { bg: '#F59E0B', icon: '⚠️' },
    error:   { bg: '#DC2626', icon: '❌' },
    info:    { bg: '#1565C0', icon: 'ℹ️' },
  }[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: visible ? 20 : -100,
        right: 20,
        zIndex: 10000,
        background: config.bg,
        color: '#fff',
        padding: '14px 20px',
        borderRadius: 8,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        fontSize: 14,
        fontWeight: 600,
        maxWidth: 420,
        transition: 'top 0.3s ease-out, opacity 0.3s',
        opacity: visible ? 1 : 0,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{config.icon}</span>
        <div style={{ flex: 1 }}>
          <div>{message}</div>
          {details.length > 0 && (
            <ul style={{
              margin: '6px 0 0',
              paddingLeft: 18,
              fontSize: 12,
              opacity: 0.9,
              fontWeight: 400,
            }}>
              {details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
            opacity: 0.7,
            padding: 0,
            lineHeight: 1,
          }}
        >×</button>
      </div>
    </div>
  );
}
