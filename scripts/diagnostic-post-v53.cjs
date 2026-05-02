// Diagnostic des compteurs et collections post Clean Start V53
// Usage : node scripts/diagnostic-post-v53.cjs
// V62BIS — Read-only, aucune ecriture.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');

if (!fs.existsSync(SA_PATH)) {
  console.error('❌ ABORT : firebase-admin-sdk.json introuvable.');
  process.exit(1);
}

const serviceAccount = require(SA_PATH);
if (serviceAccount.project_id !== PROJECT_ID) {
  console.error(`❌ ABORT : project_id='${serviceAccount.project_id}', attendu '${PROJECT_ID}'.`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT_ID });
const db = admin.firestore();

async function diagnostic() {
  console.log('═══════════════════════════════════════════');
  console.log('  🔍 DIAGNOSTIC POST-V53');
  console.log(`  Projet : ${PROJECT_ID}`);
  console.log(`  Date   : ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  // 1. Compteurs documentaires
  console.log('\n📊 COMPTEURS DOCUMENTAIRES :');
  const counters = ['DVS', 'FA', 'FF', 'FL', 'FM', 'NC', 'BL', 'CTN', 'LA', 'SAV'];
  for (const code of counters) {
    const snap = await db.collection('counters').doc(code).get();
    if (snap.exists) {
      const data = snap.data();
      console.log(`   ${code.padEnd(5)} : seq=${String(data.seq).padStart(5)} | reset=${data.reset_reason || 'N/A'}`);
    } else {
      console.log(`   ${code.padEnd(5)} : ❌ INEXISTANT`);
    }
  }

  // 2. Collections documentaires
  console.log('\n📊 COLLECTIONS DOCUMENTAIRES :');
  const docCollections = ['quotes', 'commissions', 'factures', 'invoices', 'logistics_invoices',
    'conteneurs', 'notes_commission', 'listes_achat', 'sav'];
  for (const coll of docCollections) {
    try {
      const countSnap = await db.collection(coll).count().get();
      console.log(`   ${coll.padEnd(20)} : ${String(countSnap.data().count).padStart(5)} docs`);
    } catch (e) {
      console.log(`   ${coll.padEnd(20)} : ❌ ${e.message}`);
    }
  }

  // 3. admin_params
  console.log('\n📊 PARAMETRES ADMIN :');
  const adminSnap = await db.collection('admin_params').get();
  adminSnap.forEach(doc => {
    const d = doc.data();
    console.log(`   ${doc.id.padEnd(25)} : ${JSON.stringify(d).slice(0, 120)}`);
  });

  // 4. Logs recents
  console.log('\n📊 LOGS RECENTS (20 derniers) :');
  const logsSnap = await db.collection('logs').orderBy('createdAt', 'desc').limit(20).get();
  if (logsSnap.empty) {
    console.log('   Aucun log');
  } else {
    logsSnap.forEach(doc => {
      const d = doc.data();
      console.log(`   [${d.type || '?'}] ${(d.message || '').slice(0, 80)}`);
    });
  }

  // 5. Partenaires
  console.log('\n📊 PARTENAIRES :');
  const pSnap = await db.collection('partners').get();
  pSnap.forEach(doc => {
    const d = doc.data();
    console.log(`   ${doc.id.padEnd(28)} : code=${d.code || '?'} | nom=${d.nom || '?'} | actif=${d.actif}`);
  });

  // 6. Clients
  console.log('\n📊 CLIENTS (10 premiers) :');
  const cSnap = await db.collection('clients').limit(10).get();
  cSnap.forEach(doc => {
    const d = doc.data();
    console.log(`   ${doc.id.padEnd(28)} : ${d.nom || d.email || '?'} | pays=${d.pays || '?'}`);
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ DIAGNOSTIC TERMINE');
  console.log('═══════════════════════════════════════════');
  process.exit(0);
}

diagnostic().catch(err => { console.error('❌', err); process.exit(1); });
