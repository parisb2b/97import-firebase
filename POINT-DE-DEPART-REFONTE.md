# POINT-DE-DEPART-REFONTE.md
## Date : 2026-04-04

---

## Contexte

Ce document marque le **point de départ validé** de la version Firebase de 97import.com.
Migration Supabase → Firebase 100% complète.

## Ce qui a été accompli

### ✅ Phase 1 — Sauvegarde (2026-04-04)
- BACKUP-INVENTAIRE.md créé
- Git initialisé avec commit v1.0.0-firebase
- 91 fichiers TS/TSX sous contrôle de version

### ✅ Phase 2 — Audit technique
- RAPPORT-STRUCTURE.md : 27/27 pages, 20/20 admin, 7/7 hooks
- Toutes les routes documentées dans App.tsx

### ✅ Phase 3 — Comparatif local vs prod
- RAPPORT-ALIGNEMENT.md créé
- Hero plein écran avec hero_ship.png ✅
- Logo image dans le header ✅
- Lien Contact dans la nav ✅

### ✅ Phase 4 — Médias
- RAPPORT-MEDIAS.md + medias-inventory.json
- 183 fichiers dans public/ ✅
- Dossiers products/camping_car/, modular_*, docs/ créés ✅

### ✅ Phase 5 — Architecture cible
- Firebase (Firestore NoSQL) comme source unique
- TypeScript interfaces complètes (374 lignes)
- Schéma : users, products, quotes, invoices, leads, contacts, site_content

### ✅ Phase 6 — Migration données
- 0 référence Supabase dans le code source
- Firebase Auth : dual instances (authClient + authAdmin)
- Firestore : toutes les collections définies

### ✅ Phase 7 — Front-office
- 27 pages publiques avec vraies images
- Responsive, bilingue FR/中文
- Build : 0 erreur TypeScript, 568ms

### ✅ Phase 8 — Back-office
- 19 pages admin (Dashboard, Devis, Users, Produits, Analytics, etc.)
- 4 nouvelles pages : HeaderFooter, Leads, Pages, Settings
- AdminGuard protège toutes les routes /admin/*

### ✅ Phase 9 — Bilingue FR/中文
- LanguageContext : 277 lignes, 80+ clés de traduction
- LangToggle dans le header
- Toutes les nouvelles pages bilingues

### ✅ Phase 10 — Build validé
- TypeScript : 0 erreurs
- Vite build : 568ms
- HTTP 200 sur localhost:5173

## Décisions techniques figées

| Décision | Valeur |
|----------|--------|
| Backend | Firebase (pas Supabase) |
| Routing | wouter (pas react-router) |
| State global | Context API (Auth, Lang, Cart) |
| i18n | LanguageContext inline (pas i18next) |
| CSS | Inline styles (pas Tailwind/shadcn) |
| Lazy loading | React.lazy + Suspense partout |
| Admin auth | Dual Firebase apps (authAdmin isolé) |
| Prix | prix_achat × multiplicateur par rôle |

## Prochaine étape
→ Push vers GitHub + déploiement Vercel avec code Firebase
