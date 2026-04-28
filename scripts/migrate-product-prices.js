// scripts/migrate-product-prices.js
// MISSION V44 — Phase 6
// Migration bulk : recalcule tous les prix produits depuis CNY (source de vérité)
// avec les taux + multiplicateurs canoniques de Firestore.
//
// Pour chaque produit avec un prix base disponible :
//   1. Si prix_achat_cny > 0 → utilise comme base
//   2. Sinon prix_achat_usd → calcule cny depuis taux Firestore
//   3. Sinon prix_achat_eur ou prix_achat → calcule cny depuis taux Firestore
//   4. Sinon skip (warning logué)
// Recalcule prix_usd, prix_eur, prix_public, prix_partenaire avec
// taux + multiplicateurs lus en temps réel.
//
// Update doc /products/{ref} avec :
//   - prix_achat_cny / usd / eur / prix_achat (canonical EUR)
//   - prix_public, prix_partenaire
//   - date_derniere_validation
// Crée entry /products/{ref}/price_history avec source 'migration-bulk-2026-04'.
//
// Usage :
//   node scripts/migrate-product-prices.js          # dry-run
//   node scripts/migrate-product-prices.js --apply  # exécution
//
// ⚠️ Backup JSON automatique avant écriture.

import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = path.join(ROOT, 'backups');
const SOURCE_TAG = 'migration-bulk-2026-04';

const sa = JSON.parse(readFileSync(path.join(ROOT, 'firebase-admin-sdk.json'), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function round2(n) { return Math.round(n * 100) / 100; }

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

(async () => {
  console.log('═══ Migration prix produits bulk ═══');
  console.log('Mode :', APPLY ? '🔥 APPLY' : '🧪 DRY-RUN');
  console.log('');

  // Lire taux + multiplicateurs canoniques
  const [globalSnap, coefSnap] = await Promise.all([
    db.collection('admin_params').doc('global').get(),
    db.collection('admin_params').doc('coefficients_prix').get(),
  ]);
  const g = globalSnap.exists ? globalSnap.data() : {};
  const c = coefSnap.exists ? coefSnap.data() : {};
  const rates = {
    eur_usd: g.taux_eur_usd || 1.17,
    eur_cny: g.taux_rmb_eur || 8.0,
    usd_cny: g.taux_usd_cny || ((g.taux_rmb_eur || 8.0) / (g.taux_eur_usd || 1.17)),
  };
  const multipliers = {
    client: c.coefficient_public ?? c.coefficient_user ?? 2.0,
    partner: c.coefficient_partner ?? 1.5,
  };
  console.log('Taux Firestore :', JSON.stringify(rates));
  console.log('Multiplicateurs Firestore :', JSON.stringify(multipliers));
  console.log('');

  const productsSnap = await db.collection('products').get();
  console.log('Total produits :', productsSnap.size);
  console.log('');

  const writes = [];
  const stats = { total: 0, updated: 0, skipped: 0, errors: 0 };

  for (const doc of productsSnap.docs) {
    stats.total++;
    const d = doc.data();
    const ref = doc.id;

    // Déterminer prix CNY base
    let prix_cny = 0;
    let source_base = '';
    if (typeof d.prix_achat_cny === 'number' && d.prix_achat_cny > 0) {
      prix_cny = d.prix_achat_cny;
      source_base = 'cny-direct';
    } else if (typeof d.prix_achat_usd === 'number' && d.prix_achat_usd > 0) {
      prix_cny = d.prix_achat_usd * rates.usd_cny;
      source_base = 'usd→cny';
    } else if (typeof d.prix_achat_eur === 'number' && d.prix_achat_eur > 0) {
      prix_cny = d.prix_achat_eur * rates.eur_cny;
      source_base = 'eur→cny';
    } else if (typeof d.prix_achat === 'number' && d.prix_achat > 0) {
      prix_cny = d.prix_achat * rates.eur_cny;
      source_base = 'prix_achat→cny';
    } else {
      stats.skipped++;
      console.log(`⏭  ${ref.padEnd(18)} ${(d.nom_fr || '?').substring(0, 35).padEnd(35)} (pas de prix base)`);
      continue;
    }

    // Recalculs
    const prix_usd = prix_cny / rates.usd_cny;
    const prix_eur = prix_cny / rates.eur_cny;
    const prix_public = prix_eur * multipliers.client;
    const prix_partenaire = prix_eur * multipliers.partner;

    const update = {
      prix_achat_cny: round2(prix_cny),
      prix_achat_usd: round2(prix_usd),
      prix_achat_eur: round2(prix_eur),
      prix_achat: round2(prix_eur), // canonical EUR (compat legacy)
      prix_public: round2(prix_public),
      prix_partenaire: round2(prix_partenaire),
    };

    stats.updated++;
    writes.push({
      ref,
      nom: d.nom_fr || '?',
      source_base,
      before: {
        prix_achat_cny: d.prix_achat_cny,
        prix_achat_usd: d.prix_achat_usd,
        prix_achat_eur: d.prix_achat_eur,
        prix_achat: d.prix_achat,
        prix_public: d.prix_public,
        prix_partenaire: d.prix_partenaire,
      },
      update,
    });

    console.log(`🔁 ${ref.padEnd(18)} ${(d.nom_fr || '?').substring(0, 35).padEnd(35)} ${source_base.padEnd(15)} CNY=${update.prix_achat_cny} → EUR=${update.prix_achat_eur} → public=${update.prix_public}`);
  }

  console.log('');
  console.log('═══ Bilan ═══');
  console.log(`  Total     : ${stats.total}`);
  console.log(`  Updated   : ${stats.updated}`);
  console.log(`  Skipped   : ${stats.skipped} (pas de prix base)`);
  console.log(`  Errors    : ${stats.errors}`);
  console.log('');

  if (!APPLY) {
    console.log('🧪 DRY-RUN terminé. Ajouter --apply pour écrire.');
    process.exit(0);
  }

  if (writes.length === 0) {
    console.log('Aucune écriture nécessaire.');
    process.exit(0);
  }

  // Backup avant écriture
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `products-pre-migration-prices-${stamp}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify(writes.map((w) => ({ ref: w.ref, nom: w.nom, before: w.before })), null, 2),
  );
  console.log(`💾 Backup : ${path.relative(ROOT, backupPath)}`);
  console.log('');

  console.log('🔥 Écriture en cours…');
  let written = 0;
  for (const w of writes) {
    try {
      const docRef = db.collection('products').doc(w.ref);
      await docRef.set(
        sanitizeForFirestore({
          ...w.update,
          date_derniere_validation: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }),
        { merge: true },
      );
      // Crée entry price_history
      await docRef.collection('price_history').add(
        sanitizeForFirestore({
          ...w.update,
          source: SOURCE_TAG,
          source_base: w.source_base,
          taux_appliques: rates,
          multiplicateurs_appliques: multipliers,
          validated_at: admin.firestore.FieldValue.serverTimestamp(),
          validated_by: 'migration-script',
        }),
      );
      written++;
    } catch (err) {
      console.error(`❌ ${w.ref} :`, err.message);
      stats.errors++;
    }
  }
  console.log('');
  console.log(`✅ ${written} produit(s) écrit(s) + price_history créé.`);
  console.log(`   Erreurs : ${stats.errors}`);
  process.exit(0);
})().catch((err) => {
  console.error('❌ Erreur globale :', err);
  process.exit(1);
});
