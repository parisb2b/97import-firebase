// src/admin/services/pricingService.ts
// V44 Phase 6 — Service centralisé pour gérer taux + multiplicateurs Firestore.
// Sources canoniques :
//   - /admin_params/global              → taux_eur_usd, taux_rmb_eur, taux_usd_cny
//   - /admin_params/coefficients_prix   → coefficient_public, coefficient_partner, coefficient_vip

import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../lib/firebaseUtils';
import { clearRatesCache } from '../../lib/currencyHelpers';
import { clearCoefficientsCache } from '../../lib/coefficientsHelpers';
import type { Rates, Multipliers, PricingResult } from '../hooks/usePricingEngine';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RatesWithMeta extends Rates {
  source?: 'firestore' | 'frankfurter' | 'exchangerate-api' | 'fallback';
  derniere_maj_taux?: any;
}

export interface MultipliersWithMeta extends Multipliers {
  vip?: number;
  derniere_maj?: any;
  updated_by?: string;
}

const HARDCODED_FALLBACK: Rates = {
  eur_usd: 1.17,
  eur_cny: 8.0,
  usd_cny: 6.84, // ≈ 8.0 / 1.17
};

const DEFAULT_MULTIPLIERS: Multipliers & { vip: number } = {
  client: 2.0,
  partner: 1.5,
  vip: 1.5,
};

// ─── Lecture taux ───────────────────────────────────────────────────────────

export async function getRates(): Promise<RatesWithMeta> {
  try {
    const snap = await getDoc(doc(db, 'admin_params', 'global'));
    if (snap.exists()) {
      const data = snap.data() as any;
      const eur_usd = data.taux_eur_usd || HARDCODED_FALLBACK.eur_usd;
      const eur_cny = data.taux_rmb_eur || HARDCODED_FALLBACK.eur_cny;
      const usd_cny = data.taux_usd_cny || (eur_cny / eur_usd);
      return {
        eur_usd,
        eur_cny,
        usd_cny,
        source: 'firestore',
        derniere_maj_taux: data.derniere_maj_taux,
      };
    }
  } catch (err) {
    console.warn('getRates() Firestore KO :', err);
  }
  return { ...HARDCODED_FALLBACK, source: 'fallback' };
}

export function subscribeToRates(callback: (rates: RatesWithMeta) => void): Unsubscribe {
  return onSnapshot(doc(db, 'admin_params', 'global'), (snap) => {
    if (!snap.exists()) {
      callback({ ...HARDCODED_FALLBACK, source: 'fallback' });
      return;
    }
    const data = snap.data() as any;
    const eur_usd = data.taux_eur_usd || HARDCODED_FALLBACK.eur_usd;
    const eur_cny = data.taux_rmb_eur || HARDCODED_FALLBACK.eur_cny;
    const usd_cny = data.taux_usd_cny || (eur_cny / eur_usd);
    callback({
      eur_usd,
      eur_cny,
      usd_cny,
      source: 'firestore',
      derniere_maj_taux: data.derniere_maj_taux,
    });
  });
}

// ─── Lecture multiplicateurs ────────────────────────────────────────────────

export async function getMultipliers(): Promise<MultipliersWithMeta> {
  try {
    const snap = await getDoc(doc(db, 'admin_params', 'coefficients_prix'));
    if (snap.exists()) {
      const data = snap.data() as any;
      return {
        client: data.coefficient_public ?? data.coefficient_user ?? DEFAULT_MULTIPLIERS.client,
        partner: data.coefficient_partner ?? DEFAULT_MULTIPLIERS.partner,
        vip: data.coefficient_vip ?? data.coefficient_vip_min ?? DEFAULT_MULTIPLIERS.vip,
        derniere_maj: data.derniere_maj,
        updated_by: data.updated_by,
      };
    }
  } catch (err) {
    console.warn('getMultipliers() KO :', err);
  }
  return { ...DEFAULT_MULTIPLIERS };
}

export function subscribeToMultipliers(callback: (m: MultipliersWithMeta) => void): Unsubscribe {
  return onSnapshot(doc(db, 'admin_params', 'coefficients_prix'), (snap) => {
    if (!snap.exists()) {
      callback({ ...DEFAULT_MULTIPLIERS });
      return;
    }
    const data = snap.data() as any;
    callback({
      client: data.coefficient_public ?? data.coefficient_user ?? DEFAULT_MULTIPLIERS.client,
      partner: data.coefficient_partner ?? DEFAULT_MULTIPLIERS.partner,
      vip: data.coefficient_vip ?? data.coefficient_vip_min ?? DEFAULT_MULTIPLIERS.vip,
      derniere_maj: data.derniere_maj,
      updated_by: data.updated_by,
    });
  });
}

// ─── APIs externes (refresh manuel) ─────────────────────────────────────────

export async function fetchApiRates(): Promise<RatesWithMeta> {
  // 1) Frankfurter (gratuit, sans clé)
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,CNY');
    if (r.ok) {
      const data = await r.json();
      const eur_usd = data.rates.USD;
      const eur_cny = data.rates.CNY;
      return { eur_usd, eur_cny, usd_cny: eur_cny / eur_usd, source: 'frankfurter' };
    }
  } catch (err) {
    console.warn('Frankfurter KO :', err);
  }

  // 2) exchangerate-api.com (clé requise) — fallback
  try {
    const KEY = (import.meta as any).env?.VITE_EXCHANGE_KEY;
    if (KEY) {
      const r = await fetch(`https://v6.exchangerate-api.com/v6/${KEY}/latest/EUR`);
      if (r.ok) {
        const data = await r.json();
        if (data.result === 'success') {
          const eur_usd = data.conversion_rates.USD;
          const eur_cny = data.conversion_rates.CNY;
          return { eur_usd, eur_cny, usd_cny: eur_cny / eur_usd, source: 'exchangerate-api' };
        }
      }
    }
  } catch (err) {
    console.warn('exchangerate-api KO :', err);
  }

  // 3) Hardcoded
  return { ...HARDCODED_FALLBACK, source: 'fallback' };
}

// ─── Écritures ──────────────────────────────────────────────────────────────

export async function updateGlobalRates(rates: Rates, source?: string): Promise<void> {
  const payload: any = sanitizeForFirestore({
    taux_eur_usd: rates.eur_usd,
    taux_rmb_eur: rates.eur_cny,
    taux_usd_cny: rates.usd_cny,
    derniere_maj_taux: serverTimestamp(),
    derniere_maj_source: source || 'admin',
  });
  await setDoc(doc(db, 'admin_params', 'global'), payload, { merge: true });
  clearRatesCache();
}

export async function updateMultipliers(
  multipliers: Partial<MultipliersWithMeta>,
  adminEmail: string,
): Promise<void> {
  const payload: any = sanitizeForFirestore({
    coefficient_public: multipliers.client,
    coefficient_user: multipliers.client,
    coefficient_partner: multipliers.partner,
    coefficient_vip: multipliers.vip,
    coefficient_vip_min: multipliers.vip,
    canonical: true,
    description: 'Coefficients officiels 97import',
    derniere_maj: serverTimestamp(),
    updated_at: serverTimestamp(),
    updated_by: adminEmail,
  });
  await setDoc(doc(db, 'admin_params', 'coefficients_prix'), payload, { merge: true });
  clearCoefficientsCache();
}

// ─── Validation prix produit + price_history ───────────────────────────────

export interface ProductPricesUpdate {
  prix_achat_cny: number;
  prix_achat_usd: number;
  prix_achat_eur: number;
  prix_achat: number; // canonical EUR (compat legacy)
  prix_public: number;
  prix_partenaire: number;
}

export async function validateProductPrices(
  productId: string,
  prices: PricingResult,
  source: string,
  adminEmail?: string,
): Promise<void> {
  const payload: ProductPricesUpdate = {
    prix_achat_cny: prices.prix_cny,
    prix_achat_usd: prices.prix_usd,
    prix_achat_eur: prices.prix_eur,
    prix_achat: prices.prix_eur, // canonical
    prix_public: prices.prix_public,
    prix_partenaire: prices.prix_partenaire,
  };

  await setDoc(
    doc(db, 'products', productId),
    sanitizeForFirestore({
      ...payload,
      date_derniere_validation: serverTimestamp(),
      updated_at: serverTimestamp(),
    }),
    { merge: true },
  );

  await addDoc(
    collection(db, 'products', productId, 'price_history'),
    sanitizeForFirestore({
      ...payload,
      source,
      validated_at: serverTimestamp(),
      validated_by: adminEmail || 'admin',
    }),
  );
}
