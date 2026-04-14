# AUDIT TECHNIQUE — 97Import v2
**Date** : 2026-04-14
**Branche** : v2
**Projet Firebase** : importok-6ef77
**Deploy** : Vercel (SPA rewrite → /index.html)

---

## 1. ARCHITECTURE DES FICHIERS

### 1.1 Point d'entree
```
src/main.tsx          → ReactDOM.createRoot, importe App + index.css
src/App.tsx           → I18nProvider wraps (AdminApp | FrontApp)
                        Detection admin: hostname.startsWith('admin.') || path.startsWith('/admin')
src/front/FrontApp.tsx → Router wouter, Header + Footer + pages
src/admin/AdminApp.tsx → Router admin, sidebar + pages admin
```

### 1.2 Fichiers CSS

| Fichier | Role | Usage |
|---------|------|-------|
| `src/index.css` | CSS global | `@import "tailwindcss"` + variables CSS custom + tooltip |
| `src/admin/styles/admin.css` | CSS admin | 400+ classes custom, Google Fonts (Sora, DM Sans) |
| Inline styles | Front pages | 100% des pages front utilisent `style={{}}` inline |

**Tailwind** : v4.2.2 via `@tailwindcss/postcss` dans `postcss.config.js`

### 1.3 Structure public/
```
public/
├── images/
│   ├── accessories/        ← godets, grappins
│   ├── maisons/            ← modular_standard, modular_premium, camping_car
│   ├── r18_pro/            ← gallery mini-pelle R18
│   ├── r22_pro/            ← gallery mini-pelle R22
│   ├── r32_pro/            ← gallery mini-pelle R32
│   ├── r57_pro/            ← gallery mini-pelle R57
│   ├── solaire/            ← kits solaires
│   ├── solar_kits/         ← doublon potentiel avec solaire/
│   ├── hero_cargo_97import.png
│   ├── hero_maison.png     ← OK, reference dans Home.tsx
│   ├── hero_maison.jpg     ← doublon (non utilise)
│   ├── globe_accueil.png
│   └── r*.png, r*.webp     ← images principales mini-pelles
├── luxent.png              ← logo LUXENT (NON UTILISE par pdf-generator)
├── backoffice_97import_v4.html ← maquette statique legacy
└── vite.svg
```

### 1.4 Fichiers legacy a la racine (non utilises par le build)
```
97import2026_siteweb/    ← ancien site Supabase complet (500+ fichiers)
MIGRATION_PACKAGE_FINAL/ ← package migration Supabase → Firebase
SAVE2026/                ← anciens exports Supabase
HTML-2030/               ← 200+ maquettes PNG/HTML doubao/Gemini
majall/                  ← anciens rapports
PDF/                     ← exemples PDF generes
audit/                   ← ancien audit
1MAJALL/                 ← anciens prompts et rapports
```
**Impact** : Ces dossiers alourdissent le repo mais n'affectent pas le build Vite (non dans `src/`).

---

## 2. STRUCTURE DES DONNEES FIRESTORE

### 2.1 Collection `products` (101 docs)
Champs observes :
```
reference           : string   "MP-R22-001"
nom_fr              : string   "Mini-pelle R22 PRO"
nom_en              : string   "Mini Excavator R22 PRO"
nom_zh              : string   "R22 PRO 小型挖掘机"
description_fr/en/zh: string
categorie           : string   "Mini-Pelle" | "Maisons" | "Solaire" | "Agricole" | "Divers" | "Logistique"
gamme               : string   "R22 PRO"
type                : string   "machine" | "accessoire" | "service"
machine_id          : string?  lien vers la machine parente (pour accessoires)
marque              : string   "RIPPA"
moteur              : string?  "Kubota V2403"
puissance_kw        : number?
prix_achat_cny      : number   95000
prix_achat_eur      : number   12150
prix_public_eur     : number   24300
longueur_cm         : number?
largeur_cm          : number?
hauteur_cm          : number?
poids_net_kg        : number?
poids_brut_kg       : number?
qte_pieces_par_unite: number
matiere_fr/en/zh    : string?
code_hs             : string?  "84295100"
images_urls         : string[] URLs Firebase Storage
video_url           : string?
fiche_pdf_url       : string?
actif               : boolean
ordre               : number   pour le tri dans le catalogue
createdAt           : Timestamp
updatedAt           : Timestamp
```

**Calcul prix partenaire** (dans PriceDisplay.tsx) :
- `partner = Math.round(prix_achat_eur * 1.2)` ou `Math.round(prix_public_eur * 0.6)`
- Aucun champ `partner_price` en base — calcul dynamique cote client

### 2.2 Collection `profiles` (12 docs) / `users` (5 docs)
```
uid          : string
email        : string
firstName    : string
lastName     : string
nom          : string   "Prenom Nom"
telephone    : string
adresse      : string
codePostal   : string
ville        : string
pays         : string
role         : string   "admin" | "partner" | "vip" | "user"
createdAt    : Timestamp
updatedAt    : Timestamp
```

**ATTENTION** : Le role est lu depuis `users/{uid}` (source fiable) dans Header, Produit, Catalogue.
`profiles/{uid}` est la collection historique mais le role y etait ecrase par Profil.tsx/Inscription.tsx (corrige en v28-fix2).
**Recommandation** : Unifier sur une seule collection (`users`), supprimer les anciens `profiles` sans UID Firebase Auth.

### 2.3 Collection `quotes` (vide — purgee)
Format cree par Panier.tsx :
```
numero          : string   "DVS-2604-001"  (via lib/counters.ts, transaction atomique)
client_id       : string   Firebase Auth UID
client_email    : string
client_nom      : string
statut          : string   "nouveau" | "brouillon" | "envoye" | "accepte" | "refuse" | "vip_envoye" | "en_production" | "expedie" | "livre"
lignes          : array
  └─ { ref, nom_fr, qte, prix_unitaire, total, type, description?, lien? }
total_ht        : number
partenaire_code : string?
acomptes        : array
  └─ { montant, date, type_compte, statut: "declare"|"encaisse" }
createdAt       : Timestamp
updatedAt       : Timestamp
```

**Numerotation** : `DVS-AAMM-NNN` via `lib/counters.ts` (doc `counters/DVS_2604`, champ `valeur`, transaction Firestore).
Format compatible avec le back-office `admin/pages/ListeDevis.tsx`.

### 2.4 Collection `admin_params` (3 docs)
```
global    : { taux_rmb_eur, taux_majoration_user, taux_majoration_partner, acompte_pct_defaut, delai_validite_devis }
emetteur  : { nom, adresse, ville, pays, company_number, email, tel_cn, tel_fr, iban, swift, banque }
```

### 2.5 Collection `partners` (4 docs)
```
userId    : string   Firebase Auth UID
nom       : string
email     : string
code      : string   "PB", "MC"
actif     : boolean
createdAt : Timestamp
```

---

## 3. DIAGNOSTIC DES BUGS

### 3.1 BUG CRITIQUE — Affichage noir et blanc sur Vercel

**Cause identifiee** : Tailwind CSS v4 via `@import "tailwindcss"` dans `src/index.css`.

Le probleme est que :
1. Les pages **front** utilisent 100% inline styles (`style={{}}`) — elles ne dependent PAS de Tailwind.
2. Les pages **admin** utilisent des classes CSS custom dans `admin.css` ET des `className` Tailwind (400 occurrences).
3. **MonCompte.tsx** (page front) utilise 29 `className` Tailwind (`bg-white`, `rounded-xl`, `text-gray-500`, etc.) alors que toutes les autres pages front utilisent du inline style.

**Impact Vercel** :
- Si Tailwind est correctement compile → admin et MonCompte ont les couleurs. Front OK (inline).
- Si le plugin `@tailwindcss/postcss` echoue ou le tree-shaking supprime des classes → MonCompte perd ses couleurs, admin affecte.
- Le `@import "tailwindcss"` dans index.css est le seul point d'entree Tailwind.

**Diagnostic precis** : Verifier dans le build Vercel si `dist/assets/index-*.css` contient bien les classes Tailwind. Si le CSS est vide ou minimal, c'est que PostCSS ne scanne pas correctement les fichiers `.tsx`.

**Solutions possibles** :
1. Convertir `MonCompte.tsx` en inline styles (comme toutes les autres pages front)
2. Ajouter un `tailwind.config` explicite avec `content: ['./src/**/*.tsx']`
3. Verifier que `@tailwindcss/postcss` v4 scanne bien les fichiers (v4 est auto-detect mais peut rater)

### 3.2 PDF — Pas de chemins relatifs problematiques

Le `pdf-generator.ts` n'utilise **aucun chemin fichier** :
- Logo Luxent : encode en **base64 inline** dans le code (constante `LUXENT_LOGO_BASE64`)
- Pas de `fetch()`, pas de `require()`, pas de reference a `/public/`
- Generation 100% cote client via `jsPDF`

**Pas de bug de chemin Vercel pour les PDF.** Si un PDF ne s'affiche pas, le probleme vient :
- Des donnees manquantes dans Firestore (champs `numero`, `lignes`, `emetteur`)
- De la collection `admin_params/emetteur` non remplie (verifie : elle existe avec 3 docs)

### 3.3 Boutons sans `onClick` actif (front)

| Fichier | Ligne | Bouton | Probleme |
|---------|-------|--------|----------|
| `SearchBar.tsx` | 63 | Bouton "Rechercher" | Pas de onClick — la recherche fonctionne via onChange sur l'input, le bouton est decoratif |
| `EspaceClient.tsx` | 214 | "Telecharger" (documents) | Pas de onClick — bouton present mais non connecte |
| `EspaceClient.tsx` | 242 | "Verser un acompte" | Pas de onClick — fonctionnalite non implementee |
| `EspacePartenaire.tsx` | 250 | "Apercu PDF" | Pas de onClick — fonctionnalite non implementee |
| `Produit.tsx` | 187 | "Devis" (lien panier) | Wrappé dans `<Link>` — OK, fonctionne via navigation |

**Boutons inactifs a connecter** : 3 boutons (Telecharger, Verser acompte, Apercu PDF).

---

## 4. RESUME DES ERREURS DETECTEES

### Critiques
| # | Bug | Fichier | Impact |
|---|-----|---------|--------|
| 1 | Tailwind v4 sans config content explicite | postcss.config.js / index.css | Risque affichage N&B si tree-shaking rate les classes |
| 2 | MonCompte.tsx utilise className Tailwind (29x) au lieu d'inline styles | MonCompte.tsx | Seule page front dependante de Tailwind |

### Moyens
| # | Bug | Fichier | Impact |
|---|-----|---------|--------|
| 3 | Dual collection profiles/users avec roles desynchronises | Profil.tsx, Inscription.tsx | Corrige en v28-fix2 mais profiles contient encore 7 docs orphelins (CLI-001 a CLI-005, parisb2b, mc@sasfr) |
| 4 | 3 boutons front sans onClick | EspaceClient.tsx (x2), EspacePartenaire.tsx (x1) | Fonctionnalites inactives |
| 5 | Dossier public/solar_kits/ doublon de public/images/solaire/ | public/ | Confusion potentielle |

### Mineurs
| # | Bug | Fichier | Impact |
|---|-----|---------|--------|
| 6 | hero_maison.jpg inutilise (doublon de hero_maison.png) | public/images/ | Poids inutile |
| 7 | 500+ fichiers legacy a la racine (HTML-2030/, 97import2026_siteweb/, etc.) | racine repo | Repo lourd (~2GB) |
| 8 | Fichier public/luxent.png non utilise (logo en base64 dans pdf-generator) | public/ | Confusion |

---

## 5. COLLECTIONS FIRESTORE — ETAT ACTUEL

| Collection | Documents | Statut |
|------------|-----------|--------|
| products | 101 | OK — 96 catalogue + 5 test |
| users | 5 | OK — 5 comptes test |
| profiles | 12 | 5 test + 7 orphelins (a nettoyer) |
| partners | 4 | OK |
| admin_params | 3 | OK (global, emetteur) |
| quotes | 0 | Purge |
| counters | 0 | Purge (reprendra a 001) |
| Toutes les autres | 0 | Purge |

---

## 6. RECOMMANDATIONS PRIORITAIRES

1. **FIX N&B** : Convertir `MonCompte.tsx` en inline styles OU ajouter une config Tailwind v4 avec content scan explicite.
2. **UNIFIER AUTH** : Supprimer les 7 profils orphelins dans `profiles/`, standardiser la lecture du role depuis `users/` partout.
3. **BOUTONS INACTIFS** : Connecter Telecharger (PDF), Verser acompte (popup), Apercu PDF (preview).
4. **NETTOYAGE REPO** : Ajouter les dossiers legacy au `.gitignore` ou les deplacer hors du repo.
