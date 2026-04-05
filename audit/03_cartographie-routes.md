# 03 — Cartographie des routes

**Date** : 2026-04-04
**Source** : `src/App.tsx`
**Routeur** : wouter (SPA)

---

## Resume

43 routes definies dans `App.tsx` — 27 routes publiques (dont 7 alias/compat) + 18 routes admin.
Toutes les pages sont lazy-loaded via `React.lazy()` + `Suspense`.

---

## Routes publiques (27)

| Route | Composant | Categorie |
|-------|-----------|-----------|
| `/` | `HomePage` | Accueil |
| `/login` | `LoginPage` | Auth |
| `/connexion` | `LoginPage` | Auth (alias) |
| `/mon-compte` | `MonComptePage` | Espace client |
| `/catalogue` | `CataloguePage` | Catalogue |
| `/produit/:id` | `ProductPage` | Detail produit |
| `/mini-pelles` | `MiniPellesPage` | Categorie |
| `/maisons` | `ModularHomesPage` | Categorie |
| `/maisons/standard` | `ModularStandardPage` | Sous-categorie |
| `/maisons/premium` | `ModularPremiumPage` | Sous-categorie |
| `/maisons/camping-car` | `CampingCarPage` | Sous-categorie |
| `/solaire` | `SolarPage` | Categorie |
| `/solaire/:slug` | `SolarKitDetailPage` | Detail kit |
| `/accessoires` | `AccessoiresPage` | Categorie |
| `/panier` | `CartPage` | Panier |
| `/cart` | `CartPage` | Panier (alias EN) |
| `/confirmation` | `ConfirmationPage` | Post-commande |
| `/contact` | `ContactPage` | Info |
| `/livraison` | `DeliveryPage` | Info |
| `/delivery` | `DeliveryPage` | Info (alias EN) |
| `/a-propos` | `AboutPage` | Info |
| `/about` | `AboutPage` | Info (alias EN) |
| `/services` | `ServicesPage` | Info |
| `/mentions-legales` | `LegalPage` | Legal |
| `/legal` | `LegalPage` | Legal (alias EN) |
| `/confidentialite` | `PrivacyPage` | Legal |
| `/privacy` | `PrivacyPage` | Legal (alias EN) |
| `/cgv` | `TermsPage` | Legal |
| `/terms` | `TermsPage` | Legal (alias EN) |
| `/conditions-vente` | `TermsPage` | Legal (alias FR alt) |
| `/mot-de-passe-oublie` | `ForgotPasswordPage` | Auth |
| `/reset-password` | `ResetPasswordPage` | Auth |
| `/reinitialiser-mdp` | `ResetPasswordPage` | Auth (alias FR) |
| `/agriculture` | `AgriculturePage` | Categorie (nouveau) |
| `/auth/callback` | `AuthCallbackPage` | Auth OAuth |
| `/panneaux-solaires` | `SolarPanelsPage` | Categorie (alias) |
| `*` (404) | `NotFoundPage` | Erreur |

**Note** : `/mot-de-passe-oublie` est declare 2 fois (lignes 192 et 203) — doublon sans impact fonctionnel (premiere declaration gagne).

---

## Routes admin (18)

| Route | Composant | Section sidebar |
|-------|-----------|-----------------|
| `/admin/login` | `AdminLoginPage` | (pas de guard) |
| `/admin` | `AdminDashboard` | Commerce |
| `/admin/devis` | `AdminQuotes` | Commerce |
| `/admin/users` | `AdminUsers` | Commerce |
| `/admin/partenaires` | `AdminPartenaires` | Commerce |
| `/admin/products` | `AdminProducts` | Catalogue |
| `/admin/suivi-achats` | `AdminSuiviAchats` | Catalogue |
| `/admin/media` | `AdminMedia` | Catalogue |
| `/admin/parametres` | `AdminParametres` | Configuration |
| `/admin/contenu` | `AdminContenu` | Configuration |
| `/admin/analytics` | `AdminAnalytics` | (non dans sidebar) |
| `/admin/invoices` | `AdminInvoices` | (non dans sidebar) |
| `/admin/pricing` | `AdminPricing` | (non dans sidebar) |
| `/admin/shipping` | `AdminShipping` | (non dans sidebar) |
| `/admin/header-footer` | `AdminHeaderFooter` | (non dans sidebar) |
| `/admin/leads` | `AdminLeads` | (non dans sidebar) |
| `/admin/pages` | `AdminPages` | (non dans sidebar) |
| `/admin/settings` | `AdminSettings` | (non dans sidebar) |

---

## Constats

### Routes vs MAJALL

MAJALL v6.4 mentionne `/admin/devis/:id` (AdminQuoteDetail) — **absent du code actuel**.
MAJALL mentionne `AdminLogs` (v6.3) — **absent du code actuel**.

### Routes admin non accessibles depuis sidebar

7 pages admin sont dans `App.tsx` mais absentes de `AdminLayout.tsx` sidebar :
`analytics`, `invoices`, `pricing`, `shipping`, `header-footer`, `leads`, `pages`, `settings`

### Protection admin

Toutes les routes admin (sauf `/admin/login`) sont protegees par `<AdminGuard>`.
`AdminGuard` verifie `adminUser` et `adminProfile.role === 'admin'` via `useAdminAuth()`.

### Navigation Header

Header public contient : mini-pelles, maisons, solaire, accessoires, catalogue, contact
Pas de lien vers : agriculture, livraison, services, a-propos

---

## Fichiers concernes

| Fichier | Lignes | Role |
|---------|--------|------|
| `src/App.tsx` | 1-221 | Definition de toutes les routes |
| `src/components/Header.tsx` | 7-14 | NAV_LINKS (6 liens) |
| `src/pages/admin/AdminLayout.tsx` | 6-31 | NAV_SECTIONS sidebar (9 liens) |
| `src/components/AdminGuard.tsx` | - | Protection routes admin |

---

## Niveau de risque : MOYEN

---

## Recommandation

1. **P2** — Ajouter `AdminQuoteDetail` (route `/admin/devis/:id`) — requis par MAJALL v6.2+
2. **P2** — Integrer les 7 pages admin orphelines dans la sidebar `AdminLayout.tsx`
3. **P3** — Supprimer le doublon `/mot-de-passe-oublie`
4. **P3** — Ajouter les liens manquants dans le Header (agriculture, livraison)
