// scripts/set-admin-role.cjs — V49 Checkpoint B
// Set custom claim role: 'admin' (ou partner/client) sur un user Firebase Auth.
// Pas de Cloud Functions infra → script Node Admin SDK direct exécuté en local.
//
// Usage :
//   node scripts/set-admin-role.cjs <email> [role] [partenaire_code]
//
// Args :
//   email             Email Firebase Auth (obligatoire)
//   role              'admin' (defaut) | 'partner' | 'client'
//   partenaire_code   Code partenaire (string), requis si role='partner'
//
// Pré-requis :
//   - firebase-admin-sdk.json a la racine du repo (gitignored)
//   - npm install firebase-admin (deja en dependencies)
//
// Exemples :
//   node scripts/set-admin-role.cjs parisb2b@gmail.com
//   node scripts/set-admin-role.cjs parisb2b@gmail.com admin
//   node scripts/set-admin-role.cjs partner@x.com partner CODEPARTNER42
//   node scripts/set-admin-role.cjs client@x.com client
//
// IMPORTANT : le user doit RE-LOGIN (ou attendre rafraichissement token ~1h)
// pour que les custom claims soient appliques cote front.

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');
if (!fs.existsSync(SA_PATH)) {
  console.error('❌ firebase-admin-sdk.json introuvable a', SA_PATH);
  console.error('   Telecharger depuis Firebase Console > Settings > Service accounts.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });

const [, , emailArg, roleArg, partenaireArg] = process.argv;

if (!emailArg) {
  console.error('Usage : node scripts/set-admin-role.cjs <email> [role] [partenaire_code]');
  process.exit(1);
}

const role = roleArg || 'admin';
if (!['admin', 'partner', 'client'].includes(role)) {
  console.error('❌ Role invalide :', role, '(doit etre admin | partner | client)');
  process.exit(1);
}

const claims = { role };
if (role === 'partner') {
  if (!partenaireArg) {
    console.error('❌ partenaire_code requis pour role=partner');
    console.error('   Exemple : node scripts/set-admin-role.cjs partner@x.com partner CODEPARTNER42');
    process.exit(1);
  }
  claims.partenaire_code = partenaireArg;
}

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(emailArg);
    await admin.auth().setCustomUserClaims(user.uid, claims);
    console.log(`✅ Custom claims definis pour ${emailArg} :`);
    console.log(`   uid    : ${user.uid}`);
    console.log(`   claims : ${JSON.stringify(claims)}`);
    console.log('');
    console.log('⚠️  Le user doit RE-LOGIN (ou attendre ~1h pour rafraichissement token)');
    console.log('   pour que les custom claims soient appliques cote front.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Echec :', err.message);
    if (err.code === 'auth/user-not-found') {
      console.error('   Email introuvable dans Firebase Auth. Verifier que le user existe.');
    }
    process.exit(1);
  }
})();
