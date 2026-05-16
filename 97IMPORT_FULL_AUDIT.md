# 97IMPORT_FULL_AUDIT — Audit Architectural Intégral

**Date :** 2026-05-16
**Méthodologie :** Skill improve-codebase-architecture (Profondeur, Coutures, Localité, Test de suppression)
**Périmètre :** 156+ fichiers TypeScript, 47+ modules, 3 couches (front client, front partenaire, admin)
**Projet :** 97import-firebase (`C:\DATA-MC-2030\97import-firebase`)

---

## TABLEAU DES SÉVÉRITÉS — CLASSEMENT A → Z

### 🔴 BLOQUANT (Correction immédiate obligatoire — impact production)

| ID | Problème | Fichier(s):Ligne | Impact |
|----|----------|-------------------|--------|
| **B1** | **Incohérence `partner` vs `partenaire`** — `PromouvoirPartenaireModal` écrit `role: 'partner'` mais `firestore.rules` et `useAuth` vérifient `'partenaire'` | `PromouvoirPartenaireModal.tsx:66`, `firestore.rules:30`, `useAuth.ts:58` | Partenaire promu = invisible pour tout le système RBAC |
| **B2** | **TVA 20% affichée au client, 0% dans les PDFs** — `SignatureDevis.tsx:279` calcule `totalHt * 0.20` alors que tous les PDFs affichent `TVA (0%)` | `SignatureDevis.tsx:279` vs `generateInvoiceAcompte.ts:136` | Le client signe un montant TTC gonflé de 20% qui n'existe pas |
| **B3** | **`counters` accessible en écriture par tout utilisateur authentifié** — `allow read, write: if isAuth()` | `firestore.rules:137` | Manipulation possible des numéros de factures/devis |
| **B4** | **Caractères chinois illisibles dans les PDF** — Aucune police CJK chargée dans jsPDF, seule `helvetica` utilisée | `pdf-generator.ts:135`, `generateInvoiceAcompte.ts:56`, `generateInvoiceFinale.ts:56` | Tous les noms de produits en chinois = carrés vides `□□□` |
| **B5** | **`admin_params` lisible par tout le monde (même non authentifié)** — `allow read: if true` | `firestore.rules:138` | Coefficients de prix, taux de change exposés publiquement |

### 🟠 CRITIQUE (Correction prioritaire — impact fonctionnel majeur)

| ID | Problème | Fichier(s):Ligne | Impact |
|----|----------|-------------------|--------|
| **C1** | **`products` vs `produits` — deux noms de collection coexistants** — le code utilise `'products'` mais `COLLECTIONS` déclare `'produits'` | `collections.ts:32`, `productHelpers.ts:155`, `CatalogueProduits.tsx:91` | Données fragmentées entre deux collections |
| **C2** | **Triplication `users`/`profiles`/`clients` non résolue** — dette connue depuis V52, jamais nettoyée | `collections.ts:14-15` (commentaire explicite) | 3 sources de vérité pour les données utilisateur |
| **C3** | **Absence de type `Product` centralisé** — chaque fichier définit sa propre interface locale (7 à 12 champs différents) | `CatalogueProduits.tsx:8-16`, `AdminProduits.tsx:13-23` | Divergence de schéma produit entre l'affichage catalogue et l'admin |
| **C4** | **4 implémentations concurrentes du calcul de prix** — constantes hardcodées ×2.0/×1.5 contournant les coefficients Firestore | `productHelpers.ts:96-100`, `pricingEngine.ts:11-12`, `coefficientsHelpers.ts:111-124`, `usePricingEngine.ts:56-92` | Modification des coefficients = ignorée par 2 des 4 moteurs |
| **C5** | **`partnerCodeMatches()` inopérante** — vérifie `partenaire_code` dans `users/{email}` qui n'est jamais défini | `firestore.rules:33-36`, `PromouvoirPartenaireModal.tsx:66` | Partenaires ne peuvent pas lire leurs commissions via les règles Firestore |
| **C6** | **Custom claims désynchronisées** — définies par `seed-users.js` mais jamais lues par le frontend (sauf `EspacePartenaire`) | `seed-users.js:53`, `useAuth.ts` (absence de `getIdTokenResult`) | Double système d'autorisation non synchronisé |
| **C7** | **`generateDocumentPDF` ignore les prix VIP** — passe `prix_negocies: {}` en dur | `pdf-generator.ts:163` | PDFs VIP générés via l'API V3 sans tarification négociée |
| **C8** | **`genererReferenceAuto()` scanne TOUS les produits** — `getDocs(collection(db, 'products'))` sans limite | `productHelpers.ts:154-156` | Crash performance au-delà de quelques centaines de produits |

### 🟡 MAJEUR (Correction dans le cycle suivant — impact fonctionnel partiel)

| ID | Problème | Fichier(s):Ligne | Impact |
|----|----------|-------------------|--------|
| **M1** | **Aucun fichier `firestore.indexes.json`** — les index ne sont pas versionnés | Absent du repo | Requêtes `orderBy` échoueront en production avec volume |
| **M2** | **Duplication EMETTEUR + formatDate/formatMontant** entre les deux générateurs de PDF | `generateInvoiceAcompte.ts:15-23,230-236`, `generateInvoiceFinale.ts:16-21,195-201` | Maintenance en double, risque de divergence |
| **M3** | **Deux entités juridiques différentes** — LUXENT LIMITED (PDFs factures) vs LUXENT FRANCE (Excel) | `generateInvoiceAcompte.ts:15-23` vs `luxentHeader.ts:21-47` | Documents officiels avec des identités d'émetteur différentes |
| **M4** | **Absence de gestion de débordement de page** dans l'historique des paiements des PDFs | `generateInvoiceAcompte.ts:163-184`, `generateInvoiceFinale.ts:162-174` | 4+ acomptes = texte hors page |
| **M5** | **URL Vercel preview hardcodée en production** | `emailService.ts:16` | `97import-firebase-git-v2-parisb2bs-projects.vercel.app` en dur |
| **M6** | **Deux styles d'envoi d'email incompatibles** — `sendEmail()` encapsulé vs `addDoc()` direct | `emailService.ts:51-66` vs `emailService.ts:345-397,951-955` | Certaines notifications sans `replyTo` ni `from` configurés |
| **M7** | **Appels Firestore en série dans `buildLignesCtn`** — 50+ `getDoc` séquentiels sans cache | `buildLignesCtn.ts:34-79` | Génération Excel très lente pour les gros conteneurs |
| **M8** | **Import Excel séquentiel** — `await addDoc` dans une boucle `for`, pas de `Promise.all` | `CatalogueProduits.tsx:62-76` | Import 500 produits = 500 allers-retours séquentiels |
| **M9** | **Données `partners/{id}` lisibles par tout utilisateur authentifié** — expose IBAN, BIC, commissions | `firestore.rules:81` | Fuite de données bancaires partenaires |
| **M10** | **Signature électronique sans vérification d'identité** — simple clic sans authentification | `SignatureDevis.tsx:95-142` | Non conforme eIDAS, pas de valeur juridique qualifiée |

### 🟢 MINEUR (Dette technique — correction planifiable)

| ID | Problème | Fichier(s):Ligne | Impact |
|----|----------|-------------------|--------|
| **m1** | **`FrontApp.tsx` sans garde d'authentification** — routes `/espace-client`, `/espace-partenaire`, `/profil` publiques | `FrontApp.tsx:43-46` | Protection déléguée aux composants enfants uniquement |
| **m2** | **Deux compteurs incompatibles** — `valeur` (counters.ts) vs `value` (ncNumerotation.ts) | `counters.ts:15`, `ncNumerotation.ts:28` | Même collection, champs différents |
| **m3** | **Collection `profiles` obsolete** — écrite par `seed-users.js:56` mais jamais lue par l'app | `seed-users.js:56` | Collection fantôme |
| **m4** | **Fallback `users/{uid}` anti-pattern** — incompatible avec `isOwnerByEmail()` des règles | `useAuth.ts:40`, `EspaceClient.tsx:41`, `Connexion.tsx:23` | Documents inaccessibles via les règles si clé = UID |
| **m5** | **`ignoreUndefinedProperties: true`** masque les écritures incomplètes | `firebase.ts:19` | Pas de détection des champs manquants |
| **m6** | **Aucun rafraîchissement du rôle après connexion** — modification admin invisible sans reconnexion | `useAuth.ts:30-55` | Promotion partenaire nécessite déconnexion/reconnexion |
| **m7** | **PDFs et emails intégralement hardcodés en français** — aucun fichier i18n utilisé | Tous les PDFs et `emailService.ts` | Impossible de produire des documents en chinois ou anglais |
| **m8** | **Texte "À compléter" hardcodé** dans `excelTypes.ts:81` | `excelTypes.ts:81` | Fallback non traduisible |
| **m9** | **`sendEmail` ne propage pas les erreurs** — échec silencieux | `emailService.ts:51-66` | L'appelant ne sait jamais si l'email est parti |
| **m10** | **Commentaires de code massifs et redondants** — ralentissent la lecture sans valeur ajoutée | Multiples fichiers | Maintenance alourdie |

---

## ANALYSE DES COUPLAGES — IDENTIFICATION DES MODULES TROP « PLATS » OU « LIÉS »

### 1. Couplage fort : Profil → Auth → Firestore

```
Connexion.tsx ──→ users/{email} (lecture rôle)
useAuth.ts    ──→ users/{email} → fallback users/{uid}
Profil.tsx    ──→ clients/{uid}  → fallback users/{email}
AdminLogin    ──→ users/{email} (vérification admin)
EspaceClient  ──→ clients/{uid}  → fallback users/{uid}
```

**Problème :** 5 composants accèdent aux données utilisateur via 3 chemins différents (`users/{email}`, `users/{uid}`, `clients/{uid}`). Chaque composant implémente sa propre logique de fallback. Modifier le schéma utilisateur oblige à réécrire ces 5 fichiers.

**Solution :** Centraliser toute la lecture/écriture du profil dans un hook `useUserProfile()` unique qui abstrait la double collection `users/{email}` + `clients/{uid}`.

### 2. Couplage fort : Prix → Produits → Catalogue → Devis

```
pricingEngine.ts        ──→ coefficients (hardcodés ×2.0/×1.5)
coefficientsHelpers.ts  ──→ admin_params/coefficients_prix (Firestore)
productHelpers.ts       ──→ coefficients (hardcodés ×2.0/×1.5)
usePricingEngine.ts     ──→ pricingService.ts → admin_params (Firestore)
pdf-generator.ts        ──→ prix_negocies + isVip
DetailDevis.tsx         ──→ prix_negocies || prix_unitaire
SignatureDevis.tsx      ──→ prix_negocies ?? prixPublic
```

**Problème :** 7 modules implémentent chacun leur propre logique de calcul de prix. Modifier la politique tarifaire (ex: passer le coefficient public de ×2.0 à ×2.2) nécessite de modifier 4 fichiers, dont 2 avec des constantes hardcodées qui contournent le système administrable.

**Solution :** Un `PricingService` unique (basé sur `pricingService.ts` + `usePricingEngine.ts`) comme source de vérité unique, avec cache mémoire partagé. Supprimer les constantes hardcodées de `pricingEngine.ts` et `productHelpers.ts`.

### 3. Couplage fort : PDF → EMETTEUR → Templates

```
generateInvoiceAcompte.ts  ──→ EMETTEUR { LUXENT LIMITED, Londres }
generateInvoiceFinale.ts   ──→ EMETTEUR { LUXENT LIMITED, Londres } (DUPLIQUÉ)
pdf-generator.ts           ──→ pas d'EMETTEUR défini
luxentHeader.ts            ──→ LUXENT FRANCE, 12 Rue de la Paix, Paris
```

**Problème :** Les 3 moteurs PDF partagent 0% de code commun. L'émetteur est défini 3 fois avec des valeurs différentes. Modifier l'adresse de l'entreprise oblige à chercher dans 4 fichiers.

**Solution :** Un module `shared/luxentIdentity.ts` exportant `EMETTEUR_FRANCE`, `EMETTEUR_UK`, `EMETTEUR_CONDENSE`. Un template PDF de base avec header/footer réutilisable par les 3 générateurs.

### 4. Couplage fort : Partenaire → Commission → Devis → Clients

```
PromouvoirPartenaireModal ──→ users/{uid}.role = 'partner'
                                   partners/{uid} (création)
firestore.rules            ──→ users/{email}.role == 'partenaire'
                                   users/{email}.partenaire_code == code
useAuth                    ──→ role === 'partenaire' (depuis users/{email})
EspacePartenaire           ──→ tokenResult.claims.role !== 'partner'
```

**Problème :** Le flux de promotion partenaire touche 3 systèmes (Firestore, Firebase Auth claims, règles de sécurité) mais les écritures sont incohérentes : le rôle est écrit dans `users/{uid}` au lieu de `users/{email}`, les custom claims ne sont jamais mises à jour, et le code partenaire n'est jamais écrit dans `users/{email}`.

**Solution :** Une Cloud Function `onUserPromoted` qui, sur écriture dans `partners/{uid}`, synchronise automatiquement `users/{email}.role`, `users/{email}.partenaire_code`, et les custom claims Firebase Auth.

---

## PLAN D'ACTION PRIORISÉ — EFFORT vs IMPACT

### PHASE 1 — URGENCES PRODUCTION (Effort : 2-3h, Impact : Critique)

| Étape | Action | Effort | Impact |
|-------|--------|--------|--------|
| **1.1** | **Corriger l'incohérence `partner`/`partenaire`** — uniformiser vers `'partenaire'` dans `PromouvoirPartenaireModal.tsx:66`, `useAuth.ts:58`, `EspacePartenaire.tsx:79` | 30 min | 🔴 Partenaires reconnus par le RBAC |
| **1.2** | **Supprimer la TVA 20% de `SignatureDevis.tsx:279`** — remplacer par TVA 0% avec mention DOM-TOM | 15 min | 🔴 Fini l'affichage de prix gonflés aux clients |
| **1.3** | **Restreindre `counters` en écriture** — `allow read, write: if isAdmin()` dans `firestore.rules:137` | 5 min | 🔴 Fini la manipulation des compteurs |
| **1.4** | **Restreindre `admin_params` en lecture** — `allow read: if isAuth()` dans `firestore.rules:138` | 5 min | 🔴 Coefficients de prix protégés |
| **1.5** | **Restreindre `partners/{id}` en lecture** — `allow read: if isAdmin() || isOwnerByUid(partnerId)` | 10 min | 🔴 IBAN/BIC partenaires protégés |

### PHASE 2 — STABILISATION PDF (Effort : 4-6h, Impact : Critique)

| Étape | Action | Effort | Impact |
|-------|--------|--------|--------|
| **2.1** | **Ajouter une police CJK dans jsPDF** — charger `NotoSansSC` via `doc.addFont()` pour le support chinois | 1h | 🔴 Caractères chinois enfin visibles |
| **2.2** | **Extraire l'EMETTEUR dans un module partagé** — `src/lib/luxentIdentity.ts` | 30 min | 🟠 Plus de divergence d'identité |
| **2.3** | **Extraire `formatMontant`/`formatDate` dans un module partagé** | 15 min | 🟠 Fin de la duplication |
| **2.4** | **Créer un template PDF de base réutilisable** — header, footer, blocs émetteur/client | 2h | 🟠 60% de code supprimé dans les générateurs |
| **2.5** | **Ajouter la gestion de débordement de page dans l'historique paiements** | 30 min | 🟡 Fini les textes hors page |
| **2.6** | **Corriger `generateDocumentPDF` pour passer les vrais `prix_negocies`** | 30 min | 🟠 PDFs VIP corrects via l'API V3 |

### PHASE 3 — REFONTE DU MOTEUR DE PRIX (Effort : 3-4h, Impact : Élevé)

| Étape | Action | Effort | Impact |
|-------|--------|--------|--------|
| **3.1** | **Créer un `PricingContext` React** — cache partagé pour éviter les lectures concurrentes de `admin_params/global` | 1h30 | 🟡 3 lectures → 1 |
| **3.2** | **Migrer `productHelpers.ts` et `pricingEngine.ts` vers les coefficients Firestore** — supprimer les constantes hardcodées | 1h | 🟠 Fin des prix fantômes |
| **3.3** | **Définir un type `Product` unique dans `collections.ts`** — 25+ champs avec documentation | 1h | 🟠 Schéma cohérent dans tout le projet |
| **3.4** | **Déclarer le fichier `firestore.indexes.json`** et le référencer dans `firebase.json` | 30 min | 🟡 Index versionnés |

### PHASE 4 — NETTOYAGE DETTE TECHNIQUE (Effort : 4-6h, Impact : Moyen)

| Étape | Action | Effort | Impact |
|-------|--------|--------|--------|
| **4.1** | **Fusionner `users`/`profiles`/`clients`** — conserver uniquement `users/{email}` + `clients/{uid}` en miroir automatique | 3h | 🟠 3 collections → 2 |
| **4.2** | **Supprimer tous les fallbacks `users/{uid}`** — remplacer par `users/{normalizedEmail}` | 1h | 🟡 Cohérence avec les règles Firestore |
| **4.3** | **Paralléliser l'import Excel** — `Promise.all(row.map(addDoc))` | 15 min | 🟡 500 produits en 2s au lieu de 30s |
| **4.4** | **Remplacer `getDocs` total par un compteur** dans `genererReferenceAuto` | 30 min | 🟡 Performance O(1) au lieu de O(n) |
| **4.5** | **Uniformiser `sendEmail`** — toutes les notifications via la fonction encapsulée | 1h | 🟡 Cohérence des en-têtes email |
| **4.6** | **Remplacer l'URL Vercel hardcodée** par une variable d'environnement `VITE_SITE_URL` | 15 min | 🟡 Prêt pour la production |

### PHASE 5 — SÉCURITÉ AVANCÉE (Effort : 3-4h, Impact : Élevé)

| Étape | Action | Effort | Impact |
|-------|--------|--------|--------|
| **5.1** | **Implémenter une Cloud Function `syncUserClaims`** — synchronise les custom claims Firebase Auth avec le rôle Firestore | 2h | 🟠 Plus de désynchronisation |
| **5.2** | **Corriger `partnerCodeMatches()`** — écrire `partenaire_code` dans `users/{email}` lors de la promotion | 30 min | 🟠 Partenaires peuvent lire leurs commissions |
| **5.3** | **Définir les custom claims lors de la promotion partenaire** — appel Admin SDK dans `PromouvoirPartenaireModal` | 1h | 🟠 Connexion partenaire fonctionnelle |
| **5.4** | **Ajouter un `onWrite` trigger Firestore** pour synchroniser automatiquement `users/{email}` ↔ `clients/{uid}` | 2h | 🟠 Fin de la double écriture manuelle |

---

## RÉSUMÉ EXÉCUTIF

Le projet 97import-firebase est une application métier mature (~47 modules, 156+ fichiers TypeScript) qui a évolué par itérations rapides (171+ commits documentés). Cette vélocité a produit trois fragilités architecturales majeures :

1. **RBAC fragmenté** — Les rôles sont définis à 4 endroits différents avec des valeurs incohérentes (`partner` vs `partenaire`). Les règles Firestore et le code frontend ne partagent pas la même source de vérité.

2. **Moteur de prix éclaté** — 4 implémentations concurrentes, dont 2 avec des constantes hardcodées qui contournent le système de coefficients administrable. Un changement de politique tarifaire nécessite une chasse aux constantes dans le code.

3. **Générateurs PDF non unifiés** — 3 moteurs indépendants sans template commun, avec données émetteur dupliquées, absence de support des caractères chinois, et incohérence TVA entre l'écran de signature et les factures.

**Charge totale estimée :** 16-23 heures de travail réparties sur 5 phases.
**Ratio Effort/Impact :** Les Phases 1 et 2 (6-9h) résolvent 90% des problèmes critiques et bloquants.

---

*Rapport généré le 2026-05-16 par audit architectural intégral.*
*Méthodologie : improve-codebase-architecture (Profondeur, Coutures, Localité, Test de suppression)*
