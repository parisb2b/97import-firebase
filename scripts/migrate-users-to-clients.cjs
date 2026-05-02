// scripts/migrate-users-to-clients.cjs — V50-BIS Checkpoint G
//
// Migre les documents users/{uid} vers clients/{uid} pour les comptes
// non-admin et non-partner. Cree une vue enrichie pour le metier
// (preferences, adresses, partenaire associe, historique commande).
//
// CIBLE FIRESTORE : importok-6ef77 (HARDCODE — garde-fou V50-BIS)
//
// Strategie :
// - users/ reste source de verite Firebase Auth (ne se deplace pas)
// - clients/{uid} doc id = UID Firebase (alignement V49 RBAC rules
//   match /clients/{userId})
// - Migration une seule fois (champ migrated_from_users_at track)
// - Idempotent : re-run skip les deja-migres
//
// Edge cases couverts (cf docs/superpowers/plans/2026-05-02-v50-bd-init.md
// EC-1 a EC-11) :
// - User sans email                           → email = null, log
// - Email duplique entre UIDs                 → chaque UID son doc
// - Deja dans clients/                        → skip
// - Champ camelCase vs snake_case             → fallback chain
// - Custom claims sans doc users/             → exclus (pas dans la query)
// - SA mauvais projet                         → abort
// - Doc malforme                              → try/catch par doc
// - Race condition new user                   → re-run safe (idempotent)
// - Permissions SA insuffisantes              → erreurs comptees
// - RGPD                                      → meme projet, OK
//
// Usage :
//   node scripts/migrate-users-to-clients.cjs --dry-run    # OBLIGATOIRE en premier
//   node scripts/migrate-users-to-clients.cjs --execute    # apres validation

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'importok-6ef77'; // V50-BIS hardcode

// ─── Garde-fou : service account du bon projet ─────────────────────
const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');
if (!fs.existsSync(SA_PATH)) {
  console.error('❌ ABORT : firebase-admin-sdk.json introuvable a', SA_PATH);
  process.exit(1);
}

const serviceAccount = require(SA_PATH);
if (serviceAccount.project_id !== PROJECT_ID) {
  console.error(`❌ ABORT : SDK cible '${serviceAccount.project_id}', attendu '${PROJECT_ID}'`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

const db = admin.firestore();
const dryRun = process.argv.includes('--dry-run');
const execute = process.argv.includes('--execute');

if (!dryRun && !execute) {
  console.error('❌ Precisez --dry-run (lecture seule) ou --execute (ecriture).');
  console.error('');
  console.error('Usage :');
  console.error('  node scripts/migrate-users-to-clients.cjs --dry-run');
  console.error('  node scripts/migrate-users-to-clients.cjs --execute');
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────
const isCandidate = (data) => {
  // EC-3.1 : exclus admin et partner
  if (data?.role === 'admin') return { ok: false, reason: 'role=admin (skip)' };
  if (data?.role === 'partner') return { ok: false, reason: 'role=partner (skip)' };
  // role === 'client' OU null OU undefined → candidat
  return { ok: true };
};

const buildClientDoc = (uid, userData) => {
  // EC-4 : fallback chain pour gerer camelCase et snake_case legacy
  return {
    uid,
    email: userData.email || null,
    nom: userData.nom || userData.lastName || '',
    prenom: userData.prenom || userData.firstName || '',
    telephone: userData.telephone || userData.phone || null,
    partenaire_code: userData.partenaire_code || null,
    pays_livraison: userData.pays_livraison || 'MQ',
    adresse_livraison: userData.adresse_livraison || {},
    adresse_facturation: userData.adresse_facturation || {},
    tva_intracom: userData.tva_intracom || null,
    notes_admin: '',
    created_at: userData.created_at || admin.firestore.FieldValue.serverTimestamp(),
    migrated_from_users_at: admin.firestore.FieldValue.serverTimestamp(),
    migrated_from_users_v: 'V50-BIS',
  };
};

// ─── Main ──────────────────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════════');
  console.log('  V50-BIS Checkpoint G — Migrate users -> clients');
  console.log('═══════════════════════════════════════════════');
  console.log(`🎯 Cible Firestore : ${PROJECT_ID}`);
  console.log(`🔧 Mode            : ${dryRun ? 'DRY-RUN (lecture seule)' : 'EXECUTE'}`);
  console.log('');

  let usersSnap;
  try {
    usersSnap = await db.collection('users').get();
  } catch (err) {
    console.error('❌ Echec lecture users/ :', err.message);
    process.exit(1);
  }

  console.log(`📊 ${usersSnap.size} users trouves dans users/`);
  console.log('');

  let migrated = 0;
  let skippedRole = 0;
  let skippedExisting = 0;
  let skippedMalformed = 0;
  let errors = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const data = userDoc.data() || {};

    // EC-8 : doc malforme (data null/undefined ou primitif)
    if (typeof data !== 'object' || data === null) {
      console.warn(`⚠️  ${uid} : doc users/ malforme (non objet). Skip.`);
      skippedMalformed++;
      continue;
    }

    // Filtre role admin/partner
    const candidate = isCandidate(data);
    if (!candidate.ok) {
      console.log(`⏭️  ${uid} (${data.email || 'no-email'}) : ${candidate.reason}`);
      skippedRole++;
      continue;
    }

    // Verifier si deja dans clients/
    const clientRef = db.collection('clients').doc(uid);
    let existing;
    try {
      existing = await clientRef.get();
    } catch (err) {
      console.error(`❌ ${uid} : echec lecture clients/${uid}`, err.message);
      errors++;
      continue;
    }
    if (existing.exists) {
      console.log(`⏭️  ${uid} (${data.email || 'no-email'}) : deja dans clients/, skip`);
      skippedExisting++;
      continue;
    }

    // Construire le doc client (fallback chain camelCase/snake_case)
    const clientData = buildClientDoc(uid, data);

    if (dryRun) {
      const preview = {
        email: clientData.email,
        nom: clientData.nom,
        prenom: clientData.prenom,
        partenaire_code: clientData.partenaire_code,
        pays_livraison: clientData.pays_livraison,
      };
      console.log(`🔍 ${uid} (${data.email || 'no-email'}) : SERAIT cree`);
      console.log(`   → ${JSON.stringify(preview)}`);
      migrated++;
    } else {
      try {
        await clientRef.set(clientData);
        console.log(`✅ ${uid} (${data.email || 'no-email'}) : migre`);
        migrated++;
      } catch (err) {
        console.error(`❌ ${uid} : echec write`, err.message);
        errors++;
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Resume');
  console.log('═══════════════════════════════════════════════');
  console.log(`   ${dryRun ? '🔍 a migrer    ' : '✅ migres      '} : ${migrated}`);
  console.log(`   ⏭️  skip role     : ${skippedRole}`);
  console.log(`   ⏭️  skip existant : ${skippedExisting}`);
  console.log(`   ⚠️  skip malforme : ${skippedMalformed}`);
  console.log(`   ❌ erreurs      : ${errors}`);
  console.log('');

  if (dryRun) {
    console.log('💡 Pour appliquer reellement, relancer avec --execute :');
    console.log('   node scripts/migrate-users-to-clients.cjs --execute');
  }
  if (!dryRun && execute) {
    console.log('💡 Verifier post-migration :');
    console.log('   - Console Firebase > Firestore > clients/ → ' + migrated + ' nouveaux docs');
    console.log('   - Tester /admin/clients sur Vercel preview');
  }

  process.exit(errors > 0 ? 1 : 0);
})().catch((err) => {
  console.error('❌ Erreur fatale :', err.message);
  process.exit(1);
});
