/**
 * 97IMPORT — Système Centralisé de Traduction et Normalisation Récursive des Rôles
 * Encodage : UTF-8 | Version : V174-DEFENSIVE
 */

export const ROLE_ADMIN = 'admin';
export const ROLE_PARTENAIRE = 'partenaire';
export const ROLE_VIP = 'vip';
export const ROLE_USER = 'user';

/**
 * Normalise les chaînes de caractères de rôles.
 * Corrige automatiquement le pattern anglais 'partner' vers le standard applicatif 'partenaire'.
 */
export function normalizeRole(role: string | null | undefined): string {
  if (!role) return ROLE_USER;
  const standard = role.trim().toLowerCase();
  if (standard === 'partner') return ROLE_PARTENAIRE;
  return standard;
}

export function isUserAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLE_ADMIN;
}

export function isUserPartenaire(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLE_PARTENAIRE;
}

export function isUserVip(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLE_VIP;
}
