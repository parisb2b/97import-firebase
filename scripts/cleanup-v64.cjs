// Nettoyage post-tests V64 — reset compteurs a 0
// Usage : node scripts/cleanup-v64.cjs --execute --confirm-cleanup-v64
// V64 — dry-run par defaut

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');

const args = new Set(process.argv.slice(2));
const EXECUTE = args.has('--execute');
const CONFIRM = args.has('--confirm-cleanup-v64');

if (!EXECUTE || !CONFIRM) {
  console.log('🔍 DRY-RUN : aucun compteur ni document ne sera modifie.');
  console.log('   Pour executer : node scripts/cleanup-v64.cjs --execute --confirm-cleanup-v64');
}

if (!fs.existsSync(SA_PATH)) {
  console.error('❌ firebase-admin-sdk.json introuvable');
  process.exit(1);
}

const sa = require(SA_PATH);
if (sa.project_id !== PROJECT_ID) {
  console.error(`❌ Project ID mismatch: ${sa.project_id}`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID });
const db = admin.firestore();

const COUNTERS = ['DVS', 'FA', 'FF', 'FL', 'FM', 'NC', 'BL', 'CTN', 'LA', 'SAV'];

async function cleanup() {
  console.log('🧹 Nettoyage post-V64...\n');

  // Reset compteurs a 0
  console.log('Compteurs :');
  for (const code of COUNTERS) {
    const snap = await db.collection('counters').doc(code).get();
    const currentSeq = snap.exists ? snap.data().seq : 'N/A';
    console.log(`   ${code}: seq actuel = ${currentSeq}`);

    if (EXECUTE && CONFIRM) {
      await db.collection('counters').doc(code).set({
        seq: 0,
        reset_reason: 'V64 cleanup post-tests',
        reset_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  // Lister les devis de test (crees pendant V64)
  console.log('\nDevis presents :');
  const qSnap = await db.collection('quotes').orderBy('createdAt', 'desc').limit(10).get();
  qSnap.forEach(d => {
    const data = d.data();
    console.log(`   ${d.id.substring(0,10)} | ${data.numero} | ${data.statut} | ${data.client_nom}`);
  });

  console.log(`\n✅ Nettoyage ${EXECUTE && CONFIRM ? 'execute' : 'dry-run'} termine`);
  process.exit(0);
}

cleanup().catch(err => { console.error('❌', err); process.exit(1); });
