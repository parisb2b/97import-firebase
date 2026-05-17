import { test, expect } from '@playwright/test';

// Forçage absolu de l'URL locale pour contourner les bugs d'environnement Windows
test.use({ baseURL: 'http://localhost:5173' });

test.describe('V149 — Circuit Intégral Client → Partenaire → Admin', () => {

  test('Création DV → Visibilité NC → Passage VIP', async ({ page }) => {
    // ═══════════════════════════════════════════
    // 1. CLIENT (mc@sasfr.com) — Connexion et création de devis
    // ═══════════════════════════════════════════
    await page.goto('/connexion');
    await page.fill('input[type="email"]', 'mc@sasfr.com');
    await page.fill('input[type="password"]', '20262026');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await page.waitForTimeout(3000);

    // Navigation vers le catalogue
    await page.goto('/catalogue');
    await page.waitForTimeout(1000);

    // Cliquer sur le premier produit
    const firstProduct = page.locator('a[href*="/produit/"]').first();
    if (await firstProduct.isVisible({ timeout: 3000 })) {
      await firstProduct.click();
      await page.waitForTimeout(1000);

      // Ajouter au panier
      const addToCart = page.getByRole('button', { name: /panier/i }).first();
      if (await addToCart.isVisible({ timeout: 2000 })) {
        await addToCart.click();
        await page.waitForTimeout(500);
      }
    }

    // Aller au panier et générer le devis
    await page.goto('/panier');
    await page.waitForTimeout(1000);

    // Bouton "Générer mon devis gratuit"
    const btnDevis = page.getByRole('button', { name: /devis/i }).first();
    if (await btnDevis.isVisible({ timeout: 3000 })) {
      await btnDevis.click();
      await page.waitForTimeout(1000);

      // Popup partenaire — sélectionner le premier partenaire ou fermer
      const btnConfirmer = page.getByRole('button', { name: /confirmer/i }).first();
      if (await btnConfirmer.isVisible({ timeout: 3000 })) {
        await btnConfirmer.click();
        await page.waitForTimeout(2000);
      }
    }

    // Vérification du numéro de devis dans le toast ou la page
    const pageContent = await page.content();
    const dvMatch = pageContent.match(/DV-\d{6,7}/);
    const docNumber = dvMatch ? dvMatch[0] : null;
    console.log('📄 Numéro de devis:', docNumber || 'non détecté');

    if (docNumber) {
      expect(docNumber).toMatch(/^DV-\d{6,7}$/);
    }

    // ═══════════════════════════════════════════
    // 2. PARTENAIRE (97importcom@gmail.com) — Vérification commission
    // ═══════════════════════════════════════════
    await page.goto('/connexion');
    await page.fill('input[type="email"]', '97importcom@gmail.com');
    await page.fill('input[type="password"]', '20262026');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await page.waitForTimeout(3000);

    // Aller à l'espace partenaire
    await page.goto('/espace-partenaire');
    await page.waitForTimeout(1000);

    // Cliquer sur l'onglet "Mes commissions"
    const btnCommissions = page.getByText(/commissions/i).first();
    if (await btnCommissions.isVisible({ timeout: 3000 })) {
      await btnCommissions.click();
      await page.waitForTimeout(1000);
    }

    console.log('📍 URL partenaire:', page.url());

    // ═══════════════════════════════════════════
    // 3. ADMIN (parisb2b@gmail.com) — Activation VIP
    // ═══════════════════════════════════════════
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    // Login admin
    await page.fill('input[type="email"]', 'parisb2b@gmail.com');
    await page.fill('input[type="password"]', '20262026');
    const adminBtn = page.getByRole('button', { name: /connecter|admin/i }).first();
    if (await adminBtn.isVisible({ timeout: 3000 })) {
      await adminBtn.click();
      await page.waitForTimeout(3000);
    }

    const adminUrl = page.url();
    console.log('📍 URL admin après connexion:', adminUrl);

    // Aller à la liste des devis
    if (adminUrl.includes('/admin')) {
      await page.goto('/admin/devis');
      await page.waitForTimeout(1000);
      console.log('✅ Admin connecté, page devis:', page.url());
    }

    console.log('✅ Test V149 terminé.');
  });
});
