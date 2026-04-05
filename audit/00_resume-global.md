# 00 — Resume global de l'audit

**Date** : 2026-04-04
**Branche auditee** : `feat/firebase-migration`
**Commit** : `dedb51d` — "feat: Complete Firebase migration — 97import.com v1.0.0"
**Reference cadrage** : `majall/3-4---2026-MAJALL.TXT` (v6.4)

---

## Resume

Le projet 97import.com a subi une migration non autorisee de Supabase vers Firebase.
L'etat actuel du code source est **100% Firebase** : aucune trace de `@supabase/supabase-js`
dans le code applicatif (`src/`), malgre sa presence dans `package.json`.

Le cadrage officiel MAJALL.TXT v6.4 definit :
- Backend : **Supabase uniquement** (PostgreSQL + Auth + Storage)
- Structure : `client/src/` (sous-dossier `client/`)
- Package manager : **pnpm**
- Deploiement : **Vercel** avec `vercel.json`

L'etat actuel diverge sur **tous ces points**.

---

## Constats majeurs

| # | Constat | Risque | Priorite |
|---|---------|--------|----------|
| 1 | Backend entierement Firebase (Firestore + Auth), aucun code Supabase actif | Eleve | P1 |
| 2 | Structure `src/` au lieu de `client/src/` (MAJALL exige `client/`) | Eleve | P1 |
| 3 | `npm` + `package-lock.json` au lieu de `pnpm` + `pnpm-lock.yaml` | Moyen | P2 |
| 4 | Aucun `vercel.json` — deploiement Vercel impossible en l'etat | Eleve | P1 |
| 5 | `package.json` contient `firebase`, `firebase-admin`, `firebase-tools` ET `@supabase/supabase-js` ET `react-router-dom` — dependances contradictoires | Eleve | P1 |
| 6 | 2 projets Firebase differents : `.env` = `import-412d0`, `.firebaserc` = `import2030` | Eleve | P1 |
| 7 | Types `src/types/index.ts` 100% Firestore (FirestoreDate, Timestamp) | Moyen | P2 |
| 8 | Moteur PDF incomplet : 2 templates sur 5 (manquent commission, fees, delivery-note) | Moyen | P2 |
| 9 | PDF engine manquant : `pdf-theme.ts`, `pdf-helpers.ts`, `pdf-engine.ts` absents | Moyen | P2 |
| 10 | Pas de `lib/logger.ts` (mentionne v6.3 MAJALL) | Faible | P3 |
| 11 | Pas de `lib/adminQuery.ts` (mentionne v6.0 MAJALL) | Moyen | P2 |
| 12 | Donnees de reference Supabase presentes dans `97import2026_siteweb/supabase/` (products.json = 2041 lignes, profiles, quotes) | Info | P3 |
| 13 | `.env` et `service-account.json` non trackes dans git (OK) | Faible | - |
| 14 | `97import2026_siteweb/` entier commite (assets JS bundles, SQL, donnees) — poids inutile | Faible | P3 |

---

## Fichiers concernes

- `package.json` — dependances contradictoires
- `src/lib/firebase.ts` — point d'entree Firebase
- `src/contexts/AuthContext.tsx` — auth 100% Firebase
- `src/types/index.ts` — types 100% Firestore
- `src/lib/firebaseHelpers.ts` — helpers Firestore
- `.firebaserc`, `firebase.json`, `storage.rules` — config Firebase
- `vite.config.ts` — outDir `dist/` (MAJALL dit `client/dist`)
- `majall/3-4---2026-MAJALL.TXT` — reference cadrage officiel

---

## Niveau de risque global : ELEVE

Le projet dans son etat actuel ne peut pas etre deploye sur Vercel en tant que site Supabase.
Une decision strategique est necessaire : soit valider la migration Firebase, soit revenir a Supabase.

---

## Recommandation

Avant toute action de code :
1. **Decision architecturale** : Firebase ou Supabase ? (bloquant)
2. Restaurer `vercel.json` pour le deploiement
3. Aligner la structure de dossiers (`client/src/` vs `src/`)
4. Nettoyer `package.json` (retirer les deps inutilisees)
5. Passer a `pnpm` si c'est le standard du projet
