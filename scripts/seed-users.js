// scripts/seed-users.js
// Exécuter avec: node scripts/seed-users.js
// Requiert serviceAccountKey.json dans scripts/

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialiser avec le service account
try {
  initializeApp({
    credential: cert('./scripts/serviceAccountKey.json'),
  });
} catch (e) {
  console.log('App already initialized or no service account');
}

const auth = getAuth();
const db = getFirestore();

const USERS = [
  { email: 'admin@97import.com', role: 'admin', name: 'Admin 97import' },
  { email: 'client@97import.com', role: 'user', name: 'Jean Dupont' },
  { email: 'vip@97import.com', role: 'vip', name: 'Marie Martin' },
  { email: 'partenaire@97import.com', role: 'partner', name: 'Pierre Bernard' },
  { email: 'client2@97import.com', role: 'user', name: 'Sophie Leblanc' },
];

const PASSWORD = '20262026';

async function seedUsers() {
  console.log('🌱 Seeding users...');
  console.log(`Password for all accounts: ${PASSWORD}\n`);

  for (const u of USERS) {
    try {
      // Supprimer l'utilisateur s'il existe
      const existing = await auth.getUserByEmail(u.email).catch(() => null);
      if (existing) {
        await auth.deleteUser(existing.uid);
        console.log(`🗑️  Deleted existing: ${u.email}`);
      }

      // Créer l'utilisateur
      const created = await auth.createUser({
        email: u.email,
        password: PASSWORD,
        displayName: u.name,
      });

      // Définir les custom claims (role)
      await auth.setCustomUserClaims(created.uid, { role: u.role });

      // Créer le profil Firestore
      await db.collection('profiles').doc(created.uid).set({
        email: u.email,
        role: u.role,
        nom: u.name,
        createdAt: new Date(),
      });

      console.log(`✅ ${u.email} (${u.role}) — UID: ${created.uid}`);
    } catch (e) {
      console.error(`❌ ${u.email}:`, e.message);
    }
  }

  console.log('\n🎉 Users seeding completed!');
  console.log('\nTest accounts:');
  USERS.forEach((u) => {
    console.log(`  ${u.email} / ${PASSWORD} — ${u.role}`);
  });
}

seedUsers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
