// ============================================================
// pricing.ts — Source unique de prix (EUR HT / prix d'achat)
// 97import — Importation Chine → DOM-TOM
// ============================================================

// --------------- Mini-pelles ---------------
export const MINI_PELLES_PRIX: Record<string, number> = {
  "r18-pro": 9538,
  "r22-pro": 12150,
  "r32-pro": 14296,
  "r57-pro": 19923,
};

// --------------- Kits Solaires ---------------
export const SOLAIRE_PRIX: Record<string, number> = {
  "kit-solaire-10kw": 6146,
  "kit-solaire-12kw": 6915,
  "kit-solaire-20kw": 14608,
};

// --------------- Maisons Modulaires Standard ---------------
export const MODULAR_STANDARD_SIZES = [
  {
    id: "20ft",
    name: "20 Pieds (37m²)",
    prixAchat: 4308,
    approxM2: 40,
    shipping: { martinique: 5500, guadeloupe: 5500 },
  },
  {
    id: "30ft",
    name: "30 Pieds (57m²)",
    prixAchat: 5692,
    approxM2: 60,
    shipping: { martinique: 9500, guadeloupe: 8650 },
  },
  {
    id: "40ft",
    name: "40 Pieds (74m²)",
    prixAchat: 7077,
    approxM2: 80,
    shipping: { martinique: 9500, guadeloupe: 8650 },
  },
];

// --------------- Maisons Modulaires Premium ---------------
export const MODULAR_PREMIUM_SIZES = [
  {
    id: "20ft",
    name: "20 Pieds (37m²)",
    prixAchat: 7631,
    shipping: { martinique: 11000, guadeloupe: 11000 },
  },
  {
    id: "30ft",
    name: "30 Pieds (57m²)",
    prixAchat: 8231,
    shipping: { martinique: 19000, guadeloupe: 17300 },
  },
  {
    id: "40ft",
    name: "40 Pieds (74m²)",
    prixAchat: 10231,
    shipping: { martinique: 19000, guadeloupe: 17300 },
  },
];

// --------------- Options maisons ---------------
export const MODULAR_OPTIONS_PRIX: Record<string, number> = {
  extra_room: 0,
  ac: 1923,
  solar: 6086,
  furniture: 0,
};

// --------------- Camping-Car Deluxe ---------------
export const CAMPING_CAR_PRIX_ACHAT = 41269;
export const CAMPING_CAR_SHIPPING: Record<string, number | null> = {
  martinique: 9500,
  guadeloupe: 8650,
  guyane: null,
  reunion: null,
  mayotte: null,
};

// --------------- Accessoires (EUR HT) ---------------
export const ACCESSOIRES_PRIX: Record<string, number> = {
  "godet-dents": 385,
  "godet-lisse": 346,
  "godet-cribleur": 577,
  "godet-inclinable": 500,
  "marteau-hydraulique": 1154,
  "tariere": 769,
  "grappin": 577,
  "fourche": 346,
};
