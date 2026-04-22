import { Route, Switch } from 'wouter';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Produit from './pages/Produit';
import Recherche from './pages/Recherche';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Panier from './pages/Panier';
import MonCompte from './pages/MonCompte';
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
          <Route path="/catalogue/:categorie/:gamme/accessoires" component={Catalogue} />
          <Route path="/catalogue/:categorie/:gamme" component={Catalogue} />
          <Route path="/catalogue/:categorie" component={Catalogue} />
          <Route path="/produit/:id" component={Produit} />
          <Route path="/recherche" component={Recherche} />
          <Route path="/connexion" component={Connexion} />
          <Route path="/inscription" component={Inscription} />
          <Route path="/panier" component={Panier} />
          <Route path="/mon-compte" component={MonCompte} />
          <Route path="/services" component={Services} />
          <Route path="/contact" component={Contact} />
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
