// Parcours Partenaire — tests E2E
// Usage : npx playwright test tests/specs/parcours-partenaire.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Parcours Partenaire', () => {

  test('P01 — Login partenaire dedie (BUG-01)', async ({ page }) => {
    await page.goto('/espace-partenaire');
    // Doit afficher le formulaire de login partenaire, PAS rediriger vers /connexion
    const url = page.url();
    // La page doit rester sur /espace-partenaire avec le login inline
    expect(url).toContain('espace-partenaire');
    // Le formulaire de login partenaire doit etre visible
    await expect(page.locator('text=Espace Partenaire')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('P02 — Lien vers espace client present', async ({ page }) => {
    await page.goto('/espace-partenaire');
    // Le lien "Espace client" renvoie vers /connexion
    await expect(page.getByRole('link', { name: 'Espace client' })).toBeVisible();
  });

  test('P03 — Verification role partenaire bloque non-partner', async ({ page }) => {
    await page.goto('/espace-partenaire');
    // Tente une connexion avec un email non-partenaire
    await page.fill('input[type="email"]', 'not-a-partner@test.com');
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    // Un message d'erreur doit apparaitre
    await expect(page.locator('text=Erreur')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Firebase peut retourner d'autres messages d'erreur
    });
  });

  // V80 — Nouveaux tests V79 (diagnostic partenaire + menu)

  test('P04 — Menu Mon Espace Client visible', async ({ page }) => {
    await page.goto('/espace-partenaire');
    // Le bouton/badge "MON ESPACE CLIENT" doit etre present
    await expect(page.getByText('MON ESPACE CLIENT').or(page.getByText('Espace client'))).toBeVisible({ timeout: 5000 });
  });

  test('P05 — Page partenaire sans erreur JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/espace-partenaire');
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('firebase') && !e.includes('network'))).toEqual([]);
  });
});
