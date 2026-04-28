// src/lib/coefficientsHelpers.ts
// Gestion centralisée des coefficients de prix.
// V44 Phase 5 — doc canonical /admin_params/coefficients_prix
// Defaults Michel : public×2.0, partner×1.5, vip×1.5

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface CoefficientsPrix {
  coefficient_partner: number;   // ex: 1.5 → prix_partner = prix_achat × 1.5
  coefficient_user: number;      // ex: 2.0 → prix_user = prix_achat × 2.0 (alias coefficient_public)
  coefficient_vip_min: number;   // borne min négociation VIP
  coefficient_vip_max: number;   // borne max négociation VIP
  // Champs Phase 5 (canonical doc)
  coefficient_public?: number;   // alias clair de coefficient_user
  coefficient_vip?: number;      // alias unique VIP (utilisé par l'UI Phase 6)
  canonical?: boolean;
  description?: string;
  derniere_maj?: any;
  updated_at?: any;
  updated_by?: string;
}

// V44 — defaults Michel (public×2.0, partner×1.5)
export const COEFFICIENTS_DEFAULT: CoefficientsPrix = {
  coefficient_partner: 1.5,
  coefficient_user: 2.0,
  coefficient_vip_min: 1.5,
  coefficient_vip_max: 2.0,
  coefficient_public: 2.0,
  coefficient_vip: 1.5,
};

// Cache mémoire 5 minutes (court pour réactivité après save admin)
let cacheCoefficients: CoefficientsPrix | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000;

function normalize(data: Partial<CoefficientsPrix>): CoefficientsPrix {
  const partner = data.coefficient_partner ?? COEFFICIENTS_DEFAULT.coefficient_partner;
  const user = data.coefficient_user ?? data.coefficient_public ?? COEFFICIENTS_DEFAULT.coefficient_user;
  return {
    coefficient_partner: partner,
    coefficient_user: user,
    coefficient_public: data.coefficient_public ?? user,
    coefficient_vip: data.coefficient_vip ?? data.coefficient_vip_min ?? COEFFICIENTS_DEFAULT.coefficient_vip!,
    coefficient_vip_min: data.coefficient_vip_min ?? data.coefficient_vip ?? COEFFICIENTS_DEFAULT.coefficient_vip_min,
    coefficient_vip_max: data.coefficient_vip_max ?? COEFFICIENTS_DEFAULT.coefficient_vip_max,
  };
}

/**
 * Récupère les coefficients depuis Firestore (avec cache 5 min).
 * Source canonique : /admin_params/coefficients_prix
 */
export async function getCoefficients(): Promise<CoefficientsPrix> {
  const now = Date.now();
  if (cacheCoefficients && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cacheCoefficients;
  }

  try {
    const snap = await getDoc(doc(db, 'admin_params', 'coefficients_prix'));
    if (snap.exists()) {
      cacheCoefficients = normalize(snap.data() as CoefficientsPrix);
      cacheTimestamp = now;
      return cacheCoefficients;
    }
  } catch (err) {
    console.error('Erreur lecture coefficients_prix :', err);
  }

  // Fallback : defaults
  cacheCoefficients = { ...COEFFICIENTS_DEFAULT };
  cacheTimestamp = now;
  return cacheCoefficients;
}

/**
 * Met à jour les coefficients dans Firestore (doc canonical).
 */
export async function setCoefficients(
  coefs: Partial<CoefficientsPrix>,
  adminEmail: string,
): Promise<void> {
  const current = await getCoefficients();
  const merged = normalize({ ...current, ...coefs });
  const payload: any = {
    ...merged,
    canonical: true,
    description: 'Coefficients officiels 97import',
    derniere_maj: serverTimestamp(),
    updated_at: serverTimestamp(),
    updated_by: adminEmail,
  };
  await setDoc(doc(db, 'admin_params', 'coefficients_prix'), payload, { merge: true });
  clearCoefficientsCache();
}

/**
 * Force la lecture Firestore au prochain getCoefficients().
 */
export function clearCoefficientsCache(): void {
  cacheCoefficients = null;
  cacheTimestamp = 0;
}

/**
 * Calcule les prix dérivés depuis le prix d'achat.
 */
export async function calculerPrixDerives(prixAchat: number): Promise<{
  prix_partner: number;
  prix_user: number;
  prix_vip_min: number;
  prix_vip_max: number;
}> {
  const coefs = await getCoefficients();
  return {
    prix_partner: parseFloat((prixAchat * coefs.coefficient_partner).toFixed(2)),
    prix_user: parseFloat((prixAchat * coefs.coefficient_user).toFixed(2)),
    prix_vip_min: parseFloat((prixAchat * coefs.coefficient_vip_min).toFixed(2)),
    prix_vip_max: parseFloat((prixAchat * coefs.coefficient_vip_max).toFixed(2)),
  };
}

/**
 * Version synchrone (utilise les coefs par défaut).
 */
export function calculerPrixDerivesSync(
  prixAchat: number,
  coefs: CoefficientsPrix = COEFFICIENTS_DEFAULT,
) {
  return {
    prix_partner: parseFloat((prixAchat * coefs.coefficient_partner).toFixed(2)),
    prix_user: parseFloat((prixAchat * coefs.coefficient_user).toFixed(2)),
    prix_vip_min: parseFloat((prixAchat * coefs.coefficient_vip_min).toFixed(2)),
    prix_vip_max: parseFloat((prixAchat * coefs.coefficient_vip_max).toFixed(2)),
  };
}
