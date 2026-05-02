# Plan V53 — Migration profiles → clients (et déprécation users côté front)

> **Pour les agents qui exécuteront ce plan:** SKILL REQUISE — superpowers:executing-plans (avec checkpoints intermédiaires). Tâches marquées `- [ ]`.

**Goal:** Consolider l'identité utilisateur dans une seule collection `clients` (déjà initialisée en V49 via `migrate-users-to-clients.cjs`) et déprécier les écritures dans `users` côté front et `profiles` côté inscription, en évitant tout downtime ou perte d'identité partenaire.

**Architecture:**
- V49 a déjà créé la collection `clients` (uid = clé) et `migrate-users-to-clients.cjs` a copié les `users` existants.
- V52 a documenté les doublons (audit-v52/AUDIT-COLLECTIONS-DOUBLONS-V52.txt).
- V53 procède par **étapes additives** : on écrit d'abord dans `clients` partout, puis on lit depuis `clients` partout, puis on désactive les écritures dans `users`/`profiles`.

**Tech Stack:** Firebase Web SDK v12, Firestore custom claims, scripts cjs Admin SDK.

**Préconditions V53:**
- V52 mergé sur `v2`
- Backup tag `backup-pre-v53-YYYYMMDD-HHMM` poussé
- `audit-acomptes-v52.cjs` (CP H V52) lancé en `--dry-run` et résultat OK
- Tag snapshot Firestore créé (export GCS via `gcloud firestore export` — Michel manuel)

---

## Edge cases identifiés (EC-1 → EC-11)

Avant tout code, ces cas doivent être couverts par les tâches du plan.

| ID | Cas | Impact si non géré |
|----|-----|--------------------|
| EC-1 | User existe dans `users` mais pas dans `profiles` (utilisateur inscrit avant V12) | `Clients.tsx` ne le voit pas |
| EC-2 | User existe dans `profiles` mais pas dans `users` (orphelin migration) | `AdminLogin.tsx` rejette le user |
| EC-3 | User a un `partenaire_code` dans `users` mais pas dans `clients` | Promotion partenaire perdue |
| EC-4 | User a un `role` custom claim mais pas dans la collection | RBAC OK, doc absent → UI cassée |
| EC-5 | Inscription concurrente (race) — double-write users + profiles + clients partiel | Doc partiel, login échoue |
| EC-6 | Édition `MesAdresses` n'écrit que dans `users` (post-V49) | `clients.adresses` stale |
| EC-7 | Édition `MesInfos` n'écrit que dans `users` (post-V49) | `clients` stale |
| EC-8 | Édition `Profil.tsx` écrit dans `users` ET `profiles` | Triple-write nécessaire pendant transition |
| EC-9 | Promotion partenaire (`PromouvoirPartenaireModal`) écrit `users` uniquement | `clients.role` stale |
| EC-10 | `Clients.tsx` liste `profiles` (ligne 24) | Si `profiles` deprecated, page vide |
| EC-11 | `AdminApp.tsx:241` compte `clients` pour le badge | Compteur != liste affichée → confusion |

---

## File Structure

- `src/lib/userRepository.ts` (NOUVEAU) — Repository abstrait `findUser(uid) / updateUser(uid, data) / promoteToPartner(uid, code)` qui encapsule l'écriture dans `clients` (+ `users` legacy pendant transition).
- `src/admin/pages/Clients.tsx` (MODIFIÉ) — Lit depuis `clients` au lieu de `profiles`.
- `src/admin/pages/DetailClient.tsx` (MODIFIÉ) — Lit `clients` puis fallback `users` puis `profiles`.
- `src/front/pages/Inscription.tsx` (MODIFIÉ) — Triple-write `users + profiles + clients`.
- `src/front/pages/Profil.tsx` (MODIFIÉ) — Triple-write.
- `src/front/pages/espace-client/MesAdresses.tsx` (MODIFIÉ) — Update `users` + `clients`.
- `src/front/pages/espace-client/MesInfos.tsx` (MODIFIÉ) — Update `users` + `clients`.
- `src/admin/components/PromouvoirPartenaireModal.tsx` (MODIFIÉ) — Update `users` + `clients`.
- `scripts/v53-sync-profiles-to-clients.cjs` (NOUVEAU) — `--dry-run` / `--execute`. Itère `profiles` et merge dans `clients` les champs absents.
- `scripts/v53-audit-users-vs-clients.cjs` (NOUVEAU) — `--dry-run` only. Liste les divergences pour validation manuelle.

---

## Tasks

### Task 1 : Backup + audit pré-migration

**Files:**
- Create: tag git `backup-pre-v53-YYYYMMDD-HHMM`
- Create: `scripts/v53-audit-users-vs-clients.cjs`

- [ ] **Étape 1.1** : Tag backup `git tag "backup-pre-v53-$(date +%Y%m%d-%H%M)" && git push origin --tags`
- [ ] **Étape 1.2** : Export Firestore GCS (Michel manuel — `gcloud firestore export gs://importok-6ef77-backups/v53/`)
- [ ] **Étape 1.3** : Créer le script audit `scripts/v53-audit-users-vs-clients.cjs` :
  - hardcoded `PROJECT_ID = 'importok-6ef77'`
  - garde-fou `serviceAccount.project_id !== PROJECT_ID → process.exit(1)`
  - Mode `--dry-run` only (jamais d'execute en V53 task 1)
  - Pour chaque uid dans `users`, vérifier présence dans `profiles` et `clients`, comparer email / role / partenaire_code / adresses
  - Sortie : `audit-v53/USERS-VS-CLIENTS-AUDIT.txt` avec sections `MATCHED`, `DIVERGENT`, `MISSING_IN_CLIENTS`, `MISSING_IN_USERS`, `ORPHAN_PROFILES`
- [ ] **Étape 1.4** : Lancer le script en `--dry-run`
- [ ] **Étape 1.5** : Inspecter `audit-v53/USERS-VS-CLIENTS-AUDIT.txt`. Si > 5 divergences critiques (role, partenaire_code), STOP et demander instruction Michel.
- [ ] **Étape 1.6** : Commit + tag `checkpoint-v53-1-audit-pre-migration`

### Task 2 : userRepository abstrait

**Files:**
- Create: `src/lib/userRepository.ts`
- Test : pas de runtime test framework (à créer ad-hoc en console si besoin).

- [ ] **Étape 2.1** : Définir l'interface :
  ```ts
  export async function findUser(uid: string): Promise<UserDoc | null>;
  export async function updateUser(uid: string, partial: Partial<UserDoc>): Promise<void>;
  export async function promoteToPartner(uid: string, partenaireCode: string): Promise<void>;
  ```
- [ ] **Étape 2.2** : `findUser` lit dans cet ordre : `clients` → `users` → `profiles` (fallback chain)
- [ ] **Étape 2.3** : `updateUser` écrit dans `clients` ET `users` (transition double-write). Pas dans `profiles`.
- [ ] **Étape 2.4** : `promoteToPartner` set le custom claim via Cloud Function (ou retourne instructions Michel) + update `clients.role` + `users.role` + `users.partenaire_code` + `clients.partenaire_code`
- [ ] **Étape 2.5** : Build vert
- [ ] **Étape 2.6** : Commit + tag `checkpoint-v53-2-user-repository`

### Task 3 : Migration sites de lecture admin

**Files:**
- Modify: `src/admin/pages/Clients.tsx:24`
- Modify: `src/admin/pages/DetailClient.tsx:20-21`

- [ ] **Étape 3.1** : `Clients.tsx` — remplacer `collection(db, 'profiles')` par `collection(db, 'clients')`. Vérifier que les champs (email, nom, role, createdAt) sont présents en `clients` (post script v53-sync).
- [ ] **Étape 3.2** : `DetailClient.tsx` — utiliser `findUser(uid)` du repository.
- [ ] **Étape 3.3** : Build vert + test manuel local : ouvrir `/admin/clients` → la liste doit afficher les mêmes users qu'avant.
- [ ] **Étape 3.4** : Commit + tag `checkpoint-v53-3-admin-reads`

### Task 4 : Sync profiles → clients (script execute)

**Files:**
- Create: `scripts/v53-sync-profiles-to-clients.cjs`

- [ ] **Étape 4.1** : Créer le script avec garde-fous standards (PROJECT_ID, serviceAccount check)
- [ ] **Étape 4.2** : `--dry-run` : pour chaque doc dans `profiles`, vérifier si `clients` a tous les champs. Lister les merges nécessaires.
- [ ] **Étape 4.3** : Lancer `--dry-run`. Inspecter sortie.
- [ ] **Étape 4.4** : `--execute` : merge des champs absents dans `clients` (jamais d'overwrite). Atomique par batch de 100.
- [ ] **Étape 4.5** : Lancer `--execute` (avec confirmation Michel).
- [ ] **Étape 4.6** : Re-lancer `v53-audit-users-vs-clients.cjs --dry-run` → `MISSING_IN_CLIENTS` doit être vide.
- [ ] **Étape 4.7** : Commit script + tag `checkpoint-v53-4-sync-profiles`

### Task 5 : Migration sites d'écriture front

**Files:**
- Modify: `src/front/pages/Inscription.tsx:44,45,64,70` (triple-write)
- Modify: `src/front/pages/Profil.tsx:63,77` (triple-write)
- Modify: `src/front/pages/espace-client/MesAdresses.tsx:31` (double-write users+clients)
- Modify: `src/front/pages/espace-client/MesInfos.tsx:21` (double-write users+clients)
- Modify: `src/admin/components/PromouvoirPartenaireModal.tsx:66` (use repository)

- [ ] **Étape 5.1** : Inscription — utiliser `userRepository.updateUser` après `setDoc` initial dans `clients`.
- [ ] **Étape 5.2** : Profil — idem.
- [ ] **Étape 5.3** : MesAdresses — utiliser `userRepository.updateUser({adresses})`.
- [ ] **Étape 5.4** : MesInfos — utiliser `userRepository.updateUser(infos)`.
- [ ] **Étape 5.5** : PromouvoirPartenaireModal — utiliser `userRepository.promoteToPartner(uid, code)`.
- [ ] **Étape 5.6** : Build vert + tests manuels Vercel preview :
  - inscription nouveau user → vérifier `clients` + `users` + `profiles` tous écrits
  - édition adresse → vérifier `clients.adresses` synchro
  - promotion partenaire → vérifier `clients.role` = 'partner'
- [ ] **Étape 5.7** : Commit + tag `checkpoint-v53-5-front-writes`

### Task 6 : Déprécier `profiles` côté front (lecture)

**Files:**
- Modify: `src/front/pages/Profil.tsx:30` — lire depuis `clients` puis fallback `users`.

- [ ] **Étape 6.1** : Profil.tsx — `findUser(uid)` au lieu de `getDoc(profiles, uid)`.
- [ ] **Étape 6.2** : Build vert + test login user existant → données affichées correctement.
- [ ] **Étape 6.3** : Commit + tag `checkpoint-v53-6-front-reads`

### Task 7 : Désactiver écriture profiles (Inscription, Profil)

**Files:**
- Modify: `src/front/pages/Inscription.tsx` — supprimer setDoc(profiles).
- Modify: `src/front/pages/Profil.tsx` — supprimer setDoc(profiles).

- [ ] **Étape 7.1** : Conditionner par feature flag (`process.env.VITE_DISABLE_PROFILES_WRITE`) pour rollback rapide.
- [ ] **Étape 7.2** : Build vert + nouvel inscrit → vérifier que `profiles` n'est PAS créé, mais `clients` + `users` le sont.
- [ ] **Étape 7.3** : Soak test 7 jours sur Vercel preview avant merge prod.
- [ ] **Étape 7.4** : Commit + tag `checkpoint-v53-7-profiles-write-disabled`

### Task 8 : Rapport MAJ-V53.txt + tag final

- [ ] **Étape 8.1** : Écrire `MAJ-V53.txt` ~600 lignes avec sections : Phase 0, CP 1-7, ACTIONS HORS CLAUDE CODE (commandes Firebase pour Michel), ROLLBACK PLAN.
- [ ] **Étape 8.2** : Commit + tag `v53-final` + push.

---

## Critères STOP

- Si `audit-v53/USERS-VS-CLIENTS-AUDIT.txt` montre > 5 divergences critiques (role, partenaire_code) → STOP, demander instruction Michel.
- Si build rouge à n'importe quelle étape → STOP, debug avant de continuer.
- Si la migration script `--execute` échoue mid-batch → rollback via `firestore restore` du backup GCS, NE PAS retenter sans audit.

## Rollback Plan

- Tag backup : `backup-pre-v53-YYYYMMDD-HHMM`
- Commande : `git reset --hard backup-pre-v53-YYYYMMDD-HHMM`
- Restauration BD : `gcloud firestore import gs://importok-6ef77-backups/v53/<TIMESTAMP>` (Michel manuel)
- Feature flag `VITE_DISABLE_PROFILES_WRITE=false` pour réactiver écriture profiles

## Hors scope V53

- Suppression effective de `profiles` (collection conservée jusqu'à V55+, pour audit)
- Suppression de `users` (V60+ — chaîne RBAC à refactor)
- Renommage `logistics_invoices` → `frais_logistique` (V55+)
