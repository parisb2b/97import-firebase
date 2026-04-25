// src/lib/version.ts
// Métadonnées de build injectées par Vite (cf. vite.config.ts → define).
// Affiché dans le badge en bas du Footer (mini-étape v43).

declare global {
  const __APP_VERSION__: string;
  const __BUILD_DATE__: string;
  const __COMMIT_HASH__: string;
}

export const APP_VERSION = __APP_VERSION__;
export const BUILD_DATE = __BUILD_DATE__;
export const COMMIT_HASH = __COMMIT_HASH__;

/** Format prêt pour affichage : "v0.43.2 · 25/04 19:35 · 7eea0e1" */
export const VERSION_LABEL = `v${APP_VERSION} · ${BUILD_DATE} · ${COMMIT_HASH}`;
