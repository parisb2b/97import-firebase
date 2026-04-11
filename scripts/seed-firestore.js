// scripts/seed-firestore.js
// Seed Firestore with complete test data
// Run with: node scripts/seed-firestore.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCeKBbSgC8PQK4OETlsjnRwhYCmAKz6cwA",
  authDomain: "import2050-59f11.firebaseapp.com",
  projectId: "import2050-59f11",
  storageBucket: "import2050-59f11.firebasestorage.app",
  messagingSenderId: "496161620887",
  appId: "1:496161620887:web:5cdbd6f3a879edd5bfbad2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = Timestamp.now();

// ========== ADMIN PARAMS ==========
const adminParams = {
  global: {
    taux_rmb_eur: 7.82,
    taux_rmb_updated: now,
    taux_majoration_user: 2.0,
    taux_majoration_partner: 1.2,
    acompte_pct_defaut: 30,
    delai_validite_devis: 30,
  },
  emetteur: {
    nom: 'LUXENT LIMITED',
    adresse: '2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD',
    ville: 'RUISLIP HA4 7AE — LONDON',
    pays: 'UNITED KINGDOM',
    company_number: '14852122',
    email: 'luxent@ltd-uk.eu',
    tel_cn: '+86 135 6627 1902',
    tel_fr: '+33 620 607 448',
    iban: 'DE76 2022 0800 0059 5688 30',
    swift: 'SXPYDEHH',
    banque: 'Banking Circle S.A.',
  },
};

// ========== CLIENTS (profiles) ==========
const clients = [
  {
    id: 'client-jean-dupont',
    email: 'jean.dupont@gmail.com',
    nom: 'Jean Dupont',
    tel: '+596 596 001 001',
    adresse: '12 Rue de la Savane',
    code_postal: '97200',
    ville: 'Fort-de-France',
    territoire: 'Martinique',
    pays: 'France',
    type: 'SARL',
    role: 'user',
    createdAt: now,
  },
  {
    id: 'client-marie-martin',
    email: 'marie.martin@gmail.com',
    nom: 'Marie Martin',
    tel: '+590 590 002 002',
    adresse: '8 Allée des Flamboyants',
    code_postal: '97100',
    ville: 'Basse-Terre',
    territoire: 'Guadeloupe',
    pays: 'France',
    type: 'Particulier',
    role: 'user',
    createdAt: now,
  },
  {
    id: 'client-pierre-bernard',
    email: 'pierre.bernard@gmail.com',
    nom: 'Pierre Bernard',
    tel: '+262 262 003 003',
    adresse: '45 Boulevard du Chaudron',
    code_postal: '97490',
    ville: 'Sainte-Clotilde',
    territoire: 'La Réunion',
    pays: 'France',
    type: 'SAS',
    role: 'user',
    createdAt: now,
  },
  {
    id: 'client-sophie-leblanc',
    email: 'sophie.leblanc@gmail.com',
    nom: 'Sophie Leblanc',
    tel: '+596 596 004 004',
    adresse: '3 Impasse des Bougainvilliers',
    code_postal: '97232',
    ville: 'Le Lamentin',
    territoire: 'Martinique',
    pays: 'France',
    type: 'Particulier',
    role: 'vip',
    createdAt: now,
  },
  {
    id: 'client-marc-durand',
    email: 'marc.durand@gmail.com',
    nom: 'Marc Durand',
    tel: '+594 594 005 005',
    adresse: '27 Avenue du Général de Gaulle',
    code_postal: '97300',
    ville: 'Cayenne',
    territoire: 'Guyane',
    pays: 'France',
    type: 'SARL',
    role: 'user',
    createdAt: now,
  },
];

// ========== PRODUITS ==========
const products = [
  {
    id: 'TEST-001',
    numero_interne: 'TEST-001',
    nom_fr: 'TEST Mini-pelle',
    nom_zh: 'TEST 挖掘机',
    nom_en: 'TEST Excavator',
    categorie: 'mini-pelles',
    prix_achat_cny: 30000,
    prix_achat_eur: 3836,
    prix_public_eur: 7672,
    prix_partner_eur: 4603,
    actif: true,
    createdAt: now,
  },
  {
    id: 'TEST-002',
    numero_interne: 'TEST-002',
    nom_fr: 'TEST Maison Modulaire',
    nom_zh: 'TEST 集装箱房',
    nom_en: 'TEST Modular Home',
    categorie: 'maisons-modulaires',
    prix_achat_cny: 25000,
    prix_achat_eur: 3197,
    prix_public_eur: 6394,
    prix_partner_eur: 3836,
    actif: true,
    createdAt: now,
  },
  {
    id: 'TEST-003',
    numero_interne: 'TEST-003',
    nom_fr: 'TEST Kit Solaire',
    nom_zh: 'TEST 太阳能',
    nom_en: 'TEST Solar Kit',
    categorie: 'solaire',
    prix_achat_cny: 8000,
    prix_achat_eur: 1023,
    prix_public_eur: 2046,
    prix_partner_eur: 1228,
    actif: true,
    createdAt: now,
  },
  {
    id: 'TEST-004',
    numero_interne: 'TEST-004',
    nom_fr: 'TEST Machine Agricole',
    nom_zh: 'TEST 农业机械',
    nom_en: 'TEST Agricultural Machine',
    categorie: 'machines-agricoles',
    prix_achat_cny: 3000,
    prix_achat_eur: 384,
    prix_public_eur: 768,
    prix_partner_eur: 461,
    actif: true,
    createdAt: now,
  },
  {
    id: 'TEST-005',
    numero_interne: 'TEST-005',
    nom_fr: 'TEST Fret Maritime',
    nom_zh: 'TEST 海运费',
    nom_en: 'TEST Sea Freight',
    categorie: 'services',
    prix_achat_cny: 9000,
    prix_achat_eur: 1151,
    prix_public_eur: 2302,
    prix_partner_eur: 1381,
    actif: true,
    createdAt: now,
  },
  {
    id: 'TEST-006',
    numero_interne: 'TEST-006',
    nom_fr: 'TEST Article Divers',
    nom_zh: 'TEST 杂项',
    nom_en: 'TEST Miscellaneous',
    categorie: 'divers',
    prix_achat_cny: 1500,
    prix_achat_eur: 192,
    prix_public_eur: 384,
    prix_partner_eur: 230,
    actif: true,
    createdAt: now,
  },
];

// ========== DEVIS (quotes) ==========
const quotes = [
  {
    id: 'DVS-2604001',
    numero: 'DVS-2604001',
    client_nom: 'Jean Dupont',
    client_email: 'jean.dupont@gmail.com',
    client_adresse: '12 Rue de la Savane, 97200 Fort-de-France, Martinique, France',
    client_tel: '+596 596 001 001',
    destination: 'MQ',
    statut: 'envoyé',
    lignes: [
      { ref: 'TEST-001', nom_fr: 'TEST Mini-pelle', qte: 1, prix_unitaire: 7600, total: 7600 },
      { ref: 'TEST-005', nom_fr: 'TEST Fret Maritime', qte: 1, prix_unitaire: 2300, total: 2300 },
    ],
    total_ht: 9900,
    acompte_pct: 30,
    total_encaisse: 2970,
    solde_restant: 6930,
    acomptes: [{ date: now, montant: 2970, ref_fa: 'FA-2604001' }],
    createdAt: now,
  },
  {
    id: 'DVS-2604002',
    numero: 'DVS-2604002',
    client_nom: 'Marie Martin',
    client_email: 'marie.martin@gmail.com',
    client_adresse: '8 Allée des Flamboyants, 97100 Basse-Terre, Guadeloupe, France',
    client_tel: '+590 590 002 002',
    destination: 'GP',
    statut: 'accepté',
    lignes: [
      { ref: 'TEST-002', nom_fr: 'TEST Maison Modulaire', qte: 1, prix_unitaire: 6400, total: 6400 },
    ],
    total_ht: 6400,
    acompte_pct: 30,
    total_encaisse: 1920,
    solde_restant: 4480,
    acomptes: [{ date: now, montant: 1920, ref_fa: 'FA-2604002' }],
    createdAt: now,
  },
  {
    id: 'DVS-2604003',
    numero: 'DVS-2604003',
    client_nom: 'Pierre Bernard',
    client_email: 'pierre.bernard@gmail.com',
    client_adresse: '45 Boulevard du Chaudron, 97490 Sainte-Clotilde, La Réunion, France',
    client_tel: '+262 262 003 003',
    destination: 'RE',
    statut: 'brouillon',
    lignes: [
      { ref: 'TEST-003', nom_fr: 'TEST Kit Solaire', qte: 2, prix_unitaire: 2050, total: 4100 },
    ],
    total_ht: 4100,
    acompte_pct: 30,
    total_encaisse: 0,
    solde_restant: 4100,
    acomptes: [],
    createdAt: now,
  },
  {
    id: 'DVS-2604004',
    numero: 'DVS-2604004',
    client_nom: 'Sophie Leblanc',
    client_email: 'sophie.leblanc@gmail.com',
    client_adresse: '3 Impasse des Bougainvilliers, 97232 Le Lamentin, Martinique, France',
    client_tel: '+596 596 004 004',
    destination: 'MQ',
    statut: 'en cours',
    is_vip: true,
    lignes: [
      { ref: 'TEST-001', nom_fr: 'TEST Mini-pelle', qte: 1, prix_unitaire: 7600, total: 7600 },
    ],
    total_ht: 7600,
    acompte_pct: 30,
    total_encaisse: 2280,
    solde_restant: 5320,
    acomptes: [{ date: now, montant: 2280, ref_fa: 'FA-2604003' }],
    createdAt: now,
  },
  {
    id: 'DVS-2604005',
    numero: 'DVS-2604005',
    client_nom: 'Marc Durand',
    client_email: 'marc.durand@gmail.com',
    client_adresse: '27 Avenue du Général de Gaulle, 97300 Cayenne, Guyane, France',
    client_tel: '+594 594 005 005',
    destination: 'GF',
    statut: 'livré',
    lignes: [
      { ref: 'TEST-004', nom_fr: 'TEST Machine Agricole', qte: 3, prix_unitaire: 770, total: 2310 },
    ],
    total_ht: 2310,
    acompte_pct: 100,
    total_encaisse: 2310,
    solde_restant: 0,
    acomptes: [{ date: now, montant: 2310, ref_fa: 'FA-2604004' }],
    createdAt: now,
  },
];

// ========== FACTURES (invoices) ==========
const invoices = [
  {
    id: 'FA-2604001',
    numero: 'FA-2604001',
    type: 'acompte',
    quote_id: 'DVS-2604001',
    montant: 2970,
    client_nom: 'Jean Dupont',
    createdAt: now,
  },
  {
    id: 'FA-2604002',
    numero: 'FA-2604002',
    type: 'acompte',
    quote_id: 'DVS-2604002',
    montant: 1920,
    client_nom: 'Marie Martin',
    createdAt: now,
  },
  {
    id: 'FA-2604003',
    numero: 'FA-2604003',
    type: 'acompte',
    quote_id: 'DVS-2604004',
    montant: 2280,
    client_nom: 'Sophie Leblanc',
    createdAt: now,
  },
  {
    id: 'F-2604001',
    numero: 'F-2604001',
    type: 'facture',
    quote_id: 'DVS-2604005',
    montant: 2310,
    client_nom: 'Marc Durand',
    createdAt: now,
  },
];

// ========== CONTENEURS (containers) ==========
const containers = [
  {
    id: 'CTN-2604-001',
    numero: 'CTN-2604-001',
    type: '40ft-HC',
    destination: 'MQ',
    statut: 'préparation',
    port_chargement: 'NINGBO',
    port_destination: 'FORT-DE-FRANCE',
    date_depart: Timestamp.fromDate(new Date('2026-04-23')),
    lignes: [
      {
        ref: 'TEST-001',
        nom_fr: 'TEST Mini-pelle',
        nom_zh: 'TEST 挖掘机',
        qte_colis: 1,
        qte_pieces: 1,
        l: 315,
        L: 125,
        h: 255,
        volume_m3: 10.07,
        poids_net: 2200,
      },
    ],
    volume_total: 10.07,
    poids_total: 2200,
    createdAt: now,
  },
  {
    id: 'CTN-2604-002',
    numero: 'CTN-2604-002',
    type: '20ft',
    destination: 'GP',
    statut: 'chargé',
    port_chargement: 'SHANGHAI',
    port_destination: 'POINTE-A-PITRE',
    date_depart: Timestamp.fromDate(new Date('2026-05-15')),
    lignes: [
      {
        ref: 'TEST-002',
        nom_fr: 'TEST Maison Modulaire',
        nom_zh: 'TEST 集装箱房',
        qte_colis: 1,
        qte_pieces: 1,
        l: 600,
        L: 240,
        h: 260,
        volume_m3: 37.44,
        poids_net: 3500,
      },
    ],
    volume_total: 37.44,
    poids_total: 3500,
    createdAt: now,
  },
];

// ========== NOTES DE COMMISSION (commissions) ==========
const commissions = [
  {
    id: 'NC-2604001',
    numero: 'NC-2604001',
    partenaire_id: 'jm',
    partenaire_nom: 'Jean-Marc Delacroix',
    lignes: [
      {
        quote_id: 'DVS-2604001',
        client: 'Jean Dupont',
        montant_ht: 9900,
        taux: 15,
        commission: 1485,
      },
    ],
    total_commission: 1485,
    statut: 'due',
    createdAt: now,
  },
  {
    id: 'NC-2604002',
    numero: 'NC-2604002',
    partenaire_id: 'td',
    partenaire_nom: 'Thomas Dupont',
    lignes: [
      {
        quote_id: 'DVS-2604002',
        client: 'Marie Martin',
        montant_ht: 6400,
        taux: 15,
        commission: 960,
      },
      {
        quote_id: 'DVS-2604004',
        client: 'Sophie Leblanc',
        montant_ht: 7600,
        taux: 15,
        commission: 1140,
      },
    ],
    total_commission: 2100,
    statut: 'due',
    createdAt: now,
  },
];

// ========== SAV ==========
const savTickets = [
  {
    id: 'SAV-2604001',
    numero: 'SAV-2604001',
    client_nom: 'Jean Dupont',
    client_email: 'jean.dupont@gmail.com',
    quote_id: 'DVS-2604001',
    produit_ref: 'TEST-001',
    description: 'Chenille abîmée après 3 mois d\'utilisation',
    statut: 'nouveau',
    createdAt: now,
  },
  {
    id: 'SAV-2604002',
    numero: 'SAV-2604002',
    client_nom: 'Sophie Leblanc',
    client_email: 'sophie.leblanc@gmail.com',
    quote_id: 'DVS-2604004',
    produit_ref: 'TEST-001',
    description: 'Fuite hydraulique constatée sur le vérin gauche',
    statut: 'en cours',
    createdAt: now,
  },
];

// ========== STOCK ==========
const stockItems = [
  {
    id: 'STK-001',
    ref_piece: 'STK-001',
    nom: 'TEST Chenille caoutchouc universelle',
    compatible: ['TEST-001'],
    qte: 2,
    seuil_alerte: 1,
    createdAt: now,
  },
  {
    id: 'STK-002',
    ref_piece: 'STK-002',
    nom: 'TEST Joint hydraulique universel',
    compatible: ['TEST-001', 'TEST-004'],
    qte: 5,
    seuil_alerte: 2,
    createdAt: now,
  },
  {
    id: 'STK-003',
    ref_piece: 'STK-003',
    nom: 'TEST Godet 60cm universel',
    compatible: ['TEST-001'],
    qte: 1,
    seuil_alerte: 1,
    createdAt: now,
  },
];

// ========== PARTENAIRES (partners) ==========
const partners = [
  {
    id: 'jm',
    nom: 'Jean-Marc Delacroix',
    code: 'JM',
    email: 'jm@partner.com',
    tel: '+596 696 100 001',
    commission_taux: 15,
    actif: true,
    createdAt: now,
  },
  {
    id: 'td',
    nom: 'Thomas Dupont',
    code: 'TD',
    email: 'td@partner.com',
    tel: '+596 696 100 002',
    commission_taux: 15,
    actif: true,
    createdAt: now,
  },
  {
    id: 'mc',
    nom: 'Michel Chen',
    code: 'MC',
    email: 'mc@partner.com',
    tel: '+86 135 001 0001',
    commission_taux: 12,
    actif: true,
    createdAt: now,
  },
  {
    id: 'al',
    nom: 'Alice Laurent',
    code: 'AL',
    email: 'al@partner.com',
    tel: '+590 690 100 003',
    commission_taux: 10,
    actif: true,
    createdAt: now,
  },
];

// ========== SEED FUNCTION ==========
async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  let counts = {
    admin_params: 0,
    profiles: 0,
    products: 0,
    quotes: 0,
    invoices: 0,
    containers: 0,
    commissions: 0,
    sav: 0,
    stock: 0,
    partners: 0,
  };

  // Admin params
  console.log('📋 Admin params...');
  for (const [key, data] of Object.entries(adminParams)) {
    await setDoc(doc(db, 'admin_params', key), data);
    counts.admin_params++;
    console.log(`  ✅ admin_params/${key}`);
  }

  // Clients (profiles)
  console.log('\n👥 Clients (profiles)...');
  for (const c of clients) {
    await setDoc(doc(db, 'profiles', c.id), c);
    counts.profiles++;
    console.log(`  ✅ ${c.nom} — ${c.email}`);
  }

  // Products
  console.log('\n📦 Produits...');
  for (const p of products) {
    await setDoc(doc(db, 'products', p.id), p);
    counts.products++;
    console.log(`  ✅ ${p.numero_interne} — ${p.nom_fr}`);
  }

  // Quotes
  console.log('\n📋 Devis...');
  for (const q of quotes) {
    await setDoc(doc(db, 'quotes', q.id), q);
    counts.quotes++;
    console.log(`  ✅ ${q.numero} — ${q.client_nom} — ${q.total_ht}€`);
  }

  // Invoices
  console.log('\n🧾 Factures...');
  for (const inv of invoices) {
    await setDoc(doc(db, 'invoices', inv.id), inv);
    counts.invoices++;
    console.log(`  ✅ ${inv.numero} — ${inv.type} — ${inv.montant}€`);
  }

  // Containers
  console.log('\n🚢 Conteneurs...');
  for (const c of containers) {
    await setDoc(doc(db, 'containers', c.id), c);
    counts.containers++;
    console.log(`  ✅ ${c.numero} — ${c.type} → ${c.destination}`);
  }

  // Commissions
  console.log('\n💰 Notes de commission...');
  for (const c of commissions) {
    await setDoc(doc(db, 'commissions', c.id), c);
    counts.commissions++;
    console.log(`  ✅ ${c.numero} — ${c.partenaire_nom} — ${c.total_commission}€`);
  }

  // SAV
  console.log('\n🔧 SAV...');
  for (const s of savTickets) {
    await setDoc(doc(db, 'sav', s.id), s);
    counts.sav++;
    console.log(`  ✅ ${s.numero} — ${s.client_nom}`);
  }

  // Stock
  console.log('\n📦 Stock...');
  for (const s of stockItems) {
    await setDoc(doc(db, 'stock', s.id), s);
    counts.stock++;
    console.log(`  ✅ ${s.ref_piece} — ${s.nom}`);
  }

  // Partners
  console.log('\n🤝 Partenaires...');
  for (const p of partners) {
    await setDoc(doc(db, 'partners', p.id), p);
    counts.partners++;
    console.log(`  ✅ ${p.code} — ${p.nom}`);
  }

  console.log('\n🎉 Seed completed!\n');
  console.log('Documents créés:');
  console.log(`  - admin_params: ${counts.admin_params}`);
  console.log(`  - profiles (clients): ${counts.profiles}`);
  console.log(`  - products: ${counts.products}`);
  console.log(`  - quotes (devis): ${counts.quotes}`);
  console.log(`  - invoices (factures): ${counts.invoices}`);
  console.log(`  - containers: ${counts.containers}`);
  console.log(`  - commissions: ${counts.commissions}`);
  console.log(`  - sav: ${counts.sav}`);
  console.log(`  - stock: ${counts.stock}`);
  console.log(`  - partners: ${counts.partners}`);
  console.log(`\nTotal: ${Object.values(counts).reduce((a, b) => a + b, 0)} documents`);

  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
