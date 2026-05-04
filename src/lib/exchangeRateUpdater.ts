// src/lib/exchangeRateUpdater.ts
// V87 — Placeholder Cloud Function updateExchangeRate (F5)
// Bloqué : nécessite une clé API de taux de change (ex: OpenExchangeRates, CurrencyLayer)
// En attendant : le fallback pricingEngine.ts + exchangeRateMonitor.ts assurent la stabilité

export const EXCHANGE_RATE_UPDATER_STATUS = {
  available: false,
  reason: 'API key required (OpenExchangeRates or CurrencyLayer)',
  fallback: 'pricingEngine.ts — FALLBACK_CNY_EUR constant',
  planned: 'Cloud Function updateExchangeRate — mise à jour quotidienne automatisée',
} as const;

/** Placeholder — sera remplacé par une Cloud Function schedulée (cron daily) */
export async function updateExchangeRate(): Promise<{ ok: boolean; reason: string }> {
  console.warn('[V87] updateExchangeRate: fonctionnalité en attente de clé API');
  return { ok: false, reason: EXCHANGE_RATE_UPDATER_STATUS.reason };
}
