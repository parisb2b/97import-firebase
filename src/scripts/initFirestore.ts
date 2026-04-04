import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc,
  serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDuBTNfll6FGgnZ_vNmCoBM_00zf6Uz1A4",
  authDomain: "import-412d0.firebaseapp.com",
  projectId: "import-412d0",
  storageBucket: "import-412d0.firebasestorage.app",
  messagingSenderId: "421251240981",
  appId: "1:421251240981:web:64af2ab916b038ae5c6a1c",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function init() {
  // Compteur devis
  await setDoc(doc(db, 'counters', 'devis'),
    { value: 0 })

  // Params admin
  await setDoc(doc(db, 'admin_params', 'emetteur_pro'), {
    nom: 'LUXENT LIMITED',
    adresse: '2ND FLOOR COLLEGE HOUSE',
    adresse2: '17 KING EDWARDS ROAD RUISLIP',
    ville: 'HA4 7AE LONDON',
    pays: 'Royaume-Uni',
    siret: '14852122',
    email: 'luxent@ltd-uk.eu',
    iban: '',
    bic: '',
  })

  await setDoc(doc(db, 'admin_params', 'emetteur_perso'), {
    nom: 'Chen Michel',
    adresse: 'À compléter',
    ville: 'À compléter',
    pays: 'France',
    email: 'parisb2b@gmail.com',
    iban: '',
    bic: '',
  })

  await setDoc(doc(db, 'admin_params', 'rib_pro'),
    { label: 'Compte professionnel', url: '' })

  await setDoc(doc(db, 'admin_params', 'rib_perso'),
    { label: 'Compte particulier', url: '' })

  await setDoc(doc(db, 'admin_params', 'config_acompte'),
    { max_acomptes: 3 })

  await setDoc(doc(db, 'admin_params', 'multiplicateurs'),
    { user: 2, partner: 1.2 })

  // Contenu site
  await setDoc(doc(db, 'site_content', 'banniere'), {
    texte: '-50% PAR RAPPORT AU PRIX DE VENTE EN MARTINIQUE',
    actif: true,
    couleur: '#2563EB',
  })

  await setDoc(doc(db, 'site_content', 'contact'), {
    telephone: '',
    whatsapp: '',
    email: 'parisb2b@gmail.com',
    adresse: '',
  })

  await setDoc(doc(db, 'site_content', 'footer'), {
    tiktok: '',
    instagram: '',
    whatsapp: '',
    mentions: '97import.com — Importation DOM-TOM',
  })

  // Partenaires initiaux
  await setDoc(doc(db, 'partners', 'TD'), {
    nom: 'Thierry D.',
    code: 'TD',
    email: '',
    telephone: '',
    user_id: null,
    actif: true,
    created_at: serverTimestamp(),
  })

  await setDoc(doc(db, 'partners', 'JM'), {
    nom: 'Jean-Marc V.',
    code: 'JM',
    email: '',
    telephone: '',
    user_id: null,
    actif: true,
    created_at: serverTimestamp(),
  })

  await setDoc(doc(db, 'partners', 'MC'), {
    nom: 'MC',
    code: 'MC',
    email: '',
    telephone: '',
    user_id: null,
    actif: true,
    created_at: serverTimestamp(),
  })

  console.log('✅ Firestore initialisé')
}

init().catch(console.error)

// Exécuter avec : npx tsx src/scripts/initFirestore.ts
