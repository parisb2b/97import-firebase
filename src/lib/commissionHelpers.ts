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
 * Résultat de la création d'une note de commission (V43-E3.2).
 * Best-effort : la fonction ne lance pas d'exception, elle retourne ce résultat.
 */
export interface CreerCommissionResult {
  ok: boolean;
  skipped: boolean;
  reason?: string;             // 'already_generated' | 'ADMIN' | 'zero_or_negative' | 'vente_a_perte: …' | 'firestore_write: …' | …
  commissionId?: string;       // ID Firestore (= numeroNC en V43)
  numeroNC?: string;           // NC-AAMM-NNN
  totalCommission?: number;
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
 * Crée une note de commission pour un devis dont le solde a été payé.
 *
 * V43-E3.2 — Refonte :
 *  - Idempotence : skip si devis.commission_generated === true
 *  - Règle ADMIN : skip + marker commission_skipped_reason = 'ADMIN'
 *  - Skip commission ≤ 0 : marker commission_skipped_reason = 'zero_or_negative'
 *  - ID Firestore = numéro NC-AAMM-NNN (lisible, cohérent avec quotes/{DVS-…})
 *  - Statut 'en_attente' (compat NotesCommission/MesCommissionsPartner)
 *  - Best-effort : retourne CreerCommissionResult, ne throw pas
 *
 * @param params.devis - doc Firestore quotes complet (avec id, numero, partenaire_code, lignes, …)
 */
export async function creerCommissionDevis(params: {
  devis: any;
}): Promise<CreerCommissionResult> {
  const { devis } = params;

  console.log('[V43-E3.2] creerCommissionDevis appelée pour', devis.numero);

  // Idempotence : skip si déjà générée
  if (devis.commission_generated === true) {
    console.log('[V43-E3.2] Commission déjà générée pour', devis.numero, '— skip');
    return { ok: true, skipped: true, reason: 'already_generated' };
  }

  const { db } = await import('./firebase');
  const { doc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const devisId = devis.id || devis.numero;

  // Règle ADMIN : skip si pas de partenaire ou ADMIN
  if (!devis.partenaire_code || devis.partenaire_code === 'ADMIN' || devis.partenaire_code === 'admin') {
    console.log('[V43-E3.2] partenaire_code ADMIN ou absent — skip commission');
    try {
      await updateDoc(doc(db, 'quotes', devisId), {
        commission_generated: true,
        commission_skipped_reason: 'ADMIN',
      });
    } catch (e) {
      console.error('[V43-E3.2] Update marker ADMIN échoué :', e);
    }
    return { ok: true, skipped: true, reason: 'ADMIN' };
  }

  // Calcul commission par ligne (signature existante conservée — Q3)
  const calc = calculerCommissionDevis(devis.lignes || []);
  if (!calc.valid) {
    console.error('[V43-E3.2] Vente à perte détectée :', calc.erreur);
    return { ok: false, skipped: false, reason: `vente_a_perte: ${calc.erreur}` };
  }

  if (calc.total <= 0.01) {
    console.log('[V43-E3.2] Commission ≤ 0€ pour', devis.numero, '— skip avec marqueur');
    try {
      await updateDoc(doc(db, 'quotes', devisId), {
        commission_generated: true,
        commission_skipped_reason: 'zero_or_negative',
      });
    } catch (e) {
      console.error('[V43-E3.2] Update marker zero échoué :', e);
    }
    return { ok: true, skipped: true, reason: 'zero_or_negative' };
  }

  // Génération numéro NC-AAMM-NNN
  const { generateNumeroDocument } = await import('./quoteStatusHelpers');
  let numeroNC: string;
  try {
    numeroNC = await generateNumeroDocument('note_commission');
  } catch (err: any) {
    console.error('[V43-E3.2] Génération numéro NC échouée :', err);
    return { ok: false, skipped: false, reason: `numero_generation: ${err.message || err}` };
  }

  // Création doc Firestore commissions/{numeroNC} (Q2 : ID = numero NC)
  const commissionDoc = {
    numero: numeroNC,
    devis_id: devisId,
    devis_numero: devis.numero,
    partenaire_code: devis.partenaire_code,
    client_id: devis.client_id || null,
    client_nom: devis.client_nom || null,
    lignes: calc.commissions,                  // Q3 : format CommissionLigne[] actuel
    total_commission: calc.total,
    statut: 'en_attente',                      // Q1 : compat existant
    created_at: serverTimestamp(),
    created_by: 'cascade_v43_e3.2',
  };

  try {
    await setDoc(doc(db, 'commissions', numeroNC), commissionDoc);
    await updateDoc(doc(db, 'quotes', devisId), {
      commission_generated: true,
      commission_numero: numeroNC,
      commission_total: calc.total,
    });
    console.log('[V43-E3.2] Commission créée :', numeroNC, '—', calc.total, '€');
    return {
      ok: true,
      skipped: false,
      commissionId: numeroNC,
      numeroNC,
      totalCommission: calc.total,
    };
  } catch (err: any) {
    console.error('[V43-E3.2] Création commission Firestore échouée :', err);
    return { ok: false, skipped: false, reason: `firestore_write: ${err.message || err}` };
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
  return devis.acomptes.some((a: any) => a.encaisse === true); // v43-E3.2 : nettoyage hybrid check (migration E2 effectuée)
}
