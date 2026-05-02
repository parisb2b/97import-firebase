// Nettoyage des donnees de test apres execution E2E
// Usage : node tests/scripts/cleanup-test-data.cjs --execute --confirm-cleanup
// V62 — Read-only par defaut (dry-run)

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', '..', 'firebase-admin-sdk.json');

const args = new Set(process.argv.slice(2));
const EXECUTE = args.has('--execute');
const CONFIRM = args.has('--confirm-cleanup');

if (!EXECUTE || !CONFIRM) {
  console.log('🔍 DRY-RUN : aucun document ne sera supprime.');
  console.log('   Pour executer : node tests/scripts/cleanup-test-data.cjs --execute --confirm-cleanup');
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

const TEST_COLLECTIONS = ['quotes', 'clients', 'sav'];

async function cleanup() {
  for (const coll of TEST_COLLECTIONS) {
    const snap = await db.collection(coll)
      .where('email', '>=', 'test-')
      .where('email', '<=', 'test-')
      .get();

    if (snap.empty) {
      console.log(`   ${coll}: aucun doc test trouve`);
      continue;
    }

    console.log(`   ${coll}: ${snap.size} docs test trouves`);
    if (EXECUTE && CONFIRM) {
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`   ${coll}: ${snap.size} docs supprimes`);
    }
  }
  console.log('✅ Nettoyage termine');
  process.exit(0);
}

cleanup().catch(err => { console.error('❌', err); process.exit(1); });
