import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Configuration explicite basée sur les variables VITE_ (Vercel + .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "importok-6ef77", // Fixé explicitement selon décision V165
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Injection de log de diagnostic pour la console Vercel (Audit V165)
console.log("🔥 [Firebase Diagnostic] Project ID target:", firebaseConfig.projectId);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
const storage = getStorage(app);

// GESTION STRICTE DES ÉMULATEURS
// Ne s'active QUE si import.meta.env.DEV est vrai ET qu'on n'est pas sur Vercel
if (import.meta.env.DEV && !window.location.hostname.includes('vercel.app')) {
  console.log("🛠️ Connexion aux émulateurs locaux détectée...");
  connectAuthEmulator(auth, 'http://127.0.0.1:9100', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
  connectStorageEmulator(storage, '127.0.0.1', 9200);
}

export { auth, db, storage, app };
export const clientAuth = auth;
export const adminAuth = auth;
export const adminDb = db;
export const adminStorage = storage;
