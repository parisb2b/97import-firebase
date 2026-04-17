// src/lib/devisHelpers.ts

export interface DevisLike {
  statut?: string;
  statut_paiement?: string;
  total_ht?: number;
  total_encaisse?: number;
  acomptes?: Array<{ statut?: string; montant?: number }>;
}

/**
 * Détermine si le client peut verser un nouvel acompte sur ce devis.
 * Règles :
 * - Devis non annulé et non en brouillon
 * - Pas déjà soldé
 * - Reste un solde à payer
 * - Moins de 3 acomptes existants (déclarés ou encaissés)
 */
export function peutVerserAcompte(devis: DevisLike): boolean {
  if (!devis) return false;

  const statut = devis.statut || 'nouveau';
  if (statut === 'annule' || statut === 'brouillon') return false;

  const statutPaiement = devis.statut_paiement || 'non_paye';
  if (statutPaiement === 'paye_complet') return false;

  const totalHt = devis.total_ht || 0;
  const totalEncaisse = devis.total_encaisse || 0;
  const soldeRestant = totalHt - totalEncaisse;
  if (soldeRestant <= 0) return false;

  const nbAcomptes = Array.isArray(devis.acomptes) ? devis.acomptes.length : 0;
  if (nbAcomptes >= 3) return false;

  return true;
}

/**
 * Calcule le montant par défaut pour le prochain acompte.
 * Par défaut : 500€, mais pas plus que le solde restant.
 */
export function montantAcompteParDefaut(devis: DevisLike): number {
  const totalHt = devis.total_ht || 0;
  const totalEncaisse = devis.total_encaisse || 0;
  const soldeRestant = Math.max(0, totalHt - totalEncaisse);
  return Math.min(500, soldeRestant);
}

/**
 * Génère la référence acompte affichée au client (pour le virement).
 * Format : DVS-YYMMNNN / Prénom Nom
 */
export function referenceAcompte(devis: any): string {
  const numero = devis.numero || '';
  const prenom = devis.client_prenom || devis.prenom || '';
  const nom = devis.client_nom || devis.nom || '';
  const fullName = `${prenom} ${nom}`.trim() || 'Client';
  return `${numero} / ${fullName}`;
}
