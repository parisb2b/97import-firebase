// src/lib/quoteStatusHelpers.ts
// Helpers pour la gestion des statuts devis + calculs paiements

export type QuoteStatus =
  | 'nouveau'
  | 'acompte_1' | 'acompte_2' | 'acompte_3'
  | 'solde_paye'
  | 'en_production';
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
 * Calcule le statut du devis en fonction des acomptes
 */
export function calculerStatut(total_ht: number, acomptes: Acompte[] = []): QuoteStatus {
  const nbPartiels = getNbAcomptes(acomptes);
  const paye = estEntierementPaye(total_ht, acomptes);

  if (paye) return 'solde_paye';
  if (nbPartiels >= 3) return 'acompte_3';
  if (nbPartiels === 2) return 'acompte_2';
  if (nbPartiels === 1) return 'acompte_1';
  return 'nouveau';
}

/**
 * Libellé lisible du statut
 */
export function libelleStatut(statut: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    nouveau: 'Nouveau — En attente d\'acompte',
    acompte_1: 'Acompte 1 reçu',
    acompte_2: 'Acompte 2 reçu',
    acompte_3: 'Acompte 3 reçu — Solde attendu',
    solde_paye: 'Intégralement payé',
    en_production: 'En production',
  };
  return labels[statut] || statut;
}

/**
 * Couleur du badge statut pour l'UI admin
 */
export function couleurStatut(statut: QuoteStatus): string {
  const colors: Record<QuoteStatus, string> = {
    nouveau: '#6B7280',       // gris
    acompte_1: '#F59E0B',     // orange clair
    acompte_2: '#F59E0B',     // orange
    acompte_3: '#D97706',     // orange foncé
    solde_paye: '#10B981',    // vert
    en_production: '#1565C0', // bleu
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
