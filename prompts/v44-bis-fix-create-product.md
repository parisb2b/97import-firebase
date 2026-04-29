# Mission V44-BIS — Bugs résiduels + Refonte création produit
## Mode nuit autonome avec checkpoints

## 📋 Contexte
Suite mission V44 FIX (HEAD `c8d4863` du 29-4-2026 21h21).
3 bugs résiduels identifiés + 2 features de simplification UX.

**État Firestore au lancement :**
- /admin_params/global : taux_eur_usd, taux_rmb_eur, taux_usd_cny, derniere_maj_taux, derniere_maj_source ✅
- /admin_params/coefficients_prix : coefficient_public 2.0, coefficient_partner 1.5, coefficient_vip 1.5 ✅
- 52 produits importés (mini-pelles + accessoires) + SOL-001 + SOL-002 (test)

## 🎯 Plan — 5 checkpoints

### Checkpoint A — FIX 1 — Rubrique 3 USD/CNY éditable
- Champ taux_usd_cny doit être éditable en mode édition (au lieu de disabled forcé).
- handleConfirmSave écrit les 3 taux tels que saisis (pas de recalcul auto).
- Tag : checkpoint-v44bis-A-fix1

### Checkpoint B — FIX 2 — KPI Dernière MAJ après VALIDER
- Bug : KPI affiche "—" après save (serverTimestamp non résolu côté client immédiatement).
- Fix : optimistic update local du state avec new Date() en attendant onSnapshot.
- Tag : checkpoint-v44bis-B-fix2

### Checkpoint C — FIX 3 — Liste /admin/produits affiche SOL-001/SOL-002
- Investigation : audit Firestore + code liste pour identifier le filtre exclueur.
- Fix : afficher TOUS les produits (no filter actif/inactif).
- Tag : checkpoint-v44bis-C-fix3

### Checkpoint D — FEATURE 7 — Simplification création produit
- 4 champs obligatoires : catégorie, référence, nom_fr, prix_achat_cny.
- Champ Fournisseur en datalist (TAOBAO.COM, 1688.COM, libre).
- actif: true par défaut.
- Toast adapté selon complétude.
- Tag : checkpoint-v44bis-D-feat7

### Checkpoint E — FEATURE 8 — Badges complétude + filtres
- Créer src/admin/utils/productCompleteness.ts (3 statuts : complet/incomplet/bloquant).
- Liste produits : 4 filtres + badge dans chaque ligne.
- Tag : checkpoint-v44bis-E-feat8

## 🚨 Règles non négociables
- Convention nommage : taux_eur_usd, taux_rmb_eur, taux_usd_cny, derniere_maj_taux UNIQUEMENT.
- Lazy compute : aucun recalcul stocké.
- Pas d'invention de lib.
- Build après chaque checkpoint. Si fail → STOP.
- Tags + commits granulaires.

## 📋 Rapport MAJ-V44-BIS.txt à générer en fin de mission.
