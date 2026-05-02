// Donnees de test reutilisables pour les parcours E2E
// V62 — valeurs par defaut, surchargeables via variables d'env

export const TEST_USERS = {
  client: {
    email: process.env.TEST_CLIENT_EMAIL || 'michel.chen@example.com',
    password: process.env.TEST_CLIENT_PASSWORD || '',
    name: 'Michel Client Test',
  },
  partner: {
    email: process.env.TEST_PARTNER_EMAIL || 'tt@tartinique.com',
    password: process.env.TEST_PARTNER_PASSWORD || '',
    name: 'TT Tartinique',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'parisb2b@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || '',
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
