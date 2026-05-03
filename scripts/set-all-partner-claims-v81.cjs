// scripts/set-all-partner-claims-v81.cjs — V81-FINAL
// Attribue role:partner a TOUS les partenaires Firestore + comptes connus.

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

async function setAllPartnerClaims() {
  const db = admin.firestore();

  // 1. Tous les partenaires depuis Firestore
  console.log('─'.repeat(50));
  console.log('1. Partenaires depuis Firestore /partners');
  console.log('─'.repeat(50));
  const partnersSnap = await db.collection('partners').get();

  for (const docSnap of partnersSnap.docs) {
    const partner = docSnap.data();
    const email = partner.email;

    if (!email) {
      console.log('⚠️  ' + docSnap.id + ' — pas d\'email, skip');
      continue;
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, {
        role: 'partner',
        partenaire_code: partner.code || '',
      });
      console.log('✅ ' + email + ' → role: partner, code: ' + (partner.code || 'N/A'));
    } catch (err) {
      console.log('❌ ' + email + ' — ' + err.message);
    }
  }

  // 2. Comptes connus (verification forcee)
  console.log('\n' + '─'.repeat(50));
  console.log('2. Verification comptes connus');
  console.log('─'.repeat(50));

  const knownAccounts = [
    { email: '97importcom@gmail.com', role: 'partner', code: 'IMP' },
    { email: 'parisb2b@gmail.com', role: 'admin', code: null },
    { email: 'mc@sasfr.com', role: 'client', code: null },
  ];

  for (const acct of knownAccounts) {
    try {
      const user = await admin.auth().getUserByEmail(acct.email);
      const claims = { role: acct.role };
      if (acct.code) claims.partenaire_code = acct.code;
      await admin.auth().setCustomUserClaims(user.uid, claims);
      console.log('✅ ' + acct.email + ' → ' + JSON.stringify(claims));
    } catch (err) {
      console.log('❌ ' + acct.email + ' — ' + err.message);
    }
  }

  console.log('\n✅ Custom claims configurees pour tous les partenaires.');
  console.log('⚠️  Les utilisateurs doivent se DECONNECTER puis RECONNECTER.');
  process.exit(0);
}

setAllPartnerClaims().catch(function (err) { console.error(err); process.exit(1); });
