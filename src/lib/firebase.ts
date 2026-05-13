import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyLocalDevEmulatorKey",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
const storage = getStorage(app);

// Émulateurs locaux — uniquement en développement
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9100', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
  connectStorageEmulator(storage, '127.0.0.1', 9200);

  // Nettoie le cache auth local si l'émulateur a été réinitialisé
  if (typeof window !== 'undefined') {
    const AUTH_CLEARED_KEY = '__97import_auth_cleared__';
    if (!sessionStorage.getItem(AUTH_CLEARED_KEY)) {
      sessionStorage.setItem(AUTH_CLEARED_KEY, '1');
      auth.authStateReady().then(() => {
        if (!auth.currentUser) {
          Object.keys(localStorage).filter(k =>
            k.startsWith('firebase:authUser:') ||
            k.startsWith('firebase:authEvent:')
          ).forEach(k => localStorage.removeItem(k));
        }
      }).catch(() => {});
    }
  }
}

export { auth, db, storage };
export const clientAuth = auth;
export const adminAuth = auth;
export const adminDb = db;
export const adminStorage = storage;
