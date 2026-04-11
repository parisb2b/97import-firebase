import { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { onAuthStateChanged, User } from 'firebase/auth';
import { adminAuth } from '../lib/firebase';
import { useI18n } from '../i18n';
import { GlobeToggle } from '../components/GlobeToggle';
import AdminLogin from './AdminLogin';

// Pages
import Dashboard from './pages/Dashboard';
import ListeDevis from './pages/ListeDevis';
import DetailDevis from './pages/DetailDevis';
import Factures from './pages/Factures';
import NotesCommission from './pages/NotesCommission';
import FraisLogistique from './pages/FraisLogistique';
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
import Logs from './pages/Logs';
import Parametres from './pages/Parametres';

const ADMIN_PAGES = [
  { path: '/admin', label: 'nav.dashboard', icon: '📊' },
  { path: '/admin/devis', label: 'nav.devis', icon: '📋' },
  { path: '/admin/factures', label: 'nav.factures', icon: '🧾' },
  { path: '/admin/commissions', label: 'nav.commissions', icon: '💰' },
  { path: '/admin/frais', label: 'nav.frais', icon: '🚢' },
  { path: '/admin/conteneurs', label: 'nav.conteneurs', icon: '📦' },
  { path: '/admin/sav', label: 'nav.sav', icon: '🔧' },
  { path: '/admin/stock', label: 'nav.stock', icon: '🗄️' },
  { path: '/admin/produits', label: 'nav.produits', icon: '🛒' },
  { path: '/admin/clients', label: 'nav.clients', icon: '👥' },
  { path: '/admin/partenaires', label: 'nav.partenaires', icon: '🤝' },
  { path: '/admin/taux', label: 'nav.taux', icon: '💱' },
  { path: '/admin/logs', label: 'nav.logs', icon: '📝' },
  { path: '/admin/parametres', label: 'nav.parametres', icon: '⚙️' },
];

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const [location] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white flex flex-col">
        <div className="p-4 border-b border-white/20">
          <h1 className="text-xl font-bold">97import</h1>
          <p className="text-sm opacity-70">Administration</p>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {ADMIN_PAGES.map((page) => (
            <Link key={page.path} href={page.path}>
              <a
                className={`flex items-center gap-2 px-3 py-2 rounded mb-1 ${
                  location === page.path
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
              >
                <span>{page.icon}</span>
                <span>{t(page.label)}</span>
              </a>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/20">
          <p className="text-sm opacity-70 truncate">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white">
          <h2 className="font-semibold">
            {ADMIN_PAGES.find((p) => p.path === location)?.label
              ? t(ADMIN_PAGES.find((p) => p.path === location)!.label)
              : 'Admin'}
          </h2>
          <div className="flex items-center gap-4">
            <GlobeToggle />
            <button
              onClick={() => adminAuth.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('btn.deconnexion')}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <Switch>
            <Route path="/admin" component={Dashboard} />
            <Route path="/admin/devis" component={ListeDevis} />
            <Route path="/admin/devis/nouveau" component={DetailDevis} />
            <Route path="/admin/devis/:id" component={DetailDevis} />
            <Route path="/admin/factures" component={Factures} />
            <Route path="/admin/commissions" component={NotesCommission} />
            <Route path="/admin/frais" component={FraisLogistique} />
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
            <Route path="/admin/logs" component={Logs} />
            <Route path="/admin/parametres" component={Parametres} />
            <Route>
              <Dashboard />
            </Route>
          </Switch>
        </div>
      </main>
    </div>
  );
}
