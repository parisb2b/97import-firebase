/**
 * Sentry monitoring — activation conditionnelle.
 * Ne s'active QUE si VITE_SENTRY_DSN est défini (production).
 * Aucun impact sur le build local ou les émulateurs.
 */
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry(): void {
  if (!SENTRY_DSN) {
    // Mode local / dev : Sentry désactivé silencieusement
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',
    release: `97import@${import.meta.env.__APP_VERSION__ || '0.0.0'}`,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });

  console.log('[Sentry] Monitoring activé pour', import.meta.env.VITE_APP_ENV || import.meta.env.MODE);
}

/** Error boundary prêt à l'emploi (wrapper autour du composant racine). */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
