import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.firebasestorage.app",
  messagingSenderId: "694030851164",
  appId: "1:694030851164:web:1a534b65a93f8d816f1a99"
};

// Instance FRONT (clients)
const clientApp = initializeApp(firebaseConfig, 'client');
export const clientAuth = getAuth(clientApp);
export const db = initializeFirestore(clientApp, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});
export const storage = getStorage(clientApp);

// Instance ADMIN (back-office — session isolée)
const adminApp = initializeApp(firebaseConfig, 'admin');
export const adminAuth = getAuth(adminApp);
