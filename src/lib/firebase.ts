import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth'
import {
  getFirestore,
} from 'firebase/firestore'
import {
  getStorage,
} from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { OAuthProvider, FacebookAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Instance principale — site + espace client
const app = initializeApp(firebaseConfig)

// Instance séparée — back-office admin
// (sessions isolées — ne jamais mélanger les 2)
const adminApp = initializeApp(firebaseConfig, 'admin')

// Auth
export const authClient = getAuth(app)
export const authAdmin = getAuth(adminApp)
export const googleProvider = new GoogleAuthProvider()

// Microsoft (Azure AD) — renseigner VITE_MICROSOFT_CLIENT_ID dans .env.local
export const microsoftProvider = new OAuthProvider('microsoft.com')
if (import.meta.env.VITE_MICROSOFT_CLIENT_ID &&
    import.meta.env.VITE_MICROSOFT_CLIENT_ID !== '[COLLE ICI TON ID D\'APPLICATION]') {
  microsoftProvider.setCustomParameters({
    client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    tenant: 'common',
  })
}

// Facebook — renseigner VITE_FACEBOOK_APP_ID dans .env
export const facebookProvider = new FacebookAuthProvider()

// Firestore
export const db = getFirestore(app)

// Storage
export const storage = getStorage(app)

// Functions (région Europe)
export const functions = getFunctions(app, 'europe-west1')

export default app
