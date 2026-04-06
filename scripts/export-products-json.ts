// Export Firestore products → scripts/firestore-products.json
// Lecture seule — ne modifie rien

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportProducts() {
  const q = query(collection(db, 'products'), orderBy('nom'));
  const snapshot = await getDocs(q);

  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    nom: doc.data().nom || '',
    nom_chinois: doc.data().nom_chinois || '',
    numero_interne: doc.data().numero_interne || '',
    categorie: doc.data().categorie || '',
    prix_achat: doc.data().prix_achat || 0,
    actif: doc.data().actif ?? true,
    images: doc.data().images || [],
  }));

  const outputPath = path.resolve('scripts/firestore-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');
  console.log(`✅ ${products.length} produits exportés → ${outputPath}`);
}

exportProducts().catch(console.error).finally(() => process.exit(0));
