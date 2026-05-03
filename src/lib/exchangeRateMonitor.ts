// src/lib/exchangeRateMonitor.ts — V70
// Surveille l'écart entre le taux manuel Firestore et le taux API live.
// Alerte si la déviation dépasse ±3%.

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const SEUIL_DEVIATION = 0.03; // ±3%
const COLLECTION_ALERTES = 'settings';
const DOC_ALERTE = 'currencies';

export interface RateDeviation {
  taux_manuel: number;
  taux_api: number;
  ecart_pct: number;
  depasse_seuil: boolean;
  source_api: string;
  checked_at: string;
}

export interface LastAlert {
  last_alert: RateDeviation | null;
  updated_at: any;
}

// ── API live ─────────────────────────────────────────────────────────────

async function fetchApiRate(): Promise<{ taux: number; source: string } | null> {
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=CNY');
    if (r.ok) {
      const data = await r.json();
      return { taux: data.rates.CNY, source: 'frankfurter' };
    }
  } catch { /* fallback */ }
  try {
    const KEY = (import.meta as any).env?.VITE_EXCHANGE_KEY;
    if (KEY) {
      const r = await fetch(`https://v6.exchangerate-api.com/v6/${KEY}/latest/EUR`);
      if (r.ok) {
        const data = await r.json();
        if (data.result === 'success') {
          return { taux: data.conversion_rates.CNY, source: 'exchangerate-api' };
        }
      }
    }
  } catch { /* fallback */ }
  return null;
}

// ── Vérification de la déviation ─────────────────────────────────────────

export async function checkRateDeviation(): Promise<RateDeviation | null> {
  let tauxManuel: number | null = null;
  try {
    const snap = await getDoc(doc(db, 'admin_params', 'global'));
    if (snap.exists()) {
      tauxManuel = snap.data().taux_rmb_eur;
    }
  } catch { /* silencieux */ }
  if (!tauxManuel || tauxManuel <= 0) return null;

  const apiResult = await fetchApiRate();
  if (!apiResult) return null;

  const ecartPct = (apiResult.taux - tauxManuel) / tauxManuel;
  const depasseSeuil = Math.abs(ecartPct) > SEUIL_DEVIATION;

  const deviation: RateDeviation = {
    taux_manuel: tauxManuel,
    taux_api: apiResult.taux,
    ecart_pct: Math.round(ecartPct * 10000) / 100,
    depasse_seuil: depasseSeuil,
    source_api: apiResult.source,
    checked_at: new Date().toISOString(),
  };

  if (depasseSeuil) {
    await stockerAlerte(deviation);
  }

  return deviation;
}

// ── Stockage de l'alerte ─────────────────────────────────────────────────

async function stockerAlerte(deviation: RateDeviation): Promise<void> {
  try {
    await setDoc(
      doc(db, COLLECTION_ALERTES, DOC_ALERTE),
      {
        last_alert: deviation,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('exchangeRateMonitor: échec stockage alerte', err);
  }
}

// ── Lecture de la dernière alerte ────────────────────────────────────────

export async function getLastAlert(): Promise<LastAlert | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION_ALERTES, DOC_ALERTE));
    if (snap.exists()) return snap.data() as LastAlert;
  } catch { /* silencieux */ }
  return null;
}
