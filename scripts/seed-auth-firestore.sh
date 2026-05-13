#!/bin/bash
export LANG=C.UTF-8
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9100"
export FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"

echo "🔐 Injection des comptes critiques..."

node -e "
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'importok-6ef77' });
const auth = admin.auth();
const db = admin.firestore();

async function seed() {
  const users = [
    { uid: 'admin', email: 'parisb2b@gmail.com', password: '20262026', role: 'admin' },
    { uid: 'client', email: 'mc@sasfr.com', password: '20262026', role: 'client' }
  ];

  for (const u of users) {
    try {
      await auth.getUser(u.uid);
      console.log('  Auth: ' + u.email + ' (existe)');
    } catch(e) {
      await auth.createUser({ uid: u.uid, email: u.email, password: u.password });
      console.log('  Auth: ' + u.email + ' (créé)');
    }
    await auth.setCustomUserClaims(u.uid, { role: u.role });
    await db.collection('users').doc(u.uid).set({
      email: u.email, role: u.role, status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('  Firestore: users/' + u.uid + ' → role=' + u.role);
  }

  console.log('✅ Seed terminé');
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
"

echo "💾 Export des données vers firebase_data et firebase_data_master..."
firebase emulators:export ./firebase_data --project importok-6ef77 --force 2>/dev/null
firebase emulators:export ./firebase_data_master --project importok-6ef77 --force 2>/dev/null
echo "✅ Persistance sauvegardée."
