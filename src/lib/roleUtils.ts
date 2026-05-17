/**
 * 97IMPORT — Utilitaire de Gestion et Normalisation des Rôles
 * Encodage : UTF-8
 * V174 — Immunise contre l'ancien terme 'partner' (anglais) présent dans Firestore
 */

export const ROLE_PARTENAIRE = 'partenaire';
export const ROLE_VIP = 'vip';
export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'user';

/**
 * Normalise les rôles de manière défensive.
 * Convertit automatiquement 'partner' (en) vers 'partenaire' (fr).
 */
export function normalizeRole(role: string | null | undefined): string {
  if (!role) return ROLE_USER;
  const lower = role.trim().toLowerCase();
  if (lower === 'partner') return ROLE_PARTENAIRE;
  return lower;
}

/** Vérifie si un rôle correspond à un partenaire, quelle que soit la langue d'origine */
export function isPartnerRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLE_PARTENAIRE;
}

/** Vérifie si un rôle correspond à un administrateur */
export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLE_ADMIN;
}
