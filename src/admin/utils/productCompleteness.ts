// src/admin/utils/productCompleteness.ts
// V44-BIS FEATURE 8 — système de complétude business 3 statuts.
//
// Règle Michel V44-BIS :
//   🔴 BLOQUANT  : poids OU volume manquants → devis impossible (logistique).
//   🟡 INCOMPLET : essentiels OK + poids/volume OK mais détails manquants.
//   🟢 COMPLET   : tous les champs requis pour fiche produit complète.
//
// Ce système est PARALLÈLE au calculerCompletude (4 statuts) de productHelpers.ts.
// Il sert pour les badges + filtres de la liste /admin/produits.

export type CompletenessStatus = 'complet' | 'incomplet' | 'bloquant';

export interface BadgeConfig {
  emoji: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

const DETAILS_REQUIRED: ReadonlyArray<string> = [
  'fournisseur',
  'image_principale',
  'description_fr',
  'code_hs',
];

/**
 * Détermine le statut de complétude business d'un produit.
 */
export function getCompletenessStatus(product: any): CompletenessStatus {
  if (!product) return 'bloquant';

  // 🔴 BLOQUANT : devis impossible sans poids ET volume
  const poids = typeof product.poids_brut_kg === 'number' && product.poids_brut_kg > 0;
  const volume = typeof product.volume_m3 === 'number' && product.volume_m3 > 0;
  if (!poids || !volume) return 'bloquant';

  // 🟡 INCOMPLET : champs détails manquants
  const missing = DETAILS_REQUIRED.filter((field) => {
    const v = product[field];
    return !v || (typeof v === 'string' && v.trim() === '');
  });
  if (missing.length > 0) return 'incomplet';

  // 🟢 COMPLET
  return 'complet';
}

/**
 * Retourne la config visuelle du badge (emoji, couleurs).
 */
export function getBadgeConfig(status: CompletenessStatus): BadgeConfig {
  switch (status) {
    case 'complet':
      return {
        emoji: '🟢',
        label: 'Complet',
        color: '#065F46',
        bg: '#D1FAE5',
        border: '#6EE7B7',
      };
    case 'incomplet':
      return {
        emoji: '🟡',
        label: 'Incomplet',
        color: '#92400E',
        bg: '#FEF3C7',
        border: '#FCD34D',
      };
    case 'bloquant':
      return {
        emoji: '🔴',
        label: 'Bloquant',
        color: '#991B1B',
        bg: '#FEE2E2',
        border: '#FCA5A5',
      };
  }
}

/**
 * Compte les produits par statut.
 */
export function countByStatus(products: any[]): Record<CompletenessStatus | 'total', number> {
  const counts: Record<CompletenessStatus | 'total', number> = {
    total: products.length,
    complet: 0,
    incomplet: 0,
    bloquant: 0,
  };
  for (const p of products) {
    counts[getCompletenessStatus(p)]++;
  }
  return counts;
}
