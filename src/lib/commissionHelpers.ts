// src/lib/commissionHelpers.ts
// Calcul de commission par ligne + génération note de commission (NC)

import { QuoteLine } from './quoteStatusHelpers';

export interface CommissionLigne {
  reference: string;
  nom: string;
  prix_partenaire: number;
  prix_vip_negocie: number;
  quantite: number;
  commission_unitaire: number;
  commission_totale: number;
}

export interface CommissionDevis {
  devis_numero: string;
  partenaire_code: string;
  lignes: CommissionLigne[];
  total_commission: number;
  statut: 'en_attente' | 'payee';
  date_versement?: string;
  note_commission_numero?: string;  // NC-AAMM-NNN
  note_commission_pdf_url?: string;
}

/**
 * Calcule la commission d'une ligne
 * Retourne null si vente à perte (refus)
 */
export function calculerCommissionLigne(
  ligne: QuoteLine
): CommissionLigne | null {
  const prix_partenaire = ligne.prix_partenaire || 0;
  const prix_vip = ligne.prix_vip_negocie || ligne.prix_unitaire_final;

  // Interdit de vendre sous le prix partenaire
  if (prix_vip < prix_partenaire - 0.01) {
    return null;
  }

  const commission_unitaire = Math.max(0, prix_vip - prix_partenaire);

  return {
    reference: ligne.reference,
    nom: ligne.nom,
    prix_partenaire,
    prix_vip_negocie: prix_vip,
    quantite: ligne.quantite,
    commission_unitaire,
    commission_totale: commission_unitaire * ligne.quantite,
  };
}

/**
 * Calcule la commission totale d'un devis
 * Retourne { valid: false, erreur } si une ligne est vendue à perte
 */
export function calculerCommissionDevis(
  lignes: QuoteLine[]
): { valid: boolean; erreur?: string; commissions: CommissionLigne[]; total: number } {
  const commissions: CommissionLigne[] = [];

  for (const ligne of lignes) {
    const comm = calculerCommissionLigne(ligne);
    if (comm === null) {
      return {
        valid: false,
        erreur: `Vente à perte interdite sur ligne ${ligne.reference} (${ligne.nom})`,
        commissions: [],
        total: 0,
      };
    }
    commissions.push(comm);
  }

  const total = commissions.reduce((sum, c) => sum + c.commission_totale, 0);
  return { valid: true, commissions, total };
}

/**
 * Créer la commission dans Firestore quand solde_paye atteint
 */
export async function creerCommissionDevis(params: {
  devis_id: string;
  devis_numero: string;
  partenaire_code: string;
  lignes: QuoteLine[];
}): Promise<{ ok: boolean; commission_id?: string; erreur?: string }> {
  const { db } = await import('./firebase');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

  // Si partenaire = admin (code "ADMIN" ou vide), pas de commission
  if (!params.partenaire_code || params.partenaire_code === 'ADMIN' || params.partenaire_code === 'admin') {
    return { ok: true };  // Pas d'erreur, juste pas de commission
  }

  const calc = calculerCommissionDevis(params.lignes);
  if (!calc.valid) {
    return { ok: false, erreur: calc.erreur };
  }

  if (calc.total <= 0.01) {
    // Commission nulle → on ne crée pas
    return { ok: true };
  }

  try {
    const docRef = await addDoc(collection(db, 'commissions'), {
      devis_id: params.devis_id,
      devis_numero: params.devis_numero,
      partenaire_code: params.partenaire_code,
      lignes: calc.commissions,
      total_commission: calc.total,
      statut: 'en_attente',
      created_at: serverTimestamp(),
    });
    return { ok: true, commission_id: docRef.id };
  } catch (err: any) {
    return { ok: false, erreur: err.message };
  }
}

// ========== BACKWARD COMPATIBILITY ==========
// Wrappers pour l'ancien API (fichiers existants non modifiables)

interface LegacyDevis {
  lignes?: Array<{
    ref: string;
    nom_fr?: string;
    qte?: number;
    prix_negocie?: number;
    prix_unitaire?: number;
    prix_achat?: number;
  }>;
  partenaire_code?: string | null;
  acomptes?: any[];
}

interface LegacyCommissionResult {
  commission_totale: number;
  details: Array<{
    ref: string;
    nom: string;
    qte: number;
    prix_achat_unitaire: number;
    prix_negocie_unitaire: number;
    prix_partner_unitaire: number;
    commission_unitaire: number;
    commission_ligne: number;
  }>;
}

/**
 * @deprecated Utiliser calculerCommissionDevis à la place
 * Conservé pour rétrocompatibilité avec ModalNouvelleCommission et MesCommissionsPartner
 */
export async function calculateCommission(devis: LegacyDevis): Promise<LegacyCommissionResult> {
  if (!Array.isArray(devis.lignes) || devis.lignes.length === 0) {
    return { commission_totale: 0, details: [] };
  }

  // Convertir les lignes legacy en QuoteLine
  const quoteLignes: QuoteLine[] = devis.lignes.map(l => ({
    reference: l.ref,
    nom: l.nom_fr || l.ref,
    quantite: l.qte || 1,
    prix_achat: l.prix_achat || 0,
    prix_partenaire: l.prix_achat || 0,  // On utilise prix_achat comme prix_partenaire
    prix_vip_negocie: l.prix_negocie || l.prix_unitaire || 0,
    prix_unitaire_final: l.prix_negocie || l.prix_unitaire || 0,
    total_ligne: (l.prix_negocie || l.prix_unitaire || 0) * (l.qte || 1),
  }));

  const calc = calculerCommissionDevis(quoteLignes);

  // Mapper vers le format legacy
  return {
    commission_totale: calc.total,
    details: calc.commissions.map(c => ({
      ref: c.reference,
      nom: c.nom,
      qte: c.quantite,
      prix_achat_unitaire: c.prix_partenaire,  // On mappe prix_partenaire → prix_achat
      prix_negocie_unitaire: c.prix_vip_negocie,
      prix_partner_unitaire: c.prix_partenaire,
      commission_unitaire: c.commission_unitaire,
      commission_ligne: c.commission_totale,
    })),
  };
}

/**
 * @deprecated Utiliser la logique métier appropriée à la place
 * Conservé pour rétrocompatibilité
 */
export function estEligibleCommission(devis: LegacyDevis): boolean {
  if (!devis.partenaire_code) return false;
  if (!Array.isArray(devis.acomptes)) return false;
  return devis.acomptes.some((a: any) => a.statut === 'encaisse' || a.statut === 'confirme' || a.encaisse === true);
}
