import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// Firebase config
const app = initializeApp({
  apiKey: 'AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo',
  authDomain: 'importok-6ef77.firebaseapp.com',
  projectId: 'importok-6ef77',
  storageBucket: 'importok-6ef77.firebasestorage.app',
  messagingSenderId: '694030851164',
  appId: '1:694030851164:web:1a534b65a93f8d816f1a99',
});
const db = getFirestore(app);

// Column mapping (1-indexed)
const COLUMN_MAP = {
  1: 'numero_interne',
  2: 'nom_fr',
  3: 'nom_chinois',
  4: 'nom_en',
  5: 'categorie',
  6: 'gamme',
  7: 'type',
  8: 'sous_type',
  9: 'machine_compatible',
  10: 'prix_achat_cny',
  11: 'prix_achat',
  12: 'prix_public',
  13: 'prix_partenaire',
  14: 'prix_kit',
  15: 'option_payante',
  16: 'surcout',
  17: 'nom_option',
  18: 'attribut_suffixe',
  19: 'ref_parente',
  20: 'option_defaut',
  21: 'option_active',
  22: 'longueur_cm',
  23: 'largeur_cm',
  24: 'hauteur_cm',
  25: 'volume_m3',
  26: 'poids_net_kg',
  27: 'poids_brut_kg',
  28: 'qte_pieces',
  29: 'marque',
  30: 'matiere_fr',
  31: 'matiere_zh',
  32: 'matiere_en',
  33: 'code_hs',
  34: 'est_kit',
  35: 'composition_kit',
  36: 'description_fr',
  37: 'video_url',
  38: 'photos',
  39: 'pdf_fiche',
  40: 'ordre_affichage',
  41: 'badge',
  42: 'note_client',
  43: 'renvoi_vers',
  44: 'visible_site',
  45: 'prix_visible_role',
  46: 'fournisseur',
  47: 'fournisseur_alt',
  48: 'source',
  49: 'ville_origine_cn',
  50: 'usage_zh',
  51: 'usage_en',
  52: 'usage_fr',
  53: 'reference_usine',
  54: 'unite_export',
  55: 'ce_certification',
  56: 'num_cont_physique',
  57: 'ref_cont_interne',
  58: 'date_depart_est',
  59: 'date_arrivee_est',
  60: 'voyage_number',
  61: 'bl_number',
  62: 'seal_number',
  63: 'type_conteneur',
  64: 'port_chargement',
  65: 'port_destination',
  66: 'stock_achete',
  67: 'stock_vendu',
  68: 'stock_restant',
  69: 'stock_destination',
};

// Boolean fields
const BOOL_FIELDS = new Set([
  'option_payante', 'option_defaut', 'option_active', 'est_kit', 'visible_site',
]);

// Numeric fields
const NUM_FIELDS = new Set([
  'prix_achat_cny', 'prix_achat', 'prix_public', 'prix_partenaire', 'prix_kit',
  'surcout', 'longueur_cm', 'largeur_cm', 'hauteur_cm', 'volume_m3',
  'poids_net_kg', 'poids_brut_kg', 'qte_pieces', 'ordre_affichage',
  'stock_achete', 'stock_vendu', 'stock_restant',
]);

function convertValue(field, raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const str = String(raw).trim();
  if (str === '') return undefined;

  if (BOOL_FIELDS.has(field)) {
    return str.toUpperCase() === 'OUI' || str === 'true' || str === '1';
  }
  if (NUM_FIELDS.has(field)) {
    const n = parseFloat(str.replace(/\s/g, '').replace(',', '.'));
    return isNaN(n) ? undefined : n;
  }
  return str;
}

async function main() {
  const filePath = process.env.HOME + '/97import-OK/data/97import-catalogue-v4.xlsx';
  console.log(`Reading ${filePath}...`);

  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });

  // Find the right sheet
  const sheetName = wb.SheetNames.find(n =>
    n.toLowerCase().includes('catalogue') || n.toLowerCase().includes('produit')
  ) || wb.SheetNames[0];
  console.log(`Sheet: "${sheetName}"`);

  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Find header row (row with "Ref Interne" or similar in col A)
  let headerRow = 5; // default row 6 (0-indexed = 5)
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const cell = String(rows[i]?.[0] || '').toLowerCase();
    if (cell.includes('ref') && (cell.includes('interne') || cell.includes('int'))) {
      headerRow = i;
      break;
    }
  }
  console.log(`Header row: ${headerRow + 1} (0-indexed: ${headerRow})`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[0]) { skipped++; continue; }

    const refInterne = String(row[0]).trim();
    if (!refInterne || refInterne.startsWith('--') || refInterne.startsWith('==')) {
      skipped++;
      continue;
    }

    // Build document
    const product = {};
    for (const [colIdx, field] of Object.entries(COLUMN_MAP)) {
      const rawVal = row[parseInt(colIdx) - 1];
      const val = convertValue(field, rawVal);
      if (val !== undefined) {
        product[field] = val;
      }
    }

    // Also set nom = nom_fr for compatibility
    if (product.nom_fr) product.nom = product.nom_fr;

    // Set metadata
    product.actif = product.visible_site !== false;
    product.createdAt = serverTimestamp();
    product.updatedAt = serverTimestamp();

    // Sanitize ID
    const docId = refInterne.replace(/[\/\\\.#\[\]]/g, '-');

    try {
      await setDoc(doc(db, 'products', docId), product);
      imported++;
      if (imported % 10 === 0) process.stdout.write(`  ${imported} produits importés...\r`);
    } catch (err) {
      console.error(`  ❌ Erreur ${refInterne}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Import terminé: ${imported} produits importés, ${skipped} lignes ignorées, ${errors} erreurs`);

  // ÉTAPE 4: pricing params
  console.log('\nÉcriture admin_params/pricing...');
  try {
    await setDoc(doc(db, 'admin_params', 'pricing'), {
      multiplicateur_public: 2.0,
      multiplicateur_partenaire: 1.2,
      devise: 'EUR',
      taux_rmb_eur: 7.82,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ admin_params/pricing créé');
  } catch (err) {
    console.error('❌ Erreur pricing:', err.message);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
