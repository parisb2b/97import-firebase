# 🔴 MISSION V149 : AUTOTEST INTÉGRAL — CRASH TEST DE PRODUCTION

**Date :** 09/05/2026  
**Mode :** PROTOCOLE MAÎTRE  
**Outil :** Playwright  
**Méthode :** Remplacement Intégral  
**Preuves :** `DP/dp97importmaj.txt`

---

## 👤 IDENTIFIANTS DE TEST
Tous les rôles utilisent le mot de passe unique `20262026`.

| Rôle | Adresse email | Mot de passe |
|------|----------------|---------------|
| Administrateur | PARISB2B@GMAIL.COM | 20262026 |
| Partenaire | partenaire@test.com | 20262026 |
| Client | client@test.com | 20262026 |

---

## 🎯 OBJECTIF
Tester le circuit complet Client → Partenaire → Admin sur la version déployée localement (v0.43.16), en validant la nomenclature V146 :
- Devis Client : `DV-XXXXXXXX`
- Commission Partenaire : `NC-XXXXXXXX`
- Devis VIP Admin : `DV-XXXXXXXX-VIP`

---

## 🛡️ PROTOCOLE MAÎTRE
- Mode local exclusif, **git push interdit**.
- Toute preuve est consignée dans `DP/dp97importmaj.txt`.
- Utilisation exclusive de bash (Git Bash Windows).

---

## 💻 CODE SOURCE COMPLET — `tests/full-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('97IMPORT — Circuit Intégral Client → Partenaire → Admin', () => {

  test('Création DV → Visibilité NC → Passage VIP', async ({ page }) => {
    // 1. CLIENT — Connexion et création de devis
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'client@test.com');
    await page.fill('input[type="password"]', '20262026');
    await page.click('button[type="submit"]');
    await page.goto('http://localhost:5173/catalogue');
    await page.click('.btn-add-to-cart:first-of-type');
    await page.click('text=Valider mon Devis');
    const docNumber = await page.innerText('.doc-number');
    expect(docNumber).toMatch(/^DV-\d{7}$/);
    await page.click('text=Déconnexion');

    // 2. PARTENAIRE — Vérification de la commission
    await page.fill('input[type="email"]', 'partenaire@test.com');
    await page.fill('input[type="password"]', '20262026');
    await page.click('button[type="submit"]');
    await page.goto('http://localhost:5173/partenaire/commissions');
    await expect(page.locator(`text=${docNumber}`)).toBeVisible();
    await expect(page.locator('text=NC-').first()).toBeVisible();
    await page.click('text=Déconnexion');

    // 3. ADMIN — Activation VIP
    await page.fill('input[type="email"]', 'PARISB2B@GMAIL.COM');
    await page.fill('input[type="password"]', '20262026');
    await page.click('button[type="submit"]');
    await page.goto('http://localhost:5173/admin/quotes');
    await page.click(`text=${docNumber}`);
    await page.click('text=Activer Mode VIP');
    await expect(page.locator('.doc-number')).toHaveText(`${docNumber}-VIP`);
    
    console.log(`✅ Circuit validé pour : ${docNumber}-VIP`);
  });
});
```

---

## 🚀 EXÉCUTION

```bash
npm install -D @playwright/test
npx playwright test tests/full-flow.spec.ts --reporter=line

if [ $? -eq 0 ]; then
  echo "V149 | $(date +%d/%m/%Y) | Autotest intégral | ✅ RÉUSSI" >> DP/dp97importmaj.txt
else
  echo "V149 | $(date +%d/%m/%Y) | Autotest intégral | ❌ ÉCHEC" >> DP/dp97importmaj.txt
fi
```
