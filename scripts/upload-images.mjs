import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';
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

const db = getFirestore(app);
const storage = getStorage(app);
const IMAGES_DIR = process.env.HOME + '/97import-OK/images';

// MATCHING TABLE — fichier local → product ID Firestore
// Préférence webp quand disponible (plus léger)
const MATCHING = {
  // === MINI-PELLES (images principales) ===
  'products/r18_pro.webp': 'MP-R18-001',
  'products/r22_pro.webp': 'MP-R22-001',
  'products/r22_pro_main.webp': 'MP-R22-001',
  'products/r32_pro.webp': 'MP-R32-001',
  'products/r10_eco_main.webp': 'MP-R18-001', // R10 n'existe pas, assign à R18

  // === MINI-PELLES (vues multiples R18) ===
  'products/r18_pro/r18_pro_main_view.webp': 'MP-R18-001',
  'products/r18_pro/r18_pro_side_view.webp': 'MP-R18-001',
  'products/r18_pro/r18_pro_cab_view.webp': 'MP-R18-001',
  'products/r18_pro/r18_pro_rear_view.webp': 'MP-R18-001',

  // === MINI-PELLES (vues multiples R22) ===
  'products/r22_pro/r22_pro_main_view.webp': 'MP-R22-001',
  'products/r22_pro/r22_pro_side_view.webp': 'MP-R22-001',
  'products/r22_pro/r22_pro_cab_view.webp': 'MP-R22-001',
  'products/r22_pro/r22_pro_rear_view.webp': 'MP-R22-001',

  // === MINI-PELLES (vues multiples R32) ===
  'products/r32_pro/r32_pro_main_view.webp': 'MP-R32-001',
  'products/r32_pro/r32_pro_side_view.webp': 'MP-R32-001',
  'products/r32_pro/r32_pro_cab_view.webp': 'MP-R32-001',
  'products/r32_pro/r32_pro_rear_view.webp': 'MP-R32-001',

  // === MINI-PELLE R57 ===
  'products/r57_pro/r57_pro_main_view.png': 'MP-R57-001',

  // === ACCESSOIRES (webp préféré) ===
  'accessories/godet_dents.webp': 'ACC-GD-001',
  'accessories/tooth_bucket_r18.webp': 'ACC-GD-002',
  'accessories/godet_lisse.webp': 'ACC-GC-001',
  'accessories/flat_bucket_r18.webp': 'ACC-GC-002',
  'accessories/godet_cribleur.webp': 'ACC-GD-005',
  'accessories/godet_inclinable.webp': 'ACC-GI-001',
  'accessories/tilt_bucket_r18.webp': 'ACC-GI-002',
  'accessories/grappin.webp': 'ACC-GP-001',
  'accessories/grapple_r18.webp': 'ACC-GP-001',
  'accessories/marteau_hydraulique.webp': 'ACC-MH-001',
  'accessories/hydraulic_hammer_r18.webp': 'ACC-MH-001',
  'accessories/tariere.webp': 'ACC-TA-001',
  'accessories/auger_r18.webp': 'ACC-TA-001',
  'accessories/fourche.webp': 'ACC-GP-001', // fourche → grappin (pas de ref fourche)
  'accessories/rake_r18.webp': 'ACC-GP-002', // rake → grappin R32
  'accessories/ripper_r18.webp': 'ACC-MH-002', // ripper → marteau R32

  // === MAISONS STANDARD ===
  'maisons/modular_standard/exterior_1.jpeg': 'MS-20-001',
  'maisons/modular_standard/exterior_2.jpeg': 'MS-20-001',
  'maisons/modular_standard/exterior_3.jpeg': 'MS-30-001',
  'maisons/modular_standard/exterior_4.jpeg': 'MS-30-001',
  'maisons/modular_standard/exterior_5.jpeg': 'MS-40-001',
  'maisons/modular_standard/exterior_6.jpeg': 'MS-40-001',
  'maisons/modular_standard/exterior_7.jpeg': 'MS-40-001',

  // === MAISONS PREMIUM ===
  'maisons/modular_premium/exterior_1.jpg': 'MP-20-001',
  'maisons/modular_premium/exterior_2.jpg': 'MP-20-001',
  'maisons/modular_premium/exterior_3.jpg': 'MP-30-001',
  'maisons/modular_premium/exterior_4.jpg': 'MP-40-001',

  // === CAMPING CAR ===
  'maisons/camping_car/exterior_main.webp': 'CC-BYD-001',
  'maisons/camping_car/exterior_front_side.jpg': 'CC-BYD-001',
  'maisons/camping_car/exterior_side.jpg': 'CC-BYD-001',
  'maisons/camping_car/exterior_back.jpg': 'CC-BYD-001',
  'maisons/camping_car/interior_living.jpg': 'CC-BYD-001',
  'maisons/camping_car/kitchen.jpg': 'CC-BYD-001',
  'maisons/camping_car/bedroom.jpg': 'CC-BYD-001',
  'maisons/camping_car/bathroom.jpg': 'CC-BYD-001',
  'maisons/camping_car/dining_area.jpg': 'CC-BYD-001',
  'maisons/camping_car/interior_overview.jpg': 'CC-BYD-001',
  'maisons/camping_car/laundry.jpg': 'CC-BYD-001',

  // === SOLAIRE ===
  'solaire/kit_overview.webp': 'KS-10K-001',
  'solaire/panel_detail.webp': 'KS-PAN-S-001',
  'solaire/jinko_600w_tiger_neo.jpg': 'KS-PAN-L-001',
  'solaire/jinko_warehouse.jpg': 'KS-PAN-L-001',
  'solaire/jinko_truck_delivery.jpg': 'KS-10K-001',
  'solaire/battery_6fm250.webp': 'KS-BAT-10K-001',
  'solaire/deye_inverter.webp': 'KS-OND-10K-001',
  'solaire/mounting_structure.webp': 'KS-10K-001',
  'solaire/solar_cables.webp': 'KS-CAB-001',
  'solaire/solar_installations.jpg': 'KS-12K-001',

  // === SOLAIRE (dossier products/solar_kits) ===
  'products/solar_kits/jinko_600w_bifacial.webp': 'KS-PAN-L-001',
  'products/solar_kits/jinko_panels_pair.webp': 'KS-PAN-S-001',
  'products/solar_kits/jinko_tiger_neo_fiche.webp': 'KS-PAN-L-001',
  'products/solar_kits/jinko_installation_toiture.webp': 'KS-12K-001',
  'products/solar_kits/jinko_warehouse_stock.webp': 'KS-20K-001',
  'products/solar_kits/battery_lifepo4.png': 'KS-BAT-12K-001',
  'products/solar_kits/deye_inverter.png': 'KS-OND-12K-001',
  'products/solar_kits/jinko_panel_layers.png': 'KS-PAN-L-001',
  'products/solar_kits/solar_cables.png': 'KS-CAB-001',
  'products/solar_kits/tiger_neo_585w.avif': 'KS-PAN-S-001',
};

// VIDÉOS
const VIDEO_MATCHING = {
  'maisons/camping_car/video_tour.mp4': 'CC-BYD-001',
  'maisons/modular_standard/video_1.mp4': 'MS-20-001',
  'maisons/modular_standard/video_2.mp4': 'MS-30-001',
  'maisons/modular_standard/video_3.mp4': 'MS-40-001',
  'maisons/modular_premium/video_1.mp4': 'MP-20-001',
  'maisons/modular_premium/video_2.mp4': 'MP-30-001',
};

const CONTENT_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
};

async function uploadFile(localPath, productId, isVideo) {
  try {
    const fileName = basename(localPath);
    const storageRef = ref(storage, `products/${productId}/${fileName}`);
    const fileBuffer = readFileSync(localPath);
    const ext = extname(fileName).toLowerCase();
    const metadata = { contentType: CONTENT_TYPES[ext] || 'application/octet-stream' };

    await uploadBytes(storageRef, fileBuffer, metadata);
    const url = await getDownloadURL(storageRef);

    const productRef = doc(db, 'products', productId);
    if (isVideo) {
      await updateDoc(productRef, { video_url: url });
      console.log(`  📹 ${fileName} → ${productId}`);
    } else {
      await updateDoc(productRef, { images_urls: arrayUnion(url) });
      console.log(`  📸 ${fileName} → ${productId}`);
    }
    return url;
  } catch (error) {
    console.error(`  ❌ ${basename(localPath)}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('=== UPLOAD IMAGES FIREBASE STORAGE ===\n');

  let uploaded = 0, errors = 0;

  // Images
  console.log('--- IMAGES ---');
  for (const [relPath, productId] of Object.entries(MATCHING)) {
    const fullPath = join(IMAGES_DIR, relPath);
    const result = await uploadFile(fullPath, productId, false);
    if (result) uploaded++; else errors++;
  }

  // Vidéos
  console.log('\n--- VIDÉOS ---');
  for (const [relPath, productId] of Object.entries(VIDEO_MATCHING)) {
    const fullPath = join(IMAGES_DIR, relPath);
    const result = await uploadFile(fullPath, productId, true);
    if (result) uploaded++; else errors++;
  }

  console.log(`\n=== RÉSULTAT ===`);
  console.log(`✅ Uploadés: ${uploaded}`);
  console.log(`❌ Erreurs: ${errors}`);
  console.log(`📊 Matching: ${Object.keys(MATCHING).length} images + ${Object.keys(VIDEO_MATCHING).length} vidéos`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
