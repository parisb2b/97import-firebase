import { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { adminAuth, db } from '../lib/firebase';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AdminLogin from './AdminLogin';
import './styles/admin.css';
import './styles/polish-v45.css';

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
      { path: '/admin/clients', label: 'Clients', icon: '👥', badge: 3 },
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
    return () => unsubSav();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult();
          setIsAdmin(tokenResult.claims.role === 'admin');
        } catch (err) {
          console.error('[AdminApp] Failed to get token claims:', err);
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
      {/* Sidebar */}
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
        {SIDEBAR_SECTIONS.map((section, sectionIdx) => (
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
