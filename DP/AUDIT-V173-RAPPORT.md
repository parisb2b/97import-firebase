# Rapport d'audit multi-profils — 97import-firebase (v173)

Date : 2026-05-17 | Méthodologie : systematic-debugging → focused-fix → playwright

---

## 1. Anomalies détectées et statut

| ID | Criticité | Description | Fichier | Statut |
|----|-----------|-------------|---------|--------|
| ANO-001 | **CRITIQUE** | Promotion partenaire écrit `users/{uid}` mais le hook lit `users/{email}` | `PromouvoirPartenaireModal.tsx:66` | ✅ Corrigé |
| ANO-002 | **CRITIQUE** | Règle `partnerCodeMatches` vérifie champ inexistant `partenaire_code` sur user | `firestore.rules:33-36` | ✅ Corrigé |
| ANO-003 | **CRITIQUE** | `EspacePartenaire` vérifie custom claims jamais définis | `EspacePartenaire.tsx:77-82` | ✅ Corrigé |
| ANO-004 | **HAUTE** | Storage rules : écriture ouverte à tout utilisateur authentifié | `storage.rules:13` | ✅ Corrigé |
| ANO-005 | **MOYENNE** | `Clients.tsx` charge tous les clients sans pagination | `Clients.tsx:26-27` | ✅ Corrigé |
| ANO-006 | **MOYENNE** | `Profil.tsx` double écriture sans transaction | `Profil.tsx:95-97` | ✅ Corrigé |
| ANO-007 | **BASSE** | `EspacePartenaire` a son propre `onAuthStateChanged` | `EspacePartenaire.tsx:34-70` | 📋 Documenté |

---

## 2. Modifications appliquées (Phase 2)

| Fichier | Changement |
|---------|------------|
| `PromouvoirPartenaireModal.tsx` | Ajout écriture `users/{email}` avec `role` + `partenaire_code` en complément de `users/{uid}` |
| `firestore.rules` | `partnerCodeMatches` : fallback `partners/{uid}.code` en plus de `users/{email}.partenaire_code` |
| `EspacePartenaire.tsx` | Remplacement `getIdTokenResult(true).claims.role` par `getDoc(doc(db, 'users', email))` |
| `storage.rules` | Remplacement `allow write: if request.auth != null` par `firestore.get()` vérifiant `role == 'admin'` |
| `Clients.tsx` | Ajout `limit(500)` sur la requête clients |
| `Profil.tsx` | Remplacement 2× `setDoc` séquentiels par `writeBatch` atomique |

---

## 3. Fichiers de test Playwright (Phase 3)

| Fichier | Profil | Nb tests | Parcours couverts |
|---------|--------|----------|-------------------|
| `parcours-client.spec.ts` | Client Standard | 15 | Catalogue, connexion, inscription, panier, redirections, signature devis |
| `parcours-vip.spec.ts` | Client VIP | 8 | Catalogue VIP, prix négociés, Panier, profil, pricing |
| `parcours-partenaire.spec.ts` | Partenaire VIP | 8 | Login partenaire, vérification Firestore, navigation onglets |
| `parcours-admin.spec.ts` | Administrateur | 14 | Login, dashboard, clients, produits, stock, SAV |
| `regression-ano.spec.ts` | Transverse | 8 | ANO-001 à ANO-007 + robustesse globale |

**Exécution :**
```bash
npx playwright test                      # tous les projets
npx playwright test --project=client     # client standard
npx playwright test --project=regression # régression anomalies
```

---

## 4. Points forts

- Architecture dual-app (admin/front par hostname) robuste et isolée
- Hook `useAuth()` central avec anti-flash admin (loading gate)
- Firestore rules granulaires avec RBAC email-based
- Normalisation `email.trim().toLowerCase()` systématique avant Auth
- Chaîne de fallback profil : `clients/{uid}` → `users/{email}` → minimal
- Pricing engine centralisé avec constantes canoniques (partenaire 1.5×, public 2.0×)

## 5. Risques résiduels

- **Custom claims non déployés** : la vérification de rôle repose uniquement sur Firestore. L'ajout de custom claims via Admin SDK renforcerait la sécurité.
- **Pagination complète** : `limit(500)` est un palliatif. Une pagination par curseur Firestore est recommandée pour la montée en charge.
- **ANO-007 (auth dupliqué)** : le `onAuthStateChanged` dédié d'EspacePartenaire pourrait être unifié en étendant `useAuth()` avec un contexte partenaire.
- **Emulators vs Production** : les tests E2E authentifiés nécessitent les émulateurs Firebase ou des credentials de test dédiés.
