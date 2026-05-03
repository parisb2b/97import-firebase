# REPRISE-PC-WINDOWS.md — Migration 97import-firebase sur Windows 11

**Date** : 03/05/2026
**Machine source** : Mac Mini (mactell) → **Machine cible** : PC MINI (Windows 11)
**Chemin projet** : `C:\DATA-MC-2030\97import-firebase`

---

## 1. ÉTAT ACTUEL DU PROJET

| Propriété | Valeur |
|-----------|--------|
| **Nom** | 97import-firebase (97import.com) |
| **Version** | v0.43.3 |
| **Branche** | `v2` (ne jamais utiliser `main`) |
| **Dernier commit** | `f03fd5a` — `test(v65): test creation devis reussi` |
| **Dernier tag** | `v65-devis-ok` |
| **Repo GitHub** | `https://github.com/parisb2b/97import-firebase` |
| **Vercel FRONT** | `https://97import-firebase-git-v2-parisb2bs-projects.vercel.app/` |
| **Vercel ADMIN** | `https://97import-firebase-git-v2-parisb2bs-projects.vercel.app/admin` |
| **Firebase Console** | `https://console.firebase.google.com/project/importok-6ef77/` |

### Résumé des dernières missions (V60 → V65)

| Version | Mission | Tag |
|--------|---------|-----|
| V60 | Audit complet, lint 0, catch cleanup, counters rules | `v60-stabilisation-final` |
| V61 | Bucket Storage import2030 → importok-6ef77, storage rules admin | `v61-storage-fix` |
| V62 | UX : login partenaire, police +10%, panier, adresse livraison | `v62-ux-fix` |
| V63 | Tests E2E Playwright (31 tests, 3 parcours) | `v63-e2e-tests` |
| V64 | Audit parcours complet, debug création devis | `v64-audit-parcours` |
| V65 | Déploiement rules, fix bouton panier, création devis OK | `v65-diagnostic-devis`, `v65-devis-ok` |

### Bugs corrigés (18 au total)
- `firestore.rules` counters → `isAuth()`, storage rules → `write: role == 'admin'`
- `firebase.json` bucket → `importok-6ef77.firebasestorage.app`
- Login partenaire dédié (plus de redirection `/connexion`)
- Texte coupé panier (overflow fix), police +10% globale
- Adresse livraison distincte (checkbox Profil.tsx)
- 31 tests Playwright 31/31 verts
- Création de devis restaurée (DVS-2605008 confirmé)

---

## 2. CONFIGURATION TECHNIQUE

### Firebase

| Paramètre | Valeur |
|-----------|--------|
| **Project ID** | `importok-6ef77` |
| **Storage bucket** | `importok-6ef77.firebasestorage.app` |
| **Compte admin** | `parisb2b@gmail.com` |
| **Règles Firestore** | Déployées (V65) — counters `isAuth()`, RBAC granulaire |
| **Règles Storage** | Déployées (V65) — write restreint `role == 'admin'` |

### Stack technique

| Outil | Version |
|-------|---------|
| Node.js | 20.x |
| npm | 10.x |
| Vite | 6.4.2 |
| React | 18.x |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Firebase | 10.x (client), firebase-admin (scripts) |
| Playwright | 1.x (tests E2E) |
| ESLint | 9.x (flat config) |

### Fichiers sensibles (à NE PAS committer)

| Fichier | Emplacement | Rôle |
|---------|-------------|------|
| `firebase-admin-sdk.json` | Racine du projet | Admin SDK (scripts Node) |
| `.env` ou `.env.local` | Racine du projet | Variables d'environnement (Vite) |
| `serviceAccountKey.json` | Racine (si utilisé) | Compte de service Firebase |

### Modèle `.env` (basé sur `.env.example`)

```env
VITE_FIREBASE_API_KEY=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo
VITE_FIREBASE_AUTH_DOMAIN=importok-6ef77.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=importok-6ef77
VITE_FIREBASE_STORAGE_BUCKET=importok-6ef77.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_DEEPL_KEY=...
VITE_RESEND_KEY=...
VITE_EXCHANGE_KEY=...
VITE_APP_ENV=development
VITE_APP_VERSION=v0.43.3
```

### Comptes de test

| Rôle | Email | Connexion | Mot de passe |
|------|-------|-----------|--------------|
| Client | `mc@sasfr.com` | `/connexion` | `20262026` |
| Partenaire | `97importcom@gmail.com` | `/connexion` | `20262026` |
| Admin | `parisb2b@gmail.com` | `/admin` | `20262026` |

---

## 3. PROCÉDURE D'INSTALLATION SUR WINDOWS 11

### 3.1 Prérequis

```powershell
# Vérifier Node.js (version 20+)
node --version

# Installer Firebase CLI
npm install -g firebase-tools

# Installer Git
git --version
```

### 3.2 Cloner le dépôt

```powershell
mkdir C:\DATA-MC-2030
cd C:\DATA-MC-2030
git clone https://github.com/parisb2b/97import-firebase.git
cd 97import-firebase
git checkout v2
```

### 3.3 Installer les dépendances

```powershell
npm install
```

### 3.4 Copier les fichiers sensibles

Depuis une sauvegarde externe (clé USB, cloud, etc.), copier :
- `firebase-admin-sdk.json` → `C:\DATA-MC-2030\97import-firebase\`
- `.env` → `C:\DATA-MC-2030\97import-firebase\`

### 3.5 Vérifier l'absence du fichier `.firebaserc`

```powershell
# Ce fichier a été supprimé en V50-BIS. Il ne doit PAS exister.
# S'il existe, le supprimer.
if (Test-Path .firebaserc) { Remove-Item .firebaserc }
```

### 3.6 Valider l'installation

```powershell
npm run build
npm run lint
```

Doivent afficher :
- `✓ built in X.XXs`
- Aucune erreur ESLint

### 3.7 Configurer Git (fins de ligne)

```powershell
git config core.autocrlf input
```

---

## 4. COMMANDES DE DÉPLOIEMENT

### Vercel (automatique)
Le push sur `origin/v2` déclenche le déploiement automatique. Aucune action manuelle nécessaire.

### Firebase (validation humaine requise)

```powershell
# Déployer les règles Firestore UNIQUEMENT
firebase deploy --only firestore:rules --project=importok-6ef77

# Déployer les règles Storage UNIQUEMENT
firebase deploy --only storage --project=importok-6ef77

# Déployer les deux (sur validation humaine explicite)
firebase deploy --only firestore:rules,storage --project=importok-6ef77
```

**⚠️ Ne JAMAIS lancer `firebase deploy` sans `--only` — cela déploierait tout (hosting, functions, etc.)**

### Commandes de diagnostic

```powershell
# Diagnostic Firestore
node scripts/diagnostic-post-v53.cjs

# Test création devis Admin SDK
node scripts/test-create-devis-v65.cjs

# Tests E2E Playwright
$env:TEST_PASSWORD = "20262026"
npx playwright test --config=tests/playwright.config.ts

# Nettoyage post-tests
node scripts/cleanup-v64.cjs --execute --confirm-cleanup-v64
```

---

## 5. ADAPTATIONS MAC → PC

### 5.1 Chemins

| Mac | Windows |
|-----|---------|
| `~/97import-firebase` | `C:\DATA-MC-2030\97import-firebase` |

### 5.2 Scripts Bash → PowerShell

Les scripts bash (`.sh`) nécessitent **Git Bash** ou **WSL** :

```powershell
# Option 1 : Git Bash (inclus avec Git for Windows)
bash tests/scripts/run-tests.sh client

# Option 2 : WSL
wsl bash tests/scripts/run-tests.sh client
```

Scripts concernés :
- `tests/scripts/run-tests.sh`
- `scripts/reset-database.sh`

### 5.3 Fins de lignes

```powershell
# Configurer Git pour préserver LF
git config core.autocrlf input

# Si des fichiers sont déjà en CRLF :
git add --renormalize .
git commit -m "chore: normalise fins de ligne LF"
```

### 5.4 Variables d'environnement

Sur Windows, créer le fichier `.env` à la racine avec le même format que `.env.example`. Le fichier `.env` est déjà dans `.gitignore`.

Pour les scripts qui nécessitent des variables d'environnement en ligne de commande :
```powershell
# PowerShell
$env:TEST_PASSWORD = "20262026"

# Ou Git Bash / WSL
export TEST_PASSWORD=20262026
```

### 5.5 Différences notables

- **`node`** : identique sur les deux plateformes
- **`npm`** : identique
- **`npx`** : identique
- **Chemins** : utiliser `path.join()` dans les scripts Node.js (déjà fait)
- **Firebase CLI** : la commande `firebase` peut nécessiter `npx firebase` si l'installation globale n'est pas dans le PATH

---

## 6. RÈGLES PERMANENTES (rappel)

1. **Langue** : français uniquement
2. **Branche** : `v2` uniquement — ne jamais toucher `main`
3. **Firebase** : `--project=importok-6ef77` obligatoire
4. **Secrets** : ne jamais commiter `.env`, `firebase-admin-sdk.json`, clés privées
5. **Données protégées** : ne jamais supprimer `users`, `clients`, `partners`, `products`, `categories`, `ports`, `admin_params`, `tarifs_logistiques`, `counters`
6. **Déploiement** : ne jamais lancer `firebase deploy` sans validation humaine explicite
7. **Journal** : mettre à jour `Codex97MAJ.txt` à chaque mission

---

## 7. FICHIERS CLÉS

| Fichier | Rôle |
|---------|------|
| `Codex97MAJ.txt` | Journal central permanent |
| `BUGS-CORRIGES-V65.txt` | Inventaire des bugs corrigés V60→V65 |
| `MAJ-V65.txt` | Rapport dernière mission |
| `firestore.rules` | Règles Firestore (déployées) |
| `storage.rules` | Règles Storage (déployées) |
| `eslint.config.js` | Configuration ESLint 9 |
| `vite.config.ts` | Configuration Vite |
| `tests/playwright.config.ts` | Configuration Playwright |
| `src/lib/firebase.ts` | Initialisation Firebase (adminDb, adminStorage, clientAuth, db) |
| `src/lib/counters.ts` | Générateur de numéros séquentiels |
| `src/lib/logService.ts` | Service de logs unifié |

---

## 8. PROCHAINE MISSION RECOMMANDÉE (V66)

1. Corriger le bouton "Ajouter au panier" dans `Produit.tsx` (déjà fait en V65, à vérifier après déploiement Vercel)
2. Vérifier `/admin/logs` affiche correctement les logs
3. Tester le flux complet création devis → signature → acompte sur le nouveau PC
4. Étendre les tests Playwright aux parcours authentifiés
