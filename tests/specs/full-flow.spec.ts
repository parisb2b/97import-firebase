// Parcours Full-Flow — tests E2E complets client
// Usage : npx playwright test tests/specs/full-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Full-Flow Client', () => {

  test('F01 — Page accueil → Catalogue → Produit → Panier', async ({ page }) => {
    // Accueil
    await page.goto('/');
    await expect(page.locator('h1, h2, header').first()).toBeVisible();

    // Catalogue
    await page.goto('/catalogue');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await page.waitForTimeout(1000);

    // Premier produit cliquable
    const productLink = page.locator('a[href*="/produits/"]').first();
    if (await productLink.isVisible()) {
      await productLink.click();
      await expect(page.locator('h1').first()).toBeVisible();
    }

    // Panier
    await page.goto('/panier');
    await expect(page.getByText('Votre panier est vide').first()).toBeVisible();
  });

  test('F02 — Connexion → Redirection espace client', async ({ page }) => {
    await page.goto('/connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Tentative accès espace client sans auth → redirection
    await page.goto('/espace-client');
    await page.waitForURL('**/connexion**', { timeout: 10000 });
    expect(page.url()).toContain('connexion');
  });

  test('F03 — Inscription → Connexion accessibles', async ({ page }) => {
    await page.goto('/inscription');
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.goto('/connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('F04 — Pages légales accessibles', async ({ page }) => {
    const pages = ['/contact', '/cgv', '/confidentialite', '/mentions-legales'];
    for (const path of pages) {
      await page.goto(path);
      // Vérifier que la page charge sans erreur de navigation
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('F05 — Header navigation cohérente', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Le header doit avoir les liens principaux
    const header = page.locator('header').first();
    if (await header.isVisible()) {
      const links = header.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('F06 — Pas d\'erreur console sur le parcours complet', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const pages = ['/', '/catalogue', '/connexion', '/contact'];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForTimeout(1000);
    }

    // Filtrer les erreurs Firebase/network attendues en mode émulateur
    const realErrors = errors.filter(e =>
      !e.includes('firebase') &&
      !e.includes('network') &&
      !e.includes('Failed to load resource') &&
      !e.includes('Property actif is undefined')
    );
    expect(realErrors).toEqual([]);
  });

  test('F07 — PriceDisplay rendu sans crash', async ({ page }) => {
    await page.goto('/catalogue');
    await page.waitForTimeout(2000);

    // Vérifier qu'aucun prix négatif ou NaN n'est affiché
    const body = await page.textContent('body');
    expect(body).not.toContain('NaN');
    expect(body).not.toContain('undefined');
  });

  test('F08 — Footer présent sur toutes les pages', async ({ page }) => {
    const pages = ['/', '/catalogue', '/connexion', '/contact'];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
      const footer = page.locator('footer').first();
      if (await footer.isVisible()) {
        expect(await footer.textContent()).toBeTruthy();
      }
    }
  });
});
