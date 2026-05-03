// scripts/set-partner-claims-v81.cjs — V81
// Attribution des custom claims Firebase Auth pour les 3 comptes test.
// Le partenaire recoit role + partenaire_code (necessaire aux regles Firestore).

const admin = require('firebase-admin');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');

const serviceAccount = require(SA_PATH);
if (serviceAccount.project_id !== PROJECT_ID) {
  console.error('ABORT : project_id mismatch');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

async function setClaims() {
  console.log('CONFIGURATION des custom claims...\n');

  const db = admin.firestore();

  // 1. Partenaire — chercher son code dans /partners
  let partnerCode = 'JM'; // fallback
  try {
    const partnersSnap = await db.collection('partners')
      .where('email', '==', '97importcom@gmail.com')
      .limit(1)
      .get();
    if (!partnersSnap.empty) {
      partnerCode = partnersSnap.docs[0].data().code || partnerCode;
      console.log('Code partenaire trouve dans Firestore : ' + partnerCode);
    } else {
      console.log('Partenaire non trouve dans /partners, fallback code : ' + partnerCode);
    }
  } catch (err) {
    console.log('Erreur lecture /partners, fallback code : ' + partnerCode + ' (' + err.message + ')');
  }

  try {
    const partner = await admin.auth().getUserByEmail('97importcom@gmail.com');
    await admin.auth().setCustomUserClaims(partner.uid, {
      role: 'partner',
      partenaire_code: partnerCode,
    });
    console.log('✅ 97importcom@gmail.com → role: partner, partenaire_code: ' + partnerCode);
  } catch (err) {
    console.error('❌ Partenaire : ' + err.message);
  }

  // 2. Admin
  try {
    const adminUser = await admin.auth().getUserByEmail('parisb2b@gmail.com');
    await admin.auth().setCustomUserClaims(adminUser.uid, { role: 'admin' });
    console.log('✅ parisb2b@gmail.com → role: admin');
  } catch (err) {
    console.error('❌ Admin : ' + err.message);
  }

  // 3. Client
  try {
    const client = await admin.auth().getUserByEmail('mc@sasfr.com');
    await admin.auth().setCustomUserClaims(client.uid, { role: 'client' });
    console.log('✅ mc@sasfr.com → role: client');
  } catch (err) {
    console.error('❌ Client : ' + err.message);
  }

  console.log('\n⚠️  IMPORTANT : Les utilisateurs doivent se DECONNECTER puis RECONNECTER');
  console.log('   pour que leurs nouveaux tokens contiennent les custom claims.');
  console.log('   Forcer un refresh token : getIdTokenResult(true) cote client.');

  process.exit(0);
}

setClaims().catch(function (err) { console.error(err); process.exit(1); });
