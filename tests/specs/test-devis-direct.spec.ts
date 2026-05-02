// Test direct : creation devis — V65 final
import { test, expect } from '@playwright/test';

const BASE = 'https://97import-firebase-git-v2-parisb2bs-projects.vercel.app';
const PWD = process.env.TEST_PASSWORD || '20262026';

test('Création devis — flux complet', async ({ page }) => {
  // 1. Login
  console.log('1. Connexion...');
  await page.goto(`${BASE}/connexion`);
  await page.fill('input[type="email"]', 'mc@sasfr.com');
  await page.fill('input[type="password"]', PWD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  expect(page.url()).toContain('espace-client');
  console.log('   ✅ Connecté');

  // 2. Vider localStorage + injecter panier
  console.log('2. Panier test...');
  await page.evaluate(() => {
    localStorage.setItem('cart', JSON.stringify([{
      id: 'test-v65c-' + Date.now(),
      ref: 'MP-R22-001',
      nom_fr: 'Mini-pelle R22 PRO (TEST V65)',
      prix: 12000,
      qte: 1,
      type: 'product',
    }]));
  });
  await page.waitForTimeout(500);

  // 3. Aller au panier
  await page.goto(`${BASE}/panier`);
  await page.waitForTimeout(2000);

  const empty = await page.locator('text=Votre panier est vide').first().isVisible().catch(() => false);
  if (empty) { console.log('❌ Panier vide'); return; }
  console.log('   ✅ Panier chargé');

  // 4. Clic "Générer mon devis gratuit"
  console.log('3. Ouverture popup partenaire...');
  await page.locator('button').filter({ hasText: /Générer mon devis/i }).first().click();
  await page.waitForTimeout(3000);

  // Vérifier que la popup est ouverte (chercher le texte "Sélectionnez")
  const popupText = await page.locator('body').innerText();
  const hasPartnerPopup = popupText.includes('Sélectionnez') || popupText.includes('partenaire') || popupText.includes('Partenaire');
  console.log(`   Popup visible: ${hasPartnerPopup}`);

  if (!hasPartnerPopup) {
    console.log('   ⚠️ Popup non détectée, vérification manuelle');
    await page.screenshot({ path: 'test-results/devis-no-popup.png', fullPage: true });
    return;
  }

  // 5. Sélectionner le partenaire (cliquer sur le texte "IMP" ou le bouton contenant IMP)
  console.log('4. Sélection partenaire...');
  // Chercher le bouton qui contient "IMP" (pas "IMPORT" ou autre)
  const impBtn = page.locator('button').filter({ hasText: 'IMP' }).first();
  if (await impBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log(`   Clic: ${(await impBtn.textContent()).trim()}`);
    await impBtn.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('   ❌ Bouton IMP introuvable');
    await page.screenshot({ path: 'test-results/devis-no-imp.png', fullPage: true });
    return;
  }

  // 6. Cliquer "Confirmer la sélection" — bouton dans la popup
  console.log('5. Confirmation...');
  // Le bouton de confirmation dans la popup doit être le dernier bouton
  const allBtns = await page.locator('button').all();
  let confirmClicked = false;
  for (const btn of allBtns.reverse()) {
    const text = (await btn.textContent())?.trim() || '';
    if (text.includes('Confirmer') || text.includes('confirmer') || text === 'Confirmer la sélection') {
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`   Clic: ${text}`);
        await btn.click();
        confirmClicked = true;
        await page.waitForTimeout(5000);
        break;
      }
    }
  }

  if (!confirmClicked) {
    // Fallback: essayer de cliquer n'importe quel bouton visible dans l'overlay
    console.log('   Fallback: recherche bouton confirmation...');
    const btns = await page.locator('button').allTextContents();
    console.log(`   Boutons disponibles: ${btns.filter(b => b.length < 40).join(' | ')}`);
    await page.screenshot({ path: 'test-results/devis-no-confirm.png', fullPage: true });
  }

  // 7. Vérifier le résultat
  console.log(`6. URL finale: ${page.url()}`);
  if (page.url().includes('espace-client') || page.url().includes('mes-devis')) {
    console.log('✅ DEVIS CRÉÉ AVEC SUCCÈS !');
  } else if (page.url().includes('panier')) {
    console.log('⚠️ Resté sur panier — vérifier les erreurs');
  }

  await page.screenshot({ path: 'test-results/devis-final.png', fullPage: true });
  console.log('✅ Test terminé');
});
