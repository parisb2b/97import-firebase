import { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { adminAuth, db } from '../lib/firebase';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AdminLogin from './AdminLogin';
import './styles/admin.css';

// Pages
import Dashboard from './pages/Dashboard';
import ListeDevis from './pages/ListeDevis';
import DetailDevis from './pages/DetailDevis';
import Factures from './pages/Factures';
import NotesCommission from './pages/NotesCommission';
import FraisLogistique from './pages/FraisLogistique';
import ListesAchat from './pages/ListesAchat';
import ListeConteneurs from './pages/ListeConteneurs';
import NouveauConteneur from './pages/NouveauConteneur';
import DetailConteneur from './pages/DetailConteneur';
import Stock from './pages/Stock';
import SAVListe from './pages/SAVListe';
import SAVDetail from './pages/SAVDetail';
import CatalogueProduits from './pages/CatalogueProduits';
import NouveauProduit from './pages/NouveauProduit';
import EditProduit from './pages/EditProduit';
import Clients from './pages/Clients';
import Partenaires from './pages/Partenaires';
import TauxRMB from './pages/TauxRMB';
import GestionSite from './pages/GestionSite';
import Logs from './pages/Logs';
import Parametres from './pages/Parametres';

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
      { path: '/admin/factures', label: 'Factures', icon: '🧾' },
      { path: '/admin/commissions', label: 'Notes de commission', icon: '💰' },
      { path: '/admin/frais', label: 'Factures logistiques', icon: '🛳' },
    ],
  },
  {
    separator: true,
    items: [
      { path: '/admin/achats', label: "Listes d'achat", icon: '🛒' },
      { path: '/admin/conteneurs', label: 'Conteneurs', icon: '📦' },
      { path: '/admin/stock', label: 'Stock', icon: '📦' },
      { path: '/admin/sav', label: 'SAV', icon: '🔧', badge: 2 },
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
      { path: '/admin/logs', label: 'Logs', icon: '🚨', badge: 4 },
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
  '/admin/achats': "Listes d'achat",
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, (u) => {
      setUser(u);
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
                    {item.badge && <span className="sb-bdg">{item.badge}</span>}
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
              <Route path="/admin/factures" component={Factures} />
              <Route path="/admin/commissions" component={NotesCommission} />
              <Route path="/admin/frais" component={FraisLogistique} />
              <Route path="/admin/achats" component={ListesAchat} />
              <Route path="/admin/conteneurs" component={ListeConteneurs} />
              <Route path="/admin/conteneurs/nouveau" component={NouveauConteneur} />
              <Route path="/admin/conteneurs/:id" component={DetailConteneur} />
              <Route path="/admin/sav" component={SAVListe} />
              <Route path="/admin/sav/:id" component={SAVDetail} />
              <Route path="/admin/stock" component={Stock} />
              <Route path="/admin/produits" component={CatalogueProduits} />
              <Route path="/admin/produits/nouveau" component={NouveauProduit} />
              <Route path="/admin/produits/:id" component={EditProduit} />
              <Route path="/admin/clients" component={Clients} />
              <Route path="/admin/partenaires" component={Partenaires} />
              <Route path="/admin/taux" component={TauxRMB} />
              <Route path="/admin/site" component={GestionSite} />
              <Route path="/admin/logs" component={Logs} />
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
