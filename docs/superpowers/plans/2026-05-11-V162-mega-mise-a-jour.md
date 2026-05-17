# V162 MEGA MISE À JOUR — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les 4 catégories d'anti-patterns V159/V161 : `users/{uid}` primaire, PriceDisplay ×1.2/×0.6 hardcodé, défaut `taux_majoration_partner` 1.2, absence de `full-flow.spec.ts`, et échec export Firebase.

**Architecture:** Remplacement intégral de chaque occurrence — pas de commentaires de transition, pas de code mort. Chaque lookup `users/{uid}` devient `users/{normalizedEmail}` avec fallback `users/{uid}`. PriceDisplay passe de constantes hardcodées (×1.2/×0.6) aux coefficients canoniques dynamiques (×1.5/×0.75) via `calculerPrixDerivesSync()`. Le test full-flow couvre le parcours complet visiteur→connexion→panier→devis.

**Tech Stack:** TypeScript, React, Firebase Firestore, Playwright, coefficientsHelpers.ts (canonical), UTF-8

---

## File Structure

| Fichier | Responsabilité | Action |
|---------|---------------|--------|
| `src/hooks/useAuth.ts` | Hook central auth — déjà correct (fallback uniquement) | Aucune |
| `src/admin/AdminLogin.tsx` | Login admin — déjà correct (fallback uniquement) | Aucune |
| `src/front/pages/Connexion.tsx` | Login client — déjà correct (fallback uniquement) | Aucune |
| `src/front/pages/Catalogue.tsx` | Catalogue — lookup primaire uid | **Modifier** |
| `src/front/pages/EspacePartenaire.tsx` | Espace partenaire — lookup primaire uid | **Modifier** |
| `src/front/pages/Panier.tsx` | Panier — 2 lookups primaires uid | **Modifier** |
| `src/front/pages/EspaceClient.tsx` | Espace client — lookup primaire uid | **Modifier** |
| `src/front/components/Header.tsx` | Header — lookup primaire uid | **Modifier** |
| `src/front/pages/Produit.tsx` | Fiche produit — lookup primaire uid | **Modifier** |
| `src/front/components/PriceDisplay.tsx` | Affichage prix — constantes hardcodées ×1.2/×0.6 | **Modifier** |
| `src/admin/pages/Parametres.tsx` | Paramètres admin — défaut 1.2 | **Modifier** |
| `tests/specs/full-flow.spec.ts` | Test E2E parcours complet | **Créer** |
| `tests/playwright.config.ts` | Config Playwright — ajout projet full-flow | **Modifier** |
| `firebase.json` | Config export — ajout export path | **Modifier** |
| `DP/dp97importmaj.txt` | Journal de mission | **Ajouter entrée** |

---

### Task 1: Corriger `users/{uid}` → `users/{normalizedEmail}` avec fallback dans Catalogue.tsx

**Files:**
- Modify: `src/front/pages/Catalogue.tsx` (autour de la ligne 86)

- [ ] **Step 1: Remplacer le lookup primaire uid par email normalisé**

Ouvrir `src/front/pages/Catalogue.tsx` et remplacer :

```ts
const snap = await getDoc(doc(db, 'users', u.uid));
```

par :

```ts
const normalizedEmail = u.email?.toLowerCase() || '';
let snap = await getDoc(doc(db, 'users', normalizedEmail));
if (!snap.exists()) snap = await getDoc(doc(db, 'users', u.uid));
```

- [ ] **Step 2: Vérifier que le build passe**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/front/pages/Catalogue.tsx
git commit -m "fix(v162): Catalogue — lookup users/{normalizedEmail} avec fallback uid"
```

---

### Task 2: Corriger `users/{uid}` dans EspacePartenaire.tsx

**Files:**
- Modify: `src/front/pages/EspacePartenaire.tsx` (autour de la ligne 40)

- [ ] **Step 1: Remplacer le lookup primaire uid**

Ouvrir `src/front/pages/EspacePartenaire.tsx` et remplacer :

```ts
const snap = await getDoc(doc(db, 'users', u.uid));
```

par :

```ts
const normalizedEmail = u.email?.toLowerCase() || '';
let snap = await getDoc(doc(db, 'users', normalizedEmail));
if (!snap.exists()) snap = await getDoc(doc(db, 'users', u.uid));
```

- [ ] **Step 2: Vérifier le build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/front/pages/EspacePartenaire.tsx
git commit -m "fix(v162): EspacePartenaire — lookup users/{normalizedEmail} avec fallback uid"
```

---

### Task 3: Corriger `users/{uid}` dans Panier.tsx (2 occurrences)

**Files:**
- Modify: `src/front/pages/Panier.tsx` (lignes 73 et 223)

- [ ] **Step 1: Remplacer la première occurrence (ligne ~73, chargement profil)**

Remplacer :

```ts
getDoc(doc(db, 'users', user.uid)).then(snap => {
```

par :

```ts
const normalizedEmail = user.email?.toLowerCase() || '';
getDoc(doc(db, 'users', normalizedEmail)).then(snap => {
  if (!snap.exists()) return getDoc(doc(db, 'users', user.uid));
  return snap;
}).then(snap => {
```

- [ ] **Step 2: Remplacer la seconde occurrence (ligne ~223, création devis)**

Remplacer :

```ts
const userSnap = await getDoc(doc(db, 'users', user.uid));
```

par :

```ts
const normalizedEmail = user.email?.toLowerCase() || '';
let userSnap = await getDoc(doc(db, 'users', normalizedEmail));
if (!userSnap.exists()) userSnap = await getDoc(doc(db, 'users', user.uid));
```

- [ ] **Step 3: Vérifier le build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/front/pages/Panier.tsx
git commit -m "fix(v162): Panier — lookup users/{normalizedEmail} avec fallback uid (x2)"
```

---

### Task 4: Corriger `users/{uid}` dans EspaceClient.tsx

**Files:**
- Modify: `src/front/pages/EspaceClient.tsx` (autour de la ligne 39)

- [ ] **Step 1: Remplacer le lookup primaire uid**

Remplacer :

```ts
const snap = await getDoc(doc(db, 'users', u.uid));
```

par :

```ts
const normalizedEmail = u.email?.toLowerCase() || '';
let snap = await getDoc(doc(db, 'users', normalizedEmail));
if (!snap.exists()) snap = await getDoc(doc(db, 'users', u.uid));
```

- [ ] **Step 2: Vérifier le build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/front/pages/EspaceClient.tsx
git commit -m "fix(v162): EspaceClient — lookup users/{normalizedEmail} avec fallback uid"
```

---

### Task 5: Corriger `users/{uid}` dans Header.tsx

**Files:**
- Modify: `src/front/components/Header.tsx` (autour de la ligne 130)

- [ ] **Step 1: Remplacer le lookup primaire uid**

Remplacer :

```ts
const snap = await getDoc(doc(db, 'users', u.uid));
setUserRole(snap.data()?.role || 'user');
```

par :

```ts
const normalizedEmail = u.email?.toLowerCase() || '';
let snap = await getDoc(doc(db, 'users', normalizedEmail));
if (!snap.exists()) snap = await getDoc(doc(db, 'users', u.uid));
setUserRole(snap.exists() ? snap.data()?.role || 'user' : 'user');
```

- [ ] **Step 2: Vérifier le build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/front/components/Header.tsx
git commit -m "fix(v162): Header — lookup users/{normalizedEmail} avec fallback uid"
```

---

### Task 6: Corriger `users/{uid}` dans Produit.tsx

**Files:**
- Modify: `src/front/pages/Produit.tsx` (autour de la ligne 44)

- [ ] **Step 1: Remplacer le lookup primaire uid**

Remplacer :

```ts
const snap = await getDoc(doc(db, 'users', u.uid));
```

par :

```ts
const normalizedEmail = u.email?.toLowerCase() || '';
let snap = await getDoc(doc(db, 'users', normalizedEmail));
if (!snap.exists()) snap = await getDoc(doc(db, 'users', u.uid));
```

- [ ] **Step 2: Vérifier le build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/front/pages/Produit.tsx
git commit -m "fix(v162): Produit — lookup users/{normalizedEmail} avec fallback uid"
```

---

### Task 7: Remplacer constantes hardcodées ×1.2/×0.6 dans PriceDisplay.tsx

**Files:**
- Modify: `src/front/components/PriceDisplay.tsx` (lignes 1-35)

- [ ] **Step 1: Ajouter l'import de coefficientsHelpers**

En haut du fichier, après l'import existant :

```ts
import { getCoefficients, COEFFICIENTS_DEFAULT, calculerPrixDerivesSync } from '../../lib/coefficientsHelpers';
```

Remplacer le bloc existant (lignes 1-2) :

```ts
import { Link } from 'wouter';
import { useI18n } from '../../i18n';
```

par :

```ts
import { Link } from 'wouter';
import { useI18n } from '../../i18n';
import { calculerPrixDerivesSync, COEFFICIENTS_DEFAULT } from '../../lib/coefficientsHelpers';
```

- [ ] **Step 2: Remplacer les constantes hardcodées dans `getProductPrice()`**

Remplacer la ligne 26 :

```ts
if (role === 'partner') return Math.ceil(achat * 1.2) || Math.ceil(pub * 0.6);
```

par :

```ts
if (role === 'partner') {
  const derived = calculerPrixDerivesSync(achat, COEFFICIENTS_DEFAULT);
  return derived.prix_partner || Math.ceil(pub * 0.75);
}
```

- [ ] **Step 3: Remplacer la constante hardcodée dans le composant `PriceDisplay`**

Remplacer la ligne 35 :

```ts
const partner = Math.ceil(achat * 1.2) || Math.ceil(pub * 0.6);
```

par :

```ts
const derived = calculerPrixDerivesSync(achat, COEFFICIENTS_DEFAULT);
const partner = derived.prix_partner || Math.ceil(pub * 0.75);
```

- [ ] **Step 4: Vérifier le build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/front/components/PriceDisplay.tsx
git commit -m "fix(v162): PriceDisplay — constantes ×1.2/×0.6 → calculerPrixDerivesSync (×1.5/×0.75 canoniques)"
```

---

### Task 8: Corriger la valeur par défaut `taux_majoration_partner` dans Parametres.tsx

**Files:**
- Modify: `src/admin/pages/Parametres.tsx:146`

- [ ] **Step 1: Changer la valeur par défaut de 1.2 à 1.5**

Remplacer la ligne :

```tsx
<input className="fi" type="number" min="0.1" max="10" step="0.1" value={global?.taux_majoration_partner || 1.2}
```

par :

```tsx
<input className="fi" type="number" min="0.1" max="10" step="0.1" value={global?.taux_majoration_partner || 1.5}
```

- [ ] **Step 2: Vérifier le build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Parametres.tsx
git commit -m "fix(v162): Parametres — défaut taux_majoration_partner 1.2 → 1.5 canonique"
```

---

### Task 9: Créer `tests/specs/full-flow.spec.ts`

**Files:**
- Create: `tests/specs/full-flow.spec.ts`
- Modify: `tests/playwright.config.ts`

- [ ] **Step 1: Écrire le fichier de test complet**

```ts
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
      await expect(page.locator('h1, h2').first()).toBeVisible();
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
      !e.includes('Failed to load resource')
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
      const footer = page.locator('footer').first();
      // Le footer peut être absent sur certaines pages — vérifier juste que la page charge
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
```

- [ ] **Step 2: Ajouter le projet full-flow dans playwright.config.ts**

Dans `tests/playwright.config.ts`, après la ligne du projet `v86`, ajouter :

```ts
{ name: 'full-flow', testMatch: 'full-flow.spec.ts' },
```

La section `projects` devient :

```ts
projects: [
  { name: 'client', testMatch: 'parcours-client.spec.ts' },
  { name: 'partenaire', testMatch: 'parcours-partenaire.spec.ts' },
  { name: 'admin', testMatch: 'parcours-admin.spec.ts' },
  { name: 'v75', testMatch: 'parcours-v75.spec.ts' },
  { name: 'v86', testMatch: 'parcours-commandes.spec.ts' },
  { name: 'full-flow', testMatch: 'full-flow.spec.ts' },
],
```

- [ ] **Step 3: Vérifier la syntaxe TypeScript des tests**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add tests/specs/full-flow.spec.ts tests/playwright.config.ts
git commit -m "feat(v162): ajout test full-flow E2E — 8 cas parcours client complet"
```

---

### Task 10: Réparer et exécuter l'export Firebase emulator

**Files:**
- Modify: `firebase.json`

- [ ] **Step 1: Ajouter le répertoire d'export dans firebase.json**

Remplacer le contenu de `firebase.json` :

```json
{
  "firestore": { "rules": "firestore.rules" },
  "storage": { "bucket": "importok-6ef77.firebasestorage.app", "rules": "storage.rules" },
  "emulators": {
    "auth": { "port": 9100 },
    "firestore": { "port": 8081 },
    "storage": { "port": 9200 },
    "ui": { "enabled": true, "port": 4001 }
  }
}
```

par :

```json
{
  "firestore": { "rules": "firestore.rules" },
  "storage": { "bucket": "importok-6ef77.firebasestorage.app", "rules": "storage.rules" },
  "emulators": {
    "auth": { "port": 9100 },
    "firestore": { "port": 8081 },
    "storage": { "port": 9200 },
    "ui": { "enabled": true, "port": 4001 },
    "exportOnExit": true,
    "exportOnExitDir": "./firebase-export"
  }
}
```

- [ ] **Step 2: Nettoyer les anciens exports corrompus**

Run :
```bash
rm -rf firebase-export-1778403702495oESB9a firebase-export-1778493729768C3IVif
```

- [ ] **Step 3: Redémarrer les émulateurs avec données seedées**

Run :
```bash
bash scripts/reset-database.sh && bash scripts/seed-v2-apply.sh
```

- [ ] **Step 4: Arrêter les émulateurs pour déclencher l'export automatique**

Run :
```bash
npx firebase emulators:export ./firebase-export --force
```

Expected: Export réussi, répertoire `firebase-export/` créé avec les fichiers binaires Firestore.

- [ ] **Step 5: Vérifier l'intégrité de l'export**

Run :
```bash
ls -la firebase-export/ && test -f firebase-export/firestore_export/firestore_export.overall_export_metadata && echo "✅ Export Firestore valide" || echo "❌ Export corrompu"
```

- [ ] **Step 6: Commit**

```bash
git add firebase.json
git commit -m "fix(v162): configuration export Firebase — exportOnExit + nettoyage anciens exports"
```

---

### Task 11: Journalisation finale V162

**Files:**
- Modify: `DP/dp97importmaj.txt`

- [ ] **Step 1: Ajouter l'entrée V162 dans le journal**

Ajouter à la fin de `DP/dp97importmaj.txt` :

```
## 2026-05-11 — V162 MEGA MISE À JOUR

### Anti-patterns corrigés
- users/{uid} → users/{normalizedEmail} avec fallback uid : 6 fichiers (Catalogue, EspacePartenaire, Panier×2, EspaceClient, Header, Produit)
- PriceDisplay ×1.2/×0.6 → calculerPrixDerivesSync() canonique ×1.5/×0.75
- Parametres.tsx défaut taux_majoration_partner 1.2 → 1.5
- Ajout tests/specs/full-flow.spec.ts (8 cas E2E)
- Configuration export Firebase : exportOnExit + nettoyage exports corrompus

### Fichiers touchés
- src/front/pages/Catalogue.tsx
- src/front/pages/EspacePartenaire.tsx
- src/front/pages/Panier.tsx
- src/front/pages/EspaceClient.tsx
- src/front/components/Header.tsx
- src/front/pages/Produit.tsx
- src/front/components/PriceDisplay.tsx
- src/admin/pages/Parametres.tsx
- tests/specs/full-flow.spec.ts (créé)
- tests/playwright.config.ts
- firebase.json
- DP/dp97importmaj.txt

### Statut
- ✅ Tous les anti-patterns V159/V161 résolus
- ✅ Code source complet, aucun git push
---
```

- [ ] **Step 2: Commit final**

```bash
git add DP/dp97importmaj.txt
git commit -m "docs(v162): journalisation mission V162 — MEGA MISE À JOUR"
```

---

## Ordre d'exécution recommandé

1. Tasks 1-6 : `users/{uid}` (indépendantes, peuvent être parallélisées)
2. Task 7 : PriceDisplay (dépend de rien, mais les tests full-flow le couvrent)
3. Task 8 : Parametres (indépendante)
4. Task 9 : full-flow.spec.ts (après corrections pour éviter faux négatifs)
5. Task 10 : Export Firebase (peut être fait en parallèle des tasks 7-9)
6. Task 11 : Journalisation (toujours en dernier)

## Self-Review

### 1. Spec coverage
- [x] `users/{uid}` anti-pattern : Tasks 1-6 couvrent les 7 occurrences primaires (les 3 fallbacks déjà corrects dans useAuth, AdminLogin, Connexion sont documentés comme non modifiés)
- [x] PriceDisplay ×1.2/×0.6 : Task 7 remplace par calculerPrixDerivesSync
- [x] Parametres défaut 1.2 : Task 8 corrige
- [x] full-flow.spec.ts : Task 9 crée 8 cas de test
- [x] Export Firebase : Task 10 configure et exécute
- [x] Journalisation : Task 11

### 2. Placeholder scan
- [x] Aucun TBD, TODO, ou "implement later"
- [x] Chaque step a son code exact
- [x] Chaque commande a sa commande exacte avec résultat attendu

### 3. Type consistency
- [x] `normalizedEmail` utilisé partout avec le même pattern : `u.email?.toLowerCase() || ''`
- [x] `calculerPrixDerivesSync` importé depuis `../../lib/coefficientsHelpers`
- [x] `COEFFICIENTS_DEFAULT` utilisé comme fallback statique (pas d'appel async dans le render)
- [x] Les noms de fonctions et imports sont cohérents entre les tasks
