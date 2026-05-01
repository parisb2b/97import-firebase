# Bug 1 — Fiche produit save aléatoire (V44-TER)

> **For agentic workers:** This plan is executed inline by Claude in the current session.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** éliminer le comportement "save aléatoire" sur la fiche produit en isolant les champs gérés par `OngletGestionPrix` du payload de `FicheProduit.handleSave`.

**Architecture:** la fiche produit a deux flux d'écriture indépendants sur le même document Firestore (`handleSave` côté FicheProduit + `validateProductPrices` / `handleSaveOverrides` côté OngletGestionPrix). Le state parent n'est pas resynchronisé après les écritures de prix → quand l'admin clique "Enregistrer", `setDoc({merge:true}, {...product})` réécrase les champs prix avec leur valeur stale. La correction whitelist-exclut ces champs du payload de `handleSave`. `merge:true` préserve alors les champs absents du payload.

**Tech Stack:** TypeScript 5.6, React 19, Firebase Web SDK v12.

**Cause racine confirmée (rapport `systematic-debugging`):**
- `FicheProduit.tsx:135-148` — payload `{...product, …}` spread *all* champs incluant `prix_*` et `date_derniere_validation`.
- `pricingService.ts:216-249` (`validateProductPrices`) écrit les mêmes champs sans remonter dans le state parent.
- Race **déterministe** : VALIDER PRIX ⇒ Enregistrer = écrasement des prix.

**Hors-scope:** ne pas refactorer le state-management complet (sortir des hooks dédiés, etc.). Fix minimal et chirurgical.

---

### Task 1 — Whitelist d'exclusion dans `FicheProduit.handleSave`

**Files:**
- Modify: `src/admin/pages/FicheProduit.tsx:98-189`

- [ ] **Step 1: Ajouter import `sanitizeForFirestore`**

Modifier le bloc d'imports en tête de `FicheProduit.tsx` pour ajouter (defense-in-depth) :

```ts
import { sanitizeForFirestore } from '../../lib/firebaseUtils';
```

- [ ] **Step 2: Modifier `handleSave` — destructurer les champs gérés ailleurs**

Remplacer le bloc `// Calcul complétude à jour` jusqu'à `await setDoc(...)` (FicheProduit.tsx:128-148) par :

```ts
      // Calcul complétude à jour
      const completudeActuelle = calculerCompletude(product);

      // V44-BIS FEAT 7 : flag champs_incomplets calculé à la création
      const nbManquants = CHAMPS_ESSENTIEL.length - completudeActuelle.essentiel;
      const champsIncomplets = nbManquants > 0;

      // V44-TER Bug 1 : exclure les champs gérés exclusivement par OngletGestionPrix.
      // Sans cette exclusion, le merge écrase les prix validés via VALIDER PRIX
      // avec leur valeur stale du state parent (cf. docs/superpowers/plans/2026-05-01-bug1-...).
      const {
        prix_achat_cny: _pcny,
        prix_achat_usd: _pusd,
        prix_achat_eur: _peur,
        prix_achat: _pa,
        prix_public: _ppub,
        prix_partenaire: _ppart,
        prix_public_override: _opub,
        prix_partenaire_override: _opart,
        date_derniere_validation: _dval,
        id: _id,
        ...productSansChampsExternes
      } = product;
      void _pcny; void _pusd; void _peur; void _pa;
      void _ppub; void _ppart; void _opub; void _opart;
      void _dval; void _id;

      const data = sanitizeForFirestore({
        ...productSansChampsExternes,
        completude: {
          essentiel: completudeActuelle.essentiel,
          details: completudeActuelle.details,
          medias: completudeActuelle.medias,
          statut: completudeActuelle.statut,
        },
        champs_incomplets: champsIncomplets,
        updated_at: serverTimestamp(),
        ...(isCreation ? { created_at: serverTimestamp() } : {}),
      });

      await setDoc(doc(db, 'products', ref), data, { merge: !isCreation });
```

Justification :
- `merge: !isCreation` : pour la création, `merge:false` est conservé (création d'un doc fresh sans champs prix — c'est cohérent avec le flow où VALIDER PRIX vient ensuite).
- `sanitizeForFirestore(data)` : élimine tout `undefined` qui pourrait être introduit dans le futur (defense-in-depth contre l'hypothèse #2).
- `void _xxx;` : éviter `noUnusedLocals` errors avec destructuration ignorée.

- [ ] **Step 3: Vérifier que le reload post-save (ligne 175-178) bénéficie automatiquement du fix**

Aucun changement requis. Le `getDoc` post-save lit Firestore — qui contient maintenant les bons prix (préservés par `merge:true` parce qu'on ne les a pas écrits). `setProduct({id, ...snap.data()})` resynchronise le state parent avec les vrais prix.

- [ ] **Step 4: Build TypeScript**

Run: `npm run build`
Expected: PASS sans erreur. Si fail → STOP, rapport.

- [ ] **Step 5: Test fonctionnel manuel à faire par l'admin (post-déploiement)**

Scénario reproduisant la cause racine — DOIT maintenant passer :
1. Ouvrir une fiche produit existante (ex: référence ayant déjà des prix validés).
2. Aller Rubrique 1 → cliquer ✏️ MODE ÉDITION → modifier prix CNY → cliquer ✅ VALIDER PRIX → toast "Prix validés…".
3. Aller onglet ESSENTIEL → modifier le `nom_fr` → cliquer 💾 ENREGISTRER LE PRODUIT.
4. **Attendu après fix :** prix CNY conservé tel que validé en étape 2 (ne revient PAS à l'ancienne valeur).
5. Recharger la page → mêmes valeurs.

- [ ] **Step 6: Commit + tag**

```bash
git add src/admin/pages/FicheProduit.tsx \
        docs/superpowers/plans/2026-05-01-bug1-fiche-produit-stale-state.md
git commit -m "fix(admin/produits): isolate price fields from handleSave (Bug 1 V44-TER)"
git tag checkpoint-v44ter-A-bug1
git push origin v2
git push origin checkpoint-v44ter-A-bug1
```

---

## Self-review

**Spec coverage**
- Bug 1 cause racine : couvert (Task 1 Step 2 — destructure exclusion).
- Build vérifié : Task 1 Step 4.
- Defense-in-depth `sanitizeForFirestore` : Task 1 Step 1+2.
- Commit + tag granulaire : Task 1 Step 6.

**Placeholder scan**
- Aucun "TBD", "TODO", "etc.", "as appropriate". Tous les snippets sont concrets.

**Type consistency**
- `sanitizeForFirestore<T>(obj: T): T` (firebaseUtils.ts:8) → on lui passe un objet et on le passe à `setDoc` qui accepte `DocumentData`. OK.
- `productSansChampsExternes` est de type `Omit<typeof product, prix_*…>` — TypeScript laisse passer car `product: any`.

**Out of scope**
- Bug 2 (CHAMPS_ESSENTIEL) et Bug 3 (Invalid Date) : direct fix sans plan formel, traités après ce plan.

---

## Risques / pièges

1. **Si un futur dev ajoute un champ "prix_xxx" oublié dans la liste** → race revient. Mitigation : commentaire explicite + lien plan.
2. **Le bouton "💾 Enregistrer les overrides" (OngletGestionPrix.tsx:367) écrit `prix_public_override` / `prix_partenaire_override` indépendamment.** Idem que VALIDER PRIX : protégé par la même exclusion.
3. **Création d'un nouveau produit** : `merge:false`, on n'écrit pas les champs prix. C'est OK — VALIDER PRIX vient ensuite. Si admin oublie, le badge `bloquant` (CHAMPS_ESSENTIEL inclura `prix_achat_cny` après Bug 2) le signalera.
