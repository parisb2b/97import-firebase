// scripts/repair-97importcom.js
// Réparation ponctuelle du compte 97importcom@gmail.com après refonte Bug Auth.
// Usage : node scripts/repair-97importcom.js [password_optionnel]
//
// Étapes :
// 1. Set un password sur le compte Auth (compat Google OAuth gardée)
// 2. Update /users/{uid}.role = 'partner'
// 3. Crée /partners/{uid} avec ID = uid Firebase réel
// 4. Supprime l'ancien doc orphelin /partners/GFMaadQp0tbzuJ9vaBCx

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const serviceAccount = JSON.parse(
  readFileSync(new URL('../firebase-admin-sdk.json', import.meta.url), 'utf8'),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const UID = 'nU5Y91UwzdVLfgDDKavowkGF8I13';
const EMAIL = '97importcom@gmail.com';
const NEW_PASSWORD = process.argv[2] || '20262026';
const ANCIEN_DOC_ID = 'GFMaadQp0tbzuJ9vaBCx';
const PARTNER_CODE = 'IMP';

(async () => {
  console.log('═══ Réparation 97importcom@gmail.com ═══');
  console.log('');

  // 1. Récupérer ancien doc partner pour conserver les données
  const ancienSnap = await db.collection('partners').doc(ANCIEN_DOC_ID).get();
  const ancienData = ancienSnap.exists ? ancienSnap.data() : {};
  console.log('Ancien doc partner :', ancienSnap.exists ? 'trouvé' : 'absent');
  if (ancienSnap.exists) {
    console.log('  Data :', JSON.stringify(ancienData));
  }
  console.log('');

  // 2. Set password sur Auth
  try {
    await admin.auth().updateUser(UID, { password: NEW_PASSWORD });
    console.log(`✅ Password set : ${NEW_PASSWORD} (compat Google OAuth gardée)`);
  } catch (err) {
    console.log('⚠️ Erreur set password :', err.code, err.message);
  }
  console.log('');

  // 3. Update users role
  await db.collection('users').doc(UID).set({ role: 'partner' }, { merge: true });
  console.log(`✅ users/${UID}.role = partner`);
  console.log('');

  // 4. Créer /partners/{UID}
  await db.collection('partners').doc(UID).set({
    uid: UID,
    userId: UID,
    nom: ancienData.nom || '97import',
    email: EMAIL,
    code: ancienData.code || PARTNER_CODE,
    commission_taux: ancienData.commission_taux || 0,
    rib: ancienData.rib || {},
    actif: ancienData.actif !== undefined ? ancienData.actif : true,
    createdAt: ancienData.createdAt || new Date(),
  });
  console.log(`✅ partners/${UID} créé/mis à jour`);
  console.log('');

  // 5. Supprimer ancien doc orphelin
  if (ancienSnap.exists) {
    await db.collection('partners').doc(ANCIEN_DOC_ID).delete();
    console.log(`✅ Ancien doc /partners/${ANCIEN_DOC_ID} supprimé`);
  }
  console.log('');

  console.log('═══ Réparation terminée ═══');
  console.log('');
  console.log('Test de connexion :');
  console.log(`  - Email : ${EMAIL}`);
  console.log(`  - Password : ${NEW_PASSWORD}`);
  console.log('  - OU continuer avec Google');
  console.log('  - Doit atterrir sur /espace-partenaire');

  process.exit(0);
})().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
