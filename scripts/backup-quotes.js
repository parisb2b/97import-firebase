// scripts/backup-quotes.js
// Export backup JSON de tous les devis avant suppression

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

async function backupQuotes() {
  console.log('📦 Backup des devis en cours...');

  const quotesSnap = await getDocs(collection(db, 'quotes'));
  const quotes = [];

  quotesSnap.forEach(doc => {
    quotes.push({
      id: doc.id,
      ...doc.data()
    });
  });

  console.log(`✅ ${quotes.length} devis récupérés`);

  // Créer le dossier backups si nécessaire
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Générer le nom de fichier avec timestamp
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .split('.')[0];
  const filename = `quotes-backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);

  // Écrire le fichier
  fs.writeFileSync(filepath, JSON.stringify(quotes, null, 2), 'utf-8');

  console.log(`💾 Backup sauvegardé: ${filepath}`);
  console.log(`📊 Taille: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);

  process.exit(0);
}

backupQuotes().catch(err => {
  console.error('❌ Erreur backup:', err);
  process.exit(1);
});
