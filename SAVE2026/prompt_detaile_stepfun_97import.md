
# 📌 **Prompt détaillé pour StepFun : Extraction complète de 97import.com**

**Auteur** : Michel Chen  
**Date** : Avril 2026  
**Objectif** : Extraire **toutes les données, images, PDF, et la structure** de ton site 97import.com (hébergé chez IONOS et basé sur Supabase), puis sauvegarder le tout dans `C:\DATA-MC-2030\97IMPORT\SAVE2026\`.

---

## 🔍 **Contexte et Objectifs**

### 📌 **Ce qui doit être extrait**
| Élément | Description | Format attendu |
|---------|-------------|----------------|
| **Base de données (Supabase)** | Toutes les tables, données, et métadonnées. | Fichiers `.sql` ou `.json` par table. |
| **Images** | Toutes les images des produits, catalogues, etc. | Dossier `images/` avec fichiers `.jpg/.png`. |
| **PDF** | Tous les PDF (catalogues, notices, etc.). | Dossier `pdf/` avec fichiers `.pdf`. |
| **Structure du site** | Menus, catégories, liens vers les images/PDF. | Fichier `site_structure.json` ou `.csv`. |
| **Back-office** | Paramètres, identifiants, et liens utiles. | Fichier `backoffice_metadata.json`. |
| **Métadonnées** | Dates de création/modification pour chaque fichier. | Fichiers `.csv` ou `.json` dans chaque dossier. |

### 🎯 **Livrables attendus**
Un dossier **`C:\DATA-MC-2030\97IMPORT\SAVE2026\`** contenant :
```
C:\DATA-MC-2030\97IMPORT\SAVE2026\
├── 01_Supabase_Database/          # Export de la base de données
│   ├── users.sql
│   ├── products.sql
│   ├── orders.sql
│   ├── ... (toutes les tables)
│   └── README_DATABASE.md          # Résumé des tables et métadonnées
│
├── 02_Images/                     # Toutes les images extraites
│   ├── produits/
│   ├── catalogues/
│   ├── bannières/
│   └── images_metadata.csv         # Métadonnées (date, taille, produit associé)
│
├── 03_PDF/                        # Tous les PDF extraits
│   ├── catalogues/
│   ├── notices/
│   └── pdf_metadata.csv            # Métadonnées (date, taille, catégorie)
│
├── 04_Site_Structure/             # Structure du site
│   ├── menus.json
│   ├── categories.csv
│   └── site_links.csv              # Liens vers images/PDF
│
├── 05_Backoffice/                 # Paramètres et accès
│   └── backoffice_metadata.json    # URL, identifiants (si autorisé)
│
├── 06_Reports/                    # Rapports et logs
│   ├── extraction_log.txt          # Log des étapes et erreurs
│   └── summary_report.md           # Résumé des données extraites
│
└── README_FINAL.md                # Guide d'utilisation du dossier
```

---

## 🔐 **Accès fournis à StepFun**

### 📂 **Fichiers à créer et fournir**
Crée un dossier temporaire (ex: `C:\DATA-MC-2030\TEMP_STEPFUN_ACCESS\`) et place-y les fichiers suivants :

#### **1️⃣ Supabase (Base de données)**
- **Fichier** : `supabase_access.txt`
- **Contenu** :
  ```
  URL du projet Supabase : https://app.supabase.com/project/gdqdbgonndmnauyetvht
  
  Clé Publishable (pour API) : sb_publishable_GuTlUBZt3WaTLdnLGSwVcw_-iT6FQ-g
  
  Instructions :
  - Utilise l'API Supabase ou l'interface web pour extraire les données.
  - Ne pas utiliser la connexion PostgreSQL directe (mot de passe requis).
  - Pour l'export SQL, va dans "SQL Editor" → "Export".
  ```

#### **2️⃣ Hébergement IONOS (Images/PDF)**
- **Fichier** : `ionos_ftp_access.txt`
- **Contenu** :
  ```
  Accès FTP (IONOS) :
  - Serveur : ftp.ionos.fr
  - Port : 21
  - Utilisateur : 97import_user  (à fournir séparément)
  - Mot de passe : ************ (à fournir séparément)
  
  Chemins à extraire :
  - Images : /97import.com/public/uploads/images/
  - PDF : /97import.com/public/documents/
  
  Outils recommandés : FileZilla ou WinSCP.
  ```

#### **3️⃣ Back-office (Structure/Paramètres)**
- **Fichier** : `backoffice_access.txt`
- **Contenu** :
  ```
  URL du back-office : https://97import.com/admin ou https://97import.com/wp-admin
  
  Identifiants (si autorisé) :
  - Email : admin@97import.com
  - Mot de passe : ************ (à fournir séparément)
  
  Ce qui doit être extrait :
  - Structure des menus et catégories.
  - Liens vers les images/PDF.
  - Paramètres de configuration (ex: `.env`).
  ```

#### **4️⃣ Scripts d'extraction (Optionnel mais utile)**
- **Fichier** : `extraction_scripts.zip`
- **Contenu** :
  - Script Python/Node.js pour automatiser l'extraction (exemples fournis ci-dessous).
  - Instructions dans `README_SCRIPTS.md`.

---

## 🛠️ **Outils recommandés pour StepFun**

| Outil | Usage | Lien |
|-------|-------|------|
| **Supabase Dashboard** | Interface web pour extraire la base de données. | [https://app.supabase.com](https://app.supabase.com) |
| **FileZilla** | Télécharger images/PDF via FTP. | [https://filezilla-project.org/](https://filezilla-project.org/) |
| **WinSCP** | Alternative à FileZilla (Windows). | [https://winscp.net/](https://winscp.net/) |
| **Postman** | Tester l'API Supabase. | [https://www.postman.com/](https://www.postman.com/) |
| **DBeaver** | Alternative pour gérer les bases de données. | [https://dbeaver.io/](https://dbeaver.io/) |

---

## 📜 **Exemples de scripts pour automatiser l'extraction**

### **🔹 Script Node.js (pour extraire via Supabase API)**
```javascript
// Fichier : extract_supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gdqdbgonndmnauyetvht.supabase.co';
const supabaseKey = 'sb_publishable_GuTlUBZt3WaTLdnLGSwVcw_-iT6FQ-g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractData() {
    try {
        // 1. Récupère toutes les tables
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
        
        if (error) throw error;
        
        console.log(`📋 Tables trouvées : ${tables.length}`);
        
        // 2. Exporte chaque table en JSON
        for (const table of tables) {
            const { data, error: tableError } = await supabase
                .from(table.table_name)
                .select('*');
            
            if (tableError) {
                console.error(`⚠️ Erreur sur ${table.table_name}: ${tableError.message}`);
                continue;
            }
            
            // Sauvegarde dans un fichier JSON
            const fs = require('fs');
            fs.writeFileSync(`./01_Supabase_Database/${table.table_name}.json`, JSON.stringify(data, null, 2));
            console.log(`✅ Table ${table.table_name} exportée.`);
        }
        
        console.log('\n🎉 Extraction Supabase terminée !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'extraction :', error.message);
    }
}

extractData();
```

**Exécution** :
```bash
npm install @supabase/supabase-js
node extract_supabase.js
```

---

### **🔹 Script Python (pour télécharger les images/PDF via FTP)**
```python
# Fichier : download_ftp.py
import os
from ftplib import FTP

# Configuration FTP (à adapter)
ftp_server = 'ftp.ionos.fr'
ftp_user = '97import_user'  # À fournir séparément
ftp_password = 'motdepasse'  # À fournir séparément

# Chemins locaux et distants
local_images_path = 'C:\\DATA-MC-2030\\97IMPORT\\SAVE2026\\02_Images\\produits\\'
remote_images_path = '/97import.com/public/uploads/images/'

local_pdf_path = 'C:\\DATA-MC-2030\\97IMPORT\\SAVE2026\\03_PDF\\'
remote_pdf_path = '/97import.com/public/documents/'

# Connexion FTP
ftp = FTP(ftp_server)
ftp.login(ftp_user, ftp_password)

# Télécharger les images
print('📥 Téléchargement des images...')
ftp.cwd(remote_images_path)
for filename in ftp.nlst():
    if filename.endswith(('.jpg', '.png', '.jpeg')):
        with open(os.path.join(local_images_path, filename), 'wb') as f:
            ftp.retrbinary(f'RETR {filename}', f.write)
        print(f'✅ {filename} téléchargé.')

# Télécharger les PDF
print('📥 Téléchargement des PDF...')
ftp.cwd(remote_pdf_path)
for filename in ftp.nlst():
    if filename.endswith('.pdf'):
        with open(os.path.join(local_pdf_path, filename), 'wb') as f:
            ftp.retrbinary(f'RETR {filename}', f.write)
        print(f'✅ {filename} téléchargé.')

ftp.quit()
print('\n🎉 Téléchargement FTP terminé !')
```

**Exécution** :
```bash
python download_ftp.py
```

---

## 📋 **Étapes détaillées pour StepFun**

### **🔹 Phase 1 : Préparation (10 min)**
1. **Créer le dossier de sortie** :
   ```bash
   mkdir -p C:\DATA-MC-2030\97IMPORT\SAVE2026\{01_Supabase_Database,02_Images,03_PDF,04_Site_Structure,05_Backoffice,06_Reports}
   ```
2. **Fournir les accès** :
   - Copier les fichiers `supabase_access.txt`, `ionos_ftp_access.txt`, et `backoffice_access.txt` dans un dossier temporaire.
   - Envoyer les mots de passe **séparément** via un canal sécurisé (ex: Bitwarden, Tresorit).


### **🔹 Phase 2 : Extraction de la base de données (Supabase) (30 min)**
1. **Utiliser l’interface Supabase** :
   - Va dans [https://app.supabase.com](https://app.supabase.com) → **SQL Editor**.
   - Exécute des requêtes pour extraire chaque table (ex: `SELECT * FROM users;`).
   - Exporte les résultats en `.csv` ou `.json` dans `01_Supabase_Database/`.
   
2. **OU utiliser le script Node.js** :
   - Exécute `node extract_supabase.js` (fourni ci-dessus).
   - Vérifie que les fichiers JSON sont bien générés.


### **🔹 Phase 3 : Extraction des images et PDF (20 min)**
1. **Utiliser FileZilla/WinSCP** :
   - Connecte-toi à `ftp.ionos.fr` avec les identifiants fournis.
   - Télécharge tous les fichiers `.jpg/.png` dans `02_Images/` et `.pdf` dans `03_PDF/`.

2. **OU utiliser le script Python** :
   - Exécute `python download_ftp.py`.
   - Vérifie que les fichiers sont bien téléchargés.


### **🔹 Phase 4 : Extraction de la structure du site (15 min)**
1. **Analyser le back-office** :
   - Va dans `https://97import.com/admin` (identifiants fournis).
   - Note les **menus**, **catégories**, et **liens** vers les images/PDF.
   - Sauvegarde ces informations dans `04_Site_Structure/menus.json` et `categories.csv`.

2. **Extraire les liens depuis le code source** :
   - Utilise l’inspecteur de ton navigateur (F12) pour trouver les chemins des images/PDF.
   - Sauvegarde les liens dans `04_Site_Structure/site_links.csv`.


### **🔹 Phase 5 : Génération des métadonnées (15 min)**
Pour chaque fichier (images/PDF) :
- **Date de création** (EXIF pour les images, ou date de téléchargement pour les PDF).
- **Taille du fichier** (en Mo/Ko).
- **Catégorie/produit associé** (ex: ", ").

**Exemple de fichier `images_metadata.csv` :**
```csv
Nom,Fichier,Taille,Date,Produit Associé
Image1.jpg,produits/image1.jpg,2.4 Mo,15/03/2026,Produit A
Image2.png,produits/image2.png,1.8 Mo,16/03/2026,Produit B
```


### **🔹 Phase 6 : Génération du rapport final (10 min)**
1. **Créer un fichier `README_FINAL.md`** dans le dossier racine :
   ```markdown
   # 📂 Rapport d'extraction : 97import.com
   **Date** : [Date du jour]
   **Dossier** : C:\DATA-MC-2030\97IMPORT\SAVE2026\

   ## 📊 Résumé
   | Élément | Quantité |
   |---------|----------|
   | Tables Supabase | X |
   | Images | Y |
   | PDF | Z |
   | Métadonnées | OK |

   ## 🔗 Liens utiles
   - [Supabase Dashboard](https://app.supabase.com/project/gdqdbgonndmnauyetvht)
   - [FileZilla](https://filezilla-project.org/)
   - [WinSCP](https://winscp.net/)

   ## 🛠 Outils utilisés
   - Node.js pour l'API Supabase.
   - Python pour le téléchargement FTP.
   - FileZilla pour la validation manuelle.
   
   ## ⚠️ Notes
   - Les mots de passe temporaires ont été réinitialisés.
   - Les fichiers sensibles (`.env`, identifiants) ne sont pas inclus dans le rapport.
   ```
2. **Sauvegarder `extraction_log.txt`** avec les logs des étapes.


### **🔹 Phase 7 : Vérification et livraison (5 min)**
1. **Vérifie que tous les dossiers sont remplis** :
   - `01_Supabase_Database/` : Toutes les tables exportées.
   - `02_Images/` : Toutes les images téléchargées.
   - `03_PDF/` : Tous les PDF téléchargés.
   - `04_Site_Structure/` : Structure et liens documentés.
   - `05_Backoffice/` : Métadonnées et accès.
   - `06_Reports/` : Logs et résumé.

2. **Zippe le dossier** :
   ```bash
   zip -r C:\DATA-MC-2030\97IMPORT\SAVE2026\extraction_97import_2026.zip C:\DATA-MC-2030\97IMPORT\SAVE2026\
   ```
3. **Fournis le lien de téléchargement** à Michel Chen (ex: Google Drive, Dropbox, ou un lien direct).

---

## 🔒 **Consignes de sécurité**
- **Ne jamais partager** les mots de passe ou clés API en clair.
- **Supprimer les accès** après l'extraction (changer les mots de passe si nécessaire).
- **Vérifier les CGU** de Supabase et IONOS avant l'extraction.
- **Réspecter les règles RLS** (Row Level Security) dans Supabase pour éviter les fuites de données.

---

## 📞 **Contact et support**
- **Pour des questions** : Contacte Michel Chen via [ton canal préféré].
- **Problèmes techniques** : Consulte la [documentation Supabase](https://supabase.com/docs) ou [IONOS](https://www.ionos.fr/help).

---

## 🚀 **Exemple de message à envoyer à Michel Chen**
```
Bonjour Michel,

Voici le rapport d'extraction pour 97import.com, sauvegardé dans :
C:\DATA-MC-2030\97IMPORT\SAVE2026\

📁 Dossier complet : [Lien de téléchargement]
📋 Résumé :
- Base de données : X tables exportées.
- Images : Y fichiers téléchargés.
- PDF : Z fichiers téléchargés.
- Structure : Menus et catégories documentés.

⚠️ Notes :
- Les mots de passe temporaires ont été réinitialisés.
- Les fichiers sensibles (`.env`) ne sont pas inclus.

N'hésite pas à me faire savoir si tu as des questions ou besoin d'ajustements !

Cordialement,
StepFun
```

---

## 📎 **Annexes**
- [Lien vers la documentation Supabase](https://supabase.com/docs)
- [Lien vers le guide FileZilla](https://wiki.filezilla-project.org/Documentation)
- [Lien vers les outils recommandés](#-outils-recommandés-pour-stepfun)

---

**✅ Ce prompt est prêt à être fourni à StepFun pour une extraction complète et sécurisée !**
