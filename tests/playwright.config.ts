import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'client', testMatch: 'parcours-client.spec.ts' },
    { name: 'vip', testMatch: 'parcours-vip.spec.ts' },
    { name: 'partenaire', testMatch: 'parcours-partenaire.spec.ts' },
    { name: 'admin', testMatch: 'parcours-admin.spec.ts' },
    { name: 'regression', testMatch: 'regression-ano.spec.ts' },
    { name: 'v64', testMatch: 'parcours-v64.spec.ts' },
    { name: 'v75', testMatch: 'parcours-v75.spec.ts' },
    { name: 'v149', testMatch: 'parcours-v149.spec.ts' },
    { name: 'commandes', testMatch: 'parcours-commandes.spec.ts' },
    { name: 'devis', testMatch: 'test-devis-direct.spec.ts' },
    { name: 'debug', testMatch: 'debug-devis.spec.ts' },
    { name: 'full-flow', testMatch: 'full-flow.spec.ts' },
  ],
});
