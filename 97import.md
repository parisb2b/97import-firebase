# 97IMPORT.COM — PROMPT MAÎTRE DE PRODUCTION
# Pour Claude Code — Mode 100% Autonome
# Version : V5 — Avril 2026

---

## ⚡ COMMANDE DE LANCEMENT

```bash
cd C:\DATA-MC-2030\97IMPORT
git fetch origin && git reset --hard origin/main
git tag backup-$(date +%Y%m%d-%H%M) && git push origin --tags
git log --oneline -3
claude --dangerously-skip-permissions "Exécute le fichier 97import.md en autonomie totale sans aucune confirmation. Lance les phases A, B et C dans l'ordre. Ne t'arrête jamais."
```

---

## 🎯 RÔLE ET MISSION

Tu es un **Ingénieur Full-Stack Senior & Architecte Cloud**.

Mission : Développer de A à Z la plateforme **97import.com** — plateforme B2B d'import Chine → DOM-TOM (Martinique, Guadeloupe, Réunion, Guyane).

**Règles absolues :**
- Autonomie totale. Zéro confirmation. Zéro interruption.
- Si tu rencontres une erreur, tu la corriges seul et tu continues.
- Tu loggues toutes tes actions dans `MAJALL.TXT` à la racine du projet.
- Avant toute modification : vérifie l'absence de fichiers dupliqués dans `src/`. Si doublon → garde le plus récent, supprime l'ancien, mets à jour tous les imports.
- Après chaque phase validée : `git add -A && git commit -m "Phase X - [description]" && git push origin main`.

---

## 🔧 1. CONFIGURATION FIREBASE (Projet : import2050-59f11)

```typescript
// src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCeKBBsSgC8PQK40ETlsjNRwhYCmAKz6cwA",
  authDomain: "import2050-59f11.firebaseapp.com",
  projectId: "import2050-59f11",
  storageBucket: "import2050-59f11.firebasestorage.app",
  messagingSenderId: "496161620887",
  appId: "1:496161620887:web:5cdbd6f3a879edd5bfbad2",
  measurementId: "G-7DXCQF6BM0"
};
```

**Deux instances Auth isolées :**
```typescript
// Instance client (front)
const clientApp = initializeApp(firebaseConfig, 'client');
const clientAuth = getAuth(clientApp);

// Instance admin (back-office)
const adminApp = initializeApp(firebaseConfig, 'admin');
const adminAuth = getAuth(adminApp);
```

---

## 🌐 2. STACK TECHNIQUE IMMUABLE

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 19 + Vite 7 + TypeScript (strict) |
| UI | shadcn/ui (Radix UI) + Tailwind CSS |
| Routing | wouter |
| Backend | Firebase Auth + Firestore + Storage |
| Serveur | Firebase Cloud Functions (Node.js) |
| Emails | Resend API (via Cloud Functions) |
| Déploiement | Vercel (deux sous-domaines séparés) |
| i18n | Système custom FR/ZH/EN (objet de traductions) |

**Sous-domaines :**
- `www.97import.com` → front-office client
- `admin.97import.com` → back-office admin

---

## 🌍 3. INTERNATIONALISATION TRILINGUE

**Langues supportées :** Français (FR) | 中文 (ZH) | English (EN)

**Affichage par défaut :** FR

**Implémentation :**
```typescript
// src/i18n/index.ts
type Lang = 'fr' | 'zh' | 'en';

const translations: Record<Lang, Record<string, string>> = {
  fr: { /* ... */ },
  zh: { /* ... */ },
  en: { /* ... */ }
};

export const useTranslation = () => {
  const [lang, setLang] = useState<Lang>('fr');
  const t = (key: string) => translations[lang][key] ?? key;
  return { t, lang, setLang };
};
```

**Bouton globe fixe dans la navbar :**
```
🌐 FR / 中文 / EN
```

**Règles :**
- Aucun texte en dur dans les composants
- Tous les labels, menus, messages d'erreur, boutons → clés i18n
- UTF-8 strict partout (sinogrammes 汉字 + accents français é à ç)
- Fuseau horaire fixe : `Europe/Paris` pour tous les horodatages

---

## 🔑 4. COMPTES DE TEST FIREBASE (à créer automatiquement)

Mot de passe unique pour tous : **20262026**

| Email | Rôle | Nom affiché | Collection Firestore |
|-------|------|-------------|---------------------|
| admin@97import.com | admin | Admin 97import | /profiles/{uid} |
| client@97import.com | user | Jean Dupont | /profiles/{uid} |
| vip@97import.com | vip | Marie Martin | /profiles/{uid} |
| partenaire@97import.com | partner | Pierre Bernard | /profiles/{uid} |
| client2@97import.com | user | Sophie Leblanc | /profiles/{uid} |

**Script de création (Firebase Admin SDK) :**
```javascript
// scripts/seed-users.js
const users = [
  { email: 'admin@97import.com', role: 'admin', name: 'Admin 97import' },
  { email: 'client@97import.com', role: 'user', name: 'Jean Dupont' },
  { email: 'vip@97import.com', role: 'vip', name: 'Marie Martin' },
  { email: 'partenaire@97import.com', role: 'partner', name: 'Pierre Bernard' },
  { email: 'client2@97import.com', role: 'user', name: 'Sophie Leblanc' },
];
// Pour chaque user : si UID existe → supprimer + recréer
// Créer /profiles/{uid} dans Firestore avec { role, name, email, createdAt }
```

---

## 🗄️ 5. STRUCTURE FIRESTORE

### Collections principales

```
/products/{id}
  numero_interne: string         // ex: MP-R22-001
  nom_fr: string
  nom_zh: string
  nom_en: string
  categorie: string              // mini-pelles | maisons-modulaires | solaire | machines-agricoles | divers | services
  sous_categorie: string
  prix_achat_cny: number         // Prix en Yuan
  prix_achat_eur: number         // Calculé via taux RMB
  options_payantes: array        // [{ref, nom_fr, nom_zh, surcoût_eur}]
  dimensions: {l, L, h, volume_m3, poids_net_kg, poids_brut_kg}
  code_hs: string
  fournisseur: string
  actif: boolean
  score_completude: number       // 0-100, calculé auto
  photos: string[]               // URLs Firebase Storage
  video_url: string
  pdf_url: string
  createdAt: timestamp
  updatedAt: timestamp

/quotes/{id}
  numero: string                 // DVS-2604001
  client_id: string
  client_nom: string
  client_email: string
  client_tel: string
  client_adresse: string
  client_siret: string
  partenaire_id: string | null
  statut: 'brouillon'|'envoyé'|'accepté'|'refusé'|'annulé'
  lignes: [{ref, nom_fr, qte, prix_unitaire, total}]
  total_ht: number
  acompte_pct: number            // % demandé
  acomptes: [{date, montant, ref_fa}]
  total_encaisse: number
  solde_restant: number
  destination: 'MQ'|'GP'|'RE'|'GF'|'FR'
  createdAt: timestamp
  updatedAt: timestamp

/invoices/{id}
  numero: string                 // F-2604001 | FA-2604001
  type: 'facture'|'acompte'
  quote_id: string
  montant: number
  pdf_url: string
  createdAt: timestamp

/commissions/{id}
  numero: string                 // NC-2604001
  partenaire_id: string
  partenaire_nom: string
  lignes: [{quote_id, client, montant_ht, taux, commission}]
  total_commission: number
  statut: 'en attente'|'payée'
  createdAt: timestamp

/containers/{id}
  numero: string                 // CONT-2604-01
  type: '20ft'|'40ft'|'40ft-HC'
  destination: string
  statut: 'préparation'|'chargé'|'parti'|'arrivé'|'livré'
  date_depart: timestamp
  date_arrivee_prevue: timestamp
  voyage_number: string
  bl_waybill: string
  seal: string
  port_chargement: string
  port_destination: string
  lignes: [{ref, nom_fr, nom_zh, qte_colis, qte_pieces, l, L, h, volume_m3, poids_net}]
  volume_total: number
  poids_total: number
  createdAt: timestamp

/partners/{id}
  nom: string
  code: string                   // JM | TD | MC | AL
  email: string
  tel: string
  commission_taux: number        // %
  actif: boolean

/sav/{id}
  numero: string                 // SAV-2604001
  client_id: string
  quote_id: string
  produit_ref: string
  description: string
  photos: string[]
  statut: 'nouveau'|'en cours'|'résolu'|'fermé'
  createdAt: timestamp

/stock/{id}
  ref_piece: string
  nom: string
  compatible: string[]           // refs machines compatibles
  qte: number
  seuil_alerte: number

/admin_params/{id}
  taux_rmb_eur: number
  taux_rmb_updated: timestamp
  taux_majoration_user: number   // défaut 2.0
  taux_majoration_partner: number // défaut 1.2
  devise_affichage: 'EUR'|'USD'

/counters/{id}
  // id format: PREFIX_AAMM (ex: DVS_2604)
  valeur: number

/logs/{id}
  action: string
  user: string
  details: object
  createdAt: timestamp
```

---

## 🖥️ PHASE A — BACK-OFFICE (admin.97import.com)

### Priorité : Back-office AVANT le front-office
Raison : Le back-office alimente Firebase (produits, taux, params). Le front dépend de ces données.

### Couleurs back-office (ADMIN_COLORS — immuables)
```css
--navy:   #1E3A5F;   /* sidebar, headers */
--green:  #166534;   /* succès, validé */
--orange: #EA580C;   /* alerte, pastille manquant */
--purple: #7C3AED;   /* VIP, prix négocié */
--gray:   #6B7280;   /* texte secondaire */
--salmon: #C87F6B;   /* accents PDF, titres docs */
--salmon-light: #FBF0ED; /* fond tableaux PDF */
```

### Structure de fichiers back-office
```
src/
  admin/
    components/
      Layout.tsx          // Sidebar + navbar + globe 🌐
      Sidebar.tsx         // Navigation 20 sections
      Tooltip.tsx         // Custom tooltip CSS (pas title= natif)
      DuplicateBtn.tsx    // Bouton ⧉ réutilisable
      OrangeIndicator.tsx // Pastille 🟠 champ vide
      SortControl.tsx     // Tri récent/ancien
    pages/
      Dashboard.tsx       // pg-db
      ListeDevis.tsx      // pg-dv
      DetailDevis.tsx     // pg-dv-det
      Factures.tsx        // pg-fa
      NotesCommission.tsx // pg-nc
      FraisLogistique.tsx // pg-fl
      ListeConteneurs.tsx // pg-cnt
      NouveauConteneur.tsx// pg-cnt-new
      DetailConteneur.tsx // pg-cnt-det
      Stock.tsx           // pg-stk
      SAVListe.tsx        // pg-sav
      SAVDetail.tsx       // pg-sav-det
      CatalogueProduits.tsx // pg-prd
      NouveauProduit.tsx  // pg-new-prd
      EditProduit.tsx     // pg-edit-prd ← MIROIR EXACT de NouveauProduit
      Clients.tsx         // pg-cli
      Partenaires.tsx     // pg-part
      TauxRMB.tsx         // pg-rmb
      Logs.tsx            // pg-logs
      Parametres.tsx      // pg-prm
    lib/
      firebase-admin.ts
      pdf-generator.ts    // génération PDF (jsPDF ou html2pdf)
      excel-generator.ts  // génération Excel (xlsx.js)
      deepl.ts            // API DeepL
      exchange-rate.ts    // API taux RMB
```

### A1 — Layout & Navigation

**Sidebar** (fond `--navy`) avec 20 entrées :
1. 📊 Dashboard
2. 📋 Devis
3. 🧾 Factures & Acomptes
4. 💰 Notes Commission
5. 🚢 Frais Logistique
6. 📦 Conteneurs
7. 🔧 SAV
8. 🗄️ Stock Pièces
9. 🛒 Catalogue Produits
10. 👥 Clients
11. 🤝 Partenaires
12. 💱 Taux RMB
13. 📈 Analytics
14. 📝 Logs
15. ⚙️ Paramètres

**Navbar** (haut) :
- Logo LUXENT à gauche
- Alerte SAV urgents (badge rouge)
- Globe 🌐 FR / 中文 / EN (toggle trilingue)
- Avatar admin + déconnexion

### A2 — Règles globales back-office (toutes les pages)

**TRI PAR DÉFAUT = PLUS RÉCENT :**
```typescript
// Dans chaque liste (devis, factures, NC, conteneurs, SAV, logs)
const [sortOrder, setSortOrder] = useState<'desc'|'asc'>('desc');
// Query Firestore : orderBy('createdAt', sortOrder)

// Contrôle visible sur chaque liste :
<SortControl
  value={sortOrder}
  onChange={setSortOrder}
  labels={{ desc: t('sort.recent'), asc: t('sort.oldest') }}
/>
```

**BOUTON DUPLIQUER ⧉ (sur chaque ligne de liste) :**
```typescript
const DuplicateBtn = ({ onDuplicate }: { onDuplicate: () => void }) => (
  <button
    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-orange-50"
    onClick={onDuplicate}
  >
    ⧉
  </button>
);

const handleDuplicate = async (doc: any, collection: string, prefix: string) => {
  const newNum = await getNextNumber(prefix);
  const duplicate = {
    ...doc,
    numero: newNum,
    statut: 'brouillon',
    nom: doc.nom + ' (copie)',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  delete duplicate.id;
  await addDoc(collection(db, collection), duplicate);
};
```

**TOOLTIPS CUSTOM (pas title= natif) :**
```css
.tooltip-wrapper { position: relative; }
.tooltip-text {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%; transform: translateX(-50%);
  background: #1a1a2e; color: white;
  padding: 4px 8px; border-radius: 4px;
  font-size: 11px; white-space: nowrap;
  pointer-events: none; z-index: 999;
  display: none;
}
.tooltip-wrapper:hover .tooltip-text { display: block; }
```

### A3 — Page Catalogue Produits (pg-prd + pg-edit-prd)

**RÈGLE CRITIQUE : `pg-edit-prd` = miroir EXACT de `pg-new-prd`**

Les deux pages doivent avoir les mêmes blocs et les mêmes champs.

**Blocs produit (identiques dans Nouveau ET Éditer) :**

```
BLOC 1 — Base de données (fond gris clair)
  ├── N° Interne (auto-généré, éditable)              🟠 si vide
  ├── Catégorie (dropdown)                             🟠 si vide
  ├── Sous-catégorie (dropdown)                        🟠 si vide
  ├── Fournisseur (dropdown)                           🟠 si vide
  ├── Prix achat CNY (number)                          🟠 si vide
  ├── Prix achat EUR (calculé auto via taux RMB)
  ├── Dimensions L×l×H cm                             🟠 si vide
  ├── Volume m³ (auto-calculé)
  ├── Poids net kg                                     🟠 si vide
  ├── Poids brut kg                                    🟠 si vide
  ├── Code HS douanier                                 🟠 si vide
  └── Options payantes (tableau dynamique add/remove)

BLOC 2 — Site web (fond blanc)
  ├── Nom FR                                           🟠 si vide
  ├── Nom ZH (auto via DeepL, éditable)               🟠 si vide
  ├── Nom EN (auto via DeepL, éditable)               🟠 si vide
  ├── Description FR (textarea)                        🟠 si vide
  ├── Description ZH (auto DeepL)                      🟠 si vide
  ├── Description EN (auto DeepL)                      🟠 si vide
  ├── Photos (upload + URLs Storage)                   🟠 si aucune photo
  ├── Vidéo URL                                        🟠 si vide
  ├── PDF fiche technique (upload)
  └── Actif/Inactif (toggle)
```

**PASTILLE ORANGE 🟠 (score de complétude) :**
```typescript
const REQUIRED_FIELDS = [
  'categorie', 'prix_achat_cny', 'dimensions.l', 'dimensions.L', 'dimensions.h',
  'poids_net_kg', 'code_hs', 'nom_fr', 'nom_zh', 'nom_en',
  'description_fr', 'photos'
];

const getCompletionScore = (product: Product): number => {
  const filled = REQUIRED_FIELDS.filter(field => {
    const val = field.includes('.')
      ? field.split('.').reduce((o: any, k: string) => o?.[k], product)
      : (product as any)[field];
    return val !== undefined && val !== null && val !== '' && val !== 0;
  });
  return Math.round((filled.length / REQUIRED_FIELDS.length) * 100);
};

const OrangeIndicator = ({ isEmpty }: { isEmpty: boolean }) =>
  isEmpty ? (
    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block ml-1" />
  ) : null;
```

**SAUVEGARDE AUTO Firebase :**
- Chaque modification d'un champ → `updateDoc` immédiat (debounce 800ms)
- Toast discret "Sauvegardé ✓" pendant 2 secondes

**TRADUCTION DEEPL AUTO :**
```typescript
// src/admin/lib/deepl.ts
const DEEPL_KEY = '3fae7c40-bed9-48ee-88d9-26c5f719caf3:fx';
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

export const translateText = async (
  text: string,
  targetLang: 'ZH' | 'EN' | 'FR'
): Promise<string> => {
  const res = await fetch(DEEPL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`
    },
    body: JSON.stringify({ text: [text], target_lang: targetLang })
  });
  const data = await res.json();
  return data.translations[0].text;
};
// Quand nom_fr change → traduire auto vers ZH et EN
```

### A4 — Module Taux RMB (pg-rmb)

```typescript
// src/admin/lib/exchange-rate.ts
const EXCHANGE_KEY = '51273802828592038c41e0f1';

export const fetchRMBRate = async (): Promise<number> => {
  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/pair/EUR/CNY`
  );
  const data = await res.json();
  return data.conversion_rate;
};

// Stocker dans Firestore /admin_params/taux_rmb
// Variance auto +2% : taux_affiche = taux_api * 1.02 (marge sécurité)
// Mise à jour : bouton manuel + auto toutes les 24h (Cloud Function scheduled)
```

**Page TauxRMB affiche :**
- `1 EUR = X.XX CNY` (taux actuel API)
- Taux avec marge +2% affiché en orange
- Bouton "Mettre à jour maintenant"
- Historique des 30 derniers taux (graphique simple)

### A5 — Génération PDF (Templates)

**Design des PDF (IMMUABLE) :**
```
- Logo LUXENT en haut à droite (base64 depuis public/luxent.png)
- Couleur titres/sections : #C87F6B (saumon)
- Fond entête tableau : #FBF0ED
- Bordures : #E5E5E5 (fines, légères)
- Police : Arial
- PAS de fond sombre, PAS de texte blanc, PAS de bordures noires épaisses
```

**5 templates PDF :**
```
1. DEVIS (DVS-AAMM001)
   → Émetteur LUXENT + Destinataire client
   → Lignes produits (ref | désignation | qté | PU HT | total HT)
   → Total HT + acompte 30% demandé
   → Validité 30 jours + IBAN en bas

2. FACTURE D'ACOMPTE (FA-AAMM001)
   → Lien vers devis source
   → Montant acompte versé + solde restant

3. FACTURE FINALE (F-AAMM001)
   → Toutes les lignes
   → Déduction des acomptes précédents
   → Total final à régler

4. NOTE DE COMMISSION (NC-AAMM001)
   → Partenaire (nom, code)
   → Lignes : devis | client | montant HT | taux | commission
   → Total commissions
   → Conditions paiement

5. INVOICE TRILINGUE BD (EN + FR + ZH)
   → Format export douane
   → Colonnes EN/FR/ZH
   → HS Codes + prix USD
   → Infos conteneur (port, BL, SEAL)
```

**Numérotation documents (compteurs Firestore) :**
```typescript
// Préfixes : DVS | FA | F | NC | CONT | SAV | LA
// Format : PREFIX-AAMM + 3 chiffres (ex: DVS-2604001)

const getNextNumber = async (prefix: string): Promise<string> => {
  const now = new Date();
  const aamm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}`;
  const counterId = `${prefix}_${aamm}`;
  const ref = doc(db, 'counters', counterId);
  const newVal = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? snap.data().valeur : 0;
    tx.set(ref, { valeur: current + 1 });
    return current + 1;
  });
  return `${prefix}-${aamm}${String(newVal).padStart(3, '0')}`;
};
```

### A6 — Module Conteneurs (pg-cnt)

**Champs d'un conteneur :**
```
numero: CONT-AAMM-01 (auto)
type: 20ft | 40ft | 40ft-HC
destination: MQ | GP | RE | GF | FR
statut: préparation → chargé → parti du port → arrivé → livré
date_depart, date_arrivee_prevue
voyage_number, bl_waybill, seal
port_chargement (ex: NINGBO)
port_destination (ex: FORT-DE-FRANCE)
lignes: [{ref, nom_fr, nom_zh, qte_colis, qte_pieces, l, L, h, volume_m3, poids_net}]
volume_total (auto-calculé), poids_total (auto-calculé)
```

**Boutons d'action sur un conteneur :**
```
⧉ Dupliquer      → Nouveau conteneur même type/destination, lignes vides
📥 Générer BC    → Excel BC CHINE (template BC-CHINE-中国采购单.xlsx)
📥 Générer BE    → Excel BE EXPORT (template BE-EXPORT-出口单.xlsx)
📥 Générer BD    → Excel BD INVOICE + BD PACKINGLIST (templates existants)
🚢 Parti du port → Change statut + log horodaté
```

**Structure Excel BC CHINE (reprendre exactement le template uploadé) :**
```
Ligne 1 : Titre "BC CHINE 中国采购单 — LISTE D'ACHAT — 97IMPORT.COM"
Ligne 2 : Date | Conteneur | Destination | calcul volume auto
Ligne 3 : Totaux (TOTAL LIGNES | TOTAL COLIS | TOTAL PIÈCES | VOLUME m³ | POIDS NET)
Ligne 4 : En-têtes colonnes (N° | N° Colis | N° Interne | Nom FR | Nom ZH | Qté | L | l | H | Volume | Prix CNY...)
Ligne 5+ : Données produits
Auto-calcul : Volume = L×l×H/1000000
```

### A7 — Système Acomptes

```typescript
interface Acompte {
  date: Timestamp;
  montant: number;     // EUR
  ref_fa: string;      // N° FA générée
  pdf_url: string;     // URL Storage
}

// Dans le document devis :
// acomptes: Acompte[]
// total_encaisse: number   (sum des montants)
// solde_restant: number    (total_ht - total_encaisse)

// Bouton ENCAISSER (dans détail devis) :
// 1. Saisir montant + date
// 2. Générer FA (facture acompte) → PDF
// 3. Upload PDF → Firebase Storage
// 4. Ajouter dans acomptes[]
// 5. Recalculer total_encaisse + solde_restant
// 6. Logger l'action
```

### A8 — Module SAV

```
Création demande SAV :
  - Numéro auto (SAV-2604001)
  - Lier à devis + produit
  - Description + photos (upload Storage)
  - Statut : nouveau → en cours → résolu → fermé
  - Pièce affectée depuis stock si applicable
  - Email automatique client (Resend) sur changement statut
```

### A9 — Module Partenaires

**4 partenaires prédéfinis :**
```
TD — Thomas Dupont
JM — Jean-Marc
MC — Michel Chen
AL — Alice Laurent
```

**Logique commission :**
```typescript
// Prix partenaire = prix_achat × 1.2
// Commission partenaire = prix_achat × 0.2
// NC (Note Commission) générée par partenaire avec toutes les lignes
// Export Excel NC global disponible
```

---

## 🌐 PHASE B — SITE WEB FRONT (www.97import.com)

### B1 — Structure de pages

```
Pages publiques :
  /                       Homepage
  /catalogue              Liste produits par catégorie
  /produit/:id            Fiche produit
  /connexion              Login
  /inscription            Register
  /partenaire             Recrutement partenaires

Pages authentifiées :
  /mon-compte             Espace client dashboard
  /mon-compte/devis       Liste devis
  /mon-compte/devis/:id   Détail devis
  /mon-compte/factures    Factures + acomptes
  /mon-compte/livraison   Suivi conteneur
  /mon-compte/sav         SAV
  /panier                 Panier + formulaire devis
```

### B2 — Catalogue (6 catégories)
```
1. Mini-Pelles          (icône : pelle)
2. Maisons Modulaires   (icône : maison)
3. Solaire              (icône : soleil)
4. Machines Agricoles   (icône : tracteur)
5. Divers               (icône : boîte)
6. Services             (icône : bateau — Fret, Dédouanement)
```

### B3 — Affichage prix selon rôle

| Élément | Visiteur | User | VIP | Partner | Admin |
|---------|----------|------|-----|---------|-------|
| Photos / vidéo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Description FR | ✅ | ✅ | ✅ | ✅ | ✅ |
| Prix affiché | ❌ | × 2 | négocié | × 1.2 | prix achat |
| Bouton panier | → login | ✅ | ✅ | ✅ | ✅ |
| PDF fiche tech. | ✅ | ✅ | ✅ | ✅ | ✅ |
| Options payantes | affichées | + prix | + prix VIP | + prix partner | tout |

```typescript
const getDisplayPrice = (product: Product, role: string, taux: number) => {
  const prixEur = product.prix_achat_cny / taux;
  switch (role) {
    case 'user':    return prixEur * 2;
    case 'partner': return prixEur * 1.2;
    case 'vip':     return product.prix_vip_eur ?? prixEur * 1.5;
    case 'admin':   return prixEur;
    default:        return null; // visiteur → pas de prix
  }
};
```

### B4 — Panier & Génération devis

```
1. Client sélectionne produits + options + destination (MQ/GP/RE/GF/FR)
2. Clic "Demander un devis"
3. Si non connecté → redirect /connexion
4. Génération Firestore :
   { numero: DVS-2604001, statut: 'brouillon', actif: false, lignes: [...] }
5. Email confirmation (Resend API)
6. Redirect → /mon-compte/devis/:id
NB : Pas de commande directe. Uniquement devis → admin valide.
```

### B5 — Espace client (documents progressifs)

```
brouillon  → Aperçu devis (grisé, non téléchargeable)
envoyé     → Devis PDF téléchargeable
accepté    → + Facture acompte
en cours   → + Suivi conteneur (statut + date estimée)
expédié    → + BD Invoice + Packing List
livré      → + Facture finale
```

### B6 — Upload images produits

```javascript
// scripts/upload-images.js
// Source : mactell\97import2026_siteweb\vercel\images\
// Convention : {numero_interne}-01.png
// Destination : Firebase Storage /products/{numero_interne}/01.png
// Après upload : updateDoc Firestore → photos: [storageUrl]

const uploadImages = async () => {
  const imgDir = 'C:\\DATA-MC-2030\\97IMPORT\\97import2026_siteweb\\vercel\\images';
  const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const ref = file.replace('-01.png', '');
    const storageRef = ref(storage, `products/${ref}/01.png`);
    const buffer = fs.readFileSync(path.join(imgDir, file));
    await uploadBytes(storageRef, buffer);
    const url = await getDownloadURL(storageRef);
    // Mettre à jour Firestore
    const q = query(collection(db, 'products'), where('numero_interne', '==', ref));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { photos: [url] });
    }
  }
};
```

---

## 🌱 PHASE C — INITIALISATION BASE DE DONNÉES

### C1 — 5 produits de test (1 par catégorie)

```javascript
const testProducts = [
  {
    numero_interne: 'MP-R22-001',
    categorie: 'mini-pelles',
    nom_fr: 'Mini-pelle R22 — chenille caoutchouc',
    nom_zh: '挖掘机 R22 — 橡胶履带',
    nom_en: 'Mini Excavator R22 — Rubber Track',
    prix_achat_cny: 34200,
    dimensions: { l: 315, L: 125, h: 255 },
    poids_net_kg: 2200,
    poids_brut_kg: 2350,
    code_hs: '8429.52',
    fournisseur: 'RIPPA',
    actif: true,
    options_payantes: [
      { ref: 'MP-R22-001-MET', nom_fr: 'Chenille métal', nom_zh: '钢履带', surcout_eur: 450 },
      { ref: 'ACC-GD-030', nom_fr: 'Godet 30cm', nom_zh: '30cm斗', surcout_eur: 320 }
    ]
  },
  {
    numero_interne: 'MS-20-001',
    categorie: 'maisons-modulaires',
    nom_fr: 'Maison Standard 20m²',
    nom_zh: '标准集装箱房 20平米',
    nom_en: 'Standard Modular Home 20sqm',
    prix_achat_cny: 28000,
    actif: true
  },
  {
    numero_interne: 'SOL-KIT-001',
    categorie: 'solaire',
    nom_fr: 'Kit solaire 3kWc complet',
    nom_zh: '太阳能套件 3kWc',
    nom_en: 'Solar Kit 3kWc Complete',
    prix_achat_cny: 8500,
    actif: true
  },
  {
    numero_interne: 'MA-MOTO-001',
    categorie: 'machines-agricoles',
    nom_fr: 'Motoculteur 7CV',
    nom_zh: '耕地机 7马力',
    nom_en: 'Power Tiller 7HP',
    prix_achat_cny: 3200,
    actif: true
  },
  {
    numero_interne: 'LOG-FRET-MQ-001',
    categorie: 'services',
    nom_fr: 'Fret maritime — Martinique (20ft)',
    nom_zh: '海运费 — 马提尼克 (20英尺)',
    nom_en: 'Sea Freight — Martinique (20ft)',
    prix_achat_cny: 9600,
    actif: true
  }
];
```

### C2 — Paramètres initiaux Firestore

```javascript
// /admin_params/global
{
  taux_rmb_eur: 7.82,
  taux_rmb_updated: serverTimestamp(),
  taux_majoration_user: 2.0,
  taux_majoration_partner: 1.2,
  devise_affichage: 'EUR',
  acompte_pct_defaut: 30,
  delai_validite_devis: 30
}

// /admin_params/emetteur
{
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
  banque: 'Banking Circle S.A.'
}

// /partners/jm
{ nom: 'Jean-Marc', code: 'JM', commission_taux: 15, actif: true }
// /partners/td
{ nom: 'Thomas Dupont', code: 'TD', commission_taux: 15, actif: true }
// /partners/mc
{ nom: 'Michel Chen', code: 'MC', commission_taux: 15, actif: true }
// /partners/al
{ nom: 'Alice Laurent', code: 'AL', commission_taux: 15, actif: true }
```

---

## 📋 RÈGLES GIT (obligatoires avant chaque phase)

```bash
git fetch origin && git reset --hard origin/main
git tag backup-$(date +%Y%m%d-%H%M) && git push origin --tags
git log --oneline -3

# Après chaque phase validée :
git add -A && git commit -m "Phase [X] - [description]" && git push origin main
```

---

## 📝 LOGGING OBLIGATOIRE (MAJALL.TXT)

Format à respecter :
```
[YYYY-MM-DD HH:MM] Phase AX - Description de ce qui a été fait
[YYYY-MM-DD HH:MM] ERREUR - Description de l'erreur + correction appliquée
[YYYY-MM-DD HH:MM] Phase BX - Description
```

---

## ⚠️ ANTI-DUPLICATION

```bash
# Avant de créer un composant, vérifier :
find src/ -name "*.tsx" | xargs grep -l "NomDuComposant"
# Si doublon → garder le plus récent, supprimer l'autre, corriger les imports
```

---

## 🚀 ORDRE D'EXÉCUTION COMPLET

```
ÉTAPE 1  → npm create vite@latest 97import -- --template react-ts
ÉTAPE 2  → npm install firebase shadcn/ui tailwindcss wouter jspdf xlsx
ÉTAPE 3  → Configurer Firebase (src/lib/firebase.ts) avec les deux instances Auth
ÉTAPE 4  → Créer système i18n (src/i18n/index.ts) avec les 3 langues
ÉTAPE 5  → Exécuter scripts/seed-users.js → 5 comptes test créés
ÉTAPE 6  → Phase A1 : Layout back-office + Auth admin + Sidebar
ÉTAPE 7  → Phase A3 : Catalogue (pg-prd + pg-new-prd + pg-edit-prd miroir)
ÉTAPE 8  → Phase C  : Seed Firestore (5 produits + params + partenaires)
ÉTAPE 9  → Phase A4 : Taux RMB (API exchangerate + stockage Firestore)
ÉTAPE 10 → Phase A2 : Devis + Factures + Acomptes (pg-dv + pg-fa)
ÉTAPE 11 → Phase A5 : Génération PDF (5 templates)
ÉTAPE 12 → Phase A6 : Conteneurs + génération Excel BC/BE/BD (pg-cnt)
ÉTAPE 13 → Phase A7 : Système acomptes (ENCAISSER → FA → PDF)
ÉTAPE 14 → Phase A8 : SAV + Stock (pg-sav + pg-stk)
ÉTAPE 15 → Phase A9 : Partenaires + NC (pg-part + pg-nc)
ÉTAPE 16 → Phase B  : Site web front-office complet
ÉTAPE 17 → scripts/upload-images.js (images depuis vercel/images/)
ÉTAPE 18 → Configuration Vercel : admin.97import.com + www.97import.com
ÉTAPE 19 → Tests complets avec les 5 comptes
ÉTAPE 20 → git push origin main + MAJALL.TXT à jour
```

---

## ✅ CHECKLIST FINALE AVANT DÉPLOIEMENT

- [ ] Système i18n opérationnel (FR/ZH/EN, aucun texte en dur)
- [ ] Taux RMB actualisé via API exchangerate-api.com
- [ ] Traduction DeepL opérationnelle (clé 3fae7c40...)
- [ ] 5 comptes test créés avec bons rôles Firebase
- [ ] 5 produits test dans Firestore (1 par catégorie)
- [ ] Génération PDF : DVS + FA + F + NC + BD Invoice ✓
- [ ] Génération Excel : BC CHINE + BE EXPORT ✓
- [ ] Bouton ⧉ Dupliquer opérationnel partout
- [ ] Tri par défaut = plus récent sur toutes les listes
- [ ] Pastilles oranges 🟠 sur champs vides produits
- [ ] Sauvegarde auto Firebase (debounce 800ms) sur édition produit
- [ ] Tooltips CSS custom repositionnés (pas title= natif)
- [ ] Globe 🌐 trilingue dans navbar (back-office + front)
- [ ] Images produits uploadées depuis vercel/images/
- [ ] Deux sous-domaines Vercel configurés et déployés
- [ ] MAJALL.TXT à jour avec toutes les phases
- [ ] Aucun fichier dupliqué dans src/
