// src/lib/searchHelpers.ts
// Recherche Google-like sur les produits Firestore
// Insensible casse + tolérante aux accents + multi-champs

/**
 * Normalise une chaîne pour recherche tolérante :
 * - Minuscules
 * - Suppression des accents
 * - Suppression caractères spéciaux superflus
 */
export function normalizeForSearch(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^\w\s-]/g, ' ')        // caractères spéciaux
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Champs dans lesquels chercher
 */
const SEARCHABLE_FIELDS = [
  'reference',
  'nom_fr',
  'nom_zh',
  'nom_en',
  'description_courte_fr',
  'description_courte_en',
  'description_marketing_fr',
  'description_marketing_en',
  'usage_fr',
  'usage_en',
  'matiere_fr',
  'matiere_en',
  'fournisseur',
  'categorie',
  'gamme',
  'sous_categorie',
];

/**
 * Vérifie si un produit matche la recherche
 * Retourne un score de pertinence (0 = pas de match, plus haut = plus pertinent)
 */
export function searchScore(product: any, query: string): number {
  if (!query || !query.trim()) return 0;

  const normalizedQuery = normalizeForSearch(query);
  const queryTerms = normalizedQuery.split(' ').filter(t => t.length >= 2);

  if (queryTerms.length === 0) return 0;

  let totalScore = 0;

  for (const field of SEARCHABLE_FIELDS) {
    const value = product[field];
    if (!value || typeof value !== 'string') continue;

    const normalized = normalizeForSearch(value);

    for (const term of queryTerms) {
      // Match exact (mot complet) = score élevé
      const wordRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (wordRegex.test(normalized)) {
        // Bonus si le terme est dans la référence ou le nom
        if (field === 'reference') totalScore += 100;
        else if (field === 'nom_fr' || field === 'nom_zh' || field === 'nom_en') totalScore += 50;
        else totalScore += 10;
      }
      // Match partiel (commence par)
      else if (normalized.includes(term)) {
        if (field === 'reference') totalScore += 50;
        else if (field === 'nom_fr' || field === 'nom_zh' || field === 'nom_en') totalScore += 25;
        else totalScore += 5;
      }
    }
  }

  // Recherche aussi dans les points_forts (array)
  if (Array.isArray(product.points_forts)) {
    const allPoints = product.points_forts.join(' ');
    const normalized = normalizeForSearch(allPoints);
    for (const term of queryTerms) {
      if (normalized.includes(term)) totalScore += 5;
    }
  }

  return totalScore;
}

/**
 * Recherche dans une liste de produits, retourne les résultats triés par score
 */
export function searchProducts(products: any[], query: string, maxResults = 50): any[] {
  if (!query || !query.trim()) return [];

  const results = products
    .map(p => ({ product: p, score: searchScore(p, query) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(r => r.product);

  return results;
}
