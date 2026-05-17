# 🔍 V155 — SCAN COMPLET DU CODE SOURCE 97IMPORT

**Date :** 10/05/2026 22:27
**Projet :** importok-6ef77
**Emplacement :** C:\DATA-MC-2030\97import-firebase\

---

## 📊 RÉSUMÉ DU SCAN

| Statut | Nombre |
|--------|--------|
| Fichiers scannés | 24 |
| Fichiers trouvés | 20 |
| Fichiers absents | 4 |
| Total lignes | 3006 |

---

## 🎯 INSTRUCTIONS D'ANALYSE POST-SCAN

Après lecture de ce fichier, l'assistant doit :

1. **Vérifier** les patterns clés (voir tableau ci-dessous)
2. **Identifier** les incohérences entre firebase.ts et firestore.rules
3. **Proposer** une réécriture harmonisée de chaque fichier problématique
4. **Ne jamais** faire de micro-correction — remplacer le fichier entier

### Patterns à vérifier

| Pattern | Doit être présent dans | Statut |
|---------|----------------------|--------|
| `connectAuthEmulator` | firebase.ts | ⬜ |
| `onAuthStateChanged` | firebase.ts ou AuthContext | ⬜ |
| `isAdmin()` via email | firestore.rules | ⬜ |
| `allow write: if isOwner` | firestore.rules (users) | ⬜ |
| Instance unique (pas clientApp/adminApp) | firebase.ts | ⬜ |

---

## 📄 src/lib/firebase.ts

**Lignes :** 46

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, onAuthStateChanged } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, doc, getDoc } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyLocalDevEmulatorKey",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const storage = getStorage(app);

// Alias pour compatibilité avec les composants existants
export const clientAuth = auth;
export const adminAuth = auth;
export const adminDb = db;
export const adminStorage = storage;

// ⚡ STABILISATEUR DE RÔLE (V155)
onAuthStateChanged(auth, async (user) => {
  if (user?.email) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.email));
      console.log("📡 [V155] Auth stable :", user.email, "| Rôle :", userDoc.data()?.role);
    } catch (e) {
      console.error("⚠️ Erreur synchro profil", e);
    }
  }
});

// Connexion aux émulateurs sur localhost (Secure Context)
if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  const host = "localhost";
  connectAuthEmulator(auth, `http://${host}:9100`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8081);
  connectStorageEmulator(storage, host, 9200);
  console.log("✅ [V155] Émulateurs connectés");
}

```

---

## 📄 firebase.json

**Lignes :** 24

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "bucket": "importok-6ef77.firebasestorage.app",
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9100
    },
    "firestore": {
      "port": 8081
    },
    "storage": {
      "port": 9200
    },
    "ui": {
      "enabled": true,
      "port": 4001
    }
  }
}

```

---

## 📄 firestore.rules

**Lignes :** 162

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ══════════════════════════════════════════════════════════
    // HELPERS DE SÉCURITÉ (V155)
    // ══════════════════════════════════════════════════════════
    function isAuth() { return request.auth != null; }

    // V155 — Check Admin via l'email du token (compatible émulateur)
    function isAdmin() {
      return isAuth()
        && get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }

    function isOwner(email) { return isAuth() && request.auth.token.email == email; }

    // V69 — Verrouillage lecture seule des devis signés / en cours
    function isDevisReadonly(statut) {
      return statut == 'signe'
          || statut == 'acompte_1' || statut == 'acompte_2' || statut == 'acompte_3'
          || statut == 'solde_paye'
          || statut == 'commande_ferme'
          || statut == 'en_production'
          || statut == 'embarque_chine'
          || statut == 'arrive_port_domtom'
          || statut == 'livre'
          || statut == 'termine';
    }

    // V98 — Empêche l'écrasement des adresses après snapshot
    function isAddressFrozen() {
      let oldFact = resource.data.adresse_facturation;
      let newFact = request.resource.data.adresse_facturation;
      let oldLivr = resource.data.adresse_livraison;
      let newLivr = request.resource.data.adresse_livraison;
      return (oldFact != null && newFact != oldFact) ||
             (oldLivr != null && newLivr != oldLivr);
    }

    // V100 — Protection acompte encaissé (même admin ne peut plus modifier)
    function isAcompteEncaisseProtected() {
      return resource.data.encaisse == true;
    }

    // V155 — Autorise l'écriture de l'adresse si elle est vide (enregistrement initial)
    function canUpdateAddress() {
      let currentData = resource.data;
      let hasNoAddress = !('adresse_facturation' in currentData)
        || currentData.adresse_facturation == ""
        || currentData.adresse_facturation == null;
      return isAdmin() || hasNoAddress;
    }

    // ══════════════════════════════════════════════════════════
    // 👤 UTILISATEURS
    // ══════════════════════════════════════════════════════════
    match /users/{userEmail} {
      allow read: if isOwner(userEmail) || isAdmin();
      allow write: if isOwner(userEmail) || isAdmin();
    }

    match /clients/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin();
    }

    match /partners/{partnerId} {
      allow read: if isAuth();
      allow write: if isAdmin();
    }

    // ══════════════════════════════════════════════════════════
    // 📋 DEVIS
    // ══════════════════════════════════════════════════════════
    match /quotes/{quoteId} {
      allow read: if isAdmin() || (isAuth() && resource.data.client_id == request.auth.uid);
      allow create: if isAuth();
      allow update: if isAdmin()
                  || (isAuth() && resource.data.client_id == request.auth.uid
                      && !isAddressFrozen()
                      && !isDevisReadonly(resource.data.statut)
                      && canUpdateAddress());
      allow delete: if isAdmin();
    }

    // ══════════════════════════════════════════════════════════
    // 💰 ACOMPTES
    // ══════════════════════════════════════════════════════════
    match /acomptes/{acompteId} {
      allow read: if isAdmin() || (isAuth() && resource.data.client_id == request.auth.uid);
      allow create: if isAuth() && request.resource.data.client_id == request.auth.uid;
      allow update: if isAdmin() && !isAcompteEncaisseProtected();
      allow delete: if isAdmin();
    }

    match /quotes/{quoteId}/acomptes/{acompteId} {
      allow read: if isAdmin() || (isAuth() && resource.data.client_id == request.auth.uid);
      allow create: if isAdmin() || (isAuth() && request.resource.data.client_id == request.auth.uid);
      allow update: if isAdmin() && !isAcompteEncaisseProtected();
      allow delete: if isAdmin();
    }

    // ══════════════════════════════════════════════════════════
    // 🧾 FACTURES
    // ══════════════════════════════════════════════════════════
    match /factures/{factureId} {
      allow read: if isAdmin() || (isAuth() && resource.data.client_id == request.auth.uid);
      allow write: if isAdmin();
    }

    // ══════════════════════════════════════════════════════════
    // 💸 COMMISSIONS
    // ══════════════════════════════════════════════════════════
    match /commissions/{commissionId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    match /notes_commission/{noteId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    // ══════════════════════════════════════════════════════════
    // 🛠 DIVERS (SAV, Listes achat, Conteneurs, Logs)
    // ══════════════════════════════════════════════════════════
    match /sav/{savId} {
      allow read: if isAdmin() || (isAuth() && resource.data.client_id == request.auth.uid);
      allow create: if isAuth();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /listes_achat/{listeId} {
      allow read, write: if isAdmin();
    }

    match /conteneurs/{conteneurId} {
      allow read, write: if isAdmin();
    }

    match /logs/{logId} {
      allow read: if isAdmin();
      allow write: if isAuth();
    }

    // ══════════════════════════════════════════════════════════
    // 🔢 COMPTEURS
    // ══════════════════════════════════════════════════════════
    match /counters/{counterId} {
      allow read, write: if isAuth();
    }

    // ══════════════════════════════════════════════════════════
    // 🚫 FALLBACK : tout le reste = admin only
    // ══════════════════════════════════════════════════════════
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}

```

---

## 📄 storage.rules

**Lignes :** 18

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Lecture publique — médias produits accessibles sans auth
    match /{allPaths=**} {
      allow read: if true;
    }
    // V87 — Clients peuvent uploader des photos pour produits sur mesure
    match /custom_products/{file} {
      allow write: if request.auth != null;
    }
    // Écriture admin-only — les scripts admin utilisent firebase-admin SDK (bypass)
    // V61 : restreint à role == 'admin' (était request.auth != null)
    match /{allPaths=**} {
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}

```

---

## 📄 .env

**Lignes :** 8

```bash
VITE_FIREBASE_API_KEY=AIzaSyLocalDevEmulatorKey
VITE_FIREBASE_AUTH_DOMAIN=importok-6ef77.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=importok-6ef77
VITE_FIREBASE_STORAGE_BUCKET=importok-6ef77.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_APP_ENV=development
VITE_APP_VERSION=v0.43.12

```

---

## 📄 src/App.tsx

**Lignes :** 20

```typescript
import { I18nProvider } from './i18n';
import { ToastProvider } from './front/components/Toast';
import AdminApp from './admin/AdminApp';
import FrontApp from './front/FrontApp';

// Detect admin mode by hostname OR path
const isAdmin =
  typeof window !== 'undefined' &&
  (window.location.hostname.startsWith('admin.') ||
    window.location.pathname.startsWith('/admin'));

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        {isAdmin ? <AdminApp /> : <FrontApp />}
      </ToastProvider>
    </I18nProvider>
  );
}

```

---

## 📄 src/main.tsx

**Lignes :** 35

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/global-overrides.css'
import { logError } from './lib/logService'

// v43-M1 : capture globale des erreurs JS et des promesses non-attrapées.
// Tout est routé vers la collection Firestore `logs` via logService (anti-récursion + dédup).
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError(
      'js-error',
      event.message || 'Unknown error',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      event.error,
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? 'Unknown rejection');
    logError('unhandled-promise', message, undefined, reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

```

---

## 📄 src/context/AuthContext.tsx

❌ **FICHIER ABSENT** — à créer lors de la Phase 2

---

## 📄 src/hooks/useAuth.ts

❌ **FICHIER ABSENT** — à créer lors de la Phase 2

---

## 📄 src/admin/AdminApp.tsx

**Lignes :** 522

```typescript
import { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { adminAuth, adminDb as db } from '../lib/firebase';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AdminLogin from './AdminLogin';
import './styles/admin.css';
import './styles/polish-v45.css';
import './styles/sidebar.css';
import '../styles/global-overrides.css';

// Pages
import Dashboard from './pages/Dashboard';
import ListeDevis from './pages/ListeDevis';
import DetailDevis from './pages/DetailDevis';
import Factures from './pages/Factures';
import NotesCommission from './pages/NotesCommission';
import FraisLogistique from './pages/FraisLogistique';
import ListeListesAchat from './pages/ListeListesAchat';
import NouvelleListeAchat from './pages/NouvelleListeAchat';
import DetailListeAchat from './pages/DetailListeAchat';
import ListeConteneurs from './pages/ListeConteneurs';
import NouveauConteneur from './pages/NouveauConteneur';
import DetailConteneur from './pages/DetailConteneur';
import Stock from './pages/Stock';
import SAVListe from './pages/SAVListe';
import SAVDetail from './pages/SAVDetail';
import AdminProduits from './pages/AdminProduits';
import FicheProduit from './pages/FicheProduit';
import Clients from './pages/Clients';
import Partenaires from './pages/Partenaires';
import TauxRMB from './pages/TauxRMB';
import GestionSite from './pages/GestionSite';
import Logs from './pages/Logs';
import LogsDebug from './pages/LogsDebug';
import Parametres from './pages/Parametres';
import DetailFacture from './pages/DetailFacture';
import DetailCommission from './pages/DetailCommission';
import DetailFraisLogistique from './pages/DetailFraisLogistique';
import DetailClient from './pages/DetailClient';
import DetailPartenaire from './pages/DetailPartenaire';
import AcomptesEncaisser from './pages/AcomptesEncaisser';

// Sidebar item type
interface SidebarItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  badgeValue?: boolean;
}

interface SidebarSection {
  label?: string;
  separator?: boolean;
  items: SidebarItem[];
}

// Sidebar sections following mockup structure
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: 'Commerce',
    items: [
      { path: '/admin', label: 'Tableau de bord', icon: '📊' },
      { path: '/admin/devis', label: 'Devis', icon: '📋' },
      { path: '/admin/acomptes', label: 'Acomptes à encaisser', icon: '💰' },
      { path: '/admin/factures', label: 'Factures', icon: '🧾' },
      { path: '/admin/commissions', label: 'Notes de commission', icon: '💼' },
      { path: '/admin/frais', label: 'Factures logistiques', icon: '🛳' },
    ],
  },
  {
    separator: true,
    items: [
      { path: '/admin/listes-achat', label: "Listes d'achat", icon: '🛒' },
      { path: '/admin/conteneurs', label: 'Conteneurs', icon: '📦' },
      { path: '/admin/stock', label: 'Stock', icon: '📦' },
      // V49 Checkpoint K — badge dynamique calcule via onSnapshot collection 'sav'
      // (filtre client-side : statut ouvert/en_cours, non archive). Avant V49 :
      // valeur '2' hardcodee qui ne reflechait pas la realite BD.
      { path: '/admin/sav', label: 'SAV', icon: '🔧' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { path: '/admin/produits', label: 'Produits', icon: '🗂' },
      { path: '/admin/produits/nouveau', label: 'Ajouter produit', icon: '➕' },
    ],
  },
  {
    label: 'Utilisateurs',
    items: [
      // V49 Checkpoint L — badge dynamique = TOTAL clients (decision metier
      // Michel V49 : pas filtre, tous les clients comptent). Avant V49 :
      // valeur '3' hardcodee qui ne reflechait pas la realite BD (7 clients
      // listes par AdminClients.tsx mais badge 3).
      { path: '/admin/clients', label: 'Clients', icon: '👥' },
      { path: '/admin/partenaires', label: 'Partenaires', icon: '🤝' },
    ],
  },
  {
    label: 'Systeme',
    items: [
      { path: '/admin/taux', label: 'Taux RMB', icon: '💱', badgeValue: true },
      { path: '/admin/site', label: 'Gestion site', icon: '🌐' },
      { path: '/admin/logs', label: 'Logs', icon: '🚨' },
      { path: '/admin/logs-debug', label: 'Logs Debug', icon: '🔧' },
      { path: '/admin/parametres', label: 'Parametres', icon: '⚙' },
    ],
  },
];

// Page titles mapping
const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Tableau de bord',
  '/admin/devis': 'Devis',
  '/admin/factures': 'Factures',
  '/admin/commissions': 'Notes de commission',
  '/admin/frais': 'Factures logistiques',
  '/admin/listes-achat': "Listes d'achat",
  '/admin/conteneurs': 'Conteneurs',
  '/admin/stock': 'Stock',
  '/admin/sav': 'SAV',
  '/admin/produits': 'Produits',
  '/admin/produits/nouveau': 'Ajouter un produit',
  '/admin/clients': 'Clients',
  '/admin/partenaires': 'Partenaires',
  '/admin/taux': 'Taux RMB',
  '/admin/site': 'Gestion site',
  '/admin/logs': 'Logs',
  '/admin/logs-debug': 'Logs Debug',
  '/admin/parametres': 'Parametres',
};

// Clock display for MQ/FR/CN
function Clocks() {
  const [times, setTimes] = useState({ mq: '--:--', fr: '--:--', cn: '--:--' });

  useEffect(() => {
    const update = () => {
      const fmt = (tz: string) =>
        new Date().toLocaleTimeString('fr-FR', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
        });
      setTimes({
        mq: fmt('America/Martinique'),
        fr: fmt('Europe/Paris'),
        cn: fmt('Asia/Shanghai'),
      });
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sb-clk">
      <div className="sb-cr">
        <span className="sb-cz">🇲🇶 MQ</span>
        <span className="sb-ct">{times.mq}</span>
      </div>
      <div className="sb-cr">
        <span className="sb-cz">🇫🇷 FR</span>
        <span className="sb-ct">{times.fr}</span>
      </div>
      <div className="sb-cr">
        <span className="sb-cz">🇨🇳 CN</span>
        <span className="sb-ct">{times.cn}</span>
      </div>
    </div>
  );
}

// RMB Pill in topbar
function RmbPill({ rate }: { rate: number }) {
  return (
    <div className="rmb-pill">
      <span>🇨🇳</span>
      <div>
        <div className="rmb-lbl">Taux RMB</div>
        <span className="rmb-val">
          1€ = {rate.toFixed(2)} ¥
        </span>
        <span style={{ fontSize: 10, color: 'var(--gr)', fontWeight: 600, marginLeft: 4 }}>
          ↑+0.3%
        </span>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rmbRate, setRmbRate] = useState(7.82);
  const [location] = useLocation();

  // V49 Checkpoint C — admin role check via custom claim Firebase Auth.
  // request.auth.token.role === 'admin' (set par scripts/set-admin-role.cjs).
  // Tout user authentifie sans role 'admin' tombe sur ForbiddenPage.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  // V78 — Sections repliables : Catalogue + Systeme masquees par defaut
  const HIDDEN_SECTIONS = ['Catalogue', 'Systeme'];
  const visibleSections = isMenuExpanded
    ? SIDEBAR_SECTIONS
    : SIDEBAR_SECTIONS.filter(s => !HIDDEN_SECTIONS.includes(s.label || ''));

  // V50-BIS Checkpoint A — logout admin avec confirmation.
  const handleAdminLogout = async () => {
    if (!window.confirm('Se déconnecter ?')) return;
    try {
      await signOut(adminAuth);
      // onAuthStateChanged va detecter setUser(null), AdminApp re-rend <AdminLogin />.
      // Pas besoin de window.location.href explicite.
    } catch (err) {
      console.error('[AdminApp] handleAdminLogout error:', err);
    }
  };

  // V49 Checkpoint K+L — badges sidebar real-time via onSnapshot.
  // Avant V49 : valeurs hardcoded ('2' SAV, '3' Clients) ne reflechant pas
  // l'etat BD. Apres V49 : compteurs vivants, sans index Firestore requis
  // (filtrage client-side). Si key absente du map, fallback a item.badge
  // statique (compatibilite avec d'eventuelles entrees non instrumentees).
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    // V49 Checkpoint K — badge SAV : nb d'enregistrements ouverts ou en cours,
    // hors archives. Filtrage client-side pour eviter les index composites.
    const unsubSav = onSnapshot(collection(db, 'sav'), (snap) => {
      const ouverts = snap.docs.filter((d) => {
        const data = d.data() as any;
        const statut = data.statut;
        const archive = data.archive === true;
        return !archive && (statut === 'ouvert' || statut === 'en_cours' || statut === 'nouveau');
      });
      setDynamicBadges((prev) => ({ ...prev, '/admin/sav': ouverts.length }));
    }, (err) => {
      console.warn('[AdminApp badge SAV] snapshot error:', err.message);
    });

    // V49 Checkpoint L — badge Clients : TOTAL clients (pas de filtre).
    // Decision metier Michel V49 : afficher la taille de la collection.
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setDynamicBadges((prev) => ({ ...prev, '/admin/clients': snap.size }));
    }, (err) => {
      console.warn('[AdminApp badge Clients] snapshot error:', err.message);
    });

    return () => {
      unsubSav();
      unsubClients();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // V155 — Vérification du rôle via Firestore (pas via custom claims)
          // Les claims Auth ne sont pas propagés dans l'émulateur local.
          // On lit le document users/{email} qui contient le champ 'role'.
          const snap = await getDoc(doc(db, 'users', u.email || ''));
          const role = snap.exists() ? snap.data()?.role : null;
          const isUserAdmin = role === 'admin';
          console.log('📡 [V155] AdminApp — vérification rôle:', u.email, '→', role, '| admin:', isUserAdmin);
          setIsAdmin(isUserAdmin);
        } catch (err) {
          console.error('[AdminApp] Failed to check role:', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load RMB rate from Firestore
  useEffect(() => {
    const loadRate = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin_params', 'global'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.taux_rmb_eur) {
            setRmbRate(data.taux_rmb_eur);
          }
        }
      } catch (e) {
        console.error('Error loading RMB rate:', e);
      }
    };
    loadRate();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span>Chargement...</span>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  // V49 Checkpoint C — bloque l'accès si role !== 'admin'.
  // En attendant que la propagation du token (~1h) soit faite, isAdmin peut
  // être null brièvement après login : on attend la résolution du claim.
  if (isAdmin === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Vérification des droits…</span>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32, fontFamily: 'inherit' }}>
        <div style={{ fontSize: 56 }} aria-hidden>🔒</div>
        <h1 style={{ margin: 0, color: '#1565C0', fontSize: 22 }}>Accès refusé</h1>
        <p style={{ margin: 0, color: '#6B7280', maxWidth: 480, textAlign: 'center', lineHeight: 1.5 }}>
          Cet espace est réservé aux administrateurs 97import.
          Si vous pensez que c'est une erreur, contactez l'administrateur.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <a
            href="/"
            className="v45-trans-fast v45-focus v45-btn-ghost"
            style={{
              padding: '10px 20px', background: 'transparent', color: '#1565C0',
              border: '1.5px solid #1565C0', borderRadius: 10, fontSize: 14,
              fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit',
            }}
          >
            ← Retour à l'accueil
          </a>
          <button
            onClick={() => signOut(adminAuth)}
            className="v45-trans-fast v45-focus v45-btn-danger"
            style={{
              padding: '10px 20px', background: 'transparent', color: '#DC2626',
              border: '1.5px solid #FCA5A5', borderRadius: 10, fontSize: 14,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // Get current page title
  const pageTitle = PAGE_TITLES[location] || 'Admin';

  return (
    <div className="admin-layout">
      {/* Sidebar — V77 Clean Sweep */}
      <div className="sb">
        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-lb">🚢</div>
          <div>
            <div className="sb-lt">
              97<em>IMPORT</em>
            </div>
            <div className="sb-adm">ADMIN v4</div>
          </div>
        </div>

        {/* Clocks */}
        <Clocks />

        {/* Navigation sections */}
        <div className="sb-scroller">
        {visibleSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {section.separator && <div className="sb-sep" />}
            {section.label && <div className="sb-sec">{section.label}</div>}
            {section.items.map((item) => {
              const isActive =
                item.path === '/admin'
                  ? location === '/admin'
                  : location.startsWith(item.path) && item.path !== '/admin';
              return (
                <Link key={item.path} href={item.path}>
                  <div className={`si${isActive ? ' on' : ''}`}>
                    <div className="si-l">
                      {item.icon} {item.label}
                    </div>
                    {/* V49 Checkpoint K+L — badge dynamique si key presente
                        dans dynamicBadges (real-time), sinon fallback statique
                        item.badge (presence non instrumentee par V49). */}
                    {(() => {
                      const dyn = dynamicBadges[item.path];
                      const value = dyn !== undefined ? dyn : item.badge;
                      return value !== undefined && value !== null && value > 0
                        ? <span className="sb-bdg">{value}</span>
                        : null;
                    })()}
                    {item.badgeValue && (
                      <span className="sb-bdg am">{rmbRate.toFixed(2)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
        </div>

        {/* V78 — Bouton Plus/Moins pour deplier Catalogue + Systeme */}
        <button className="sb-expand" onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
          <span style={{ fontSize: 14 }}>{isMenuExpanded ? '▾' : '▸'}</span>
          {isMenuExpanded ? 'Moins' : 'Plus'}
        </button>

        {/* V50-BIS Checkpoint A — bouton Deconnexion en bas de sidebar.
            Style coherent V45 (.v45-btn-danger ghost rouge), confirme via
            window.confirm. signOut(adminAuth) declenche onAuthStateChanged
            qui ramene a <AdminLogin />. */}
        <div className="sb-sep" />
        <button
          onClick={handleAdminLogout}
          className="v45-trans-fast v45-focus v45-btn-danger"
          style={{
            margin: '12px',
            padding: '10px 14px',
            background: 'transparent',
            color: '#FCA5A5',
            border: '1.5px solid rgba(252, 165, 165, 0.3)',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          title="Deconnexion"
        >
          <span aria-hidden>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Main content */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="tb-t">{pageTitle}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RmbPill rate={rmbRate} />
          </div>
        </div>

        {/* Content */}
        <div className="content">
          <ErrorBoundary>
            <Switch>
              <Route path="/admin" component={Dashboard} />
              <Route path="/admin/devis" component={ListeDevis} />
              <Route path="/admin/devis/nouveau" component={DetailDevis} />
              <Route path="/admin/devis/:id" component={DetailDevis} />
              <Route path="/admin/acomptes" component={AcomptesEncaisser} />
              <Route path="/admin/factures/:id" component={DetailFacture} />
              <Route path="/admin/factures" component={Factures} />
              <Route path="/admin/commissions/:id" component={DetailCommission} />
              <Route path="/admin/commissions" component={NotesCommission} />
              <Route path="/admin/frais/:id" component={DetailFraisLogistique} />
              <Route path="/admin/frais" component={FraisLogistique} />
              <Route path="/admin/listes-achat/nouvelle" component={NouvelleListeAchat} />
              <Route path="/admin/listes-achat/:id" component={DetailListeAchat} />
              <Route path="/admin/listes-achat" component={ListeListesAchat} />
              <Route path="/admin/conteneurs" component={ListeConteneurs} />
              <Route path="/admin/conteneurs/nouveau" component={NouveauConteneur} />
              <Route path="/admin/conteneurs/:id" component={DetailConteneur} />
              <Route path="/admin/sav" component={SAVListe} />
              <Route path="/admin/sav/:id" component={SAVDetail} />
              <Route path="/admin/stock" component={Stock} />
              <Route path="/admin/produits/nouveau" component={FicheProduit} />
              <Route path="/admin/produits/:ref" component={FicheProduit} />
              <Route path="/admin/produits" component={AdminProduits} />
              <Route path="/admin/clients/:id" component={DetailClient} />
              <Route path="/admin/clients" component={Clients} />
              <Route path="/admin/partenaires/:id" component={DetailPartenaire} />
              <Route path="/admin/partenaires" component={Partenaires} />
              <Route path="/admin/taux" component={TauxRMB} />
              <Route path="/admin/site" component={GestionSite} />
              <Route path="/admin/logs" component={Logs} />
              <Route path="/admin/logs-debug" component={LogsDebug} />
              <Route path="/admin/parametres" component={Parametres} />
              <Route>
                <Dashboard />
              </Route>
            </Switch>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

```

---

## 📄 src/admin/AdminLayout.tsx

❌ **FICHIER ABSENT** — à créer lors de la Phase 2

---

## 📄 src/admin/AdminLogin.tsx

**Lignes :** 126

```typescript
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { adminAuth, adminDb as db } from '../lib/firebase';
import { useI18n } from '../i18n';
import { GlobeToggle } from '../components/GlobeToggle';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import { getBuildInfo } from '../lib/version';

export default function AdminLogin() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // V50-BIS Checkpoint B — modal mot de passe oublie.
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(adminAuth, email, password);
      // Check admin role
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      const role = userSnap.data()?.role;
      if (role !== 'admin') {
        await adminAuth.signOut();
        setError('Accès refusé. Ce compte n\'a pas les droits administrateur.');
        return;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="h-14 bg-white border-b flex items-center justify-end px-4">
        <GlobeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-navy">97import</h1>
            <p className="text-gray-500">{t('admin.login.title')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.login.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white py-2 rounded font-medium hover:bg-navy-dark disabled:opacity-50"
            >
              {loading ? t('loading') : t('admin.login.submit')}
            </button>

            {/* V50-BIS Checkpoint B — lien Mot de passe oublie */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-[#1565C0] hover:underline focus:outline-none focus:underline"
                style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* V72 — Badge version build (traçabilité admin) */}
            <div className="text-center pt-4" style={{
              fontSize: 11,
              color: '#9CA3AF',
              fontFamily: 'monospace',
              letterSpacing: '0.02em',
            }}>
              {getBuildInfo()}
            </div>
          </form>
        </div>
      </div>

      {/* V50-BIS Checkpoint B — Modal reset password */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={email}
      />
    </div>
  );
}

```

---

## 📄 src/admin/pages/Dashboard.tsx

**Lignes :** 506

```typescript
import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { Link } from 'wouter';
import { adminDb as db } from '../../lib/firebase';
import { checkRateDeviation, type RateDeviation } from '../../lib/exchangeRateMonitor';
import { useI18n } from '../../i18n';
import {
  Kpi,
  Card,
  Button,
  Pill,
  IconButton,
  EyeIcon,
  Progress,
} from '../components/Icons';
import LoadingState from '../components/atoms/LoadingState';
import EmptyState from '../components/atoms/EmptyState';

interface Stats {
  devisTotal: number;
  devisEnAttente: number;
  devisVip: number;
  devisStd: number;
  caEncaisse: number;
  soldeRestant: number;
  commissionsDues: number;
  commissionsPartenaires: number;
  savUrgents: number;
}

interface RecentDevis {
  id: string;
  numero: string;
  client_nom: string;
  total_ht: number;
  statut: string;
  is_vip: boolean;
}

interface Conteneur {
  id: string;
  reference: string;
  type: string;
  destination: string;
  date_depart: string;
  volume_utilise: number;
  volume_max: number;
  statut: string;
}

interface Commission {
  id: string;
  partenaire_code: string;
  partenaire_nom: string;
  montant: number;
  statut: string;
}

export default function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats>({
    devisTotal: 0,
    devisEnAttente: 0,
    devisVip: 0,
    devisStd: 0,
    caEncaisse: 0,
    soldeRestant: 0,
    commissionsDues: 0,
    commissionsPartenaires: 0,
    savUrgents: 0,
  });
  const [recentDevis, setRecentDevis] = useState<RecentDevis[]>([]);
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [rateDeviation, setRateDeviation] = useState<RateDeviation | null>(null);

  // V50-BIS Checkpoint D — diagnostic systematic-debugging :
  // Avant V50-BIS, loadData wrappait 5 queries Firestore dans un seul
  // try/catch global. Si UNE seule queries throw (collection inexistante,
  // index manquant pour `where in`, RBAC), tout le dashboard cassait avec
  // banniere "Erreur lors du chargement du tableau de bord".
  //
  // Apres V50-BIS : chaque section devient un helper independant,
  // toutes lancees en Promise.allSettled. Echec local = log console +
  // fallback (KPI "—", liste vide, demo data). Banniere globale n'apparait
  // que si TOUTES les sections echouent (ultime degraded mode).

  // V70 — Surveillance écart taux de change (seuil ±3%)
  useEffect(() => {
    checkRateDeviation().then((dev) => {
      if (dev?.depasse_seuil) setRateDeviation(dev);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // ──────────────────────────────────────────────────────────
      // Helpers granulaires — chacun gere sa propre partie de state
      // ──────────────────────────────────────────────────────────
      type QuotesPartial = {
        devisTotal: number; devisEnAttente: number; devisVip: number;
        caEncaisse: number; soldeRestant: number;
        recents: RecentDevis[];
      };
      const loadQuotesStats = async (): Promise<QuotesPartial> => {
        const allQuotesSnap = await getDocs(collection(db, 'quotes'));
        const allQuotes = allQuotesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

        const devisTotal = allQuotes.length;
        const devisEnAttente = allQuotes.filter((q) => q.statut === 'nouveau' || q.statut === 'envoye').length;
        const devisVip = allQuotes.filter((q) => q.is_vip || q.statut === 'vip_envoye').length;

        let caEncaisse = 0;
        allQuotes.forEach((q) => {
          if (q.acomptes && Array.isArray(q.acomptes)) {
            q.acomptes.forEach((a: any) => {
              if (a.encaisse === true) caEncaisse += (a.montant || 0);
            });
          }
        });

        const totalHtAll = allQuotes.reduce((sum, q) => sum + (q.total_ht || 0), 0);
        const soldeRestant = totalHtAll - caEncaisse;

        // 5 most recent devis sorted by createdAt
        const sorted = [...allQuotes].sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return tb - ta;
        });
        return {
          devisTotal, devisEnAttente, devisVip,
          caEncaisse, soldeRestant,
          recents: sorted.slice(0, 5) as RecentDevis[],
        };
      };

      type CommissionsPartial = {
        commissionsDues: number;
        commissionsPartenaires: number;
        list: Commission[];
      };
      const loadCommissionsStats = async (): Promise<CommissionsPartial> => {
        const [commSnap, notesCommSnap] = await Promise.all([
          getDocs(collection(db, 'commissions')).catch(() => null),
          getDocs(collection(db, 'notes_commission')).catch(() => null),
        ]);
        let commissionsDues = 0;
        const partenaireSet = new Set<string>();
        const list: Commission[] = [];
        if (commSnap) {
          commSnap.docs.forEach((d) => {
            const data = d.data();
            if (data.statut === 'due') {
              commissionsDues += (data.montant || 0);
              if (data.partenaire_code) partenaireSet.add(data.partenaire_code);
              list.push({ id: d.id, ...data } as Commission);
            }
          });
        }
        if (notesCommSnap) {
          notesCommSnap.docs.forEach((d) => {
            const data = d.data();
            if (data.statut === 'due') {
              commissionsDues += (data.montant || 0);
              if (data.partenaire_code) partenaireSet.add(data.partenaire_code);
              list.push({ id: d.id, ...data } as Commission);
            }
          });
        }
        return { commissionsDues, commissionsPartenaires: partenaireSet.size, list };
      };

      const loadSavCount = async (): Promise<number> => {
        const savSnap = await getDocs(
          query(collection(db, 'sav'), where('statut', '==', 'nouveau'))
        );
        return savSnap.size;
      };

      const loadConteneurs = async (): Promise<Conteneur[]> => {
        const contQuery = query(
          collection(db, 'conteneurs'),
          where('statut', 'in', ['préparation', 'chargé', 'parti']),
          limit(3)
        );
        const contSnap = await getDocs(contQuery);
        return contSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Conteneur[];
      };

      // ──────────────────────────────────────────────────────────
      // Promise.allSettled : echecs granulaires non bloquants
      // ──────────────────────────────────────────────────────────
      const [quotesRes, commissionsRes, savRes, contRes] = await Promise.allSettled([
        loadQuotesStats(),
        loadCommissionsStats(),
        loadSavCount(),
        loadConteneurs(),
      ]);

      // Quotes : section cle (CA, KPI principaux)
      let quotesPartial: QuotesPartial = {
        devisTotal: 0, devisEnAttente: 0, devisVip: 0,
        caEncaisse: 0, soldeRestant: 0, recents: [],
      };
      if (quotesRes.status === 'fulfilled') {
        quotesPartial = quotesRes.value;
        setRecentDevis(quotesRes.value.recents);
      } else {
        console.warn('[Dashboard] loadQuotesStats failed:', quotesRes.reason?.message);
      }

      let commissionsPartial: CommissionsPartial = {
        commissionsDues: 0, commissionsPartenaires: 0, list: [],
      };
      if (commissionsRes.status === 'fulfilled') {
        commissionsPartial = commissionsRes.value;
        setCommissions(commissionsRes.value.list.slice(0, 5));
      } else {
        console.warn('[Dashboard] loadCommissionsStats failed:', commissionsRes.reason?.message);
      }

      let savCount = 0;
      if (savRes.status === 'fulfilled') {
        savCount = savRes.value;
      } else {
        console.warn('[Dashboard] loadSavCount failed (collection sav inexistante ou rules ?):',
          savRes.reason?.message);
      }

      if (contRes.status === 'fulfilled') {
        setConteneurs(contRes.value);
      } else {
        console.warn('[Dashboard] loadConteneurs failed (collection containers ou index manquant ?):',
          contRes.reason?.message);
        setConteneurs([]);
      }

      setStats({
        devisTotal: quotesPartial.devisTotal,
        devisEnAttente: quotesPartial.devisEnAttente,
        devisVip: quotesPartial.devisVip,
        devisStd: quotesPartial.devisEnAttente - quotesPartial.devisVip,
        caEncaisse: quotesPartial.caEncaisse,
        soldeRestant: quotesPartial.soldeRestant,
        commissionsDues: commissionsPartial.commissionsDues,
        commissionsPartenaires: commissionsPartial.commissionsPartenaires,
        savUrgents: savCount,
      });

      // Banniere globale UNIQUEMENT si TOUTES les sections principales ont echoue.
      // (Mode degrade extreme — ex: pas de connexion BD du tout.)
      const allFailed =
        quotesRes.status === 'rejected' &&
        commissionsRes.status === 'rejected' &&
        savRes.status === 'rejected' &&
        contRes.status === 'rejected';
      if (allFailed) {
        setErrorMsg('Erreur lors du chargement du tableau de bord');
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    // V50-BIS Checkpoint I — composant LoadingState uniforme.
    return <LoadingState message="Chargement du tableau de bord…" />;
  }

  return (
    <>
      {errorMsg && <div className="card" style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 20px', marginBottom: 16, borderLeft: '4px solid #EF4444' }}>{errorMsg}</div>}
      {rateDeviation && (
        <div style={{
          background: '#FFFBEB', color: '#92400E', padding: '12px 20px', marginBottom: 16,
          borderLeft: '4px solid #F59E0B', borderRadius: 8, fontSize: 13,
        }}>
          <strong>⚠️ {t('alerts.rate.title')}</strong> — {t('alerts.rate.variation_warning').replace('{delta}', String(rateDeviation.ecart_pct))}
          (taux manuel : {rateDeviation.taux_manuel.toFixed(4)}, API {rateDeviation.source_api} : {rateDeviation.taux_api.toFixed(4)}).
          {' '}{t('alerts.rate.check_settings')} <Link href="/admin/taux-rmb"><span style={{ color: '#1565C0', textDecoration: 'underline', cursor: 'pointer' }}>Taux RMB</span></Link>.
        </div>
      )}
      {/* KPI Grid */}
      <div className="kgrid">
        <Kpi
          label="Devis en attente"
          value={stats.devisEnAttente}
          sub={`${stats.devisVip} VIP · ${stats.devisStd} standard`}
        />
        <Kpi
          label="CA encaisse avr."
          value={`${stats.caEncaisse.toLocaleString('fr-FR')}€`}
          color="tl"
          sub="+12% vs mars"
        />
        <Kpi
          label="Commissions dues"
          value={`${stats.commissionsDues.toLocaleString('fr-FR')}€`}
          color="or"
          sub={`${stats.commissionsPartenaires} partenaires`}
        />
        <Kpi label="SAV urgents" value={stats.savUrgents} color="rd" sub="A traiter" />
      </div>

      {/* Two columns layout */}
      <div className="g2">
        {/* Left column */}
        <div>
          {/* Devis recents */}
          <Card
            title="Devis recents"
            actions={
              <Link href="/admin/devis">
                <Button variant="p">Voir tout</Button>
              </Link>
            }
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentDevis.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <EmptyState
                        icon="📋"
                        title="Aucun devis récent"
                        description="Les derniers devis apparaîtront ici dès qu'ils seront créés."
                      />
                    </td>
                  </tr>
                ) : (
                  recentDevis.map((d) => (
                    <tr key={d.id} className="cl">
                      <td>
                        <strong>{d.numero}</strong>
                      </td>
                      <td>{d.client_nom || '—'}</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: d.is_vip ? 'var(--pu)' : 'inherit',
                        }}
                      >
                        {d.total_ht?.toLocaleString('fr-FR')}€
                      </td>
                      <td>
                        <Pill variant={d.is_vip ? 'pu' : d.statut === 'brouillon' ? 'or' : 'tl'}>
                          {d.is_vip ? 'VIP' : d.statut === 'brouillon' ? 'En attente' : 'Acompte'}
                        </Pill>
                      </td>
                      <td className="tda">
                        <Link href={`/admin/devis/${d.id}`}>
                          <IconButton icon={<EyeIcon />} tooltip="Ouvrir" variant="eye" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          {/* Conteneurs actifs */}
          <Card
            title="Conteneurs actifs"
            actions={
              <Link href="/admin/conteneurs">
                <Button variant="out">Gerer</Button>
              </Link>
            }
          >
            <div style={{ padding: 12 }}>
              {conteneurs.length === 0 ? (
                <EmptyState
                  icon="📦"
                  title="Aucun conteneur actif"
                  description="Les conteneurs en préparation ou en transit s'afficheront ici."
                />
              ) : (
                conteneurs.map((c) => (
                  <div key={c.id} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                      }}
                    >
                      <strong style={{ fontSize: 12 }}>{c.reference}</strong>
                      <Pill variant={c.statut === 'préparation' ? 'or' : 'tl'}>
                        {c.statut === 'préparation' ? 'En prep.' : c.statut}
                      </Pill>
                    </div>
                    <div
                      style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}
                    >
                      {c.type} · {c.destination} · {c.date_depart}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ flex: 1 }}>
                        <Progress value={c.volume_utilise} max={c.volume_max} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>
                        {c.volume_utilise}/{c.volume_max}m³
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div>
          {/* SAV urgents */}
          {stats.savUrgents > 0 && (
            <div className="sav-urg">
              <h3
                style={{
                  fontFamily: 'var(--fh)',
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 3,
                }}
              >
                🔧 {stats.savUrgents} SAV urgents
              </h3>
              <p style={{ fontSize: 11, opacity: 0.85 }}>
                Dupont MQ — MP-R22-001 · Carrera — ACC-GD-004
              </p>
              <Link href="/admin/sav">
                <button
                  className="btn r"
                  style={{ marginTop: 8 }}
                >
                  Traiter →
                </button>
              </Link>
            </div>
          )}

          {/* Commissions dues */}
          <Card
            title="Commissions dues"
            actions={
              <Link href="/admin/commissions">
                <Button variant="out">Voir tout</Button>
              </Link>
            }
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Partenaire</th>
                  <th>Due</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 0 }}>
                      <EmptyState
                        icon="💰"
                        title="Aucune commission due"
                        description="Les commissions partenaires dues apparaîtront ici."
                      />
                    </td>
                  </tr>
                ) : (
                  commissions.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Pill variant="pu">{c.partenaire_code}</Pill> {c.partenaire_nom}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--pu)' }}>
                        {c.montant?.toLocaleString('fr-FR')}€
                      </td>
                      <td>
                        <Pill variant="or">Due</Pill>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}

```

---

## 📄 src/front/FrontApp.tsx

**Lignes :** 56

```typescript
import { Route, Switch } from 'wouter';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Produit from './pages/Produit';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Panier from './pages/Panier';
import Profil from './pages/Profil';
import { Redirect } from 'wouter';
import EspaceClient from './pages/EspaceClient';
import EspacePartenaire from './pages/EspacePartenaire';
import SignatureDevis from './pages/SignatureDevis';
import Services from './pages/Services';
import Contact from './pages/Contact';

function Placeholder({ name }: { name: string }) {
  return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>{name} — page à venir</div>;
}

export default function FrontApp() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/catalogue" component={Catalogue} />
          <Route path="/catalogue/accessoires" component={Catalogue} />
          <Route path="/catalogue/:categorie/:gamme/accessoires" component={Catalogue} />
          <Route path="/catalogue/:categorie/:gamme" component={Catalogue} />
          <Route path="/catalogue/:categorie" component={Catalogue} />
          <Route path="/produit/:id" component={Produit} />
          <Route path="/connexion" component={Connexion} />
          <Route path="/inscription" component={Inscription} />
          <Route path="/panier" component={Panier} />
          <Route path="/mon-compte/:tab?">{() => <Redirect to="/espace-client" />}</Route>
          <Route path="/services" component={Services} />
          <Route path="/contact" component={Contact} />
          <Route path="/espace-client/:tab?" component={EspaceClient} />
          <Route path="/espace-partenaire" component={EspacePartenaire} />
          <Route path="/signature/:token" component={SignatureDevis} />
          <Route path="/profil" component={Profil} />
          <Route path="/mentions-legales">{() => <Placeholder name="Mentions légales" />}</Route>
          <Route path="/cgv">{() => <Placeholder name="CGV" />}</Route>
          <Route path="/rgpd">{() => <Placeholder name="RGPD" />}</Route>
          <Route><Home /></Route>
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

```

---

## 📄 src/front/pages/Connexion.tsx

**Lignes :** 125

```typescript
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

export default function Connexion() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkProfileAndRedirect = async (uid: string) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const userData = userSnap.data();
      if (!userData) {
        setLocation('/profil');
        return;
      }
      const role = userData.role || 'user';
      const profilComplet = userData.phone || userData.telephone;
      if (!profilComplet) {
        setLocation('/profil');
      } else if (role === 'partner') {
        setLocation('/espace-partenaire');
      } else {
        setLocation('/espace-client');
      }
    } catch {
      console.warn('Connexion: échec redirection post-login, fallback /');
      setLocation('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(clientAuth, email, password);
      await checkProfileAndRedirect(cred.user.uid);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(clientAuth, provider);
      await checkProfileAndRedirect(cred.user.uid);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', background: '#F9FAFB' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40, width: '100%', maxWidth: 440 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1565C0', textAlign: 'center', marginBottom: 8 }}>{t('auth.connexion')}</h1>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28 }}>{t('auth.accesEspace')}</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="votre@email.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••" style={inputStyle} />
          </div>

          {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px 0', background: '#1565C0', color: 'white', border: 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1,
          }}>
            {loading ? '...' : t('auth.seConnecter')}
          </button>
        </form>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', padding: '12px 0', background: 'white', color: '#374151', border: '1px solid #E5E7EB',
          borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/></svg>
          {t('auth.avecGoogle')}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6B7280' }}>
          {t('auth.pasDeCompte')}{' '}
          <Link href="/inscription">
            <span style={{ color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>{t('auth.inscription')}</span>
          </Link>
        </p>
      </div>
    </div>
  );
}

```

---

## 📄 src/front/pages/Profil.tsx

**Lignes :** 292

```typescript
import { useState, useEffect } from 'react';
import { useLocation, Redirect } from 'wouter';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { useToast } from '../components/Toast';

export default function Profil() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const user = clientAuth.currentUser;

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('MQ');
  // V62 — adresse de livraison distincte
  const [livraisonRue, setLivraisonRue] = useState('');
  const [livraisonCP, setLivraisonCP] = useState('');
  const [livraisonVille, setLivraisonVille] = useState('');
  const [livraisonPays, setLivraisonPays] = useState('MQ');
  const [identiqueFacturation, setIdentiqueFacturation] = useState(true);
  const [addressType, setAddressType] = useState('facturation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'clients', user.uid));
        const data = snap.data();
        if (data) {
          setNom(data.lastName || data.nom || user.displayName?.split(' ').slice(1).join(' ') || '');
          setPrenom(data.firstName || user.displayName?.split(' ')[0] || '');
          setEmail(data.email || user.email || '');
          setTelephone(data.telephone || '');
          setAdresse(data.adresse || '');
          setCodePostal(data.codePostal || '');
          setVille(data.ville || '');
          setPays(data.pays || 'MQ');
          // V62 adresse livraison
          const al = data.adresse_livraison || {};
          setLivraisonRue(al.rue || '');
          setLivraisonCP(al.code_postal || '');
          setLivraisonVille(al.ville || '');
          setLivraisonPays(al.pays || 'MQ');
          setIdentiqueFacturation(al.identique_facturation !== false);
          setAddressType(data.addressType || 'facturation');
          setIsIncomplete(!data.telephone || !data.adresse);
          setIsNewProfile(false);
        } else {
          setEmail(user.email || '');
          setPrenom(user.displayName?.split(' ')[0] || '');
          setNom(user.displayName?.split(' ').slice(1).join(' ') || '');
          setIsIncomplete(true);
          setIsNewProfile(true);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <Redirect to="/connexion" />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const commonFields = {
        uid: user.uid,
        email: user.email,
        firstName: prenom,
        lastName: nom,
        nom: `${prenom} ${nom}`,
        telephone,
        adresse,
        codePostal,
        ville,
        pays,
        // V79 — Type d'adresse depuis le selecteur
        addressType: addressType || 'facturation',
        adresse_livraison: identiqueFacturation ? {
          rue: adresse,
          code_postal: codePostal,
          ville,
          pays,
          identique_facturation: true,
        } : {
          rue: livraisonRue,
          code_postal: livraisonCP,
          ville: livraisonVille,
          pays: livraisonPays,
          identique_facturation: false,
          addressType: 'livraison' as const,
        },
        updatedAt: serverTimestamp(),
        // V71 — createdAt uniquement au premier enregistrement
        ...(isNewProfile ? { createdAt: serverTimestamp() } : {}),
      };

      await setDoc(doc(db, 'clients', user.uid), commonFields, { merge: true });
      await setDoc(doc(db, 'users', user.uid), commonFields, { merge: true });

      showToast('Profil enregistré avec succès !');
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const role = userSnap.data()?.role || 'user';
      setTimeout(() => {
        setLocation(role === 'partner' ? '/espace-partenaire' : '/espace-client');
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', background: '#F9FAFB' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40, width: '100%', maxWidth: 520 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1565C0', textAlign: 'center', marginBottom: 8 }}>{t('profil.title')}</h1>

        {isIncomplete && (
          <div style={{
            background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 12, padding: 16, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>{t('profil.subtitle')}</p>
              <p style={{ fontSize: 12, color: '#B45309' }}>{t('profil.subtitleDesc')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.prenom')}</label>
              <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.nom')}</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.email')}</label>
            <input type="email" value={email} disabled style={{ ...inputStyle, background: '#F3F4F6', color: '#9CA3AF' }} />
            <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>🔒 Ce champ est verrouillé</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.telephone')} *</label>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} required
              placeholder="+596 6 00 00 00 00" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16, background: '#F0F9FF', padding: 16, borderRadius: 12, border: '2px solid #BAE6FD' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <label style={{ fontSize: 14, fontWeight: 700, color: '#0369A1' }}>Type d'adresse *</label>
            </div>
            <select value={addressType} onChange={e => setAddressType(e.target.value)} required
              style={{ ...inputStyle, background: '#fff', fontWeight: 600, color: '#0369A1', border: '2px solid #BAE6FD' }}>
              <option value="">{t('address.select_type') || '— Sélectionnez le type d\'adresse —'}</option>
              <option value="facturation">{t('address.facturation') || '🧾 Adresse de facturation'}</option>
              <option value="livraison">{t('address.livraison') || '📦 Adresse de livraison'}</option>
            </select>
            {!addressType ? (
              <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>
                {t('address.type_required') || 'Le type d\'adresse est obligatoire'}
              </span>
            ) : (
              <span style={{ fontSize: 12, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: addressType === 'facturation' ? '#DBEAFE' : '#FFF7ED', color: addressType === 'facturation' ? '#1E40AF' : '#9A3412', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                {addressType === 'facturation' ? '🧾' : '📦'} {addressType === 'facturation' ? 'Adresse de FACTURATION' : 'Adresse de LIVRAISON'}
              </span>
            )}
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>{t('profil.adresse')} *</label>
              <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)} required
                placeholder="12 rue du Port" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.codePostal')} *</label>
              <input type="text" value={codePostal} onChange={e => setCodePostal(e.target.value)} required
                placeholder="97200" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.ville')} *</label>
              <input type="text" value={ville} onChange={e => setVille(e.target.value)} required
                placeholder="Fort-de-France" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.pays')} *</label>
            <select value={pays} onChange={e => setPays(e.target.value)} style={inputStyle}>
              <option value="MQ">Martinique</option>
              <option value="GP">Guadeloupe</option>
              <option value="RE">Reunion</option>
              <option value="GF">Guyane</option>
              <option value="FR">France metropolitaine</option>
            </select>
          </div>

          {/* V62 — Adresse de livraison */}
          <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1565C0', margin: 0 }}>Adresse de livraison</h2>
              <span style={{ fontSize: 10, background: '#EDE9FE', color: '#7C3AED', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Livraison</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13, color: '#4B5563' }}>
              <input type="checkbox" checked={identiqueFacturation} onChange={e => {
                setIdentiqueFacturation(e.target.checked);
                if (e.target.checked) {
                  setLivraisonRue(adresse);
                  setLivraisonCP(codePostal);
                  setLivraisonVille(ville);
                  setLivraisonPays(pays);
                }
              }} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Adresse de livraison identique à l'adresse de facturation
            </label>

            {!identiqueFacturation && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rue</label>
                  <input type="text" value={livraisonRue} onChange={e => setLivraisonRue(e.target.value)}
                    placeholder="Adresse de livraison" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Code postal</label>
                    <input type="text" value={livraisonCP} onChange={e => setLivraisonCP(e.target.value)}
                      placeholder="97200" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ville</label>
                    <input type="text" value={livraisonVille} onChange={e => setLivraisonVille(e.target.value)}
                      placeholder="Fort-de-France" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Pays</label>
                  <select value={livraisonPays} onChange={e => setLivraisonPays(e.target.value)} style={inputStyle}>
                    <option value="MQ">Martinique</option>
                    <option value="GP">Guadeloupe</option>
                    <option value="RE">Reunion</option>
                    <option value="GF">Guyane</option>
                    <option value="FR">France metropolitaine</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '14px 0', background: '#1565C0', color: 'white', border: 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1,
          }}>
            {saving ? '...' : t('profil.sauvegarder')}
          </button>
        </form>
      </div>
    </div>
  );
}

```

---

## 📄 src/front/pages/espace-client/MesAdresses.tsx

**Lignes :** 203

```typescript
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';

interface Adresse {
  label: string;
  prenom: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  telephone: string;
  par_defaut?: boolean;
  type?: 'facturation' | 'livraison'; // V91
}

const EMPTY_ADRESSE: Adresse = { label: '', prenom: '', nom: '', adresse: '', code_postal: '', ville: '', pays: '', telephone: '', par_defaut: false };

export default function MesAdresses({ userId, profile }: { userId: string; profile: any }) {
  const { showToast } = useToast();
  const [adresses, setAdresses] = useState<Adresse[]>(profile?.adresses || []);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Adresse>(EMPTY_ADRESSE);
  const [saving, setSaving] = useState(false);

  const saveToFirestore = async (updated: Adresse[]) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), { adresses: updated, updatedAt: new Date() });
      setAdresses(updated);
      showToast('Adresses mises à jour ✅');
    } catch (err) {
      console.error(err);
      showToast('Erreur de sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.adresse || !form.ville || !form.pays) { showToast('Adresse, ville et pays requis', 'error'); return; }
    let updated: Adresse[];
    if (editIndex !== null) {
      updated = [...adresses];
      updated[editIndex] = form;
    } else {
      updated = [...adresses, form];
    }
    await saveToFirestore(updated);
    setShowForm(false);
    setEditIndex(null);
    setForm(EMPTY_ADRESSE);
  };

  const handleDelete = async (idx: number) => {
    const updated = adresses.filter((_, i) => i !== idx);
    await saveToFirestore(updated);
  };

  const handleDefault = async (idx: number) => {
    const updated = adresses.map((a, i) => ({ ...a, par_defaut: i === idx }));
    await saveToFirestore(updated);
  };

  const handleSetType = async (idx: number, newType: 'facturation' | 'livraison') => {
    const updated = adresses.map((a, i) => {
      if (i === idx) return { ...a, type: newType };
      // Rend le choix exclusif : retire le type des autres adresses
      if (a.type === newType) return { ...a, type: undefined };
      return a;
    });
    await saveToFirestore(updated);
  };

  const handleEdit = (idx: number) => {
    setForm(adresses[idx]);
    setEditIndex(idx);
    setShowForm(true);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 13, outline: 'none', background: '#fff',
  } as const;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes adresses</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Gérez vos adresses de livraison.</p>

      {/* Liste adresses */}
      {adresses.length === 0 && !showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: '#6B7280', marginBottom: 16 }}>
          Aucune adresse enregistrée.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {adresses.map((a, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: a.par_defaut ? '2px solid #1565C0' : '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#1565C0', fontSize: 13 }}>{a.label || `Adresse ${i + 1}`}</span>
                {a.par_defaut && <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1565C0', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Par défaut</span>}
                {a.type === 'facturation' && <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>🧾 Facturation</span>}
                {a.type === 'livraison' && <span style={{ fontSize: 10, background: '#FFF7ED', color: '#9A3412', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>📦 Livraison</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!a.par_defaut && (
                  <button onClick={() => handleDefault(i)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#1565C0' }}>⭐ Défaut</button>
                )}
                <button onClick={() => handleEdit(i)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#374151' }}>✏️ Éditer</button>
                <button onClick={() => handleDelete(i)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', color: '#991B1B' }}>🗑 Supprimer</button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#374151' }}>{a.prenom} {a.nom}</p>
            <p style={{ fontSize: 12, color: '#6B7280' }}>{a.adresse}, {a.code_postal} {a.ville}, {a.pays}</p>
            {a.telephone && <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>📞 {a.telephone}</p>}


            <div style={{ display: 'flex', gap: 8, marginTop: 14, borderTop: '1px dashed #E5E7EB', paddingTop: 14 }}>
              <button onClick={() => handleSetType(i, 'facturation')} style={{ flex: 1, padding: '12px 14px', fontSize: '14px', fontWeight: a.type === 'facturation' ? 700 : 500, background: a.type === 'facturation' ? '#1E40AF' : '#EFF6FF', color: a.type === 'facturation' ? '#fff' : '#1E40AF', border: '2px solid #BFDBFE', borderRadius: '10px', cursor: 'pointer' }}>🧾 Facturation</button>
              <button onClick={() => handleSetType(i, 'livraison')} style={{ flex: 1, padding: '12px 14px', fontSize: '14px', fontWeight: a.type === 'livraison' ? 700 : 500, background: a.type === 'livraison' ? '#EA580C' : '#FFF7ED', color: a.type === 'livraison' ? '#fff' : '#EA580C', border: '2px solid #FED7AA', borderRadius: '10px', cursor: 'pointer' }}>📦 Livraison</button>
              <button onClick={() => handleEdit(i)} style={{ padding: '12px 14px', border: '1px solid #E5E7EB', background: '#fff', borderRadius: '10px', cursor: 'pointer', color: '#374151' }}>✏️</button>
              <button onClick={() => handleDelete(i)} style={{ padding: '12px 14px', border: '1px solid #FEE2E2', background: '#FEF2F2', borderRadius: '10px', cursor: 'pointer', color: '#991B1B' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton ajouter */}
      {!showForm && (
        <button onClick={() => { setForm({ ...EMPTY_ADRESSE, prenom: profile?.firstName || '', nom: profile?.lastName || '' }); setEditIndex(null); setShowForm(true); }}
          style={{ padding: '10px 20px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + Ajouter une adresse
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1565C0', marginBottom: 14 }}>
            {editIndex !== null ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Label</label>
              <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Ex: Maison, Bureau..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Téléphone</label>
              <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prénom</label>
              <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom</label>
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Adresse</label>
              <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Code postal</label>
              <input value={form.code_postal} onChange={e => setForm({ ...form, code_postal: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ville</label>
              <input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Pays</label>
              <input value={form.pays} onChange={e => setForm({ ...form, pays: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 20px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => { setShowForm(false); setEditIndex(null); }} style={{
              padding: '10px 20px', background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 12,
              fontSize: 13, cursor: 'pointer',
            }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

```

---

## 📄 src/front/pages/Panier.tsx

**Lignes :** 524

```typescript
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { clientAuth, db } from '../../lib/firebase';
import { logError, logInfo, logWarn } from '../../lib/logService';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { getNextNumber } from '../../lib/counters';
import { useI18n } from '../../i18n';
import { useToast } from '../components/Toast';
import { notifyDevisCree } from '../../lib/emailService';
import { sanitizeForFirestore } from '../../lib/firebaseUtils';

interface CartItem {
  id: string;
  ref: string;
  nom_fr: string;
  prix: number;
  qte: number;
  image?: string;
  type?: 'product' | 'custom';
  description?: string;
  lien?: string;
  photoUrl?: string;
}

interface Partner {
  id: string;
  code: string;
  nom: string;
  actif: boolean;
}

// ─── Popup overlay ───
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'white', borderRadius: 20, maxWidth: 560, width: '100%',
        padding: 32, maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {children}
      </div>
    </div>
  );
}


export default function Panier() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Custom product form
  const [customNom, setCustomNom] = useState('');
  const [customQte, setCustomQte] = useState(1);
  const [customDesc, setCustomDesc] = useState('');
  const [customLien, setCustomLien] = useState('');
  const [customPhoto, setCustomPhoto] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [clientProfile, setClientProfile] = useState<any>(null);

  // V62 — chargement profil client pour adresse livraison
  useEffect(() => {
    const user = clientAuth.currentUser;
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setClientProfile(snap.data());
    }).catch(() => {});
  }, []);

  // Popup state
  const [popupStep, setPopupStep] = useState<number | null>(null); // null=closed, 0=partner, 1=acompte, 2=rib

  // Partner popup
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQte = (id: string, qte: number) => {
    if (qte < 1) return;
    saveCart(cart.map(item => item.id === id ? { ...item, qte } : item));
  };

  const removeItem = (id: string) => {
    saveCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.prix * item.qte, 0);

  // ─── Add custom product ───
  const handleAddCustom = async () => {
    if (!customNom.trim()) return;
    setPhotoUploading(true);

    // V88 — Génération référence PS-XXXX
    const refGeneree = `PS-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    let photoUrl: string | undefined;
    const slug = `${refGeneree}-${Date.now()}`;

    // Upload photo vers Firebase Storage si fournie
    if (customPhoto) {
      try {
        const ext = customPhoto.name.split('.').pop() || 'jpg';
        const path = `custom_products/${slug}.${ext}`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, customPhoto, { contentType: customPhoto.type || 'image/jpeg' });
        photoUrl = await getDownloadURL(fileRef);
        logInfo('Panier', 'Photo produit sur mesure uploadée', { path });
      } catch (err: any) {
        logError('Panier', 'Échec upload photo sur mesure', { error: err?.message });
        showToast('Erreur upload photo — le produit sera ajouté sans photo', 'warning');
      }
    }

    // V88 — Création du produit dans Firestore (brouillon, actif=false)
    let produitId: string;
    try {
      const docRef = await addDoc(collection(db, 'produits'), {
        ref: refGeneree,
        nom_fr: customNom.trim(),
        categorie: 'Divers',
        prix_achat_eur: 1,
        prix: 0,
        description: customDesc || '',
        lien_fournisseur: customLien || '',
        image: photoUrl || '',
        type: 'custom',
        actif: false,
        createdAt: serverTimestamp(),
      });
      produitId = docRef.id;
      logInfo('Panier', 'Produit sur mesure créé au catalogue', { ref: refGeneree, id: produitId });
    } catch (err: any) {
      logError('Panier', 'Échec création produit catalogue', { error: err?.message });
      showToast('Erreur création produit — ajout au panier sans fiche catalogue', 'warning');
      produitId = slug; // fallback
    }

    const newItem: CartItem = {
      id: produitId, ref: refGeneree, nom_fr: customNom.trim(), prix: 0, qte: customQte,
      type: 'custom', description: customDesc, lien: customLien, photoUrl,
    };
    saveCart([...cart, newItem]);
    setCustomNom(''); setCustomQte(1); setCustomDesc(''); setCustomLien('');
    setCustomPhoto(null);
    setPhotoUploading(false);
  };

  // ─── Open popup flow ───
  const handleOpenPopup = async () => {
    const user = clientAuth.currentUser;
    if (!user) { setLocation('/connexion'); return; }
    if (cart.length === 0) {
      showToast('Votre panier est vide', 'warning');
      return;
    }

    // Load partners
    try {
      const q = query(collection(db, 'partners'), where('actif', '==', true));
      const snap = await getDocs(q);
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Partner)));
    } catch { setPartners([]); }

    setSelectedPartner(null);
    setPopupStep(0);
  };

  // ─── Create quote ───
  const handleCreateQuote = async () => {
    const user = clientAuth.currentUser;
    if (!user) { logWarn('Panier', 'Tentative création devis sans auth'); return; }
    setSubmitting(true);
    logInfo('Panier', 'Début création devis', { items: cart.length, partner: selectedPartner });
    try {
      const numero = await getNextNumber('DV');
      logInfo('Panier', 'Numéro devis obtenu', { numero });
      const devisId = numero.replace(/[^a-zA-Z0-9]/g, '-');
      const lignes = cart.map(item => {
        const prix_partenaire = item.prix * 0.7;
        return {
          id: item.id, // V88 — ID Firestore pour lien admin catalogue
          reference: item.ref,
          ref: item.ref,
          nom: item.nom_fr,
          nom_fr: item.nom_fr,
          quantite: item.qte,
          qte: item.qte,
          prix_achat: undefined,
          prix_partenaire: prix_partenaire,
          prix_vip_negocie: undefined,
          prix_unitaire_final: item.prix,
          prix_unitaire: item.prix,
          total_ligne: item.prix * item.qte,
          total: item.prix * item.qte,
          type: item.type || 'product',
          ...(item.description ? { description: item.description } : {}),
          ...(item.lien ? { lien: item.lien } : {}),
          ...(item.photoUrl ? { photoUrl: item.photoUrl } : {}),
        };
      });

      // Charger le profil client pour inclure toutes les infos
      let userProfile: any = {};
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) userProfile = userSnap.data();
      } catch {
        console.warn('Panier: échec chargement profil client');
      }

      const devisData = {
        numero,
        client_id: user.uid,
        client_email: userProfile.email || user.email,
        client_nom: user.displayName || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        client_prenom: userProfile.firstName || userProfile.prenom || '',
        client_tel: userProfile.phone || userProfile.telephone || '',
        client_adresse: [userProfile.adresse, userProfile.codePostal, userProfile.ville, userProfile.pays].filter(Boolean).join(', '),
        client_siret: userProfile.siret || '',
        // V87 — Héritage adresse livraison : si pas de rue, clone la facturation
        adresse_livraison: userProfile.adresse_livraison?.rue
          ? userProfile.adresse_livraison
          : {
              rue: userProfile.adresse || '',
              code_postal: userProfile.codePostal || '',
              ville: userProfile.ville || '',
              pays: userProfile.pays || 'MQ',
              identique_facturation: true,
            },
        statut: 'en_negociation_partenaire',
        destination: userProfile.pays || 'Martinique',
        pays_livraison: (userProfile.adresse_livraison?.pays) || userProfile.pays || 'Martinique',
        is_vip: false,
        lignes,
        total_ht: total,
        partenaire_code: selectedPartner || 'ADMIN',
        acomptes: [],
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'quotes', devisId), sanitizeForFirestore(devisData));
      logInfo('Panier', 'Devis créé avec succès', { devisId, numero, total_ht: total });

      // Notification email
      try {
        await notifyDevisCree(devisData);
      } catch (err) {
        console.error('Erreur notification devis créé:', err);
      }

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
      setCart([]);
      setPopupStep(null);
      showToast('Devis ' + numero + ' créé avec succès !');
      setLocation('/espace-client');
    } catch (err: any) {
      console.error('Error creating quote:', err);
      logError('Panier', 'Échec création devis', { error: err?.message, code: err?.code });
      showToast('Erreur lors de la création du devis', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const closePopup = () => setPopupStep(null);

  const btnStyle = (bg: string, color: string = 'white'): React.CSSProperties => ({
    width: '100%', padding: '14px 0', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', background: bg, color,
  });

  return (
    <>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1565C0, #1565C0)', padding: '32px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800 }}>{t('cart.title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            {cart.length === 0 ? t('cart.panierVide') : `${cart.length} ${t('cart.articles')}`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 60px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#6B7280', marginBottom: 16 }}>Votre panier est vide</p>
            <Link href="/catalogue">
              <span style={{ color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>Voir le catalogue</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

            {/* ═══ LEFT — Products ═══ */}
            <div>
              {/* Cart items */}
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                    borderBottom: '1px solid #F3F4F6',
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 8, background: '#F9FAFB', overflow: 'hidden',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.image ? (
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 24, color: '#D1D5DB' }}>{item.type === 'custom' ? '📦' : '🏷️'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, overflowWrap: 'break-word' }}>
                      <p style={{ fontSize: 12, color: '#9CA3AF' }}>{item.ref}</p>
                      <p style={{ fontWeight: 600, color: '#1565C0', fontSize: 14, wordBreak: 'break-word' }}>{item.nom_fr}</p>
                      {item.type === 'custom' && (
                        <p style={{ fontSize: 11, color: '#EA580C', fontWeight: 500 }}>Produit sur mesure</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => updateQte(item.id, item.qte - 1)}
                        style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 14 }}>-</button>
                      <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{item.qte}</span>
                      <button onClick={() => updateQte(item.id, item.qte + 1)}
                        style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 14 }}>+</button>
                    </div>

                    {/* Price */}
                    <div style={{ width: 90, textAlign: 'right' }}>
                      {item.prix > 0 ? (
                        <p style={{ fontWeight: 700, color: '#1565C0', fontSize: 14 }}>
                          {(item.prix * item.qte).toLocaleString('fr-FR')} €
                        </p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#9CA3AF' }}>Sur devis</p>
                      )}
                    </div>

                    {/* Delete */}
                    <button onClick={() => removeItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#EF4444', padding: 4 }}>
                      🗑
                    </button>
                  </div>
                ))}
              </div>

            </div>

            {/* ═══ RIGHT — Recap (sticky) ═══ */}
            <div style={{ position: 'sticky', top: 20 }}>
              <div style={{
                background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1565C0', marginBottom: 16 }}>{t('cart.recap')}</h2>

                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#4B5563' }}>{item.nom_fr} x{item.qte}</span>
                    <span style={{ fontWeight: 600, color: '#1565C0' }}>
                      {item.prix > 0 ? `${(item.prix * item.qte).toLocaleString('fr-FR')} €` : 'Sur devis'}
                    </span>
                  </div>
                ))}

                <div style={{ borderTop: '2px solid #1565C0', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1565C0' }}>{t('cart.totalHT')}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#1565C0' }}>{total.toLocaleString('fr-FR')} €</span>
                </div>

                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                  {t('cart.horsLivraison')}
                </p>

                {/* V62 — Adresse de livraison */}
                {clientProfile?.adresse_livraison && (
                  <div style={{ marginTop: 16, padding: 12, background: '#F0F4F8', borderRadius: 10, fontSize: 12 }}>
                    <p style={{ fontWeight: 600, color: '#1565C0', marginBottom: 6 }}>Adresse de livraison</p>
                    {clientProfile.adresse_livraison.identique_facturation ? (
                      <p style={{ color: '#4B5563' }}>Identique à l'adresse de facturation</p>
                    ) : (
                      <p style={{ color: '#4B5563' }}>
                        {clientProfile.adresse_livraison.rue}, {clientProfile.adresse_livraison.code_postal} {clientProfile.adresse_livraison.ville}
                      </p>
                    )}
                  </div>
                )}

                <button onClick={handleOpenPopup} disabled={submitting}
                  style={{ ...btnStyle('#EA580C'), marginTop: 20, opacity: submitting ? 0.5 : 1 }}>
                  {t('cart.genererDevis')}
                </button>

                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
                  {t('cart.devisNote')}
                </p>

                {/* V97 — Bouton adresses amélioré */}
                <button onClick={() => setLocation('/espace-client/adresses')} style={{ marginTop: 12, width: '100%', padding: '16px', background: '#1E40AF', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,64,175,0.4)' }}>📍 Définir mes adresses de facturation et livraison</button>
                <p style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>Obligatoire avant le premier acompte</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* V87 — Formulaire produit sur mesure (TOUJOURS visible, meme panier vide) */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{
          border: '2px dashed #EA580C', borderRadius: 16, padding: 24, background: '#FFF7ED',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1565C0', marginBottom: 16 }}>
            Ajouter un produit non listé dans notre catalogue — on va chercher pour vous en Chine
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
            <input value={customNom} onChange={e => setCustomNom(e.target.value)}
              placeholder="Nom du produit souhaité"
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none' }} />
            <input type="number" min={1} value={customQte} onChange={e => setCustomQte(Number(e.target.value) || 1)}
              style={{ width: 70, padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, textAlign: 'center', outline: 'none' }} />
          </div>
          <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)}
            placeholder="Description détaillée (dimensions, matériaux, usage...)"
            rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, resize: 'vertical', marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
          <input value={customLien} onChange={e => setCustomLien(e.target.value)}
            placeholder="Lien site internet de votre produit pour exemple (optionnel)"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>
            Nous envoyer une ou des photos
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input type="file" accept="image/*" capture="environment"
              id="custom-photo-upload"
              onChange={e => setCustomPhoto(e.target.files?.[0] || null)}
              style={{ display: 'none' }} />
            <label htmlFor="custom-photo-upload" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
              background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              📁 Cliquez ici pour envoyer vos photos
            </label>
            {customPhoto && (
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>
                📷 {customPhoto.name}
              </span>
            )}
          </div>
          <button onClick={handleAddCustom} disabled={photoUploading}
            style={{ ...btnStyle('#EA580C'), width: 'auto', padding: '10px 24px' }}>
            📦 Ajouter au devis
          </button>
          <p style={{ fontSize: 11, color: '#92400E', marginTop: 8, lineHeight: 1.5 }}>
            ⚠️ CLIQUER sur le bouton Ajouter au devis = nous allons recevoir votre demande devis et nous allons vous répondre sous 72h sauf si vos coordonnées sont erronées, dans ce cas-là, nous n'allons pas prendre en compte.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* POPUP 1 — Partenaire                           */}
      {/* ═══════════════════════════════════════════════ */}
      {popupStep === 0 && (
        <Overlay onClose={closePopup}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 48 }}>🤝</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginTop: 8 }}>{t('popup.partenaireTitle')}</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              {t('popup.partenaireDesc')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {partners.map(p => (
              <button key={p.id} onClick={() => setSelectedPartner(p.code)}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: selectedPartner === p.code ? '2px solid #1565C0' : '2px solid #E5E7EB',
                  background: selectedPartner === p.code ? '#EFF6FF' : 'white',
                }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1565C0' }}>{p.code}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{p.nom}</div>
              </button>
            ))}
          </div>

          <button onClick={handleCreateQuote} disabled={submitting}
            style={{ ...btnStyle('#1565C0'), opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '...' : t('popup.confirmer')}
          </button>
        </Overlay>
      )}

    </>
  );
}

```

---

## 📄 src/admin/pages/ListesAchat.tsx

**Lignes :** 135

```typescript
import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { adminDb as db } from '../../lib/firebase';
import { Kpi, Card, Button, Pill, IconButton, EyeIcon, EditIcon, ExcelIcon } from '../components/Icons';

interface ListeAchat {
  id: string;
  reference: string;
  date_creation: any; // Firestore Timestamp
  statut: string;
  nb_produits: number;
  total_cny: number;
  conteneur_id?: string;
}

export default function ListesAchat() {
  const [listes, setListes] = useState<ListeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'listes_achat'), orderBy('date_creation', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ListeAchat[];
        setListes(data);
      } catch (e) {
        console.error('Error loading listes achat:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = listes.filter(
    (la) =>
      la.reference?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      {/* KPIs */}
      <div className="kgrid">
        <Kpi label="Listes actives" value={listes.filter((l) => l.statut === 'en_cours').length} />
        <Kpi label="Produits en attente" value="12" color="or" />
        <Kpi label="Total ¥" value="¥245 000" color="tl" />
        <Kpi label="Completees" value={listes.filter((l) => l.statut === 'complete').length} color="gr" />
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          className="si-bar"
          placeholder="Rechercher liste, produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="fsel" style={{ padding: '7px 9px' }}>
          <option>Tous statuts</option>
          <option>En cours</option>
          <option>Complete</option>
          <option>Archivee</option>
        </select>
        <Button variant="o">📊 Export Excel</Button>
        <Button variant="p">➕ Nouvelle liste</Button>
      </div>

      {/* Card */}
      <Card title={`Listes d'achat (${filtered.length})`}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Produits</th>
              <th>Total ¥</th>
              <th>Conteneur</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--tx3)' }}>
                  Aucune liste d'achat
                </td>
              </tr>
            ) : (
              filtered.map((la) => (
                <tr key={la.id} className="cl" onClick={() => setLocation(`/admin/achats/${la.id}`)}>
                  <td>
                    <strong>{la.reference}</strong>
                  </td>
                  <td>{la.date_creation?.toDate ? la.date_creation.toDate().toLocaleDateString('fr-FR') : (la.date_creation ? String(la.date_creation) : '—')}</td>
                  <td>{la.nb_produits}</td>
                  <td style={{ fontWeight: 700, color: 'var(--rd)' }}>
                    ¥{la.total_cny?.toLocaleString()}
                  </td>
                  <td>
                    {la.conteneur_id ? (
                      <Pill variant="nv" small>
                        {la.conteneur_id}
                      </Pill>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <Pill variant={la.statut === 'complete' ? 'tl' : 'or'}>
                      {la.statut === 'complete' ? 'Complete' : 'En cours'}
                    </Pill>
                  </td>
                  <td className="tda">
                    <IconButton icon={<EyeIcon />} tooltip="Voir" variant="eye" />
                    <IconButton icon={<EditIcon />} tooltip="Editer" variant="edit" />
                    <IconButton icon={<ExcelIcon />} tooltip="BC Chine Excel" variant="xl" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

```

---

## 📄 src/lib/version.ts

**Lignes :** 74

```typescript
// src/lib/version.ts
// Métadonnées de build injectées par Vite (cf. vite.config.ts → define).
// Le formatage en heure de Paris est fait ici, à l'affichage, pour être
// indépendant du fuseau du serveur Vercel et du visiteur (DOM-TOM, métropole, …).

declare global {
  const __APP_VERSION__: string;
  const __BUILD_ISO__: string;
  const __COMMIT_HASH__: string;
}

export const APP_VERSION: string = (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) || '0.0.0';
export const BUILD_ISO: string = (typeof __BUILD_ISO__ !== 'undefined' && __BUILD_ISO__) || new Date().toISOString();
export const COMMIT_HASH: string = ((typeof __COMMIT_HASH__ !== 'undefined' && __COMMIT_HASH__) || 'dev').slice(0, 7);

/**
 * Formate la date de build en heure de Paris (Europe/Paris).
 * Gère automatiquement CEST (été UTC+2) et CET (hiver UTC+1).
 * @param iso ISO 8601 UTC (par défaut BUILD_ISO injecté par Vite)
 * @returns ex. "25/04/2026 19:37" ou "dev" si parse échoue
 */
export function formatBuildDate(iso: string = BUILD_ISO): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'dev';

    const datePart = d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    });

    const timePart = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });

    return `${datePart} ${timePart}`;
  } catch {
    console.warn('getBuildDisplay: échec formatage date, fallback dev');
    return 'dev';
  }
}

/**
 * Chaîne complète du badge version, prête à afficher.
 * Exemple : "v0.43.2 · 25/04/2026 19:37 · fba8ec7"
 */
export function formatBuildInfo(): string {
  return `v${APP_VERSION} · ${formatBuildDate()} · ${COMMIT_HASH}`;
}

// Export pour compatibilité avec les usages existants (Footer.tsx).
export const VERSION_LABEL = formatBuildInfo();

/**
 * Badge version mis à jour en temps réel (date/heure locale).
 * Exemple : "v0.43.10 · 06/05/2026 18:45 · local"
 */
export const getBuildInfo = () => {
  const date = new Date();
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `v${APP_VERSION} · ${formattedDate} ${formattedTime}`;
};

```

---

## 📄 vite.config.ts

**Lignes :** 56

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// ── Métadonnées de build injectées dans le bundle (badge version v43-mini) ──
// On injecte des DONNÉES BRUTES (ISO 8601 UTC) — le formatage en heure de Paris
// est fait à l'affichage dans src/lib/version.ts (formatBuildDate).
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

let commitHash = 'dev'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // git non disponible (env CI sans .git, etc.) — on garde 'dev'
}

const buildIsoUtc = new Date().toISOString()  // ex: "2026-04-25T17:55:30.123Z"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ISO__: JSON.stringify(buildIsoUtc),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  // V46 Checkpoint B — Code-splitting des grosses dépendances vendor.
  // Le bundle index principal était à 2.91 MB (gzip 803 kB). On extrait
  // firebase, pdf, excel, dnd-kit dans des chunks séparés, partagés
  // entre routes et mieux cachables côté navigateur.
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/firebase/') || id.includes('@firebase/')) return 'firebase-vendor';
          if (
            id.includes('/jspdf') ||
            id.includes('/html2canvas') ||
            id.includes('/dompurify') ||
            id.includes('/purify.es')
          ) return 'pdf-vendor';
          if (id.includes('/exceljs') || id.includes('/xlsx')) return 'excel-vendor';
          if (id.includes('/@dnd-kit/')) return 'ui-vendor';
          return undefined;
        },
      },
    },
  },
})

```

---

## 📄 package.json

**Lignes :** 48

```json
{
  "name": "97import-v2",
  "private": true,
  "version": "0.43.11",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@tailwindcss/postcss": "^4.2.2",
    "date-fns": "^4.1.0",
    "deepl-node": "^1.26.0",
    "exceljs": "^4.4.0",
    "firebase": "^12.12.0",
    "firebase-admin": "^13.8.0",
    "jspdf": "^4.2.1",
    "jspdf-autotable": "^5.0.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "wouter": "^3.9.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@playwright/test": "^1.59.1",
    "@tailwindcss/forms": "^0.5.11",
    "@types/react": "^19.0.7",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.27",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "postcss": "^8.5.9",
    "tailwindcss": "^4.2.2",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.18.2",
    "vite": "^6.0.5",
    "vitest": "^4.1.5"
  }
}

```

---

## 📄 tsconfig.json

**Lignes :** 26

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}

```

---

## 📄 .firebaserc

❌ **FICHIER ABSENT** — à créer lors de la Phase 2

---


## 🔬 ANALYSE AUTOMATIQUE DES PATTERNS CRITIQUES

| Pattern | Présent dans | Fichier | Ligne | Conforme ? |
|---------|-------------|---------|-------|------------|
| `connectAuthEmulator` | firebase.ts | src/lib/firebase.ts | 42-45 | ✅ |
| `onAuthStateChanged` | firebase.ts | src/lib/firebase.ts | 28 | ✅ V155 stabilisateur |
| `isAdmin()` via `token.email` | firestore.rules | firestore.rules | 13-14 | ✅ V155 |
| `allow write: if isOwner` | firestore.rules (users) | firestore.rules | 58-59 | ✅ |
| Instance unique (getApp) | firebase.ts | src/lib/firebase.ts | 15 | ✅ |
| `canUpdateAddress()` | firestore.rules | firestore.rules | 41-47 | ✅ V155 |
| `localhost` (pas 127.0.0.1) | firebase.ts | src/lib/firebase.ts | 41 | ✅ V153 |
| `isDevisReadonly()` | firestore.rules | firestore.rules | 18-29 | ✅ Restauré |
| `isAddressFrozen()` | firestore.rules | firestore.rules | 31-38 | ✅ Restauré |
| `isAcompteEncaisseProtected()` | firestore.rules | firestore.rules | 40-42 | ✅ Restauré |

## 🔧 FICHIERS ABSENTS (4)

| Fichier | Explication |
|---------|------------|
| `src/context/AuthContext.tsx` | ❌ Absent — pas de contexte Auth centralisé. Auth géré dans AdminApp.tsx (ligne 263) et EspaceClient.tsx (ligne 35) |
| `src/hooks/useAuth.ts` | ❌ Absent — pas de hook useAuth. Auth via onAuthStateChanged direct |
| `src/admin/AdminLayout.tsx` | ❌ Absent — le layout admin est intégré dans AdminApp.tsx (composant unique) |
| `.firebaserc` | ❌ Absent — projet configuré via firebase.json et .env |

## 🔬 INCOHÉRENCES DÉTECTÉES

### ✅ Cohérences confirmées
1. **firebase.ts + firestore.rules** : Les deux utilisent l'email comme clé (`token.email` dans rules, `users/{email}` dans Firestore)
2. **AdminApp.tsx V155** : La vérification admin lit Firestore (`users/{email}.role`) et non plus les custom claims
3. **firebase.ts V155** : Instance unique avec aliases pour compatibilité (clientAuth, adminAuth, adminDb, adminStorage)
4. **firestore.rules V155** : `canUpdateAddress()` autorise l'écriture si adresse vide + `isAddressFrozen()` protège après snapshot

### ⚠️ Points d'attention
1. **AuthContext absent** : Pas de contexte React pour l'auth. Chaque composant gère son propre `onAuthStateChanged`. Pas de bug mais architecture décentralisée.
2. **4 fichiers manquants** : Non critiques — leurs fonctions sont intégrées dans d'autres composants

