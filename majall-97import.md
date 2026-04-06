# MAJALL — 97import.com
Journal des modifications — Format v1.0

---

## [2026-04-06 21:30] — v5.17-scan-fix-complet
### Modifications
- `src/features/pdf/lib/pdf-engine.ts` : fmtEur corrige (narrow no-break space → espace normal U+0020), section Acceptation titre en colonne droite
- `src/lib/firebaseHelpers.ts` : Nouvelle numerotation D2604001 (PREFIX+AA+MM+NNN), compteurs mensuels Firestore, 8 raccourcis (D, F, FA, A, NC, FM, DD, BL)
- `src/pages/ProductPage.tsx` : Bascule vers generateQuotePDF (design LUXENT), fix WhatsApp 33663284908, sauvegarde Firestore + Storage
- `src/pages/ModularStandardPage.tsx` : 3 boutons uniformes (Panier + Devis PDF + WhatsApp)
- `src/pages/ModularPremiumPage.tsx` : 3 boutons uniformes
- `src/pages/CampingCarPage.tsx` : 3 boutons uniformes
- `src/pages/SolarKitDetailPage.tsx` : 3 boutons uniformes
- `src/pages/CartPage.tsx` : Ajout lang: 'fr' (commit precedent)

### Fichiers touches
- ✏️ `src/features/pdf/lib/pdf-engine.ts`
- ✏️ `src/lib/firebaseHelpers.ts`
- ✏️ `src/pages/ProductPage.tsx`
- ✏️ `src/pages/ModularStandardPage.tsx`
- ✏️ `src/pages/ModularPremiumPage.tsx`
- ✏️ `src/pages/CampingCarPage.tsx`
- ✏️ `src/pages/SolarKitDetailPage.tsx`

### Scan boutons par page (apres correction)
- `/produit/:id` : Panier[OK] DevisPDF[OK] Fiche[OK] WhatsApp[OK]
- `/maisons/standard` : Panier[OK] DevisPDF[OK] WhatsApp[OK]
- `/maisons/premium` : Panier[OK] DevisPDF[OK] WhatsApp[OK]
- `/maisons/camping-car` : Panier[OK] DevisPDF[OK] WhatsApp[OK]
- `/solaire/:slug` : Panier[OK] DevisPDF[OK] WhatsApp[OK]
- `/accessoires` : Panier[OK] (listing → /produit/:id pour PDF)
- `/panier` : DemanderDevis[OK] (flux complet Firestore)

### Statut
- ✅ Build OK
- ✅ Committe — tag v5.17-scan-fix-complet

---

## [2026-04-06 14:30] — v5.16-pdf-production
### Modifications
- `src/features/pdf/lib/pdf-engine.ts` : Moteur PDF mutualise LUXENT — couleurs, layout, helpers (addHeader, addParties, addIBAN, addSectionTitle, addProductTable, addTotal, addConditions, addSignature, addFooter)
- `src/features/pdf/lib/logo-base64.ts` : Logo LUXENT LIMITED en base64 JPEG
- `src/features/pdf/templates/quote-pdf.ts` : Reecrit — reproduction exacte D2600022.pdf (devis)
- `src/features/pdf/templates/invoice-pdf.ts` : Reecrit — reproduction exacte F2600031.pdf (facture)
- `src/features/pdf/templates/deposit-invoice-pdf.ts` : Cree — reproduction exacte FA2600007.pdf (facture d'acompte)
- `src/features/pdf/templates/credit-note-pdf.ts` : Cree — reproduction exacte A2500001.pdf (avoir/credit note)
- `src/pages/CartPage.tsx` : Ajout `lang: 'fr'` pour les devis generes depuis le panier

### Fichiers touches
- ➕ `src/features/pdf/lib/pdf-engine.ts` (cree)
- ➕ `src/features/pdf/lib/logo-base64.ts` (cree)
- ✏️ `src/features/pdf/templates/quote-pdf.ts` (reecrit)
- ✏️ `src/features/pdf/templates/invoice-pdf.ts` (reecrit)
- ➕ `src/features/pdf/templates/deposit-invoice-pdf.ts` (cree)
- ➕ `src/features/pdf/templates/credit-note-pdf.ts` (cree)
- ✏️ `src/pages/CartPage.tsx` (modifie)

### Design reproduit
- Couleurs : titre rose/saumon #C87F6B, en-tetes tableau violet #7B80B5 texte blanc
- Logo : LUXENT LIMITED (globe dore) en haut a droite
- Layout : emetteur/destinataire 2 colonnes, IBAN, tableau produits, total, conditions, footer
- 4 types de documents : Devis, Facture, Facture d'acompte, Avoir

### Statut
- ✅ Build OK — npm run build sans erreur
- ✅ Committe — tag v5.16-pdf-production

---

## [2026-04-06 11:45] — v1.5 (non committé)
### Modifications
- `scripts/update-firestore-images.mjs` : Script Admin SDK — mise à jour images[] Firestore (18 produits)
- `scripts/update-firestore-images.ts` : Idem via client SDK (abandonné — PERMISSION_DENIED sans auth)
- `src/pages/AccessoiresPage.tsx` : Correction chemins fallback (`/images/accessoires/` → `/images/accessories/`, tirets → underscores)
- `src/pages/CampingCarPage.tsx` : Correction GALLERY (`/images/camping-car/` → `/images/products/camping_car/`)
- `src/pages/SolarPage.tsx` : Correction image KITS (`/images/solaire/` → `/images/solar/`)
- `src/pages/SolarKitDetailPage.tsx` : Correction image KITS_DATA (`/images/solaire/` → `/images/solar/`)
- `src/pages/ModularHomesPage.tsx` : Correction 3 cartes produits (portail → vraies images)
- `src/pages/ModularPremiumPage.tsx` : Remplacement galleryImages dynamique par chemins statiques réels
- `src/pages/ModularStandardPage.tsx` : Idem

### Fichiers touchés
- ➕ `scripts/update-firestore-images.mjs` (ajouté)
- ➕ `scripts/update-firestore-images.ts` (ajouté)
- ✏️ `src/pages/AccessoiresPage.tsx`
- ✏️ `src/pages/CampingCarPage.tsx`
- ✏️ `src/pages/SolarPage.tsx`
- ✏️ `src/pages/SolarKitDetailPage.tsx`
- ✏️ `src/pages/ModularHomesPage.tsx`
- ✏️ `src/pages/ModularPremiumPage.tsx`
- ✏️ `src/pages/ModularStandardPage.tsx`

### Résultat Firestore
- 18/20 produits mis à jour avec images[] réelles (attache-rapide, pince-pouce sans image disponible)
- Mini-pelles R18/R22/R32 : 4 vues chacune | R57 : 1 vue
- Camping-car : 7 photos | Modulaires : 4 photos chacune | Kits solaires : 5 photos chacun
- Accessoires : 1 photo chacun

### Statut
- ⏳ En attente de commit

---

## [2026-04-06 11:00] — v1.4 (non committé)
### Modifications
- `scripts/export-products-json.ts` : Export Firestore products → JSON (lecture seule)
- `scripts/prompt-step1-scan-images.py` : Scan local `97import2026_siteweb/vercel/images/` → `images-inventory.json`
- `scripts/prompt-step2-generate-excel.py` : Génère `CATALOGUE-MAPPING-IMAGES.xlsx` (4 onglets, matching par mots-clés, couleurs)

### Fichiers touchés
- ➕ `scripts/export-products-json.ts` (ajouté)
- ➕ `scripts/prompt-step1-scan-images.py` (ajouté)
- ➕ `scripts/prompt-step2-generate-excel.py` (ajouté)
- ➕ `scripts/images-inventory.json` (généré localement, non committé)
- ➕ `scripts/firestore-products.json` (généré localement, non committé)
- ➕ `CATALOGUE-MAPPING-IMAGES.xlsx` (généré localement, non committé)

### Résultat
- 132 images scannées (products, accessories, solar, logo, portal, root)
- 20 produits Firestore chargés (projet `import-412d0`)
- **19/20 produits avec ≥2 images** — 1 produit avec 1 seule image — 0 sans image

### Statut
- Scripts créés — non committés (fichiers de travail)

---

## [2026-04-06 10:19] — v1.3 (1494a98)
### Modifications
- `scripts/export-catalogue-excel.ts` : Script export catalogue Firestore → Excel (lecture seule)

### Fichiers touchés
- ➕ `scripts/export-catalogue-excel.ts` (ajouté)
- ➕ `CATALOGUE-AUDIT-IMAGES.xlsx` (généré localement, non committé)

### Résultat
- 20 produits exportés depuis Firestore (`import-412d0`)
- **20/20 sans image** — champ `images[]` vide sur tous les produits

### Statut
- ✅ Committé — branche `main`

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
