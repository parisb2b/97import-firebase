// src/scripts/createTestUsers.ts
// Exécuter UNE SEULE FOIS avec : npx tsx src/scripts/createTestUsers.ts

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import * as dotenv from 'dotenv'
dotenv.config()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const testUsers = [
  {
    email: 'user@97import.com',
    password: 'Test2026!',
    profile: {
      role: 'user',
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '0601020304',
      email: 'user@97import.com',
      adresse_facturation: '15 rue des Lilas',
      ville_facturation: 'Fort-de-France',
      cp_facturation: '97200',
      pays_facturation: 'Martinique',
      adresse_livraison: '15 rue des Lilas',
      ville_livraison: 'Fort-de-France',
      cp_livraison: '97200',
      pays_livraison: 'Martinique',
      adresse_livraison_identique: true,
    }
  },
  {
    email: 'vip@97import.com',
    password: 'Test2026!',
    profile: {
      role: 'vip',
      first_name: 'Marie',
      last_name: 'Martin',
      phone: '0611223344',
      email: 'vip@97import.com',
      adresse_facturation: '8 avenue Foch',
      ville_facturation: 'Le Lamentin',
      cp_facturation: '97232',
      pays_facturation: 'Martinique',
      adresse_livraison: '8 avenue Foch',
      ville_livraison: 'Le Lamentin',
      cp_livraison: '97232',
      pays_livraison: 'Martinique',
      adresse_livraison_identique: true,
    }
  },
  {
    email: 'partner@97import.com',
    password: 'Test2026!',
    profile: {
      role: 'partner',
      first_name: 'Patrick',
      last_name: 'Bernard',
      phone: '0622334455',
      email: 'partner@97import.com',
      adresse_facturation: 'Quartier Reprise',
      ville_facturation: 'Rivière-Salée',
      cp_facturation: '97215',
      pays_facturation: 'Martinique',
      adresse_livraison: 'Quartier Reprise',
      ville_livraison: 'Rivière-Salée',
      cp_livraison: '97215',
      pays_livraison: 'Martinique',
      adresse_livraison_identique: true,
    }
  },
  {
    email: 'admin@97import.com',
    password: 'Admin2026!',
    profile: {
      role: 'admin',
      first_name: 'Michel',
      last_name: 'Chen',
      phone: '0663284908',
      email: 'admin@97import.com',
      adresse_facturation: '2 Rue Konrad Adenauer',
      ville_facturation: 'Bussy-Saint-Georges',
      cp_facturation: '77600',
      pays_facturation: 'France',
      adresse_livraison_identique: true,
    }
  },
]

async function createAllUsers() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║  CRÉATION DES 5 COMPTES TEST 97IMPORT  ║')
  console.log('╚════════════════════════════════════════╝')

  for (const user of testUsers) {
    try {
      console.log(`\n→ Création ${user.profile.role}: ${user.email}`)

      const cred = await createUserWithEmailAndPassword(auth, user.email, user.password)
      const uid = cred.user.uid
      console.log(`  ✅ Auth créé (uid: ${uid})`)

      await setDoc(doc(db, 'profiles', uid), {
        ...user.profile,
        created_at: serverTimestamp(),
      })
      console.log(`  ✅ Profile Firestore créé (rôle: ${user.profile.role})`)

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`  ⚠️ ${user.email} existe déjà — ignoré`)
      } else {
        console.error(`  ❌ Erreur: ${error.message}`)
      }
    }
  }

  // Créer aussi le partenaire JM dans la collection 'partners'
  console.log('\n→ Création partenaire JM dans collection partners...')
  try {
    await setDoc(doc(db, 'partners', 'partner-jm'), {
      nom: 'JM PRESTATIONS',
      code: 'JM',
      email: 'partner@97import.com',
      telephone: '0622334455',
      actif: true,
      commission_taux: 0.05,
      created_at: serverTimestamp(),
    })
    console.log('  ✅ Partenaire JM créé')
  } catch (e: any) {
    console.log(`  ⚠️ ${e.message}`)
  }

  // Créer les autres partenaires
  const otherPartners = [
    { id: 'partner-td', nom: 'TD SERVICES', code: 'TD', email: 'td@example.com', commission_taux: 0.05 },
    { id: 'partner-mc', nom: 'MC IMPORT', code: 'MC', email: 'mc@example.com', commission_taux: 0.05 },
  ]
  for (const p of otherPartners) {
    try {
      await setDoc(doc(db, 'partners', p.id), {
        ...p, actif: true, telephone: '', created_at: serverTimestamp(),
      })
      console.log(`  ✅ Partenaire ${p.code} créé`)
    } catch (e: any) {
      console.log(`  ⚠️ ${e.message}`)
    }
  }

  console.log('\n════════════════════════════════════════')
  console.log('COMPTES CRÉÉS :')
  console.log('  user@97import.com     / Test2026!  → rôle: user')
  console.log('  vip@97import.com      / Test2026!  → rôle: vip')
  console.log('  partner@97import.com  / Test2026!  → rôle: partner (JM)')
  console.log('  admin@97import.com    / Admin2026! → rôle: admin')
  console.log('  (visitor = pas de compte, non connecté)')
  console.log('════════════════════════════════════════')
}

createAllUsers().catch(console.error).finally(() => process.exit(0))
