/**
 * calculPrix.ts — Source unique de calcul des prix
 * Tous les composants importent depuis ici.
 *
 * MONNAIE PIVOT : Euro (€)
 * Le champ `price` du JSON source (products.json) est en EUR HT.
 * Le champ `prix_achat` dans Firestore est en EUR HT.
 *
 * TAUX DE CHANGE : 1 EUR = 8 RMB
 * Conversion EUR → RMB : prix_eur × 8
 * Conversion RMB → EUR : prix_rmb / 8
 *
 * MULTIPLICATEURS :
 *   user    = prix_achat × 2     (prix public)
 *   partner = prix_achat × 1.2   (prix partenaire)
 *   vip     = prix_achat × 1.3   (fallback si pas de prix négocié)
 *   admin   = prix_achat          (prix coûtant)
 */

import { UserRole } from '../types'

// ── Taux de change EUR → RMB ───────────────────────────────
// 1 EUR = 8 RMB
// Pour afficher un prix EUR en RMB : MULTIPLIER par 8
// Pour convertir un prix RMB en EUR : DIVISER par 8
export const TAUX_EUR_RMB = 8 as const

export interface PrixAffiche {
  montant: number | null   // null = non connecté (en EUR)
  label: string
  estVIP: boolean
  prixPublic: number       // prix_achat × 2 (en EUR)
}

export const MULTIPLICATEURS = {
  user:    2,
  partner: 1.2,
  vip:     1.3,   // fallback si pas de prix négocié
} as const

/**
 * Convertit un prix EUR en RMB
 * 100€ → 800 RMB
 * @param prixEur prix en euros
 * @returns prix en yuan (arrondi à l'entier)
 */
export function eurToYuan(prixEur: number): number {
  return Math.round(prixEur * TAUX_EUR_RMB)
}

/**
 * Convertit un prix RMB en EUR
 * 800 RMB → 100€
 * @param prixYuan prix en yuan / RMB
 * @returns prix en EUR (arrondi à l'entier)
 */
export function yuanToEur(prixYuan: number): number {
  return Math.round(prixYuan / TAUX_EUR_RMB)
}

/**
 * Calcule le prix à afficher selon le rôle
 * @param prixAchat  prix d'achat HT en EUR (monnaie pivot)
 * @param role       rôle de l'utilisateur
 * @param prixNegocie prix négocié VIP (optionnel, en EUR)
 */
export function calculerPrix(
  prixAchat: number,
  role: UserRole,
  prixNegocie?: number
): PrixAffiche {
  const prixPublic = prixAchat * MULTIPLICATEURS.user

  switch (role) {
    case 'visitor':
      return { montant: null, label: 'Connectez-vous', estVIP: false, prixPublic }

    case 'user':
      return {
        montant: prixAchat * MULTIPLICATEURS.user,
        label: 'Prix HT',
        estVIP: false,
        prixPublic,
      }

    case 'partner':
      return {
        montant: prixAchat * MULTIPLICATEURS.partner,
        label: 'Prix partenaire HT',
        estVIP: false,
        prixPublic,
      }

    case 'vip':
      return {
        montant: prixNegocie ?? prixAchat * MULTIPLICATEURS.vip,
        label: 'Votre prix négocié HT',
        estVIP: true,
        prixPublic,
      }

    case 'admin':
      return {
        montant: prixAchat,
        label: 'Prix achat HT',
        estVIP: false,
        prixPublic,
      }

    default:
      return { montant: null, label: 'Connectez-vous', estVIP: false, prixPublic }
  }
}

/**
 * Formate un prix en euros FR
 */
export function formatPrix(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant)
}

/**
 * Formate un prix en yuan RMB
 */
export function formatYuan(montant: number): string {
  return `¥ ${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant)}`
}

/**
 * Calcule la commission partenaire
 * commission = prix_client_négocié - prix_partenaire (tout en EUR)
 */
export function calculerCommission(
  prixAchat: number,
  prixNegocieClient: number
): { prixPartenaire: number; commission: number } {
  const prixPartenaire = prixAchat * MULTIPLICATEURS.partner
  const commission = prixNegocieClient - prixPartenaire
  return { prixPartenaire, commission }
}
