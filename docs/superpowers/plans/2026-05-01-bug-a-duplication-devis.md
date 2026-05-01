# Bug A — Duplication devis crash Firestore (V45)

> **For agentic workers:** This plan is executed inline by Claude in the current session.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** rendre la duplication de devis robuste en éliminant la cause `Unsupported field value: undefined` lors du `setDoc(quotes/DVS-XXXX)`.

**Architecture:** `ModalDupliquerDevis.handleConfirm` construit un payload `newDevis` par spread `...devisSource` + override des champs business. La ligne 59 contient un `prix_vip_negocie: undefined` explicite, et le spread propage potentiellement d'autres `undefined` provenant du devis source. Sans `ignoreUndefinedProperties` côté Firestore (cf. V44-TER), tout `undefined` provoque l'échec.

**Tech Stack:** TypeScript 5.6, React 19, Firebase Web SDK v12.

**Cause racine confirmée (rapport `systematic-debugging`):**
- `src/admin/components/ModalDupliquerDevis.tsx:59` — `prix_vip_negocie: undefined` explicite.
- Spread `...devisSource` + spread `...l` peut propager d'autres `undefined`.
- `src/lib/firebase.ts` — pas d'`ignoreUndefinedProperties: true` (vérifié en V44-TER).

**Hors-scope:** ne pas activer `ignoreUndefinedProperties` global (decision V44-TER : fix ciblé). Ne pas modifier la sémantique des champs business (les resets sont déjà conformes au spec V45).

---

### Task 1 — Fix `ModalDupliquerDevis.handleConfirm`

**Files:**
- Modify: `src/admin/components/ModalDupliquerDevis.tsx:1-80`

- [ ] **Step 1: Ajouter import `sanitizeForFirestore`**

Modifier les imports en tête de fichier :

```ts
import { sanitizeForFirestore } from '../../lib/firebaseUtils';
```

- [ ] **Step 2: Remplacer le `undefined` explicite par `null` (sémantique correcte)**

Dans le map `lignes` (lignes 57-61), remplacer :

```ts
lignes: (devisSource.lignes || []).map((l: any) => ({
  ...l,
  prix_vip_negocie: undefined,
  prix_unitaire_final: l.prix_unitaire,
})),
```

Par :

```ts
lignes: (devisSource.lignes || []).map((l: any) => ({
  ...l,
  // V45 Bug A : null au lieu de undefined (Firestore refuse undefined sans
  // ignoreUndefinedProperties). null exprime correctement "pas de prix VIP négocié".
  prix_vip_negocie: null,
  prix_unitaire_final: l.prix_unitaire ?? l.prix_unitaire_final ?? 0,
})),
```

Justification additionnelle : `prix_unitaire_final` recevait `l.prix_unitaire` directement — si `l.prix_unitaire` est `undefined` (devis ancien ou format mixte), on tombait dans le même piège. Le `??` chain garantit un nombre.

- [ ] **Step 3: Appliquer `sanitizeForFirestore` au payload avant `setDoc`**

Remplacer le bloc :

```ts
      // Le doc Firestore aura comme ID le nouveau numéro — on supprime l'ID source
      delete newDevis.id;

      await setDoc(doc(db, 'quotes', newNumero), newDevis);
```

Par :

```ts
      // Le doc Firestore aura comme ID le nouveau numéro — on supprime l'ID source
      delete newDevis.id;

      // V45 Bug A : defense-in-depth contre les undefined propagés par
      // ...devisSource ou ...l (Firestore SDK n'a pas ignoreUndefinedProperties).
      const cleanedDevis = sanitizeForFirestore(newDevis);

      await setDoc(doc(db, 'quotes', newNumero), cleanedDevis);
```

- [ ] **Step 4: Build TypeScript**

Run: `npm run build`
Expected: `✓ built` exit 0. Si fail → STOP, rapport.

- [ ] **Step 5: Test fonctionnel manuel à effectuer post-déploiement**

1. Aller sur la liste devis admin.
2. Trouver un devis source ayant des champs susceptibles d'être `undefined` (devis VIP avec `prix_vip_negocie` non renseigné, ou devis ancien sans `prix_unitaire` sur certaines lignes).
3. Cliquer sur l'action "Dupliquer ce devis" → modal s'ouvre.
4. Cliquer "📋 Dupliquer maintenant".
5. **Attendu après fix :** redirection vers le nouveau devis (ID = nouveau numéro DVS-AAMM-NNN), aucune erreur Firestore.
6. Sur le nouveau devis, vérifier :
   - `statut === 'nouveau'`
   - `acomptes === []`, `total_encaisse === 0`
   - `is_vip === false`, `prix_negocies === {}`
   - `lignes[*].prix_vip_negocie === null`
   - `date_signature === null`, `signature_token === null`
   - `duplique_de === <numero_source>` et `duplique_le === ISO timestamp`

- [ ] **Step 6: Commit + tag**

```bash
git add src/admin/components/ModalDupliquerDevis.tsx \
        docs/superpowers/plans/2026-05-01-bug-a-duplication-devis.md
git commit -m "fix(admin/devis): sanitize duplication payload + null prix_vip (Bug A V45)"
git tag checkpoint-v45-A-duplication
git push origin v2
git push origin checkpoint-v45-A-duplication
```

---

## Self-review

**Spec coverage**
- Cause `undefined` éliminée (Step 2 explicit + Step 3 sanitize).
- Resets business préservés (déjà conformes au spec V45 — pas de modification).
- Build vérifié (Step 4).
- Tests manuels documentés (Step 5).
- Tag granulaire (Step 6).

**Placeholder scan**
- Aucun TBD. Code complet montré.

**Type consistency**
- `sanitizeForFirestore<T>(obj: T): T` (firebaseUtils.ts:8) → utilisé sur un `any` (newDevis), pas de souci.
- `setDoc` accepte `DocumentData` qui tolère `null` mais pas `undefined`. ✅
