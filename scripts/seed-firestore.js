// scripts/seed-firestore.js
// Seed Firestore with test data using client SDK
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

// Admin params
const adminParams = {
  global: {
    taux_rmb_eur: 7.82,
    taux_majoration_user: 2,
    taux_majoration_partner: 1.2,
    acompte_pct_defaut: 30,
    delai_validite_devis: 30,
  },
  emetteur: {
    nom: 'LUXENT LIMITED',
    adresse: '2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD RUISLIP',
    ville: 'LONDON',
    pays: 'UK',
    company_number: '14852122',
    email: 'parisb2b@gmail.com',
    tel_cn: '+86 138 0000 0000',
    tel_fr: '+33 6 63 28 49 08',
    iban: 'DE76 2022 0800 0059 5688 30',
    swift: 'SXPYDEHH',
    banque: 'Banking Circle S.A. — Munich',
  },
  site: {
    hero_titre: "L'importation simplifiee de la Chine vers les Antilles.",
    hero_soustitre: 'Mini-pelles, maisons modulaires, kit solaire. Prix usine, DOM-TOM.',
    whatsapp: '+33 6 63 28 49 08',
    email: 'parisb2b@gmail.com',
    tiktok: '@direxport',
  },
};

// Partenaires
const partenaires = [
  { id: 'JM', code: 'JM', nom: 'Jean-Marc', email: 'jm@email.com', tel: '+33 6 00 00 00 01', actif: true, commission_due: 3160, commission_payee: 2400 },
  { id: 'TD', code: 'TD', nom: 'Thomas D.', email: 'td@email.com', tel: '+33 6 00 00 00 02', actif: true, commission_due: 4900, commission_payee: 9400 },
  { id: 'MC', code: 'MC', nom: 'Marie C.', email: 'mc@email.com', tel: '+33 6 00 00 00 03', actif: true, commission_due: 260, commission_payee: 4500 },
  { id: 'AL', code: 'AL', nom: 'Alexandre L.', email: 'al@email.com', tel: '+33 6 00 00 00 04', actif: true, commission_due: 0, commission_payee: 5800 },
];

// Produits (1 par categorie)
const products = [
  {
    id: 'MP-R22-001',
    numero_interne: 'MP-R22-001',
    categorie: 'mini-pelles',
    gamme: 'R22 PRO',
    type: 'machine',
    nom_fr: 'Mini-pelle R22 PRO 2.2T',
    nom_zh: '小型挖掘机 R22 PRO 2.2T',
    nom_en: 'Mini excavator R22 PRO 2.2T',
    description_fr: 'Mini-pelle compacte 2.2 tonnes, moteur Yanmar, chenilles caoutchouc.',
    prix_achat_cny: 94800,
    prix_achat_eur: 12123,
    prix_public_eur: 24246,
    prix_partner_eur: 14548,
    poids_net_kg: 2200,
    poids_brut_kg: 2450,
    longueur_cm: 320,
    largeur_cm: 140,
    hauteur_cm: 250,
    volume_m3: 11.2,
    code_hs: '8429.52',
    marque: 'RIPPA',
    ville_origine: '重庆市',
    actif: true,
    photos: [],
    createdAt: now,
  },
  {
    id: 'MS-20-001',
    numero_interne: 'MS-20-001',
    categorie: 'maisons-modulaires',
    gamme: 'Standard',
    type: 'machine',
    nom_fr: 'Maison Standard 20P',
    nom_zh: '标准房屋 20P',
    nom_en: 'Standard House 20P',
    description_fr: 'Maison modulaire 20 panneaux, isolation thermique, prête à monter.',
    prix_achat_cny: 33660,
    prix_achat_eur: 4305,
    prix_public_eur: 8616,
    prix_partner_eur: 5166,
    poids_net_kg: 3500,
    poids_brut_kg: 3800,
    code_hs: '9406.90',
    actif: true,
    photos: [],
    createdAt: now,
  },
  {
    id: 'SOL-KIT-001',
    numero_interne: 'SOL-KIT-001',
    categorie: 'solaire',
    gamme: 'Kit complet',
    type: 'machine',
    nom_fr: 'Kit Solaire 5kW Complet',
    nom_zh: '5kW太阳能套件',
    nom_en: 'Solar Kit 5kW Complete',
    description_fr: 'Kit solaire autonome 5kW avec panneaux, onduleur et batteries.',
    prix_achat_cny: 28000,
    prix_achat_eur: 3580,
    prix_public_eur: 7160,
    prix_partner_eur: 4296,
    code_hs: '8541.40',
    actif: true,
    photos: [],
    createdAt: now,
  },
  {
    id: 'MA-MOTO-001',
    numero_interne: 'MA-MOTO-001',
    categorie: 'machines-agricoles',
    gamme: 'Motoculteur',
    type: 'machine',
    nom_fr: 'Motoculteur 7CV Diesel',
    nom_zh: '7马力柴油旋耕机',
    nom_en: 'Rotary Tiller 7HP Diesel',
    description_fr: 'Motoculteur diesel 7CV avec fraises et roues.',
    prix_achat_cny: 8500,
    prix_achat_eur: 1087,
    prix_public_eur: 2174,
    prix_partner_eur: 1304,
    code_hs: '8432.29',
    actif: true,
    photos: [],
    createdAt: now,
  },
  {
    id: 'LOG-CTN-2604-001',
    numero_interne: 'LOG-CTN-2604-001',
    categorie: 'services',
    type: 'service',
    nom_fr: 'Frais logistiques 40HC MQ',
    nom_zh: '物流费用 40HC MQ',
    nom_en: 'Logistics fees 40HC MQ',
    description_fr: 'Frais de transport maritime conteneur 40HC vers Martinique.',
    prix_achat_cny: 0,
    prix_public_eur: 0,
    actif: false,
    createdAt: now,
  },
];

// Devis
const quotes = [
  {
    id: 'D2604006',
    numero: 'D2604006',
    client_uid: 'uExJLs4GLeVPrf4zRLFMPweoW9m1',
    client_nom: 'Dupont Michel',
    client_email: 'dupont@email.com',
    partenaire_code: 'JM',
    destination: 'MQ',
    statut: 'acompte_1',
    is_vip: true,
    lignes: [
      { reference: 'MP-R22-001', nom: 'Mini-pelle R22 PRO 2.2T', quantite: 1, prix_unitaire: 14200, total: 14200 },
    ],
    total_ht: 14200,
    acompte_1: 5000,
    solde_restant: 9200,
    conteneur_ref: 'CTN-2604-001',
    createdAt: now,
  },
  {
    id: 'D2604007',
    numero: 'D2604007',
    client_nom: 'Martin Pierre',
    client_email: 'martin@email.com',
    partenaire_code: 'TD',
    destination: 'GP',
    statut: 'brouillon',
    is_vip: false,
    lignes: [
      { reference: 'MS-20-001', nom: 'Maison Standard 20P', quantite: 1, prix_unitaire: 8616, total: 8616 },
      { reference: 'SOL-KIT-001', nom: 'Kit Solaire 5kW', quantite: 1, prix_unitaire: 7160, total: 7160 },
    ],
    total_ht: 18400,
    createdAt: now,
  },
];

// Conteneur
const containers = [
  {
    id: 'CTN-2604-001',
    reference: 'CTN-2604-001',
    type: '40HC',
    destination: 'MQ',
    port_chargement: 'YANTIAN',
    date_depart: '2026-04-23',
    date_arrivee_est: '2026-05-25',
    statut: 'préparation',
    volume_utilise: 48,
    volume_max: 67,
    prix_interne_usd: 8000,
    bl_number: '',
    seal_number: '',
    createdAt: now,
  },
];

// Profiles (clients)
const profiles = [
  {
    id: 'uExJLs4GLeVPrf4zRLFMPweoW9m1',
    email: 'parisb2b@gmail.com',
    nom: 'Paris B2B Admin',
    role: 'admin',
    createdAt: now,
  },
  {
    id: 'client-dupont',
    email: 'dupont@email.com',
    nom: 'Dupont Michel',
    role: 'vip',
    partenaire_code: 'JM',
    destination: 'MQ',
    createdAt: now,
  },
  {
    id: 'client-martin',
    email: 'martin@email.com',
    nom: 'Martin Pierre',
    role: 'user',
    partenaire_code: 'TD',
    destination: 'GP',
    createdAt: now,
  },
];

async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  // Admin params
  console.log('📋 Admin params...');
  for (const [key, data] of Object.entries(adminParams)) {
    await setDoc(doc(db, 'admin_params', key), data);
    console.log(`  ✅ admin_params/${key}`);
  }

  // Partenaires
  console.log('\n🤝 Partenaires...');
  for (const p of partenaires) {
    await setDoc(doc(db, 'partenaires', p.id), p);
    console.log(`  ✅ ${p.code} — ${p.nom}`);
  }

  // Products
  console.log('\n📦 Produits...');
  for (const p of products) {
    await setDoc(doc(db, 'products', p.id), p);
    console.log(`  ✅ ${p.numero_interne} — ${p.nom_fr}`);
  }

  // Quotes
  console.log('\n📋 Devis...');
  for (const q of quotes) {
    await setDoc(doc(db, 'quotes', q.id), q);
    console.log(`  ✅ ${q.numero} — ${q.client_nom} — ${q.total_ht}€`);
  }

  // Containers
  console.log('\n🚢 Conteneurs...');
  for (const c of containers) {
    await setDoc(doc(db, 'containers', c.id), c);
    console.log(`  ✅ ${c.reference} — ${c.type} → ${c.destination}`);
  }

  // Profiles
  console.log('\n👥 Profiles...');
  for (const p of profiles) {
    await setDoc(doc(db, 'profiles', p.id), p);
    console.log(`  ✅ ${p.email} — ${p.role}`);
  }

  console.log('\n🎉 Seed completed!\n');
  console.log('Test data:');
  console.log('  - 5 produits');
  console.log('  - 2 devis');
  console.log('  - 1 conteneur');
  console.log('  - 4 partenaires');
  console.log('  - 3 profiles');
  console.log('  - admin_params (global, emetteur, site)');

  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
