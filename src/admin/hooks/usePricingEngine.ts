// src/admin/hooks/usePricingEngine.ts
// V44 Phase 6 — Moteur de calcul de prix (CNY = source de vérité)
// Hook pur sans side-effect : calcule USD/EUR/public/partenaire à partir de prixCny.
// V44 FIX (Dogme 5) — support des overrides manuels admin.

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

export interface Overrides {
  public: number | null;
  partner: number | null;
}

export interface PricingResult {
  prix_cny: number;
  prix_usd: number;
  prix_eur: number;
  prix_public: number;            // override si actif, sinon auto
  prix_partenaire: number;        // override si actif, sinon auto
  prix_public_auto: number;       // calcul auto sans override (pour affichage placeholder)
  prix_partenaire_auto: number;   // idem
  override_public_actif: boolean;
  override_partenaire_actif: boolean;
}

const EMPTY: PricingResult = {
  prix_cny: 0,
  prix_usd: 0,
  prix_eur: 0,
  prix_public: 0,
  prix_partenaire: 0,
  prix_public_auto: 0,
  prix_partenaire_auto: 0,
  override_public_actif: false,
  override_partenaire_actif: false,
};

const NO_OVERRIDES: Overrides = { public: null, partner: null };

/**
 * Calcule les prix dérivés depuis le prix d'achat CNY.
 * Pure : aucun side-effect, mémoïsé.
 *
 * Si un override > 0 est fourni pour public/partner, il REMPLACE le calcul auto.
 */
export function usePricingEngine(
  prixCny: number,
  rates: Rates,
  multipliers: Multipliers,
  overrides: Overrides = NO_OVERRIDES,
): PricingResult {
  return useMemo(() => {
    if (!prixCny || prixCny <= 0) return EMPTY;
    if (!rates || !rates.usd_cny || !rates.eur_cny) return EMPTY;

    // Conversion directe CNY → EUR (plus précise qu'un double-hop CNY→USD→EUR)
    const prix_eur = prixCny / rates.eur_cny;
    // USD passe par EUR : prix_usd = prix_eur × eur_usd
    const prix_usd = prix_eur * rates.eur_usd;

    const prix_public_auto = prix_eur * (multipliers?.client || 0);
    const prix_partenaire_auto = prix_eur * (multipliers?.partner || 0);

    const overridePublicActif = overrides.public !== null && overrides.public > 0;
    const overridePartenaireActif = overrides.partner !== null && overrides.partner > 0;

    const prix_public = overridePublicActif ? (overrides.public as number) : prix_public_auto;
    const prix_partenaire = overridePartenaireActif ? (overrides.partner as number) : prix_partenaire_auto;

    return {
      prix_cny: round2(prixCny),
      prix_usd: round2(prix_usd),
      prix_eur: round2(prix_eur),
      prix_public: round2(prix_public),
      prix_partenaire: round2(prix_partenaire),
      prix_public_auto: round2(prix_public_auto),
      prix_partenaire_auto: round2(prix_partenaire_auto),
      override_public_actif: overridePublicActif,
      override_partenaire_actif: overridePartenaireActif,
    };
  }, [prixCny, rates, multipliers, overrides]);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
