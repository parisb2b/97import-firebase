// src/lib/coefficientsHelpers.ts
// Gestion centralisée des coefficients de prix
// Utilisé pour : prix partner, prix user, bornes négociation VIP, calcul commission

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface CoefficientsPrix {
  coefficient_partner: number;   // ex: 1.2 → prix_partner = prix_achat × 1.2
  coefficient_user: number;      // ex: 2.0 → prix_user = prix_achat × 2.0
  coefficient_vip_min: number;   // ex: 1.2 → borne min prix VIP
  coefficient_vip_max: number;   // ex: 2.0 → borne max prix VIP
  updated_at?: any;
  updated_by?: string;
}

// Valeurs par défaut (utilisées si le document Firestore n'existe pas encore)
export const COEFFICIENTS_DEFAULT: CoefficientsPrix = {
  coefficient_partner: 1.2,
  coefficient_user: 2.0,
  coefficient_vip_min: 1.2,
  coefficient_vip_max: 2.0,
};

// Cache en mémoire pour éviter des re-fetch à chaque calcul
let cacheCoefficients: CoefficientsPrix | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 30 * 1000; // 30 secondes

/**
 * Récupère les coefficients actuels depuis Firestore (avec cache)
 */
export async function getCoefficients(): Promise<CoefficientsPrix> {
  const now = Date.now();
  if (cacheCoefficients && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cacheCoefficients;
  }

  try {
    const snap = await getDoc(doc(db, 'admin_params', 'coefficients_prix'));
    if (snap.exists()) {
      const data = snap.data() as CoefficientsPrix;
      cacheCoefficients = {
        coefficient_partner: data.coefficient_partner ?? COEFFICIENTS_DEFAULT.coefficient_partner,
        coefficient_user: data.coefficient_user ?? COEFFICIENTS_DEFAULT.coefficient_user,
        coefficient_vip_min: data.coefficient_vip_min ?? COEFFICIENTS_DEFAULT.coefficient_vip_min,
        coefficient_vip_max: data.coefficient_vip_max ?? COEFFICIENTS_DEFAULT.coefficient_vip_max,
      };
      cacheTimestamp = now;
      return cacheCoefficients;
    }
  } catch (err) {
    console.error('Erreur lecture coefficients:', err);
  }

  // Fallback : valeurs par défaut
  cacheCoefficients = { ...COEFFICIENTS_DEFAULT };
  cacheTimestamp = now;
  return cacheCoefficients;
}

/**
 * Met à jour les coefficients dans Firestore
 */
export async function setCoefficients(
  coefs: Partial<CoefficientsPrix>,
  adminEmail: string
): Promise<void> {
  const current = await getCoefficients();
  const updated = {
    ...current,
    ...coefs,
    updated_at: serverTimestamp(),
    updated_by: adminEmail,
  };

  await setDoc(doc(db, 'admin_params', 'coefficients_prix'), updated);

  // Invalider le cache
  cacheCoefficients = null;
  cacheTimestamp = 0;
}

/**
 * Calcule les prix dérivés depuis le prix d'achat
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
 * Version synchrone (utilise les coefs par défaut)
 * Pour les cas où on n'a pas accès au async (rare)
 */
export function calculerPrixDerivesSync(
  prixAchat: number,
  coefs: CoefficientsPrix = COEFFICIENTS_DEFAULT
) {
  return {
    prix_partner: parseFloat((prixAchat * coefs.coefficient_partner).toFixed(2)),
    prix_user: parseFloat((prixAchat * coefs.coefficient_user).toFixed(2)),
    prix_vip_min: parseFloat((prixAchat * coefs.coefficient_vip_min).toFixed(2)),
    prix_vip_max: parseFloat((prixAchat * coefs.coefficient_vip_max).toFixed(2)),
  };
}
