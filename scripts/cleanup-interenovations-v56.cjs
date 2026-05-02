#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PROJECT_ID = 'importok-6ef77';
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-admin-sdk.json');
const TARGET_EMAIL = 'interenovations@gmail.com';
const ARCHIVE_DIR = path.join(process.cwd(), 'ARCHIVE-INTERENOVATIONS-V56');
const ARCHIVE_PATH = path.join(ARCHIVE_DIR, 'interenovations.json');
const HASH_PATH = `${ARCHIVE_PATH}.sha256`;
const COLLECTIONS = ['clients', 'profiles', 'partners', 'users'];

function abort(message) {
  console.error(`ABORT: ${message}`);
  process.exit(1);
}

function parseMode() {
  const args = new Set(process.argv.slice(2));
  const execute = args.has('--execute');
  const dryRun = args.has('--dry-run') || !execute;
  const confirm = args.has('--confirm-interenovations-cleanup');

  if (execute && !confirm) abort('--confirm-interenovations-cleanup requis avec --execute.');
  if (confirm && !execute) abort('--confirm-interenovations-cleanup autorise uniquement avec --execute.');

  return execute ? 'execute' : dryRun ? 'dry-run' : 'dry-run';
}

function loadAdmin() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    abort('firebase-admin-sdk.json absent a la racine.');
  }

  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  if (serviceAccount.project_id !== PROJECT_ID) {
    abort(`Projet serviceAccount '${serviceAccount.project_id}', attendu '${PROJECT_ID}'.`);
  }

  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  }

  return admin.firestore();
}

function serialize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

async function findTargets(db) {
  const found = [];
  for (const collection of COLLECTIONS) {
    const snap = await db.collection(collection).get();
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const email = String(data.email || data.client_email || '').toLowerCase();
      if (email !== TARGET_EMAIL) continue;
      found.push({
        collection,
        id: doc.id,
        role: data.role || null,
        ref: doc.ref,
        data,
      });
    }
  }
  return found;
}

function assertSafeTargets(targets) {
  const admins = targets.filter((item) => String(item.role || '').toLowerCase() === 'admin');
  if (admins.length > 0) abort('STOP: interenovations@gmail.com a un role admin. Aucune suppression.');

  const allowed = new Set(COLLECTIONS);
  for (const item of targets) {
    if (!allowed.has(item.collection)) abort(`Collection non autorisee: ${item.collection}`);
  }
}

function writeArchive(targets) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  const archive = {
    project: PROJECT_ID,
    target_email: TARGET_EMAIL,
    created_at: new Date().toISOString(),
    documents: targets.map((item) => ({
      collection: item.collection,
      id: item.id,
      role: item.role || null,
      data: serialize(item.data),
    })),
  };

  fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(archive, null, 2));
  const hash = sha256File(ARCHIVE_PATH);
  fs.writeFileSync(HASH_PATH, `${hash}  ${path.relative(process.cwd(), ARCHIVE_PATH)}\n`);
  return { archivePath: path.relative(process.cwd(), ARCHIVE_PATH), hashPath: path.relative(process.cwd(), HASH_PATH), hash };
}

async function main() {
  const mode = parseMode();
  const db = loadAdmin();
  const targets = await findTargets(db);
  assertSafeTargets(targets);

  console.log(JSON.stringify({
    mode,
    project: PROJECT_ID,
    target_email: TARGET_EMAIL,
    documents_found: targets.map((item) => ({
      collection: item.collection,
      id: item.id,
      role: item.role || null,
    })),
    writes_planned: mode === 'execute' ? 1 : 0,
    deletes_planned: mode === 'execute' ? targets.length : 0,
  }, null, 2));

  if (mode !== 'execute') {
    console.log('DRY-RUN termine. Aucune archive creee, aucune suppression.');
    return;
  }

  const archiveInfo = writeArchive(targets);
  const batch = db.batch();
  for (const item of targets) {
    batch.delete(item.ref);
  }
  await batch.commit();

  console.log(JSON.stringify({
    mode,
    archive: archiveInfo.archivePath,
    sha256: archiveInfo.hashPath,
    deleted: targets.map((item) => ({ collection: item.collection, id: item.id })),
  }, null, 2));
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
