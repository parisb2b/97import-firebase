/**
 * resetFirebase.ts — Reset complet Storage + Firestore + Upload + Import + Comptes
 * Usage : npx tsx src/scripts/resetFirebase.ts
 */

import admin from 'firebase-admin'
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, dirname, extname, relative } from 'path'
import { fileURLToPath } from 'url'
import { lookup } from 'mime-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..', '..')

// ── Init Admin SDK ─────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(join(PROJECT_ROOT, 'service-account.json')),
  storageBucket: 'import2030.firebasestorage.app',
})
const db = admin.firestore()
const bucket = admin.storage().bucket()
const auth = admin.auth()

// ══════════════════════════════════════════════════════════════
// ÉTAPE 1 — RESET STORAGE
// ══════════════════════════════════════════════════════════════
async function resetStorage() {
  console.log('\n═══ ÉTAPE 1 — RESET STORAGE ═══')
  try {
    const [files] = await bucket.getFiles()
    if (files.length === 0) {
      console.log('  Storage déjà vide.')
    } else {
      let count = 0
      for (const file of files) {
        await file.delete()
        count++
      }
      console.log(`  ${count} fichier(s) supprimé(s)`)
    }
    console.log('  Storage vidé ✅')
  } catch (err: any) {
    console.error('  Erreur reset storage:', err.message)
  }
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 2 — RESET FIRESTORE
// ══════════════════════════════════════════════════════════════
async function resetFirestore() {
  console.log('\n═══ ÉTAPE 2 — RESET FIRESTORE ═══')
  const collections = [
    'products', 'profiles', 'quotes', 'invoices', 'partners',
    'admin_params', 'site_content', 'counters', 'delivery_notes',
    'fees', 'commission_notes',
  ]
  for (const col of collections) {
    try {
      const snap = await db.collection(col).get()
      if (snap.empty) {
        console.log(`  ${col}: 0 docs (vide)`)
        continue
      }
      const batch = db.batch()
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      console.log(`  ${col}: ${snap.size} doc(s) supprimé(s) ✅`)
    } catch (err: any) {
      console.error(`  ${col}: erreur — ${err.message}`)
    }
  }
  console.log('  Firestore vidé ✅')
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 3 — UPLOAD MÉDIAS
// ══════════════════════════════════════════════════════════════
const MEDIA_ROOT = 'C:/DATA-MC-2030/MIGRATION_PACKAGE_FINAL/media'

function walkDir(dir: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full))
    } else {
      results.push(full)
    }
  }
  return results
}

function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  const mimeFromLib = lookup(filePath)
  if (mimeFromLib) return mimeFromLib
  const map: Record<string, string> = {
    '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.webm': 'video/webm',
    '.pdf': 'application/pdf', '.json': 'application/json',
  }
  return map[ext] || 'application/octet-stream'
}

async function uploadMedia() {
  console.log('\n═══ ÉTAPE 3 — UPLOAD MÉDIAS ═══')
  const allFiles = walkDir(MEDIA_ROOT)
  console.log(`  ${allFiles.length} fichiers trouvés dans ${MEDIA_ROOT}`)

  const storageUrls: Record<string, string> = {}
  let ok = 0, errors = 0

  for (const filePath of allFiles) {
    const relativePath = relative(MEDIA_ROOT, filePath).replace(/\\/g, '/')
    const contentType = getContentType(filePath)
    const buffer = readFileSync(filePath)

    try {
      const file = bucket.file(relativePath)
      await file.save(buffer, {
        metadata: { contentType },
        public: true,
      })
      const url = `https://firebasestorage.googleapis.com/v0/b/import2030.firebasestorage.app/o/${encodeURIComponent(relativePath)}?alt=media`
      storageUrls[relativePath] = url
      ok++
      console.log(`  ✅ ${relativePath}`)
    } catch (err: any) {
      errors++
      console.error(`  ❌ ${relativePath} — ${err.message}`)
    }
  }

  // Sauvegarder les URLs
  const urlsPath = join(__dirname, '_storage-urls.json')
  writeFileSync(urlsPath, JSON.stringify(storageUrls, null, 2), 'utf-8')

  console.log(`\n  📊 Upload : ${ok} ✅  ${errors} ❌`)
  console.log(`  URLs sauvegardées dans _storage-urls.json`)
  return storageUrls
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 4 — IMPORT PRODUITS
// ══════════════════════════════════════════════════════════════

const PRIX_ACHAT: Record<string, number> = {
  'r18-pro': 9538, 'r22-pro': 12150, 'r32-pro': 14296, 'r57-pro': 19923,
  'kit-solaire-10kw': 6146, 'kit-solaire-12kw': 6915, 'kit-solaire-20kw': 14608,
  'maison-modulaire-standard': 4308, 'maison-modulaire-premium': 7631,
  'camping-car-deluxe-hybride': 41269,
  'godet-dents': 0, 'godet-plat': 0, 'godet-inclinable': 0,
  'attache-rapide': 0, 'pince-pouce': 0, 'rateau': 0, 'ripper': 0,
  'marteau-hydraulique': 0, 'tariere': 0, 'grappin': 0,
}

const NUMERO_INTERNE: Record<string, string> = {
  'r18-pro': 'MP-R18-001', 'r22-pro': 'MP-R22-001', 'r32-pro': 'MP-R32-001', 'r57-pro': 'MP-R57-001',
  'maison-modulaire-standard': 'MS-20-001', 'maison-modulaire-premium': 'MP-20-001',
  'camping-car-deluxe-hybride': 'CC-BYD-001',
  'kit-solaire-10kw': 'KS-10K-001', 'kit-solaire-12kw': 'KS-12K-001', 'kit-solaire-20kw': 'KS-20K-001',
  'godet-dents': 'ACC-GD-001', 'godet-plat': 'ACC-GC-001', 'godet-inclinable': 'ACC-GI-001',
  'attache-rapide': 'ACC-AR-001', 'pince-pouce': 'ACC-PP-001', 'rateau': 'ACC-RT-001',
  'ripper': 'ACC-RP-001', 'marteau-hydraulique': 'ACC-MH-001', 'tariere': 'ACC-TA-001', 'grappin': 'ACC-GP-001',
}

const CATEGORIE_MAP: Record<string, string> = {
  'Mini-pelles': 'mini-pelles', 'Maisons': 'maisons',
  'Solaire': 'solaire', 'Accessoires': 'accessoires',
}

const IMAGE_DEFAUT: Record<string, string[]> = {
  'r18-pro': ['products/r18_pro.webp', 'products/r18_pro/main.webp', 'products/r18_pro/side.webp', 'products/r18_pro/rear.webp', 'products/r18_pro/cab.webp'],
  'r22-pro': ['products/r22_pro.webp', 'products/r22_pro/main.webp', 'products/r22_pro/side.webp', 'products/r22_pro/rear.webp', 'products/r22_pro/cab.webp'],
  'r32-pro': ['products/r32_pro.webp', 'products/r32_pro/main.webp', 'products/r32_pro/side.webp'],
  'r57-pro': ['products/r57_pro/main.webp'],
  'maison-modulaire-standard': ['houses/standard/1.jpg', 'houses/standard/2.jpg', 'houses/standard/3.jpg', 'houses/standard/4.jpg'],
  'maison-modulaire-premium': ['houses/premium/1.jpg', 'houses/premium/2.jpg', 'houses/premium/3.jpg', 'houses/premium/4.jpg'],
  'camping-car-deluxe-hybride': ['houses/camping_car/main.webp', 'houses/camping_car/front.jpg', 'houses/camping_car/interior.jpg', 'houses/camping_car/kitchen.jpg'],
  'kit-solaire-10kw': ['solar/kit_overview.webp', 'solar/jinko_panel.jpg', 'solar/deye_inverter.webp'],
  'kit-solaire-12kw': ['solar/kit_overview.webp', 'solar/jinko_bifacial.webp', 'solar/battery.webp'],
  'kit-solaire-20kw': ['solar/kit_overview.webp', 'solar/panel_detail.webp', 'solar/deye_inverter.webp'],
  'godet-dents': ['accessories/godet_dents.webp'], 'godet-plat': ['accessories/godet_plat.webp'],
  'godet-inclinable': ['accessories/godet_inclinable.webp'],
  'attache-rapide': [], 'pince-pouce': [],
  'rateau': ['accessories/rateau.webp'], 'ripper': ['accessories/ripper.webp'],
  'marteau-hydraulique': ['accessories/marteau_hydraulique.webp'],
  'tariere': ['accessories/tariere.webp'], 'grappin': ['accessories/grappin.webp'],
}

const NOTICE_PDF: Record<string, string> = {
  'r18-pro': 'documents/r18_pro_fiche.pdf', 'r22-pro': 'documents/r22_pro_fiche.pdf',
  'r32-pro': 'documents/r32_pro_fiche.pdf', 'r57-pro': 'documents/r57_pro_fiche.pdf',
  'maison-modulaire-standard': 'documents/maison_fiche.pdf', 'maison-modulaire-premium': 'documents/maison_fiche.pdf',
}

async function importProducts(storageUrls: Record<string, string>) {
  console.log('\n═══ ÉTAPE 4 — IMPORT PRODUITS ═══')

  const rawProducts = JSON.parse(
    readFileSync('C:/DATA-MC-2030/MIGRATION_PACKAGE_FINAL/data/products.json', 'utf-8')
  )

  const BASE_URL = 'https://firebasestorage.googleapis.com/v0/b/import2030.firebasestorage.app/o'
  function toStorageUrl(path: string): string {
    return `${BASE_URL}/${encodeURIComponent(path)}?alt=media`
  }

  let ok = 0
  for (const p of rawProducts) {
    const prixAchat = PRIX_ACHAT[p.id] ?? 0
    const imagePaths = IMAGE_DEFAUT[p.id] || []
    const imageUrls = imagePaths.map((path: string) => storageUrls[path] ?? toStorageUrl(path))
    const noticePath = NOTICE_PDF[p.id]
    const noticeUrl = noticePath ? (storageUrls[noticePath] ?? toStorageUrl(noticePath)) : ''

    const firestoreDoc = {
      nom: p.name,
      nom_chinois: '',
      nom_anglais: p.name,
      reference: p.id,
      numero_interne: NUMERO_INTERNE[p.id] || '',
      categorie: CATEGORIE_MAP[p.category] || p.category,
      prix_achat: prixAchat,
      prix_achat_yuan: 0,
      actif: p.active ?? true,
      description_fr: p.longDescription || p.description || '',
      description_en: p.longDescription || p.description || '',
      description_zh: '',
      features: p.features || [],
      images: imageUrls,
      notice_url: noticeUrl,
      video_url: '',
      models: p.models || [],
      sizes: p.sizes || [],
      longueur_cm: 0, largeur_cm: 0, hauteur_cm: 0,
      poids_net_kg: 0, poids_brut_kg: 0, qte_pieces_par_unite: 1,
      matiere_fr: '', matiere_en: '', matiere_zh: '',
      code_hs: '', statut_ce: '',
      specs_raw: p.specs || {},
      detailed_specs: p.detailedSpecs || {},
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }

    try {
      await db.collection('products').doc(p.id).set(firestoreDoc)
      console.log(`  ✅ ${p.id.padEnd(32)} ${(NUMERO_INTERNE[p.id] || '—').padEnd(14)} ${imageUrls.length} img  ${prixAchat}€`)
      ok++
    } catch (err: any) {
      console.error(`  ❌ ${p.id} — ${err.message}`)
    }
  }
  console.log(`  📊 Produits importés : ${ok}/20`)
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 5 — INIT FIRESTORE (admin_params + counters)
// ══════════════════════════════════════════════════════════════
async function initFirestore() {
  console.log('\n═══ ÉTAPE 5 — INIT FIRESTORE ═══')

  const docs: { path: string; data: any }[] = [
    { path: 'counters/devis', data: { value: 0 } },
    {
      path: 'admin_params/emetteur_pro', data: {
        nom: 'LUXENT LIMITED', adresse: '2ND FLOOR COLLEGE HOUSE',
        adresse2: '17 KING EDWARDS ROAD RUISLIP', ville: 'HA4 7AE LONDON',
        pays: 'Royaume-Uni', siret: '14852122', email: 'luxent@ltd-uk.eu', iban: '', bic: '',
      },
    },
    {
      path: 'admin_params/emetteur_perso', data: {
        nom: 'Chen Michel', adresse: 'À compléter', ville: 'À compléter',
        pays: 'France', email: 'parisb2b@gmail.com', iban: '', bic: '',
      },
    },
    { path: 'admin_params/multiplicateurs', data: { user: 2, partner: 1.2 } },
    { path: 'admin_params/config_acompte', data: { max_acomptes: 3 } },
    { path: 'admin_params/rib_pro', data: { label: 'Compte professionnel', url: '' } },
    { path: 'admin_params/rib_perso', data: { label: 'Compte particulier', url: '' } },
    {
      path: 'site_content/banniere', data: {
        texte: '-50% PAR RAPPORT AU PRIX DE VENTE EN MARTINIQUE', actif: true, couleur: '#2563EB',
      },
    },
    { path: 'partners/TD', data: { nom: 'Thierry D.', code: 'TD', email: '', telephone: '', actif: true } },
    { path: 'partners/JM', data: { nom: 'Jean-Marc V.', code: 'JM', email: '', telephone: '', actif: true } },
    { path: 'partners/MC', data: { nom: 'MC', code: 'MC', email: '', telephone: '', actif: true } },
  ]

  for (const { path, data } of docs) {
    const [col, docId] = path.split('/')
    await db.collection(col).doc(docId).set(data)
    console.log(`  ✅ ${path}`)
  }
  console.log(`  📊 ${docs.length} documents créés`)
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 6 — COMPTES TEST (Auth + profiles)
// ══════════════════════════════════════════════════════════════
const TEST_ACCOUNTS = [
  { email: 'admin@97import.com',       role: 'admin',   first_name: 'Admin',  last_name: '97import' },
  { email: 'client@97import.com',      role: 'user',    first_name: 'Jean',   last_name: 'Dupont' },
  { email: 'vip@97import.com',         role: 'vip',     first_name: 'Marie',  last_name: 'Martin' },
  { email: 'partenaire@97import.com',  role: 'partner', first_name: 'Pierre', last_name: 'Bernard' },
  { email: 'client2@97import.com',     role: 'user',    first_name: 'Sophie', last_name: 'Leblanc' },
]

async function createTestAccounts() {
  console.log('\n═══ ÉTAPE 6 — COMPTES TEST ═══')

  for (const account of TEST_ACCOUNTS) {
    try {
      // Supprimer si existe déjà
      try {
        const existing = await auth.getUserByEmail(account.email)
        await auth.deleteUser(existing.uid)
        console.log(`  🗑️  ${account.email} — ancien compte supprimé`)
      } catch {
        // N'existe pas, OK
      }

      // Créer le compte Auth
      const userRecord = await auth.createUser({
        email: account.email,
        password: '20262026',
        displayName: `${account.first_name} ${account.last_name}`,
      })

      // Créer le profil Firestore
      await db.collection('profiles').doc(userRecord.uid).set({
        email: account.email,
        role: account.role,
        first_name: account.first_name,
        last_name: account.last_name,
        phone: '',
        adresse_facturation: '',
        ville_facturation: '',
        cp_facturation: '',
        pays_facturation: 'France',
        adresse_livraison: '',
        ville_livraison: '',
        cp_livraison: '',
        pays_livraison: 'France',
        adresse_livraison_identique: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`  ✅ ${account.email.padEnd(30)} ${account.role.padEnd(8)} uid: ${userRecord.uid}`)
    } catch (err: any) {
      console.error(`  ❌ ${account.email} — ${err.message}`)
    }
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN — Exécution séquentielle
// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   RESET COMPLET 97import — Firebase      ║')
  console.log('╚══════════════════════════════════════════╝')

  await resetStorage()
  await resetFirestore()
  const storageUrls = await uploadMedia()
  await importProducts(storageUrls)
  await initFirestore()
  await createTestAccounts()

  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║   ✅ RESET COMPLET TERMINÉ               ║')
  console.log('╚══════════════════════════════════════════╝\n')

  process.exit(0)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
