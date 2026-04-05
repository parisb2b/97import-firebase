# 07 — Plan de refonte par phases

**Date** : 2026-04-04
**Prerequis** : Decision architecturale Backend (Firebase vs Supabase)

---

## Resume

Ce plan organise la remise en conformite du projet en 7 phases incrementales.
Chaque phase est autonome et peut etre validee independamment.
Aucune phase ne doit etre executee sans validation explicite de l'utilisateur.

---

## Phase 0 — Decision architecturale (BLOQUANT)

**Objectif** : Trancher la question Backend
**Duree estimee** : Decision humaine
**Risque** : Critique si non resolue

| Option | Impact | Effort |
|--------|--------|--------|
| **A — Valider Firebase** | Mettre a jour MAJALL, adapter vercel.json, continuer tel quel | Faible |
| **B — Revenir a Supabase** | Reecrire 37 fichiers, reconfigurer auth, adapter types | Tres eleve |

**Recommandation** : Option A (valider Firebase) si le site fonctionne deja en Firebase.
L'effort de retour Supabase est disproportionne par rapport au gain.

**Livrable** : Confirmation ecrite du choix architectural.

---

## Phase 1 — Nettoyage repo et configuration (P1)

**Prerequis** : Phase 0 validee
**Objectif** : Repo propre, deployable, sans artefacts de migration
**Priorite** : P1

### Actions

1. Nettoyer `package.json` :
   - Si choix Firebase : retirer `@supabase/supabase-js`, `react-router-dom`
   - Si choix Supabase : retirer `firebase`, `firebase-admin`
   - Dans tous les cas : retirer `react-router-dom` (non utilise)

2. Creer `vercel.json` conforme :
   ```json
   {
     "installCommand": "pnpm install",
     "buildCommand": "pnpm run build",
     "outputDirectory": "dist",
     "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
   }
   ```

3. Resoudre incoherence Firebase (si choix A) :
   - Aligner `.firebaserc` et `.env` sur le meme projet

4. Ajouter au `.gitignore` et retirer du repo :
   - `firebase-tools-instant-win.exe`
   - `97import2026_siteweb/`
   - `97import_deployments/`
   - `MIGRATION_PACKAGE_FINAL/`
   - `SAVE2026/`
   - Fichiers texte de migration (*.docx, prompt_migration.html, etc.)

5. Migrer de npm vers pnpm (si pnpm reste le standard) :
   - `rm package-lock.json && pnpm install`

### Livrable
- `package.json` propre
- `vercel.json` present
- `.gitignore` enrichi
- Repo allege (passer de ~300Mo a ~50Mo)

---

## Phase 2 — Structure dossiers (P1-P2)

**Objectif** : Aligner la structure avec MAJALL ou mettre a jour MAJALL

### Option 2A — Mettre a jour MAJALL (recommande)

Si le projet fonctionne avec `src/` a la racine, modifier MAJALL.TXT :
- Remplacer `client/src/` par `src/`
- Remplacer `client/dist` par `dist/`
- Adapter `vercel.json` outputDirectory

### Option 2B — Restructurer en `client/`

Deplacer `src/`, `index.html`, `vite.config.ts` dans `client/`.
Impact : toutes les references, imports, paths a adapter.

**Recommandation** : Option 2A — adapter MAJALL au code actuel.

### Livrable
- MAJALL.TXT mis a jour OU structure `client/` restauree

---

## Phase 3 — Moteur PDF (P2)

**Objectif** : Completer les 6 fichiers PDF manquants

### Fichiers a creer

| Fichier | Role |
|---------|------|
| `src/features/pdf/lib/pdf-theme.ts` | Constantes couleurs PDF |
| `src/features/pdf/lib/pdf-helpers.ts` | formatPrix, formatDate, EMETTEUR |
| `src/features/pdf/lib/pdf-engine.ts` | Fonctions partagees |
| `src/features/pdf/templates/commission-pdf.ts` | Template commission partenaire |
| `src/features/pdf/templates/fees-pdf.ts` | Template frais maritimes/dedouanement |
| `src/features/pdf/templates/delivery-note-pdf.ts` | Template bon de livraison |

### Source de reference
- `97import2026_siteweb/specs/03-PDF-TEMPLATES.txt` (si present)
- MAJALL.TXT v5+ pour les specs fonctionnelles

### Livrable
- 6 fichiers PDF crees et fonctionnels
- Shims `utils/generate*.ts` mis a jour

---

## Phase 4 — Pages admin manquantes (P2)

**Objectif** : Completer le back-office

### Actions

1. Creer `AdminQuoteDetail.tsx` — page detail devis (MAJALL v6.2)
2. Creer `AdminLogs.tsx` — journal erreurs admin (MAJALL v6.3)
3. Creer `lib/adminQuery.ts` — utilitaire requetes generique
4. Integrer les 7 pages orphelines dans la sidebar `AdminLayout.tsx`
5. Ajouter route `/admin/devis/:id` dans `App.tsx`

### Livrable
- 2 pages admin creees
- Sidebar complete (toutes les pages accessibles)
- Route detail devis fonctionnelle

---

## Phase 5 — Sources de verite et i18n (P2)

**Objectif** : Unifier les sources de donnees

### Actions

1. Fusionner `translations.json` (138 cles) dans `LanguageContext.tsx`
   OU brancher `translations.json` dans le code
2. Unifier les roles : ajouter `collaborateur`, harmoniser `visitor`/`public`
3. Decider si `pricing.ts` ou Firestore est la source des prix
4. Brancher `settings.json` dans le code (au lieu de valeurs en dur)

### Livrable
- Une seule source i18n
- Roles unifies
- Source prix clarifiee

---

## Phase 6 — Medias et optimisation (P3)

**Objectif** : Deduper et optimiser les assets

### Actions

1. Deduper images `houses/` vs `products/`
2. Consolider logos dans `images/logos/`
3. Sortir les `.mp4` du repo git (Git LFS ou Firebase Storage)
4. Standardiser les formats (WebP preferred)

### Livrable
- ~30 fichiers en moins
- Videos hors git
- Formats homogenes

---

## Phase 7 — Tests et deploiement (P2)

**Objectif** : Valider le build et deployer

### Actions

1. `pnpm install && pnpm run build` — 0 erreurs
2. `npx tsc --noEmit` — 0 erreurs TypeScript
3. Verifier toutes les routes publiques (navigation manuelle)
4. Verifier auth (connexion, deconnexion, admin guard)
5. Verifier panier (ajout, suppression, localStorage)
6. Deployer sur Vercel (staging d'abord)
7. Comparer localhost vs staging vs production

### Livrable
- Build vert
- Deploiement staging OK
- Rapport de recette

---

## Tableau recapitulatif

| Phase | Priorite | Prerequis | Risque si non fait |
|-------|----------|-----------|-------------------|
| 0 — Decision backend | P1 | - | Bloquant total |
| 1 — Nettoyage repo | P1 | Phase 0 | Deploiement impossible |
| 2 — Structure dossiers | P1-P2 | Phase 0 | Incoherence MAJALL |
| 3 — Moteur PDF | P2 | Phase 1 | Documents non generables |
| 4 — Pages admin | P2 | Phase 1 | Back-office incomplet |
| 5 — Sources verite | P2 | Phase 1 | Double maintenance |
| 6 — Medias | P3 | - | Repo lourd, doublons |
| 7 — Tests et deploy | P2 | Phases 1-5 | Site non deploye |

---

## Regle

Aucune phase ne sera executee sans validation explicite.
Chaque phase produit un livrable verifiable avant de passer a la suivante.
