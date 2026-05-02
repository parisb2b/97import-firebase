// Donnees de test reutilisables pour les parcours E2E
// V63 — comptes de test documentes (mot de passe temporaire : 20262026)
// Tous les mots de passe seront changes avant publication sur 97import.com
// Priorite : variables d'environnement > defauts locaux

const TEST_PWD = process.env.TEST_PASSWORD || '';

export const TEST_USERS = {
  client: {
    email: process.env.TEST_CLIENT_EMAIL || 'mc@sasfr.com',
    password: process.env.TEST_CLIENT_PASSWORD || TEST_PWD,
    name: 'Michel Chen',
  },
  partner: {
    email: process.env.TEST_PARTNER_EMAIL || '97importcom@gmail.com',
    password: process.env.TEST_PARTNER_PASSWORD || TEST_PWD,
    name: '97importcom',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'parisb2b@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || TEST_PWD,
  },
} as const;

export const TEST_PRODUCT = {
  ref: 'MP-R22-001',
  name: 'Mini-pelle R22 PRO',
};

export const TIMEOUTS = {
  navigation: 10000,
  firestore: 15000,
  animation: 500,
};

/** Genere un email unique pour les tests de creation de compte */
export function uniqueEmail(prefix = 'test'): string {
  const ts = Date.now();
  return `${prefix}-${ts}@test.97import.com`;
}
