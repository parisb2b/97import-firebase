// scripts/migrate-acomptes-v43.js
//
// MISSION V43 — ÉTAPE 2
// Migration des acomptes legacy ({ statut: 'declare'|'encaisse', ... })
// vers le format P3-COMPLET ({ encaisse: boolean, is_solde, numero, ... }).
//
// Usage :
//   node scripts/migrate-acomptes-v43.js --dry-run     # simulation (par défaut conseillé)
//   node scripts/migrate-acomptes-v43.js               # exécution réelle
//
// Pré-requis : firebase-admin-sdk.json à la racine du repo (gitignored).

import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes('--dry-run');

const SDK_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, '..', 'firebase-admin-sdk.json');

if (!existsSync(SDK_PATH)) {
  console.error('❌ Service account introuvable :', SDK_PATH);
  console.error('   → Télécharger depuis https://console.firebase.google.com/project/importok-6ef77/settings/serviceaccounts/adminsdk');
  console.error('   → Le placer à la racine du repo sous le nom firebase-admin-sdk.json');
  console.error('   → (Le fichier est ignoré par .gitignore)');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SDK_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

// ── Helpers ──────────────────────────────────────────────────────────────

function isLegacyAcompte(a) {
  return a && typeof a === 'object' && 'statut' in a;
}

function countLegacyAcomptes(quote) {
  const arr = quote?.acomptes;
  if (!Array.isArray(arr)) return 0;
  return arr.filter(isLegacyAcompte).length;
}

function migrateAcompte(legacy, position) {
  const wasEncaisse = legacy.statut === 'encaisse' || legacy.statut === 'confirme';
  const dateReception = legacy.date_reception || legacy.date || new Date().toISOString();

  // Préserver tous les champs sauf ceux explicitement deprecated par la mission V43.
  const {
    statut: _statut,
    date: _date,
    ref_fa: _refFa,
    date_encaissement: _dateEncaissement,
    ...preserved
  } = legacy;

  return {
    ...preserved,
    numero: typeof preserved.numero === 'number' ? preserved.numero : position,
    montant: typeof legacy.montant === 'number' ? legacy.montant : 0,
    date_reception: dateReception,
    encaisse: typeof preserved.encaisse === 'boolean' ? preserved.encaisse : wasEncaisse,
    is_solde: preserved.is_solde === true,
    created_at: legacy.created_at || dateReception,
    created_by: legacy.created_by || 'migration_v43',
  };
}

function buildBackupName() {
  const iso = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  return `quotes-pre-migration-v43-${iso}.json`;
}

// ── Migration ────────────────────────────────────────────────────────────

async function migrate() {
  console.log(`🚀 Migration acomptes v43 ${DRY_RUN ? '(DRY-RUN)' : '(RÉEL)'}`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔑 Service account: ${SDK_PATH}`);
  console.log(`📦 Project: ${serviceAccount.project_id}`);
  console.log('');

  // Phase 1 — Scan
  const snap = await db.collection('quotes').get();
  console.log(`🔍 Scan: ${snap.size} devis à analyser`);

  const impacted = [];
  let totalLegacy = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const legacyCount = countLegacyAcomptes(data);
    if (legacyCount > 0) {
      impacted.push({ id: docSnap.id, data, legacyCount });
      totalLegacy += legacyCount;
    }
  }
  console.log(`🔍 ${impacted.length} devis avec ${totalLegacy} acomptes legacy détectés`);

  if (impacted.length === 0) {
    console.log('✅ Aucun acompte legacy. Aucune action requise.');
    return;
  }

  // Phase 2 — Backup JSON local
  const backupDir = path.join(__dirname, '..', 'backups');
  const backupName = buildBackupName();
  const backupPath = path.join(backupDir, backupName);
  if (!DRY_RUN) {
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
    const payload = impacted.map(({ id, data }) => ({ id, data }));
    writeFileSync(backupPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`💾 Backup créé : backups/${backupName} (${impacted.length} devis)`);
  } else {
    console.log(`💾 Backup IGNORÉ (dry-run). Cible: backups/${backupName}`);
  }

  // Phase 3 — Migration + recalcul totaux
  let sumEncaisseAvant = 0, sumEncaisseApres = 0;
  let writes = 0;

  for (const item of impacted) {
    const before = Array.isArray(item.data.acomptes) ? item.data.acomptes : [];

    const after = before.map((a, idx) => {
      if (isLegacyAcompte(a)) return migrateAcompte(a, idx + 1);
      return a;
    });

    const totalHt = typeof item.data.total_ht === 'number' ? item.data.total_ht : 0;
    const totalEncaisseApres = after
      .filter(a => a.encaisse === true)
      .reduce((s, a) => s + (typeof a.montant === 'number' ? a.montant : 0), 0);
    const soldeRestant = Math.max(0, totalHt - totalEncaisseApres);

    const declareCount = before.filter(a => a.statut === 'declare').length;
    const encaisseCount = before.filter(a => a.statut === 'encaisse' || a.statut === 'confirme').length;

    sumEncaisseAvant += before
      .filter(a => a.statut === 'encaisse' || a.statut === 'confirme')
      .reduce((s, a) => s + (typeof a.montant === 'number' ? a.montant : 0), 0);
    sumEncaisseApres += totalEncaisseApres;

    const summary = [];
    if (declareCount > 0) summary.push(`${declareCount} declare → encaisse:false`);
    if (encaisseCount > 0) summary.push(`${encaisseCount} encaisse → encaisse:true`);

    const numero = item.data.numero || item.id;
    console.log(`📋 ${numero} : ${item.legacyCount} acompte(s) migré(s) (${summary.join(', ')}) | total_encaisse=${totalEncaisseApres.toFixed(2)}€ solde=${soldeRestant.toFixed(2)}€`);

    if (!DRY_RUN) {
      await db.collection('quotes').doc(item.id).update({
        acomptes: after,
        total_encaisse: totalEncaisseApres,
        solde_restant: soldeRestant,
      });
      writes++;
    }
  }

  console.log('');
  console.log(`📊 Total encaissé avant : ${sumEncaisseAvant.toFixed(2)} €`);
  console.log(`📊 Total encaissé après : ${sumEncaisseApres.toFixed(2)} €`);
  console.log(`✅ ${impacted.length} devis, ${totalLegacy} acomptes ${DRY_RUN ? '(simulation, aucune écriture)' : `migrés (${writes} writes Firestore)`}`);

  // Phase 4 — Validation (re-scan, uniquement en mode réel)
  if (!DRY_RUN) {
    console.log('');
    console.log('🔎 Validation post-migration...');
    const verifySnap = await db.collection('quotes').get();
    let remaining = 0;
    for (const ds of verifySnap.docs) {
      remaining += countLegacyAcomptes(ds.data());
    }
    if (remaining === 0) {
      console.log('✅ Validation OK : 0 acompte legacy restant');
    } else {
      console.error(`❌ Validation ÉCHEC : ${remaining} acomptes legacy détectés après migration`);
      console.error('   Vérifier le backup pour rollback : ' + backupPath);
      process.exit(2);
    }
  }

  console.log('');
  console.log(DRY_RUN
    ? '✅ Dry-run terminé. Lancer sans --dry-run pour appliquer.'
    : '✅ Migration terminée.');
}

migrate().catch(err => {
  console.error('❌ Erreur :', err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
