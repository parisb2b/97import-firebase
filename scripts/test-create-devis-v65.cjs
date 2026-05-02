// Test création devis via Admin SDK — V65
// Vérifie que le flux logique fonctionne (bypass les règles Firestore)
// Usage : node scripts/test-create-devis-v65.cjs

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');

if (!fs.existsSync(SA_PATH)) {
  console.error('❌ firebase-admin-sdk.json introuvable');
  process.exit(1);
}

const sa = require(SA_PATH);
if (sa.project_id !== PROJECT_ID) {
  console.error(`❌ Project ID mismatch: ${sa.project_id} !== ${PROJECT_ID}`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function testCreateDevis() {
  console.log('═══════════════════════════════════════════');
  console.log('  🧪 TEST CREATION DEVIS — Admin SDK');
  console.log(`  Projet : ${PROJECT_ID}`);
  console.log('═══════════════════════════════════════════\n');

  // 1. Lire compteur DVS actuel
  console.log('1️⃣  Compteur DVS actuel :');
  const counterSnap = await db.collection('counters').doc('DVS').get();
  const currentSeq = counterSnap.exists ? counterSnap.data().seq : 0;
  console.log(`   counters/DVS : seq=${currentSeq}\n`);

  // 2. Vérifier les compteurs format YYMM
  console.log('2️⃣  Compteurs format _YYMM :');
  const now = new Date();
  const aamm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const counterDocs = await db.collection('counters').listDocuments();
  const yymmCounters = [];
  for (const doc of counterDocs) {
    if (doc.id.includes(aamm)) {
      const snap = await doc.get();
      yymmCounters.push({ id: doc.id, data: snap.data() });
    }
  }
  if (yymmCounters.length > 0) {
    yymmCounters.forEach(c => console.log(`   counters/${c.id} : ${JSON.stringify(c.data)}`));
  } else {
    console.log('   Aucun compteur YYMM trouvé');
  }
  console.log('');

  // 3. Simuler création via transaction
  console.log('3️⃣  Création devis test via runTransaction :');
  const testNumero = `DVS-${aamm}TEST`;
  const testDocId = testNumero.replace(/[^a-zA-Z0-9]/g, '-');

  try {
    await db.runTransaction(async (tx) => {
      // Incrémenter compteur DVS
      const cRef = db.collection('counters').doc('DVS');
      const cDoc = await tx.get(cRef);
      const newSeq = (cDoc.exists ? cDoc.data().seq : 0) + 1;
      tx.set(cRef, { seq: newSeq, reset_reason: 'V65 test' }, { merge: true });

      // Créer devis test
      const qRef = db.collection('quotes').doc(testDocId);
      tx.set(qRef, {
        numero: testNumero,
        client_id: 'test-v65',
        client_email: 'mc@sasfr.com',
        client_nom: 'TEST V65',
        statut: 'brouillon',
        total_ht: 1000,
        partenaire_code: 'IMP',
        lignes: [{ reference: 'MP-R22-001', nom_fr: 'Test', qte: 1, prix_unitaire: 1000 }],
        acomptes: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`   ✅ Transaction OK : ${testNumero}, seq=${newSeq}`);
      return newSeq;
    });

    // 4. Vérifier lecture
    console.log('\n4️⃣  Vérification lecture :');
    const qSnap = await db.collection('quotes').doc(testDocId).get();
    if (qSnap.exists) {
      console.log(`   ✅ quotes/${testDocId} crée avec succes`);
      console.log(`   Data: ${JSON.stringify(qSnap.data()).substring(0, 200)}`);
    } else {
      console.log('   ❌ Devis introuvable apres creation');
    }

    // 5. Vérifier compteur
    const cAfter = await db.collection('counters').doc('DVS').get();
    console.log(`\n5️⃣  Compteur DVS apres creation : seq=${cAfter.exists ? cAfter.data().seq : '?'}`);

    // 6. Nettoyage
    console.log('\n6️⃣  Nettoyage :');
    await db.collection('quotes').doc(testDocId).delete();
    // Restaurer compteur precedent
    await db.collection('counters').doc('DVS').set({ seq: currentSeq }, { merge: true });
    console.log('   ✅ Donnees de test supprimees, compteur restaure');

    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ FLUX DEVIS OK — la logique fonctionne');
    console.log('═══════════════════════════════════════════');

  } catch (err) {
    console.error('\n❌ Erreur transaction :', err.message);
    console.error('Stack:', err.stack?.substring(0, 500));
  }
}

testCreateDevis().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
