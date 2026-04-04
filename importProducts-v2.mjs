/**
 * importProducts-v2.mjs
 * Import complet des 20 produits → Firestore import2030
 * Prix d'achat réels + images Storage correctes
 *
 * Usage : node importProducts-v2.mjs
 * Prérequis : avoir lancé uploadMediaToStorage.ts avant
 */

import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = 'C:/DATA-MC-2030/97IMPORT'
const PRODUCTS_JSON = 'C:/DATA-MC-2030/MIGRATION_PACKAGE_FINAL/data/products.json'
const URL_MAP_PATH  = join(PROJECT_ROOT, 'src/scripts/_storage-urls.json')
const SA_PATH       = join(PROJECT_ROOT, 'service-account.json')

// ── Init Admin SDK ────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(SA_PATH, 'utf-8'))),
  storageBucket: 'import2030.firebasestorage.app',
})
const db = admin.firestore()

// ── Prix d'achat HT réels (source : référence-firebase.md) ───────
const PRIX_ACHAT = {
  'r18-pro':                     9538,
  'r22-pro':                    12150,
  'r32-pro':                    14296,
  'r57-pro':                    19923,
  'kit-solaire-10kw':            6146,
  'kit-solaire-12kw':            6915,
  'kit-solaire-20kw':           14608,
  'maison-modulaire-standard':   4308,
  'maison-modulaire-premium':    7631,
  'camping-car-deluxe-hybride': 41269,
  // Accessoires → prix sur demande (0 = "Prix sur demande" affiché)
}

// ── Numéros internes ─────────────────────────────────────────────
const NUMERO_INTERNE = {
  'r18-pro':                    'MP-R18-001',
  'r22-pro':                    'MP-R22-001',
  'r32-pro':                    'MP-R32-001',
  'r57-pro':                    'MP-R57-001',
  'maison-modulaire-standard':  'MS-20-001',
  'maison-modulaire-premium':   'MP-20-001',
  'camping-car-deluxe-hybride': 'CC-BYD-001',
  'kit-solaire-10kw':           'KS-10K-001',
  'kit-solaire-12kw':           'KS-12K-001',
  'kit-solaire-20kw':           'KS-20K-001',
  'godet-dents':                'ACC-GD-001',
  'godet-plat':                 'ACC-GC-001',
  'godet-inclinable':           'ACC-GI-001',
  'attache-rapide':             'ACC-AR-001',
  'pince-pouce':                'ACC-PP-001',
  'rateau':                     'ACC-RT-001',
  'ripper':                     'ACC-RP-001',
  'marteau-hydraulique':        'ACC-MH-001',
  'tariere':                    'ACC-TA-001',
  'grappin':                    'ACC-GP-001',
}

// ── Mapping catégorie JSON → Firestore ───────────────────────────
const CAT_MAP = {
  'Mini-pelles': 'mini-pelles',
  'Maisons':     'maisons',
  'Solaire':     'solaire',
  'Accessoires': 'accessoires',
}

// ── Images Storage par produit (chemins dest dans Storage) ───────
const IMAGES_MAP = {
  'r18-pro':   ['products/r18_pro/main.webp','products/r18_pro/side.webp','products/r18_pro/rear.webp','products/r18_pro/cab.webp'],
  'r22-pro':   ['products/r22_pro/main.webp','products/r22_pro/side.webp','products/r22_pro/rear.webp','products/r22_pro/cab.webp'],
  'r32-pro':   ['products/r32_pro/main.webp','products/r32_pro/side.webp'],
  'r57-pro':   ['products/r57_pro/main.webp'],
  'maison-modulaire-standard':  ['houses/standard/1.jpg','houses/standard/2.jpg','houses/standard/3.jpg','houses/standard/4.jpg'],
  'maison-modulaire-premium':   ['houses/premium/1.jpg','houses/premium/2.jpg','houses/premium/3.jpg','houses/premium/4.jpg'],
  'camping-car-deluxe-hybride': ['houses/camping_car/main.webp','houses/camping_car/front.jpg','houses/camping_car/interior.jpg','houses/camping_car/kitchen.jpg'],
  'kit-solaire-10kw':  ['solar/kit_overview.webp','solar/jinko_panel.jpg','solar/deye_inverter.webp'],
  'kit-solaire-12kw':  ['solar/kit_overview.webp','solar/jinko_bifacial.webp','solar/battery.webp'],
  'kit-solaire-20kw':  ['solar/kit_overview.webp','solar/panel_detail.webp','solar/deye_inverter.webp'],
  'godet-dents':        ['accessories/godet_dents.webp'],
  'godet-plat':         ['accessories/godet_plat.webp'],
  'godet-inclinable':   ['accessories/godet_inclinable.webp'],
  'attache-rapide':     ['accessories/grappin_r18.webp'],
  'pince-pouce':        ['accessories/grappin_r18.webp'],
  'rateau':             ['accessories/rateau.webp'],
  'ripper':             ['accessories/ripper.webp'],
  'marteau-hydraulique':['accessories/marteau_hydraulique.webp'],
  'tariere':            ['accessories/tariere_r18.webp'],
  'grappin':            ['accessories/grappin_r18.webp'],
}

// ── Notices PDF ──────────────────────────────────────────────────
const NOTICES = {
  'r18-pro': 'documents/r18_pro_fiche.pdf',
  'r22-pro': 'documents/r22_pro_fiche.pdf',
  'r32-pro': 'documents/r32_pro_fiche.pdf',
  'r57-pro': 'documents/r57_pro_fiche.pdf',
  'maison-modulaire-standard': 'documents/maison_fiche.pdf',
  'maison-modulaire-premium':  'documents/maison_fiche.pdf',
}

// ── Construire URL publique Storage ──────────────────────────────
function toUrl(path) {
  const enc = encodeURIComponent(path).replace(/%2F/g, '%2F')
  return `https://firebasestorage.googleapis.com/v0/b/import2030.firebasestorage.app/o/${enc}?alt=media`
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60))
  console.log('  IMPORT PRODUITS → Firestore import2030')
  console.log('═'.repeat(60))

  // Charger URL map si disponible
  let urlMap = {}
  if (existsSync(URL_MAP_PATH)) {
    urlMap = JSON.parse(readFileSync(URL_MAP_PATH, 'utf-8'))
    console.log(`\n📂 ${Object.keys(urlMap).length} URLs Storage chargées`)
  } else {
    console.log('\n⚠️  _storage-urls.json absent — URLs calculées statiquement')
    console.log('   Lance uploadMediaToStorage.ts d\'abord pour les vraies URLs\n')
  }

  // Charger products.json
  const products = JSON.parse(readFileSync(PRODUCTS_JSON, 'utf-8'))
  console.log(`\n📦 ${products.length} produits à importer\n`)

  // Nettoyer collection existante
  console.log('🗑️  Nettoyage...')
  const existing = await db.collection('products').get()
  if (!existing.empty) {
    let batch = db.batch()
    let c = 0
    for (const d of existing.docs) {
      batch.delete(d.ref)
      c++
      if (c % 500 === 0) { await batch.commit(); batch = db.batch() }
    }
    await batch.commit()
    console.log(`   ${existing.size} doc(s) supprimé(s)`)
  }

  // Importer
  let ok = 0, errors = 0
  console.log('\n⬆️  Import en cours...\n')

  for (const p of products) {
    // Construire URLs images
    const imgPaths = IMAGES_MAP[p.id] || []
    const images = imgPaths.map(path => urlMap[path] ?? toUrl(path))

    // Notice PDF
    const noticePath = NOTICES[p.id]
    const notice_url = noticePath ? (urlMap[noticePath] ?? toUrl(noticePath)) : ''

    const doc = {
      nom:            p.name,
      nom_chinois:    '',
      nom_anglais:    p.name,
      reference:      p.id,
      numero_interne: NUMERO_INTERNE[p.id] || '',
      categorie:      CAT_MAP[p.category] || p.category?.toLowerCase() || '',
      prix_achat:     PRIX_ACHAT[p.id] ?? 0,
      prix_achat_yuan: 0,
      actif:          p.active ?? true,
      description_fr: p.longDescription || p.description || '',
      description_en: p.description || '',
      description_zh: '',
      images,
      notice_url,
      video_url:      '',
      // Specs techniques brutes
      specs_raw:      p.specs || {},
      models:         p.models || [],        // tarifs accessoires par modèle
      sizes:          p.sizes || [],         // tailles maisons
      options:        p.options || [],       // options maisons
      // Dimensions (à compléter via admin)
      longueur_cm: 0, largeur_cm: 0, hauteur_cm: 0,
      poids_net_kg: 0, poids_brut_kg: 0,
      qte_pieces_par_unite: 1,
      matiere_fr: '', matiere_en: '', matiere_zh: '',
      code_hs: '', statut_ce: '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }

    try {
      await db.collection('products').doc(p.id).set(doc)
      const ref = NUMERO_INTERNE[p.id] || '—'
      const imgs = images.length
      console.log(`  ✅ ${p.id.padEnd(30)} ${ref.padEnd(14)} ${imgs} image(s)`)
      ok++
    } catch (err) {
      console.error(`  ❌ ${p.id} — ${err.message}`)
      errors++
    }
  }

  console.log('\n' + '═'.repeat(60))
  console.log(`📊 Résultat : ${ok} ✅  ${errors} ❌`)
  console.log('═'.repeat(60))
  if (ok > 0) {
    console.log('\n✅ Firestore prêt — relance npm run dev')
    console.log('ℹ️  À compléter via admin : nom_chinois, dimensions, prix yuan\n')
  }
  process.exit(0)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
