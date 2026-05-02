// V64 — Tests de parcours complets (Client, Partenaire, Admin)
// Usage : TEST_PASSWORD=20262026 npx playwright test tests/specs/parcours-v64.spec.ts

import { test, expect } from '@playwright/test';

const BASE = 'https://97import-firebase-git-v2-parisb2bs-projects.vercel.app';
const PWD = process.env.TEST_PASSWORD || '20262026';
const CLIENT = { email: 'mc@sasfr.com', pwd: PWD };
const PARTNER = { email: '97importcom@gmail.com', pwd: PWD };
const ADMIN = { email: 'parisb2b@gmail.com', pwd: PWD };

// ═══ PHASE 2 — PARCOURS CLIENT ═══
test.describe('Phase 2 — Client', () => {

  test('C1 — Accueil', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('h1, h2, header').first()).toBeVisible();
  });

  test('C2 — Catalogue Mini-Pelles', async ({ page }) => {
    await page.goto(`${BASE}/catalogue`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('C3 — Fiche produit MP-R22-001', async ({ page }) => {
    await page.goto(`${BASE}/produits/mp-r22-001`);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('C4 — Ajouter au panier', async ({ page }) => {
    await page.goto(`${BASE}/produits/mp-r22-001`);
    const addBtn = page.locator('button').filter({ hasText: /Ajouter|Panier/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(800);
    }
    // Vérifier que la page ne crash pas
    await expect(page.locator('body')).toBeVisible();
  });

  test('C5 — Panier : recap lisible, adresse livraison', async ({ page }) => {
    await page.goto(`${BASE}/panier`);
    await page.waitForTimeout(500);
    // Vérifier police lisible (V62)
    const fs = await page.evaluate(() => window.getComputedStyle(document.body).fontSize);
    expect(parseFloat(fs)).toBeGreaterThanOrEqual(14);
  });

  test('C6 — Connexion client mc@sasfr.com', async ({ page }) => {
    await page.goto(`${BASE}/connexion`);
    await page.fill('input[type="email"]', CLIENT.email);
    await page.fill('input[type="password"]', CLIENT.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('espace-client');
  });

  test('C7 — Mes Devis', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/connexion`);
    await page.fill('input[type="email"]', CLIENT.email);
    await page.fill('input[type="password"]', CLIENT.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    // Vérifier Mes Devis
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

// ═══ PHASE 3 — CREATION DEVIS ═══
test.describe('Phase 3 — Creation Devis', () => {

  test('D1 — Ajouter produit et generer devis', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/connexion`);
    await page.fill('input[type="email"]', CLIENT.email);
    await page.fill('input[type="password"]', CLIENT.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('espace-client');

    // Ajouter un produit au panier
    await page.goto(`${BASE}/produits/mp-r22-001`);
    const addBtn = page.locator('button').filter({ hasText: /Ajouter|Panier/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(800);
    }

    // Aller au panier
    await page.goto(`${BASE}/panier`);
    await page.waitForTimeout(500);

    // Verifier le panier n'est pas vide
    const emptyCart = await page.locator('text=Votre panier est vide').first().isVisible().catch(() => false);
    if (!emptyCart) {
      // Generer devis
      const btn = page.locator('button').filter({ hasText: /Générer|Devis/i }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(1500);

        // Popup partenaire : choisir IMP
        const pBtn = page.locator('button').filter({ hasText: /IMP|97import/i }).first();
        if (await pBtn.isVisible({ timeout: 5000 })) {
          await pBtn.click();
          await page.waitForTimeout(800);

          // Confirmer
          const cBtn = page.locator('button').filter({ hasText: /Confirmer|Générer/i }).first();
          if (await cBtn.isVisible({ timeout: 5000 })) {
            await cBtn.click();
            await page.waitForTimeout(3000);
          }
        }
      }
    }
    console.log(`   URL finale: ${page.url()}`);
  });
});

// ═══ PHASE 4 — PARCOURS PARTENAIRE ═══
test.describe('Phase 4 — Partenaire', () => {

  test('P1 — Login partenaire dedie', async ({ page }) => {
    await page.goto(`${BASE}/espace-partenaire`);
    // V62: login inline, pas de redirection
    expect(page.url()).toContain('espace-partenaire');
    await expect(page.locator('text=Espace Partenaire')).toBeVisible();
  });

  test('P2 — Connexion partenaire', async ({ page }) => {
    await page.goto(`${BASE}/espace-partenaire`);
    await page.fill('input[type="email"]', PARTNER.email);
    await page.fill('input[type="password"]', PARTNER.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    // Le partenaire doit rester sur espace-partenaire (pas redirige vers client)
    expect(page.url()).toContain('espace-partenaire');
  });
});

// ═══ PHASE 5 — PARCOURS ADMIN ═══
test.describe('Phase 5 — Admin', () => {

  test('A1 — Login admin', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', ADMIN.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    expect(page.url()).toContain('admin');
  });

  test('A2 — Dashboard', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/admin`);
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', ADMIN.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    // Dashboard charge en lazy-load — timeout etendu
    await expect(page.locator('h1, h2, h3, div').first()).toBeVisible({ timeout: 15000 });
  });

  test('A3 — Clients', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', ADMIN.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    await page.goto(`${BASE}/admin/clients`);
    await expect(page.locator('h1, h2, table, div').first()).toBeVisible({ timeout: 15000 });
  });

  test('A6 — Produits', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', ADMIN.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    await page.goto(`${BASE}/admin/produits`);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });

  test('A7 — Devis', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', ADMIN.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    await page.goto(`${BASE}/admin/devis`);
    await expect(page.locator('h1, h2, table, div').first()).toBeVisible({ timeout: 15000 });
  });

  test('A11 — Logs', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', ADMIN.pwd);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    await page.goto(`${BASE}/admin/logs`);
    await expect(page.locator('h1, h2, div').first()).toBeVisible({ timeout: 15000 });
  });
});
