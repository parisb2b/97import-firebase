// scripts/diagnostic-claims-v81.cjs — V81
// Diagnostic des custom claims Firebase Auth pour les 3 comptes test.

const admin = require('firebase-admin');
const path = require('path');

const PROJECT_ID = 'importok-6ef77';
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');

const serviceAccount = require(SA_PATH);
if (serviceAccount.project_id !== PROJECT_ID) {
  console.error('ABORT : project_id mismatch — attendu ' + PROJECT_ID + ', recu ' + serviceAccount.project_id);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

async function diagnostic() {
  console.log('═══════════════════════════════════════════');
  console.log('  DIAGNOSTIC CUSTOM CLAIMS');
  console.log('  Projet : ' + PROJECT_ID);
  console.log('═══════════════════════════════════════════\n');

  const comptes = [
    { email: '97importcom@gmail.com', role: 'partner' },
    { email: 'parisb2b@gmail.com', role: 'admin' },
    { email: 'mc@sasfr.com', role: 'client' },
  ];

  for (const compte of comptes) {
    try {
      const user = await admin.auth().getUserByEmail(compte.email);
      const claims = user.customClaims || {};
      const hasRole = claims.role === compte.role;
      const hasPartenaireCode = claims.partenaire_code;

      console.log((hasRole ? '✅' : '❌') + ' ' + compte.email);
      console.log('   UID              : ' + user.uid);
      console.log('   Custom Claims    : ' + JSON.stringify(claims));
      console.log('   Role attendu     : ' + compte.role);
      if (compte.role === 'partner') {
        console.log('   Partenaire code  : ' + (hasPartenaireCode || 'MANQUANT'));
      }
      console.log('   Statut           : ' + (hasRole ? 'OK' : 'MANQUANT — correction necessaire') + '\n');
    } catch (err) {
      console.log('❌ ' + compte.email + ' — ERREUR: ' + err.message + '\n');
    }
  }

  process.exit(0);
}

diagnostic().catch(function (err) { console.error(err); process.exit(1); });
