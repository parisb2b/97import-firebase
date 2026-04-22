// src/lib/productMediaHelpers.ts
// Helpers pour extraire les médias d'un produit de manière unifiée
// Gère la rétrocompatibilité ancien format (string[]) et nouveau format (objets v35g)

export interface ImageGalerie {
  url: string;
  visible_site: boolean;
  nom?: string;
  date_upload?: string;
}

export interface VideoGalerie {
  url: string;
  visible_site: boolean;
  nom?: string;
  taille_mo?: number;
  duree_sec?: number;
  thumbnail_url?: string;
  date_upload?: string;
}

export interface DocumentPdf {
  nom: string;
  url: string;
  taille_mo: number;
  date_upload: string;
}

/**
 * Récupère l'URL de l'image principale du produit
 * Ordre de priorité :
 *   1. image_principale (nouveau v35g, champ dédié)
 *   2. images_galerie[0].url (premier média visible site)
 *   3. images_urls[0] (rétrocompat ancienne structure)
 *   4. null (pas d'image)
 */
export function getImagePrincipale(product: any): string | null {
  // 1. Nouveau champ image_principale (v35g)
  if (product?.image_principale && typeof product.image_principale === 'string' && product.image_principale.trim()) {
    return product.image_principale;
  }

  // 2. Premier objet visible de images_galerie
  if (Array.isArray(product?.images_galerie) && product.images_galerie.length > 0) {
    const first = product.images_galerie[0];
    if (typeof first === 'string' && first.trim()) return first; // ancien format
    if (first && typeof first === 'object' && first.visible_site !== false && first.url) return first.url; // nouveau format
  }

  // 3. Rétrocompat : ancienne structure images_urls
  if (Array.isArray(product?.images_urls) && product.images_urls.length > 0) {
    const first = product.images_urls[0];
    if (typeof first === 'string' && first.trim()) return first;
  }

  return null;
}

/**
 * Récupère la galerie photos VISIBLES (filtrées selon visible_site)
 * Retourne un array d'URLs uniquement (pour usage simple)
 */
export function getGaleriePhotos(product: any): string[] {
  const result: string[] = [];

  // Nouveau format : objets {url, visible_site}
  if (Array.isArray(product?.images_galerie)) {
    for (const item of product.images_galerie) {
      if (typeof item === 'string' && item.trim()) {
        result.push(item); // ancien format
      } else if (item && typeof item === 'object' && item.visible_site !== false && item.url) {
        result.push(item.url); // nouveau format, visible
      }
    }
  }

  // Rétrocompat : si galerie vide, fallback sur images_urls
  if (result.length === 0 && Array.isArray(product?.images_urls)) {
    for (const url of product.images_urls) {
      if (typeof url === 'string' && url.trim()) result.push(url);
    }
  }

  return result;
}

/**
 * Récupère la galerie vidéos VISIBLES (filtrées selon visible_site)
 * Format complet pour affichage avec thumbnail + durée
 */
export function getGalerieVideos(product: any): VideoGalerie[] {
  if (!Array.isArray(product?.videos_galerie)) return [];
  return product.videos_galerie.filter((v: any) =>
    v && typeof v === 'object' && v.visible_site !== false && v.url
  );
}

/**
 * Récupère TOUS les médias dans l'ordre d'affichage site
 * Vidéos d'abord, puis photos (selon décision Michel)
 */
export function getMediasOrdonnesPourSite(product: any): Array<{
  type: 'video' | 'photo';
  url: string;
  thumbnail?: string;
  nom?: string;
  duree_sec?: number;
}> {
  const result: any[] = [];

  // 1. Vidéos d'abord
  for (const v of getGalerieVideos(product)) {
    result.push({
      type: 'video',
      url: v.url,
      thumbnail: v.thumbnail_url,
      nom: v.nom,
      duree_sec: v.duree_sec,
    });
  }

  // 2. Photos ensuite
  for (const url of getGaleriePhotos(product)) {
    result.push({
      type: 'photo',
      url,
    });
  }

  return result;
}

/**
 * Récupère les documents PDF publics du produit
 */
export function getDocumentsPdf(product: any): DocumentPdf[] {
  if (!Array.isArray(product?.documents_pdf)) return [];
  return product.documents_pdf.filter((d: any) =>
    d && typeof d === 'object' && d.url && d.nom
  );
}

/**
 * Récupère la description marketing (avec fallback)
 */
export function getDescriptionMarketing(
  product: any,
  langue: 'fr' | 'zh' | 'en' = 'fr'
): string {
  const champ = `description_marketing_${langue}`;
  if (product?.[champ] && typeof product[champ] === 'string') {
    return product[champ];
  }
  // Fallback FR
  if (langue !== 'fr' && product?.description_marketing_fr) {
    return product.description_marketing_fr;
  }
  // Fallback description_courte
  if (product?.[`description_courte_${langue}`]) {
    return product[`description_courte_${langue}`];
  }
  if (product?.description_courte_fr) {
    return product.description_courte_fr;
  }
  return '';
}

/**
 * Récupère les points forts du produit
 */
export function getPointsForts(product: any): string[] {
  if (!Array.isArray(product?.points_forts)) return [];
  return product.points_forts
    .filter((p: any) => typeof p === 'string' && p.trim())
    .map((p: string) => p.trim());
}
