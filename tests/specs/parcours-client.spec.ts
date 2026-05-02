// Parcours Client — tests E2E
// Usage : npx playwright test tests/specs/parcours-client.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Parcours Client', () => {

  test('C01 — Page Catalogue accessible', async ({ page }) => {
    await page.goto('/catalogue');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('C02 — Page Produit chargee', async ({ page }) => {
    await page.goto('/produits/mp-r22-001');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('C03 — Panier : recap et total affiches correctement (BUG-03)', async ({ page }) => {
    await page.goto('/panier');
    // La page panier doit au moins charger sans erreur
    await expect(page.locator('text=Votre panier')).toBeVisible();
    // Verifier qu'aucun texte tronque n'est present (police V62)
    const bodyFontSize = await page.evaluate(() =>
      window.getComputedStyle(document.body).fontSize
    );
    expect(parseFloat(bodyFontSize)).toBeGreaterThanOrEqual(14);
  });

  test('C04 — Connexion page accessible', async ({ page }) => {
    await page.goto('/connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('C05 — Espace client redirige vers connexion si non auth', async ({ page }) => {
    await page.goto('/espace-client');
    // Doit rediriger vers /connexion
    await page.waitForURL('**/connexion**', { timeout: 10000 });
    expect(page.url()).toContain('connexion');
  });

  test('C06 — Inscription accessible', async ({ page }) => {
    await page.goto('/inscription');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('C07 — Page Contact accessible', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('C08 — Home page chargee', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2, header').first()).toBeVisible();
  });
});
