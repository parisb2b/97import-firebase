import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Instance FRONT (clients)
export const clientApp = initializeApp(firebaseConfig, 'client');
export const clientAuth = getAuth(clientApp);
export const db = initializeFirestore(clientApp, {
  experimentalForceLongPolling: true
});
export const storage = getStorage(clientApp);

// Instance ADMIN (back-office — session isolée)
const adminApp = initializeApp(firebaseConfig, 'admin');
export const adminAuth = getAuth(adminApp);
