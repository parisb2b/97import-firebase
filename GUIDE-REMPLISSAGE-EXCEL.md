# Guide de remplissage — catalogue-97import-YYYYMMDD.xlsx

## 📂 Emplacement du fichier

Le fichier Excel a été généré à la racine du projet :
`~/97import-firebase/catalogue-97import-YYYYMMDD.xlsx`

## 📋 Contenu du fichier

### Onglet 1 : "Catalogue 97import"
Tous tes produits Firestore, pré-remplis avec les données existantes.

**Colonnes verrouillées (🔒)** — NE PAS modifier :
- reference, categorie, groupe_produit, duplique_de

**Colonnes à remplir** :
- **nom_fr** (obligatoire) : nom du produit en français
- **description_fr** (obligatoire) : description commerciale complète

**Colonnes optionnelles** :
- nom_en, nom_zh : laisser vides → traduction auto DeepL
- description_en, description_zh : idem
- prix_achat_usd / prix_achat_cny / prix_achat : remplir UNE SEULE, les autres se calculent
- sous_categorie, fournisseur_nom, fournisseur_contact
- image_principale : nom du fichier photo
- actif : TRUE ou FALSE

### Onglet 2 : "📘 Instructions"
Rappel complet de toutes les règles.

### Onglet 3 : "📊 Stats"
- Nombre de produits par catégorie
- Taux de complétude de chaque champ (pour voir ce qui manque)

## 🖼️ Gestion des photos

### Dossier de dépôt
Crée un dossier : `~/97import-OK/photos-catalogue/`

### Format de nommage
Pour chaque produit, nomme la photo avec la **référence + -principal** :

```
MP-R22-001-principal.jpg
MP-R22-002-principal.jpg
MS-20-001-principal.jpg
KS-10K-001-principal.jpg
```

### Formats acceptés
`.jpg`, `.jpeg`, `.png`, `.webp`

### Dans l'Excel
Dans la colonne "Image principale", mets juste le nom du fichier :
```
image_principale : MP-R22-001-principal.jpg
```

(Claude Code trouvera la photo dans le dossier automatiquement)

## 🔄 Processus complet

1. **Tu ouvres l'Excel** dans Numbers (Mac) ou Excel
2. **Tu remplis** les nouvelles informations
3. **Tu mets les photos** dans `~/97import-OK/photos-catalogue/`
4. **Tu demandes le prompt d'import** : "prépare le prompt IMPORT-CATALOGUE-EXCEL"
5. **Tu lances le prompt** avec Claude Code
6. Claude Code :
   - Lit l'Excel
   - Uploade les photos dans Firebase Storage
   - Met à jour Firestore (chaque produit)
   - Traduit FR → EN/ZH via DeepL
   - Calcule les devises manquantes via Frankfurter
   - Arrondit les prix à l'euro sup pour Public/Partenaire
7. **Rapport final** : produits mis à jour, photos uploadées, erreurs éventuelles

## ⚠️ Règles importantes

- **Ne supprime JAMAIS de ligne** (sinon le produit sera perdu de vue lors de l'import)
- **Ne modifie pas** les colonnes verrouillées (🔒)
- **Les cases vides** sont ignorées lors de l'import (pas d'écrasement)
- **Si tu veux VIDER un champ** (supprimer son contenu), mets la valeur `CLEAR` (en majuscules)

## 💡 Astuces

- Remplis d'abord les produits **les plus vendus** (priorise)
- Commence par une catégorie complète (ex: toutes les mini-pelles)
- Garde l'Excel **ouvert** pendant plusieurs jours, complète par étapes
- À chaque étape, tu peux relancer l'import — seules les nouvelles infos seront mises à jour
