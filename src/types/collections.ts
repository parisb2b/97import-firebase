// V52 Checkpoint F — Types TypeScript collections Firestore.
//
// Source de verite pour les noms de collections (constante COLLECTIONS)
// et les schemas typés des principales collections actives en prod.
//
// Pattern d'usage :
//   import { COLLECTIONS, type Facture } from '@/types/collections';
//   const ref = collection(db, COLLECTIONS.invoices);
//   const data = snap.data() as Facture;
//
// Ces types sont DESCRIPTIFS (pas runtime-validated). Pour validation
// runtime au boundary, utiliser Zod ou un sanitize helper dedie.
//
// Etat post-V52 : doublons users/profiles/clients NON resolus (V53).
//                 'containers' n'est PAS exporte ici (deprecated CP C).

import type { Timestamp, FieldValue } from 'firebase/firestore';

// ──────────────────────────────────────────────────────────────────────
//  Constante : noms de collections actives
// ──────────────────────────────────────────────────────────────────────

export const COLLECTIONS = {
  // Coeur metier
  quotes: 'quotes',
  invoices: 'invoices',
  logistics_invoices: 'logistics_invoices',
  conteneurs: 'conteneurs',
  listes_achat: 'listes_achat',
  notes_commission: 'notes_commission',
  sav: 'sav',
  produits: 'produits',

  // Identite / RBAC
  users: 'users',          // historique, schema Auth Firebase etendu
  profiles: 'profiles',    // miroir users (V53 fusion -> clients)
  clients: 'clients',      // V49+ — collection cible post-migration

  // Parametres / counters / logs
  admin_params: 'admin_params',
  counters: 'counters',
  logs: 'logs',
  taux_rmb: 'taux_rmb',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// ──────────────────────────────────────────────────────────────────────
//  Types communs
// ──────────────────────────────────────────────────────────────────────

export type FirestoreTimestamp = Timestamp | FieldValue | Date | null;

export type Destination = 'MQ' | 'GP' | 'RE' | 'GF';

// ──────────────────────────────────────────────────────────────────────
//  Acompte (embedded array dans Quote — cf CP D rapport doublons)
// ──────────────────────────────────────────────────────────────────────

export type AcompteType = 'acompte_1' | 'acompte_2' | 'solde';

export interface Acompte {
  montant: number;
  date: FirestoreTimestamp;
  type: AcompteType;
  reference?: string;
  pdf_url?: string;
  declarePar?: string;
  encaissePar?: string;
  numero?: string;
}

// ──────────────────────────────────────────────────────────────────────
//  Facture (collection 'invoices' — FA, FF, acomptes par devis)
// ──────────────────────────────────────────────────────────────────────

export type FactureType = 'FA' | 'FF';
export type FactureStatut = 'brouillon' | 'envoyee' | 'payee' | 'annulee';

export interface Facture {
  id: string;
  numero: string;
  type: FactureType;
  devis_id: string;
  client_id?: string;
  client_nom: string;
  partenaire_code?: string;
  destination?: Destination;
  total_ht: number;
  total_ttc?: number;
  acompte_montant?: number;
  statut: FactureStatut;
  pdf_url?: string;
  createdAt: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ──────────────────────────────────────────────────────────────────────
//  Conteneur (collection 'conteneurs' — V52 CP C normalise)
// ──────────────────────────────────────────────────────────────────────

export type ConteneurType = '20ft' | '40ft' | '40HC';
export type ConteneurStatut =
  | 'préparation'
  | 'en_chargement'
  | 'chargé'
  | 'parti'
  | 'en_mer'
  | 'arrive'
  | 'livre';

export interface Conteneur {
  id: string;
  numero: string;
  reference: string;
  type: ConteneurType;
  destination: Destination;
  port_chargement?: string;
  port_destination?: string;
  date_depart?: FirestoreTimestamp;
  date_depart_est?: FirestoreTimestamp;
  date_arrivee?: FirestoreTimestamp;
  volume_max: number;
  volume_utilise: number;
  poids_total?: number;
  statut: ConteneurStatut;
  statut_frais?: 'en_attente' | 'envoyee' | 'payee';
  client_nom?: string;
  liste_achat_ids?: string[];
  createdAt: FirestoreTimestamp;
}

// ──────────────────────────────────────────────────────────────────────
//  Liste d'achat (collection 'listes_achat')
// ──────────────────────────────────────────────────────────────────────

export type ListeAchatStatut = 'brouillon' | 'envoyee' | 'recue' | 'closturee';

export interface LigneAchat {
  reference: string;
  designation_fr?: string;
  quantite: number;
  prix_cny_unitaire: number;
  prix_cny_total: number;
  fournisseur_id?: string;
  fournisseur_nom?: string;
}

export interface ListeAchat {
  id: string;
  numero: string;
  date_creation: FirestoreTimestamp;
  conteneur_id?: string;
  conteneur_ref?: string;
  lignes: LigneAchat[];
  nb_lignes: number;
  total_cny: number;
  taux_change_cny_eur?: number;
  total_eur?: number;
  statut: ListeAchatStatut;
  createdAt: FirestoreTimestamp;
}

// ──────────────────────────────────────────────────────────────────────
//  Note de commission (collection 'notes_commission')
// ──────────────────────────────────────────────────────────────────────

export type NoteCommissionStatut = 'due' | 'envoyee' | 'payee' | 'annulee';

export interface NoteCommission {
  id: string;
  numero: string;
  partenaire_id: string;
  partenaire_nom: string;
  partenaire_code?: string;
  devis_id?: string;
  devis_numero?: string;
  client_nom?: string;
  montant_base: number;
  taux: number;
  montant_commission: number;
  statut: NoteCommissionStatut;
  date_paiement?: FirestoreTimestamp;
  pdf_url?: string;
  createdAt: FirestoreTimestamp;
}

// ──────────────────────────────────────────────────────────────────────
//  SAV (collection 'sav')
// ──────────────────────────────────────────────────────────────────────

export type SavStatut = 'nouveau' | 'en_cours' | 'resolu' | 'rejete' | 'clos';

export interface Sav {
  id: string;
  numero: string;
  client_id: string;
  client_nom: string;
  devis_id?: string;
  produit_ref?: string;
  description: string;
  statut: SavStatut;
  date_signalement: FirestoreTimestamp;
  date_resolution?: FirestoreTimestamp;
  resolution?: string;
  photos_urls?: string[];
  createdAt: FirestoreTimestamp;
}

// ──────────────────────────────────────────────────────────────────────
//  Quote (subset — schema complet trop large, voir DetailDevis.tsx)
// ──────────────────────────────────────────────────────────────────────

export type QuoteStatut =
  | 'brouillon'
  | 'en_attente'
  | 'acompte_1'
  | 'acompte_2'
  | 'finalise'
  | 'annule';

export interface QuoteLigne {
  reference: string;
  designation_fr?: string;
  quantite: number;
  prix_unitaire_ht: number;
  total_ht: number;
}

export interface Quote {
  id: string;
  numero: string;
  client_id: string;
  client_nom: string;
  partenaire_code?: string;
  destination: Destination;
  is_vip: boolean;
  lignes: QuoteLigne[];
  total_ht: number;
  total_ttc?: number;
  total_encaisse?: number;
  acomptes?: Acompte[];
  statut: QuoteStatut;
  conteneur_ref?: string;
  createdAt: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ──────────────────────────────────────────────────────────────────────
//  Adresses (V62 — adresse livraison distincte)
// ──────────────────────────────────────────────────────────────────────

export interface Adresse {
  rue: string;
  code_postal: string;
  ville: string;
  pays: string;
}

export interface AdresseLivraison extends Adresse {
  identique_facturation: boolean;
}

// V70 — Type d'adresse avec discriminateur obligatoire
export interface AdresseTypee extends Adresse {
  addressType: 'facturation' | 'livraison';
  identique_facturation?: boolean;
}
