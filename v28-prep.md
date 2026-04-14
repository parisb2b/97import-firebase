# PROMPT v28-prep — 97import v2 : Normalisation + 5 produits test + 5 comptes test
# Date : 14/04/2026
# Branche : v2 (JAMAIS main)

---

## PROCÉDURE DE DÉMARRAGE OBLIGATOIRE

```bash
cd ~/97import-firebase
git fetch origin && git reset --hard origin/v2
git tag backup-v28prep-$(date +%Y%m%d-%H%M) && git push origin --tags
git log --oneline -5
```

---

## RÈGLES PERMANENTES

1. **Branche v2**, push après chaque action
2. **Ne JAMAIS modifier** `src/admin/`
3. **MAJ28-PREP.TXT** + **MAJALL.TXT** + **~/97import-OK/OK-MAJ-ALL.txt**
4. **Firebase** : `importok-6ef77`

---

# ═══════════════════════════════════════════════════
# PARTIE A — NORMALISATION DES CATÉGORIES FIRESTORE
# ═══════════════════════════════════════════════════

Corriger les incohérences de nommage dans la collection `products` :

```bash
cat > /tmp/normalize-categories.mjs << 'SCRIPT'
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.firebasestorage.app",
  messagingSenderId: "694030851164",
  appId: "1:694030851164:web:1a534b65a93f8d816f1a99"
});

const auth = getAuth(app);
const db = getFirestore(app);

// Connexion admin
await signInWithEmailAndPassword(auth, 'admin@97import.com', '20262026');
console.log('✅ Connecté\n');

const snap = await getDocs(collection(db, 'products'));
console.log(`📦 ${snap.size} produits à normaliser\n`);

// Table de normalisation des catégories
const NORMALIZE_CAT = {
  'mini-pelle': 'Mini-Pelle',
  'Mini-pelle': 'Mini-Pelle',
  'mini_pelle': 'Mini-Pelle',
  'minipelle': 'Mini-Pelle',
  'maisons': 'Maisons',
  'maison': 'Maisons',
  'Maison': 'Maisons',
  'solaire': 'Solaire',
  'SOLAIRE': 'Solaire',
  'divers': 'Divers',
  'DIVERS': 'Divers',
  'machines-agricoles': 'Agricole',
  'Machines-Agricoles': 'Agricole',
  'machines_agricoles': 'Agricole',
  'agricole': 'Agricole',
  'logistique': 'Logistique',
  'LOGISTIQUE': 'Logistique',
};

let updated = 0;
for (const d of snap.docs) {
  const p = d.data();
  const cat = p.categorie || '';
  const normalizedCat = NORMALIZE_CAT[cat] || null;
  
  if (normalizedCat && normalizedCat !== cat) {
    await updateDoc(doc(db, 'products', d.id), { categorie: normalizedCat });
    console.log(`  ✅ ${d.id} : "${cat}" → "${normalizedCat}"`);
    updated++;
  }
}

console.log(`\n=== ${updated} produits mis à jour ===`);

// Vérification finale
const snap2 = await getDocs(collection(db, 'products'));
const cats = {};
snap2.docs.forEach(d => {
  const c = d.data().categorie || 'SANS';
  cats[c] = (cats[c] || 0) + 1;
});
console.log('\nCatégories après normalisation :');
Object.entries(cats).sort().forEach(([k, v]) => console.log(`  ${k} : ${v}`));

process.exit(0);
SCRIPT

node /tmp/normalize-categories.mjs
```

**Commit :**
```bash
git add -A && git commit -m "v28-prep: normalisation catégories Firestore" && git push origin v2
```

---

# ═══════════════════════════════════════════════════
# PARTIE B — CRÉATION DES 5 COMPTES TEST
# ═══════════════════════════════════════════════════

Mot de passe unique pour tous : `20262026`

Pour chaque compte : supprimer l'ancien UID si existant, recréer avec Firebase Auth + profil complet dans Firestore.

```bash
cat > /tmp/create-test-accounts.mjs << 'SCRIPT'
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.firebasestorage.app",
  messagingSenderId: "694030851164",
  appId: "1:694030851164:web:1a534b65a93f8d816f1a99"
});

const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = '20262026';

const ACCOUNTS = [
  {
    email: 'admin@97import.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: '97import',
    phone: '+33 6 20 60 74 48',
    adresse: '2nd Floor College House, 17 King Edwards Road',
    ville: 'Ruislip HA4 7AE',
    codePostal: 'HA4 7AE',
    pays: 'United Kingdom',
  },
  {
    email: 'client@97import.com',
    role: 'user',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+596 6 96 12 34 56',
    adresse: '12 Rue des Palmiers',
    ville: 'Fort-de-France',
    codePostal: '97200',
    pays: 'Martinique',
  },
  {
    email: 'vip@97import.com',
    role: 'vip',
    firstName: 'Marie',
    lastName: 'Martin',
    phone: '+590 6 90 78 90 12',
    adresse: '45 Boulevard Maritime',
    ville: 'Pointe-à-Pitre',
    codePostal: '97110',
    pays: 'Guadeloupe',
  },
  {
    email: 'partenaire@97import.com',
    role: 'partner',
    firstName: 'Pierre',
    lastName: 'Bernard',
    phone: '+33 6 12 34 56 78',
    adresse: '8 Avenue de la République',
    ville: 'Paris',
    codePostal: '75011',
    pays: 'France métropolitaine',
  },
  {
    email: 'client2@97import.com',
    role: 'user',
    firstName: 'Sophie',
    lastName: 'Leblanc',
    phone: '+262 6 92 45 67 89',
    adresse: '23 Chemin des Letchis',
    ville: 'Saint-Denis',
    codePostal: '97400',
    pays: 'Réunion',
  },
];

async function createAccount(account) {
  console.log(`\n--- ${account.email} (${account.role}) ---`);
  
  // Essayer de se connecter pour voir si le compte existe
  try {
    const cred = await signInWithEmailAndPassword(auth, account.email, PASSWORD);
    console.log(`  ⚠️ Compte existant UID: ${cred.user.uid} — suppression...`);
    
    // Supprimer le profil Firestore
    await deleteDoc(doc(db, 'users', cred.user.uid)).catch(() => {});
    await deleteDoc(doc(db, 'profiles', cred.user.uid)).catch(() => {});
    
    // Supprimer le compte Auth
    await deleteUser(cred.user);
    console.log(`  🗑️ Ancien compte supprimé`);
    await signOut(auth);
  } catch (e) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      console.log(`  ℹ️ Compte inexistant — création...`);
    } else if (e.code === 'auth/wrong-password') {
      console.log(`  ⚠️ Compte existe avec un autre mot de passe — impossible de supprimer via client SDK`);
      console.log(`  → Supprimer manuellement dans Firebase Console > Authentication`);
      return;
    } else {
      console.log(`  ⚠️ Erreur: ${e.code} ${e.message}`);
    }
  }
  
  // Créer le nouveau compte
  try {
    const cred = await createUserWithEmailAndPassword(auth, account.email, PASSWORD);
    const uid = cred.user.uid;
    console.log(`  ✅ Compte créé UID: ${uid}`);
    
    // Profil dans /users/{uid}
    const profile = {
      uid,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      phone: account.phone,
      adresse: account.adresse,
      ville: account.ville,
      codePostal: account.codePostal,
      pays: account.pays,
      role: account.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', uid), profile);
    console.log(`  ✅ Profil /users/${uid} créé`);
    
    // Aussi dans /profiles/{uid} (si le code utilise cette collection)
    await setDoc(doc(db, 'profiles', uid), profile);
    console.log(`  ✅ Profil /profiles/${uid} créé`);
    
    // Si partenaire → créer aussi dans /partners
    if (account.role === 'partner') {
      await setDoc(doc(db, 'partners', uid), {
        userId: uid,
        nom: `${account.firstName} ${account.lastName}`,
        email: account.email,
        code: 'PB', // Pierre Bernard
        actif: true,
        createdAt: new Date(),
      });
      console.log(`  ✅ Partenaire /partners/${uid} créé (code: PB)`);
    }
    
    await signOut(auth);
  } catch (e) {
    console.error(`  ❌ Erreur création: ${e.code} ${e.message}`);
  }
}

// Créer les comptes un par un (séquentiel pour éviter les conflits auth)
for (const account of ACCOUNTS) {
  await createAccount(account);
}

console.log('\n\n=== RÉSUMÉ COMPTES TEST ===');
console.log('Email                      | Rôle      | Mot de passe');
console.log('---------------------------|-----------|-------------');
ACCOUNTS.forEach(a => {
  console.log(`${a.email.padEnd(27)} | ${a.role.padEnd(9)} | ${PASSWORD}`);
});

process.exit(0);
SCRIPT

node /tmp/create-test-accounts.mjs
```

**Commit :**
```bash
git add -A && git commit -m "v28-prep: 5 comptes test créés" && git push origin v2
```

---

# ═══════════════════════════════════════════════════
# PARTIE C — CRÉATION DES 5 PRODUITS TEST COMPLETS
# ═══════════════════════════════════════════════════

Créer 5 produits avec TOUS les champs remplis dans Firestore.

```bash
cat > /tmp/create-test-products.mjs << 'SCRIPT'
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.firebasestorage.app",
  messagingSenderId: "694030851164",
  appId: "1:694030851164:web:1a534b65a93f8d816f1a99"
});

const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, 'admin@97import.com', '20262026');
console.log('✅ Connecté admin\n');

const PRODUCTS = [
  // ─── PRODUIT 1 : MINI-PELLE R22 PRO ───
  {
    id: 'TEST-MP-R22',
    data: {
      reference: 'MP-R22-001',
      nom_fr: 'Mini-pelle R22 PRO',
      nom_en: 'Mini Excavator R22 PRO',
      nom_zh: 'R22 PRO 小型挖掘机',
      description_fr: 'Mini-pelle RIPPA R22 PRO de 2.2 tonnes. Moteur Kubota V2403 4 cylindres, 18 kW (24 ch). Godet 60cm inclus. Idéale pour les travaux de terrassement, tranchées et aménagement paysager. Livraison DOM-TOM incluse dans le devis.',
      description_en: 'RIPPA R22 PRO 2.2 ton mini excavator. Kubota V2403 4-cylinder engine, 18 kW (24 hp). 60cm bucket included. Ideal for earthworks, trenching and landscaping.',
      description_zh: 'RIPPA R22 PRO 2.2吨小型挖掘机。久保田V2403四缸发动机，18千瓦（24马力）。含60厘米铲斗。',
      categorie: 'Mini-Pelle',
      gamme: 'R22 PRO',
      type: 'machine',
      machine_id: null,
      marque: 'RIPPA',
      moteur: 'Kubota V2403',
      puissance_kw: 18,
      prix_achat_cny: 95000,
      prix_achat_eur: 12150,
      prix_public_eur: 24300,
      longueur_cm: 385,
      largeur_cm: 160,
      hauteur_cm: 250,
      poids_net_kg: 2200,
      poids_brut_kg: 2350,
      qte_pieces_par_unite: 1,
      matiere_fr: 'Acier',
      matiere_en: 'Steel',
      matiere_zh: '钢',
      code_hs: '84295100',
      images_urls: [], // À remplir avec les vraies images du dossier
      video_url: '',
      fiche_pdf_url: '',
      actif: true,
      ordre: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  // ─── PRODUIT 2 : MAISON MODULAIRE STANDARD 20P ───
  {
    id: 'TEST-MS-20',
    data: {
      reference: 'MS-20-001',
      nom_fr: 'Maison Modulaire Standard 20 pieds',
      nom_en: 'Standard Modular House 20ft',
      nom_zh: '标准模块化房屋 20英尺',
      description_fr: 'Maison modulaire standard de 20 pieds (6m × 2.4m). Structure acier galvanisé, isolation thermique, fenêtres double vitrage. Cuisine, salle de bain et chambre intégrées. Prête à habiter. Transport par conteneur maritime.',
      description_en: 'Standard 20ft modular house (6m × 2.4m). Galvanized steel structure, thermal insulation, double glazing. Kitchen, bathroom and bedroom included. Ready to live in.',
      description_zh: '20英尺标准模块化房屋（6米×2.4米）。镀锌钢结构，隔热保温，双层玻璃。',
      categorie: 'Maisons',
      gamme: 'Standard',
      type: 'machine',
      machine_id: null,
      marque: '97import',
      moteur: null,
      puissance_kw: null,
      prix_achat_cny: 58000,
      prix_achat_eur: 7420,
      prix_public_eur: 14840,
      longueur_cm: 600,
      largeur_cm: 240,
      hauteur_cm: 280,
      poids_net_kg: 3500,
      poids_brut_kg: 3800,
      qte_pieces_par_unite: 1,
      matiere_fr: 'Acier galvanisé + Sandwich panel',
      matiere_en: 'Galvanized steel + Sandwich panel',
      matiere_zh: '镀锌钢 + 夹芯板',
      code_hs: '94060090',
      images_urls: [],
      video_url: '',
      fiche_pdf_url: '',
      actif: true,
      ordre: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  // ─── PRODUIT 3 : KIT SOLAIRE 10KW ───
  {
    id: 'TEST-SOL-10',
    data: {
      reference: 'SOL-10K-001',
      nom_fr: 'Kit Solaire Complet 10kW',
      nom_en: 'Complete Solar Kit 10kW',
      nom_zh: '10千瓦完整太阳能套件',
      description_fr: 'Kit solaire complet 10kW avec panneaux JinkoSolar monocristallins, onduleur hybride DEYE 10kW, batteries lithium 10kWh, câblage et connecteurs MC4. Autonomie énergétique pour une maison de 3-4 pièces. Installation possible en DOM-TOM.',
      description_en: 'Complete 10kW solar kit with JinkoSolar monocrystalline panels, DEYE 10kW hybrid inverter, 10kWh lithium batteries, MC4 connectors and wiring.',
      description_zh: '10千瓦完整太阳能套件，晶科单晶硅面板，德业10千瓦混合逆变器，10千瓦时锂电池。',
      categorie: 'Solaire',
      gamme: '10kW',
      type: 'machine',
      machine_id: null,
      marque: 'JinkoSolar + DEYE',
      moteur: null,
      puissance_kw: 10,
      prix_achat_cny: 42000,
      prix_achat_eur: 5370,
      prix_public_eur: 10740,
      longueur_cm: 200,
      largeur_cm: 120,
      hauteur_cm: 150,
      poids_net_kg: 280,
      poids_brut_kg: 320,
      qte_pieces_par_unite: 1,
      matiere_fr: 'Silicium monocristallin + Aluminium',
      matiere_en: 'Monocrystalline silicon + Aluminum',
      matiere_zh: '单晶硅 + 铝',
      code_hs: '85414020',
      images_urls: [],
      video_url: '',
      fiche_pdf_url: '',
      actif: true,
      ordre: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  // ─── PRODUIT 4 : GODET À DENTS R22 20CM (accessoire) ───
  {
    id: 'TEST-ACC-GD20',
    data: {
      reference: 'ACC-GD-R22-20',
      nom_fr: 'Godet à dents R22 PRO — 20cm',
      nom_en: 'Toothed Bucket R22 PRO — 20cm',
      nom_zh: 'R22 PRO 齿斗 — 20厘米',
      description_fr: 'Godet à dents de 20cm compatible avec la mini-pelle RIPPA R22 PRO. Acier haute résistance Hardox, 3 dents interchangeables. Idéal pour le creusement de tranchées étroites et fondations.',
      description_en: '20cm toothed bucket compatible with RIPPA R22 PRO mini excavator. Hardox high-strength steel, 3 interchangeable teeth.',
      description_zh: '20厘米齿斗，兼容RIPPA R22 PRO小型挖掘机。Hardox高强度钢，3个可更换齿。',
      categorie: 'Mini-Pelle',
      gamme: 'R22 PRO',
      type: 'accessoire',
      machine_id: 'TEST-MP-R22', // Lié à la R22 PRO
      marque: 'RIPPA',
      moteur: null,
      puissance_kw: null,
      prix_achat_cny: 2300,
      prix_achat_eur: 294,
      prix_public_eur: 588,
      longueur_cm: 35,
      largeur_cm: 20,
      hauteur_cm: 30,
      poids_net_kg: 18,
      poids_brut_kg: 20,
      qte_pieces_par_unite: 1,
      matiere_fr: 'Acier Hardox',
      matiere_en: 'Hardox Steel',
      matiere_zh: 'Hardox钢',
      code_hs: '84314990',
      images_urls: [],
      video_url: '',
      fiche_pdf_url: '',
      actif: true,
      ordre: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  // ─── PRODUIT 5 : FRAIS LOGISTIQUE MARTINIQUE ───
  {
    id: 'TEST-LOG-MQ',
    data: {
      reference: 'LOG-FRET-MQ-001',
      nom_fr: 'Frais logistiques — Martinique',
      nom_en: 'Logistics fees — Martinique',
      nom_zh: '物流费用 — 马提尼克',
      description_fr: 'Frais de transport maritime, dédouanement et coordination 97import pour une livraison en Martinique (Fort-de-France). Comprend : fret maritime conteneur, droits de douane, manutention portuaire, coordination logistique 97import.',
      description_en: 'Sea freight, customs clearance and 97import coordination for delivery to Martinique (Fort-de-France).',
      description_zh: '海运费、清关费和97import协调费，配送至马提尼克（法兰西堡）。',
      categorie: 'Logistique',
      gamme: 'Martinique',
      type: 'service',
      machine_id: null,
      marque: '97import',
      moteur: null,
      puissance_kw: null,
      prix_achat_cny: 0,
      prix_achat_eur: 3800,
      prix_public_eur: 3800,
      longueur_cm: null,
      largeur_cm: null,
      hauteur_cm: null,
      poids_net_kg: null,
      poids_brut_kg: null,
      qte_pieces_par_unite: 1,
      matiere_fr: null,
      matiere_en: null,
      matiere_zh: null,
      code_hs: null,
      images_urls: [],
      video_url: '',
      fiche_pdf_url: '',
      actif: true,
      ordre: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
];

console.log('=== CRÉATION DES 5 PRODUITS TEST ===\n');

for (const product of PRODUCTS) {
  try {
    await setDoc(doc(db, 'products', product.id), product.data);
    console.log(`✅ ${product.id} | ${product.data.reference} | ${product.data.nom_fr}`);
  } catch (e) {
    console.error(`❌ ${product.id}: ${e.message}`);
  }
}

// Associer des images existantes si disponibles
console.log('\n=== IMAGES ===');
console.log('Les 5 produits test sont créés SANS images.');
console.log('Les images seront ajoutées via le back-office ou un upload ultérieur.');

console.log('\n\n=== RÉSUMÉ PRODUITS TEST ===');
console.log('ID              | Référence       | Catégorie   | Prix public');
console.log('----------------|-----------------|-------------|------------');
PRODUCTS.forEach(p => {
  console.log(`${p.id.padEnd(16)} | ${p.data.reference.padEnd(15)} | ${p.data.categorie.padEnd(11)} | ${p.data.prix_public_eur} €`);
});

console.log('\n\n=== RÉSUMÉ COMPTES TEST ===');
console.log('Tous les comptes : mot de passe 20262026');
console.log('admin@97import.com      → admin');
console.log('client@97import.com     → user (Jean Dupont, Martinique)');
console.log('vip@97import.com        → vip (Marie Martin, Guadeloupe)');
console.log('client2@97import.com    → user (Sophie Leblanc, Réunion)');
console.log('partenaire@97import.com → partner (Pierre Bernard, Paris)');

process.exit(0);
SCRIPT

node /tmp/create-test-products.mjs
```

---

# ═══════════════════════════════════════════════════
# PARTIE D — VÉRIFICATION COMPLÈTE
# ═══════════════════════════════════════════════════

Après la création, vérifier que tout est en place :

```bash
node -e "
const {initializeApp}=require('firebase/app');
const {getFirestore,collection,getDocs,doc,getDoc}=require('firebase/firestore');
const app=initializeApp({apiKey:'AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo',projectId:'importok-6ef77'});
const db=getFirestore(app);

async function verify() {
  // Vérifier les 5 produits test
  const testIds = ['TEST-MP-R22','TEST-MS-20','TEST-SOL-10','TEST-ACC-GD20','TEST-LOG-MQ'];
  console.log('=== PRODUITS TEST ===');
  for (const id of testIds) {
    const snap = await getDoc(doc(db,'products',id));
    if (snap.exists()) {
      const p = snap.data();
      console.log('✅', id, '|', p.nom_fr, '| prix:', p.prix_public_eur, '€ | actif:', p.actif);
    } else {
      console.log('❌', id, 'NON TROUVÉ');
    }
  }
  
  // Vérifier les catégories
  console.log('\n=== CATÉGORIES NORMALISÉES ===');
  const all = await getDocs(collection(db,'products'));
  const cats = {};
  all.docs.forEach(d => { const c = d.data().categorie||'SANS'; cats[c]=(cats[c]||0)+1; });
  Object.entries(cats).sort().forEach(([k,v]) => console.log('  ', k, ':', v));
  
  // Vérifier les comptes
  console.log('\n=== PROFILS ===');
  const profiles = await getDocs(collection(db,'profiles'));
  profiles.docs.forEach(d => {
    const p = d.data();
    console.log('  ', p.email, '|', p.role, '|', p.firstName, p.lastName);
  });
  
  // Aussi dans /users
  const users = await getDocs(collection(db,'users'));
  console.log('\n=== USERS ===');
  users.docs.forEach(d => {
    const p = d.data();
    console.log('  ', p.email, '|', p.role, '|', p.firstName, p.lastName);
  });
  
  process.exit(0);
}
verify();
"
```

---

# ═══════════════════════════════════════════════════
# RAPPORT DE SORTIE
# ═══════════════════════════════════════════════════

**Créer `MAJ28-PREP.TXT` :**
```
=== MAJ28-PREP — Normalisation + 5 produits test + 5 comptes test ===
Date : [date]

PARTIE A — NORMALISATION CATÉGORIES :
  Produits mis à jour : [nombre]
  Catégories après normalisation : [liste]

PARTIE B — COMPTES TEST :
  admin@97import.com (admin) : ✅/❌
  client@97import.com (user) : ✅/❌
  vip@97import.com (vip) : ✅/❌
  partenaire@97import.com (partner) : ✅/❌
  client2@97import.com (user) : ✅/❌
  Mot de passe : 20262026

PARTIE C — PRODUITS TEST :
  TEST-MP-R22 (Mini-pelle R22 PRO) : ✅/❌ | 24 300 €
  TEST-MS-20 (Maison Standard 20P) : ✅/❌ | 14 840 €
  TEST-SOL-10 (Kit Solaire 10kW) : ✅/❌ | 10 740 €
  TEST-ACC-GD20 (Godet R22 20cm) : ✅/❌ | 588 €
  TEST-LOG-MQ (Frais Martinique) : ✅/❌ | 3 800 €

VÉRIFICATION : Tous les produits et comptes accessibles ✅/❌
```

**Mettre à jour `MAJALL.TXT` et `~/97import-OK/OK-MAJ-ALL.txt`**

## COMMIT FINAL
```bash
git add -A
git commit -m "v28-prep: normalisation catégories + 5 produits test + 5 comptes test"
git push origin v2
```

---

## TEST MANUEL À FAIRE APRÈS CE PROMPT

1. Aller sur la preview Vercel
2. Se connecter avec `client@97import.com` / `20262026` → doit voir les prix publics
3. Se connecter avec `admin@97import.com` / `20262026` → doit voir les 4 prix
4. Chercher "R22" dans la barre de recherche → doit trouver TEST-MP-R22
5. Ajouter TEST-MP-R22 au panier → prix correct
6. Aller sur /catalogue/Mini-Pelle → TEST-MP-R22 visible (pas TEST-ACC-GD20)
7. Cliquer TEST-MP-R22 → fiche avec specs complètes + bannière accessoires
