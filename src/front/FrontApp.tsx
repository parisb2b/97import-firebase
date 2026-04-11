import { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { onAuthStateChanged, User } from 'firebase/auth';
import { clientAuth } from '../lib/firebase';
import { useI18n } from '../i18n';
import { GlobeToggle } from '../components/GlobeToggle';

// Pages
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Produit from './pages/Produit';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Panier from './pages/Panier';
import MonCompte from './pages/MonCompte';

export default function FrontApp() {
  const [user, setUser] = useState<User | null>(null);
  const { t } = useI18n();
  const [location] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-navy">97import</a>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/catalogue">
              <a
                className={`hover:text-navy ${
                  location.startsWith('/catalogue') ? 'text-navy font-medium' : ''
                }`}
              >
                {t('nav.catalogue')}
              </a>
            </Link>
            {user && (
              <Link href="/mon-compte">
                <a
                  className={`hover:text-navy ${
                    location.startsWith('/mon-compte') ? 'text-navy font-medium' : ''
                  }`}
                >
                  Mon compte
                </a>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <GlobeToggle />

            <Link href="/panier">
              <a className="relative">
                <span className="text-xl">🛒</span>
              </a>
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden md:block">
                  {user.email}
                </span>
                <button
                  onClick={() => clientAuth.signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('btn.deconnexion')}
                </button>
              </div>
            ) : (
              <Link href="/connexion">
                <a className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90">
                  {t('btn.connexion')}
                </a>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/catalogue" component={Catalogue} />
          <Route path="/catalogue/:categorie" component={Catalogue} />
          <Route path="/produit/:id" component={Produit} />
          <Route path="/connexion" component={Connexion} />
          <Route path="/inscription" component={Inscription} />
          <Route path="/panier" component={Panier} />
          <Route path="/mon-compte/:tab?" component={MonCompte} />
          <Route>
            <Home />
          </Route>
        </Switch>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">LUXENT LIMITED</h3>
              <p className="text-sm text-white/70">
                2ND FLOOR COLLEGE HOUSE
                <br />
                17 KING EDWARDS ROAD
                <br />
                RUISLIP HA4 7AE — LONDON
                <br />
                UNITED KINGDOM
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <p className="text-sm text-white/70">
                <a href="mailto:luxent@ltd-uk.eu">luxent@ltd-uk.eu</a>
                <br />
                France: +33 620 607 448
                <br />
                Chine: +86 135 6627 1902
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">97import.com</h3>
              <p className="text-sm text-white/70">
                Import direct Chine vers DOM-TOM
                <br />
                Martinique, Guadeloupe, Réunion, Guyane
              </p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-4 text-center text-sm text-white/50">
            © {new Date().getFullYear()} 97import.com — Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  );
}
