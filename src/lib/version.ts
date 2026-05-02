// src/lib/version.ts
// Métadonnées de build injectées par Vite (cf. vite.config.ts → define).
// Le formatage en heure de Paris est fait ici, à l'affichage, pour être
// indépendant du fuseau du serveur Vercel et du visiteur (DOM-TOM, métropole, …).

declare global {
  const __APP_VERSION__: string;
  const __BUILD_ISO__: string;
  const __COMMIT_HASH__: string;
}

export const APP_VERSION: string = (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) || '0.0.0';
export const BUILD_ISO: string = (typeof __BUILD_ISO__ !== 'undefined' && __BUILD_ISO__) || new Date().toISOString();
export const COMMIT_HASH: string = ((typeof __COMMIT_HASH__ !== 'undefined' && __COMMIT_HASH__) || 'dev').slice(0, 7);

/**
 * Formate la date de build en heure de Paris (Europe/Paris).
 * Gère automatiquement CEST (été UTC+2) et CET (hiver UTC+1).
 * @param iso ISO 8601 UTC (par défaut BUILD_ISO injecté par Vite)
 * @returns ex. "25/04/2026 19:37" ou "dev" si parse échoue
 */
export function formatBuildDate(iso: string = BUILD_ISO): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'dev';

    const datePart = d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    });

    const timePart = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });

    return `${datePart} ${timePart}`;
  } catch {
    console.warn('getBuildDisplay: échec formatage date, fallback dev');
    return 'dev';
  }
}

/**
 * Chaîne complète du badge version, prête à afficher.
 * Exemple : "v0.43.2 · 25/04/2026 19:37 · fba8ec7"
 */
export function formatBuildInfo(): string {
  return `v${APP_VERSION} · ${formatBuildDate()} · ${COMMIT_HASH}`;
}

// Export pour compatibilité avec les usages existants (Footer.tsx).
export const VERSION_LABEL = formatBuildInfo();
