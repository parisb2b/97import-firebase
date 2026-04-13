import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo',
  authDomain: 'importok-6ef77.firebaseapp.com',
  projectId: 'importok-6ef77',
  storageBucket: 'importok-6ef77.firebasestorage.app',
  messagingSenderId: '694030851164',
  appId: '1:694030851164:web:1a534b65a93f8d816f1a99',
});
const db = getFirestore(app);

// Matching: productId → [image URLs served from public/]
const IMAGE_MAP = {
  'MP-R18-001': ['/images/r18_pro.webp', '/images/r18_pro/r18_pro_main_view.webp', '/images/r18_pro/r18_pro_side_view.webp', '/images/r18_pro/r18_pro_cab_view.webp', '/images/r18_pro/r18_pro_rear_view.webp'],
  'MP-R22-001': ['/images/r22_pro.webp', '/images/r22_pro_main.webp', '/images/r22_pro/r22_pro_main_view.webp', '/images/r22_pro/r22_pro_side_view.webp', '/images/r22_pro/r22_pro_cab_view.webp', '/images/r22_pro/r22_pro_rear_view.webp'],
  'MP-R32-001': ['/images/r32_pro.webp', '/images/r32_pro/r32_pro_main_view.webp', '/images/r32_pro/r32_pro_side_view.webp', '/images/r32_pro/r32_pro_cab_view.webp', '/images/r32_pro/r32_pro_rear_view.webp'],
  'MP-R57-001': ['/images/r57_pro/r57_pro_main_view.png'],

  'ACC-GD-001': ['/images/accessories/godet_dents.webp'],
  'ACC-GD-002': ['/images/accessories/tooth_bucket_r18.webp'],
  'ACC-GC-001': ['/images/accessories/godet_lisse.webp'],
  'ACC-GC-002': ['/images/accessories/flat_bucket_r18.webp'],
  'ACC-GD-005': ['/images/accessories/godet_cribleur.webp'],
  'ACC-GI-001': ['/images/accessories/godet_inclinable.webp'],
  'ACC-GI-002': ['/images/accessories/tilt_bucket_r18.webp'],
  'ACC-GP-001': ['/images/accessories/grappin.webp', '/images/accessories/grapple_r18.webp'],
  'ACC-GP-002': ['/images/accessories/rake_r18.webp'],
  'ACC-MH-001': ['/images/accessories/marteau_hydraulique.webp', '/images/accessories/hydraulic_hammer_r18.webp'],
  'ACC-MH-002': ['/images/accessories/ripper_r18.webp'],
  'ACC-TA-001': ['/images/accessories/tariere.webp', '/images/accessories/auger_r18.webp'],

  'MS-20-001': ['/images/maisons/modular_standard/exterior_1.jpeg', '/images/maisons/modular_standard/exterior_2.jpeg'],
  'MS-30-001': ['/images/maisons/modular_standard/exterior_3.jpeg', '/images/maisons/modular_standard/exterior_4.jpeg'],
  'MS-40-001': ['/images/maisons/modular_standard/exterior_5.jpeg', '/images/maisons/modular_standard/exterior_6.jpeg', '/images/maisons/modular_standard/exterior_7.jpeg'],

  'MP-20-001': ['/images/maisons/modular_premium/exterior_1.jpg', '/images/maisons/modular_premium/exterior_2.jpg'],
  'MP-30-001': ['/images/maisons/modular_premium/exterior_3.jpg'],
  'MP-40-001': ['/images/maisons/modular_premium/exterior_4.jpg'],

  'CC-BYD-001': ['/images/maisons/camping_car/exterior_main.webp', '/images/maisons/camping_car/exterior_front_side.jpg', '/images/maisons/camping_car/exterior_side.jpg', '/images/maisons/camping_car/interior_living.jpg', '/images/maisons/camping_car/kitchen.jpg', '/images/maisons/camping_car/bedroom.jpg', '/images/maisons/camping_car/bathroom.jpg'],

  'KS-10K-001': ['/images/solaire/kit_overview.webp', '/images/solaire/jinko_truck_delivery.jpg', '/images/solaire/mounting_structure.webp'],
  'KS-12K-001': ['/images/solaire/solar_installations.jpg', '/images/solar_kits/jinko_installation_toiture.webp'],
  'KS-20K-001': ['/images/solar_kits/jinko_warehouse_stock.webp'],
  'KS-PAN-S-001': ['/images/solaire/panel_detail.webp', '/images/solar_kits/jinko_panels_pair.webp'],
  'KS-PAN-L-001': ['/images/solaire/jinko_600w_tiger_neo.jpg', '/images/solar_kits/jinko_600w_bifacial.webp', '/images/solar_kits/jinko_panel_layers.png'],
  'KS-BAT-10K-001': ['/images/solaire/battery_6fm250.webp'],
  'KS-BAT-12K-001': ['/images/solar_kits/battery_lifepo4.png'],
  'KS-OND-10K-001': ['/images/solaire/deye_inverter.webp'],
  'KS-OND-12K-001': ['/images/solar_kits/deye_inverter.png'],
  'KS-CAB-001': ['/images/solaire/solar_cables.webp', '/images/solar_kits/solar_cables.png'],
};

async function main() {
  console.log('=== UPDATE IMAGES_URLS IN FIRESTORE ===\n');
  let updated = 0, errors = 0;

  for (const [productId, urls] of Object.entries(IMAGE_MAP)) {
    try {
      await updateDoc(doc(db, 'products', productId), { images_urls: urls });
      console.log(`  ✅ ${productId} → ${urls.length} images`);
      updated++;
    } catch (err) {
      console.error(`  ❌ ${productId}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ ${updated} produits mis à jour, ❌ ${errors} erreurs`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
