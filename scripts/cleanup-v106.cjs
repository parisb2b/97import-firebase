// scripts/cleanup-v106.cjs
// Reset complet V106 — preparation nouveaux modeles PDF V2
// Usage : node scripts/cleanup-v106.cjs --execute --confirm-cleanup-v106
// Sans arguments = dry-run (lecture seule)

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');

const args = new Set(process.argv.slice(2));
const EXECUTE = args.has('--execute');
const CONFIRM = args.has('--confirm-cleanup-v106');

if (!EXECUTE || !CONFIRM) {
  console.log('🔍 DRY-RUN : aucune donnee ne sera modifiee.');
  console.log('   Pour executer : node scripts/cleanup-v106.cjs --execute --confirm-cleanup-v106\n');
}

if (!fs.existsSync(SA_PATH)) {
  console.error('❌ firebase-admin-sdk.json introuvable');
  process.exit(1);
}

const sa = require(SA_PATH);
if (sa.project_id !== PROJECT_ID) {
  console.error(`❌ Project ID mismatch: ${sa.project_id} (attendu: ${PROJECT_ID})`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID });
const db = admin.firestore();

async function cleanup() {
  console.log('🧹 Nettoyage V106 — Reset complet documents\n');
  const stats = { counters: 0, quotes: 0, factures: 0, commissions: 0, commandes: 0 };

  // ─── 1. RESET TOUS LES COUNTERS ─────────────────────────────
  console.log('📊 COUNTERS :');
  const countersSnap = await db.collection('counters').get();
  for (const docSnap of countersSnap.docs) {
    const id = docSnap.id;
    const data = docSnap.data();
    const currentVal = data.valeur ?? data.value ?? data.seq ?? data.val ?? '?';
    console.log(`   counters/${id}: current = ${currentVal} → 0`);
    if (EXECUTE && CONFIRM) {
      await db.collection('counters').doc(id).set({
        valeur: 0, value: 0, seq: 0,
        reset_reason: 'V106 reset complet PDF V2',
        reset_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      stats.counters++;
    }
  }
  const cmode = EXECUTE && CONFIRM ? '✅ Reset' : '[DRY-RUN]';
  const ccount = EXECUTE && CONFIRM ? stats.counters : countersSnap.size;
  console.log(`   ➡ ${cmode} ${ccount} compteurs\n`);

  // ─── 2. DELETE QUOTES + ACOMPTES (subcollection) ────────────
  console.log('📋 QUOTES + ACOMPTES :');
  const quotesSnap = await db.collection('quotes').get();
  console.log(`   ${quotesSnap.size} devis trouves`);
  let qCount = 0;
  for (const docSnap of quotesSnap.docs) {
    const data = docSnap.data();
    console.log(`     ${docSnap.id} | ${data.numero || 'N/A'} | ${data.statut || '?'} | ${(data.client_nom || '?').substring(0,25)}`);
    if (EXECUTE && CONFIRM) {
      const acomptesSnap = await db.collection('quotes').doc(docSnap.id).collection('acomptes').get();
      for (const a of acomptesSnap.docs) {
        await db.collection('quotes').doc(docSnap.id).collection('acomptes').doc(a.id).delete();
      }
      await db.collection('quotes').doc(docSnap.id).delete();
      qCount++;
      if (qCount % 5 === 0) console.log(`   ... ${qCount}/${quotesSnap.size} supprimes`);
    }
  }
  stats.quotes = EXECUTE && CONFIRM ? qCount : 0;
  const qmode = EXECUTE && CONFIRM ? '✅ Supprime' : '[DRY-RUN]';
  const qdisplay = EXECUTE && CONFIRM ? stats.quotes : quotesSnap.size;
  console.log(`   ➡ ${qmode} ${qdisplay} devis\n`);

  // ─── 3. DELETE FACTURES ─────────────────────────────────────
  console.log('🧾 FACTURES :');
  const facturesSnap = await db.collection('factures').get();
  console.log(`   ${facturesSnap.size} factures trouves`);
  let fCount = 0;
  for (const docSnap of facturesSnap.docs) {
    const data = docSnap.data();
    console.log(`     ${docSnap.id} | ${data.numero || 'N/A'}`);
    if (EXECUTE && CONFIRM) { await db.collection('factures').doc(docSnap.id).delete(); fCount++; }
  }
  stats.factures = EXECUTE && CONFIRM ? fCount : 0;
  const fmode = EXECUTE && CONFIRM ? '✅ Supprime' : '[DRY-RUN]';
  const fdisplay = EXECUTE && CONFIRM ? stats.factures : facturesSnap.size;
  console.log(`   ➡ ${fmode} ${fdisplay} factures\n`);

  // ─── 4. DELETE COMMISSIONS ──────────────────────────────────
  console.log('💶 COMMISSIONS :');
  const commSnap = await db.collection('commissions').get();
  console.log(`   ${commSnap.size} commissions trouves`);
  let cCount = 0;
  for (const docSnap of commSnap.docs) {
    const data = docSnap.data();
    console.log(`     ${docSnap.id} | ${data.devis_numero || data.numero || 'N/A'} | ${data.total_commission || 0}€`);
    if (EXECUTE && CONFIRM) { await db.collection('commissions').doc(docSnap.id).delete(); cCount++; }
  }
  stats.commissions = EXECUTE && CONFIRM ? cCount : 0;
  const commMode = EXECUTE && CONFIRM ? '✅ Supprime' : '[DRY-RUN]';
  const commDisplay = EXECUTE && CONFIRM ? stats.commissions : commSnap.size;
  console.log(`   ➡ ${commMode} ${commDisplay} commissions\n`);

  // ─── 5. NOTES_COMMISSION ────────────────────────────────────
  console.log('📝 NOTES_COMMISSION :');
  const notesSnap = await db.collection('notes_commission').get();
  console.log(`   ${notesSnap.size} notes trouves`);
  let nCount = 0;
  for (const docSnap of notesSnap.docs) {
    console.log(`     ${docSnap.id}`);
    if (EXECUTE && CONFIRM) { await db.collection('notes_commission').doc(docSnap.id).delete(); nCount++; }
  }
  const nmode = EXECUTE && CONFIRM ? '✅ Supprime' : '[DRY-RUN]';
  const ndisplay = EXECUTE && CONFIRM ? nCount : notesSnap.size;
  console.log(`   ➡ ${nmode} ${ndisplay} notes\n`);

  // ─── 6. COMMANDES / BONS_COMMANDE ───────────────────────────
  console.log('📦 COMMANDES / BONS_COMMANDE :');
  let cmdCount = 0;
  for (const col of ['commandes', 'bons_commande']) {
    const snap = await db.collection(col).get();
    console.log(`   ${col}: ${snap.size} docs`);
    for (const docSnap of snap.docs) {
      console.log(`     ${docSnap.id}`);
      if (EXECUTE && CONFIRM) { await db.collection(col).doc(docSnap.id).delete(); cmdCount++; }
    }
  }
  stats.commandes = EXECUTE && CONFIRM ? cmdCount : 0;

  // ─── 7. VERIFICATION — Collections protegees ────────────────
  console.log('\n🛡️  COLLECTIONS PROTEGEES (verification) :');
  const protectedCols = ['users', 'clients', 'partners', 'produits', 'products', 'admin_params', 'tarifs_logistiques', 'categories', 'ports'];
  for (const col of protectedCols) {
    const snap = await db.collection(col).get();
    console.log(`   ${col}: ${snap.size} documents (CONSERVES)`);
  }

  // ─── 8. RECAP ───────────────────────────────────────────────
  const mode = EXECUTE && CONFIRM ? 'EXECUTION' : 'DRY-RUN';
  console.log(`\n════════════════════════════════════════════════`);
  console.log(`  📊 RAPPORT ${mode}`);
  console.log(`════════════════════════════════════════════════`);
  console.log(`  Counters reset      : ${stats.counters}`);
  console.log(`  Quotes supprimes    : ${stats.quotes}`);
  console.log(`  Factures supprimes  : ${stats.factures}`);
  console.log(`  Commissions suppr   : ${stats.commissions}`);
  console.log(`  Commandes suppr     : ${stats.commandes}`);
  console.log('');

  if (!EXECUTE || !CONFIRM) {
    console.log('💡 Pour executer reellement :');
    console.log('   node scripts/cleanup-v106.cjs --execute --confirm-cleanup-v106');
  } else {
    console.log('✅ Nettoyage V106 termine avec succes');
  }
  console.log('════════════════════════════════════════════════');

  process.exit(0);
}

cleanup().catch(err => { console.error('❌', err); process.exit(1); });
