// ═══════════════════════════════════════════════════════════
// INTERFACES TYPESCRIPT — 97import.com Firebase
// Migration Supabase → Firestore NoSQL
// Schémas dénormalisés optimisés pour Firestore
// ═══════════════════════════════════════════════════════════

import type { Timestamp } from 'firebase/firestore'

// ── Utilitaire Timestamp Firestore ─────────────────────────
/** Timestamp Firestore ou Date JS */
export type FirestoreDate = Timestamp | Date | null

// ── Rôles utilisateur ──────────────────────────────────────
export type UserRole =
  'visitor' | 'user' | 'vip' | 'partner' | 'admin'

// ═══════════════════════════════════════════════════════════
// COLLECTION : users / profiles
// Ancienne structure SQL : profiles + partners → fusionnés
// Firestore path : users/{uid}
// ═══════════════════════════════════════════════════════════
export interface UserProfile {
  id: string
  email: string
  role: UserRole

  // Identité
  first_name: string
  last_name: string
  phone: string
  company?: string
  siret?: string

  // Adresse facturation
  adresse_facturation: string
  ville_facturation: string
  cp_facturation: string
  pays_facturation: string

  // Adresse livraison
  adresse_livraison: string
  ville_livraison: string
  cp_livraison: string
  pays_livraison: string
  adresse_livraison_identique: boolean

  // Partenaire (si role = 'partner')
  partenaire_code?: string
  commission_taux?: number  // ex: 0.05 pour 5%

  // Méta
  created_at?: FirestoreDate
  updated_at?: FirestoreDate
  derniere_connexion?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : products
// Ancienne table SQL : products
// Firestore path : products/{id}
// ═══════════════════════════════════════════════════════════
export interface Product {
  id: string
  nom: string
  nom_chinois?: string
  nom_anglais?: string
  reference?: string
  numero_interne?: string

  // Catégorie
  categorie?: 'mini-pelles' | 'maisons' | 'solaire' | 'accessoires' | 'agriculture' | string

  // Prix (stocké en EUR HT)
  prix_achat: number
  prix_achat_yuan?: number

  // Stock & état
  actif: boolean
  statut_stock?: 'en_stock' | 'sur_commande' | 'rupture'

  // Médias
  images?: string[]           // URLs publiques ou chemins /images/...
  video_url?: string
  notice_url?: string

  // Dimensions logistiques
  longueur_cm?: number
  largeur_cm?: number
  hauteur_cm?: number
  poids_net_kg?: number
  poids_brut_kg?: number
  qte_pieces_par_unite?: number
  volume_m3?: number

  // Specs techniques
  matiere_fr?: string
  matiere_en?: string
  matiere_zh?: string
  code_hs?: string
  statut_ce?: string

  // Description multilingue
  description_fr?: string
  description_zh?: string

  // Méta Firestore
  created_at?: FirestoreDate
  updated_at?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : quotes
// Ancienne structure SQL : quotes + invoices → fusionnés
// Firestore path : quotes/{id}
// ═══════════════════════════════════════════════════════════
export interface CartItem {
  id: string
  nom: string
  quantite: number
  prixUnitaire: number       // Prix vendu HT
  prix_achat?: number        // Prix achat interne
  numero_interne?: string
  image?: string
  reference?: string
}

export interface Acompte {
  numero: number
  montant: number
  type: 'pro' | 'perso'
  statut: 'en_attente' | 'encaisse'
  date: FirestoreDate
  date_encaissement?: FirestoreDate
  reference_virement?: string
}

export interface Quote {
  id: string
  user_id: string

  // Numérotation auto (ex: D2600001)
  numero_devis: string

  // Workflow
  statut: 'nouveau' | 'en_cours' | 'vip' | 'accepte' | 'refuse' | 'facture'

  // Produits commandés
  produits: CartItem[]

  // Montants
  prix_total_calcule: number
  prix_negocie?: number
  remise_pct?: number

  // Partenaire apporteur
  partenaire_code?: string
  partenaire_id?: string
  commission_montant?: number

  // Acomptes (sous-collection ou array)
  acomptes: Acompte[]
  total_encaisse: number
  solde_restant?: number

  // Facturation
  invoice_number?: string
  facture_generee?: boolean
  pdf_url?: string

  // Client (snapshot au moment du devis)
  nom_client?: string
  email_client?: string
  adresse_client?: string
  ville_client?: string
  telephone_client?: string

  // Livraison
  destination_livraison?: DestinationLivraison

  // Notes
  notes_internes?: string
  notes_client?: string

  // Méta
  created_at?: FirestoreDate
  updated_at?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : partners
// Ancienne table SQL : partners
// Firestore path : partners/{id}
// ═══════════════════════════════════════════════════════════
export interface Partner {
  id: string
  nom: string
  code: string               // Code partenaire unique (ex: RIPPA-001)
  email?: string
  telephone?: string
  user_id?: string           // UID Firebase Auth associé
  commission_taux: number    // ex: 0.05 = 5%
  actif: boolean
  created_at?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : invoices
// Ancienne table SQL : invoices
// Firestore path : invoices/{id} (lié à quotes/{quote_id})
// ═══════════════════════════════════════════════════════════
export interface Invoice {
  id: string
  numero_facture: string     // ex: F2600001
  quote_id: string
  user_id: string

  // Montants
  montant_ht: number
  montant_ttc?: number
  tva_taux?: number          // ex: 8.5 pour DOM-TOM
  montant_acompte: number

  // Type
  type_facture: 'acompte' | 'solde' | 'avoir'
  type_paiement: 'pro' | 'perso' | 'virement'

  // Envoi
  pdf_url?: string
  envoye_client: boolean
  envoye_le?: FirestoreDate

  // Méta
  created_at?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : leads
// Firestore path : leads/{id}
// Sources : formulaire contact, WhatsApp, landing pages
// ═══════════════════════════════════════════════════════════
export type LeadStatut = 'nouveau' | 'contacté' | 'qualifié' | 'perdu'
export type LeadSource = 'formulaire' | 'whatsapp' | 'tiktok' | 'referral' | 'direct'

export interface Lead {
  id: string
  nom: string
  email: string
  telephone?: string
  message: string
  source: LeadSource
  statut: LeadStatut
  produit?: string           // Produit d'intérêt
  destination?: string       // Île DOM-TOM
  budget_estime?: number
  user_id?: string           // Si lead connecté
  created_at?: FirestoreDate
  updated_at?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : contacts
// Firestore path : contacts/{id}
// Messages du formulaire /contact
// ═══════════════════════════════════════════════════════════
export interface ContactMessage {
  id?: string
  nom: string
  email: string
  telephone?: string
  sujet?: string
  message: string
  lu: boolean
  repondu: boolean
  created_at?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : site_content
// Firestore path : site_content/{section}
// CMS headless pour le contenu éditorial
// ═══════════════════════════════════════════════════════════
export interface SiteContent {
  id?: string
  section: string            // 'hero' | 'about' | 'banner' | etc.
  titre_fr?: string
  titre_zh?: string
  sous_titre_fr?: string
  sous_titre_zh?: string
  corps_fr?: string
  corps_zh?: string
  image_url?: string
  cta_label_fr?: string
  cta_label_zh?: string
  cta_url?: string
  actif: boolean
  updated_at?: FirestoreDate
}

// ═══════════════════════════════════════════════════════════
// COLLECTION : admin_params
// Firestore path : admin_params/{param_id}
// Configuration dynamique du site
// ═══════════════════════════════════════════════════════════
export type DestinationLivraison =
  'martinique' | 'guadeloupe' | 'guyane' | 'reunion' | 'mayotte' | 'saint_martin' | 'polynesie'

export interface ShippingRate {
  destination: DestinationLivraison
  label_fr: string
  label_zh: string
  // Tarifs par taille de conteneur (USD → EUR conversion par taux)
  conteneur_20ft: number     // EUR
  conteneur_40ft: number
  conteneur_40ft_hc: number
  hors_gabarit?: number
  // Délai
  delai_jours: number
}

export interface AdminParams {
  // Finance
  taux_eur_rmb: number       // ex: 8.0
  tva_domtom: number         // ex: 8.5

  // Multiplicateurs de prix par rôle
  multiplicateurs: {
    user: number             // ex: 2.0
    partner: number          // ex: 1.2
    vip: number              // ex: 1.3
    admin: number            // ex: 1.0
  }

  // Contact
  whatsapp: string
  email_contact: string
  email_devis: string
  tiktok_url: string

  // Shipping (subcollection ou embedded)
  shipping_rates?: ShippingRate[]
}

// ═══════════════════════════════════════════════════════════
// FORMULAIRES (Data Transfer Objects)
// ═══════════════════════════════════════════════════════════
export interface DevisFormData {
  nom: string
  email: string
  telephone?: string
  societe?: string
  destination: DestinationLivraison | ''
  message?: string
  produits: CartItem[]
}

export interface ContactFormData {
  nom: string
  email: string
  telephone?: string
  sujet?: string
  message: string
}

// ═══════════════════════════════════════════════════════════
// PRICING
// ═══════════════════════════════════════════════════════════
export interface PricingResult {
  prix_achat_eur: number
  prix_vente_eur: number
  prix_vente_rmb: number
  multiplicateur: number
  marge_eur: number
  marge_pct: number
}
