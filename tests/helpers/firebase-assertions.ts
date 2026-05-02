// Assertions Firestore/Storage pour tests E2E Playwright
// Necessite firebase-admin-sdk.json accessible (variables d'env ou fichier local)

import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ID = 'importok-6ef77';

function getServiceAccount(): ServiceAccount {
  const envPath = process.env.FIREBASE_ADMIN_SDK_PATH;
  const saPath = envPath || join(process.cwd(), 'firebase-admin-sdk.json');
  try {
    const raw = readFileSync(saPath, 'utf-8');
    const sa = JSON.parse(raw);
    if (sa.project_id !== PROJECT_ID) {
      throw new Error(`Project ID mismatch: ${sa.project_id} !== ${PROJECT_ID}`);
    }
    return sa;
  } catch (e) {
    throw new Error(`Impossible de charger firebase-admin-sdk.json: ${e}`);
  }
}

let db: FirebaseFirestore.Firestore | null = null;

function getDb() {
  if (!db) {
    const sa = getServiceAccount();
    const app = initializeApp({ credential: cert(sa), projectId: PROJECT_ID }, 'test-assertions');
    db = getFirestore(app);
  }
  return db;
}

export async function verifyFirestoreDoc(
  collection: string,
  docId: string,
  expectedFields: Record<string, unknown>,
): Promise<{ ok: boolean; details: string }> {
  try {
    const snap = await getDb().collection(collection).doc(docId).get();
    if (!snap.exists) {
      return { ok: false, details: `${collection}/${docId} introuvable` };
    }
    const data = snap.data()!;
    const mismatches: string[] = [];
    for (const [key, value] of Object.entries(expectedFields)) {
      if (data[key] !== value) {
        mismatches.push(`${key}: attendu=${value}, reel=${data[key]}`);
      }
    }
    if (mismatches.length > 0) {
      return { ok: false, details: mismatches.join('; ') };
    }
    return { ok: true, details: 'OK' };
  } catch (e: any) {
    return { ok: false, details: e.message };
  }
}

export async function cleanupTestDoc(collection: string, docId: string): Promise<void> {
  try {
    await getDb().collection(collection).doc(docId).delete();
  } catch {
    // best-effort
  }
}
