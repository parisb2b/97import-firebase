# 06 — Risques et legacy

**Date** : 2026-04-04
**Branche** : `feat/firebase-migration`

---

## Resume

Le principal risque est la divergence totale entre le cadrage MAJALL (Supabase) et l'implementation (Firebase). Des elements legacy, des fichiers de migration et des anomalies de configuration sont presents.

---

## Constats

### RISQUE CRITIQUE — Migration Firebase non autorisee

| Element | Detail |
|---------|--------|
| **Nature** | Le code source est 100% Firebase. MAJALL exige Supabase. |
| **Impact** | Deploiement, donnees, auth — tout est incompatible avec le cadrage |
| **37 fichiers** | importent depuis `firebase/` ou `firebase/firestore` |
| **0 fichier** | importe depuis `@supabase/supabase-js` |
| **Decision requise** | Valider Firebase OU revenir a Supabase |

**Priorite : P1 — Bloquant**

### RISQUE ELEVE — Incoherence projets Firebase

| Fichier | Projet Firebase |
|---------|-----------------|
| `.env` (VITE_FIREBASE_PROJECT_ID) | `import-412d0` |
| `.firebaserc` (projects.default) | `import2030` |
| `firebase.json` (storage.bucket) | `import2030.firebasestorage.app` |

Consequence : l'app se connecte a `import-412d0` (via `.env`) mais `firebase.json` reference `import2030`. Les donnees peuvent etre dans un projet, le storage dans un autre.

**Priorite : P1**

### RISQUE ELEVE — Dependances contradictoires

`package.json` contient simultanement :
- `firebase: ^12.11.0` — utilise
- `firebase-admin: ^13.7.0` — dep serveur dans un projet frontend (inutilisable en browser)
- `@supabase/supabase-js: ^2.49.4` — jamais importe dans `src/`
- `react-router-dom: ^7.14.0` — jamais importe dans `src/` (wouter utilise)
- `firebase-tools: ^15.13.0` — CLI dans devDependencies (OK mais lourd)

**Priorite : P1**

### RISQUE ELEVE — Absence de vercel.json

MAJALL specifie un `vercel.json` avec :
- `installCommand: pnpm install`
- `buildCommand: vite build`
- `outputDirectory: client/dist`
- `rewrites: SPA fallback`

Aucun `vercel.json` present. Deploiement Vercel impossible sans configuration.

**Priorite : P1**

### RISQUE MOYEN — Structure dossiers

| MAJALL | Actuel |
|--------|--------|
| `client/src/App.tsx` | `src/App.tsx` |
| `client/src/pages/` | `src/pages/` |
| `client/dist/` | `dist/` |

Le dossier `client/` n'existe pas du tout.

**Priorite : P2**

### RISQUE MOYEN — Moteur PDF incomplet

MAJALL v6.4 decrit un moteur PDF complet :
```
features/pdf/
  lib/pdf-theme.ts
  lib/pdf-helpers.ts
  lib/pdf-engine.ts
  templates/quote-pdf.ts
  templates/invoice-pdf.ts
  templates/commission-pdf.ts
  templates/fees-pdf.ts          (V5)
  templates/delivery-note-pdf.ts (V5)
```

Etat actuel :
- `features/pdf/templates/quote-pdf.ts` — PRESENT
- `features/pdf/templates/invoice-pdf.ts` — PRESENT
- `features/pdf/lib/pdf-theme.ts` — **ABSENT**
- `features/pdf/lib/pdf-helpers.ts` — **ABSENT**
- `features/pdf/lib/pdf-engine.ts` — **ABSENT**
- `templates/commission-pdf.ts` — **ABSENT**
- `templates/fees-pdf.ts` — **ABSENT**
- `templates/delivery-note-pdf.ts` — **ABSENT**

3 libs + 3 templates manquants = 6 fichiers PDF manquants.

**Priorite : P2**

### RISQUE MOYEN — Fichiers legacy / migration commites

Fichiers qui ne devraient probablement pas etre dans le repo :
- `97import2026_siteweb/` — export complet du site Supabase (assets JS bundles, SQL, JSON donnees)
- `97import_deployments/` — donnees de deploiement
- `MIGRATION_PACKAGE_FINAL/` — package de migration
- `firebase-tools-instant-win.exe` — **279 Mo** d'executable binaire Windows
- `comparaison_fichiers_report.csv` — rapport temporaire
- `importProducts-v2.mjs` — script de migration one-shot
- `service-account.json` — cle privee (non tracke mais present sur disque)
- `SAVE2026/` — sauvegardes
- `majall/` — fichiers de cadrage (utiles mais pas dans le repo de code)
- Rapports `RAPPORT-*.md`, `BACKUP-*.md`, `RECETTE-*.md`
- `prompt_migration.html`, `PROMPT DE MIGRATION & RECONSTRUCT.txt`
- `Basculer Firebase en ModeREEL.txt`, `CD CDATA-MC-203097IMPORT.txt`
- `RESET--FIREBASE.txt`, `vercel-sans-tocken.txt`, `vercel.txt`
- `Creation du Projet Firebase.docx`

**Priorite : P2** — Ces fichiers alourdissent le repo et polluent l'historique git.

### RISQUE MOYEN — Scripts Firebase dans src/

`src/scripts/` contient 5 scripts Firebase admin :
- `createTestAccounts.ts`
- `importProducts.ts`
- `initFirestore.ts`
- `resetFirebase.ts`
- `uploadMediaToStorage.ts`

Ces scripts utilisent Firebase Admin SDK (cote serveur). Ils ne devraient pas etre dans `src/` (code frontend).

**Priorite : P2**

### RISQUE FAIBLE — Securite .env

- `.env` et `service-account.json` sont dans `.gitignore` — **OK**
- Ils ne sont **pas trackes** dans git (verifie) — **OK**
- `.env` contient des cles Firebase API (publiques par nature pour Firebase) — **OK**
- `VITE_RESEND_API_KEY=re_[a_completer]` — pas de cle reelle — **OK**

**Priorite : aucune action**

### RISQUE FAIBLE — Absence de composants MAJALL

| Composant MAJALL | Statut |
|------------------|--------|
| `lib/logger.ts` | ABSENT |
| `lib/adminQuery.ts` | ABSENT |
| `components/admin/AdminTable.tsx` | ABSENT |
| `lib/notifications.ts` | PRESENT (non audite) |
| `features/excel/suivi-achats.ts` | PRESENT (non audite) |
| `utils/generateDevisPdf.ts` | PRESENT |

**Priorite : P3**

---

## Fichiers concernes

| Fichier/Dossier | Risque | Priorite |
|-----------------|--------|----------|
| `src/lib/firebase.ts` et 37 fichiers Firebase | Critique | P1 |
| `.env` vs `.firebaserc` | Eleve | P1 |
| `package.json` | Eleve | P1 |
| `vercel.json` (absent) | Eleve | P1 |
| `firebase-tools-instant-win.exe` (279 Mo) | Moyen | P2 |
| `97import2026_siteweb/` | Moyen | P2 |
| `src/scripts/*.ts` (admin scripts) | Moyen | P2 |
| `features/pdf/` (6 fichiers manquants) | Moyen | P2 |

---

## Niveau de risque : ELEVE

---

## Recommandation

1. **P1** — Decision strategique Backend : Firebase ou Supabase
2. **P1** — Resoudre l'incoherence des projets Firebase
3. **P1** — Creer `vercel.json`
4. **P1** — Nettoyer `package.json` (deps mortes)
5. **P2** — Exclure du repo : `firebase-tools-instant-win.exe`, `97import2026_siteweb/`, `MIGRATION_PACKAGE_FINAL/`, `SAVE2026/`, fichiers .txt/.docx de migration
6. **P2** — Deplacer `src/scripts/` vers `scripts/` racine (pas dans le bundle frontend)
7. **P2** — Completer le moteur PDF (6 fichiers manquants)
8. **P3** — Recreer `lib/logger.ts` et `lib/adminQuery.ts`
