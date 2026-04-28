// src/lib/currencyHelpers.ts
// Helper pour conversion EUR/USD/CNY.
// V44 Phase 5 — chaîne de fallback : cache mémoire 1h → Frankfurter → Firestore /admin_params/global → hardcoded

import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export type Currency = 'EUR' | 'USD' | 'CNY';

export interface Rates {
  EUR: number;
  USD: number;
  CNY: number;
  fetched_at: number;
  source?: 'cache' | 'frankfurter' | 'firestore' | 'hardcoded';
}

let cachedRates: Rates | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

// V44 — fallback hardcoded mis à jour (avril 2026)
const FALLBACK_HARDCODED: Omit<Rates, 'fetched_at' | 'source'> = {
  EUR: 1,
  USD: 1.17,
  CNY: 8.00,
};

async function fetchFrankfurter(): Promise<Rates | null> {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,CNY');
    if (!response.ok) throw new Error('Frankfurter API indisponible');
    const data = await response.json();
    return {
      EUR: 1,
      USD: data.rates.USD,
      CNY: data.rates.CNY,
      fetched_at: Date.now(),
      source: 'frankfurter',
    };
  } catch (err) {
    console.warn('Frankfurter KO :', err);
    return null;
  }
}

async function fetchFirestoreRates(): Promise<Rates | null> {
  try {
    const snap = await getDoc(doc(db, 'admin_params', 'global'));
    if (!snap.exists()) return null;
    const data = snap.data() as { taux_eur_usd?: number; taux_rmb_eur?: number };
    if (!data.taux_eur_usd && !data.taux_rmb_eur) return null;
    return {
      EUR: 1,
      USD: data.taux_eur_usd || FALLBACK_HARDCODED.USD,
      CNY: data.taux_rmb_eur || FALLBACK_HARDCODED.CNY,
      fetched_at: Date.now(),
      source: 'firestore',
    };
  } catch (err) {
    console.warn('Firestore /admin_params/global KO :', err);
    return null;
  }
}

/**
 * Récupère les taux de change. Stratégie en cascade :
 * 1. Cache mémoire (1h)
 * 2. Frankfurter (source live)
 * 3. Firestore /admin_params/global (taux admin)
 * 4. Hardcoded (USD 1.17 / CNY 8.00)
 */
export async function getExchangeRates(): Promise<Rates> {
  // 1) Cache mémoire
  if (cachedRates && (Date.now() - cachedRates.fetched_at < CACHE_DURATION)) {
    return cachedRates;
  }

  // 2) Frankfurter
  const live = await fetchFrankfurter();
  if (live) {
    cachedRates = live;
    return live;
  }

  // 3) Firestore
  const fs = await fetchFirestoreRates();
  if (fs) {
    cachedRates = fs;
    return fs;
  }

  // 4) Hardcoded
  cachedRates = { ...FALLBACK_HARDCODED, fetched_at: Date.now(), source: 'hardcoded' };
  return cachedRates;
}

/**
 * Force le refresh du cache mémoire (utilisé après save admin).
 */
export function clearRatesCache(): void {
  cachedRates = null;
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
