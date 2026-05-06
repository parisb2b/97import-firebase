// scripts/reset-quotes-v135.cjs — V135
// Reset sécurisé des devis et mails pour repartir sur une base propre
// Nomenclature V133 : DV-YYMM-NNNN
//
// 3 MODES :
//   1. DRY-RUN (défaut) :
//      node scripts/reset-quotes-v135.cjs --dry-run
//
//   2. ARCHIVE-ONLY (sauvegarde JSON sans rien supprimer) :
//      node scripts/reset-quotes-v135.cjs --archive-only
//
//   3. EXECUTE (purge + reset counters) :
//      node scripts/reset-quotes-v135.cjs --execute --confirm-reset-v135

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════
const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');
const ARCHIVE_DIR = 'ARCHIVE-RESET-V135';
const ZIP_PATH = 'archive-reset-v135.zip';

// Collections à vider
const PURGE_COLLECTIONS = ['quotes', 'mail'];

// Collections à ne JAMAIS toucher
const KEEP_COLLECTIONS = [
  'users', 'clients', 'partners', 'products', 'categories',
  'ports', 'admin_params', 'tarifs_logistiques', 'counters'
];

// Compteurs à remettre à zéro (nomenclature V133)
const COUNTERS_TO_RESET = ['DV', 'FA', 'FAC', 'NC', 'FL', 'BL', 'DC', 'AI', 'AF', 'DVS'];

// ════════════════════════════════════════════════
// PARSE ARGS
// ════════════════════════════════════════════════
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run') || (!args.includes('--execute') && !args.includes('--archive-only'));
const ARCHIVE_ONLY = args.includes('--archive-only');
const EXECUTE = args.includes('--execute');
const CONFIRMED = args.includes('--confirm-reset-v135');

if (EXECUTE && !CONFIRMED) {
  console.error('❌ ABORT : --execute requiert --confirm-reset-v135');
  console.error('   Workflow recommandé :');
  console.error('   1. DRY-RUN  : node scripts/reset-quotes-v135.cjs --dry-run');
  console.error('   2. ARCHIVE  : node scripts/reset-quotes-v135.cjs --archive-only');
  console.error('   3. EXECUTE  : node scripts/reset-quotes-v135.cjs --execute --confirm-reset-v135');
  process.exit(1);
}

// ════════════════════════════════════════════════
// GARDE-FOU 1 : Service Account
// ════════════════════════════════════════════════
if (!fs.existsSync(SA_PATH)) {
  console.error(`❌ ABORT : ${SA_PATH} introuvable`);
  process.exit(1);
}

const serviceAccount = require(SA_PATH);
if (serviceAccount.project_id !== PROJECT_ID) {
  console.error(`❌ ABORT : project_id mismatch`);
  console.error(`   Attendu : ${PROJECT_ID}`);
  console.error(`   Trouvé  : ${serviceAccount.project_id}`);
  process.exit(1);
}

// ════════════════════════════════════════════════
// GARDE-FOU 2 : Whitelist KEEP vs PURGE
// ════════════════════════════════════════════════
const intersection = KEEP_COLLECTIONS.filter(c => PURGE_COLLECTIONS.includes(c));
if (intersection.length > 0) {
  console.error(`❌ ABORT : collections KEEP dans liste PURGE : ${intersection.join(', ')}`);
  process.exit(1);
}

// ════════════════════════════════════════════════
// INIT FIREBASE ADMIN
// ════════════════════════════════════════════════
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID
});
const db = admin.firestore();

const MODE_LABEL = DRY_RUN ? '🔍 DRY-RUN' : ARCHIVE_ONLY ? '📦 ARCHIVE-ONLY' : '⚠️  EXECUTE';
console.log('═══════════════════════════════════════════');
console.log(`  V135 RESET DEVIS — ${MODE_LABEL}`);
console.log(`  Cible : ${PROJECT_ID}`);
console.log('  Nomenclature : DV-YYMM-NNNN (V133)');
console.log('═══════════════════════════════════════════');

(async () => {
  // ════════════════════════════════════════════════
  // GARDE-FOU 3 : Vérifier users.size > 0
  // ════════════════════════════════════════════════
  const usersSnap = await db.collection('users').get();
  if (usersSnap.size === 0) {
    console.error(`❌ ABORT : users vide (${usersSnap.size} docs). Mauvais SA ou projet vide.`);
    process.exit(1);
  }
  console.log(`✅ users.size = ${usersSnap.size} (OK)`);

  // ════════════════════════════════════════════════
  // SCAN COLLECTIONS PURGE
  // ════════════════════════════════════════════════
  console.log('\n📊 SCAN collections PURGE :');
  const purgeStats = {};
  let totalDocs = 0;
  for (const coll of PURGE_COLLECTIONS) {
    const snap = await db.collection(coll).get();
    purgeStats[coll] = snap.size;
    totalDocs += snap.size;
    console.log(`   ${coll.padEnd(20)} : ${String(snap.size).padStart(5)} docs`);
  }
  console.log(`   ${'TOTAL'.padEnd(20)} : ${String(totalDocs).padStart(5)} docs`);

  // ════════════════════════════════════════════════
  // SCAN COLLECTIONS KEEP
  // ════════════════════════════════════════════════
  console.log('\n✅ SCAN collections KEEP (intactes) :');
  for (const coll of KEEP_COLLECTIONS) {
    const snap = await db.collection(coll).get();
    console.log(`   ${coll.padEnd(20)} : ${String(snap.size).padStart(5)} docs`);
  }

  // ════════════════════════════════════════════════
  // SCAN COUNTERS
  // ════════════════════════════════════════════════
  console.log('\n🔄 SCAN counters à resetter :');
  for (const code of COUNTERS_TO_RESET) {
    const docSnap = await db.collection('counters').doc(code).get();
    if (docSnap.exists) {
      console.log(`   ${code.padEnd(6)} : seq = ${docSnap.data().seq || docSnap.data().lastNumber || '?'}`);
    } else {
      console.log(`   ${code.padEnd(6)} : INEXISTANT`);
    }
  }

  // ════════════════════════════════════════════════
  // DRY-RUN : STOP ICI
  // ════════════════════════════════════════════════
  if (DRY_RUN) {
    console.log('\n═══════════════════════════════════════════');
    console.log('  🔍 DRY-RUN TERMINÉ — Aucune modification');
    console.log('═══════════════════════════════════════════');
    process.exit(0);
  }

  // ════════════════════════════════════════════════
  // ARCHIVE JSON
  // ════════════════════════════════════════════════
  console.log('\n📦 ÉTAPE 1 : Création archive JSON...');
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR);
  }

  for (const coll of PURGE_COLLECTIONS) {
    const snap = await db.collection(coll).get();
    if (snap.size === 0) {
      console.log(`   ${coll.padEnd(20)} : VIDE (skip)`);
      continue;
    }
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const filePath = path.join(ARCHIVE_DIR, `${coll}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`   ${coll.padEnd(20)} : ${snap.size} docs → ${filePath}`);
  }

  // ════════════════════════════════════════════════
  // ZIP + SHA256 (cross-platform : Node.js zlib + tar ou PowerShell)
  // ════════════════════════════════════════════════
  console.log('\n📦 ÉTAPE 2 : Création archive ZIP...');
  if (fs.existsSync(ZIP_PATH)) {
    fs.unlinkSync(ZIP_PATH);
  }

  try {
    // Windows : utiliser PowerShell Compress-Archive
    if (process.platform === 'win32') {
      const absArchiveDir = path.resolve(ARCHIVE_DIR);
      const absZipPath = path.resolve(ZIP_PATH);
      execSync(`powershell -Command "Compress-Archive -Path '${absArchiveDir}' -DestinationPath '${absZipPath}' -Force"`, { stdio: 'pipe' });
    } else {
      execSync(`zip -r ${ZIP_PATH} ${ARCHIVE_DIR}/`, { stdio: 'pipe' });
    }
  } catch (zipErr) {
    // Fallback : juste copier le dossier avec un .zip manuel (pas idéal mais l'archive JSON est déjà là)
    console.warn('   ⚠️  Compression échouée, archive JSON conservée dans', ARCHIVE_DIR);
    console.warn('   ⚠️  Erreur:', zipErr.message);
  }

  let sha256 = 'non-calculé';
  let zipSize = 0;
  if (fs.existsSync(ZIP_PATH)) {
    const zipBuffer = fs.readFileSync(ZIP_PATH);
    sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');
    fs.writeFileSync(`${ZIP_PATH}.sha256`, `${sha256}  ${ZIP_PATH}\n`);
    zipSize = fs.statSync(ZIP_PATH).size;
    console.log(`   ZIP   : ${ZIP_PATH} (${(zipSize/1024).toFixed(1)} KB)`);
    console.log(`   SHA256: ${sha256}`);
  }

  // ════════════════════════════════════════════════
  // ARCHIVE-ONLY : STOP ICI
  // ════════════════════════════════════════════════
  if (ARCHIVE_ONLY) {
    console.log('\n═══════════════════════════════════════════');
    console.log('  📦 ARCHIVE-ONLY TERMINÉ — Aucune suppression');
    console.log('═══════════════════════════════════════════');
    process.exit(0);
  }

  // ════════════════════════════════════════════════
  // EXECUTE : DELETE
  // ════════════════════════════════════════════════
  console.log('\n🗑️  ÉTAPE 3 : Suppression par batch...');
  for (const coll of PURGE_COLLECTIONS) {
    const snap = await db.collection(coll).get();
    if (snap.size === 0) {
      console.log(`   ${coll.padEnd(20)} : déjà vide (skip)`);
      continue;
    }

    let deleted = 0;
    const docs = snap.docs;
    while (deleted < docs.length) {
      const batch = db.batch();
      const slice = docs.slice(deleted, deleted + 500);
      slice.forEach(d => batch.delete(d.ref));
      await batch.commit();
      deleted += slice.length;
    }
    console.log(`   ${coll.padEnd(20)} : ${deleted} docs supprimés`);
  }

  // ════════════════════════════════════════════════
  // RESET COUNTERS
  // ════════════════════════════════════════════════
  console.log('\n🔄 ÉTAPE 4 : Reset compteurs...');
  for (const code of COUNTERS_TO_RESET) {
    await db.collection('counters').doc(code).set({
      seq: 0,
      lastNumber: 0,
      reset_at: admin.firestore.FieldValue.serverTimestamp(),
      reset_reason: 'V135 Reset — Nomenclature DV-YYMM-NNNN',
      archive_reference: ZIP_PATH,
      archive_sha256: sha256
    }, { merge: true });
    console.log(`   ${code.padEnd(6)} : seq = 0 ✅`);
  }

  // ════════════════════════════════════════════════
  // RAPPORT
  // ════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ V135 RESET TERMINÉ AVEC SUCCÈS');
  console.log(`  Archive : ${ZIP_PATH}`);
  console.log(`  SHA256  : ${sha256}`);
  console.log('  Prêt pour tests avec nomenclature V133');
  console.log('═══════════════════════════════════════════');

  process.exit(0);
})();
