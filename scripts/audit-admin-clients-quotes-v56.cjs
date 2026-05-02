#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ID = 'importok-6ef77';
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-admin-sdk.json');
const TARGET_EMAIL = 'interenovations@gmail.com';
const COLLECTIONS = ['users', 'clients', 'profiles', 'partners', 'quotes', 'counters'];

function abort(message) {
  console.error(`ABORT: ${message}`);
  process.exit(1);
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

function maskId(value) {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 8) return text;
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function getClientRef(data) {
  return data.client_id || data.clientId || data.user_id || data.uid || null;
}

function getQuoteDate(data) {
  const value = data.createdAt || data.created_at || data.date_creation || null;
  if (!value) return 'absent';
  if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return 'present';
}

async function countCollection(db, name) {
  const snap = await db.collection(name).get();
  return snap.size;
}

async function findEmailDocs(db, collectionName) {
  const snap = await db.collection(collectionName).get();
  return snap.docs
    .map((doc) => ({ id: doc.id, data: doc.data() || {} }))
    .filter(({ data }) => String(data.email || data.client_email || '').toLowerCase() === TARGET_EMAIL)
    .map(({ id, data }) => ({
      collection: collectionName,
      id,
      role: data.role || null,
      partenaire_code: data.partenaire_code || data.code || null,
    }));
}

async function auditQuotes(db) {
  const [quotesSnap, clientsSnap] = await Promise.all([
    db.collection('quotes').get(),
    db.collection('clients').get(),
  ]);
  const clientIds = new Set(clientsSnap.docs.map((doc) => doc.id));

  const quotes = quotesSnap.docs.map((doc) => {
    const data = doc.data() || {};
    const clientRef = getClientRef(data);
    return {
      id: doc.id,
      numero: data.numero || doc.id,
      created: getQuoteDate(data),
      client_ref: maskId(clientRef),
      client_ref_field: data.client_id ? 'client_id' : data.clientId ? 'clientId' : data.user_id ? 'user_id' : data.uid ? 'uid' : 'absent',
      client_exists: clientRef ? clientIds.has(clientRef) : false,
      has_client_email: Boolean(data.client_email),
      total_ht: typeof data.total_ht === 'number' ? Math.round(data.total_ht) : 0,
      statut: data.statut || null,
    };
  });

  return {
    total: quotes.length,
    quotes,
    missing_createdAt: quotes.filter((q) => q.created === 'absent').length,
    missing_client_ref: quotes.filter((q) => q.client_ref_field === 'absent').length,
    missing_client_doc: quotes.filter((q) => q.client_ref && !q.client_exists).length,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (!args.has('--dry-run')) abort('Mode obligatoire: --dry-run.');

  const db = loadAdmin();

  const counts = {};
  for (const name of COLLECTIONS) {
    counts[name] = await countCollection(db, name);
  }

  const target = [];
  for (const name of ['users', 'clients', 'profiles', 'partners']) {
    target.push(...await findEmailDocs(db, name));
  }

  const quotes = await auditQuotes(db);

  console.log(JSON.stringify({
    mode: 'dry-run',
    project: PROJECT_ID,
    counts,
    target_email: TARGET_EMAIL,
    target_documents: target,
    quotes,
    writes: 0,
    deletes: 0,
  }, null, 2));
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
