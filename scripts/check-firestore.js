// Check if Firestore database exists
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccountKey.json', import.meta.url), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Try with explicit database settings
const db = admin.firestore();
db.settings({
  databaseId: '(default)',
  ignoreUndefinedProperties: true
});

async function check() {
  console.log('Checking Firestore...');
  console.log('Project:', serviceAccount.project_id);

  try {
    const collections = await db.listCollections();
    console.log('Collections found:', collections.map(c => c.id));
  } catch (e) {
    console.error('Error:', e.code, e.message);
  }
  process.exit(0);
}

check();
