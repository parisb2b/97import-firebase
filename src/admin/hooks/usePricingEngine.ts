// src/admin/hooks/usePricingEngine.ts
// V44 Phase 6 — Moteur de calcul de prix (CNY = source de vérité)
// Hook pur sans side-effect : calcule USD/EUR/public/partenaire à partir de prixCny.

import { useMemo } from 'react';

export interface Rates {
  eur_usd: number; // 1 EUR = X USD
  eur_cny: number; // 1 EUR = Y CNY
  usd_cny: number; // 1 USD = Z CNY (auto-déduit eur_cny / eur_usd)
}

export interface Multipliers {
  client: number;   // ex: 2.0
  partner: number;  // ex: 1.5
}

export interface PricingResult {
  prix_cny: number;
  prix_usd: number;
  prix_eur: number;
  prix_public: number;
  prix_partenaire: number;
}

const EMPTY: PricingResult = {
  prix_cny: 0,
  prix_usd: 0,
  prix_eur: 0,
  prix_public: 0,
  prix_partenaire: 0,
};

/**
 * Calcule les prix dérivés depuis le prix d'achat CNY.
 * Pure : aucun side-effect, mémoïsé sur (prixCny, rates, multipliers).
 */
export function usePricingEngine(
  prixCny: number,
  rates: Rates,
  multipliers: Multipliers,
): PricingResult {
  return useMemo(() => {
    if (!prixCny || prixCny <= 0) return EMPTY;
    if (!rates || !rates.usd_cny || !rates.eur_cny) return EMPTY;

    const prix_usd = prixCny / rates.usd_cny;
    const prix_eur = prixCny / rates.eur_cny;
    const prix_public = prix_eur * (multipliers?.client || 0);
    const prix_partenaire = prix_eur * (multipliers?.partner || 0);

    return {
      prix_cny: round2(prixCny),
      prix_usd: round2(prix_usd),
      prix_eur: round2(prix_eur),
      prix_public: round2(prix_public),
      prix_partenaire: round2(prix_partenaire),
    };
  }, [prixCny, rates, multipliers]);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
