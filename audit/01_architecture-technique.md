# 01 — Architecture technique

**Date** : 2026-04-04
**Branche** : `feat/firebase-migration`

---

## Resume

L'architecture technique actuelle diverge significativement du cadrage MAJALL.TXT.
Le code source est fonctionnel en Firebase, mais ne correspond pas au cahier des charges Supabase.

---

## Comparaison MAJALL vs Etat actuel

| Element | MAJALL.TXT (cible) | Etat actuel | Ecart |
|---------|---------------------|-------------|-------|
| Frontend | React 19 + Vite 7 + TypeScript | React 19 + Vite 8 + TypeScript | Mineur (Vite 8 vs 7) |
| Routeur | wouter (SPA) | wouter | OK |
| Backend | Supabase (PostgreSQL + Auth + Storage) | Firebase (Firestore + Auth + Storage) | **CRITIQUE** |
| Deploy | Vercel + vercel.json | Aucun vercel.json | **CRITIQUE** |
| Package | pnpm + pnpm-lock.yaml | npm + package-lock.json | Moyen |
| Structure | `client/src/` | `src/` (racine) | Eleve |
| Build output | `client/dist` | `dist/` | Eleve |
| PDF engine | `features/pdf/` (5 templates + 3 libs) | 2 templates, 0 libs | Moyen |
| Logging | `lib/logger.ts` + table `error_logs` | Absent | Moyen |
| Excel export | `features/excel/suivi-achats.ts` | Present (non verifie contenu) | OK |

---

## Constats

### 1. Stack Frontend — Faible risque
- React 19.2.4, Vite 8.0.3, TypeScript 6.0.2 — versions recentes et coherentes
- wouter 3.9.0 utilise partout — aucune trace de react-router-dom dans le code
- `react-router-dom` present dans `package.json` mais JAMAIS importe dans `src/` — dep fantome

### 2. Backend Firebase — Risque eleve
- `src/lib/firebase.ts` : initialise 2 apps Firebase (client + admin) avec Firestore, Auth, Storage, Functions
- `src/contexts/AuthContext.tsx` : auth 100% Firebase (`onAuthStateChanged`, `signInWithEmailAndPassword`)
- `src/lib/firebaseHelpers.ts` : helpers Firestore (numero devis atomique via `runTransaction`)
- `src/types/index.ts` : `FirestoreDate = Timestamp | Date | null` — types Firebase natifs
- 37 fichiers source importent depuis `firebase/` ou `firebase/firestore`
- 0 fichier source importe depuis `@supabase/supabase-js`
- Presence de `firebase-admin` (dep cote serveur) dans un projet frontend — anomalie

### 3. Incoherence Firebase — Risque eleve
- `.env` : projet `import-412d0`
- `.firebaserc` : projet `import2030`
- `firebase.json` : bucket `import2030.firebasestorage.app`
- Deux projets Firebase differents references — quel est le bon ?

### 4. Package manager — Risque moyen
- `package-lock.json` present (npm)
- Aucun `pnpm-lock.yaml`
- MAJALL exige pnpm

### 5. Structure dossiers — Risque eleve
- MAJALL reference `client/src/App.tsx`, `client/src/pages/`, etc.
- Code actuel : `src/App.tsx`, `src/pages/`
- Pas de dossier `client/` du tout
- `vite.config.ts` : `outDir: 'dist'` (MAJALL : `client/dist`)

### 6. Deploiement Vercel — Risque eleve
- Aucun `vercel.json` dans le projet
- MAJALL precise :
  ```
  installCommand: pnpm install
  buildCommand: vite build
  outputDirectory: client/dist
  rewrites: [{ source: "/((?!assets/).*)", destination: "/index.html" }]
  ```
- Sans vercel.json et avec structure `src/` : deploiement Vercel echouera

---

## Fichiers concernes

| Fichier | Role | Risque |
|---------|------|--------|
| `package.json` | Deps contradictoires (firebase + supabase + react-router-dom) | Eleve |
| `src/lib/firebase.ts` | Point d'entree Firebase | Eleve |
| `src/contexts/AuthContext.tsx` | Auth 100% Firebase | Eleve |
| `src/types/index.ts` | Types Firestore | Moyen |
| `vite.config.ts` | outDir = `dist/` au lieu de `client/dist` | Eleve |
| `.firebaserc` | Projet `import2030` | Eleve |
| `.env` | Projet `import-412d0` | Eleve |

---

## Niveau de risque : ELEVE

---

## Recommandation

1. **P1** — Decider du backend (Supabase vs Firebase) avec le proprietaire du projet
2. **P1** — Creer `vercel.json` conforme au cadrage MAJALL
3. **P1** — Aligner la structure `client/src/` ou mettre a jour MAJALL pour `src/`
4. **P2** — Nettoyer `package.json` : retirer les deps mortes (`firebase-admin`, `react-router-dom`, ou `@supabase/supabase-js`)
5. **P2** — Resoudre l'incoherence des projets Firebase (`import-412d0` vs `import2030`)
6. **P2** — Migrer de npm vers pnpm si pnpm reste le standard
