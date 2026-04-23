// src/lib/filterPersistence.ts
// Helper pour persister les filtres catalogue entre les sessions

const STORAGE_KEY = 'admin_catalogue_filters_v1';

export interface CatalogueFilters {
  categorie?: string;          // 'mini-pelle', 'maison-modulaire', etc. ou 'TOUS' pour "Tous"
  recherche?: string;          // texte de recherche
  statut?: string;             // 'TOUS', 'complet', 'pret_site', etc.
  actif?: string;              // 'TOUS', 'ACTIF', 'MASQUE'
  // Ajouter d'autres filtres si nécessaire selon le code existant
  [key: string]: any;
}

export function saveFilters(filters: CatalogueFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (err) {
    console.error('Erreur sauvegarde filtres:', err);
  }
}

export function loadFilters(): CatalogueFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function resetFilters(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Vérifie si au moins un filtre actif est défini.
 * Utile pour afficher/masquer le bouton "Réinitialiser".
 */
export function hasActiveFilters(filters: CatalogueFilters): boolean {
  return Object.values(filters).some(v => {
    if (v === undefined || v === null) return false;
    if (v === '' || v === 'TOUS' || v === 'tous') return false;
    return true;
  });
}
