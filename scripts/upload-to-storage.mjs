import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'fs';
import { join, basename, extname } from 'path';

const app = initializeApp({
  apiKey: 'AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo',
  authDomain: 'importok-6ef77.firebaseapp.com',
  projectId: 'importok-6ef77',
  storageBucket: 'importok-6ef77.firebasestorage.app',
  messagingSenderId: '694030851164',
  appId: '1:694030851164:web:1a534b65a93f8d816f1a99',
});

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const IMAGES_DIR = process.env.HOME + '/97import-OK/images';

// Auth
try {
  await signInWithEmailAndPassword(auth, 'admin@97import.com', 'Admin2026!');
  console.log('✅ Connecté Firebase Auth\n');
} catch (e) {
  console.error('❌ Auth échouée:', e.message);
  console.log('⚠️ Continuant sans auth (images déjà dans public/)');
}

// Matching table: relativePath → productId
const MATCHING = {
  'products/r18_pro.webp': 'MP-R18-001',
  'products/r22_pro.webp': 'MP-R22-001',
  'products/r22_pro_main.webp': 'MP-R22-001',
  'products/r32_pro.webp': 'MP-R32-001',
  'products/r18_pro/r18_pro_main_view.webp': 'MP-R18-001',
  'products/r18_pro/r18_pro_side_view.webp': 'MP-R18-001',
  'products/r18_pro/r18_pro_cab_view.webp': 'MP-R18-001',
  'products/r18_pro/r18_pro_rear_view.webp': 'MP-R18-001',
  'products/r22_pro/r22_pro_main_view.webp': 'MP-R22-001',
  'products/r22_pro/r22_pro_side_view.webp': 'MP-R22-001',
  'products/r22_pro/r22_pro_cab_view.webp': 'MP-R22-001',
  'products/r22_pro/r22_pro_rear_view.webp': 'MP-R22-001',
  'products/r32_pro/r32_pro_main_view.webp': 'MP-R32-001',
  'products/r32_pro/r32_pro_side_view.webp': 'MP-R32-001',
  'products/r32_pro/r32_pro_cab_view.webp': 'MP-R32-001',
  'products/r32_pro/r32_pro_rear_view.webp': 'MP-R32-001',
  'products/r57_pro/r57_pro_main_view.png': 'MP-R57-001',
  'accessories/godet_dents.webp': 'ACC-GD-001',
  'accessories/tooth_bucket_r18.webp': 'ACC-GD-002',
  'accessories/godet_lisse.webp': 'ACC-GC-001',
  'accessories/flat_bucket_r18.webp': 'ACC-GC-002',
  'accessories/godet_cribleur.webp': 'ACC-GD-005',
  'accessories/godet_inclinable.webp': 'ACC-GI-001',
  'accessories/tilt_bucket_r18.webp': 'ACC-GI-002',
  'accessories/grappin.webp': 'ACC-GP-001',
  'accessories/marteau_hydraulique.webp': 'ACC-MH-001',
  'accessories/tariere.webp': 'ACC-TA-001',
  'accessories/auger_r18.webp': 'ACC-TA-001',
  'maisons/modular_standard/exterior_1.jpeg': 'MS-20-001',
  'maisons/modular_standard/exterior_2.jpeg': 'MS-20-001',
  'maisons/modular_standard/exterior_3.jpeg': 'MS-30-001',
  'maisons/modular_standard/exterior_4.jpeg': 'MS-30-001',
  'maisons/modular_standard/exterior_5.jpeg': 'MS-40-001',
  'maisons/modular_standard/exterior_6.jpeg': 'MS-40-001',
  'maisons/modular_premium/exterior_1.jpg': 'MP-20-001',
  'maisons/modular_premium/exterior_2.jpg': 'MP-20-001',
  'maisons/modular_premium/exterior_3.jpg': 'MP-30-001',
  'maisons/modular_premium/exterior_4.jpg': 'MP-40-001',
  'maisons/camping_car/exterior_main.webp': 'CC-BYD-001',
  'maisons/camping_car/interior_living.jpg': 'CC-BYD-001',
  'maisons/camping_car/kitchen.jpg': 'CC-BYD-001',
  'maisons/camping_car/bedroom.jpg': 'CC-BYD-001',
  'solaire/kit_overview.webp': 'KS-10K-001',
  'solaire/panel_detail.webp': 'KS-PAN-S-001',
  'solaire/jinko_600w_tiger_neo.jpg': 'KS-PAN-L-001',
  'solaire/battery_6fm250.webp': 'KS-BAT-10K-001',
  'solaire/deye_inverter.webp': 'KS-OND-10K-001',
  'solaire/solar_cables.webp': 'KS-CAB-001',
  'products/solar_kits/jinko_600w_bifacial.webp': 'KS-PAN-L-001',
  'products/solar_kits/battery_lifepo4.png': 'KS-BAT-12K-001',
  'products/solar_kits/deye_inverter.png': 'KS-OND-12K-001',
};

const CONTENT_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
};

let uploaded = 0, errors = 0;
const productUrls = new Map();

for (const [relPath, productId] of Object.entries(MATCHING)) {
  const fullPath = join(IMAGES_DIR, relPath);
  const fileName = basename(fullPath);
  const ext = extname(fileName).toLowerCase();

  try {
    const storageRef = ref(storage, `products/${productId}/${fileName}`);
    const fileBuffer = readFileSync(fullPath);
    await uploadBytes(storageRef, fileBuffer, { contentType: CONTENT_TYPES[ext] });
    const url = await getDownloadURL(storageRef);

    if (!productUrls.has(productId)) productUrls.set(productId, []);
    productUrls.get(productId).push(url);

    console.log(`  📸 ${fileName} → ${productId}`);
    uploaded++;
  } catch (e) {
    console.error(`  ❌ ${fileName}: ${e.message?.substring(0, 80)}`);
    errors++;
  }
}

// Update Firestore
console.log('\n--- Mise à jour Firestore ---');
for (const [productId, urls] of productUrls) {
  try {
    await updateDoc(doc(db, 'products', productId), { images_urls: urls });
    console.log(`  ✅ ${productId} → ${urls.length} images`);
  } catch (e) {
    console.error(`  ❌ Firestore ${productId}: ${e.message}`);
  }
}

console.log(`\n=== RÉSULTAT ===`);
console.log(`✅ Uploadés: ${uploaded}`);
console.log(`❌ Erreurs: ${errors}`);
console.log(`📊 Produits mis à jour: ${productUrls.size}`);

process.exit(0);
