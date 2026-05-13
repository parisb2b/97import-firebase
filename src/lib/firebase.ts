import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Configuration pilotée par les variables d'environnement VITE_FIREBASE_*
// Fallback local uniquement pour le développement hors Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyLocalDevEmulatorKey',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'importok-6ef77.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'importok-6ef77',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'importok-6ef77.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

console.log('🔥 Diagnostic : Firebase Project ID =', firebaseConfig.projectId);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
const storage = getStorage(app);

// Émulateurs locaux — uniquement en développement (import.meta.env.DEV)
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
