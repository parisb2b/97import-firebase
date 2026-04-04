export type UserRole = 'admin' | 'partner' | 'vip' | 'user' | 'public'

export const MULTIPLICATEURS: Record<UserRole, number> = {
  admin: 1,
  partner: 1.2,
  vip: 1.3,
  user: 2,
  public: 2,
}

export const TAUX_EUR_RMB = 8

/**
 * Calcule le prix de vente en appliquant le multiplicateur selon le rôle.
 * Le prix d'achat est en RMB, le résultat est en EUR.
 */
export function calculerPrixVente(prixAchat: number, role: UserRole): number {
  const multiplicateur = MULTIPLICATEURS[role]
  const prixVenteRMB = prixAchat * multiplicateur
  return Math.round((prixVenteRMB / TAUX_EUR_RMB) * 100) / 100
}

/**
 * Calcule la marge en EUR entre le prix de vente et le prix d'achat converti.
 */
export function calculerMarge(prixAchat: number, prixVente: number): number {
  const prixAchatEUR = prixAchat / TAUX_EUR_RMB
  return Math.round((prixVente - prixAchatEUR) * 100) / 100
}

/**
 * Calcule la commission sur une négociation client.
 * Retourne le montant de la commission et le taux en pourcentage.
 */
export function calculerCommission(
  prixAchat: number,
  prixNegocieClient: number
): { montant: number; taux: number } {
  const prixAchatEUR = prixAchat / TAUX_EUR_RMB
  const montant = Math.round((prixNegocieClient - prixAchatEUR) * 100) / 100
  const taux = prixAchatEUR > 0 ? Math.round((montant / prixAchatEUR) * 10000) / 100 : 0
  return { montant, taux }
}
