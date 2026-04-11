import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Hardcoded config for debug
const firebaseConfig = {
  apiKey: "AIzaSyCeKBbSgC8PQK4OETlsjnRwhYCmAKz6cwA",
  authDomain: "import2050-59f11.firebaseapp.com",
  projectId: "import2050-59f11",
  storageBucket: "import2050-59f11.firebasestorage.app",
  messagingSenderId: "496161620887",
  appId: "1:496161620887:web:5cdbd6f3a879edd5bfbad2"
};

// Instance FRONT (clients)
const clientApp = initializeApp(firebaseConfig, 'client');
export const clientAuth = getAuth(clientApp);
export const db = getFirestore(clientApp);
export const storage = getStorage(clientApp);

// Instance ADMIN (back-office — session isolée)
const adminApp = initializeApp(firebaseConfig, 'admin');
export const adminAuth = getAuth(adminApp);
