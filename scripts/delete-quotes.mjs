// scripts/delete-quotes.mjs
// Suppression de tous les documents de la collection quotes + reset counters

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.firebasestorage.app",
  messagingSenderId: "341922175237",
  appId: "1:341922175237:web:be30ec2e01d60ebcad8edd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllQuotes() {
  console.log('🗑️  Suppression de tous les quotes...');

  const quotesSnap = await getDocs(collection(db, 'quotes'));
  let deleted = 0;

  for (const docSnap of quotesSnap.docs) {
    await deleteDoc(doc(db, 'quotes', docSnap.id));
    deleted++;
    if (deleted % 5 === 0) {
      console.log(`   - ${deleted}/${quotesSnap.size} quotes supprimés`);
    }
  }

  console.log(`   ✅ ${deleted} quotes supprimés au total`);
  return deleted;
}

async function deleteCounters() {
  console.log('🗑️  Reset counters DVS_* et FA_*...');

  const countersSnap = await getDocs(collection(db, 'counters'));
  let deleted = 0;

  for (const docSnap of countersSnap.docs) {
    const id = docSnap.id;
    if (id.startsWith('DVS_') || id.startsWith('FA_') || id.startsWith('FA-AC_')) {
      await deleteDoc(doc(db, 'counters', id));
      deleted++;
      console.log(`   - Supprimé: counters/${id}`);
    }
  }

  console.log(`   ✅ ${deleted} compteurs supprimés`);
  return deleted;
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  MIGRATION-1: Suppression quotes + counters');
  console.log('════════════════════════════════════════════════');
  console.log('');

  const quotesDeleted = await deleteAllQuotes();
  console.log('');
  const countersDeleted = await deleteCounters();

  console.log('');
  console.log('════════════════════════════════════════════════');
  console.log('  📊 RAPPORT FINAL');
  console.log('════════════════════════════════════════════════');
  console.log(`  Quotes supprimés    : ${quotesDeleted}`);
  console.log(`  Counters supprimés  : ${countersDeleted}`);
  console.log('');
  console.log('✅ MIGRATION-1 terminée avec succès');
  console.log('════════════════════════════════════════════════');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
