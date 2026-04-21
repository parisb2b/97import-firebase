// src/lib/commissionHelpers.ts
// Calcul centralisé des commissions partenaires
// Formule : Commission = Σ (prix_negocie_ligne - prix_achat_ligne × coefficient_partner) × qte

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCoefficients } from './coefficientsHelpers';

export interface LigneDevis {
  ref: string;
  nom_fr?: string;
  qte?: number;
  prix_unitaire?: number;       // prix public (×2.0)
  prix_negocie?: number;        // prix VIP si négocié, sinon identique à prix_unitaire
  prix_achat?: number;          // prix d'achat Chine (peut être absent, on fetchera products/)
}

export interface Devis {
  id: string;
  numero?: string;
  client_id?: string;
  client_nom?: string;
  partenaire_code?: string | null;
  is_vip?: boolean;
  lignes?: LigneDevis[];
  total_ht?: number;
  total_ht_public?: number;
  prix_negocies?: Record<string, number>;
  acomptes?: any[];
}

export interface CommissionResult {
  commission_totale: number;
  details: Array<{
    ref: string;
    nom: string;
    qte: number;
    prix_achat_unitaire: number;
    prix_negocie_unitaire: number;
    prix_partner_unitaire: number;  // prix_achat × coefficient_partner
    commission_unitaire: number;     // prix_negocie - prix_partner
    commission_ligne: number;        // commission_unitaire × qte
  }>;
}

/**
 * Calcule la commission d'un devis selon la formule :
 *   Pour chaque ligne : commission_unitaire = prix_negocie - (prix_achat × coefficient_partner)
 *   Commission totale = Σ (commission_unitaire × qte)
 *
 * Si une commission unitaire est négative (rare, cas d'erreur), on la force à 0 (pas de commission négative).
 */
export async function calculateCommission(devis: Devis): Promise<CommissionResult> {
  const coefs = await getCoefficients();
  const details: CommissionResult['details'] = [];
  let commission_totale = 0;

  if (!Array.isArray(devis.lignes) || devis.lignes.length === 0) {
    return { commission_totale: 0, details: [] };
  }

  for (const ligne of devis.lignes) {
    const qte = ligne.qte ?? 1;

    // 1. Récupérer le prix_achat
    let prix_achat: number = ligne.prix_achat ?? 0;
    if (prix_achat === 0 && ligne.prix_achat === undefined) {
      // Fetcher depuis products/
      try {
        const productSnap = await getDoc(doc(db, 'products', ligne.ref));
        if (productSnap.exists()) {
          prix_achat = productSnap.data().prix_achat ?? 0;
        }
      } catch {
        prix_achat = 0;
      }
    }

    // 2. Récupérer le prix négocié (prix VIP ou prix public si pas VIP)
    const prix_negocie = ligne.prix_negocie ?? ligne.prix_unitaire ?? 0;

    // 3. Calculer prix partner et commission unitaire
    const prix_partner = parseFloat((prix_achat * coefs.coefficient_partner).toFixed(2));
    const commission_unitaire = Math.max(0, prix_negocie - prix_partner);
    const commission_ligne = parseFloat((commission_unitaire * qte).toFixed(2));

    commission_totale += commission_ligne;

    details.push({
      ref: ligne.ref,
      nom: ligne.nom_fr ?? ligne.ref,
      qte,
      prix_achat_unitaire: prix_achat,
      prix_negocie_unitaire: prix_negocie,
      prix_partner_unitaire: prix_partner,
      commission_unitaire,
      commission_ligne,
    });
  }

  return {
    commission_totale: parseFloat(commission_totale.toFixed(2)),
    details,
  };
}

/**
 * Version simplifiée qui retourne seulement le total
 */
export async function calculateCommissionTotale(devis: Devis): Promise<number> {
  const result = await calculateCommission(devis);
  return result.commission_totale;
}

/**
 * Vérifie si un devis est éligible à une commission :
 *   - Est lié à un partenaire (partenaire_code non null)
 *   - Au moins un acompte encaissé
 */
export function estEligibleCommission(devis: Devis): boolean {
  if (!devis.partenaire_code) return false;
  if (!Array.isArray(devis.acomptes)) return false;
  return devis.acomptes.some((a: any) => a.statut === 'encaisse' || a.statut === 'confirme');
}
