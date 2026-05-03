// src/lib/pricingEngine.ts — V70
// Moteur de prix centralisé pour 97import.
// Constantes canoniques + fonctions de calcul des prix de vente.

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// ── Constantes canoniques (CDC V63) ──────────────────────────────────────

export const FALLBACK_CNY_EUR = 0.133678;
export const MULTIPLICATEUR_PARTENAIRE = 1.5;
export const MULTIPLICATEUR_PUBLIC = 2.0;

// ── Calculs de prix ──────────────────────────────────────────────────────

export function getPrixPartenaire(prixAchatEUR: number): number {
  return Math.round(prixAchatEUR * MULTIPLICATEUR_PARTENAIRE * 100) / 100;
}

export function getPrixPublic(prixAchatEUR: number): number {
  return Math.round(prixAchatEUR * MULTIPLICATEUR_PUBLIC * 100) / 100;
}

export function getPrixVip(prixAchatEUR: number, multiplicateurVip: number = 1.5): number {
  return Math.round(prixAchatEUR * multiplicateurVip * 100) / 100;
}

// ── Taux de change ───────────────────────────────────────────────────────

export async function getTauxChange(): Promise<{
  eur_usd: number;
  eur_cny: number;
  source: string;
}> {
  try {
    const snap = await getDoc(doc(db, 'admin_params', 'global'));
    if (snap.exists()) {
      const data = snap.data() as any;
      return {
        eur_usd: data.taux_eur_usd || 1.17,
        eur_cny: data.taux_rmb_eur || 8.0,
        source: 'firestore',
      };
    }
  } catch { /* fallback */ }
  return { eur_usd: 1.17, eur_cny: 8.0, source: 'fallback' };
}
