// scripts/import-catalogue-minipelles.js
// MISSION V44 — PHASE 2
// Import Excel → Firestore /products/ avec parsing des caractéristiques techniques.
//
// Usage :
//   node scripts/import-catalogue-minipelles.js          # dry-run (lecture seule)
//   node scripts/import-catalogue-minipelles.js --apply  # écriture réelle
//
// Décisions Michel V44.2 :
//   - Parsing : Option B (split par lignes vides → section 1 = data techniques, section 2+ = équipements)
//   - Champ : `caracteristiques: { donnees_techniques: [{label,valeur}], equipements: [string] }`
//   - Mode update : merge — préserve les champs existants si Excel a vide
//                   (sauf `caracteristiques` qui est toujours réécrit, étant nouveau)
//   - Path : data/Copie_de_catalogue-97import-20260423MINIPELLEOK.xlsx
//
// Pré-requis : firebase-admin-sdk.json à la racine du repo (gitignored).

import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const APPLY = process.argv.includes('--apply');
const XLSX_PATH = path.join(ROOT, 'data/Copie_de_catalogue-97import-20260423MINIPELLEOK.xlsx');
const BACKUP_DIR = path.join(ROOT, 'backups');

const serviceAccount = JSON.parse(
  readFileSync(path.join(ROOT, 'firebase-admin-sdk.json'), 'utf8'),
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseCaracteristiques(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.replace(/\r/g, '').trim();
  if (!trimmed) return null;

  const sections = trimmed.split(/\n\s*\n/);
  const donnees_techniques = [];
  const equipements = [];

  // Section 0 = données techniques (lignes label : valeur)
  if (sections[0]) {
    sections[0].split('\n').forEach((line) => {
      const l = line.trim();
      if (!l) return;
      const idx = l.indexOf(' : ');
      if (idx > 0) {
        const label = l.substring(0, idx).trim();
        const valeur = l.substring(idx + 3).trim();
        donnees_techniques.push({ label, valeur });
      } else {
        equipements.push(l);
      }
    });
  }

  // Sections 1+ = équipements
  for (let i = 1; i < sections.length; i++) {
    sections[i].split('\n').forEach((line) => {
      const l = line.trim();
      if (l) equipements.push(l);
    });
  }

  if (donnees_techniques.length === 0 && equipements.length === 0) return null;
  return { donnees_techniques, equipements };
}

function isEmptyValue(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  return false;
}

function parseNumber(v) {
  if (isEmptyValue(v)) return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  if (isEmptyValue(v)) return null;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'oui', 'yes', 'vrai'].includes(s)) return true;
  if (['false', '0', 'non', 'no', 'faux'].includes(s)) return false;
  return null;
}

function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) out[k] = sanitizeForFirestore(v);
    }
    return out;
  }
  return obj;
}

// ─── Lecture Excel ─────────────────────────────────────────────────────────

if (!existsSync(XLSX_PATH)) {
  console.error('❌ Fichier introuvable :', XLSX_PATH);
  console.error('   Copier le xlsx dans data/ avant exécution :');
  console.error('   cp ~/Downloads/Copie_de_catalogue-97import-20260423MINIPELLEOK.xlsx data/');
  process.exit(1);
}

const wb = xlsx.readFile(XLSX_PATH);
const sh = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sh, { header: 1, defval: '' });

console.log('═══ Import catalogue mini-pelles ═══');
console.log('Mode      :', APPLY ? '🔥 APPLY (écriture réelle)' : '🧪 DRY-RUN (lecture seule)');
console.log('Fichier   :', path.relative(ROOT, XLSX_PATH));
console.log('Sheet     :', wb.SheetNames[0]);
console.log('Lignes    :', rows.length);
console.log('');

// ─── Boucle produits ───────────────────────────────────────────────────────

const stats = { traites: 0, crees: 0, majs: 0, inchanges: 0, ignores: 0, erreurs: 0 };
const writes = []; // pour backup avant apply

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.every((v) => isEmptyValue(v))) continue;

  const reference = String(r[0] || '').trim();
  // Ignorer lignes "━━━ CATÉGORIE ━━━" et lignes sans référence
  if (!reference || reference.startsWith('━')) {
    stats.ignores++;
    continue;
  }

  stats.traites++;

  // Mapping colonnes Excel → champs Firestore
  const excelData = {
    reference,
    categorie: String(r[1] || '').trim(),
    nom_fr: String(r[2] || '').trim(),
    nom_en: String(r[3] || '').trim(),
    nom_zh: String(r[4] || '').trim(),
    description_fr: String(r[5] || '').trim(),
    description_en: String(r[6] || '').trim(),
    description_zh: String(r[7] || '').trim(),
    sous_categorie: String(r[8] || '').trim(),
    prix_achat_usd: parseNumber(r[9]),
    prix_achat_cny: parseNumber(r[10]),
    prix_achat_eur: parseNumber(r[11]),
    fournisseur: String(r[12] || '').trim(),
    contact_fournisseur: String(r[13] || '').trim(),
    image_principale: String(r[14] || '').trim(),
    actif: parseBool(r[15]),
    groupe_produit: String(r[16] || '').trim(),
    duplique_de: String(r[17] || '').trim(),
  };
  const caracteristiques = parseCaracteristiques(r[18]);

  // Doc Firestore actuel
  const ref = db.collection('products').doc(reference);
  let existing = null;
  let exists = false;
  try {
    const snap = await ref.get();
    exists = snap.exists;
    existing = exists ? snap.data() : null;
  } catch (err) {
    console.error(`❌ Erreur lecture ${reference} :`, err.message);
    stats.erreurs++;
    continue;
  }

  // Construction de l'update : préserver l'existant si Excel vide
  const update = {};
  for (const [k, v] of Object.entries(excelData)) {
    if (k === 'reference') continue; // doc id
    if (isEmptyValue(v)) continue;    // préserve existant
    if (existing && existing[k] === v) continue; // inchangé
    update[k] = v;
  }
  // caracteristiques : toujours réécrit (champ nouveau)
  if (caracteristiques) {
    update.caracteristiques = caracteristiques;
  }

  const action = !exists ? 'CRÉER' : Object.keys(update).length > 0 ? 'MAJ' : 'INCHANGÉ';
  if (action === 'CRÉER') stats.crees++;
  else if (action === 'MAJ') stats.majs++;
  else stats.inchanges++;

  // Log par produit
  const nomCourt = excelData.nom_fr || existing?.nom_fr || '?';
  const tagAction = action === 'CRÉER' ? '🆕' : action === 'MAJ' ? '🔁' : '✓';
  console.log(`${tagAction} ${reference.padEnd(15)} ${nomCourt.substring(0, 40).padEnd(40)} ${action}`);

  if (action !== 'INCHANGÉ') {
    const champsCount = Object.keys(update).length;
    const champs = Object.keys(update).slice(0, 6).join(', ');
    console.log(`     ${champsCount} champ(s) : ${champs}${champsCount > 6 ? '…' : ''}`);
    if (caracteristiques) {
      console.log(`     caracteristiques : ${caracteristiques.donnees_techniques.length} données + ${caracteristiques.equipements.length} équipements`);
    }
  }

  if (action !== 'INCHANGÉ') {
    writes.push({ reference, exists, before: existing, update });
  }
}

console.log('');
console.log('═══ Bilan ═══');
console.log(`  Traités    : ${stats.traites}`);
console.log(`  À créer    : ${stats.crees}`);
console.log(`  À MAJ      : ${stats.majs}`);
console.log(`  Inchangés  : ${stats.inchanges}`);
console.log(`  Ignorés    : ${stats.ignores}`);
console.log(`  Erreurs    : ${stats.erreurs}`);
console.log('');

// ─── Apply ─────────────────────────────────────────────────────────────────

if (!APPLY) {
  console.log('🧪 DRY-RUN terminé. Ajouter --apply pour écrire dans Firestore.');
  process.exit(0);
}

if (writes.length === 0) {
  console.log('Aucune écriture nécessaire.');
  process.exit(0);
}

// Backup avant écriture
mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `products-pre-import-minipelles-${stamp}.json`);
writeFileSync(
  backupPath,
  JSON.stringify(
    writes.map((w) => ({ reference: w.reference, exists: w.exists, before: w.before })),
    null,
    2,
  ),
);
console.log(`💾 Backup avant écriture : ${path.relative(ROOT, backupPath)}`);
console.log('');

console.log('🔥 Écriture en cours…');
const ts = admin.firestore.FieldValue.serverTimestamp();
let written = 0;
for (const w of writes) {
  try {
    await db.collection('products').doc(w.reference).set(
      sanitizeForFirestore({ ...w.update, updated_at: ts }),
      { merge: true },
    );
    written++;
  } catch (err) {
    console.error(`❌ Erreur écriture ${w.reference} :`, err.message);
    stats.erreurs++;
  }
}
console.log('');
console.log(`✅ ${written} produit(s) écrit(s).`);
console.log(`   Erreurs : ${stats.erreurs}`);
process.exit(0);
