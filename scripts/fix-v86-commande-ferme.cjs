// scripts/fix-v86-commande-ferme.cjs
// Transition DVS-2605001 : solde_paye → commande_ferme
// Usage : node scripts/fix-v86-commande-ferme.cjs

const admin = require('firebase-admin');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)), projectId: PROJECT_ID });
const db = admin.firestore();

async function fix() {
  console.log('🔧 V86 — Transition DVS-2605001 → commande_ferme\n');

  const devisRef = db.collection('quotes').doc('DVS-2605001');
  const snap = await devisRef.get();

  if (!snap.exists) {
    console.error('❌ DVS-2605001 introuvable');
    process.exit(1);
  }

  const data = snap.data();
  console.log('Statut actuel :', data.statut);
  console.log('Total HT :', data.total_ht, '€');
  console.log('Total encaissé :', data.total_encaisse, '€');
  console.log('Commission :', data.commission_generated ? '✅ ' + data.commission_numero : '❌');
  console.log('Facture finale :', data.facture_finale ? '✅ ' + data.facture_finale.numero : '❌');

  if (data.statut === 'commande_ferme') {
    console.log('\n✅ Déjà en commande_ferme — rien à faire');
    process.exit(0);
  }

  await devisRef.update({
    statut: 'commande_ferme',
    date_commande: data.date_commande || new Date().toISOString(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('\n✅ DVS-2605001 → commande_ferme (avec date_commande)');
  process.exit(0);
}

fix().catch(err => { console.error('❌', err); process.exit(1); });
