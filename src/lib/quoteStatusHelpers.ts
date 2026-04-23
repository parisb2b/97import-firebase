// src/lib/quoteStatusHelpers.ts
// Helpers pour la gestion des statuts devis + calculs paiements

export type QuoteStatus =
  | 'nouveau'                          // ancien, rétrocompatibilité
  | 'en_negociation_partenaire'        // NOUVEAU : devis créé, attend négociation partenaire
  | 'devis_vip_envoye'                 // NOUVEAU : partenaire a renvoyé devis VIP au client
  | 'signe'                            // NOUVEAU : client a signé, peut verser 1er acompte
  | 'acompte_1' | 'acompte_2' | 'acompte_3'
  | 'solde_paye'
  | 'en_production'
  | 'annule';                          // ajouté pour complétude (référencé dans AcomptesEncaisser)
  // Statuts P3-WF3 à venir : expédié, arrivé_port, livré

export interface Acompte {
  numero: number;              // 1, 2, 3 ou 0 = solde
  montant: number;
  date_reception: string;      // ISO string
  reference_virement?: string;
  facture_acompte_numero?: string; // FA-AC-AAMM-NNN
  facture_acompte_pdf_url?: string;
  is_solde?: boolean;          // true si c'est le solde final
  created_at: string;          // ISO
  created_by: string;          // UID admin
}

/**
 * Retourne le montant total payé (somme de tous les acomptes + solde éventuel)
 */
export function getTotalPaye(acomptes: Acompte[] = []): number {
  return acomptes.reduce((sum, a) => sum + (a.montant || 0), 0);
}

/**
 * Retourne le montant restant à payer
 */
export function getRestantAPayer(total_ht: number, acomptes: Acompte[] = []): number {
  return Math.max(0, total_ht - getTotalPaye(acomptes));
}

/**
 * Compte le nombre d'acomptes PARTIELS (hors solde)
 */
export function getNbAcomptes(acomptes: Acompte[] = []): number {
  return acomptes.filter(a => !a.is_solde).length;
}

/**
 * Peut-on encore ajouter un acompte partiel ? (max 3)
 */
export function peutAjouterAcompte(acomptes: Acompte[] = []): boolean {
  return getNbAcomptes(acomptes) < 3;
}

/**
 * Le prochain paiement doit-il être le solde forcé ?
 * Oui si on a déjà 3 acomptes partiels.
 */
export function prochainPaiementEstSolde(acomptes: Acompte[] = []): boolean {
  return getNbAcomptes(acomptes) >= 3;
}

/**
 * Le devis est-il entièrement payé ?
 */
export function estEntierementPaye(total_ht: number, acomptes: Acompte[] = []): boolean {
  return getRestantAPayer(total_ht, acomptes) <= 0.01; // tolérance arrondis
}

/**
 * Calcule le statut du devis en fonction des acomptes ET du statut actuel.
 * Les nouveaux statuts amont (en_negociation_partenaire, devis_vip_envoye, signe)
 * sont préservés tant qu'il n'y a pas d'acompte.
 */
export function calculerStatut(
  total_ht: number,
  acomptes: Acompte[] = [],
  statutActuel?: QuoteStatus  // nouveau param optionnel
): QuoteStatus {
  const nbPartiels = getNbAcomptes(acomptes);
  const paye = estEntierementPaye(total_ht, acomptes);

  // Si paiements en cours : utiliser la logique paiement
  if (paye) return 'solde_paye';
  if (nbPartiels >= 3) return 'acompte_3';
  if (nbPartiels === 2) return 'acompte_2';
  if (nbPartiels === 1) return 'acompte_1';

  // Aucun paiement : préserver les statuts amont
  if (statutActuel === 'en_negociation_partenaire') return 'en_negociation_partenaire';
  if (statutActuel === 'devis_vip_envoye') return 'devis_vip_envoye';
  if (statutActuel === 'signe') return 'signe';
  if (statutActuel === 'annule') return 'annule';

  return 'nouveau';
}

/**
 * Libellé lisible du statut
 */
export function libelleStatut(statut: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    nouveau: 'Nouveau — En attente d\'acompte',
    en_negociation_partenaire: 'En négociation partenaire',
    devis_vip_envoye: 'Devis VIP envoyé au client',
    signe: 'Signé — En attente 1er acompte',
    acompte_1: 'Acompte 1 reçu',
    acompte_2: 'Acompte 2 reçu',
    acompte_3: 'Acompte 3 reçu — Solde attendu',
    solde_paye: 'Intégralement payé',
    en_production: 'En production',
    annule: 'Annulé',
  };
  return labels[statut] || statut;
}

/**
 * Couleur du badge statut pour l'UI admin
 */
export function couleurStatut(statut: QuoteStatus): string {
  const colors: Record<QuoteStatus, string> = {
    nouveau: '#6B7280',                       // gris
    en_negociation_partenaire: '#8B5CF6',     // violet (négociation)
    devis_vip_envoye: '#EC4899',              // rose/magenta (envoyé)
    signe: '#10B981',                         // vert (signé)
    acompte_1: '#F59E0B',                     // orange clair
    acompte_2: '#F59E0B',
    acompte_3: '#D97706',                     // orange foncé
    solde_paye: '#10B981',                    // vert
    en_production: '#1565C0',                 // bleu
    annule: '#DC2626',                        // rouge
  };
  return colors[statut] || '#6B7280';
}

/**
 * Génère le prochain numéro de facture d'acompte FA-AC-AAMM-NNN.
 * Utilise un compteur atomique Firestore dans counters/facture_acompte_AAMM
 */
export async function generateFactureAcompteNumero(): Promise<string> {
  const { db } = await import('./firebase');
  const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');

  const now = new Date();
  const aamm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const counterId = `facture_acompte_${aamm}`;
  const counterRef = doc(db, 'counters', counterId);

  const numero = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current = snap.exists() ? (snap.data().value || 0) : 0;
    const next = current + 1;
    transaction.set(counterRef, {
      value: next,
      prefix: 'FA-AC',
      period: aamm,
      updated_at: serverTimestamp(),
    }, { merge: true });
    return next;
  });

  return `FA-AC-${aamm}-${String(numero).padStart(3, '0')}`;
}
