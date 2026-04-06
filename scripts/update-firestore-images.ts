// Met à jour le champ images[] dans Firestore pour chaque produit
// Associe les images locales (public/images/) aux bons produits
// Usage : npx tsx scripts/update-firestore-images.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
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

// Mapping produit ID → images[] (chemins relatifs depuis /public)
const IMAGES_MAP: Record<string, string[]> = {
  'r18-pro': [
    '/images/products/r18_pro/r18_pro_main_view.webp',
    '/images/products/r18_pro/r18_pro_side_view.webp',
    '/images/products/r18_pro/r18_pro_rear_view.webp',
    '/images/products/r18_pro/r18_pro_cab_view.webp',
  ],
  'r22-pro': [
    '/images/products/r22_pro/r22_pro_main_view.webp',
    '/images/products/r22_pro/r22_pro_side_view.webp',
    '/images/products/r22_pro/r22_pro_rear_view.webp',
    '/images/products/r22_pro/r22_pro_cab_view.webp',
  ],
  'r32-pro': [
    '/images/products/r32_pro/r32_pro_main_view.webp',
    '/images/products/r32_pro/r32_pro_side_view.webp',
    '/images/products/r32_pro/r32_pro_rear_view.webp',
    '/images/products/r32_pro/r32_pro_cab_view.webp',
  ],
  'r57-pro': [
    '/images/products/r57_pro/r57_pro_main_view.png',
  ],
  'camping-car-deluxe-hybride': [
    '/images/products/camping_car/exterior_main.webp',
    '/images/products/camping_car/exterior_front_side.jpg',
    '/images/products/camping_car/exterior_side.jpg',
    '/images/products/camping_car/interior_living.jpg',
    '/images/products/camping_car/kitchen.jpg',
    '/images/products/camping_car/bedroom.jpg',
    '/images/products/camping_car/bathroom.jpg',
  ],
  'maison-modulaire-premium': [
    '/images/products/modular_premium/exterior_1.jpg',
    '/images/products/modular_premium/exterior_2.jpg',
    '/images/products/modular_premium/exterior_3.jpg',
    '/images/products/modular_premium/exterior_4.jpg',
  ],
  'maison-modulaire-standard': [
    '/images/products/modular_standard/exterior_1.jpeg',
    '/images/products/modular_standard/exterior_2.jpeg',
    '/images/products/modular_standard/exterior_3.jpeg',
    '/images/products/modular_standard/exterior_4.jpeg',
  ],
  'kit-solaire-10kw': [
    '/images/solar/kit_overview.webp',
    '/images/solar/panel_detail.webp',
    '/images/solar/deye_inverter.webp',
    '/images/solar/battery_6fm250.webp',
    '/images/solar/mounting_structure.webp',
  ],
  'kit-solaire-12kw': [
    '/images/solar/kit_overview.webp',
    '/images/solar/panel_detail.webp',
    '/images/solar/deye_inverter.webp',
    '/images/solar/battery_6fm250.webp',
    '/images/solar/solar_installations.jpg',
  ],
  'kit-solaire-20kw': [
    '/images/solar/kit_overview.webp',
    '/images/solar/panel_detail.webp',
    '/images/solar/deye_inverter.webp',
    '/images/solar/battery_6fm250.webp',
    '/images/solar/jinko_600w_tiger_neo.jpg',
  ],
  // Accessoires
  'grappin': ['/images/accessories/grappin.webp'],
  'godet-dents': ['/images/accessories/godet_dents.webp'],
  'godet-inclinable': ['/images/accessories/godet_inclinable.webp'],
  'godet-plat': ['/images/accessories/godet_lisse.webp'],
  'marteau-hydraulique': ['/images/accessories/marteau_hydraulique.webp'],
  'tariere': ['/images/accessories/tariere.webp'],
  'ripper': ['/images/accessories/ripper_r18.webp'],
  'rateau': ['/images/accessories/rake_r18.webp'],
  // attache-rapide, pince-pouce : pas d'image disponible → on ne met pas à jour
};

async function updateImages() {
  let updated = 0;
  let skipped = 0;

  for (const [productId, images] of Object.entries(IMAGES_MAP)) {
    try {
      await updateDoc(doc(db, 'products', productId), { images });
      console.log(`✅ ${productId} — ${images.length} image(s)`);
      updated++;
    } catch (err) {
      console.error(`❌ ${productId} — erreur:`, err);
      skipped++;
    }
  }

  console.log(`\n📊 Résultat: ${updated} mis à jour, ${skipped} erreurs`);
}

updateImages().catch(console.error).finally(() => process.exit(0));
