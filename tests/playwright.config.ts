import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://97import-firebase-git-v2-parisb2bs-projects.vercel.app',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'client', testMatch: 'parcours-client.spec.ts' },
    { name: 'partenaire', testMatch: 'parcours-partenaire.spec.ts' },
    { name: 'admin', testMatch: 'parcours-admin.spec.ts' },
  ],
});
