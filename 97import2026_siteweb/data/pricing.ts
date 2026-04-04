/**
 * pricing.ts — Source unique des prix d'achat HT
 * Tous les composants doivent importer depuis ici.
 * L'affichage est calculé dynamiquement par calculerPrix() selon le rôle.
 *
 * Si les produits existent dans Supabase (table products, colonne prix_achat),
 * ces valeurs servent de fallback local.
 */

// ── Mini-pelles ──
export const MINI_PELLES_PRIX: Record<string, number> = {
  "r18-pro": 9538,
  "r22-pro": 12150,
  "r32-pro": 14296,
  "r57-pro": 19923,
};

// ── Kits Solaires ──
export const SOLAIRE_PRIX: Record<string, number> = {
  "kit-solaire-10kw": 6146,
  "kit-solaire-12kw": 6915,
  "kit-solaire-20kw": 14608,
};

// ── Maisons Modulaires Standard ──
export const MODULAR_STANDARD_SIZES = [
  { id: "20ft", name: "20 Pieds (37m\u00B2)", prixAchat: 4308, approxM2: 40, shipping: { martinique: 5500, guadeloupe: 5500 } },
  { id: "30ft", name: "30 Pieds (57m\u00B2)", prixAchat: 5692, approxM2: 60, shipping: { martinique: 9500, guadeloupe: 8650 } },
  { id: "40ft", name: "40 Pieds (74m\u00B2)", prixAchat: 7077, approxM2: 80, shipping: { martinique: 9500, guadeloupe: 8650 } },
];

// ── Maisons Modulaires Premium ──
export const MODULAR_PREMIUM_SIZES = [
  { id: "20ft", name: "20 Pieds (37m\u00B2)", prixAchat: 7631, shipping: { martinique: 11000, guadeloupe: 11000 } },
  { id: "30ft", name: "30 Pieds (57m\u00B2)", prixAchat: 8231, shipping: { martinique: 19000, guadeloupe: 17300 } },
  { id: "40ft", name: "40 Pieds (74m\u00B2)", prixAchat: 10231, shipping: { martinique: 19000, guadeloupe: 17300 } },
];

// ── Options maisons (partagées Standard + Premium) ──
export const MODULAR_OPTIONS_PRIX: Record<string, number> = {
  extra_room: 0,
  ac: 1923,
  solar: 6086,
  furniture: 0,
};

// ── Camping-Car Deluxe ──
export const CAMPING_CAR_PRIX_ACHAT = 41269;

export const CAMPING_CAR_SHIPPING: Record<string, number | null> = {
  martinique: 9500,
  guadeloupe: 8650,
  guyane: null,     // Sur devis
  reunion: null,    // Sur devis
  mayotte: null,    // Sur devis
};
