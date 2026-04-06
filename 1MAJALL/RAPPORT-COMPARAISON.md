# RAPPORT DE COMPARAISON — ANCIEN vs NOUVEAU BACK-OFFICE
Date : 2026-04-06

## 1. BACK-OFFICE ANCIEN (Supabase)

### Pages admin documentées (specs)
- **AdminLogin** — /admin — connexion email/password
- **AdminDashboard** — /admin/dashboard — KPIs temps réel
- **AdminQuotes** — /admin/devis — liste devis + fiche détaillée + GDF (Gestion Documents & Facturation)
- **AdminQuoteDetail** — /admin/devis/:id — détail devis UUID
- **AdminUsers** — /admin/clients — liste clients + changement rôle
- **AdminPartenaires** — /admin/partenaires — gestion partenaires TD/JM/MC
- **AdminProducts** — /admin/produits — CRUD produits
- **AdminSuiviAchats** — /admin/suivi-achats — suivi achats + export Excel
- **AdminMedia** — /admin/medias — médiathèque
- **AdminAnalytics** — /admin/analytics — graphiques KPI
- **AdminLogs** — /admin/logs — journal erreurs
- **AdminParametres** — /admin/parametres — émetteur LUXENT + RIB + multiplicateurs
- **AdminContenu** — /admin/contenu — CMS pages

### Flux devis complet
1. Client ajoute au panier (localStorage `rippa_cart`)
2. Formulaire devis → popup partenaire → popup acompte
3. Numéro D26XXXXX généré
4. PDF devis créé (jsPDF + autotable)
5. Admin voit statut 'nouveau' dans /admin/devis
6. Admin passe en VIP → saisit prix_negocie → statut 'vip'
7. Client voit prix négocié dans /mon-compte
8. Client déclare acompte (pop-up 3 étapes)
9. Admin clique "Encaisser" → facture FA générée
10. Quand solde = 0 → facture SOLDÉE + notices techniques

### Gestion VIP
- Role 'vip' dans profiles
- prix_negocie par produit (JSONB)
- Affichage : prix barré + prix violet négocié + % remise

### Gestion partenaires
- Table partners : TD, JM, MC
- Prix partenaire = prix_achat × 1.2
- Commission = prix_negocie - prix_partenaire

### Facturation
- Factures FA26XXXXX, BL26XXXXX, NC26XXXXX
- 2 RIB : perso (N26) et pro (LUXENT LIMITED UK)

## 2. BACK-OFFICE ACTUEL (Firebase)

### Pages admin existantes
| Page | Lignes | État |
|------|--------|------|
| AdminLoginPage.tsx | 172 | ✅ Fonctionnel |
| AdminLayout.tsx | 181 | ✅ Fonctionnel |
| AdminProducts.tsx | 364 | ✅ Fonctionnel |
| AdminAnalytics.tsx | 123 | ✅ Fonctionnel |
| AdminInvoices.tsx | 141 | ✅ Fonctionnel |
| AdminSettings.tsx | 181 | ✅ Fonctionnel |
| AdminShipping.tsx | 184 | ✅ Fonctionnel |
| AdminPricing.tsx | 126 | ✅ Fonctionnel |
| AdminLeads.tsx | 169 | ✅ Fonctionnel |
| AdminPages.tsx | 156 | ✅ Fonctionnel |
| AdminHeaderFooter.tsx | 120 | ✅ Fonctionnel |
| AdminDashboard.tsx | 20 | ❌ Stub "Phase 4" |
| AdminQuotes.tsx | 20 | ❌ Stub "Phase 4" |
| AdminUsers.tsx | 20 | ❌ Stub "Phase 4" |
| AdminPartenaires.tsx | 20 | ❌ Stub "Phase 4" |
| AdminParametres.tsx | 20 | ❌ Stub "Phase 4" |
| AdminContenu.tsx | 20 | ❌ Stub "Phase 4" |
| AdminSuiviAchats.tsx | 20 | ❌ Stub "Phase 4" |
| AdminMedia.tsx | 20 | ❌ Stub "Phase 4" |

### Ce qui fonctionne
- Auth séparée client/admin (2 instances Firebase)
- Login admin avec vérification rôle
- CRUD produits complet
- Analytics basiques
- Factures liste
- Settings site, shipping, pricing
- Leads, pages CMS

### Ce qui manque
- Dashboard avec stats temps réel
- Gestion devis complète (liste + fiche détaillée + flux VIP)
- Gestion utilisateurs (liste + changement rôle)
- Gestion partenaires (CRUD + commissions)
- Paramètres (émetteur, RIB, config acomptes)
- Contenu site (CMS sections)
- Suivi achats (export Excel)
- Médiathèque

## 3. PLAN D'ACTION

### Fichiers à implémenter (stubs → pages complètes)
1. **AdminDashboard.tsx** — KPIs temps réel (devis, CA, clients, produits)
2. **AdminQuotes.tsx** — Liste devis + filtres + fiche détaillée + flux VIP/acompte
3. **AdminUsers.tsx** — Liste clients + changement rôle + recherche
4. **AdminPartenaires.tsx** — CRUD partenaires + commissions
5. **AdminParametres.tsx** — Émetteur LUXENT + RIB pro/perso + multiplicateurs + config acomptes
6. **AdminContenu.tsx** — CMS sections (hero, about, banner, footer)
7. **AdminSuiviAchats.tsx** — Export Excel fournisseur
8. **AdminMedia.tsx** — Galerie médias Firebase Storage

### Adaptations Supabase → Firebase
- `supabase.from('table').select()` → `getDocs(collection(db, 'table'))`
- `supabase.from('table').insert()` → `addDoc(collection(db, 'table'), data)`
- `supabase.from('table').update()` → `updateDoc(doc(db, 'table', id), data)`
- `supabase.from('table').delete()` → `updateDoc(doc(db, 'table', id), { actif: false })`

## 4. COMPTES TEST À CRÉER
| Email | Rôle | Mot de passe |
|-------|------|-------------|
| user@97import.com | user | Test2026! |
| vip@97import.com | vip | Test2026! |
| partner@97import.com | partner | Test2026! |
| admin@97import.com | admin | Admin2026! |
