import { Switch, Route, useLocation } from 'wouter'
import { lazy, Suspense } from 'react'
import { AdminGuard } from './components/AdminGuard'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'

// ── Pages publiques (lazy-loaded) ──────────────────────
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const MonComptePage = lazy(() => import('./pages/MonComptePage'))
const CataloguePage = lazy(() => import('./pages/CataloguePage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const MiniPellesPage = lazy(() => import('./pages/MiniPellesPage'))
const ModularHomesPage = lazy(() => import('./pages/ModularHomesPage'))
const ModularStandardPage = lazy(() => import('./pages/ModularStandardPage'))
const ModularPremiumPage = lazy(() => import('./pages/ModularPremiumPage'))
const CampingCarPage = lazy(() => import('./pages/CampingCarPage'))
const SolarPage = lazy(() => import('./pages/SolarPage'))
const SolarKitDetailPage = lazy(() => import('./pages/SolarKitDetailPage'))
const AccessoiresPage = lazy(() => import('./pages/AccessoiresPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const DeliveryPage = lazy(() => import('./pages/DeliveryPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AgriculturePage = lazy(() => import('./pages/AgriculturePage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const SolarPanelsPage = lazy(() => import('./pages/SolarPanelsPage'))

// ── Pages admin (lazy-loaded) ──────────────────────────
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminQuotes = lazy(() => import('./pages/admin/AdminQuotes'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminPartenaires = lazy(() => import('./pages/admin/AdminPartenaires'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminSuiviAchats = lazy(() => import('./pages/admin/AdminSuiviAchats'))
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'))
const AdminParametres = lazy(() => import('./pages/admin/AdminParametres'))
const AdminContenu = lazy(() => import('./pages/admin/AdminContenu'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices'))
const AdminPricing = lazy(() => import('./pages/admin/AdminPricing'))
const AdminShipping = lazy(() => import('./pages/admin/AdminShipping'))
const AdminHeaderFooter = lazy(() => import('./pages/admin/AdminHeaderFooter'))
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'))
const AdminPages = lazy(() => import('./pages/admin/AdminPages'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

// ── Spinner de chargement ──────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '60vh', color: '#1B2A4A',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '4px solid #E5E7EB',
          borderTopColor: '#1B2A4A', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <p style={{ fontSize: 14, color: '#6B7280' }}>Chargement...</p>
      </div>
    </div>
  )
}

// ── Layout wrapper (Header + Footer pour pages publiques) ──
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  const [location] = useLocation()
  const isAdmin = location.startsWith('/admin')

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        {isAdmin ? (
          /* ── Back-office admin (pas de Header/Footer) ── */
          <Switch>
            <Route path="/admin/login" component={AdminLoginPage} />
            <Route path="/admin">
              <AdminGuard><AdminDashboard /></AdminGuard>
            </Route>
            <Route path="/admin/devis">
              <AdminGuard><AdminQuotes /></AdminGuard>
            </Route>
            <Route path="/admin/users">
              <AdminGuard><AdminUsers /></AdminGuard>
            </Route>
            <Route path="/admin/partenaires">
              <AdminGuard><AdminPartenaires /></AdminGuard>
            </Route>
            <Route path="/admin/products">
              <AdminGuard><AdminProducts /></AdminGuard>
            </Route>
            <Route path="/admin/suivi-achats">
              <AdminGuard><AdminSuiviAchats /></AdminGuard>
            </Route>
            <Route path="/admin/media">
              <AdminGuard><AdminMedia /></AdminGuard>
            </Route>
            <Route path="/admin/parametres">
              <AdminGuard><AdminParametres /></AdminGuard>
            </Route>
            <Route path="/admin/contenu">
              <AdminGuard><AdminContenu /></AdminGuard>
            </Route>
            <Route path="/admin/analytics">
              <AdminGuard><AdminAnalytics /></AdminGuard>
            </Route>
            <Route path="/admin/invoices">
              <AdminGuard><AdminInvoices /></AdminGuard>
            </Route>
            <Route path="/admin/pricing">
              <AdminGuard><AdminPricing /></AdminGuard>
            </Route>
            <Route path="/admin/shipping">
              <AdminGuard><AdminShipping /></AdminGuard>
            </Route>
            <Route path="/admin/header-footer">
              <AdminGuard><AdminHeaderFooter /></AdminGuard>
            </Route>
            <Route path="/admin/leads">
              <AdminGuard><AdminLeads /></AdminGuard>
            </Route>
            <Route path="/admin/pages">
              <AdminGuard><AdminPages /></AdminGuard>
            </Route>
            <Route path="/admin/settings">
              <AdminGuard><AdminSettings /></AdminGuard>
            </Route>
          </Switch>
        ) : (
          /* ── Site public (avec Header + Footer) ── */
          <PublicLayout>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/mon-compte" component={MonComptePage} />
              <Route path="/catalogue" component={CataloguePage} />
              <Route path="/produit/:id" component={ProductPage} />

              {/* Catégories dédiées */}
              <Route path="/mini-pelles" component={MiniPellesPage} />
              <Route path="/maisons" component={ModularHomesPage} />
              <Route path="/maisons/standard" component={ModularStandardPage} />
              <Route path="/maisons/premium" component={ModularPremiumPage} />
              <Route path="/maisons/camping-car" component={CampingCarPage} />
              <Route path="/solaire" component={SolarPage} />
              <Route path="/solaire/:slug" component={SolarKitDetailPage} />
              <Route path="/accessoires" component={AccessoiresPage} />

              {/* Panier & parcours client */}
              <Route path="/panier" component={CartPage} />
              <Route path="/confirmation" component={ConfirmationPage} />

              {/* Informations */}
              <Route path="/contact" component={ContactPage} />
              <Route path="/livraison" component={DeliveryPage} />
              <Route path="/a-propos" component={AboutPage} />
              <Route path="/services" component={ServicesPage} />

              {/* Légal */}
              <Route path="/mentions-legales" component={LegalPage} />
              <Route path="/confidentialite" component={PrivacyPage} />
              <Route path="/cgv" component={TermsPage} />

              {/* Auth */}
              <Route path="/mot-de-passe-oublie" component={ForgotPasswordPage} />
              <Route path="/reset-password" component={ResetPasswordPage} />

              {/* Nouvelles pages */}
              <Route path="/agriculture" component={AgriculturePage} />
              <Route path="/auth/callback" component={AuthCallbackPage} />
              <Route path="/panneaux-solaires" component={SolarPanelsPage} />

              {/* Routes alternatives référence prod */}
              <Route path="/about" component={AboutPage} />
              <Route path="/conditions-vente" component={TermsPage} />
              <Route path="/reinitialiser-mdp" component={ResetPasswordPage} />
              <Route path="/mot-de-passe-oublie" component={ForgotPasswordPage} />

              {/* Compatibilité anciennes URLs */}
              <Route path="/legal" component={LegalPage} />
              <Route path="/privacy" component={PrivacyPage} />
              <Route path="/terms" component={TermsPage} />
              <Route path="/cart" component={CartPage} />
              <Route path="/delivery" component={DeliveryPage} />
              <Route path="/connexion" component={LoginPage} />

              {/* 404 */}
              <Route component={NotFoundPage} />
            </Switch>
          </PublicLayout>
        )}
      </Suspense>
    </ErrorBoundary>
  )
}
