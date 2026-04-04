# Rapport de debug - 97import.com

**Date** : 2026-04-03
**Branche** : `main`
**Dernier commit** : `89a3bb4` (docs: MAJALL.TXT -- v5.12)

---

## 1. Bugs critiques confirmes

### 1.1 `supabaseAdmin` utilise ANON_KEY au lieu de SERVICE_ROLE_KEY

**Fichier** : `/client/src/lib/supabase.ts`, lignes 17-26

```ts
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { ... })
    : null;
```

**Impact** : Le client `supabaseAdmin` est cree avec `VITE_SUPABASE_ANON_KEY`, exactement la meme cle que le client public `supabase`. La seule difference est le `storageKey` pour isoler les sessions auth.

**Consequence directe** : Toutes les requetes admin (quotes, profiles, invoices, partners, products, etc.) sont soumises aux politiques RLS. Le fichier `supabase.sql` (seul schema SQL disponible) definit des politiques restrictives :
- `profiles` : `auth.uid() = id` -- un admin ne peut lire QUE son propre profil
- `orders` : `auth.uid() = user_id` -- un admin ne voit que ses propres commandes
- `contacts` : `FOR SELECT TO authenticated USING (true)` -- OK pour la lecture

Les tables `quotes`, `invoices`, `partners`, `products`, `site_content`, `admin_params` ne sont pas dans le schema SQL fourni, ce qui signifie soit :
- Elles ont des policies separees (non versionees)
- Elles n'ont PAS de RLS active (donnees accessibles a tous les utilisateurs authentifies)

**Recommendation** : Utiliser `VITE_SUPABASE_SERVICE_ROLE_KEY` cote serveur uniquement, OU creer des policies RLS admin explicites (ex: `role = 'admin'` dans profiles).

### 1.2 AdminLogin -- erreur profil silencieusement ignoree (CORRIGE partiellement)

**Fichier** : `/client/src/pages/admin/AdminLogin.tsx`, lignes 36-67

L'ancienne version ignorait l'erreur de la requete `profiles`. La version actuelle (commit `ae1c9ac`) a ajoute :
- Detection explicite de `profileError` (ligne 46)
- Fallback par email (ligne 49)
- Message d'erreur technique affiche (ligne 64)

**Probleme residuel** : Le fallback par email (ligne 49-59) redirige vers `/admin/dashboard` SANS verifier si le profil est effectivement admin/collaborateur. Si la requete par email retourne n'importe quel profil avec role "admin" ou "collaborateur", l'acces est accorde, mais il n'y a aucune garantie que ce profil correspond au meme utilisateur authentifie.

**Ligne critique** :
```ts
// Ligne 57 -- redirige sans valider que le profil correspond au user auth
if (profileByEmail && (profileByEmail.role === "admin" || profileByEmail.role === "collaborateur")) {
  setLocation("/admin/dashboard");
  return;
}
```

### 1.3 Spinner infini -- corrige avec try/catch/finally dans les composants admin

Les 9 composants admin suivants ont maintenant des try/catch/finally et des timeouts de securite (8s) :

| Composant | Fichier | try/catch | timeout | Statut |
|-----------|---------|-----------|---------|--------|
| AdminDashboard | `AdminDashboard.tsx:72-94` | Oui | 8s (L70) | OK |
| AdminQuotes | `AdminQuotes.tsx:216-263` | Oui | 8s (L211) | OK |
| AdminUsers | `AdminUsers.tsx:54-81` | Oui | 8s (L53) | OK |
| AdminProducts | `AdminProducts.tsx:177+` | Oui | via callback | OK |
| AdminPartenaires | `AdminPartenaires.tsx:75-98` | Oui | implicite | OK |
| AdminSuiviAchats | `AdminSuiviAchats.tsx:69-90` | Oui | implicite | **MANQUE timeout** |
| AdminInvoices | `AdminInvoices.tsx:47-78` | Oui | 8s (L50) | OK |
| AdminAnalytics | `AdminAnalytics.tsx:39-103` | Oui | 8s (L44) | OK |
| AdminContenu | `AdminContenu.tsx:13-30` | Oui | 8s (L16) | OK |

**AdminInvoices -- null guard manquant** : Ligne 55, `supabase` est utilise sans verification `if (!supabase)`. Si `supabase` est null, la ligne `await supabase.from(...)` lancera un TypeError.

**AdminInvoices.updateStatut** (ligne 84-88) : Aucun try/catch. Si la requete echoue, l'erreur remonte non geree. De plus, aucune verification `if (!supabase)`.

---

## 2. Bugs potentiels a verifier

### 2.1 Promesses non gerees (unhandled promise rejections)

| Fichier | Ligne | Description |
|---------|-------|-------------|
| `AdminUsers.tsx` | 101 | `await supabase.from("profiles").update(...)` -- resultat `.error` non verifie |
| `AdminUsers.tsx` | 107-113 | `await supabase.from('partners').upsert(...)` -- resultat non verifie |
| `AdminUsers.tsx` | 117 | `await supabase.from('partners').update(...)` -- resultat non verifie |
| `AdminQuotes.tsx` | 271 | `await supabase.from("quotes").update(...)` -- resultat non verifie |
| `AdminQuotes.tsx` | 320-325 | `supabase.from("invoices").insert(...)` -- resultat non verifie |
| `AdminQuotes.tsx` | 434 | `supabase.from("quotes").update({ commission_payee: true })` -- non verifie |
| `AdminQuotes.tsx` | 674 | Inline async IIFE sans try/catch pour le bouton NC |
| `AdminPartenaires.tsx` | 153 | `await supabase.from("partners").update(editData)` -- non verifie |
| `AdminPartenaires.tsx` | 163 | `await supabase.from("partners").update({ actif: !p.actif })` -- non verifie |
| `AdminInvoices.tsx` | 85 | `await supabase.from("invoices").update(...)` -- non verifie |

### 2.2 ErrorBoundary -- present mais non utilise dans l'admin

**Fichier** : `/client/src/components/ErrorBoundary.tsx` -- existe et est fonctionnel.

**Fichier** : `/client/src/main.tsx` -- **ErrorBoundary n'est PAS utilise**. Le render est :
```tsx
<AuthProvider>
  <CartProvider>
    <App />
  </CartProvider>
</AuthProvider>
```
Aucun `<ErrorBoundary>` ne wrappe l'application. Une erreur runtime non attrapee fera planter toute l'app.

### 2.3 Cart persistence -- bug potentiel de double ecriture

**Fichier** : `/client/src/contexts/CartContext.tsx`, lignes 33-47

```ts
useEffect(() => {
  const savedCart = localStorage.getItem("rippa_cart");
  if (savedCart) { setItems(JSON.parse(savedCart)); }
}, []);

useEffect(() => {
  localStorage.setItem("rippa_cart", JSON.stringify(items));
}, [items]);
```

**Probleme** : Au montage, le second `useEffect` s'execute avec `items = []` (etat initial) AVANT que le premier `useEffect` ne charge les donnees sauvegardees. Cela ecrase le panier sauvegarde avec un tableau vide. En pratique, React batch les effets, mais dans StrictMode (dev), les effets s'executent deux fois, ce qui peut provoquer une perte du panier.

**De plus** : Le code du panier utilise la cle `"rippa_cart"` tandis que `DevisForm.tsx:249` utilise `localStorage.removeItem('cart')` (cle differente). Cela signifie que la suppression du panier dans DevisForm ne fonctionne PAS.

### 2.4 useEffect sans cleanup dans les composants admin

Les composants suivants lancent des `load()` async dans `useEffect` sans gerer l'annulation :
- `AdminUsers.tsx:84` -- `useEffect(() => { load(); }, []);`
- `AdminSuiviAchats.tsx:90` -- `useEffect(() => { load(); }, []);`
- `AdminPricing.tsx:48` -- `useEffect(() => { load(); }, []);`
- `AdminPartenaires.tsx:98` -- `useEffect(() => { load(); }, []);`
- `AdminAnalytics.tsx:104` -- `useEffect(() => { fetchData(); }, []);`

Si le composant est demonte pendant le chargement, `setState` sera appele sur un composant demonte (memory leak / warning React).

A noter : `AdminPages.tsx` et `AdminHeaderFooter.tsx` utilisent correctement une variable `cancelled` pour gerer l'annulation.

### 2.5 AdminLeads -- utilise fetch() direct au lieu de supabaseAdmin

**Fichier** : `/client/src/pages/admin/AdminLeads.tsx`, lignes 39-44

```ts
const res = await fetch(`${supabaseUrl}/rest/v1/contacts?order=created_at.desc`, {
  headers: {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
  },
});
```

Ce composant est le seul a utiliser `fetch()` direct avec l'ANON_KEY au lieu de `supabaseAdmin`. L'`Authorization` utilise l'ANON_KEY au lieu du token de session de l'utilisateur, ce qui signifie que la requete est faite en tant qu'utilisateur anonyme (`anon` role). La policy RLS sur `contacts` autorise `SELECT TO authenticated`, donc cette requete echouera si RLS est active.

---

## 3. Problemes de performance

### 3.1 Bundle size

Le projet utilise plusieurs librairies lourdes importees dans le bundle principal :
- `recharts` (AdminAnalytics) -- ~200KB gzip
- `xlsx` (AdminPartenaires, AdminSuiviAchats) -- ~500KB gzip
- `jspdf` / `jspdf-autotable` (via features/pdf) -- ~300KB gzip
- `lucide-react` -- tree-shakeable mais de nombreuses icones importees

Aucun lazy loading n'est utilise : tous les composants admin sont importes statiquement dans `AdminLayout.tsx` (lignes 22-29). Un visiteur qui ne va jamais sur `/admin` charge quand meme tout le code admin dans le bundle via la route `AdminLayout`.

**Recommendation** : Utiliser `React.lazy()` pour les composants admin et les routes admin.

### 3.2 Re-renders inutiles

- `AdminDashboard.tsx` : Le composant `inlineBadge` (ligne 115) est une fonction definie dans le render, recreee a chaque render. Devrait etre un composant separe ou `useMemo`.
- `AdminQuotes.tsx` (1423 lignes) : Le composant est massif et recree de nombreux handlers a chaque render. Pas de `useMemo` ni `useCallback` pour les handlers de clic.
- `AdminProducts.tsx` (993 lignes) : Meme probleme.
- `AdminUsers.tsx` : La fonction `filtered` (ligne 86) recalcule le filtre a chaque render sans `useMemo`.

A noter : `AdminSuiviAchats` et `AdminPartenaires` utilisent correctement `useMemo`.

### 3.3 Requetes Supabase non optimisees

- `AdminDashboard.tsx` (lignes 73-78) : Charge TOUS les quotes (`select("statut")`) et TOUS les profils (`select("role")`) pour calculer des comptages. Devrait utiliser `.select("statut", { count: 'exact', head: true })` ou une vue/RPC.
- `AdminAnalytics.tsx` (lignes 56-65) : 6 requetes Supabase en parallele au chargement, dont certaines redondantes (quotes charge 2 fois : pour les 30 derniers jours ET pour le total).

---

## 4. Problemes de securite

### 4.1 ANON_KEY exposee dans le bundle client

**Normal pour Supabase** mais les policies RLS doivent etre correctement configurees. Comme vu en section 1.1, les policies du schema `supabase.sql` sont trop restrictives pour un admin et trop permissives pour certaines tables non definies.

### 4.2 Pas de secrets hardcodes

Aucun secret, mot de passe ou cle API n'est hardcode dans le code source. Les cles Supabase sont correctement chargees via `import.meta.env.VITE_*`.

Le fichier `.env` existe (474 octets) mais n'est pas versionne (non present dans git status).

### 4.3 Vulnerabilites XSS -- dangerouslySetInnerHTML

**Fichiers concernes** :
| Fichier | Ligne | Source du HTML |
|---------|-------|---------------|
| `Legal.tsx` | 25 | `page.content` -- contenu de `site_content` Supabase |
| `Privacy.tsx` | 25 | `page.content` -- contenu de `site_content` Supabase |
| `Terms.tsx` | 25 | `page.content` -- contenu de `site_content` Supabase |
| `chart.tsx` (UI) | 81 | Composant shadcn/ui (interne) |

**Risque** : Si le contenu de la table `site_content` est modifie (admin compromise ou injection), le HTML sera injecte directement dans le DOM sans sanitisation. Devrait utiliser `DOMPurify` ou equivalent.

### 4.4 API server sans authentification

**Fichier** : `/server/index.ts`

Les routes suivantes n'ont AUCUNE authentification :
- `POST /api/products` (ligne 34) -- Permet a quiconque d'ecrire des produits
- `POST /api/settings` (ligne 79) -- Permet a quiconque de modifier les parametres

Note : Le serveur semble etre un dev-server local uniquement (non deploye sur Vercel SPA). Mais si jamais deploye, c'est une faille critique.

### 4.5 Notifications -- ANON_KEY dans les headers de l'Edge Function

**Fichier** : `/client/src/lib/notifications.ts`, lignes 63-66

```ts
headers: {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
},
```

L'appel a l'Edge Function `send-email` utilise l'ANON_KEY comme Bearer token, pas le token de session de l'utilisateur admin. L'Edge Function devrait valider que l'appelant est admin.

---

## 5. Incoherences de code

### 5.1 Patterns mixtes : `.then()` vs `async/await`

| Fichier | Lignes | Pattern | Contexte |
|---------|--------|---------|----------|
| `AdminLayout.tsx` | 93 | `.then()` | `supabase.auth.getSession().then(...)` |
| `AdminLayout.tsx` | 146-147 | `.then().then()` | `fetch().then().then()` |
| `AdminMedia.tsx` | 101 | `.then()` | `navigator.clipboard.writeText(...).then()` |
| `AdminProducts.tsx` | 170, 217 | `.then().then()` | `fetch().then().then()` |
| Tous les autres admin | - | `async/await` | Pattern principal |

### 5.2 AdminLeads -- seul composant a utiliser fetch() direct

`AdminLeads.tsx` est le seul composant admin qui n'utilise PAS `supabaseAdmin` client. Il fait un `fetch()` direct vers le REST API Supabase avec l'ANON_KEY en header. Tous les autres composants utilisent `supabaseAdmin as supabase`.

### 5.3 Nommage -- melange francais/anglais

| Element | Francais | Anglais | Fichiers concernes |
|---------|----------|---------|-------------------|
| Variables d'etat | `loading`, `saving`, `search` | `loadError`, `filterStatut` | Tous les admin |
| Colonnes Supabase | `nom`, `statut`, `prix_negocie`, `actif` | `email`, `phone`, `created_at` | Tout le schema |
| Fonctions | `passerEnVip`, `calcCommission` | `downloadBlob`, `enrichProduits` | `AdminQuotes.tsx` |
| Routes | `/admin/devis`, `/admin/partenaires` | `/admin/dashboard`, `/admin/users`, `/admin/products` | `AdminLayout.tsx:48-61` |
| Composants | `AdminPartenaires`, `AdminSuiviAchats`, `AdminContenu` | `AdminDashboard`, `AdminUsers`, `AdminProducts` | Tout le dossier admin |
| Statuts devis | `nouveau`, `en_cours`, `negociation`, `accepte`, `refuse` | -- | Schema + composants |

### 5.4 Duplication -- fichiers PDF

Les fichiers utilitaires de generation PDF existent en double :
- `/client/src/utils/generateDevisPDF.ts` -- ancienne version
- `/client/src/features/pdf/templates/quote-pdf.ts` -- nouvelle version (utilisee)
- `/client/src/utils/generateFacturePDF.ts` -- ancienne version
- `/client/src/features/pdf/templates/invoice-pdf.ts` -- nouvelle version (utilisee)
- `/client/src/utils/generateCommissionPDF.ts` -- ancienne version
- `/client/src/features/pdf/templates/commission-pdf.ts` -- nouvelle version (utilisee)
- `/client/src/utils/generateFeesPDF.ts` -- ancienne version
- `/client/src/features/pdf/templates/fees-pdf.ts` -- nouvelle version (utilisee)
- `/client/src/utils/generateDeliveryNotePDF.ts` -- ancienne version
- `/client/src/features/pdf/templates/delivery-note-pdf.ts` -- nouvelle version (utilisee)

Les fichiers dans `/utils/` sont du code mort mais restent dans le bundle.

### 5.5 AdminInvoices -- style CSS classes vs inline styles

`AdminInvoices.tsx` utilise des classes Tailwind CSS (`className="..."`) tandis que la majorite des autres composants admin (`AdminDashboard`, `AdminUsers`, `AdminQuotes`, `AdminPartenaires`, etc.) utilisent des styles inline via l'objet `ADMIN_COLORS` et le design system `AdminUI.tsx`.

### 5.6 Statuts devis -- "non_conforme" manquant dans certains composants

Le statut `"non_conforme"` (ajout commit `49d7b9a`) est defini dans :
- `AdminQuotes.tsx` -- type `Statut` et `STATUT_LABELS` (OK)

Mais il est ABSENT de :
- `AdminDashboard.tsx:33-39` -- `STATUT_LABELS` ne contient pas `non_conforme`
- `AdminSuiviAchats.tsx:40-47` -- `STATUTS` et `STATUT_LABELS` ne contiennent pas `non_conforme`
- `AdminAnalytics.tsx:13-18` -- `STATUT_COLORS` ne contient pas `non_conforme`
- `AdminAnalytics.tsx:22` -- `STATUT_LABELS` ne contient pas `non_conforme`

Consequence : Les devis marques "non conforme" apparaitront comme statut inconnu dans le dashboard, le suivi achats et les analytics.

---

## 6. Tables de correspondance -- composants admin

| Composant | Fichier | Tables Supabase | RLS | Null-guard `supabase` | Error handling |
|-----------|---------|-----------------|-----|----------------------|----------------|
| **AdminLogin** | `AdminLogin.tsx` | `profiles` | Oui (auth.uid()=id) -- bloque admin | Oui (L19) | Oui (fallback email + message) |
| **AdminLayout** | `AdminLayout.tsx` | `profiles` | Oui -- fallback email | Oui (L89) | Partiel (log erreur, fallback) |
| **AdminDashboard** | `AdminDashboard.tsx` | `quotes`, `profiles` | ? (non defini dans sql) | Oui (L69) | Oui (try/catch/finally) |
| **AdminQuotes** | `AdminQuotes.tsx` | `quotes`, `partners`, `products`, `invoices`, `profiles` | ? | Oui (L202) | Oui (try/catch/finally, diagnostic RLS) |
| **AdminUsers** | `AdminUsers.tsx` | `profiles`, `partners` | Oui (auth.uid()=id) -- **bloque admin** | Oui (L46) | Oui (try/catch/finally, RPC fallback) |
| **AdminProducts** | `AdminProducts.tsx` | `products` | ? | Oui (callback) | Oui (callback + timeout) |
| **AdminInvoices** | `AdminInvoices.tsx` | `invoices`, `quotes` | ? | **NON** (L55) | Partiel (load OK, updateStatut sans try/catch) |
| **AdminPartenaires** | `AdminPartenaires.tsx` | `partners`, `quotes` | ? | Oui (L76) | Oui (try/catch) |
| **AdminSuiviAchats** | `AdminSuiviAchats.tsx` | `quotes`, `partners` | ? | Implicite (L69 `if (!supabase) return`) | Oui (try/catch, **pas de timeout**) |
| **AdminAnalytics** | `AdminAnalytics.tsx` | `quotes`, `profiles` | ? | Oui (L40) | Oui (try/catch/finally, timeout 8s) |
| **AdminContenu** | `AdminContenu.tsx` | `site_content` | ? | Oui (L14) | Oui (try/catch, timeout 8s) |
| **AdminShipping** | `AdminShipping.tsx` | `site_content` | ? | Oui (L15) | Oui (try/catch/finally, timeout 8s) |
| **AdminPricing** | `AdminPricing.tsx` | `site_content` | ? | Oui (L29) | Oui (try/catch/finally, timeout 8s) |
| **AdminParametres** | `AdminParametres.tsx` | `admin_params` | ? | Oui (implicit) | Oui (try/catch) |
| **AdminPages** | `AdminPages.tsx` | `site_content` | ? | Oui (L39) | Oui (try/catch, timeout 8s, cancelled) |
| **AdminHeaderFooter** | `AdminHeaderFooter.tsx` | `site_content` | ? | Oui (L28) | Oui (try/catch, timeout 8s, cancelled) |
| **AdminMedia** | `AdminMedia.tsx` | Aucune (API locale) | N/A | N/A | Oui (try/catch) |
| **AdminLeads** | `AdminLeads.tsx` | `contacts` (via fetch direct) | Oui -- `SELECT TO authenticated` mais utilise ANON_KEY | N/A (fetch direct) | Oui (try/catch) |

**Legende RLS** :
- `?` = Table non definie dans `supabase.sql` -- politiques RLS inconnues/non versionnees
- `Oui (auth.uid()=id)` = La policy ne permet de lire QUE le propre profil de l'utilisateur connecte, ce qui BLOQUE la lecture de tous les profils par un admin

---

## Resume des actions prioritaires

1. **CRITIQUE** : Creer des policies RLS admin pour `profiles`, `quotes`, `invoices`, `partners`, `products`, `site_content`, `admin_params` (ex: `USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'collaborateur')))`)
2. **CRITIQUE** : Ajouter null-guard `if (!supabase)` dans `AdminInvoices.tsx` (lignes 55 et 85)
3. **IMPORTANT** : Wrapper `<App />` dans `<ErrorBoundary>` dans `main.tsx`
4. **IMPORTANT** : Ajouter le statut `non_conforme` dans `AdminDashboard`, `AdminSuiviAchats`, `AdminAnalytics`
5. **IMPORTANT** : Corriger `AdminLeads.tsx` pour utiliser `supabaseAdmin` au lieu de `fetch()` direct
6. **PERFORMANCE** : Lazy-load des composants admin avec `React.lazy()`
7. **CLEANUP** : Supprimer les 5 fichiers dupliques dans `/utils/generate*.ts`
8. **SECURITE** : Ajouter DOMPurify pour le contenu `dangerouslySetInnerHTML` dans Legal/Privacy/Terms
9. **BUG MINEUR** : Corriger la cle localStorage dans `DevisForm.tsx` (`'cart'` -> `'rippa_cart'`)
