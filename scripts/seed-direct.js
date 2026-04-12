// scripts/seed-direct.js
// Exécution : node scripts/seed-direct.js

const API_KEY = 'AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo';
const PROJECT_ID = 'importok-6ef77';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function auth() {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'parisb2b@gmail.com', password: '20262026', returnSecureToken: true })
  });
  const data = await res.json();
  if (!data.idToken) throw new Error('Auth failed: ' + JSON.stringify(data));
  return data.idToken;
}

function toFirestore(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestore) } };
  if (typeof val === 'object' && val._isTimestamp) {
    return { timestampValue: val.value };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestore(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function timestamp() {
  return { _isTimestamp: true, value: new Date().toISOString() };
}

async function deleteDoc(token, collection, docId) {
  await fetch(`${FIRESTORE_URL}/${collection}/${docId}?key=${API_KEY}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

async function listDocs(token, collection) {
  const res = await fetch(`${FIRESTORE_URL}/${collection}?key=${API_KEY}&pageSize=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  return (data.documents || []).map(d => d.name.split('/').pop());
}

async function setDoc(token, collection, docId, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFirestore(v);
  }
  const res = await fetch(`${FIRESTORE_URL}/${collection}/${docId}?key=${API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`${collection}/${docId}: ${JSON.stringify(err)}`);
  }
  console.log(`  ✅ ${collection}/${docId}`);
}

async function purgeCollection(token, collection) {
  const docs = await listDocs(token, collection);
  for (const docId of docs) {
    await deleteDoc(token, collection, docId);
    console.log(`  🗑️ ${collection}/${docId}`);
  }
  return docs.length;
}

async function main() {
  console.log('🔐 Auth...');
  const token = await auth();
  console.log('✅ Connecté\n');

  // ============ PURGE ============
  console.log('🧹 PURGE TOTALE...');
  const collections = ['quotes', 'invoices', 'commissions', 'sav', 'stock', 'containers', 'profiles', 'partners', 'products', 'admin_params', 'logs'];
  let totalDeleted = 0;
  for (const coll of collections) {
    const count = await purgeCollection(token, coll);
    totalDeleted += count;
  }
  console.log(`\n✅ PURGE TERMINÉE: ${totalDeleted} documents supprimés\n`);

  const NOW = timestamp();

  // ============ ADMIN PARAMS ============
  console.log('📋 admin_params...');
  await setDoc(token, 'admin_params', 'global', {
    taux_rmb_eur: 7.82,
    taux_majoration_user: 2.0,
    taux_majoration_partner: 1.2,
    acompte_pct_defaut: 30,
    delai_validite_devis: 30,
    createdAt: NOW
  });

  await setDoc(token, 'admin_params', 'emetteur', {
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
    createdAt: NOW
  });

  // ============ CLIENTS ============
  console.log('\n👥 profiles...');
  const clients = [
    { id: 'CLI-001', email: 'jean.dupont@gmail.com', nom: 'Jean Dupont', tel: '+596 696 001 001', adresse: '12 rue des Caraïbes, 97200 Fort-de-France', territoire: 'Martinique', pays: 'France', type: 'SARL', role: 'user' },
    { id: 'CLI-002', email: 'marie.martin@gmail.com', nom: 'Marie Martin', tel: '+590 690 002 002', adresse: '8 allée des Flamboyants, 97100 Basse-Terre', territoire: 'Guadeloupe', pays: 'France', type: 'Particulier', role: 'user' },
    { id: 'CLI-003', email: 'pierre.bernard@gmail.com', nom: 'Pierre Bernard', tel: '+262 692 003 003', adresse: '45 bd du Chaudron, 97490 Sainte-Clotilde', territoire: 'La Réunion', pays: 'France', type: 'SAS', role: 'user' },
    { id: 'CLI-004', email: 'sophie.leblanc@gmail.com', nom: 'Sophie Leblanc', tel: '+596 696 004 004', adresse: '3 impasse des Bougainvilliers, 97232 Le Lamentin', territoire: 'Martinique', pays: 'France', type: 'Particulier', role: 'vip' },
    { id: 'CLI-005', email: 'marc.durand@gmail.com', nom: 'Marc Durand', tel: '+594 694 005 005', adresse: '27 av. du Général de Gaulle, 97300 Cayenne', territoire: 'Guyane', pays: 'France', type: 'SARL', role: 'user' },
  ];
  for (const c of clients) await setDoc(token, 'profiles', c.id, { ...c, createdAt: NOW });

  // ============ PRODUITS ============
  console.log('\n📦 products...');
  const products = [
    { id: 'MP-R22-001', numero_interne: 'MP-R22-001', nom_fr: 'Mini-pelle 1.8T', nom_zh: '1.8吨小型挖掘机', categorie: 'mini-pelles', prix_achat_cny: 85000, prix_achat_eur: 10870, prix_public_eur: 21740, actif: true },
    { id: 'MP-R32-001', numero_interne: 'MP-R32-001', nom_fr: 'Mini-pelle 3.5T', nom_zh: '3.5吨小型挖掘机', categorie: 'mini-pelles', prix_achat_cny: 120000, prix_achat_eur: 15345, prix_public_eur: 30690, actif: true },
    { id: 'MS-20-001', numero_interne: 'MS-20-001', nom_fr: 'Maison modulaire 20m²', nom_zh: '20平米模块化房屋', categorie: 'maisons-modulaires', prix_achat_cny: 45000, prix_achat_eur: 5755, prix_public_eur: 11510, actif: true },
    { id: 'SOL-5KW-001', numero_interne: 'SOL-5KW-001', nom_fr: 'Kit Solaire 5kW', nom_zh: '5千瓦太阳能套件', categorie: 'solaire', prix_achat_cny: 24000, prix_achat_eur: 3070, prix_public_eur: 6140, actif: true },
    { id: 'MA-MOT-001', numero_interne: 'MA-MOT-001', nom_fr: 'Motoculteur 12CV', nom_zh: '12马力微耕机', categorie: 'machines-agricoles', prix_achat_cny: 8500, prix_achat_eur: 1087, prix_public_eur: 2174, actif: true },
    { id: 'DIV-GEN-001', numero_interne: 'DIV-GEN-001', nom_fr: 'Groupe électrogène 5kVA', nom_zh: '5千伏安发电机', categorie: 'divers', prix_achat_cny: 12000, prix_achat_eur: 1534, prix_public_eur: 3068, actif: true },
  ];
  for (const p of products) await setDoc(token, 'products', p.id, { ...p, createdAt: NOW });

  // ============ PARTENAIRES ============
  console.log('\n🤝 partners...');
  const partners = [
    { id: 'PART-JM', code: 'JM', nom: 'Jean-Marc Delacroix', email: 'jm@partner.com', tel: '+596 696 100 001', commission_taux: 15, actif: true },
    { id: 'PART-TD', code: 'TD', nom: 'Thomas Dupont', email: 'td@partner.com', tel: '+596 696 100 002', commission_taux: 12, actif: true },
    { id: 'PART-MC', code: 'MC', nom: 'Michel Chen', email: 'mc@partner.com', tel: '+86 135 001 0001', commission_taux: 10, actif: true },
  ];
  for (const p of partners) await setDoc(token, 'partners', p.id, { ...p, createdAt: NOW });

  // ============ DEVIS ============
  console.log('\n📋 quotes...');
  const quotes = [
    {
      id: 'DVS-2604201', numero: 'DVS-2604201',
      client_id: 'CLI-001', client_nom: 'Jean Dupont', client_email: 'jean.dupont@gmail.com',
      client_adresse: '12 rue des Caraïbes, 97200 Fort-de-France, Martinique', client_tel: '+596 696 001 001',
      destination: 'MQ', statut: 'envoye',
      lignes: [
        { ref: 'MP-R22-001', nom_fr: 'Mini-pelle 1.8T', qte: 1, prix_unitaire: 11510, total: 11510 },
        { ref: 'SOL-5KW-001', nom_fr: 'Kit Solaire 5kW', qte: 2, prix_unitaire: 3070, total: 6140 }
      ],
      total_ht: 17650, acompte_pct: 30, total_encaisse: 5295, solde_restant: 12355
    },
    {
      id: 'DVS-2604202', numero: 'DVS-2604202',
      client_id: 'CLI-002', client_nom: 'Marie Martin', client_email: 'marie.martin@gmail.com',
      client_adresse: '8 allée des Flamboyants, 97100 Basse-Terre, Guadeloupe', client_tel: '+590 690 002 002',
      destination: 'GP', statut: 'accepte', partenaire_id: 'PART-TD', partenaire_code: 'TD',
      lignes: [
        { ref: 'MS-20-001', nom_fr: 'Maison modulaire 20m²', qte: 1, prix_unitaire: 11510, total: 11510 },
        { ref: 'MA-MOT-001', nom_fr: 'Motoculteur 12CV', qte: 3, prix_unitaire: 2174, total: 6522 }
      ],
      total_ht: 18032, acompte_pct: 30, total_encaisse: 5410, solde_restant: 12622
    },
    {
      id: 'DVS-2604203', numero: 'DVS-2604203',
      client_id: 'CLI-003', client_nom: 'Pierre Bernard', client_email: 'pierre.bernard@gmail.com',
      client_adresse: '45 bd du Chaudron, 97490 Sainte-Clotilde, La Réunion', client_tel: '+262 692 003 003',
      destination: 'RE', statut: 'brouillon',
      lignes: [
        { ref: 'SOL-5KW-001', nom_fr: 'Kit Solaire 5kW', qte: 4, prix_unitaire: 3070, total: 12280 }
      ],
      total_ht: 12280, acompte_pct: 30, total_encaisse: 0, solde_restant: 12280
    },
    {
      id: 'DVS-2604204', numero: 'DVS-2604204',
      client_id: 'CLI-004', client_nom: 'Sophie Leblanc', client_email: 'sophie.leblanc@gmail.com',
      client_adresse: '3 impasse des Bougainvilliers, 97232 Le Lamentin, Martinique', client_tel: '+596 696 004 004',
      destination: 'MQ', statut: 'accepte', is_vip: true, partenaire_id: 'PART-JM', partenaire_code: 'JM',
      lignes: [
        { ref: 'MP-R22-001', nom_fr: 'Mini-pelle 1.8T', qte: 1, prix_unitaire: 11510, total: 11510 },
        { ref: 'DIV-GEN-001', nom_fr: 'Groupe électrogène 5kVA', qte: 1, prix_unitaire: 3068, total: 3068 }
      ],
      total_ht: 14578, acompte_pct: 30, total_encaisse: 4373, solde_restant: 10205
    },
    {
      id: 'DVS-2604205', numero: 'DVS-2604205',
      client_id: 'CLI-005', client_nom: 'Marc Durand', client_email: 'marc.durand@gmail.com',
      client_adresse: '27 av. du Général de Gaulle, 97300 Cayenne, Guyane', client_tel: '+594 694 005 005',
      destination: 'GF', statut: 'livre',
      lignes: [
        { ref: 'MP-R32-001', nom_fr: 'Mini-pelle 3.5T', qte: 1, prix_unitaire: 30690, total: 30690 }
      ],
      total_ht: 30690, acompte_pct: 100, total_encaisse: 30690, solde_restant: 0
    },
  ];
  for (const q of quotes) await setDoc(token, 'quotes', q.id, { ...q, createdAt: NOW });

  // ============ FACTURES ============
  console.log('\n🧾 invoices...');
  const invoices = [
    { id: 'FA-2604201', numero: 'FA-2604201', type: 'acompte', quote_id: 'DVS-2604201', quote_numero: 'DVS-2604201', montant: 5295, client_nom: 'Jean Dupont' },
    { id: 'FA-2604202', numero: 'FA-2604202', type: 'acompte', quote_id: 'DVS-2604204', quote_numero: 'DVS-2604204', montant: 4373, client_nom: 'Sophie Leblanc' },
    { id: 'F-2604201', numero: 'F-2604201', type: 'facture', quote_id: 'DVS-2604205', quote_numero: 'DVS-2604205', montant: 30690, client_nom: 'Marc Durand' },
  ];
  for (const inv of invoices) await setDoc(token, 'invoices', inv.id, { ...inv, createdAt: NOW });

  // ============ CONTENEURS ============
  console.log('\n🚢 containers...');
  const containers = [
    { id: 'CTN-2604201', numero: 'CTN-2604201', type: '40ft-HC', destination: 'MQ', statut: 'preparation', port_chargement: 'NINGBO', port_destination: 'FORT-DE-FRANCE', date_depart: '2026-05-15',
      lignes: [{ ref: 'MP-R22-001', nom_fr: 'Mini-pelle 1.8T', qte_colis: 1, qte_pieces: 1, volume_m3: 10.07, poids_net: 1800 }], volume_total: 10.07, poids_total: 1800 },
    { id: 'CTN-2604202', numero: 'CTN-2604202', type: '20ft', destination: 'GP', statut: 'charge', port_chargement: 'SHANGHAI', port_destination: 'POINTE-A-PITRE', date_depart: '2026-06-01',
      lignes: [{ ref: 'MS-20-001', nom_fr: 'Maison modulaire 20m²', qte_colis: 1, qte_pieces: 1, volume_m3: 37.44, poids_net: 3500 }], volume_total: 37.44, poids_total: 3500 },
  ];
  for (const c of containers) await setDoc(token, 'containers', c.id, { ...c, createdAt: NOW });

  // ============ COMMISSIONS ============
  console.log('\n💰 commissions...');
  const commissions = [
    { id: 'NC-2604201', numero: 'NC-2604201', partenaire_id: 'PART-JM', partenaire_nom: 'Jean-Marc Delacroix',
      lignes: [{ quote_id: 'DVS-2604204', client: 'Sophie Leblanc', montant_ht: 14578, taux: 15, commission: 2187 }],
      total_commission: 2187, statut: 'due' },
    { id: 'NC-2604202', numero: 'NC-2604202', partenaire_id: 'PART-TD', partenaire_nom: 'Thomas Dupont',
      lignes: [{ quote_id: 'DVS-2604202', client: 'Marie Martin', montant_ht: 18032, taux: 12, commission: 2164 }],
      total_commission: 2164, statut: 'due' },
  ];
  for (const c of commissions) await setDoc(token, 'commissions', c.id, { ...c, createdAt: NOW });

  // ============ SAV ============
  console.log('\n🔧 sav...');
  const savTickets = [
    { id: 'SAV-2604201', numero: 'SAV-2604201', client_nom: 'Jean Dupont', client_email: 'jean.dupont@gmail.com', quote_id: 'DVS-2604201', produit_ref: 'MP-R22-001', description: 'Chenille caoutchouc usée après 3 mois', statut: 'nouveau' },
    { id: 'SAV-2604202', numero: 'SAV-2604202', client_nom: 'Sophie Leblanc', client_email: 'sophie.leblanc@gmail.com', quote_id: 'DVS-2604204', produit_ref: 'MP-R22-001', description: 'Fuite hydraulique sur vérin gauche', statut: 'en_cours' },
  ];
  for (const s of savTickets) await setDoc(token, 'sav', s.id, { ...s, createdAt: NOW });

  // ============ STOCK ============
  console.log('\n📦 stock...');
  const stockItems = [
    { id: 'STK-001', ref_piece: 'STK-001', nom: 'Chenille caoutchouc universelle', compatible: ['MP-R22-001', 'MP-R32-001'], qte: 2, seuil_alerte: 1 },
    { id: 'STK-002', ref_piece: 'STK-002', nom: 'Joint hydraulique universel', compatible: ['MP-R22-001', 'MP-R32-001'], qte: 5, seuil_alerte: 2 },
    { id: 'STK-003', ref_piece: 'STK-003', nom: 'Godet 60cm standard', compatible: ['MP-R22-001'], qte: 1, seuil_alerte: 1 },
  ];
  for (const s of stockItems) await setDoc(token, 'stock', s.id, { ...s, createdAt: NOW });

  // ============ RÉSUMÉ ============
  console.log('\n🎉 SEED TERMINÉ !');
  console.log('  admin_params: 2');
  console.log('  profiles: 5');
  console.log('  products: 6');
  console.log('  partners: 3');
  console.log('  quotes: 5 (DVS-2604201 à DVS-2604205)');
  console.log('  invoices: 3 (FA-2604201, FA-2604202, F-2604201)');
  console.log('  containers: 2');
  console.log('  commissions: 2');
  console.log('  sav: 2');
  console.log('  stock: 3');
  console.log('  TOTAL: 33 documents');
}

main().catch(err => { console.error('❌ ERREUR:', err.message); process.exit(1); });
