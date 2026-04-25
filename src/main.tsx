import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { logError } from './lib/logService'

// v43-M1 : capture globale des erreurs JS et des promesses non-attrapées.
// Tout est routé vers la collection Firestore `logs` via logService (anti-récursion + dédup).
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError(
      'js-error',
      event.message || 'Unknown error',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      event.error,
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? 'Unknown rejection');
    logError('unhandled-promise', message, undefined, reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
