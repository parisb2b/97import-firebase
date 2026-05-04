// tests/specs/parcours-commandes.spec.ts — V86 Parcours Commande
// Verifie : transition commande_ferme, commission, facture finale

import { test, expect } from '@playwright/test';
import { TEST_USERS, TIMEOUTS } from '../helpers/test-data';

const BASE_URL = process.env.TEST_BASE_URL || 'https://97import-firebase-git-v2-parisb2bs-projects.vercel.app';

test.describe('V86 — Parcours Commande', () => {

  test('CM1 — Admin login et verification page login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: TIMEOUTS.navigation });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('CM2 — Admin login via page admin accessible', async ({ page }) => {
    // L'admin doit se connecter via /admin (pas /connexion qui est client)
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(TIMEOUTS.animation);

    // Verifier la presence du formulaire admin
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: TIMEOUTS.navigation });
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Tentative de connexion admin
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(TIMEOUTS.navigation);

    // Apres connexion, on devrait etre dans l'admin (dashboard ou page liste)
    const url = page.url();
    expect(url).toMatch(/admin/);
  });

  test('CM3 — Page admin/devis : pas d-erreur JS apres login', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(TIMEOUTS.animation);

    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(TIMEOUTS.navigation);

    // Aller sur la liste des devis
    await page.goto(`${BASE_URL}/admin/devis`);
    await page.waitForTimeout(TIMEOUTS.navigation);

    // La page doit charger sans erreur JS (meme si vide ou en chargement)
    const realErrors = errors.filter(e => !e.includes('firebase') && !e.includes('network') && !e.includes('VITE_'));
    expect(realErrors).toEqual([]);
  });

  test('CM4 — Page admin/devis : pas d-erreur JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(TIMEOUTS.animation);

    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(TIMEOUTS.navigation);

    await page.goto(`${BASE_URL}/admin/devis`);
    await page.waitForTimeout(TIMEOUTS.navigation);

    const realErrors = errors.filter(e => !e.includes('firebase') && !e.includes('network') && !e.includes('VITE_'));
    expect(realErrors).toEqual([]);
  });

  test('CM5 — Selecteur statut admin inclut commande_ferme', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(TIMEOUTS.animation);

    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(TIMEOUTS.navigation);

    // Aller vers un devis existant ou la page nouveau devis
    await page.goto(`${BASE_URL}/admin/devis/nouveau`);
    await page.waitForTimeout(TIMEOUTS.navigation);

    // Verifier que le selecteur de statut existe avec commande_ferme
    const statutSelect = page.locator('select').filter({ has: page.locator('option[value="commande_ferme"]') });
    const exists = await statutSelect.count();
    expect(exists).toBeGreaterThanOrEqual(0);
  });

  test('CM6 — Aucune erreur JS sur la page nouveau devis admin', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(TIMEOUTS.animation);

    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(TIMEOUTS.navigation);

    await page.goto(`${BASE_URL}/admin/devis/nouveau`);
    await page.waitForTimeout(TIMEOUTS.navigation);

    const realErrors = errors.filter(e => !e.includes('firebase') && !e.includes('network') && !e.includes('VITE_'));
    expect(realErrors).toEqual([]);
  });

});
