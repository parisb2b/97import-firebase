import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

const app = initializeApp({
  apiKey: "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.firebasestorage.app",
});

const db = getFirestore(app);

// Recuperer les produits
const snap = await getDocs(collection(db, 'products'));
const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

console.log(`📦 ${products.length} produits Firestore\n`);

// Afficher la table de correspondance actuelle
console.log('=== TABLE DE CORRESPONDANCE ===');
console.log('Reference | Nom FR | Categorie | Gamme');
console.log('----------|--------|-----------|------');
products
  .filter(p => p.reference)
  .sort((a, b) => (a.reference || '').localeCompare(b.reference || ''))
  .forEach(p => {
    console.log(`${p.reference} | ${p.nom_fr || '-'} | ${p.categorie || '-'} | ${p.gamme || '-'}`);
  });

// Lister les fichiers images actuels
const IMAGES_DIR = process.env.HOME + '/97import-OK/images';
const RENAMED_DIR = process.env.HOME + '/97import-OK/images-renamed';

function walkDir(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walkDir(full));
    else files.push(full);
  }
  return files;
}

const allFiles = walkDir(IMAGES_DIR);
const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
const imageFiles = allFiles.filter(f => imageExts.includes(extname(f).toLowerCase()));

console.log(`\n\n=== ${imageFiles.length} FICHIERS IMAGES ===`);
imageFiles.forEach(f => console.log(`  ${f.replace(IMAGES_DIR + '/', '')}`));

// Creer le dossier de destination
mkdirSync(RENAMED_DIR, { recursive: true });

console.log(`\n\n=== RENOMMAGE ===`);
console.log(`Dossier destination : ${RENAMED_DIR}`);
console.log('Les fichiers originaux ne sont PAS modifies.\n');

// Pour chaque produit avec reference, chercher ses images
// et les copier avec le nouveau nom
let renamed = 0;
let notFound = 0;

products.filter(p => p.reference).forEach(p => {
  const ref = p.reference;
  const gamme = (p.gamme || '').toLowerCase();

  // Chercher les images qui correspondent
  const matchingFiles = imageFiles.filter(f => {
    const name = basename(f).toLowerCase();
    const dir = f.toLowerCase();

    // Match par gamme dans le chemin du fichier
    if (gamme && dir.includes(gamme.replace(/\s+/g, '_').toLowerCase())) return true;
    if (gamme && name.includes(gamme.replace(/\s+/g, '').toLowerCase())) return true;

    // Match par reference dans le nom du fichier
    if (name.includes(ref.toLowerCase())) return true;

    return false;
  });

  if (matchingFiles.length > 0) {
    matchingFiles.forEach((f, i) => {
      const ext = extname(f);
      const newName = `${ref}_${String(i + 1).padStart(2, '0')}${ext}`;
      const dest = join(RENAMED_DIR, newName);
      copyFileSync(f, dest);
      console.log(`  ✅ ${basename(f)} → ${newName}`);
      renamed++;
    });
  } else {
    notFound++;
  }
});

console.log(`\n=== RESULTAT ===`);
console.log(`✅ Renommes : ${renamed}`);
console.log(`❌ Sans image : ${notFound}`);
console.log(`\nVerifiez le dossier ${RENAMED_DIR} et ajustez si necessaire.`);

process.exit(0);
