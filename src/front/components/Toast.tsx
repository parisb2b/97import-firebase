import { useState, createContext, useContext, useCallback, useRef, ReactNode } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (text: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const colors: Record<string, { bg: string; icon: string }> = {
    success: { bg: '#059669', icon: '✅' },
    error: { bg: '#DC2626', icon: '❌' },
    info: { bg: '#2563EB', icon: 'ℹ️' },
    warning: { bg: '#D97706', icon: '⚠️' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: colors[t.type].bg, color: '#fff',
            padding: '14px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,.2)',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'slideInToast .3s ease',
            minWidth: 280, maxWidth: 420,
          }}>
            <span>{colors[t.type].icon}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
