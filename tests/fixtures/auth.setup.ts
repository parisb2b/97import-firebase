// Authentification multi-roles pour tests Playwright
// Sauvegarde les sessions dans tests/fixtures/*.storageState.json
// Usage : npx playwright test --project=setup

import { test as setup } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname);
const AUTH_FILE_CLIENT = path.join(AUTH_DIR, 'client.storageState.json');
const AUTH_FILE_PARTNER = path.join(AUTH_DIR, 'partner.storageState.json');
const AUTH_FILE_ADMIN = path.join(AUTH_DIR, 'admin.storageState.json');

const BASE_URL = process.env.TEST_BASE_URL || 'https://97import-firebase-git-v2-parisb2bs-projects.vercel.app';

setup('authenticate client', async ({ page }) => {
  const email = process.env.TEST_CLIENT_EMAIL;
  const pwd = process.env.TEST_CLIENT_PASSWORD;
  if (!email || !pwd) { console.log('⏭️  Client: pas de credentials, skip'); return; }

  await page.goto(`${BASE_URL}/connexion`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pwd);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/espace-client/**', { timeout: 10000 }).catch(() => {});
  await page.context().storageState({ path: AUTH_FILE_CLIENT });
  console.log('✅ Client authentifie');
});

setup('authenticate partenaire', async ({ page }) => {
  const email = process.env.TEST_PARTNER_EMAIL;
  const pwd = process.env.TEST_PARTNER_PASSWORD;
  if (!email || !pwd) { console.log('⏭️  Partenaire: pas de credentials, skip'); return; }

  await page.goto(`${BASE_URL}/espace-partenaire`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pwd);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/espace-partenaire/**', { timeout: 10000 }).catch(() => {});
  await page.context().storageState({ path: AUTH_FILE_PARTNER });
  console.log('✅ Partenaire authentifie');
});

setup('authenticate admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const pwd = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !pwd) { console.log('⏭️  Admin: pas de credentials, skip'); return; }

  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pwd);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/**', { timeout: 10000 }).catch(() => {});
  await page.context().storageState({ path: AUTH_FILE_ADMIN });
  console.log('✅ Admin authentifie');
});
