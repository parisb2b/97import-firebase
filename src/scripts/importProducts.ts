/**
 * Import produits → Firestore (import2030)
 * Utilise firebase-admin — contourne les règles de sécurité
 *
 * LOGIQUE PRIX v6.2 (CORRIGÉ) :
 *   - Le champ `price` de products.json est en EUROS (cf. priceDisplay: "12 400,00 EUR HT")
 *   - prix_achat (Firestore) = price tel quel (EUR)
 *   - prix_achat_yuan (Firestore) = price × 8 (conversion EUR → RMB)
 *   - Taux : 1 EUR = 8 RMB
 *
 * Usage : npx tsx src/scripts/importProducts.ts
 * Prérequis : avoir exécuté uploadMediaToStorage.ts avant (URLs images)
 */

import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..', '..')

// ── Init Admin SDK ─────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(join(PROJECT_ROOT, 'service-account.json')),
})
const db = admin.firestore()

// ── Taux de change officiel ────────────────────────────────
// 1 EUR = 8 RMB — EUR est la monnaie pivot
const TAUX_EUR_RMB = 8

// ── Numéros internes ───────────────────────────────────────
const NUMERO_INTERNE: Record<string, string> = {
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

// ── Catégories normalisées ──────────────────────────────────
const CATEGORIE_MAP: Record<string, string> = {
  'Mini-pelles': 'mini-pelles',
  'Maisons':     'maisons',
  'Solaire':     'solaire',
  'Accessoires': 'accessoires',
}

// ── Images principales par produit ─────────────────────────
const IMAGE_DEFAUT: Record<string, string[]> = {
  'r18-pro':                    ['products/r18_pro.webp', 'products/r18_pro/main.webp', 'products/r18_pro/side.webp', 'products/r18_pro/rear.webp', 'products/r18_pro/cab.webp'],
  'r22-pro':                    ['products/r22_pro.webp', 'products/r22_pro/main.webp', 'products/r22_pro/side.webp', 'products/r22_pro/rear.webp', 'products/r22_pro/cab.webp'],
  'r32-pro':                    ['products/r32_pro.webp', 'products/r32_pro/main.webp', 'products/r32_pro/side.webp'],
  'r57-pro':                    ['products/r57_pro/main.webp'],
  'maison-modulaire-standard':  ['houses/standard/1.jpg', 'houses/standard/2.jpg', 'houses/standard/3.jpg', 'houses/standard/4.jpg'],
  'maison-modulaire-premium':   ['houses/premium/1.jpg', 'houses/premium/2.jpg', 'houses/premium/3.jpg', 'houses/premium/4.jpg'],
  'camping-car-deluxe-hybride': ['houses/camping_car/main.webp', 'houses/camping_car/front.jpg', 'houses/camping_car/interior.jpg', 'houses/camping_car/kitchen.jpg'],
  'kit-solaire-10kw':           ['solar/kit_overview.webp', 'solar/jinko_panel.jpg', 'solar/deye_inverter.webp'],
  'kit-solaire-12kw':           ['solar/kit_overview.webp', 'solar/jinko_bifacial.webp', 'solar/battery.webp'],
  'kit-solaire-20kw':           ['solar/kit_overview.webp', 'solar/panel_detail.webp', 'solar/deye_inverter.webp'],
  'godet-dents':                ['accessories/godet_dents.webp'],
  'godet-plat':                 ['accessories/godet_plat.webp'],
  'godet-inclinable':           ['accessories/godet_inclinable.webp'],
  'attache-rapide':             [],
  'pince-pouce':                [],
  'rateau':                     ['accessories/rateau.webp'],
  'ripper':                     ['accessories/ripper.webp'],
  'marteau-hydraulique':        ['accessories/marteau_hydraulique.webp'],
  'tariere':                    ['accessories/tariere.webp'],
  'grappin':                    ['accessories/grappin.webp'],
}

// ── Notices PDF par produit ────────────────────────────────
const NOTICE_PDF: Record<string, string> = {
  'r18-pro': 'documents/r18_pro_fiche.pdf',
  'r22-pro': 'documents/r22_pro_fiche.pdf',
  'r32-pro': 'documents/r32_pro_fiche.pdf',
  'r57-pro': 'documents/r57_pro_fiche.pdf',
  'maison-modulaire-standard': 'documents/maison_fiche.pdf',
  'maison-modulaire-premium':  'documents/maison_fiche.pdf',
}

const BASE_URL = 'https://firebasestorage.googleapis.com/v0/b/import2030.firebasestorage.app/o'

function toStorageUrl(path: string): string {
  const encoded = encodeURIComponent(path).replace(/%2F/g, '%2F')
  return `${BASE_URL}/${encoded}?alt=media`
}

async function importProducts() {
  // Charger les URLs depuis le fichier généré par uploadMediaToStorage
  const urlMapPath = join(__dirname, '_storage-urls.json')
  let storageUrls: Record<string, string> = {}
  if (existsSync(urlMapPath)) {
    storageUrls = JSON.parse(readFileSync(urlMapPath, 'utf-8'))
    console.log(`📂 URLs Storage chargées depuis _storage-urls.json (${Object.keys(storageUrls).length} fichiers)\n`)
  }

  // Charger les produits source
  const rawProducts = JSON.parse(
    readFileSync(
      'C:/DATA-MC-2030/MIGRATION_PACKAGE_FINAL/data/products.json',
      'utf-8'
    )
  )

  console.log(`📦 Import de ${rawProducts.length} produits dans Firestore (import2030)`)
  console.log(`💱 Taux : 1 EUR = ${TAUX_EUR_RMB} RMB — Source JSON en EUR (monnaie pivot)\n`)

  // Supprimer les anciens documents
  console.log('🗑️  Nettoyage des anciens produits...')
  const existing = await db.collection('products').get()
  const batch = db.batch()
  existing.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
  console.log(`   ${existing.size} document(s) supprimé(s)\n`)

  // Importer les nouveaux
  let ok = 0, errors = 0

  for (const p of rawProducts) {
    // ── PRIX : source = p.price (EUR HT, cf. priceDisplay "EUR HT") ──
    // prix_achat = EUR direct (monnaie pivot)
    // prix_achat_yuan = EUR × 8 (conversion vers RMB)
    const prixAchat = p.price || 0              // EUR HT
    const prixYuan  = prixAchat > 0 ? Math.round(prixAchat * TAUX_EUR_RMB) : 0  // RMB

    // Construire les URLs images depuis Storage
    const imagePaths = IMAGE_DEFAUT[p.id] || []
    const imageUrls  = imagePaths.map(path =>
      storageUrls[path] ?? toStorageUrl(path)
    )

    // Notice PDF
    const noticePath = NOTICE_PDF[p.id]
    const noticeUrl  = noticePath
      ? (storageUrls[noticePath] ?? toStorageUrl(noticePath))
      : ''

    const firestoreDoc = {
      // Identité
      nom:            p.name,
      nom_chinois:    '',
      nom_anglais:    p.name,
      reference:      p.id,
      numero_interne: NUMERO_INTERNE[p.id] || '',
      categorie:      CATEGORIE_MAP[p.category] || p.category,

      // Prix — source : products.json price (RMB) / TAUX
      prix_achat:       prixAchat,         // EUR (arrondi)
      prix_achat_yuan:  prixYuan,          // RMB original

      // Statut
      actif: p.active ?? true,

      // Description complète (UTF-8 preservé)
      description_fr: p.longDescription || p.description || '',
      description_en: p.longDescription || p.description || '',
      description_zh: '',

      // Caractéristiques clés (features[])
      features: p.features || [],

      // Médias Firebase Storage
      images:     imageUrls,
      notice_url: noticeUrl,
      video_url:  '',

      // Dimensions (à compléter via back-office)
      longueur_cm:           0,
      largeur_cm:            0,
      hauteur_cm:            0,
      poids_net_kg:          0,
      poids_brut_kg:         0,
      qte_pieces_par_unite:  1,

      // Matière
      matiere_fr: '',
      matiere_en: '',
      matiere_zh: '',

      // Douane
      code_hs:   '',
      statut_ce: '',

      // Specs techniques — résumé rapide (5 champs clés)
      specs_raw: p.specs || {},

      // Specs détaillées complètes (tableaux par section : Moteur, Dimensions, Hydraulique...)
      detailed_specs: p.detailedSpecs || {},

      // Timestamps
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }

    try {
      await db.collection('products').doc(p.id).set(firestoreDoc)
      const prixInfo = prixAchat > 0
        ? `${prixAchat}€ = ¥${prixYuan} | user ×2 = ${prixAchat * 2}€ | partner ×1.2 = ${Math.round(prixAchat * 1.2)}€`
        : 'sur demande'
      console.log(
        `  ✅ ${p.id.padEnd(32)} ${(NUMERO_INTERNE[p.id] || '—').padEnd(14)} ` +
        `${imageUrls.length} img  ${prixInfo}`
      )
      ok++
    } catch (err: any) {
      console.error(`  ❌ ${p.id} — ${err.message}`)
      errors++
    }
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`📊 Résultat : ${ok} ✅  ${errors} ❌`)
  console.log(`${'─'.repeat(70)}`)
  console.log('\n✅ Firestore prêt — produits importés avec prix RMB/EUR et specs détaillées')
  console.log('ℹ️  À compléter via back-office : nom_chinois, dimensions\n')

  process.exit(0)
}

importProducts().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
