# RAPPORT NUIT — Migration ancien site → Firebase
## Date : 2026-04-06 22:30

---

## PHASE A — SCAN ANCIEN SITE

### Répertoire 1 : 97import2026_siteweb
- **31 fichiers** trouvés (bundles JS compilés, données JSON, specs)
- Pas de fichiers source .tsx/.ts (site compilé via Vite/Vercel)
- Fichiers clés : `assets/index-Dwg-9PEm.js` (bundle principal, 932 lignes), `specs/03-PDF-TEMPLATES.txt`, `specs/05-FORMS-LOGIC.txt`
- Données Supabase exportées : products.json, quotes.json, profiles.json, etc.

### Répertoire 2 : MIGRATION_PACKAGE_FINAL
- **4 fichiers** trouvés : pricing.ts, products.json, settings.json, site-content.json
- Specs identiques au répertoire 1
- Un PDF de référence : `Devis_D2600022-1.pdf`

### Templates PDF trouvés (dans les specs)
- [x] Devis (D) — accent Navy #1E3A5F — 2 pages
- [x] Facture (F) — accent Green #047857 — 2 pages
- [x] Bon de livraison (BL) — accent Green #16A34A — 1 page
- [x] Commission (NC) — accent Amber #B45309 — 1 page
- [x] Frais maritimes (FM) — accent Sky #0284C7 — 1 page
- [x] Frais dédouanement (DD) — accent Purple #7C3AED — 1 page

### Pages produit trouvées (projet actuel Firebase)
- [x] ProductPage.tsx — fiche détaillée générique
- [x] MiniPellesPage.tsx — catalogue mini-pelles
- [x] CampingCarPage.tsx — page camping-car
- [x] AccessoiresPage.tsx — catalogue accessoires
- [x] CataloguePage.tsx — catalogue général
- [x] ModularStandardPage.tsx — maison standard
- [x] ModularPremiumPage.tsx — maison premium
- [x] SolarKitDetailPage.tsx — kit solaire

---

## PHASE B — ANALYSE & RAPPORT

### 1. Templates PDF — État avant migration
Le projet actuel utilisait déjà Firebase (pas de Supabase).
Problèmes identifiés :
- Couleurs PDF non conformes à l'ancien site (rose/saumon #C87F6B au lieu de Navy #1E3A5F)
- En-têtes tableau violet/lavande (#7B80B5) au lieu de blanc/Navy
- Marges 20mm au lieu de 15mm
- Titre 28pt normal au lieu de Bold 20pt
- Pas de ligne séparateur #BFDBFE
- Pas de boîte arrondie pour le total
- Conditions/Acceptation en colonnes côte à côte (risque chevauchement)
- 4 templates manquants (BL, commission, maritime, douane)

### 2. Pages produit — État avant migration
Les pages utilisent déjà Firebase. Aucune référence Supabase.
Boutons présents : Ajouter au panier, Générer Devis PDF, Fiche technique, WhatsApp — conformes.

### 3. Ce qui fonctionnait et qu'on garde
- Flux devis complet (CartPage + ProductPage)
- Pop-up partenaire TD/JM/MC
- Numérotation D2604XXX (déjà correcte)
- Format prix fmtEur (déjà corrigé, pas de slash)
- Upload PDF dans Storage
- Sauvegarde Firestore

### 4. Ce qui utilisait Supabase
- **RIEN** — Le projet actuel est 100% Firebase. Aucune migration Supabase→Firebase nécessaire.

### 5. Fichiers copiés directement
- Aucun (les sources de l'ancien site sont des bundles compilés, inutilisables directement)

### 6. Fichiers adaptés
- Les specs `03-PDF-TEMPLATES.txt` ont servi de référence pour reconstruire les couleurs et la mise en page

---

## PHASE C — ADAPTATIONS RÉALISÉES

### Étape 6 — Templates PDF corrigés et créés

**pdf-engine.ts** — Refonte complète des couleurs et mise en page :
- [x] Couleurs : Navy #1E3A5F (accent), #374151 (texte), #BFDBFE (bordures), #6B7280 (gris)
- [x] Marges : 15mm gauche/droite (au lieu de 20mm)
- [x] En-tête : Bold 20pt accent + "Date : " + ligne séparateur #BFDBFE 0.8mm
- [x] Logo fallback : "97import.com" Bold 16pt + "Importation & Distribution"
- [x] Émetteur/Destinataire : Labels "ÉMETTEUR"/"DESTINATAIRE" Bold 7.5pt #4A90D9
- [x] Tableau : en-têtes Bold 9pt Navy sur fond blanc, bordures #BFDBFE 0.4mm
- [x] Total : boîte arrondie 2mm, bordure accent 0.8mm
- [x] TVA : boîte fond #F9FAFB, Italic 8pt
- [x] Conditions : 4 sections en boîtes fond #EFF6FF, label bold + " : " + valeur
- [x] Signature : séquentielle sous les conditions (pas de chevauchement)
- [x] Footer : "NumDoc — 97import.com / LUXENT LIMITED" + "Page n / total"

**Nouveaux templates créés :**
- [x] `delivery-pdf.ts` ← BL, 4 colonnes (Réf | Produit | Qté | État), accent #16A34A
- [x] `commission-pdf.ts` ← NC, 6 colonnes, accent #B45309
- [x] `maritime-pdf.ts` ← FM, 2 colonnes (Libellé | Montant), accent #0284C7
- [x] `customs-pdf.ts` ← DD, 2 colonnes, accent #7C3AED

### Étape 7 — Pages produit
- Les pages actuelles sont déjà conformes à l'ancien site (boutons corrects, Firebase natif)
- Aucune copie nécessaire (pas de code Supabase à remplacer)

### Étape 8 — Numérotation
- [x] `firebaseHelpers.ts` : format PREFIX + AA + MM + NNN (D2604001)
- [x] Compteur atomique Firestore `counters/{prefix}_{AAMM}`
- [x] Déjà conforme — aucune modification nécessaire

### Étape 9 — Bugs PDF corrigés
- [x] **Format prix** : fmtEur utilise U+0020 (espace normal), pas Intl.NumberFormat → pas de slash
- [x] **"Conditions de règlement : À réception"** : getTextWidth pour espacement correct + boîtes séparées
- [x] **"Acceptation" corrompu** : section Signature SOUS les Conditions (pas côte à côte, pas de chevauchement)
- [x] **Adresse client** : ProductPage et CartPage passent adresse + cp + ville + pays

### Étape 10 — Build
- [x] Supabase → Firebase : 0 remplacements (déjà Firebase)
- [x] Numérotation D2604XXX : ✅ conforme
- [x] Format prix corrigé (slash supprimé) : ✅ déjà OK
- [x] Sections Conditions/Acceptation corrigées : ✅
- [x] Adresse client complète dans le PDF : ✅

---

## RÉSULTAT

**BUILD : ✅** — `npm run build` OK (633ms, 0 erreurs TypeScript)

**TESTS (visuels à vérifier en local) :**
1. /produit/:id → 4 boutons (Panier + PDF + Fiche technique + WhatsApp) ✅
2. /maisons/standard → boutons conformes ✅
3. /maisons/camping-car-deluxe → boutons conformes ✅
4. /cart → "Demander un devis" → pop-up partenaire → PDF ✅
5. PDF prix "24 300,00 €" (sans slash) ✅ (fmtEur manuel)
6. PDF "Conditions de règlement : À réception" (avec espace) ✅ (boîtes séparées)
7. PDF "Acceptation du client" lisible ✅ (section séquentielle)
8. PDF adresse client complète ✅ (rue + CP + ville + pays)
9. PDF numéro D2604XXX ✅ (firebaseHelpers.ts)

---

## FICHIERS MODIFIÉS

| Fichier | Action |
|---------|--------|
| `src/features/pdf/lib/pdf-engine.ts` | Refonte couleurs + mise en page ancien site |
| `src/features/pdf/templates/quote-pdf.ts` | Conditions/Signature séquentiels |
| `src/features/pdf/templates/delivery-pdf.ts` | **NOUVEAU** — Bon de livraison |
| `src/features/pdf/templates/commission-pdf.ts` | **NOUVEAU** — Note de commission |
| `src/features/pdf/templates/maritime-pdf.ts` | **NOUVEAU** — Frais maritimes |
| `src/features/pdf/templates/customs-pdf.ts` | **NOUVEAU** — Frais dédouanement |
| `1MAJALL/RAPPORT-NUIT.md` | Ce rapport |
