// scripts/upload-images-mini-pelles.js
// MISSION V44 — Phase 3.A
// Upload des images source (Mac local) vers Firebase Storage,
// puis update Firestore image_principale avec URLs HTTPS.
//
// Usage :
//   node scripts/upload-images-mini-pelles.js          # dry-run
//   node scripts/upload-images-mini-pelles.js --apply  # exécution
//
// Convention Storage : products/{family}/main.{ext}
//   1 fichier physique par famille → URL partagée entre tous les SKU
//   de la famille (économie ~90% de Storage)

import admin from 'firebase-admin';
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = path.join(ROOT, 'backups');
const HOME = os.homedir();
const SOURCE_ROOT = path.join(HOME, '97import-OK/images');
const STORAGE_BUCKET = 'importok-6ef77.firebasestorage.app';

const serviceAccount = JSON.parse(
  readFileSync(path.join(ROOT, 'firebase-admin-sdk.json'), 'utf8'),
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: STORAGE_BUCKET,
});
const db = admin.firestore();
const bucket = admin.storage().bucket();

// ─── Mapping familles → fichier source ─────────────────────────────────────

const IMAGE_MAP = {
  'MP-R18': { src: 'mini-pelle/r18_pro.webp',                  storagePath: 'products/MP-R18/main.webp', contentType: 'image/webp' },
  'MP-R22': { src: 'mini-pelle/r22_pro.webp',                  storagePath: 'products/MP-R22/main.webp', contentType: 'image/webp' },
  'MP-R32': { src: 'mini-pelle/r32_pro.webp',                  storagePath: 'products/MP-R32/main.webp', contentType: 'image/webp' },
  'MP-R57': { src: 'mini-pelle/r57_pro/r57_pro_main_view.png', storagePath: 'products/MP-R57/main.png',  contentType: 'image/png'  },
  'ACC-GC': { src: 'mini-pelle-accessories/ACC-GC-.jpeg',      storagePath: 'products/ACC-GC/main.jpeg', contentType: 'image/jpeg' },
  'ACC-GD': { src: 'mini-pelle-accessories/ACC-GD-.jpeg',      storagePath: 'products/ACC-GD/main.jpeg', contentType: 'image/jpeg' },
  'ACC-GI': { src: 'mini-pelle-accessories/ACC-GI-.webp',      storagePath: 'products/ACC-GI/main.webp', contentType: 'image/webp' },
  'ACC-GP': { src: 'mini-pelle-accessories/ACC-GP-.webp',      storagePath: 'products/ACC-GP/main.webp', contentType: 'image/webp' },
  'ACC-MH': { src: 'mini-pelle-accessories/ACC-MH-.jpeg',      storagePath: 'products/ACC-MH/main.jpeg', contentType: 'image/jpeg' },
  'ACC-TA': { src: 'mini-pelle-accessories/ACC-TA-.webp',      storagePath: 'products/ACC-TA/main.webp', contentType: 'image/webp' },
};

function familyOf(reference) {
  const m = reference.match(/^(MP-R\d+|ACC-[A-Z]{2})/);
  return m ? m[1] : null;
}

function publicUrl(storagePath, token) {
  const enc = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${enc}?alt=media&token=${token}`;
}

// ─── Phase 1 : Upload Storage ──────────────────────────────────────────────

console.log('═══ Upload images mini-pelles ═══');
console.log('Mode    :', APPLY ? '🔥 APPLY' : '🧪 DRY-RUN');
console.log('Source  :', SOURCE_ROOT);
console.log('Bucket  :', STORAGE_BUCKET);
console.log('');

const familyUrls = {};
const uploadStats = { ok: 0, missing: 0, errors: 0 };

for (const [family, info] of Object.entries(IMAGE_MAP)) {
  const localPath = path.join(SOURCE_ROOT, info.src);
  if (!existsSync(localPath)) {
    console.log(`❌ ${family.padEnd(8)} fichier introuvable : ${info.src}`);
    uploadStats.missing++;
    continue;
  }
  const size = statSync(localPath).size;
  console.log(`📁 ${family.padEnd(8)} ${info.src} (${(size / 1024).toFixed(1)} KB)`);

  if (!APPLY) {
    // Génération URL prévisionnelle (token sera fixé à l'apply)
    familyUrls[family] = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(info.storagePath)}?alt=media&token=<token>`;
    console.log(`   → ${info.storagePath} (DRY-RUN, pas uploadé)`);
    uploadStats.ok++;
    continue;
  }

  try {
    const token = randomUUID();
    await bucket.upload(localPath, {
      destination: info.storagePath,
      resumable: false,
      metadata: {
        contentType: info.contentType,
        cacheControl: 'public, max-age=31536000',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    const url = publicUrl(info.storagePath, token);
    familyUrls[family] = url;
    console.log(`   ✅ Uploadé → ${url.substring(0, 110)}…`);
    uploadStats.ok++;
  } catch (err) {
    console.error(`   ❌ Erreur upload ${family} :`, err.message);
    uploadStats.errors++;
  }
}

console.log('');
console.log(`Stats upload : ${uploadStats.ok} OK / ${uploadStats.missing} manquants / ${uploadStats.errors} erreurs`);
console.log('');

// ─── Phase 2 : Update Firestore image_principale ───────────────────────────

console.log('═══ Update Firestore image_principale ═══');
console.log('');

const productsSnap = await db.collection('products').get();
const writes = [];
const updateStats = { updated: 0, unchanged: 0, no_family: 0, no_url: 0 };

for (const doc of productsSnap.docs) {
  const ref = doc.id;
  const data = doc.data();
  const family = familyOf(ref);

  if (!family) {
    updateStats.no_family++;
    continue;
  }
  const url = familyUrls[family];
  if (!url) {
    updateStats.no_url++;
    continue;
  }

  // Skip si déjà à la bonne URL (sauf en DRY-RUN où on log)
  if (data.image_principale === url) {
    updateStats.unchanged++;
    continue;
  }

  writes.push({ ref, family, before: data.image_principale, after: url });
  updateStats.updated++;
  const beforeStr = data.image_principale ? String(data.image_principale).substring(0, 60) : '(vide)';
  console.log(`🔁 ${ref.padEnd(15)} ${family.padEnd(8)} ${beforeStr.padEnd(60)} → ${url.substring(0, 100)}…`);
}

console.log('');
console.log('═══ Bilan ═══');
console.log(`  Updated   : ${updateStats.updated}`);
console.log(`  Unchanged : ${updateStats.unchanged}`);
console.log(`  No family : ${updateStats.no_family}`);
console.log(`  No URL    : ${updateStats.no_url}`);
console.log('');

if (!APPLY) {
  console.log('🧪 DRY-RUN terminé. Ajouter --apply pour upload + update Firestore.');
  process.exit(0);
}

if (writes.length === 0) {
  console.log('Aucune mise à jour Firestore nécessaire.');
  process.exit(0);
}

// Backup avant écriture
mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `images-pre-update-${stamp}.json`);
writeFileSync(backupPath, JSON.stringify(writes.map(w => ({ ref: w.ref, before: w.before })), null, 2));
console.log(`💾 Backup : ${path.relative(ROOT, backupPath)}`);

console.log('🔥 Update Firestore en cours…');
const ts = admin.firestore.FieldValue.serverTimestamp();
let written = 0;
for (const w of writes) {
  try {
    await db.collection('products').doc(w.ref).set(
      { image_principale: w.after, updated_at: ts },
      { merge: true },
    );
    written++;
  } catch (err) {
    console.error(`❌ Erreur update ${w.ref} :`, err.message);
  }
}
console.log(`✅ ${written} produit(s) mis à jour.`);
process.exit(0);
