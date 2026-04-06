# ════════════════════════════════════════════════════════
# PROMPT CLAUDE CODE — Export Catalogue Excel + Audit Images
# Dossier : C:\data-mc-2030\97import
# ════════════════════════════════════════════════════════

## RÈGLE OBLIGATOIRE — À exécuter EN PREMIER, sans exception
```
git fetch origin && git reset --hard origin/main
git tag backup-export-catalogue-$(date +%Y%m%d-%H%M) && git push origin --tags
git log --oneline -3
```

## MISSION

Créer un script Node.js temporaire qui :
1. Se connecte à Firestore (projet `import-412d0`)
2. Lit TOUS les produits de la collection `products`
3. Exporte un fichier Excel `CATALOGUE-AUDIT-IMAGES.xlsx` dans `C:\data-mc-2030\97import\`

## ÉTAPE 1 — Créer le script d'export

Créer le fichier : `C:\data-mc-2030\97import\scripts\export-catalogue-excel.ts`

```typescript
// Ce script utilise le SDK Firebase client (pas admin)
// Il se connecte avec les mêmes clés que l'app

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportCatalogue() {
  // 1. Lire tous les produits
  const q = query(collection(db, 'products'), orderBy('nom'));
  const snapshot = await getDocs(q);

  const rows: any[] = [];
  let index = 1;

  for (const doc of snapshot.docs) {
    const p = doc.data();
    const numInterne = p.numero_interne || '';
    const images: string[] = p.images || [];

    // Nombre d'images attendues (minimum 1 par produit)
    const nbImages = Math.max(images.length, 1);

    // Générer les noms de fichiers attendus
    const nomsAttendu: string[] = [];
    for (let i = 1; i <= Math.max(nbImages, 3); i++) {
      const num = String(i).padStart(2, '0');
      nomsAttendu.push(`${numInterne}-${num}.png`);
    }

    // Vérifier si les images actuelles existent (URL non vide)
    const imageStatus = images.length > 0 
      ? images.map((url, i) => {
          if (!url || url === '' || url.includes('placeholder') || url.includes('Image')) {
            return '❌ MANQUANTE';
          }
          return '✅ OK';
        }).join(' | ')
      : '❌ AUCUNE IMAGE';

    rows.push({
      '#': index,
      'ID Firestore': doc.id,
      'N° Interne': numInterne,
      'Nom FR': p.nom || '',
      'Nom Chinois': p.nom_chinois || '',
      'Catégorie': p.categorie || '',
      'Prix Achat €': p.prix_achat || 0,
      'Prix Public €': (p.prix_achat || 0) * 2,
      'Actif': p.actif ? 'OUI' : 'NON',
      'Nb Images Actuelles': images.length,
      'Statut Images': imageStatus,
      'URL Image 1': images[0] || '',
      'URL Image 2': images[1] || '',
      'URL Image 3': images[2] || '',
      'URL Image 4': images[3] || '',
      'Nom Fichier Attendu 1': nomsAttendu[0] || '',
      'Nom Fichier Attendu 2': nomsAttendu[1] || '',
      'Nom Fichier Attendu 3': nomsAttendu[2] || '',
      'Chemin Storage Attendu': `products/${doc.id}/`,
      'Code HS': p.code_hs || '',
      'Poids Net kg': p.poids_net_kg || '',
      'Poids Brut kg': p.poids_brut_kg || '',
      'Dimensions L×l×H cm': `${p.longueur_cm || '?'}×${p.largeur_cm || '?'}×${p.hauteur_cm || '?'}`,
    });
    index++;
  }

  // 2. Créer le workbook Excel
  const wb = XLSX.utils.book_new();

  // Feuille 1 : Catalogue complet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 4 },   // #
    { wch: 24 },  // ID Firestore
    { wch: 14 },  // N° Interne
    { wch: 30 },  // Nom FR
    { wch: 20 },  // Nom Chinois
    { wch: 14 },  // Catégorie
    { wch: 12 },  // Prix Achat
    { wch: 12 },  // Prix Public
    { wch: 6 },   // Actif
    { wch: 8 },   // Nb Images
    { wch: 30 },  // Statut Images
    { wch: 50 },  // URL 1
    { wch: 50 },  // URL 2
    { wch: 50 },  // URL 3
    { wch: 50 },  // URL 4
    { wch: 22 },  // Nom Attendu 1
    { wch: 22 },  // Nom Attendu 2
    { wch: 22 },  // Nom Attendu 3
    { wch: 28 },  // Chemin Storage
    { wch: 12 },  // Code HS
    { wch: 10 },  // Poids Net
    { wch: 10 },  // Poids Brut
    { wch: 20 },  // Dimensions
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Produits');

  // Feuille 2 : Résumé par catégorie
  const categories: Record<string, { total: number; sansImage: number; avecImage: number }> = {};
  for (const row of rows) {
    const cat = row['Catégorie'] || 'Sans catégorie';
    if (!categories[cat]) categories[cat] = { total: 0, sansImage: 0, avecImage: 0 };
    categories[cat].total++;
    if (row['Nb Images Actuelles'] === 0) {
      categories[cat].sansImage++;
    } else {
      categories[cat].avecImage++;
    }
  }

  const resumeRows = Object.entries(categories).map(([cat, data]) => ({
    'Catégorie': cat,
    'Total Produits': data.total,
    'Avec Images': data.avecImage,
    'Sans Images': data.sansImage,
    '% Complet': `${Math.round((data.avecImage / data.total) * 100)}%`,
  }));

  const wsResume = XLSX.utils.json_to_sheet(resumeRows);
  wsResume['!cols'] = [
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé par Catégorie');

  // Feuille 3 : Instructions pour Michel
  const instructions = [
    ['INSTRUCTIONS — Comment corriger les images'],
    [''],
    ['1. Pour chaque produit avec ❌ dans "Statut Images", préparer les fichiers image'],
    ['2. Nommer les fichiers selon la colonne "Nom Fichier Attendu" (ex: MP-R18-001-01.png)'],
    ['3. Uploader dans Firebase Storage dans le dossier indiqué par "Chemin Storage Attendu"'],
    ['4. Mettre à jour le champ images[] du produit dans Firestore avec les nouvelles URLs'],
    [''],
    ['CONVENTION DE NOMMAGE :'],
    ['  {numero_interne}-01.png  →  Image principale (miniature catalogue)'],
    ['  {numero_interne}-02.png  →  Vue latérale ou détail'],
    ['  {numero_interne}-03.png  →  Vue arrière ou accessoires'],
    ['  {numero_interne}-04.png  →  Photo complémentaire (optionnel)'],
    [''],
    ['FORMATS ACCEPTÉS : .png .jpg .webp (max 2 Mo par image)'],
    ['DIMENSIONS RECOMMANDÉES : 800×800px minimum, fond blanc de préférence'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
  wsInstr['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  // 3. Sauvegarder
  const outputPath = path.resolve('CATALOGUE-AUDIT-IMAGES.xlsx');
  XLSX.writeFile(wb, outputPath);
  console.log(`\n✅ Fichier exporté : ${outputPath}`);
  console.log(`📊 ${rows.length} produits exportés`);
  console.log(`❌ ${rows.filter(r => r['Nb Images Actuelles'] === 0).length} produits sans aucune image`);
  console.log(`✅ ${rows.filter(r => r['Nb Images Actuelles'] > 0).length} produits avec au moins 1 image`);
}

exportCatalogue().catch(console.error).finally(() => process.exit(0));
```

## ÉTAPE 2 — Installer les dépendances nécessaires

```bash
cd C:\data-mc-2030\97import
npm install xlsx dotenv --save-dev
```

## ÉTAPE 3 — Exécuter le script

```bash
npx tsx scripts/export-catalogue-excel.ts
```

Si `tsx` n'est pas installé :
```bash
npm install -D tsx
npx tsx scripts/export-catalogue-excel.ts
```

## ÉTAPE 4 — Vérification

Confirmer que le fichier `CATALOGUE-AUDIT-IMAGES.xlsx` a été généré dans `C:\data-mc-2030\97import\`.

Afficher le résumé :
- Nombre total de produits
- Nombre de produits sans image
- Nombre de produits avec images OK

## IMPORTANT — NE PAS FAIRE
- Ne PAS modifier les produits dans Firestore
- Ne PAS modifier les images existantes
- Ne PAS supprimer de fichiers
- Ce script est EN LECTURE SEULE

## Commit
```
git add scripts/export-catalogue-excel.ts
git commit -m "feat: script export catalogue Excel pour audit images"
git push origin main
```
