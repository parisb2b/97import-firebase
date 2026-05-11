// ═══════════════════════════════════════════════════════════
// M1009 CERTIFIÉ — Instance unique + 127.0.0.1 IPv4 forcé
// ═══════════════════════════════════════════════════════════
import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION (V157 — pilotée par .env)
// ═══════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyLocalDevEmulatorKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "importok-6ef77.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "importok-6ef77",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "importok-6ef77.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
};

// ═══════════════════════════════════════════════════════════
// INSTANCE UNIQUE (V157 — Supprime le Split-Brain clientApp/adminApp)
// ═══════════════════════════════════════════════════════════
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const storage = getStorage(app);

// Alias pour rétrocompatibilité avec tous les composants existants
export const clientAuth = auth;
export const adminAuth = auth;
export const adminDb = db;
export const adminStorage = storage;

// ═══════════════════════════════════════════════════════════
// CONNEXION ÉMULATEURS (V157 — Garde idempotente HMR/StrictMode)
// ═══════════════════════════════════════════════════════════
const EMULATORS_CONNECTED_KEY = '__97import_emulators_connected__';

if (typeof window !== 'undefined' && !(window as any)[EMULATORS_CONNECTED_KEY]) {
  (window as any)[EMULATORS_CONNECTED_KEY] = true;

  const host = "127.0.0.1"; // V157 — Forçage IPv4 (contournement IPv6 Windows 11)
  connectAuthEmulator(auth, `http://${host}:9100`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8081);
  connectStorageEmulator(storage, host, 9200);
  console.log("🔥 [V157] Émulateurs connectés sur " + host + " (9100, 8081, 9200)");
}
