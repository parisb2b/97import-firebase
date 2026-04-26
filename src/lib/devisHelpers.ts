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

  // v43-E3.2 v2 : workflow libre — limite uniquement le nb total de paiements
  // (encaissés + déclarés en attente). Le client peut enchaîner les versements
  // sans attendre la validation admin. Max strict : 4 paiements totaux.
  const acomptes = Array.isArray(devis.acomptes) ? devis.acomptes : [];
  const nbPaiementsTotal = acomptes.length;
  if (nbPaiementsTotal >= 4) return false;

  return true;
}

/**
 * Montant restant que le client peut encore verser.
 * = Total HT - (Encaissés + Déclarés en attente)
 *
 * Différent de getSoldeRestant() qui ne soustrait que les encaissés.
 * Cette fonction est utilisée pour l'affichage côté CLIENT, pour
 * éviter de proposer de payer le solde 2 fois (une fois en déclaré,
 * une fois en bouton solde).
 */
export function getMontantRestantAVerser(devis: DevisLike): number {
  if (!devis) return 0;
  const totalHt = devis.total_ht || 0;
  const acomptes = Array.isArray(devis.acomptes) ? devis.acomptes : [];
  const totalPaiements = acomptes.reduce((sum: number, a: any) => sum + (a.montant || 0), 0);
  return Math.max(0, totalHt - totalPaiements);
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
