# AUDIT IMAGES 97IMPORT — 2 étapes à exécuter

## Contexte
Les images existent déjà en local dans `C:\DATA-MC-2030\97IMPORT\97import2026_siteweb\vercel\images\`
(sauvegarde de l'ancien site Vercel). Il faut les mapper aux produits Firebase.

---

## ÉTAPE 1 — Scanner le dossier (copier `prompt-step1-scan-images.py`)

Exécuter dans PowerShell ou via Stepfun :
```
python prompt-step1-scan-images.py
```

**Résultat** : fichier `scan_images_vercel.json` créé dans `C:\DATA-MC-2030\97IMPORT\`

---

## ÉTAPE 2 — Générer l'Excel de mapping (copier `prompt-step2-generate-excel.py`)

Installer d'abord openpyxl si pas fait :
```
pip install openpyxl
```

Puis exécuter :
```
python prompt-step2-generate-excel.py
```

**Résultat** : fichier `CATALOGUE-MAPPING-IMAGES.xlsx` avec 4 onglets :
1. **Toutes les Images** — liste brute de toutes les images trouvées
2. **Par Dossier** — regroupement par dossier (products, accessories, solar, etc.)
3. **Mapping Produits** — association automatique image ↔ produit avec statut ✅⚠️❌
4. **Instructions** — marche à suivre pour corriger

---

## ÉTAPE 3 (après vérification) — Upload dans Firebase Storage

Une fois le mapping vérifié dans l'Excel, donner le fichier à Claude Code avec :
```
Voici le mapping vérifié des images. Upload chaque image dans Firebase Storage 
dans products/{firestore_id}/ et mets à jour le champ images[] de chaque produit.
```
