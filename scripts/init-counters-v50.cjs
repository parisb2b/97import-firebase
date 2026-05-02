// scripts/init-counters-v50.cjs — V50-BIS Checkpoint F
// Initialise les 8 compteurs Firestore manquants pour la numerotation
// atomique (CTN/LA/NC/BL/FF/FL/FM/SAV).
//
// CIBLE FIRESTORE : importok-6ef77 (HARDCODE — ne pas modifier)
//   Decision V50-BIS : --project explicite forcee partout.
//
// Pre-requis :
//   - firebase-admin-sdk.json a la racine du repo (gitignored)
//   - npm install firebase-admin (deja en dependencies)
//
// Usage :
//   node scripts/init-counters-v50.cjs --dry-run   # OBLIGATOIRE en premier
//   node scripts/init-counters-v50.cjs             # apres validation
//
// Document Firestore initial (idempotent) :
//   counters/{CODE} = { count: 0, prefix: <CODE>, last_reset: serverTimestamp() }
//
// Si counter deja existant : SKIP + log valeur courante (NE PAS RESET).

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'importok-6ef77'; // ⚠️ V50-BIS : hardcode

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
  console.error(`   Attendu : '${PROJECT_ID}' (V50-BIS hardcode).`);
  console.error('   Re-telecharger le bon SA depuis Firebase Console > Settings > Service accounts.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

const db = admin.firestore();
const dryRun = process.argv.includes('--dry-run');

const COUNTERS = ['CTN', 'LA', 'NC', 'BL', 'FF', 'FL', 'FM', 'SAV'];

(async () => {
  console.log('═══════════════════════════════════════════════');
  console.log(`  V50-BIS Checkpoint F — Init Counters`);
  console.log('═══════════════════════════════════════════════');
  console.log(`🎯 Cible Firestore : ${PROJECT_ID}`);
  console.log(`📋 Counters cibles : ${COUNTERS.join(', ')}`);
  console.log(`🔧 Mode            : ${dryRun ? 'DRY-RUN (lecture seule)' : 'EXECUTE'}`);
  console.log('');

  let created = 0;
  let skipped = 0;
  let warnings = 0;
  let errors = 0;

  for (const code of COUNTERS) {
    const ref = db.collection('counters').doc(code);
    try {
      const existing = await ref.get();

      if (existing.exists) {
        const data = existing.data() || {};
        // Validation forme : a-t-il un champ `count` ?
        if (typeof data.count !== 'number') {
          console.warn(`⚠️  ${code} : existant mais format inattendu (count=${data.count}). NE PAS ECRASER, verifier manuellement.`);
          warnings++;
        } else {
          console.log(`⏭️  ${code} : deja initialise (count=${data.count}). Skip.`);
          skipped++;
        }
        continue;
      }

      if (dryRun) {
        console.log(`🔍 ${code} : SERAIT cree avec { count: 0, prefix: '${code}', last_reset: serverTimestamp() }`);
        created++;
      } else {
        await ref.set({
          count: 0,
          prefix: code,
          last_reset: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ ${code} : cree (count=0).`);
        created++;
      }
    } catch (err) {
      console.error(`❌ ${code} : erreur`, err.message);
      errors++;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Resume`);
  console.log('═══════════════════════════════════════════════');
  console.log(`   ${dryRun ? '🔍 a creer' : '✅ crees   '} : ${created}`);
  console.log(`   ⏭️  skipped : ${skipped}`);
  console.log(`   ⚠️  warnings: ${warnings}`);
  console.log(`   ❌ errors  : ${errors}`);
  console.log('');

  if (dryRun) {
    console.log('💡 Pour appliquer reellement, relancer sans --dry-run :');
    console.log('   node scripts/init-counters-v50.cjs');
  }

  process.exit(errors > 0 ? 1 : 0);
})().catch((err) => {
  console.error('❌ Erreur fatale :', err.message);
  process.exit(1);
});
