// scripts/translate-products.js
// MISSION V44 — Phase 3.B
// Bulk traduction DeepL FR → EN/ZH des champs textes vides + migration
// schema bilingue caracteristiques.
//
// Usage :
//   node scripts/translate-products.js          # dry-run
//   node scripts/translate-products.js --apply  # exécution
//
// Convention : DeepL direct depuis Node (pas via proxy Vercel).
// La clé est lue depuis .env (DEEPL_API_KEY ou VITE_DEEPL_API_KEY/_KEY).

import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = path.join(ROOT, 'backups');

// ─── Lecture clé DeepL depuis .env ─────────────────────────────────────────

function readEnvKey() {
  const candidates = ['.env.local', '.env.production', '.env'];
  for (const f of candidates) {
    const p = path.join(ROOT, f);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*(DEEPL_API_KEY|VITE_DEEPL_API_KEY|VITE_DEEPL_KEY)\s*=\s*"?([^"\n\r]+)"?/);
      if (m) return { key: m[2].trim(), src: `${f}:${m[1]}` };
    }
  }
  return null;
}

const found = readEnvKey();
if (!found) {
  console.error('❌ Clé DeepL introuvable dans .env / .env.local / .env.production');
  console.error('   Cherche : DEEPL_API_KEY, VITE_DEEPL_API_KEY ou VITE_DEEPL_KEY');
  process.exit(1);
}
const DEEPL_KEY = found.key;
const IS_FREE = DEEPL_KEY.endsWith(':fx');
const DEEPL_URL = IS_FREE ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
console.log('═══ Bulk traduction DeepL ═══');
console.log('Mode      :', APPLY ? '🔥 APPLY' : '🧪 DRY-RUN');
console.log('Clé src   :', found.src);
console.log('Endpoint  :', DEEPL_URL, IS_FREE ? '(Free)' : '(Pro)');
console.log('');

// ─── Firebase ──────────────────────────────────────────────────────────────

const serviceAccount = JSON.parse(readFileSync(path.join(ROOT, 'firebase-admin-sdk.json'), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── DeepL helpers ─────────────────────────────────────────────────────────

const stats = { calls: 0, chars: 0, errors: 0 };

async function translateBatch(texts, target) {
  if (!texts || texts.length === 0) return [];
  const params = new URLSearchParams();
  params.set('source_lang', 'FR');
  params.set('target_lang', target); // 'EN' ou 'ZH'
  for (const t of texts) params.append('text', t);

  stats.calls++;
  stats.chars += texts.reduce((s, t) => s + t.length, 0);
  try {
    const res = await fetch(DEEPL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status} — ${errText.substring(0, 200)}`);
    }
    const data = await res.json();
    return (data.translations || []).map((t) => t.text || '');
  } catch (err) {
    stats.errors++;
    console.error(`  ❌ DeepL ${target} :`, err.message);
    return texts.map(() => ''); // retourne des chaînes vides en cas d'erreur
  }
}

// ─── Helpers schema caracteristiques ───────────────────────────────────────

function migrateCaracteristiques(c) {
  if (!c || typeof c !== 'object') return null;

  // donnees_techniques : [{label, valeur}] → [{label_fr, label_en, label_zh, valeur}]
  const dt = (c.donnees_techniques || []).map((d) => {
    const out = { valeur: d.valeur || '' };
    if (d.label_fr || d.label_en || d.label_zh) {
      out.label_fr = d.label_fr || d.label || '';
      out.label_en = d.label_en || '';
      out.label_zh = d.label_zh || '';
    } else {
      out.label_fr = d.label || '';
      out.label_en = '';
      out.label_zh = '';
    }
    return out;
  });

  // equipements (string[]) → equipements_fr/en/zh
  let equipements_fr = c.equipements_fr || (Array.isArray(c.equipements) ? c.equipements : []);
  const equipements_en = c.equipements_en || [];
  const equipements_zh = c.equipements_zh || [];

  return { donnees_techniques: dt, equipements_fr, equipements_en, equipements_zh };
}

// ─── Champs simples à traduire ─────────────────────────────────────────────

const SIMPLE_FIELDS = [
  ['nom_fr', 'nom_en', 'nom_zh'],
  ['description_fr', 'description_en', 'description_zh'],
  ['description_courte_fr', 'description_courte_en', 'description_courte_zh'],
  ['usage_fr', 'usage_en', 'usage_zh'],
  ['matiere_fr', 'matiere_en', 'matiere_zh'],
];

// ─── Boucle produits ───────────────────────────────────────────────────────

const productsSnap = await db.collection('products').get();
const writes = [];

for (const doc of productsSnap.docs) {
  const ref = doc.id;
  const d = doc.data();
  const update = {};

  // 1. Champs simples
  const simpleFrTexts = []; // textes FR à traduire
  const simpleSlots = [];   // [{fieldEn, fieldZh}, ...] correspondants
  for (const [fr, en, zh] of SIMPLE_FIELDS) {
    const txt = (d[fr] || '').trim();
    if (!txt) continue;
    const enEmpty = !d[en] || !String(d[en]).trim();
    const zhEmpty = !d[zh] || !String(d[zh]).trim();
    if (enEmpty || zhEmpty) {
      simpleFrTexts.push(txt);
      simpleSlots.push({ fieldEn: enEmpty ? en : null, fieldZh: zhEmpty ? zh : null });
    }
  }

  // 2. caracteristiques migration + traduction
  const cMig = migrateCaracteristiques(d.caracteristiques);
  let needsCaracUpdate = false;
  let dtLabelsToTranslate = [];          // FR labels nécessitant EN ou ZH
  let dtLabelSlots = [];                 // index correspondants
  let equipFrToTranslate = [];           // FR équipements nécessitant EN ou ZH
  let equipSlots = [];

  if (cMig) {
    // Détection : nouveau schema requis ?
    const wasOldSchema = d.caracteristiques && (
      (Array.isArray(d.caracteristiques.equipements) && !d.caracteristiques.equipements_fr) ||
      (Array.isArray(d.caracteristiques.donnees_techniques) && d.caracteristiques.donnees_techniques.some((x) => 'label' in x && !('label_fr' in x)))
    );
    if (wasOldSchema) needsCaracUpdate = true;

    // Labels données techniques
    cMig.donnees_techniques.forEach((dt, i) => {
      const fr = (dt.label_fr || '').trim();
      if (!fr) return;
      const enEmpty = !dt.label_en || !dt.label_en.trim();
      const zhEmpty = !dt.label_zh || !dt.label_zh.trim();
      if (enEmpty || zhEmpty) {
        dtLabelsToTranslate.push(fr);
        dtLabelSlots.push({ i, enEmpty, zhEmpty });
        needsCaracUpdate = true;
      }
    });

    // Équipements
    if (cMig.equipements_fr.length > 0) {
      const enMissing = cMig.equipements_en.length === 0;
      const zhMissing = cMig.equipements_zh.length === 0;
      if (enMissing || zhMissing) {
        equipFrToTranslate = cMig.equipements_fr.slice();
        equipSlots = { enMissing, zhMissing };
        needsCaracUpdate = true;
      }
    }
  }

  if (simpleFrTexts.length === 0 && !needsCaracUpdate) continue;

  console.log(`🔁 ${ref.padEnd(15)} ${(d.nom_fr || '?').substring(0, 35).padEnd(35)}  ${simpleFrTexts.length} simple(s) + ${dtLabelsToTranslate.length} label(s) + ${equipFrToTranslate.length} équip.`);

  if (!APPLY) {
    writes.push({ ref, plan: { simple: simpleFrTexts.length, labels: dtLabelsToTranslate.length, equip: equipFrToTranslate.length } });
    continue;
  }

  // Traductions DeepL
  const [enSimple, zhSimple] = simpleFrTexts.length > 0
    ? await Promise.all([translateBatch(simpleFrTexts, 'EN'), translateBatch(simpleFrTexts, 'ZH')])
    : [[], []];

  for (let i = 0; i < simpleSlots.length; i++) {
    const slot = simpleSlots[i];
    if (slot.fieldEn && enSimple[i]) update[slot.fieldEn] = enSimple[i];
    if (slot.fieldZh && zhSimple[i]) update[slot.fieldZh] = zhSimple[i];
  }

  // Labels caracteristiques
  if (dtLabelsToTranslate.length > 0) {
    const [enLab, zhLab] = await Promise.all([translateBatch(dtLabelsToTranslate, 'EN'), translateBatch(dtLabelsToTranslate, 'ZH')]);
    dtLabelSlots.forEach((slot, idx) => {
      if (slot.enEmpty && enLab[idx]) cMig.donnees_techniques[slot.i].label_en = enLab[idx];
      if (slot.zhEmpty && zhLab[idx]) cMig.donnees_techniques[slot.i].label_zh = zhLab[idx];
    });
  }

  // Équipements
  if (equipFrToTranslate.length > 0) {
    const [enEq, zhEq] = await Promise.all([translateBatch(equipFrToTranslate, 'EN'), translateBatch(equipFrToTranslate, 'ZH')]);
    if (equipSlots.enMissing) cMig.equipements_en = enEq;
    if (equipSlots.zhMissing) cMig.equipements_zh = zhEq;
  }

  if (needsCaracUpdate) update.caracteristiques = cMig;

  if (Object.keys(update).length > 0) writes.push({ ref, before: d, update });
}

console.log('');
console.log('═══ Bilan ═══');
console.log(`  Produits modifiés : ${writes.length}`);
console.log(`  Calls DeepL       : ${stats.calls}`);
console.log(`  Caractères env.   : ${stats.chars}`);
console.log(`  Erreurs DeepL     : ${stats.errors}`);
console.log('');

if (!APPLY) {
  console.log('🧪 DRY-RUN terminé. Ajouter --apply pour traduire + écrire.');
  process.exit(0);
}

if (writes.length === 0) {
  console.log('Aucune écriture nécessaire.');
  process.exit(0);
}

// Backup
mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `translate-pre-update-${stamp}.json`);
writeFileSync(
  backupPath,
  JSON.stringify(writes.map((w) => ({ ref: w.ref, before: w.before })), null, 2),
);
console.log(`💾 Backup : ${path.relative(ROOT, backupPath)}`);

console.log('🔥 Update Firestore en cours…');
const ts = admin.firestore.FieldValue.serverTimestamp();
let written = 0;
for (const w of writes) {
  try {
    await db.collection('products').doc(w.ref).set(
      { ...w.update, updated_at: ts },
      { merge: true },
    );
    written++;
  } catch (err) {
    console.error(`❌ Erreur ${w.ref} :`, err.message);
  }
}
console.log(`✅ ${written} produit(s) écrit(s).`);
process.exit(0);
