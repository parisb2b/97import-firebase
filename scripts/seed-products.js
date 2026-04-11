// scripts/seed-products.js
// Exécuter avec: node scripts/seed-products.js
// Requiert serviceAccountKey.json dans scripts/

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialiser avec le service account
try {
  initializeApp({
    credential: cert('./scripts/serviceAccountKey.json'),
  });
} catch (e) {
  console.log('App already initialized or no service account');
}

const db = getFirestore();

const PRODUCTS = [
  {
    numero_interne: 'MP-R22-001',
    categorie: 'mini-pelles',
    sous_categorie: 'R22',
    nom_fr: 'Mini-pelle R22 — chenille caoutchouc',
    nom_zh: '挖掘机 R22 — 橡胶履带',
    nom_en: 'Mini Excavator R22 — Rubber Track',
    description_fr: 'Mini-pelle compacte idéale pour travaux de terrassement, VRD et aménagement paysager. Moteur diesel économique, cabine confortable avec climatisation.',
    description_zh: '紧凑型小型挖掘机，适合土方工程、道路和景观施工。经济型柴油发动机，舒适的空调驾驶室。',
    description_en: 'Compact mini excavator ideal for earthworks, road works and landscaping. Economical diesel engine, comfortable cab with air conditioning.',
    prix_achat_cny: 34200,
    prix_achat_eur: 4375,
    dimensions: {
      l: 315,
      L: 125,
      h: 255,
      volume_m3: 10.07,
      poids_net_kg: 2200,
      poids_brut_kg: 2350,
    },
    code_hs: '8429.52',
    fournisseur: 'RIPPA',
    actif: true,
    photos: [],
    options_payantes: [
      { ref: 'MP-R22-001-MET', nom_fr: 'Chenille métal', nom_zh: '钢履带', nom_en: 'Metal Track', surcout_eur: 450 },
      { ref: 'ACC-GD-030', nom_fr: 'Godet 30cm', nom_zh: '30cm斗', nom_en: '30cm Bucket', surcout_eur: 320 },
    ],
  },
  {
    numero_interne: 'MS-20-001',
    categorie: 'maisons-modulaires',
    nom_fr: 'Maison Standard 20m²',
    nom_zh: '标准集装箱房 20平米',
    nom_en: 'Standard Modular Home 20sqm',
    description_fr: 'Maison modulaire standard de 20m², livrée équipée. Isolation thermique, électricité pré-câblée, salle d\'eau intégrée.',
    description_zh: '20平米标准模块化房屋，配备齐全。隔热、预接线电气、集成浴室。',
    description_en: 'Standard 20sqm modular home, delivered equipped. Thermal insulation, pre-wired electricity, integrated bathroom.',
    prix_achat_cny: 28000,
    prix_achat_eur: 3580,
    dimensions: {
      l: 600,
      L: 240,
      h: 280,
      volume_m3: 40.32,
      poids_net_kg: 3500,
      poids_brut_kg: 3800,
    },
    code_hs: '9406.10',
    fournisseur: 'CGCH',
    actif: true,
    photos: [],
  },
  {
    numero_interne: 'SOL-KIT-001',
    categorie: 'solaire',
    nom_fr: 'Kit solaire 3kWc complet',
    nom_zh: '太阳能套件 3kWc',
    nom_en: 'Solar Kit 3kWc Complete',
    description_fr: 'Kit solaire complet 3kWc avec panneaux monocristallins, onduleur, structure de fixation et câblage. Prêt à installer.',
    description_zh: '完整的3kWc太阳能套件，包括单晶面板、逆变器、安装结构和电缆。即装即用。',
    description_en: 'Complete 3kWc solar kit with monocrystalline panels, inverter, mounting structure and cabling. Ready to install.',
    prix_achat_cny: 8500,
    prix_achat_eur: 1087,
    dimensions: {
      l: 200,
      L: 120,
      h: 80,
      volume_m3: 1.92,
      poids_net_kg: 180,
      poids_brut_kg: 220,
    },
    code_hs: '8541.40',
    fournisseur: 'JSOLAR',
    actif: true,
    photos: [],
  },
  {
    numero_interne: 'MA-MOTO-001',
    categorie: 'machines-agricoles',
    nom_fr: 'Motoculteur 7CV',
    nom_zh: '耕地机 7马力',
    nom_en: 'Power Tiller 7HP',
    description_fr: 'Motoculteur diesel 7CV robuste. Idéal pour préparation des sols, maraîchage et petites exploitations. Largeur de travail ajustable.',
    description_zh: '坚固的7马力柴油耕地机。适合土壤准备、蔬菜种植和小型农场。可调节工作宽度。',
    description_en: 'Robust 7HP diesel power tiller. Ideal for soil preparation, market gardening and small farms. Adjustable working width.',
    prix_achat_cny: 3200,
    prix_achat_eur: 409,
    dimensions: {
      l: 180,
      L: 80,
      h: 110,
      volume_m3: 1.58,
      poids_net_kg: 120,
      poids_brut_kg: 145,
    },
    code_hs: '8432.29',
    fournisseur: 'KAMA',
    actif: true,
    photos: [],
  },
  {
    numero_interne: 'LOG-FRET-MQ-001',
    categorie: 'services',
    nom_fr: 'Fret maritime — Martinique (20ft)',
    nom_zh: '海运费 — 马提尼克 (20英尺)',
    nom_en: 'Sea Freight — Martinique (20ft)',
    description_fr: 'Service de fret maritime conteneur 20 pieds de Ningbo (Chine) à Fort-de-France (Martinique). Transit 35-40 jours.',
    description_zh: '从中国宁波到马提尼克法兰西堡的20英尺集装箱海运服务。运输时间35-40天。',
    description_en: 'Sea freight service 20ft container from Ningbo (China) to Fort-de-France (Martinique). Transit 35-40 days.',
    prix_achat_cny: 9600,
    prix_achat_eur: 1228,
    code_hs: '9999.00',
    fournisseur: 'COSCO',
    actif: true,
    photos: [],
  },
];

async function seedProducts() {
  console.log('🌱 Seeding products...');

  for (const product of PRODUCTS) {
    const id = product.numero_interne.replace(/[^a-zA-Z0-9]/g, '-');
    try {
      await db.collection('products').doc(id).set({
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ ${product.numero_interne} — ${product.nom_fr}`);
    } catch (e) {
      console.error(`❌ ${product.numero_interne}:`, e.message);
    }
  }

  console.log('\n✅ Products seeding completed!');
}

// Seed admin_params
async function seedParams() {
  console.log('\n🌱 Seeding admin_params...');

  try {
    await db.collection('admin_params').doc('global').set({
      taux_rmb_eur: 7.82,
      taux_rmb_updated: new Date(),
      taux_majoration_user: 2.0,
      taux_majoration_partner: 1.2,
      acompte_pct_defaut: 30,
      delai_validite_devis: 30,
    });
    console.log('✅ admin_params/global');

    await db.collection('admin_params').doc('emetteur').set({
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
    });
    console.log('✅ admin_params/emetteur');
  } catch (e) {
    console.error('❌ admin_params:', e.message);
  }
}

// Seed partners
async function seedPartners() {
  console.log('\n🌱 Seeding partners...');

  const PARTNERS = [
    { code: 'JM', nom: 'Jean-Marc Dubois', email: 'jm@97import.com', tel: '+596 696 123456', commission_taux: 15, actif: true },
    { code: 'TD', nom: 'Thomas Dupont', email: 'td@97import.com', tel: '+590 690 234567', commission_taux: 15, actif: true },
    { code: 'MC', nom: 'Michel Chen', email: 'mc@97import.com', tel: '+262 692 345678', commission_taux: 15, actif: true },
    { code: 'AL', nom: 'Alice Laurent', email: 'al@97import.com', tel: '+594 694 456789', commission_taux: 15, actif: true },
  ];

  for (const p of PARTNERS) {
    try {
      await db.collection('partners').doc(p.code).set({
        ...p,
        createdAt: new Date(),
      });
      console.log(`✅ ${p.code} — ${p.nom}`);
    } catch (e) {
      console.error(`❌ ${p.code}:`, e.message);
    }
  }
}

// Run all
async function main() {
  await seedProducts();
  await seedParams();
  await seedPartners();
  console.log('\n🎉 All seeding completed!');
  process.exit(0);
}

main().catch(console.error);
