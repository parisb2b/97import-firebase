#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const PROJECT_ID = 'importok-6ef77';
const ARCHIVE_DIR = 'ARCHIVE-BEFORE-CLEANSTART-V53';
const ZIP_PATH = 'archive-before-cleanstart-v53.zip';
const ZIP_SHA256_PATH = `${ZIP_PATH}.sha256`;
const REPORT_PATH = 'CLEANSTART-V53-REPORT.txt';
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-admin-sdk.json');

const KEEP_COLLECTIONS = [
  'users', 'clients', 'partners', 'products', 'categories',
  'ports', 'admin_params', 'tarifs_logistiques', 'counters'
];

const ARCHIVE_ONLY_COLLECTIONS = [
  'profiles',
  'mail',
  'logs'
];

const PURGE_COLLECTIONS = [
  'quotes', 'commissions',
  'factures', 'invoices', 'logistics_invoices',
  'conteneurs', 'containers',
  'notes_commission', 'listes_achat', 'sav',
  'contacts', 'stock', 'price_history'
];

const COUNTERS_TO_RESET = [
  'DVS', 'FA', 'FF', 'FL', 'FM', 'NC', 'BL', 'CTN', 'LA', 'SAV'
];

function abort(message) {
  console.error(`ABORT: ${message}`);
  process.exit(1);
}

function parseMode(argv) {
  const args = new Set(argv);
  const dryRun = args.has('--dry-run');
  const archiveOnly = args.has('--archive-only');
  const execute = args.has('--execute');
  const confirm = args.has('--confirm-clean-start');

  const modeCount = [dryRun, archiveOnly, execute].filter(Boolean).length;
  if (modeCount > 1) abort('utiliser un seul mode: --dry-run, --archive-only ou --execute.');
  if (confirm && !execute) abort('--confirm-clean-start est autorise uniquement avec --execute.');
  if (execute && !confirm) abort('--confirm-clean-start requis avec --execute.');
  if (execute && !fs.existsSync(ZIP_PATH)) abort(`${ZIP_PATH} absent. Executer --archive-only et validation Michel avant --execute.`);

  return execute ? 'execute' : archiveOnly ? 'archive-only' : 'dry-run';
}

function assertCollectionSafety() {
  const keep = new Set(KEEP_COLLECTIONS);
  for (const name of PURGE_COLLECTIONS) {
    if (keep.has(name)) abort(`collection KEEP interdite dans PURGE: ${name}`);
  }
  for (const name of ARCHIVE_ONLY_COLLECTIONS) {
    if (keep.has(name)) abort(`collection KEEP interdite dans ARCHIVE-ONLY: ${name}`);
  }
}

function loadAdmin() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    abort('firebase-admin-sdk.json absent a la racine. STOP validation humaine requise.');
  }

  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  if (serviceAccount.project_id !== PROJECT_ID) {
    abort(`firebase-admin-sdk.json cible '${serviceAccount.project_id}', attendu '${PROJECT_ID}'.`);
  }

  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  }
  return { admin, db: admin.firestore() };
}

function serialize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value.path && value.firestore) return { __ref: value.path };

  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    out[key] = serialize(nested);
  }
  return out;
}

async function getCollectionDocs(db, collectionName) {
  if (collectionName === 'price_history') {
    const snap = await db.collectionGroup('price_history').get();
    return snap.docs.map((doc) => ({
      path: doc.ref.path,
      id: doc.id,
      data: serialize(doc.data()),
    }));
  }

  const snap = await db.collection(collectionName).get();
  return snap.docs.map((doc) => ({
    path: doc.ref.path,
    id: doc.id,
    data: serialize(doc.data()),
  }));
}

async function countCollection(db, collectionName) {
  const docs = await getCollectionDocs(db, collectionName);
  return docs.length;
}

async function collectCounts(db, collectionNames) {
  const counts = {};
  for (const name of collectionNames) {
    counts[name] = await countCollection(db, name);
  }
  return counts;
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

async function createArchive(db, mode) {
  fs.rmSync(ARCHIVE_DIR, { recursive: true, force: true });
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const manifest = {
    project_id: PROJECT_ID,
    mode,
    created_at: new Date().toISOString(),
    keep_collections: KEEP_COLLECTIONS,
    archive_only_collections: ARCHIVE_ONLY_COLLECTIONS,
    purge_collections: PURGE_COLLECTIONS,
    counters_to_reset: COUNTERS_TO_RESET,
    files: [],
  };

  for (const name of [...ARCHIVE_ONLY_COLLECTIONS, ...PURGE_COLLECTIONS]) {
    const docs = await getCollectionDocs(db, name);
    const fileName = `${name}.json`;
    writeJson(path.join(ARCHIVE_DIR, fileName), {
      collection: name,
      count: docs.length,
      docs,
    });
    manifest.files.push({ collection: name, file: fileName, count: docs.length });
  }

  writeJson(path.join(ARCHIVE_DIR, 'manifest.json'), manifest);

  fs.rmSync(ZIP_PATH, { force: true });
  fs.rmSync(ZIP_SHA256_PATH, { force: true });
  execFileSync('zip', ['-qr', ZIP_PATH, ARCHIVE_DIR]);

  const hash = crypto.createHash('sha256').update(fs.readFileSync(ZIP_PATH)).digest('hex');
  fs.writeFileSync(ZIP_SHA256_PATH, `${hash}  ${ZIP_PATH}\n`);
  return { manifest, hash };
}

async function deleteDocs(db, docs) {
  let batch = db.batch();
  let pending = 0;
  let deleted = 0;

  for (const item of docs) {
    batch.delete(db.doc(item.path));
    pending += 1;
    deleted += 1;
    if (pending >= 450) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  return deleted;
}

async function purgeCollections(db) {
  const deleted = {};
  for (const name of PURGE_COLLECTIONS) {
    const docs = await getCollectionDocs(db, name);
    deleted[name] = await deleteDocs(db, docs);
  }
  return deleted;
}

async function resetCounters(admin, db, archiveHash) {
  const payload = {
    seq: 0,
    reset_at: admin.firestore.FieldValue.serverTimestamp(),
    reset_reason: 'V53 Clean Start',
    archive_reference: ZIP_PATH,
    archive_sha256: archiveHash,
  };

  for (const id of COUNTERS_TO_RESET) {
    await db.collection('counters').doc(id).set(payload, { merge: true });
  }
}

async function postPurgeCheck(db, before) {
  const afterPurge = await collectCounts(db, PURGE_COLLECTIONS);
  const afterKeep = await collectCounts(db, KEEP_COLLECTIONS);
  const afterArchiveOnly = await collectCounts(db, ARCHIVE_ONLY_COLLECTIONS);

  for (const [name, count] of Object.entries(afterPurge)) {
    if (count !== 0) abort(`verification post-purge echouee: ${name} contient encore ${count} documents.`);
  }
  for (const [name, count] of Object.entries(afterKeep)) {
    if (count <= 0) abort(`verification post-purge echouee: KEEP ${name} est vide.`);
  }
  for (const [name, count] of Object.entries(afterArchiveOnly)) {
    if (count !== before.archiveOnly[name]) {
      abort(`verification post-purge echouee: ARCHIVE-ONLY ${name} a change (${before.archiveOnly[name]} -> ${count}).`);
    }
  }

  return { purge: afterPurge, keep: afterKeep, archiveOnly: afterArchiveOnly };
}

function writeReport({ before, after, deleted, archiveHash }) {
  const lines = [
    'CLEANSTART V53 REPORT',
    `Date: ${new Date().toISOString()}`,
    `Project: ${PROJECT_ID}`,
    `Archive: ${ZIP_PATH}`,
    `Archive SHA256: ${archiveHash}`,
    '',
    'KEEP counts before:',
    JSON.stringify(before.keep, null, 2),
    '',
    'ARCHIVE-ONLY counts before:',
    JSON.stringify(before.archiveOnly, null, 2),
    '',
    'PURGE counts before:',
    JSON.stringify(before.purge, null, 2),
    '',
    'Deleted counts:',
    JSON.stringify(deleted, null, 2),
    '',
    'Post-purge counts:',
    JSON.stringify(after, null, 2),
    '',
    'Counters reset:',
    JSON.stringify(COUNTERS_TO_RESET, null, 2),
  ];
  fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`);
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  assertCollectionSafety();

  const { admin, db } = loadAdmin();

  const usersCount = await countCollection(db, 'users');
  if (usersCount === 0) abort('users.size === 0. STOP.');

  const before = {
    keep: await collectCounts(db, KEEP_COLLECTIONS),
    archiveOnly: await collectCounts(db, ARCHIVE_ONLY_COLLECTIONS),
    purge: await collectCounts(db, PURGE_COLLECTIONS),
  };

  console.log(`Mode: ${mode}`);
  console.log(`Project: ${PROJECT_ID}`);
  console.log('KEEP:', before.keep);
  console.log('ARCHIVE-ONLY:', before.archiveOnly);
  console.log('PURGE:', before.purge);
  console.log('Counters documentaires a reset:', COUNTERS_TO_RESET);

  if (mode === 'dry-run') {
    console.log('DRY-RUN termine. Aucune archive creee, aucune ecriture Firestore.');
    return;
  }

  const { hash } = await createArchive(db, mode);
  console.log(`Archive creee: ${ZIP_PATH}`);
  console.log(`SHA256: ${hash}`);

  if (mode === 'archive-only') {
    console.log('ARCHIVE-ONLY termine. Aucune suppression Firestore.');
    return;
  }

  const deleted = await purgeCollections(db);
  await resetCounters(admin, db, hash);
  const after = await postPurgeCheck(db, before);
  writeReport({ before, after, deleted, archiveHash: hash });
  console.log(`EXECUTE termine. Rapport: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
