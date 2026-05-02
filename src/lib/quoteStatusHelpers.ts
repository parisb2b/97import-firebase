// src/lib/quoteStatusHelpers.ts
// Helpers pour la gestion des statuts devis + calculs paiements (13 statuts complets)

import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { adminAuth, adminDb, db } from './firebase';

export type QuoteStatus =
  | 'nouveau'
  | 'en_negociation_partenaire'
  | 'devis_vip_envoye'
  | 'signe'
  | 'acompte_1' | 'acompte_2' | 'acompte_3'
  | 'solde_paye'
  | 'commande_ferme'
  | 'en_production'
  | 'embarque_chine'
  | 'arrive_port_domtom'
  | 'livre'
  | 'termine'
  | 'annule';

export interface Acompte {
  numero: number;              // 1, 2, 3 ou 0 pour solde
  montant: number;
  date_reception: string;      // ISO string
  reference_virement?: string;
  facture_acompte_numero?: string; // FA-AC-AAMM-NNN
  facture_acompte_pdf_url?: string;
  is_solde?: boolean;
  encaisse: boolean;           // true si validé par admin
  created_at: string;
  created_by: string;          // UID admin qui a validé
}

export interface FactureFinale {
  numero: string;              // FA-AAMM-NNN
  pdf_url?: string;
  date_emission: string;
  total: number;
  generee_auto: boolean;
}

export interface QuoteLine {
  reference: string;
  nom: string;
  quantite: number;
  prix_achat?: number;
  prix_partenaire?: number;    // prix de référence pour commission
  prix_vip_negocie?: number;   // prix final négocié par le partenaire
  prix_unitaire_final: number; // prix qui sera facturé
  total_ligne: number;
}

/**
 * Montant total ENCAISSÉ (acomptes où encaisse=true)
 */
export function getTotalEncaisse(acomptes: Acompte[] = []): number {
  return acomptes
    .filter(a => a.encaisse === true)
    .reduce((sum, a) => sum + (a.montant || 0), 0);
}

/**
 * Montant restant à payer (basé sur l'encaissé réel)
 */
export function getSoldeRestant(total_ht: number, acomptes: Acompte[] = []): number {
  return Math.max(0, total_ht - getTotalEncaisse(acomptes));
}

/**
 * Nombre d'acomptes PARTIELS encaissés (hors solde)
 */
export function getNbAcomptesEncaisses(acomptes: Acompte[] = []): number {
  return acomptes.filter(a => a.encaisse === true && !a.is_solde).length;
}

/**
 * V46 Checkpoint D — Nombre total d'acomptes DÉCLARÉS (encaissés + en attente)
 * hors solde forcé. Utilisé pour la limite "max 3 acomptes" en amont
 * du chemin d'encaissement (sinon contournable en empilant des déclarations).
 */
export function getNbAcomptesDeclares(acomptes: Acompte[] = []): number {
  return acomptes.filter(a => !a.is_solde).length;
}

/**
 * Peut-on encore ajouter un acompte partiel ? (max 3 sur les déclarations,
 * encaissées OU en attente — V46 Checkpoint D, anciennement comptait
 * uniquement les encaissées ce qui permettait d'empiler des déclarations).
 */
export function peutAjouterAcompte(acomptes: Acompte[] = [], soldeRestant: number): boolean {
  return getNbAcomptesDeclares(acomptes) < 3 && soldeRestant > 0.01;
}

/**
 * Le prochain paiement doit-il être le solde forcé ?
 * V46 Checkpoint D : compte les déclarations totales (encaissées + en attente),
 * pas seulement les encaissées — la règle "4ème = solde forcé" doit s'appliquer
 * dès qu'on a 3 déclarations même si admin n'a pas encore encaissé.
 */
export function prochainPaiementEstSolde(acomptes: Acompte[] = []): boolean {
  return getNbAcomptesDeclares(acomptes) >= 3;
}

/**
 * Le devis est-il entièrement payé ?
 */
export function estEntierementPaye(total_ht: number, acomptes: Acompte[] = []): boolean {
  return getSoldeRestant(total_ht, acomptes) <= 0.01;
}

/**
 * Valide un nouveau paiement avant enregistrement.
 *
 * V46 Checkpoint D — calcul du restant basé sur la SOMME DE TOUS LES ACOMPTES
 * non-soldés passés en paramètre (encaissés ET en attente d'encaissement).
 * Le caller contrôle ce qu'il passe :
 *   - chemin DÉCLARATION : passe `acomptes` complet → restant strict
 *   - chemin ENCAISSEMENT : passe `acomptes.filter(a.encaisse===true)` →
 *     restant = total_ht - encaissés (sémantique inchangée, l'acompte cible
 *     n'est pas dans la liste donc son ajout est bien validé).
 *
 * Avant V46 : utilisait `getSoldeRestant` qui filtrait `encaisse === true` en
 * interne → chemin déclaration retournait un restant trop généreux ignorant les
 * déclarations en attente. Bug observé Michel V46 (acomptes overflow).
 */
export function validerNouveauPaiement(
  total_ht: number,
  acomptes: Acompte[] = [],
  montant: number
): { ok: boolean; erreur?: string } {
  if (montant < 50) {
    return { ok: false, erreur: 'Montant minimum : 50€ par paiement' };
  }
  // Somme de tous les acomptes passés (hors solde forcé) — peu importe encaisse.
  const totalDejaAcompte = acomptes
    .filter(a => !a.is_solde)
    .reduce((sum, a) => sum + (a.montant || 0), 0);
  const restant = Math.max(0, total_ht - totalDejaAcompte);

  if (montant > restant + 0.01) {
    return {
      ok: false,
      erreur: `Acompte impossible : reste à payer = ${restant.toFixed(2)} €, vous saisissez ${montant.toFixed(2)} €`,
    };
  }
  if (prochainPaiementEstSolde(acomptes) && Math.abs(montant - restant) > 0.01) {
    return { ok: false, erreur: `4e paiement = solde forcé (${restant.toFixed(2)}€ obligatoire)` };
  }
  return { ok: true };
}

/**
 * Calcule le statut du devis en fonction des acomptes (sans toucher au statut si non-paiement)
 * Retourne le statut MÊME si déjà avancé (ex: reste commande_ferme si déjà commandé).
 * Ne pas downgrader : si statut > solde_paye, on garde.
 */
export function calculerStatutPaiement(
  statutActuel: QuoteStatus,
  total_ht: number,
  acomptes: Acompte[] = []
): QuoteStatus {
  // Si statut avancé (commande_ferme et +), on garde
  const statutsAvances: QuoteStatus[] = ['commande_ferme', 'en_production', 'embarque_chine', 'arrive_port_domtom', 'livre', 'termine', 'annule'];
  if (statutsAvances.includes(statutActuel)) return statutActuel;

  const nbPartiels = getNbAcomptesEncaisses(acomptes);
  const paye = estEntierementPaye(total_ht, acomptes);

  if (paye) return 'solde_paye';
  if (nbPartiels >= 3) return 'acompte_3';
  if (nbPartiels === 2) return 'acompte_2';
  if (nbPartiels === 1) return 'acompte_1';

  // Si statut amont (nouveau, négociation, signe), on garde (ne downgrade pas)
  return statutActuel;
}

/**
 * Libellé lisible du statut
 */
export function libelleStatut(statut: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    nouveau: 'Nouveau — En attente',
    en_negociation_partenaire: 'Négociation partenaire',
    devis_vip_envoye: 'Devis VIP envoyé',
    signe: 'Signé — En attente paiement',
    acompte_1: 'Acompte 1 reçu',
    acompte_2: 'Acompte 2 reçu',
    acompte_3: 'Acompte 3 reçu — Solde attendu',
    solde_paye: 'Facture payée',
    commande_ferme: 'Commande ferme',
    en_production: 'En production',
    embarque_chine: 'Embarqué — Conteneur parti',
    arrive_port_domtom: 'Arrivé au port',
    livre: 'Livré',
    termine: 'Clôturé',
    annule: 'Annulé',
  };
  return labels[statut] || statut;
}

/**
 * Couleur du badge statut
 */
export function couleurStatut(statut: QuoteStatus): string {
  const colors: Record<QuoteStatus, string> = {
    nouveau: '#6B7280',
    en_negociation_partenaire: '#8B5CF6',
    devis_vip_envoye: '#A855F7',
    signe: '#3B82F6',
    acompte_1: '#F59E0B',
    acompte_2: '#F59E0B',
    acompte_3: '#D97706',
    solde_paye: '#10B981',
    commande_ferme: '#059669',
    en_production: '#1565C0',
    embarque_chine: '#0891B2',
    arrive_port_domtom: '#0E7490',
    livre: '#047857',
    termine: '#374151',
    annule: '#DC2626',
  };
  return colors[statut] || '#6B7280';
}

/**
 * Footer text pour PDF selon statut + contexte
 */
export function footerTextPDF(
  statut: QuoteStatus,
  contexte: {
    partenaire_code?: string;
    date_signature?: string;
    date_acompte?: string;
    numero_acompte?: number;
    date_solde?: string;
    date_commande?: string;
    date_embarquement?: string;
    date_arrivee?: string;
    date_livraison?: string;
  }
): string {
  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '';

  switch (statut) {
    case 'nouveau':
      return "DEVIS — En attente d'acceptation";
    case 'en_negociation_partenaire':
      return `DEVIS EN NÉGOCIATION — Partenaire ${contexte.partenaire_code || 'N/A'}`;
    case 'devis_vip_envoye':
      return `DEVIS VIP — Prix négocié partenaire ${contexte.partenaire_code || 'N/A'}`;
    case 'signe':
      return `DEVIS SIGNÉ — En attente de paiement${contexte.date_signature ? ` (le ${fmt(contexte.date_signature)})` : ''}`;
    case 'acompte_1':
    case 'acompte_2':
    case 'acompte_3':
      return `FACTURE ACOMPTE N°${contexte.numero_acompte || 1}/3 — Reçue le ${fmt(contexte.date_acompte)}`;
    case 'solde_paye':
      return `FACTURE PAYÉE — Solde reçu le ${fmt(contexte.date_solde)}`;
    case 'commande_ferme':
      return `COMMANDE FERME — Commandée le ${fmt(contexte.date_commande)}`;
    case 'embarque_chine':
      return `EMBARQUÉ — Conteneur parti le ${fmt(contexte.date_embarquement)}`;
    case 'arrive_port_domtom':
      return `ARRIVÉ AU PORT — Le ${fmt(contexte.date_arrivee)}`;
    case 'livre':
      return `LIVRÉE — Le ${fmt(contexte.date_livraison)}`;
    case 'termine':
      return 'CLÔTURÉ';
    case 'annule':
      return 'ANNULÉ';
    default:
      return '';
  }
}

/**
 * Génère le prochain numéro via compteur atomique Firestore
 * Types : 'facture_acompte' (FA-AC), 'facture_finale' (FA), 'note_commission' (NC)
 */
export async function generateNumeroDocument(
  type: 'facture_acompte' | 'facture_finale' | 'note_commission'
): Promise<string> {
  const firestoreDb = adminAuth.currentUser ? adminDb : db;

  const now = new Date();
  const aamm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const prefixMap = {
    facture_acompte: 'FA-AC',
    facture_finale: 'FA',
    note_commission: 'NC',
  };
  const prefix = prefixMap[type];
  const counterId = `${type}_${aamm}`;
  const counterRef = doc(firestoreDb, 'counters', counterId);

  const numero = await runTransaction(firestoreDb, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current = snap.exists() ? (snap.data().value || 0) : 0;
    const next = current + 1;
    transaction.set(counterRef, {
      value: next,
      prefix,
      period: aamm,
      updated_at: serverTimestamp(),
    }, { merge: true });
    return next;
  });

  return `${prefix}-${aamm}-${String(numero).padStart(3, '0')}`;
}
