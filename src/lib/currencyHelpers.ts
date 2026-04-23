// src/lib/currencyHelpers.ts
// Helper pour conversion EUR/USD/CNY via Frankfurter API
// API gratuite, sans clé : https://www.frankfurter.app/

export type Currency = 'EUR' | 'USD' | 'CNY';

interface Rates {
  EUR: number;
  USD: number;
  CNY: number;
  fetched_at: number;
}

let cachedRates: Rates | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

/**
 * Récupère les taux de change depuis Frankfurter API.
 * EUR = 1 par défaut (devise de base).
 * Cache 1h pour éviter de solliciter l'API à chaque ouverture de fiche.
 */
export async function getExchangeRates(): Promise<Rates> {
  if (cachedRates && (Date.now() - cachedRates.fetched_at < CACHE_DURATION)) {
    return cachedRates;
  }

  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,CNY');
    if (!response.ok) throw new Error('Frankfurter API indisponible');
    const data = await response.json();

    cachedRates = {
      EUR: 1,
      USD: data.rates.USD,
      CNY: data.rates.CNY,
      fetched_at: Date.now(),
    };
    return cachedRates;
  } catch (err) {
    console.error('Erreur taux de change, fallback utilisé:', err);
    return cachedRates || {
      EUR: 1,
      USD: 1.08,
      CNY: 7.80,
      fetched_at: Date.now(),
    };
  }
}

export function toEUR(amount: number, from: Currency, rates: Rates): number {
  if (from === 'EUR') return amount;
  const rate = rates[from];
  if (!rate || rate === 0) return amount;
  return amount / rate;
}

export function fromEUR(amountEUR: number, to: Currency, rates: Rates): number {
  if (to === 'EUR') return amountEUR;
  return amountEUR * rates[to];
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatEUR(amount: number): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
