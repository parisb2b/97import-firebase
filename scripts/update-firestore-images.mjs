// Met à jour images[] dans Firestore via Admin SDK (bypass security rules)
// Usage : node scripts/update-firestore-images.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const serviceAccount = require(path.resolve(__dirname, '../service-account.json'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const IMAGES_MAP = {
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
  'grappin':           ['/images/accessories/grappin.webp'],
  'godet-dents':       ['/images/accessories/godet_dents.webp'],
  'godet-inclinable':  ['/images/accessories/godet_inclinable.webp'],
  'godet-plat':        ['/images/accessories/godet_lisse.webp'],
  'marteau-hydraulique': ['/images/accessories/marteau_hydraulique.webp'],
  'tariere':           ['/images/accessories/tariere.webp'],
  'ripper':            ['/images/accessories/ripper_r18.webp'],
  'rateau':            ['/images/accessories/rake_r18.webp'],
};

let updated = 0, errors = 0;

for (const [id, images] of Object.entries(IMAGES_MAP)) {
  try {
    await db.collection('products').doc(id).update({ images });
    console.log(`OK  ${id} (${images.length} image${images.length > 1 ? 's' : ''})`);
    updated++;
  } catch (err) {
    console.error(`ERR ${id} — ${err.message}`);
    errors++;
  }
}

console.log(`\nResultat: ${updated} mis a jour, ${errors} erreurs`);
process.exit(errors > 0 ? 1 : 0);
