// src/lib/productHelpers.ts
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export type StatutCompletude = 'complet' | 'pret_site' | 'a_enrichir' | 'bloquant';

export interface CompletudeProduit {
  essentiel: number;
  details: number;
  medias: number;
  statut: StatutCompletude;
  champs_manquants_essentiel: string[];
}

export const CHAMPS_ESSENTIEL = [
  'reference', 'categorie', 'nom_fr', 'prix_achat',
  'fournisseur', 'poids_brut_kg', 'volume_m3',
  'est_kit', 'composition_kit', 'actif', 'image_principale',
] as const;
// ⚠️ 11 champs désormais au lieu de 12 (code_hs déplacé dans CHAMPS_DETAILS)

export const CHAMPS_DETAILS = [
  'code_hs',
  'nom_zh', 'nom_en',
  'description_courte_fr', 'description_courte_zh', 'description_courte_en',
  'usage_fr', 'usage_zh', 'usage_en',
  'longueur_cm', 'largeur_cm', 'hauteur_cm', 'poids_net_kg',
  'matiere_fr', 'matiere_zh', 'matiere_en',
  'reference_usine', 'ville_origine_cn', 'pays_origine',
] as const;
// 20 champs désormais au lieu de 16

export const CHAMPS_MEDIAS = [
  'images_galerie', 'video_url',
  'description_marketing_fr', 'description_marketing_zh', 'description_marketing_en',
  'points_forts', 'documents_pdf',
  'slug_url', 'meta_title',
] as const;

export function calculerCompletude(product: any): CompletudeProduit {
  const champs_manquants_essentiel: string[] = [];
  let essentiel = 0;

  for (const champ of CHAMPS_ESSENTIEL) {
    const val = product[champ];
    if (champ === 'est_kit' || champ === 'actif') {
      if (val === true || val === false) essentiel++;
      else champs_manquants_essentiel.push(champ);
      continue;
    }
    if (champ === 'composition_kit') {
      if (product.est_kit === true) {
        if (Array.isArray(val) && val.length > 0) essentiel++;
        else champs_manquants_essentiel.push('composition_kit (kit sans composants)');
      } else {
        essentiel++;
      }
      continue;
    }
    if (['prix_achat', 'poids_brut_kg', 'volume_m3'].includes(champ)) {
      if (typeof val === 'number' && val > 0) essentiel++;
      else champs_manquants_essentiel.push(champ);
      continue;
    }
    if (typeof val === 'string' && val.trim() !== '') essentiel++;
    else champs_manquants_essentiel.push(champ);
  }

  let details = 0;
  for (const champ of CHAMPS_DETAILS) {
    const val = product[champ];
    if (['longueur_cm', 'largeur_cm', 'hauteur_cm', 'poids_net_kg'].includes(champ)) {
      if (typeof val === 'number' && val > 0) details++;
    } else {
      if (typeof val === 'string' && val.trim() !== '') details++;
    }
  }

  let medias = 0;
  for (const champ of CHAMPS_MEDIAS) {
    const val = product[champ];
    if (champ === 'images_galerie' || champ === 'points_forts' || champ === 'documents_pdf') {
      if (Array.isArray(val) && val.length > 0) medias++;
    } else {
      if (typeof val === 'string' && val.trim() !== '') medias++;
    }
  }

  let statut: StatutCompletude;
  if (essentiel < CHAMPS_ESSENTIEL.length) statut = 'bloquant';
  else if (medias >= 3 && details >= 8) statut = 'complet';
  else if (medias >= 2) statut = 'pret_site';
  else statut = 'a_enrichir';

  return { essentiel, details, medias, statut, champs_manquants_essentiel };
}

export function calculerVolumeDepuisDimensions(l?: number, la?: number, h?: number): number | null {
  if (!l || !la || !h || l <= 0 || la <= 0 || h <= 0) return null;
  return parseFloat(((l * la * h) / 1_000_000).toFixed(3));
}

export function calculerPrixDerives(prix_achat: number) {
  return {
    prix_user: parseFloat((prix_achat * 2.0).toFixed(2)),
    prix_partner: parseFloat((prix_achat * 1.2).toFixed(2)),
  };
}

export const CATEGORIES = [
  { id: 'solaire', label: 'Solaire', prefixe: 'SOL' },
  { id: 'mini-pelle', label: 'Mini-pelle', prefixe: 'MP' },
  { id: 'maison-modulaire', label: 'Maison modulaire', prefixe: 'MM' },
  { id: 'agricole', label: 'Agricole', prefixe: 'AG' },
  { id: 'divers', label: 'Divers', prefixe: 'DIV' },
];

// Sous-catégories avec préfixe spécifique (pour autogénération intelligente)
export const SOUS_CATEGORIES: Record<string, { id: string; label: string; prefixe: string }[]> = {
  'solaire': [
    { id: 'kit-complet', label: 'Kit complet', prefixe: 'KS' },
    { id: 'panneau', label: 'Panneau solaire', prefixe: 'KS-PAN' },
    { id: 'onduleur', label: 'Onduleur', prefixe: 'KS-OND' },
    { id: 'batterie', label: 'Batterie', prefixe: 'KS-BAT' },
    { id: 'cablage', label: 'Câblage / Accessoires', prefixe: 'KS-CAB' },
  ],
  'mini-pelle': [
    { id: 'machine', label: 'Machine complète', prefixe: 'MP' },
    { id: 'accessoire', label: 'Accessoire', prefixe: 'MP-ACC' },
  ],
  'maison-modulaire': [
    { id: 'expandable', label: 'Expandable', prefixe: 'MM-EXP' },
    { id: 'container', label: 'Container', prefixe: 'MM-CTN' },
  ],
  'agricole': [],
  'divers': [],
};

/**
 * Auto-génération intelligente de la référence
 * Ex: catégorie=solaire + sous_categorie=kit-complet + puissance=10K → KS-10K-NNN
 * Ex: catégorie=mini-pelle + sous_categorie=machine + modele=R22 → MP-R22-NNN
 */
export async function genererReferenceAuto(
  categorie: string,
  sousCategorie?: string,
  modele?: string
): Promise<string> {
  let prefixe: string;

  if (sousCategorie && SOUS_CATEGORIES[categorie]) {
    const sc = SOUS_CATEGORIES[categorie].find(s => s.id === sousCategorie);
    prefixe = sc?.prefixe || CATEGORIES.find(c => c.id === categorie)?.prefixe || 'PROD';
  } else {
    prefixe = CATEGORIES.find(c => c.id === categorie)?.prefixe || 'PROD';
  }

  // Ajouter le modèle si fourni (ex: "10K" → KS-10K-NNN)
  const basePrefix = modele ? `${prefixe}-${modele.toUpperCase()}` : prefixe;

  // Chercher le prochain numéro disponible
  try {
    const snap = await getDocs(collection(db, 'products'));
    const existingRefs = snap.docs.map(d => d.id);
    const regex = new RegExp(`^${basePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{3})$`);
    let maxNum = 0;
    for (const ref of existingRefs) {
      const m = ref.match(regex);
      if (m) {
        const num = parseInt(m[1]);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${basePrefix}-${nextNum}`;
  } catch (err) {
    console.error('Erreur génération référence:', err);
    return `${basePrefix}-001`;
  }
}

export function genererSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/**
 * Détecte si un produit nécessite une alerte Code HS manquant
 * (utile pour afficher un badge dans la liste)
 */
export function manqueCodeHs(product: any): boolean {
  return !product.code_hs || (typeof product.code_hs === 'string' && product.code_hs.trim() === '');
}

/**
 * Migre l'ancienne structure images_galerie (string[])
 * vers la nouvelle structure (array d'objets)
 * Appelé au chargement de chaque produit
 */
export function migrerGalerieImages(product: any): any {
  if (!product) return product;

  // Migration images_galerie si format string[]
  if (Array.isArray(product.images_galerie) && product.images_galerie.length > 0) {
    const first = product.images_galerie[0];
    if (typeof first === 'string') {
      // Ancien format : string[] → convertir en objets
      product.images_galerie = product.images_galerie.map((url: string, i: number) => ({
        url,
        visible_site: true,
        nom: `Image ${i + 1}`,
      }));
    }
  }

  // Initialiser videos_galerie si absent
  if (!product.videos_galerie) {
    product.videos_galerie = [];
  }

  return product;
}
