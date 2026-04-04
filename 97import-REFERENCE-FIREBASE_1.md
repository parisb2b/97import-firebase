# 97import.com — Document de référence complet
## Stack : React 19 + Firebase + TypeScript
## Environnement : Windows local → déploiement IONOS

---

## 1. STACK TECHNIQUE

```
Frontend  : React 19 + Vite 7 + TypeScript
UI        : shadcn/ui + inline styles ADMIN_COLORS (back-office)
Routing   : wouter
Backend   : Firebase (Auth + Firestore + Storage + Functions)
Hosting   : IONOS (déploiement après validation locale)
Email     : Resend API via Firebase Cloud Functions
PDF       : jsPDF + jspdf-autotable
Excel     : SheetJS (xlsx)
Domaine   : 97import.com (IONOS)
```

**Environnement local Windows :**
```
Dossier projet : C:\data-mc-2030\97import
Node/npm       : déjà installé
Firebase       : npm install firebase ✅ (déjà fait)
Lancer dev     : npm run dev
Build          : npm run build
Déployer IONOS : copier /dist vers IONOS FTP
```

**Règles permanentes Claude Code :**
1. Travailler dans `C:\data-mc-2030\97import`
2. Tester en local avant tout déploiement
3. `npm run build` doit passer sans erreur
4. Après validation locale → déployer sur IONOS
5. Anti-doublon : avant toute modification vérifier
   qu'aucun fichier similaire n'existe dans src/

---

## 2. FIREBASE — CONFIGURATION

```typescript
// src/lib/firebase.ts

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// Site + espace client
export const authClient = getAuth(app)

// Back-office admin (instance séparée — sessions isolées)
const adminApp = initializeApp(firebaseConfig, 'admin')
export const authAdmin = getAuth(adminApp)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'europe-west1')
```

Fichier `.env` à créer dans `C:\data-mc-2030\97import` :
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

---

## 3. FIRESTORE — COLLECTIONS

### Collection `profiles`
```
/profiles/{userId}
  email: string
  role: 'visitor'|'user'|'vip'|'partner'|'admin'
  first_name: string
  last_name: string
  phone: string
  adresse_facturation: string
  ville_facturation: string
  cp_facturation: string
  pays_facturation: string
  adresse_livraison: string
  ville_livraison: string
  cp_livraison: string
  pays_livraison: string
  adresse_livraison_identique: boolean
  created_at: Timestamp
```

### Collection `products`
```
/products/{productId}
  nom: string
  nom_chinois: string
  nom_anglais: string
  reference: string
  numero_interne: string        -- ex: MP-R18-001
  categorie: string
  prix_achat: number
  actif: boolean
  images: string[]
  longueur_cm: number
  largeur_cm: number
  hauteur_cm: number
  poids_net_kg: number
  poids_brut_kg: number
  qte_pieces_par_unite: number
  matiere_fr: string
  matiere_en: string
  matiere_zh: string
  prix_achat_yuan: number
  code_hs: string
  statut_ce: string
  notice_url: string
  video_url: string
  created_at: Timestamp
  updated_at: Timestamp
```

### Collection `quotes`
```
/quotes/{quoteId}
  user_id: string
  numero_devis: string          -- D2600001 ou D2600001-TD
  statut: 'nouveau'|'en_cours'|'vip'|'accepte'|'refuse'
  produits: Array<{
    id: string
    nom: string
    quantite: number
    prixUnitaire: number
    numero_interne: string
    prix_achat: number
  }>
  prix_total_calcule: number
  prix_negocie: number
  partenaire_code: string
  partenaire_id: string
  acomptes: Array<{
    numero: number
    montant: number
    type: 'pro'|'perso'
    statut: 'en_attente'|'encaisse'
    date: Timestamp
    date_encaissement?: Timestamp
  }>
  total_encaisse: number
  solde_restant: number
  invoice_number: string
  adresse_client: string
  ville_client: string
  notes_internes: string
  created_at: Timestamp
  updated_at: Timestamp
```

### Collection `invoices`
```
/invoices/{invoiceId}
  numero_facture: string        -- FA2600001
  quote_id: string
  user_id: string
  montant_ht: number
  montant_acompte: number
  type_facture: 'acompte'|'solde'
  type_paiement: 'pro'|'perso'
  pdf_url: string
  envoye_client: boolean
  envoye_le: Timestamp
  created_at: Timestamp
```

### Collection `partners`
```
/partners/{partnerId}
  nom: string
  code: string                  -- 'TD'|'JM'|'MC'
  email: string
  telephone: string
  user_id: string
  actif: boolean
  created_at: Timestamp
```

### Collection `delivery_notes`
```
/delivery_notes/{docId}
  numero_bl: string             -- BL2600001
  quote_id: string
  user_id: string
  statut: 'brouillon'|'envoye'|'signe'
  signe_le: Timestamp
  pdf_url: string
  envoye_client: boolean
  created_at: Timestamp
```

### Collection `fees`
```
/fees/{feeId}
  numero_document: string       -- FM2600001 ou DD2600001
  quote_id: string
  type_frais: 'maritime'|'dedouanement'
  montant_ht: number
  description: string
  pdf_url: string
  envoye_client: boolean
  created_at: Timestamp
```

### Collection `commission_notes`
```
/commission_notes/{commId}
  numero_commission: string     -- NC2600001
  partner_id: string
  quote_id: string
  prix_remise_client: number
  prix_partenaire: number
  commission_montant: number
  statut: 'emise'|'payee'
  pdf_url: string
  envoye_partenaire: boolean
  created_at: Timestamp
```

### Collection `admin_params`
```
/admin_params/emetteur_pro
  nom, adresse, adresse2, ville, pays, siret, email, iban, bic

/admin_params/emetteur_perso
  nom, adresse, ville, pays, email, iban, bic

/admin_params/rib_pro   → label, url (Firebase Storage)
/admin_params/rib_perso → label, url (Firebase Storage)
/admin_params/config_acompte → max_acomptes: 3
/admin_params/multiplicateurs → user: 2, partner: 1.2
```

### Collection `site_content`
```
/site_content/banniere  → texte, actif, couleur
/site_content/contact   → telephone, whatsapp, email, adresse
/site_content/footer    → tiktok, instagram, whatsapp, mentions
/site_content/livraison → destinations: [{nom, delai, tarif}]
```

### Collection `counters`
```
/counters/devis → value: number  (incrémenté atomiquement)
```

---

## 4. FIREBASE — PATTERNS DE CODE

### Lecture
```typescript
import { doc, getDoc, collection,
  query, where, orderBy, getDocs } from 'firebase/firestore'

const snap = await getDoc(doc(db, 'quotes', quoteId))
const quote = snap.exists()
  ? { id: snap.id, ...snap.data() } : null

const q = query(
  collection(db, 'quotes'),
  where('user_id', '==', userId),
  orderBy('created_at', 'desc')
)
const quotes = (await getDocs(q)).docs
  .map(d => ({ id: d.id, ...d.data() }))
```

### Écriture
```typescript
import { addDoc, setDoc, updateDoc,
  serverTimestamp } from 'firebase/firestore'

await addDoc(collection(db, 'quotes'), {
  ...data, created_at: serverTimestamp()
})
await setDoc(doc(db, 'profiles', userId), { ...data })
await updateDoc(doc(db, 'quotes', quoteId), {
  statut: 'vip', updated_at: serverTimestamp()
})
```

### Numéro devis atomique
```typescript
import { runTransaction } from 'firebase/firestore'

async function getNextDevisNumber(): Promise<string> {
  const counterRef = doc(db, 'counters', 'devis')
  const num = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef)
    const current = snap.exists() ? snap.data().value : 0
    t.set(counterRef, { value: current + 1 })
    return current + 1
  })
  const yy = new Date().getFullYear().toString().slice(2)
  return `D${yy}${String(num).padStart(5, '0')}`
}
```

### Storage
```typescript
import { ref, uploadBytes, getDownloadURL }
  from 'firebase/storage'

const r = ref(storage, `invoices/FA${num}.pdf`)
await uploadBytes(r, pdfBlob,
  { contentType: 'application/pdf' })
const url = await getDownloadURL(r)
```

### Cloud Function email
```typescript
import { httpsCallable } from 'firebase/functions'
const sendEmail = httpsCallable(functions, 'sendEmail')
await sendEmail({ to, subject, html })
```

---

## 5. NUMÉROTATION DOCUMENTS

| Document | Format | Exemple |
|----------|--------|---------|
| Devis | D+AA+00001 | D2600015 |
| Devis partenaire | D+AA+00001-TD | D2600015-TD |
| Facture | FA+même num | FA2600015 |
| Commission | NC+même num | NC2600015 |
| Frais maritimes | FM+même num | FM2600015 |
| Dédouanement | DD+même num | DD2600015 |
| Bon livraison | BL+même num | BL2600015 |

---

## 6. RÔLES ET PRIX

| Rôle | Prix | Accès |
|------|------|-------|
| visitor | Bouton "Se connecter" | Site public |
| user | prix_achat × 2 | Espace client |
| vip | Prix négocié par produit | Espace VIP |
| partner | prix_achat × 1.2 | Commissions |
| admin | Tous | Back-office |

---

## 7. SESSIONS AUTH ISOLÉES

```
authClient → site + espace client
authAdmin  → back-office (instance Firebase séparée)
```

---

## 8. ARCHITECTURE FICHIERS

```
C:\data-mc-2030\97import\
  src\
    lib\
      firebase.ts
      notifications.ts
    components\admin\
      AdminUI.tsx
    pages\admin\
      AdminLayout.tsx
      AdminQuotes.tsx
      AdminUsers.tsx
      AdminPartenaires.tsx
      AdminProducts.tsx
      AdminSuiviAchats.tsx
      AdminParametres.tsx
      AdminContenu.tsx
      AdminDashboard.tsx
    features\
      pdf\lib\pdf-helpers.ts
      pdf\templates\
        quote-pdf.ts
        invoice-pdf.ts
        commission-pdf.ts
        maritime-pdf.ts
        customs-pdf.ts
        delivery-pdf.ts
      cart\
        DevisForm.tsx
        CartContext.tsx
      account\tabs\
        QuotesTab.tsx
        ProfileTab.tsx
        CommissionsTab.tsx
        SecurityTab.tsx
    utils\calculPrix.ts
  functions\src\index.ts
  .env
  package.json
  vite.config.ts
```

---

## 9. SIDEBAR BACK-OFFICE

```
COMMERCE
  📊 Tableau de bord     → /admin
  📄 Devis & Facturation → /admin/devis
  👥 Clients             → /admin/users
  🤝 Partenaires         → /admin/partenaires
CATALOGUE
  📦 Produits            → /admin/products
  🛒 Suivi Achats        → /admin/suivi-achats
  🖼️  Médias             → /admin/media
CONFIGURATION
  ⚙️  Paramètres         → /admin/parametres
  🌐 Contenu Site        → /admin/contenu
```

---

## 10. DESIGN SYSTEM ADMIN

```typescript
ADMIN_COLORS = {
  navy:'#1E3A5F', navyLight:'#EFF6FF',
  navyBorder:'#BFDBFE',
  greenBg:'#F0FDF4', greenBorder:'#86EFAC',
  greenText:'#166534', greenBtn:'#16A34A',
  orangeBg:'#FFFBEB', orangeBorder:'#FCD34D',
  orangeText:'#92400E', orangeBtn:'#EA580C',
  purpleBg:'#FAF5FF', purpleBgDark:'#EDE9FE',
  purpleBorder:'#D8B4FE', purpleText:'#6B21A8',
  purpleBtn:'#7C3AED',
  grayBg:'#F9FAFB', grayBorder:'#E5E7EB',
  grayText:'#6B7280',
  font:"'Inter', -apple-system, sans-serif",
}
```

---

## 11. MODULE GDF — FICHE DEVIS

```
HEADER #1E3A5F : N°devis | Statut | VIP-TD | Client
ÉTAPES ①②③④ : Reçu → VIP → Encaisser → Envoyer

2 COLONNES :
Gauche : Infos client | Produits (2 lignes)
         Suivi paiements | Commission | Actions admin
Droite : FA vert | FM bleu | DD bleu
         BL gris | NC violet (si partenaire)
         Chaque doc : [PDF][→Envoyer]
```

Bouton ENCAISSER : visible si `statut === 'en_attente'`

---

## 12. PARCOURS CLIENT

```
1. Panier → Demander devis
   → Firestore INSERT + clearCart()

2. Pop-up partenaire (dynamique Firestore)
   [TD][JM][MC][Sans partenaire]

3. Pop-up acompte 3 étapes
   A: Montant | B: Pro/Perso | C: RIB + "J'ai viré"
   → INSERT acompte statut:'en_attente'
   → Email admin

4. Espace client → Mes devis
   Documents grisés 🔒 jusqu'envoi admin
```

---

## 13. PDFs — STRUCTURE VALIDÉE

Colonnes : `| Réf. Interne | Produit | Prix HT | Qté | Total HT |`

2 lignes par produit (Devis + Facture) :
```
Ligne 1 grise barrée : prix_achat × 2
Ligne 2 violette VIP : prix_negocie proportionnel
```

Totaux Facture :
```
Total HT            → gras
Acompte 1           → vert
Acompte 2           → vert
Total acomptes      → fond vert
SOLDE RESTANT       → fond orange (ou SOLDÉE vert)
```

Alignement : `doc.text(montant, xValue, y, {align:'right'})`

---

## 14. EMAILS

From : notifications@97import.com (Resend + IONOS DNS ✅)

| Déclencheur | Destinataire |
|-------------|-------------|
| Client "J'ai viré" | parisb2b@gmail.com |
| Admin → Envoyer doc | Email client |
| Solde complet | Email client (notices) |

---

## 15. RÉFÉRENCES INTERNES 68 PRODUITS

```
MP-R18-001 Mini-pelle R18 PRO
MP-R22-001 Mini-pelle R22 PRO
MP-R32-001 Mini-pelle R32 PRO
MP-R57-001 Mini-pelle R57 PRO
MS-20-001  Maison Standard 20 Pieds
MS-30-001  Maison Standard 30 Pieds
MS-40-001  Maison Standard 40 Pieds
MP-20-001  Maison Premium 20 Pieds
MP-30-001  Maison Premium 30 Pieds
MP-40-001  Maison Premium 40 Pieds
OPT-AC-001 Climatisation
OPT-SOL-001 Kit Panneaux Solaires Maison
CC-BYD-001 Camping Car BYD T5DM
KS-10K-001 Kit Solaire 10 kW
KS-12K-001 Kit Solaire 12 kW
KS-20K-001 Kit Solaire 20 kW
ACC-GD-001→011 Godets à dents R22/R32/R57
ACC-GC-001→012 Godets de curage R22/R32/R57
ACC-GI-001→006 Godets inclinables R22/R32/R57
ACC-AR-001/002 Attaches rapides R22/R32
ACC-PP-001/002 Pinces-pouce R22/R32
ACC-RT-001→009 Râteaux R22/R32/R57
ACC-RP-001/002 Rippers R22/R32
ACC-MH-001→003 Marteaux hydrauliques
ACC-TA-001/002 Tarières R22/R32
ACC-GP-001→003 Grappins R22/R32/R57
```

---

## 16. COMPTES TEST

| Email | Rôle | Mdp |
|-------|------|-----|
| parisb2b@gmail.com | admin | — |
| u1@sasfr.com | user | 20262026 |
| vip1@sasfr.com | vip | 20262026 |
| p1@sasfr.com | partner | 20262026 |

---

## 17. PLAN MIGRATION FIREBASE

### PHASE 1 — Setup
```powershell
cd C:\data-mc-2030\97import
# Firebase déjà installé ✅
# 1. Créer projet sur console.firebase.google.com
# 2. Activer Auth + Firestore + Storage + Functions
# 3. Copier les clés → créer .env
# 4. Créer src/lib/firebase.ts
# 5. npm run dev → tester compilation
```

### PHASE 2 — Auth
```
Remplacer Supabase auth → Firebase Auth
Garder Google OAuth + email/password
Cloud Function trigger onCreate → créer profil
```

### PHASE 3 — Base de données
```
Créer collections Firestore
Remplacer supabase.from('x').select() → getDocs
Remplacer .insert() → addDoc/setDoc
Remplacer .update() → updateDoc
```

### PHASE 4 — Storage
```
Remplacer Supabase Storage
→ Firebase Storage (uploadBytes + getDownloadURL)
```

### PHASE 5 — Cloud Functions
```
Créer functions/src/index.ts
Migrer send-email → Cloud Function onCall
```

### PHASE 6 — Build + IONOS
```
npm run build → vérifier /dist
Tester localhost
Upload /dist → IONOS FTP
Configurer redirections SPA
```

---

## 18. BACKLOG

1. Prix négocié par produit individuellement
2. Bouton NC dans AdminDevis colonne droite
3. AdminContenu fonctionnel
4. Upload RIBs depuis AdminParametres
5. Notices produits + email auto au solde
6. Suivi Achats Excel avec checkboxes
7. Email admin quand client "J'ai viré"
