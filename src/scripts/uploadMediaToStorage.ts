/**
 * Upload médias → Firebase Storage (import2030)
 * Utilise firebase-admin — contourne les règles de sécurité
 *
 * Usage : npx tsx src/scripts/uploadMediaToStorage.ts
 */

// Forcer UTF-8

import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..', '..')
const MEDIA_ROOT   = 'C:/DATA-MC-2030/MIGRATION_PACKAGE_FINAL/media'

// Init Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(join(PROJECT_ROOT, 'service-account.json')),
  storageBucket: 'import2030.firebasestorage.app',
})
const bucket = admin.storage().bucket()

// Mapping local → Firebase Storage
const UPLOAD_MAP: { local: string; dest: string }[] = [
  // Logos
  { local: 'logos/logo_import97_large.png',           dest: 'logos/logo_import97_large.png' },
  { local: 'logos/logo_import97.png',                 dest: 'logos/logo_import97.png' },
  { local: 'logos/logo_import97_footer.png',          dest: 'logos/logo_import97_footer.png' },
  { local: 'logos/rippa_logo.webp',                   dest: 'logos/rippa_logo.webp' },

  // Portal
  { local: 'portal/hero_ship.png',                    dest: 'portal/hero_ship.png' },
  { local: 'portal/modular_home.webp',                dest: 'portal/modular_home.webp' },
  { local: 'portal/solar_panel.jpg',                  dest: 'portal/solar_panel.jpg' },
  { local: 'portal/camping_car.png',                  dest: 'portal/camping_car.png' },
  { local: 'portal/solar_roof.jpg',                   dest: 'portal/solar_roof.jpg' },

  // Mini-pelles — vignettes
  { local: 'products/r18_pro.webp',                   dest: 'products/r18_pro.webp' },
  { local: 'products/r22_pro.webp',                   dest: 'products/r22_pro.webp' },
  { local: 'products/r32_pro.webp',                   dest: 'products/r32_pro.webp' },

  // Mini-pelles — galeries
  { local: 'products/r18_pro/r18_pro_main_view.webp', dest: 'products/r18_pro/main.webp' },
  { local: 'products/r18_pro/r18_pro_side_view.webp', dest: 'products/r18_pro/side.webp' },
  { local: 'products/r18_pro/r18_pro_rear_view.webp', dest: 'products/r18_pro/rear.webp' },
  { local: 'products/r18_pro/r18_pro_cab_view.webp',  dest: 'products/r18_pro/cab.webp' },
  { local: 'products/r22_pro/r22_pro_main_view.webp', dest: 'products/r22_pro/main.webp' },
  { local: 'products/r22_pro/r22_pro_side_view.webp', dest: 'products/r22_pro/side.webp' },
  { local: 'products/r22_pro/r22_pro_rear_view.webp', dest: 'products/r22_pro/rear.webp' },
  { local: 'products/r22_pro/r22_pro_cab_view.webp',  dest: 'products/r22_pro/cab.webp' },
  { local: 'products/r32_pro/r32_pro_main_view.webp', dest: 'products/r32_pro/main.webp' },
  { local: 'products/r32_pro/r32_pro_side_view.webp', dest: 'products/r32_pro/side.webp' },
  { local: 'products/r57_pro/r57_pro_main_view.png',  dest: 'products/r57_pro/main.webp' },

  // Accessoires
  { local: 'accessories/godet_dents.webp',            dest: 'accessories/godet_dents.webp' },
  { local: 'accessories/godet_lisse.webp',            dest: 'accessories/godet_plat.webp' },
  { local: 'accessories/godet_inclinable.webp',       dest: 'accessories/godet_inclinable.webp' },
  { local: 'accessories/marteau_hydraulique.webp',    dest: 'accessories/marteau_hydraulique.webp' },
  { local: 'accessories/grappin.webp',                dest: 'accessories/grappin.webp' },
  { local: 'accessories/tariere.webp',                dest: 'accessories/tariere.webp' },
  { local: 'accessories/rake_r18.webp',               dest: 'accessories/rateau.webp' },
  { local: 'accessories/ripper_r18.webp',             dest: 'accessories/ripper.webp' },
  { local: 'accessories/hydraulic_hammer_r18.webp',   dest: 'accessories/marteau_r18.webp' },
  { local: 'accessories/auger_r18.webp',              dest: 'accessories/tariere_r18.webp' },
  { local: 'accessories/grapple_r18.webp',            dest: 'accessories/grappin_r18.webp' },

  // Solaire
  { local: 'solar/kit_overview.webp',                 dest: 'solar/kit_overview.webp' },
  { local: 'solar/jinko_600w_tiger_neo.jpg',          dest: 'solar/jinko_panel.jpg' },
  { local: 'solar/deye_inverter.webp',                dest: 'solar/deye_inverter.webp' },
  { local: 'solar/battery_6fm250.webp',               dest: 'solar/battery.webp' },
  { local: 'solar/panel_detail.webp',                 dest: 'solar/panel_detail.webp' },
  { local: 'solar/solar_kits/jinko_600w_bifacial.webp', dest: 'solar/jinko_bifacial.webp' },

  // Maisons standard
  { local: 'houses/modular_standard/exterior_1.jpeg', dest: 'houses/standard/1.jpg' },
  { local: 'houses/modular_standard/exterior_2.jpeg', dest: 'houses/standard/2.jpg' },
  { local: 'houses/modular_standard/exterior_3.jpeg', dest: 'houses/standard/3.jpg' },
  { local: 'houses/modular_standard/exterior_4.jpeg', dest: 'houses/standard/4.jpg' },

  // Maisons premium
  { local: 'houses/modular_premium/exterior_1.jpg',   dest: 'houses/premium/1.jpg' },
  { local: 'houses/modular_premium/exterior_2.jpg',   dest: 'houses/premium/2.jpg' },
  { local: 'houses/modular_premium/exterior_3.jpg',   dest: 'houses/premium/3.jpg' },
  { local: 'houses/modular_premium/exterior_4.jpg',   dest: 'houses/premium/4.jpg' },

  // Camping car
  { local: 'houses/camping_car/exterior_main.webp',   dest: 'houses/camping_car/main.webp' },
  { local: 'houses/camping_car/exterior_front_side.jpg', dest: 'houses/camping_car/front.jpg' },
  { local: 'houses/camping_car/interior_living.jpg',  dest: 'houses/camping_car/interior.jpg' },
  { local: 'houses/camping_car/kitchen.jpg',          dest: 'houses/camping_car/kitchen.jpg' },

  // Documents PDF
  { local: 'documents/r18_pro_fiche_technique.pdf',   dest: 'documents/r18_pro_fiche.pdf' },
  { local: 'documents/r22_pro_fiche_technique.pdf',   dest: 'documents/r22_pro_fiche.pdf' },
  { local: 'documents/r32_pro_fiche_technique.pdf',   dest: 'documents/r32_pro_fiche.pdf' },
  { local: 'documents/r57_pro_fiche_technique.pdf',   dest: 'documents/r57_pro_fiche.pdf' },
  { local: 'documents/fiche_technique_maison_modulaire.pdf', dest: 'documents/maison_fiche.pdf' },
]

function contentType(filename: string): string {
  const ext = extname(filename).toLowerCase()
  if (ext === '.pdf')  return 'application/pdf'
  if (ext === '.svg')  return 'image/svg+xml'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.png')  return 'image/png'
  if (ext === '.avif') return 'image/avif'
  return 'image/jpeg'
}

async function getPublicUrl(dest: string): Promise<string> {
  const encoded = encodeURIComponent(dest).replace(/%2F/g, '%2F')
  return `https://firebasestorage.googleapis.com/v0/b/import2030.firebasestorage.app/o/${encoded}?alt=media`
}

async function upload() {
  console.log(`\n🚀 Upload de ${UPLOAD_MAP.length} fichiers vers Firebase Storage (import2030)...\n`)
  const results: Record<string, string> = {}
  let ok = 0, warn = 0, errors = 0

  for (const { local, dest } of UPLOAD_MAP) {
    const localPath = join(MEDIA_ROOT, local)
    if (!existsSync(localPath)) {
      console.warn(`  ⚠️  Introuvable : ${local}`)
      warn++
      continue
    }
    try {
      const fileBuffer = readFileSync(localPath)
      const file = bucket.file(dest)
      await file.save(fileBuffer, {
        metadata: { contentType: contentType(local) },
        public: true,
      })
      const url = await getPublicUrl(dest)
      results[dest] = url
      console.log(`  ✅ ${dest}`)
      ok++
    } catch (err: any) {
      console.error(`  ❌ ${dest} — ${err.message}`)
      errors++
    }
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`📊 Résultat : ${ok} ✅  ${warn} ⚠️  ${errors} ❌`)
  console.log(`${'─'.repeat(60)}\n`)

  // Export JSON pour importProducts
  const urlMapPath = join(PROJECT_ROOT, 'src', 'scripts', '_storage-urls.json')
  const { writeFileSync } = await import('fs')
  writeFileSync(urlMapPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`📁 URLs sauvegardées dans src/scripts/_storage-urls.json`)
  console.log(`   → Utilisé par importProducts.ts pour enrichir les documents Firestore\n`)
}

upload().catch(console.error)
