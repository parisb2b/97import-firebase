# V49 Checkpoint B — Firestore Rules RBAC

> **For agentic workers:** This plan is executed inline by Claude in the current session.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** remplacer le fallback `allow read,write: if request.auth != null` par du RBAC granulaire avec rôles `client / partner / admin`, aligné sur le schéma réel des données.

**Architecture:** custom claims Firebase Auth (`request.auth.token.role` + `request.auth.token.partenaire_code` pour les partenaires). Helpers de rule (`isAuth`, `isAdmin`, `isPartner`, `isClient`, `isOwner`). Matchers par collection alignés sur les champs réels (`client_id` UID, `partenaire_code` string). Script Node Admin SDK pour set role admin (pas de Cloud Functions infra).

**Tech Stack:** Firestore Rules v2, Firebase Admin SDK Node.

**Schéma observé (confirmé via grep V49 Checkpoint B) :**
- `quotes/{id}` : `{ client_id (UID), partenaire_code (string), ... }`
- `users/{uid}` : par UID
- `clients/{id}` : `id == UID Firebase Auth` (à confirmer empiriquement)
- `partners/{docId}` : doc Firestore avec champ `code` (le `partenaire_code` lookup)
- `factures/{id}`, `acomptes/{id}`, `commissions/{id}`, `notes_commission/{id}`, `sav/{id}` : structure inférée (`client_id` ou `partenaire_code` selon contexte)
- `products/{id}`, `admin_params/{id}` : déjà publics (Checkpoint A)
- `listes_achat/{id}`, `conteneurs/{id}` : admin only

**Hors-scope:** ne pas migrer le schéma BD (pas de renaming `partenaire_code` → `partenaire_uid`). Travailler avec ce qui existe.

---

### Task 1 — Rédiger les rules RBAC adaptées au schéma réel

**Files:**
- Modify: `firestore.rules` (étendre baseline V49 Checkpoint A)

- [ ] **Step 1: Helpers + collections publiques**

```ts
service cloud.firestore {
  match /databases/{database}/documents {
    // helpers
    function isAuth()    { return request.auth != null; }
    function isAdmin()   { return isAuth() && request.auth.token.role == 'admin'; }
    function isPartner() { return isAuth() && request.auth.token.role == 'partner'; }
    function isClient()  { return isAuth() && (request.auth.token.role == 'client' || request.auth.token.role == null); }
    function isOwner(id) { return isAuth() && request.auth.uid == id; }
    function partnerCodeMatches(code) {
      return isPartner() && request.auth.token.partenaire_code == code;
    }
    ...
  }
}
```

Note : `isClient()` accepte aussi `role == null` pour compatibilité avec les comptes existants (avant déploiement custom claims). Migration progressive.

- [ ] **Step 2: Catalogue public + admin_params**

```ts
match /products/{id}      { allow read: if true; allow write: if isAdmin(); }
match /admin_params/{id}  { allow read: if true; allow write: if isAdmin(); }
```

- [ ] **Step 3: Users / Clients / Partners**

```ts
match /users/{uid} {
  allow read:   if isOwner(uid) || isAdmin();
  allow create: if isAuth();
  allow update: if isOwner(uid) || isAdmin();
  allow delete: if isAdmin();
}

match /clients/{uid} {
  allow read:   if isOwner(uid) || isAdmin()
              || (isPartner() && resource.data.partenaire_code == request.auth.token.partenaire_code);
  allow create: if isAuth();
  allow update: if isOwner(uid) || isAdmin();
  allow delete: if isAdmin();
}

// partners est lu par auth (besoin partenaire_code lookup) mais write admin only
match /partners/{id} {
  allow read:  if isAuth();
  allow write: if isAdmin();
}
```

- [ ] **Step 4: Devis / Factures / Acomptes / Commissions**

```ts
match /quotes/{id} {
  allow read:   if isAdmin()
              || (isAuth() && resource.data.client_id == request.auth.uid)
              || partnerCodeMatches(resource.data.partenaire_code);
  allow create: if isAuth();
  allow update: if isAdmin()
              || partnerCodeMatches(resource.data.partenaire_code);
  allow delete: if isAdmin();
}

match /factures/{id} {
  allow read:  if isAdmin()
             || (isAuth() && resource.data.client_id == request.auth.uid);
  allow write: if isAdmin();
}

match /acomptes/{id} {
  allow read:  if isAdmin()
             || (isAuth() && resource.data.client_id == request.auth.uid);
  allow write: if isAdmin();
}

match /commissions/{id} {
  allow read:  if isAdmin()
             || partnerCodeMatches(resource.data.partenaire_code);
  allow write: if isAdmin();
}

match /notes_commission/{id} {
  allow read:  if isAdmin()
             || partnerCodeMatches(resource.data.partenaire_code);
  allow write: if isAdmin();
}

// Sub-collection price_history (V44-TER)
match /products/{pid}/price_history/{hid} {
  allow read:  if true;       // historique public (cohérent avec catalogue)
  allow write: if isAdmin();
}
```

- [ ] **Step 5: SAV / Listes / Conteneurs**

```ts
match /sav/{id} {
  allow read:   if isAdmin()
              || (isAuth() && resource.data.client_id == request.auth.uid);
  allow create: if isAuth();
  allow update: if isAdmin();
  allow delete: if isAdmin();
}

match /listes_achat/{id} { allow read, write: if isAdmin(); }
match /conteneurs/{id}   { allow read, write: if isAdmin(); }
match /logs/{id}         { allow read, write: if isAdmin(); }
match /counters/{id}     { allow read, write: if isAuth(); }  // numérotation atomique
```

- [ ] **Step 6: Fallback admin-only**

```ts
match /{document=**} {
  allow read, write: if isAdmin();
}
```

- [ ] **Step 7: Build + verify**

`npm run build` doit passer (les rules ne sont pas évaluées au build TS, mais on vérifie pas de régression code).

---

### Task 2 — Script set-role pour parisb2b@gmail.com

**Files:**
- Create: `scripts/set-admin-role.cjs`

- [ ] **Step 1: Créer scripts/set-admin-role.cjs**

```js
// scripts/set-admin-role.cjs — V49 Checkpoint B
// Set custom claim role: 'admin' sur parisb2b@gmail.com.
// Pas de Cloud Functions infra → script Node Admin SDK direct.
// Usage : node scripts/set-admin-role.cjs <email> [role] [partenaire_code]
//   - email  : email Firebase Auth (obligatoire)
//   - role   : 'admin' (default) | 'partner' | 'client'
//   - partenaire_code : optionnel, requis si role='partner'

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.join(__dirname, '..', 'firebase-admin-sdk.json');
if (!fs.existsSync(SA_PATH)) {
  console.error('❌ firebase-admin-sdk.json introuvable a', SA_PATH);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });

const [, , emailArg, roleArg, partenaireArg] = process.argv;
if (!emailArg) {
  console.error('Usage: node scripts/set-admin-role.cjs <email> [role] [partenaire_code]');
  process.exit(1);
}

const role = roleArg || 'admin';
if (!['admin', 'partner', 'client'].includes(role)) {
  console.error('Role invalide :', role);
  process.exit(1);
}

const claims = { role };
if (role === 'partner') {
  if (!partenaireArg) {
    console.error('partenaire_code requis pour role=partner');
    process.exit(1);
  }
  claims.partenaire_code = partenaireArg;
}

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(emailArg);
    await admin.auth().setCustomUserClaims(user.uid, claims);
    console.log(`✅ Custom claims defini pour ${emailArg} (${user.uid}) :`, claims);
    console.log('⚠️ Le user doit re-login (ou rafraichir token) pour que les claims soient appliques.');
  } catch (err) {
    console.error('❌ Echec :', err.message);
    process.exit(1);
  }
})();
```

- [ ] **Step 2: Exécuter pour parisb2b@gmail.com**

```bash
node scripts/set-admin-role.cjs parisb2b@gmail.com admin
```

Output attendu :
```
✅ Custom claims defini pour parisb2b@gmail.com (<uid>) : { role: 'admin' }
```

L'admin doit ensuite RE-LOGIN dans l'app (ou attendre 1h pour rafraîchir le token).

---

### Task 3 — Commit + tag

- [ ] **Step 1: Commit**

```bash
git add firestore.rules scripts/set-admin-role.cjs \
        docs/superpowers/plans/2026-05-01-rules-rbac.md
git commit -m "feat(security): RBAC firestore.rules + set-admin-role script (Checkpoint B V49)"
git tag checkpoint-v49-B-rbac-rules
git push origin v2
git push origin checkpoint-v49-B-rbac-rules
```

⚠️ **Déploiement** : `firebase deploy --only firestore:rules` à exécuter
manuellement par Michel après commit (hors Claude Code, nécessite firebase CLI auth).

---

## Self-review

**Spec coverage**
- Helpers RBAC (isAuth/isAdmin/isPartner/isClient/isOwner) : Task 1 Step 1 ✅
- Public collections : Step 2 ✅
- Users/Clients/Partners : Step 3 ✅
- Devis/Factures/Acomptes/Commissions : Step 4 ✅
- SAV/Listes/Conteneurs : Step 5 ✅
- Fallback admin only : Step 6 ✅
- Set-role script : Task 2 ✅

**Adaptations vs spec brief**
- Le brief utilisait `partner_id == request.auth.uid` (UID Firebase). Schéma réel utilise `partenaire_code` (string code). Adapté via `request.auth.token.partenaire_code` (custom claim séparé).
- `isClient()` accepte `role == null` pour compatibilité avec les comptes existants sans claim — migration progressive.
- `users/{uid}` au lieu de `users/{userId}` du brief (les deux sont équivalents en Firestore Rules).

**Risque résiduel**
- Si un user existant n'a pas de custom claim role → tombe en `isClient()` (read son propre doc, ses devis filtrés par client_id). Acceptable pour rolling deploy.
- Le partenaire doit avoir `request.auth.token.partenaire_code` set par script. Sans ça, `partnerCodeMatches` retourne false → partenaire ne voit RIEN. Donc à set en V49 ou V49-BIS pour les partenaires existants.
- `clients/{uid}` assume `id == Firebase Auth UID`. Si en BD c'est un autre identifiant (numero client custom), accès cassé. Comportement à valider en preview Vercel.
