# 04 — Cartographie admin (back-office)

**Date** : 2026-04-04
**Source** : `src/pages/admin/`, `src/components/admin/`

---

## Resume

19 fichiers dans `src/pages/admin/` + 1 design system dans `src/components/admin/AdminUI.tsx`.
Le back-office utilise un layout sidebar (`AdminLayout.tsx`) avec 3 sections.
Toutes les pages admin communiquent avec Firestore (pas Supabase).

---

## Constats

### Pages admin presentes (19)

| Fichier | Route | Dans sidebar | Backend | Etat |
|---------|-------|-------------|---------|------|
| `AdminLoginPage.tsx` | `/admin/login` | Non (login) | Firebase Auth | OK |
| `AdminDashboard.tsx` | `/admin` | Oui | Firestore | A verifier |
| `AdminQuotes.tsx` | `/admin/devis` | Oui | Firestore | A verifier |
| `AdminUsers.tsx` | `/admin/users` | Oui | Firestore | A verifier |
| `AdminPartenaires.tsx` | `/admin/partenaires` | Oui | Firestore | A verifier |
| `AdminProducts.tsx` | `/admin/products` | Oui | Firestore | A verifier |
| `AdminSuiviAchats.tsx` | `/admin/suivi-achats` | Oui | Firestore | A verifier |
| `AdminMedia.tsx` | `/admin/media` | Oui | Firestore/Storage | A verifier |
| `AdminParametres.tsx` | `/admin/parametres` | Oui | Firestore | A verifier |
| `AdminContenu.tsx` | `/admin/contenu` | Oui | Firestore | A verifier |
| `AdminAnalytics.tsx` | `/admin/analytics` | **Non** | Firestore | Orphelin |
| `AdminInvoices.tsx` | `/admin/invoices` | **Non** | Firestore | Orphelin |
| `AdminPricing.tsx` | `/admin/pricing` | **Non** | Firestore | Orphelin |
| `AdminShipping.tsx` | `/admin/shipping` | **Non** | Firestore | Orphelin |
| `AdminHeaderFooter.tsx` | `/admin/header-footer` | **Non** | Firestore | Orphelin |
| `AdminLeads.tsx` | `/admin/leads` | **Non** | Firestore | Orphelin |
| `AdminPages.tsx` | `/admin/pages` | **Non** | Firestore | Orphelin |
| `AdminSettings.tsx` | `/admin/settings` | **Non** | Firestore | Orphelin |
| `AdminLayout.tsx` | (wrapper) | - | - | OK |

### Pages admin manquantes vs MAJALL

| Page MAJALL | Fichier attendu | Statut |
|-------------|-----------------|--------|
| AdminQuoteDetail | `AdminQuoteDetail.tsx` | **ABSENT** — MAJALL v6.2 exige cette page |
| AdminLogs | `AdminLogs.tsx` | **ABSENT** — MAJALL v6.3 cree cette page |

### Design system admin : `AdminUI.tsx`

Composants exposes :
- `ADMIN_COLORS` — palette (navy, green, orange, purple, gray)
- `BadgeStatut` — badges colores par statut (12 statuts)
- `AdminButton` — boutons avec 6 variantes (primary, success, warning, danger, purple, ghost)
- `AdminCard` / `AdminCardHeader` — cartes avec header
- `DocumentRow` — ligne document (PDF + envoi)
- `PaiementRow` — ligne paiement (en_attente / encaisse)
- `PaiementResume` — resume paiements (total encaisse / solde)
- `AdminInput` / `AdminSelect` — champs de formulaire
- `SectionLabel` — labels de section

**Risque : Faible** — Design system complet et coherent.

### Composants admin manquants vs MAJALL v6.0

MAJALL v6.0 mentionne :
- `lib/adminQuery.ts` — utilitaire generique requetes — **ABSENT**
- `components/admin/AdminTable.tsx` — tableau skeleton + pagination — **ABSENT**
- `components/admin/AdminBadge.tsx` — badges statuts — remplace par `BadgeStatut` dans AdminUI
- `components/admin/AdminPageLayout.tsx` — layout standardise — remplace par `AdminLayout.tsx`

### Sidebar `AdminLayout.tsx`

3 sections, 9 liens :
- **COMMERCE** : Tableau de bord, Devis & Facturation, Clients, Partenaires
- **CATALOGUE** : Produits, Suivi Achats, Medias
- **CONFIGURATION** : Parametres, Contenu Site

7 pages admin routes dans `App.tsx` ne sont pas dans la sidebar — inaccessibles via navigation UI.

---

## Fichiers concernes

| Fichier | Lignes | Risque |
|---------|--------|--------|
| `src/pages/admin/AdminLayout.tsx` | 182 | Faible |
| `src/components/admin/AdminUI.tsx` | 480 | Faible |
| 17 pages admin | ~150-400 chacune | Moyen (contenu non audite en detail) |

---

## Niveau de risque : MOYEN

---

## Recommandation

1. **P2** — Creer `AdminQuoteDetail.tsx` (detail devis — requis MAJALL v6.2)
2. **P2** — Creer `AdminLogs.tsx` (journal erreurs — requis MAJALL v6.3)
3. **P2** — Ajouter les 7 pages orphelines a la sidebar (analytics, invoices, pricing, shipping, header-footer, leads, pages, settings) — grouper par section logique
4. **P2** — Creer `lib/adminQuery.ts` si les pages admin ne gerent pas individuellement leurs erreurs/loading
5. **P3** — Verifier le contenu fonctionnel de chaque page admin (mock vs reel)
