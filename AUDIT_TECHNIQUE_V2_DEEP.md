# AUDIT TECHNIQUE PROFOND — 97Import v2
Date : 2026-04-14
Branche : v2
Commit : 54c7cf3

---

## 1. INVENTAIRE DES PAGES

### 1.1 Pages Front (18 fichiers)

| Fichier | Composant | Route | Lignes | Fonction |
|---------|-----------|-------|--------|----------|
| Home.tsx | Home | `/` | 120 | Hero, categories dynamiques Firestore, stats |
| Catalogue.tsx | Catalogue | `/catalogue/:categorie` | 128 | Listing produits, filtres gamme, tri ordre+ref |
| Produit.tsx | Produit | `/produit/:id` | 243 | Fiche produit, galerie, specs, prix, accessoires |
| Panier.tsx | Panier | `/panier` | 563 | Panier + 3 popups (partenaire, acompte, RIB) |
| Connexion.tsx | Connexion | `/connexion` | 116 | Login email + Google |
| Inscription.tsx | Inscription | `/inscription` | 147 | Signup email + Google |
| Profil.tsx | Profil | `/profil` | 171 | Formulaire profil obligatoire post-inscription |
| EspaceClient.tsx | EspaceClient | `/espace-client` | 283 | Sidebar + devis + documents + paiements |
| EspacePartenaire.tsx | EspacePartenaire | `/espace-partenaire` | 357 | Sidebar double casquette, devis VIP, clients, commissions |
| MonCompte.tsx | MonCompte | `/mon-compte/:tab?` → redirect `/espace-client` | 161 | Page legacy, redirigee |
| Services.tsx | Services | `/services` | 84 | 6 services + 4 destinations DOM-TOM |
| Contact.tsx | Contact | `/contact` | 151 | Formulaire contact + WhatsApp |
| Header.tsx | Header | (composant) | 186 | Nav sticky, horloges, globe i18n, panier, auth |
| Footer.tsx | Footer | (composant) | 97 | 4 colonnes, liens, copyright |
| SearchBar.tsx | SearchBar | (composant) | 101 | Recherche temps reel, dropdown resultats |
| PriceDisplay.tsx | PriceDisplay | (composant) | 151 | Prix par role (visitor/user/partner/admin) |
| ProductCard.tsx | ProductCard | (composant) | 66 | Carte produit avec prix |
| Breadcrumb.tsx | Breadcrumb | (composant) | 23 | Fil d'Ariane |

**Routes placeholder** : `/mentions-legales`, `/cgv`, `/rgpd` → composant Placeholder inline.

### 1.2 Pages Admin (28 fichiers)

| Fichier | Composant | Lignes |
|---------|-----------|--------|
| Dashboard.tsx | Dashboard | 419 |
| ListeDevis.tsx | ListeDevis | 279 |
| DetailDevis.tsx | DetailDevis | 463 |
| Factures.tsx | Factures | 210 |
| DetailFacture.tsx | DetailFacture | 92 |
| NotesCommission.tsx | NotesCommission | 247 |
| DetailCommission.tsx | DetailCommission | 95 |
| FraisLogistique.tsx | FraisLogistique | 209 |
| DetailFraisLogistique.tsx | DetailFraisLogistique | 58 |
| ListesAchat.tsx | ListesAchat | 135 |
| DetailAchat.tsx | DetailAchat | 63 |
| ListeConteneurs.tsx | ListeConteneurs | 152 |
| NouveauConteneur.tsx | NouveauConteneur | 84 |
| DetailConteneur.tsx | DetailConteneur | 219 |
| SAVListe.tsx | SAVListe | 138 |
| SAVDetail.tsx | SAVDetail | 115 |
| Stock.tsx | Stock | 147 |
| CatalogueProduits.tsx | CatalogueProduits | 247 |
| NouveauProduit.tsx | NouveauProduit | 68 |
| EditProduit.tsx | EditProduit | 101 |
| Clients.tsx | Clients | 85 |
| DetailClient.tsx | DetailClient | 75 |
| Partenaires.tsx | Partenaires | 97 |
| DetailPartenaire.tsx | DetailPartenaire | 81 |
| TauxRMB.tsx | TauxRMB | 92 |
| GestionSite.tsx | GestionSite | 128 |
| Logs.tsx | Logs | 85 |
| Parametres.tsx | Parametres | 170 |

Admin supplementaires : `AdminApp.tsx` (330L), `AdminLogin.tsx` (88L)

### 1.3 Composants partages

**Admin components** : `Icons.tsx`, `ProductForm.tsx`
**Root components** : `GlobeToggle.tsx`, `DuplicateBtn.tsx`, `ErrorBoundary.tsx`, `OrangeIndicator.tsx`, `SortControl.tsx`

### 1.4 Contextes et Providers

| Provider | Fichier | Scope |
|----------|---------|-------|
| I18nProvider | src/i18n/index.tsx | App entiere (wraps AdminApp + FrontApp) |

Pas d'AuthContext — chaque composant fait son propre `onAuthStateChanged`.

### 1.5 Lib / Utils

| Fichier | Lignes | Fonction |
|---------|--------|----------|
| firebase.ts | 26 | Init Firebase (clientAuth, adminAuth, db, storage) |
| counters.ts | 23 | Numerotation atomique DVS/FA/CONT/SAV |
| pdf-generator.ts | 920+ | 5 types de PDF (devis, facture acompte, facture finale, logistique, commission) |
| excel-generator.ts | — | Export Excel catalogue |
| exchange-rate.ts | — | API taux RMB |
| deepl.ts | — | Traduction auto FR→ZH/EN |

**i18n** : `fr.json` (244 cles), `en.json`, `zh.json`, `index.tsx` (provider nested + flat fallback)

---

## 2. BOUTONS MORTS — INVENTAIRE COMPLET

### 2.1 Front — boutons sans onClick

| Fichier | Ligne | Bouton | Verdict |
|---------|-------|--------|---------|
| SearchBar.tsx | 63 | "Rechercher" | DECORATIF — la recherche fonctionne via `onChange` sur l'input |
| EspaceClient.tsx | 147 | Menu sidebar items | FAUX POSITIF — onClick est sur la ligne suivante |
| Produit.tsx | 187 | "Devis" | OK — wrappe dans `<Link href="/panier">` |

### 2.2 Front — onClick morts (console.log/alert/{})

**Aucun** — tous les onClick front sont connectes a des fonctions reelles.

### 2.3 Admin — boutons sans onClick

| Fichier | Ligne | Verdict |
|---------|-------|---------|
| AdminLogin.tsx:72 | Login button | OK — `type="submit"` |
| ProductForm.tsx:293,345,407 | Translate + Save | OK — onClick sur la ligne suivante |
| Dashboard.tsx:347 | "Traiter →" SAV | OK — wrappe dans `<Link>` |

**Aucun bouton admin reellement mort.**

### 2.4 Liens href="#"

**Aucun** — 0 occurrence de `href="#"` ou `href="javascript:void"` dans tout le projet.

### 2.5 Fonctions potentiellement mortes

| Fichier | Fonction | Statut |
|---------|----------|--------|
| MonCompte.tsx | `getStatutClass()` | SUPPRIMEE — page reecrite en inline styles avec `statutStyle()` |

Pas d'autres fonctions mortes detectees.

---

## 3. PDF — DIAGNOSTIC COMPLET

### 3.1 Fichiers PDF dans le projet

**Aucun PDF dans public/** — les PDF sont generes dynamiquement cote client.

Fichiers PDF legacy (non utilises par le build) :
```
PDF/A2500001.pdf, D2600001-MC.pdf, D2600022.pdf, D2604001.pdf, etc.
97import2026_siteweb/documents/*.pdf (fiches techniques R18/R22/R32/R57)
MIGRATION_PACKAGE_FINAL/Devis_D2600022-1.pdf
```

### 3.2 pdf-generator.ts — analyse

| Fonction | Usage | Lignes |
|----------|-------|--------|
| `generateDevis()` | Devis client/VIP | Admin: ListeDevis, DetailDevis, Factures, NotesCommission. Front: EspaceClient, EspacePartenaire |
| `generateFactureAcompte()` | Facture apres acompte | Admin: DetailFacture, Factures. Front: EspaceClient |
| `generateFactureFinale()` | Facture finale | Admin: DetailFacture, Factures |
| `generateFactureLogistique()` | Frais transport | Admin: FraisLogistique |
| `generateNoteCommission()` | Note commission | Admin: DetailCommission, NotesCommission, Factures |
| `downloadPDF()` | Telecharger le PDF | Partout |

**Methode** : 100% jsPDF cote client, aucun appel serveur, aucun `fetch()`.

### 3.3 Logo Luxent — statut

- **Dans pdf-generator.ts** : Logo encode en base64 inline (`LUXENT_LOGO_BASE64`), ligne 4
- **Fichier physique** : `public/luxent.png` existe mais N'EST PAS UTILISE par le code
- **Rendu** : `doc.addImage(LUXENT_LOGO_BASE64, 'JPEG', 145, 12, 45, 13)` — try/catch, logo optionnel
- **Verdict** : Aucun probleme de chemin Vercel pour les PDF

### 3.4 Chemins problematiques pour Vercel

**Aucun** — aucune reference a `/public/`, pas de `fetch()` d'images locales, pas de `require()`. Tout est inline ou via URLs Firebase Storage.

---

## 4. CSS — DIAGNOSTIC NOIR ET BLANC

### 4.1 Configuration Tailwind v4

```
postcss.config.js : @tailwindcss/postcss + autoprefixer
tailwind.config.js : N'EXISTE PAS (normal en v4 — auto-detect)
package.json : tailwindcss@4.2.2, @tailwindcss/postcss@4.2.2
index.css : @import "tailwindcss" + @theme custom + :root variables
```

### 4.2 className vs inline par page

**FRONT (18 fichiers) : 0 className — 100% inline styles**

| Fichier | className | inline style | Statut |
|---------|-----------|-------------|--------|
| Breadcrumb.tsx | 0 | 4 | ✅ |
| Footer.tsx | 0 | 16 | ✅ |
| Header.tsx | 0 | 16 | ✅ |
| PriceDisplay.tsx | 0 | 23 | ✅ |
| ProductCard.tsx | 0 | 11 | ✅ |
| SearchBar.tsx | 0 | 10 | ✅ |
| FrontApp.tsx | 0 | 3 | ✅ |
| Catalogue.tsx | 0 | 11 | ✅ |
| Connexion.tsx | 0 | 17 | ✅ |
| Contact.tsx | 0 | 30 | ✅ |
| EspaceClient.tsx | 0 | 46 | ✅ |
| EspacePartenaire.tsx | 0 | 61 | ✅ |
| Home.tsx | 0 | 31 | ✅ |
| Inscription.tsx | 0 | 22 | ✅ |
| MonCompte.tsx | 0 | 27 | ✅ (converti en v28-fix) |
| Panier.tsx | 0 | 102 | ✅ |
| Produit.tsx | 0 | 32 | ✅ |
| Profil.tsx | 0 | 24 | ✅ |
| Services.tsx | 0 | 19 | ✅ |

**ADMIN : 400 className** — utilise les classes de `admin.css` + quelques Tailwind utilities.

### 4.3 Build CSS — analyse du fichier compile

```
Fichier : dist/assets/index-Cl5bZKg-.css
Taille  : 141 912 bytes (142 KB)
```

Le CSS compile contient :
- Les variables CSS `:root` (navy, salmon, etc.) ✅
- Les classes admin.css (admin-layout, admin-sidebar, etc.) ✅
- Les utilities Tailwind utilisees par l'admin (bg-white, rounded, etc.) ✅
- Le theme @theme custom ✅

### 4.4 Verdict N&B

Apres la conversion de MonCompte.tsx en inline styles, **toutes les pages front sont independantes de Tailwind**. Le site front ne peut plus etre affecte par un probleme Tailwind. Seul l'admin depend de Tailwind + admin.css.

Si le probleme N&B persiste sur Vercel, verifier :
1. Le cache Vercel (purger et redeployer)
2. La variable `isAdmin` dans App.tsx — si elle detecte mal le mode admin, FrontApp pourrait charger sans CSS
3. Les DevTools > Network > verifier que le CSS est bien charge (200, pas 404)

---

## 5. ROUTING — CARTE COMPLETE

### 5.1 Routes Front (17 routes)

| Route | Composant | Fonction |
|-------|-----------|----------|
| `/` | Home | Accueil |
| `/catalogue` | Catalogue | Tous les produits |
| `/catalogue/:categorie` | Catalogue | Par categorie |
| `/catalogue/:categorie/:gamme` | Catalogue | Par gamme |
| `/catalogue/:categorie/:gamme/accessoires` | Catalogue | Accessoires gamme |
| `/produit/:id` | Produit | Fiche produit |
| `/connexion` | Connexion | Login |
| `/inscription` | Inscription | Signup |
| `/panier` | Panier | Panier + popups |
| `/mon-compte/:tab?` | → Redirect `/espace-client` | Redirection |
| `/services` | Services | Page services |
| `/contact` | Contact | Page contact |
| `/espace-client` | EspaceClient | Espace client |
| `/espace-partenaire` | EspacePartenaire | Espace partenaire |
| `/profil` | Profil | Formulaire profil |
| `/mentions-legales` | Placeholder | Placeholder |
| `/cgv` | Placeholder | Placeholder |
| `/rgpd` | Placeholder | Placeholder |
| `*` (fallback) | Home | 404 → Home |

### 5.2 Routes Admin (29 routes)

| Route | Composant |
|-------|-----------|
| `/admin` | Dashboard |
| `/admin/devis` | ListeDevis |
| `/admin/devis/nouveau` | DetailDevis |
| `/admin/devis/:id` | DetailDevis |
| `/admin/factures` | Factures |
| `/admin/factures/:id` | DetailFacture |
| `/admin/commissions` | NotesCommission |
| `/admin/commissions/:id` | DetailCommission |
| `/admin/frais` | FraisLogistique |
| `/admin/frais/:id` | DetailFraisLogistique |
| `/admin/achats` | ListesAchat |
| `/admin/achats/:id` | DetailAchat |
| `/admin/conteneurs` | ListeConteneurs |
| `/admin/conteneurs/nouveau` | NouveauConteneur |
| `/admin/conteneurs/:id` | DetailConteneur |
| `/admin/sav` | SAVListe |
| `/admin/sav/:id` | SAVDetail |
| `/admin/stock` | Stock |
| `/admin/produits` | CatalogueProduits |
| `/admin/produits/nouveau` | NouveauProduit |
| `/admin/produits/:id` | EditProduit |
| `/admin/clients` | Clients |
| `/admin/clients/:id` | DetailClient |
| `/admin/partenaires` | Partenaires |
| `/admin/partenaires/:id` | DetailPartenaire |
| `/admin/taux` | TauxRMB |
| `/admin/site` | GestionSite |
| `/admin/logs` | Logs |
| `/admin/parametres` | Parametres |

### 5.3 Pages orphelines

| Page | Statut |
|------|--------|
| MonCompte.tsx | ORPHELINE — route `/mon-compte` redirige vers `/espace-client`. Page non supprimee mais jamais affichee. |

---

## 6. FIRESTORE — COHERENCE CODE ↔ DONNEES

### 6.1 Collections referencees dans le code

| Collection | References | Front | Admin |
|------------|-----------|-------|-------|
| quotes | 7 | Panier, EspaceClient, EspacePartenaire, MonCompte | ListeDevis, Dashboard, DetailClient |
| products | 6 | Home, Catalogue, Produit, SearchBar | CatalogueProduits |
| partners | 3 | Panier, EspacePartenaire | Partenaires |
| containers | 3 | — | ListeConteneurs, Dashboard, FraisLogistique |
| commissions | 3 | — | NotesCommission, Factures, DetailPartenaire |
| sav | 2 | — | SAVListe, Dashboard |
| profiles | 1 | — | Clients |
| stock | 1 | — | Stock |
| notes_commission | 1 | — | Dashboard |
| logs | 1 | — | Logs |
| logistics_invoices | 1 | — | FraisLogistique |
| listes_achat | 1 | — | ListesAchat |
| invoices | 1 | — | Factures |
| contacts | 1 | Contact (ecriture) | — |
| counters | 0 (via lib) | Panier (via getNextNumber) | — |
| users | 0 (via doc) | Header, Produit, Catalogue (role) | — |
| admin_params | 0 (via doc) | EspaceClient, EspacePartenaire (emetteur PDF) | DetailDevis, Factures, etc. |

### 6.2 Champs produits lus par le front

Champs les plus references dans `src/front/` :
```
nom_fr, categorie, gamme, images_urls, prix_public_eur, prix_achat_eur,
prix_achat_cny, reference, marque, moteur, puissance_kw, poids_net_kg,
longueur_cm, largeur_cm, hauteur_cm, matiere_fr, code_hs, actif, type,
machine_id, machine_compatible, description_fr, description_en, description_zh,
nom_en, nom_zh, matiere_en, matiere_zh, ordre, numero_interne
```

### 6.3 Champs quotes lus/ecrits

**Cree par Panier.tsx** :
```
numero, client_id, client_email, client_nom, statut, lignes[],
total_ht, partenaire_code, acomptes[], createdAt, updatedAt
```

**Lu par EspaceClient.tsx** :
```
numero, statut, total_ht, lignes, acomptes, partenaire_code, createdAt
```

**Lu par admin ListeDevis.tsx** :
```
numero, client_nom, partenaire_code, destination, lignes, total_ht,
statut, is_vip, conteneur_ref, createdAt
```

**Champs manquants dans la creation front** : `destination` (defaut 'MQ' cote admin), `is_vip` (defaut false). Non bloquant — l'admin gere les defaults.

---

## 7. ACTIONS PRIORITAIRES (classees par criticite)

### CRITIQUE
Aucune action critique restante. Les bugs N&B (MonCompte className) et boutons morts ont ete corriges.

### MOYENNES
| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 1 | Supprimer MonCompte.tsx (page orpheline, jamais affichee) | MonCompte.tsx | Code mort |
| 2 | Ajouter champ `destination` a la creation de devis dans Panier.tsx | Panier.tsx | Coherence avec admin |
| 3 | Creer un AuthContext partage (eviter 5x onAuthStateChanged) | nouveau fichier | Performance, DRY |
| 4 | Implementer les 3 pages placeholder (mentions, CGV, RGPD) | nouveau fichier | Completude |

### MINEURES
| # | Action | Impact |
|---|--------|--------|
| 5 | `public/luxent.png` inutilise (logo en base64) — supprimer | Nettoyage |
| 6 | Dossiers legacy a la racine (HTML-2030, 97import2026_siteweb, etc.) — ajouter au .gitignore | Repo allege |
| 7 | Le bouton "Rechercher" dans SearchBar est decoratif — soit le connecter soit le supprimer | UX |
| 8 | Ajouter `is_vip: false` a la creation de devis | Coherence |
