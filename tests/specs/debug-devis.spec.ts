// Debug : pourquoi la creation de devis echoue ?
// Usage : TEST_PASSWORD=20262026 npx playwright test tests/specs/debug-devis.spec.ts --headed

import { test } from '@playwright/test';

const BASE = 'https://97import-firebase-git-v2-parisb2bs-projects.vercel.app';
const PWD = process.env.TEST_PASSWORD || '20262026';

test('Debug — Capture flux creation devis', async ({ page }) => {
  // Capturer les logs console
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  // 1. Login
  console.log('1. Login...');
  await page.goto(`${BASE}/connexion`);
  await page.fill('input[type="email"]', 'mc@sasfr.com');
  await page.fill('input[type="password"]', PWD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log(`   URL: ${page.url()}`);

  // 2. Vider le panier d'abord (localStorage)
  await page.evaluate(() => localStorage.removeItem('cart'));
  await page.waitForTimeout(500);

  // 3. Ajouter produit
  console.log('2. Ajout produit...');
  await page.goto(`${BASE}/produits/mp-r22-001`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/debug-1-produit.png', fullPage: false });

  // Chercher le bouton ajouter panier
  const buttons = await page.locator('button').allTextContents();
  console.log(`   Boutons trouves: ${buttons.filter(b => b.length < 50).join(', ')}`);

  // Essayer plusieurs selecteurs
  const addSelectors = [
    page.locator('button').filter({ hasText: 'Ajouter' }),
    page.getByText('Ajouter au panier'),
    page.locator('button').filter({ hasText: 'Panier' }),
    page.locator('button').filter({ hasText: 'Devis' }),
  ];

  let clicked = false;
  for (const sel of addSelectors) {
    if (await sel.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log(`   Clic sur: ${await sel.first().textContent()}`);
      await sel.first().click();
      clicked = true;
      await page.waitForTimeout(1000);
      break;
    }
  }
  if (!clicked) console.log('   ❌ Aucun bouton ajout panier trouve');

  // 4. Aller au panier
  console.log('3. Panier...');
  await page.goto(`${BASE}/panier`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/debug-2-panier.png', fullPage: false });

  // Vérifier si le panier est vide
  const emptyVisible = await page.locator('text=Votre panier est vide').first().isVisible().catch(() => false);
  console.log(`   Panier vide: ${emptyVisible}`);

  // Lister les boutons
  const cartButtons = await page.locator('button').allTextContents();
  console.log(`   Boutons panier: ${cartButtons.filter(b => b.length < 60).join(' | ')}`);

  if (!emptyVisible) {
    // 5. Cliquer generer devis
    console.log('4. Generation devis...');
    const generateBtn = page.locator('button').filter({ hasText: /Générer|Devis/i }).first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/debug-3-popup.png', fullPage: false });
      console.log(`   URL apres clic: ${page.url()}`);

      // Popup partenaire
      const popupText = await page.locator('text').allTextContents();
      const partnerTexts = popupText.filter(t => t.includes('partenaire') || t.includes('IMP') || t.includes('97import') || t.includes('TT'));
      console.log(`   Textes popup: ${partnerTexts.join(' | ')}`);

      const partnerBtns = await page.locator('button').allTextContents();
      console.log(`   Boutons popup: ${partnerBtns.filter(b => b.length < 60).join(' | ')}`);

      // Essayer de cliquer sur un partenaire
      for (const btnText of ['IMP', '97import', 'TT', 'Sélectionner', 'Confirmer', 'Choisir']) {
        const btn = page.locator('button').filter({ hasText: btnText }).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`   Clic sur: ${await btn.textContent()}`);
          await btn.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `test-results/debug-4-after-${btnText}.png`, fullPage: false });
        }
      }
    }
  }

  // Logs console
  console.log('\n--- Console logs ---');
  consoleLogs.slice(-20).forEach(l => console.log(l));

  await page.screenshot({ path: 'test-results/debug-final.png', fullPage: true });
  console.log('✅ Debug termine');
});
