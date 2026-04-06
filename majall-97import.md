# MAJALL — 97import.com
Journal des modifications — Format v1.0

---

## [2026-04-05 07:52] — v1.1 (b284da7)
### Modifications
- `majall/parcours_client_97import.svg` : Schéma workflow parcours client 6 phases (SVG)
- `majall/Voilà le schéma complet du parcours client en 6 phases.docx` : Document de référence workflow

### Fichiers touchés
- ➕ `majall/parcours_client_97import.svg` (ajouté)
- ➕ `majall/Voilà le schéma complet du parcours client en 6 phases.docx` (ajouté)

### Statut
- ✅ Committé — branche `feat/firebase-migration`

---

## [2026-04-05 07:42] — v1.0 (8da6622)
### Modifications
- `audit/00_resume-global.md` : Résumé global — divergence Firebase vs Supabase
- `audit/01_architecture-technique.md` : Comparaison stack MAJALL vs état actuel
- `audit/02_sources-de-verite.md` : Analyse prix, i18n, config (sources multiples)
- `audit/03_cartographie-routes.md` : Mapping 27 routes publiques + 18 routes admin
- `audit/04_cartographie-admin.md` : 19 pages back-office, 7 orphelines de la sidebar
- `audit/05_medias-et-assets.md` : 183 médias, doublons identifiés
- `audit/06_risques-et-legacy.md` : Firebase incohérent, vercel.json absent, 3 PDF manquants
- `audit/07_plan-refonte-phases.md` : Plan 7 phases avec prérequis et livrables
- `audit/08_workflow-parcours-client.md` : Audit workflow 6 phases vs code réel

### Fichiers touchés
- ➕ `audit/00_resume-global.md`
- ➕ `audit/01_architecture-technique.md`
- ➕ `audit/02_sources-de-verite.md`
- ➕ `audit/03_cartographie-routes.md`
- ➕ `audit/04_cartographie-admin.md`
- ➕ `audit/05_medias-et-assets.md`
- ➕ `audit/06_risques-et-legacy.md`
- ➕ `audit/07_plan-refonte-phases.md`
- ➕ `audit/08_workflow-parcours-client.md`

### Statut
- ✅ Committé — branche `feat/firebase-migration`

---

## [2026-04-04 22:44] — v1.0.0 (1030a8f)
### Modifications
- Migration complète Supabase → Firebase
- React 19 + Vite 8 + TypeScript — stack complète
- `src/lib/firebase.ts` : Double instance Firebase (authClient + authAdmin)
- `src/types/index.ts` : Interfaces Firestore NoSQL complètes (374 lignes)
- `src/contexts/LanguageContext.tsx` : i18n FR/ZH inline (80+ clés)
- `src/contexts/AuthContext.tsx` : Auth Firebase avec rôles (dual sessions)
- `src/App.tsx` : 43 routes wouter (27 publiques + 18 admin)
- `src/pages/admin/` : 19 pages back-office
- `src/hooks/` : 7 hooks Firebase
- `public/` : 183 médias (images, vidéos, PDFs)
- `scripts/media_sync.mjs` : Script sync médias Node.js ESM

### Fichiers touchés
- ➕ 91 fichiers TypeScript/TSX dans `src/`
- ➕ 183 médias dans `public/`
- ➕ Configs : `firebase.json`, `.firebaserc`, `storage.rules`, `vite.config.ts`, `tsconfig.json`
- ➕ Rapports : `RAPPORT-*.md`, `BACKUP-INVENTAIRE.md`, `RECETTE-FINALE.md`

### Statut
- ✅ Committé — branche `feat/firebase-migration`

---
