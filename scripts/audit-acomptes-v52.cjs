// scripts/audit-acomptes-v52.cjs — V52 Checkpoint H
// Audit READ-ONLY de la coherence des acomptes embedded array dans
// la collection 'quotes'.
//
// CIBLE FIRESTORE : importok-6ef77 (HARDCODE — ne pas modifier)
//
// Pre-requis :
//   - firebase-admin-sdk.json a la racine du repo (gitignored)
//   - npm install firebase-admin (deja en dependencies)
//
// Usage :
//   node scripts/audit-acomptes-v52.cjs --dry-run   # OBLIGATOIRE
//
// ⚠️ MODE READ-ONLY ABSOLU :
//   - Pas de mode --execute. Le script ne peut PAS ecrire en BD.
//   - Garde-fou : le script appelle process.exit(1) si --execute
//     est passe par erreur.
//
// Verifications :
//   1. total_encaisse cache vs sum(acomptes[].montant) — derive
//      attendue 0
//   2. total_encaisse <= total_ht (sinon overflow)
//   3. acomptes.length <= 3 (limite metier V46)
//   4. acomptes[i].montant > 0
//   5. acomptes[i].type ∈ {acompte_1, acompte_2, solde}
//   6. acomptes[i].date defini
//   7. statut coherent avec acomptes (en_attente si 0 acomptes,
//      acompte_1 si 1, acompte_2 si 2, finalise si solde)
//
// Sortie : audit-v52/AUDIT-ACOMPTES-RESULTS.txt avec sections :
//   - SUMMARY (total quotes, total acomptes, OK count)
//   - ERRORS (par type d'erreur, avec quote.id + numero)
//   - WARNINGS (non bloquants — derives <= 0.01€, statut atypique)

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'importok-6ef77'; // ⚠️ V52 : hardcode

// ─── Garde-fou READ-ONLY ─────────────────────────────────────────────
if (process.argv.includes('--execute')) {
  console.error('❌ ABORT : ce script est READ-ONLY en V52.');
  console.error('   Mode --execute est INTERDIT. Utiliser --dry-run uniquement.');
  process.exit(1);
}

if (!process.argv.includes('--dry-run')) {
  console.error('❌ ABORT : flag --dry-run requis (READ-ONLY only).');
  console.error('   Usage : node scripts/audit-acomptes-v52.cjs --dry-run');
  process.exit(1);
}

// ─── Garde-fou : service account du bon projet ─────────────────────
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');
if (!fs.existsSync(SA_PATH)) {
  console.error('❌ ABORT : firebase-admin-sdk.json introuvable a', SA_PATH);
  console.error('   Telecharger depuis Firebase Console > Settings > Service accounts.');
  process.exit(1);
}

const serviceAccount = require(SA_PATH);
if (serviceAccount.project_id !== PROJECT_ID) {
  console.error(`❌ ABORT : firebase-admin-sdk.json cible '${serviceAccount.project_id}'`);
  console.error(`   Attendu : '${PROJECT_ID}' (V52 hardcode).`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

const db = admin.firestore();

// ─── Limites metier V46 / V49 ──────────────────────────────────────
const MAX_ACOMPTES = 3;
const VALID_TYPES = new Set(['acompte_1', 'acompte_2', 'solde']);
const TOLERANCE_EUR = 0.01;

// ─── Audit principal ───────────────────────────────────────────────
async function audit() {
  console.log('🔍 V52 — Audit acomptes READ-ONLY');
  console.log(`   Project : ${PROJECT_ID}`);
  console.log(`   Mode    : --dry-run (jamais d'ecriture)`);
  console.log('');

  const errors = [];
  const warnings = [];
  let totalQuotes = 0;
  let totalAcomptes = 0;
  let okCount = 0;

  const snap = await db.collection('quotes').get();
  totalQuotes = snap.size;
  console.log(`📊 ${totalQuotes} devis a verifier...`);
  console.log('');

  for (const doc of snap.docs) {
    const data = doc.data();
    const id = doc.id;
    const numero = data.numero || id;
    const acomptes = Array.isArray(data.acomptes) ? data.acomptes : [];
    const totalEncaisse = Number(data.total_encaisse) || 0;
    const totalHt = Number(data.total_ht) || 0;
    const statut = data.statut || 'brouillon';
    let quoteOk = true;

    totalAcomptes += acomptes.length;

    // 1. Coherence total_encaisse cache vs sum
    const sumAcomptes = acomptes.reduce(
      (s, a) => s + (Number(a.montant) || 0),
      0,
    );
    const derive = Math.abs(totalEncaisse - sumAcomptes);
    if (derive > TOLERANCE_EUR) {
      errors.push({
        type: 'CACHE_DESYNC',
        id,
        numero,
        msg: `total_encaisse=${totalEncaisse.toFixed(2)}€ vs sum=${sumAcomptes.toFixed(2)}€ (derive ${derive.toFixed(2)}€)`,
      });
      quoteOk = false;
    } else if (derive > 0) {
      warnings.push({
        type: 'CACHE_MICRO_DRIFT',
        id,
        numero,
        msg: `derive ${derive.toFixed(4)}€ (sous tolerance)`,
      });
    }

    // 2. Overflow total_encaisse > total_ht
    if (totalEncaisse > totalHt + TOLERANCE_EUR) {
      errors.push({
        type: 'OVERFLOW_ENCAISSE',
        id,
        numero,
        msg: `total_encaisse=${totalEncaisse.toFixed(2)}€ > total_ht=${totalHt.toFixed(2)}€`,
      });
      quoteOk = false;
    }

    // 3. acomptes.length <= 3
    if (acomptes.length > MAX_ACOMPTES) {
      errors.push({
        type: 'TOO_MANY_ACOMPTES',
        id,
        numero,
        msg: `acomptes.length=${acomptes.length} (max ${MAX_ACOMPTES})`,
      });
      quoteOk = false;
    }

    // 4-6. Validation par acompte
    acomptes.forEach((a, i) => {
      if (!a.montant || Number(a.montant) <= 0) {
        errors.push({
          type: 'INVALID_MONTANT',
          id,
          numero,
          msg: `acompte[${i}].montant=${a.montant}`,
        });
        quoteOk = false;
      }
      if (!a.type || !VALID_TYPES.has(a.type)) {
        warnings.push({
          type: 'UNKNOWN_TYPE',
          id,
          numero,
          msg: `acompte[${i}].type='${a.type}' (attendu : ${[...VALID_TYPES].join('|')})`,
        });
      }
      if (!a.date) {
        warnings.push({
          type: 'MISSING_DATE',
          id,
          numero,
          msg: `acompte[${i}].date manquant`,
        });
      }
    });

    // 7. Coherence statut <-> acomptes
    const expectedStatutByCount = {
      0: ['brouillon', 'en_attente', 'annule'],
      1: ['acompte_1'],
      2: ['acompte_2'],
      3: ['finalise'],
    };
    const expected = expectedStatutByCount[acomptes.length] || [];
    if (expected.length > 0 && !expected.includes(statut)) {
      warnings.push({
        type: 'STATUT_MISMATCH',
        id,
        numero,
        msg: `${acomptes.length} acomptes mais statut='${statut}' (attendu : ${expected.join('|')})`,
      });
    }

    if (quoteOk) okCount++;
  }

  // ─── Generation du rapport ────────────────────────────────────────
  const outDir = path.join(__dirname, '..', 'audit-v52');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'AUDIT-ACOMPTES-RESULTS.txt');

  const lines = [];
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  V52 — CHECKPOINT H — AUDIT ACOMPTES (READ-ONLY)');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Date          : ${new Date().toISOString()}`);
  lines.push(`Project       : ${PROJECT_ID}`);
  lines.push(`Mode          : --dry-run`);
  lines.push('');
  lines.push('─── SUMMARY ─────────────────────────────────────────────────');
  lines.push(`  Total quotes      : ${totalQuotes}`);
  lines.push(`  Total acomptes    : ${totalAcomptes}`);
  lines.push(`  Quotes OK         : ${okCount}`);
  lines.push(`  Quotes en erreur  : ${totalQuotes - okCount}`);
  lines.push(`  Errors            : ${errors.length}`);
  lines.push(`  Warnings          : ${warnings.length}`);
  lines.push('');

  if (errors.length > 0) {
    lines.push('─── ERRORS (BLOQUANT — a investiguer) ──────────────────────');
    const byType = {};
    errors.forEach((e) => {
      byType[e.type] = byType[e.type] || [];
      byType[e.type].push(e);
    });
    Object.keys(byType).forEach((type) => {
      lines.push('');
      lines.push(`  [${type}] ${byType[type].length} cas`);
      byType[type].forEach((e) => {
        lines.push(`    - ${e.numero} (id=${e.id}) : ${e.msg}`);
      });
    });
    lines.push('');
  } else {
    lines.push('✅ Aucune erreur detectee.');
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('─── WARNINGS (non bloquant) ────────────────────────────────');
    const byType = {};
    warnings.forEach((w) => {
      byType[w.type] = byType[w.type] || [];
      byType[w.type].push(w);
    });
    Object.keys(byType).forEach((type) => {
      lines.push('');
      lines.push(`  [${type}] ${byType[type].length} cas`);
      byType[type].slice(0, 20).forEach((w) => {
        lines.push(`    - ${w.numero} (id=${w.id}) : ${w.msg}`);
      });
      if (byType[type].length > 20) {
        lines.push(`    ... et ${byType[type].length - 20} autres`);
      }
    });
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  fs.writeFileSync(outFile, lines.join('\n'));
  console.log(`✅ Rapport ecrit : ${outFile}`);
  console.log('');
  console.log(`📊 Resultat : ${okCount}/${totalQuotes} OK, ${errors.length} errors, ${warnings.length} warnings`);
}

audit()
  .catch((err) => {
    console.error('❌ Erreur durant l\'audit :', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
