/**
 * 97IMPORT — SCRIPT DE HARD RESET ET D'INITIALISATION ARCHITECTURALE (V174)
 * Encodage : UTF-8 | Date : 17/05/2026
 */
const admin = require('firebase-admin');
const fs = require('fs');

if (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.log("⚠️ Exécution sécurisée : Mode Émulateur requis pour éviter d'impacter la prod réelle.");
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9100";
}

admin.initializeApp({ projectId: "importok-6ef77" });
const db = admin.firestore();
const auth = admin.auth();

const COMPTES_TEST = [
  { email: "parisb2b@gmail.com", uid: "UYI68ThdrTZwkuA2TutwK2KUpU92", role: "admin", displayName: "MICHEL CHEN" },
  { email: "client@97import.com", uid: "hC5WwHdYb1qYA0GgOgKrhGZcAY9L", role: "user", displayName: "Jean Dupont" },
  { email: "vip@97import.com", uid: "odSNwqe1tqBkVIP0000000000000", role: "vip", displayName: "Marie Martin" },
  { email: "partenaire@97import.com", uid: "A5RccNiacMPARTNER00000000000", role: "partenaire", displayName: "Pierre Bernard" },
  { email: "client2@97import.com", uid: "sophieLeblancUser2026000000", role: "user", displayName: "Sophie Leblanc" }
];

async function purgeCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`✅ Collection [${collectionName}] entièrement purgée.`);
}

async function run() {
  console.log("🧹 Éradication des données héritées et nettoyage structurel...");

  // Purges ciblées des tables volatiles de test
  await purgeCollection("quotes");
  await purgeCollection("clients");
  await purgeCollection("logs");

  console.log("👥 Génération et synchronisation des profils de référence V174...");
  for (const user of COMPTES_TEST) {
    try {
      await auth.deleteUser(user.uid);
    } catch (e) {}

    await auth.createUser({
      uid: user.uid,
      email: user.email,
      password: "20262026",
      displayName: user.displayName,
      emailVerified: true
    });

    await auth.setCustomUserClaims(user.uid, { role: user.role });

    const payload = {
      uid: user.uid,
      email: user.email,
      nom: user.displayName,
      role: user.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("users").doc(user.uid).set(payload, { merge: true });
    await db.collection("clients").doc(user.uid).set(payload, { merge: true });
    await db.collection("users").doc(user.email).set(payload, { merge: true });
  }

  console.log("🎯 Hard Reset Terminé. Écosystème parfaitement propre.");
  process.exit(0);
}

run().catch(console.error);
