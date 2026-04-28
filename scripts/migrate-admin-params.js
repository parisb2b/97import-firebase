// scripts/migrate-admin-params.js
// MISSION V44 — Phase 5
// Cleanup et unification de la collection /admin_params/.
//
// Décisions Michel V44 :
//   - Doc canonical multiplicateurs : /admin_params/coefficients_prix
//     ▸ coefficient_public  : 2.0
//     ▸ coefficient_partner : 1.5
//     ▸ coefficient_vip     : 1.5
//   - Doc canonical taux : /admin_params/global
//     ▸ taux_eur_usd, taux_rmb_eur (fetch Frankfurter)
//   - Doc /admin_params/pricing → marqué deprecated (pas supprimé)
//
// Usage :
//   node scripts/migrate-admin-params.js          # dry-run
//   node scripts/migrate-admin-params.js --apply  # exécution
//
// ⚠️ NE PAS LANCER SANS REVUE.

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const sa = JSON.parse(readFileSync(path.join(ROOT, 'firebase-admin-sdk.json'), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const FALLBACK = { eur_usd: 1.17, eur_cny: 8.0, usd_cny: 6.84 };

async function fetchFrankfurterRates() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,CNY');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      eur_usd: data.rates.USD,
      eur_cny: data.rates.CNY,
      usd_cny: data.rates.CNY / data.rates.USD,
      source: 'frankfurter',
    };
  } catch (err) {
    console.warn('⚠️ Frankfurter indisponible, fallback hardcoded :', err.message);
    return { ...FALLBACK, source: 'fallback-hardcoded' };
  }
}

function logDoc(label, before, after) {
  console.log(`\n──── ${label} ────`);
  console.log('  AVANT :', before ? JSON.stringify(before) : '(absent)');
  console.log('  APRÈS :', JSON.stringify(after));
}

(async () => {
  console.log('═══ Migration admin_params ═══');
  console.log('Mode :', APPLY ? '🔥 APPLY' : '🧪 DRY-RUN');
  console.log('');

  const rates = await fetchFrankfurterRates();
  console.log('Taux fetched :', JSON.stringify(rates));

  // 1) /admin_params/coefficients_prix (canonical multiplicateurs)
  const coefRef = db.collection('admin_params').doc('coefficients_prix');
  const coefSnap = await coefRef.get();
  const coefBefore = coefSnap.exists ? coefSnap.data() : null;
  const coefAfter = {
    coefficient_public: 2.0,
    coefficient_partner: 1.5,
    coefficient_vip: 1.5,
    canonical: true,
    description: 'Coefficients officiels 97import — source canonique',
    derniere_maj: admin.firestore.FieldValue.serverTimestamp(),
  };
  logDoc('admin_params/coefficients_prix', coefBefore, { ...coefAfter, derniere_maj: '<serverTimestamp>' });

  // 2) /admin_params/global (canonical taux + référence canonical)
  const globalRef = db.collection('admin_params').doc('global');
  const globalSnap = await globalRef.get();
  const globalBefore = globalSnap.exists ? globalSnap.data() : null;
  const globalAfter = {
    ...(globalBefore || {}),
    taux_eur_usd: rates.eur_usd,
    taux_rmb_eur: rates.eur_cny,
    taux_usd_cny: rates.usd_cny,
    _coefficients_canonical: 'coefficients_prix',
    derniere_maj_taux: admin.firestore.FieldValue.serverTimestamp(),
  };
  logDoc('admin_params/global', globalBefore, { ...globalAfter, derniere_maj_taux: '<serverTimestamp>' });

  // 3) /admin_params/pricing — deprecated marker
  const pricingRef = db.collection('admin_params').doc('pricing');
  const pricingSnap = await pricingRef.get();
  const pricingBefore = pricingSnap.exists ? pricingSnap.data() : null;
  let pricingAfter = null;
  if (pricingSnap.exists) {
    pricingAfter = {
      ...pricingBefore,
      _deprecated: true,
      _deprecated_reason: 'Voir /admin_params/coefficients_prix (canonical) et /admin_params/global (taux)',
      _migrated_to: 'coefficients_prix',
      _deprecated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    logDoc('admin_params/pricing', pricingBefore, { ...pricingAfter, _deprecated_at: '<serverTimestamp>' });
  } else {
    console.log('\n──── admin_params/pricing ──── (absent, skip)');
  }

  console.log('');
  if (!APPLY) {
    console.log('🧪 DRY-RUN terminé. Ajouter --apply pour écrire dans Firestore.');
    process.exit(0);
  }

  console.log('🔥 Écriture en cours…');
  await coefRef.set(coefAfter, { merge: true });
  console.log('  ✅ coefficients_prix écrit');
  await globalRef.set(globalAfter, { merge: true });
  console.log('  ✅ global écrit');
  if (pricingAfter) {
    await pricingRef.set(pricingAfter, { merge: true });
    console.log('  ✅ pricing marqué deprecated');
  }
  console.log('\n✅ Migration terminée.');
  process.exit(0);
})().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
