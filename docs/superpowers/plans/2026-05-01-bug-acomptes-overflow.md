# Bug Checkpoint D — Acomptes overflow / max 3 contournable (V46)

> **For agentic workers:** This plan is executed inline by Claude in the current session.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** empêcher la création d'acomptes dont la somme dépasse le total du devis et l'empilement de >3 déclarations en attente d'encaissement.

**Architecture:** la validation des acomptes vit dans `src/lib/quoteStatusHelpers.ts`. Trois call sites :
- **Encaissement (admin)** : `src/admin/components/PopupEncaisserAcompte.tsx:185-198` — passe `acomptes.filter(a.encaisse===true)` à `validerNouveauPaiement` + `acomptes` complet à `prochainPaiementEstSolde`.
- **Déclaration (espace-client)** : `src/front/pages/espace-client/PopupAcompte.tsx:91-96` — passe TOUS les acomptes (encaissés + déclarés non-encaissés).
- **Affichage** : `DetailDevis.tsx`, `AcomptesEncaisser.tsx`, `generateInvoiceAcompte/Finale` — utilisent `getTotalEncaisse` / `getSoldeRestant` pour KPI cash réel reçu (NE PAS modifier).

**Tech Stack:** TypeScript 5.6, React 19, Firebase Web SDK v12.

**Cause racine confirmée (rapport `systematic-debugging`):**
- `getSoldeRestant(total_ht, acomptes)` (ligne 63) délègue à `getTotalEncaisse` qui filtre `encaisse === true`. Ne déduit pas les acomptes déclarés non-encaissés.
- `validerNouveauPaiement` (ligne 98-114) appelle `getSoldeRestant`. En chemin déclaration, le restant retourné est trop généreux → admin/client peut empiler N déclarations.
- `prochainPaiementEstSolde` (ligne 84) compte uniquement les encaissés. Règle "max 3" contournable tant qu'aucun n'est encaissé.

**Découverte annexe :** `getMontantRestantAVerser` dans `devisHelpers.ts:52-58` calcule déjà le bon restant (encaissés + déclarés). Existe mais non-utilisée par les validateurs — à inline dans `validerNouveauPaiement`.

**Hors-scope:** ne pas modifier `getSoldeRestant`/`getTotalEncaisse`/`getNbAcomptesEncaisses` (utilisés pour KPI affichage = vrai cash reçu — sémantique correcte pour ce cas).

---

### Task 1 — Renforcer `validerNouveauPaiement` + `prochainPaiementEstSolde` + `peutAjouterAcompte`

**Files:**
- Modify: `src/lib/quoteStatusHelpers.ts:67-114`

- [ ] **Step 1: Ajouter helper `getNbAcomptesDeclares` (count tous non-soldés)**

Insérer après `getNbAcomptesEncaisses` (ligne 72) :

```ts
/**
 * V46 Checkpoint D — Nombre total d'acomptes DÉCLARÉS (encaissés + en attente)
 * hors solde forcé. Utilisé pour la limite "max 3 acomptes" en amont
 * du chemin d'encaissement (sinon contournable).
 */
export function getNbAcomptesDeclares(acomptes: Acompte[] = []): number {
  return acomptes.filter(a => !a.is_solde).length;
}
```

- [ ] **Step 2: Modifier `peutAjouterAcompte` (max 3 sur les déclarations)**

Remplacer la fonction (ligne 77-79) par :

```ts
/**
 * Peut-on encore ajouter un acompte partiel ? (max 3 sur les declarations,
 * encaissees OU en attente — V46 Checkpoint D, anciennement comptait
 * uniquement les encaissees ce qui permettait d'empiler des declarations).
 */
export function peutAjouterAcompte(acomptes: Acompte[] = [], soldeRestant: number): boolean {
  return getNbAcomptesDeclares(acomptes) < 3 && soldeRestant > 0.01;
}
```

- [ ] **Step 3: Modifier `prochainPaiementEstSolde` (compte tous les déclarés)**

Remplacer la fonction (ligne 84-86) par :

```ts
/**
 * Le prochain paiement doit-il etre le solde force ?
 * V46 Checkpoint D : compte les declarations totales (encaissees + en attente),
 * pas seulement les encaissees — la regle "4eme = solde force" doit s'appliquer
 * des qu'on a 3 declarations meme si admin n'a pas encore encaisse.
 */
export function prochainPaiementEstSolde(acomptes: Acompte[] = []): boolean {
  return getNbAcomptesDeclares(acomptes) >= 3;
}
```

- [ ] **Step 4: Modifier `validerNouveauPaiement` (calcul restant sur tous les acomptes passés)**

Remplacer la fonction (ligne 98-114) par :

```ts
/**
 * Valide un nouveau paiement avant enregistrement.
 *
 * V46 Checkpoint D — calcul du restant base sur la SOMME DE TOUS LES ACOMPTES
 * non-soldes passes en parametre (encaisses ET en attente d'encaissement).
 * Le caller controle ce qu'il passe :
 *   - chemin DECLARATION : passe `acomptes` complet → restant strict
 *   - chemin ENCAISSEMENT : passe `acomptes.filter(a.encaisse===true)` →
 *     restant = total_ht - encaisses (semantique inchangee, l'acompte cible
 *     n'est pas dans la liste donc son ajout est bien valide).
 *
 * Avant V46 : utilisait getSoldeRestant qui filtrait encaisse===true en interne
 * → declaration path retournait un restant trop genereux ignorant les
 * declarations en attente. Bug 7p07 (Michel V46).
 */
export function validerNouveauPaiement(
  total_ht: number,
  acomptes: Acompte[] = [],
  montant: number
): { ok: boolean; erreur?: string } {
  if (montant < 50) {
    return { ok: false, erreur: 'Montant minimum : 50€ par paiement' };
  }
  // Somme de tous les acomptes passes (hors solde force) — peu importe encaisse.
  const totalDejaAcompte = acomptes
    .filter(a => !a.is_solde)
    .reduce((sum, a) => sum + (a.montant || 0), 0);
  const restant = Math.max(0, total_ht - totalDejaAcompte);

  if (montant > restant + 0.01) {
    return {
      ok: false,
      erreur: `Acompte impossible : reste à payer = ${restant.toFixed(2)} €, vous saisissez ${montant.toFixed(2)} €`,
    };
  }
  if (prochainPaiementEstSolde(acomptes) && Math.abs(montant - restant) > 0.01) {
    return { ok: false, erreur: `4e paiement = solde forcé (${restant.toFixed(2)}€ obligatoire)` };
  }
  return { ok: true };
}
```

- [ ] **Step 5: Build TypeScript**

Run: `npm run build`
Expected: `✓ built` exit 0. Si fail → STOP, rapport.

- [ ] **Step 6: Vérification non-régression callers**

| Caller                                      | Avant fix                                    | Après fix                                                                                                  | Régression ? |
|---------------------------------------------|----------------------------------------------|------------------------------------------------------------------------------------------------------------|--------------|
| `PopupEncaisserAcompte` `validerNouveauPaiement` (passe filter encaisse===true) | restant = total_ht - sum(encaisses)          | restant = total_ht - sum(acomptes_passes) = sum(encaisses) ✓ identique                                     | ❌ aucune     |
| `PopupEncaisserAcompte` `prochainPaiementEstSolde` (passe ALL)                   | true si 3 encaisses                          | true si 3 declares (≥ 3 encaisses) → fire plus tot                                                         | comportement V46 voulu |
| `PopupAcompte` `validerNouveauPaiement` (passe ALL)                              | restant = total_ht - sum(encaisses) (BUG)    | restant = total_ht - sum(declares + encaisses) ✓ correct                                                    | corrige le bug |
| `PopupAcompte` `prochainPaiementEstSolde` / `getSoldeRestant` (lignes 47/48/62/64/91/92) | n/a / unchanged                              | `getSoldeRestant` inchangee (KPI affichage) ; `prochainPaiementEstSolde` voit la 4eme declaration → solde force | comportement V46 voulu |
| `AcomptesEncaisser.tsx` (utilise `getNbAcomptesEncaisses` + `getSoldeRestant` + `getTotalEncaisse`) | unchanged                                    | unchanged (fonctions inchangees)                                                                           | ❌ aucune     |
| `DetailDevis.tsx` (`prochainPaiementEstSolde`, `getSoldeRestant`)                | n/a                                          | `getSoldeRestant` inchangee ; `prochainPaiementEstSolde` plus strict                                       | comportement V46 voulu |
| Generators PDF (`getTotalEncaisse`, `getSoldeRestant`)                           | unchanged                                    | unchanged                                                                                                  | ❌ aucune     |

- [ ] **Step 7: Tests fonctionnels manuels (post-déploiement)**

1. Devis 1000€, 0 acompte. Déclarer 600€ → OK.
2. Devis 1000€, 600€ déclaré non-encaissé. Tenter déclarer 500€ → REFUSÉ avec message "Acompte impossible : reste à payer = 400.00 €, vous saisissez 500.00 €".
3. Devis 1000€, 600€ déclaré non-encaissé. Déclarer 400€ → OK.
4. Devis 1000€, 3 acomptes déclarés (totalisant < 1000€). Tenter 4ème acompte avec montant ≠ restant → REFUSÉ avec message "4e paiement = solde forcé".
5. Devis 1000€, 3 acomptes déclarés totalisant 1000€. `peutAjouterAcompte` → false (max 3 atteints + restant = 0).
6. Encaissement 4ème acompte (qui est le solde forcé déclaré au 3) → OK.

- [ ] **Step 8: Commit + tag**

```bash
git add src/lib/quoteStatusHelpers.ts \
        docs/superpowers/plans/2026-05-01-bug-acomptes-overflow.md
git commit -m "fix(devis/acomptes): validate against ALL declared acomptes (Checkpoint D V46)"
git tag checkpoint-v46-D-acomptes-validation
git push origin v2
git push origin checkpoint-v46-D-acomptes-validation
```

---

## Self-review

**Spec coverage**
- Règle business 1 : "Maximum 3 acomptes par devis" → `getNbAcomptesDeclares < 3` (Step 1+2+3).
- Règle business 2 : "Total des acomptes ≤ montant_total_devis" → restant calculé sur tous les acomptes (Step 4).
- Message d'erreur exact spec : "Acompte impossible : reste à payer = X €, vous saisissez Y €" (Step 4).
- 4ème = solde forcé : `prochainPaiementEstSolde` modifié (Step 3).
- Tests obligatoires V46 : 6 scénarios (Step 7).

**Placeholder scan**
- Aucun TBD. Code complet montré.

**Type consistency**
- `Acompte` interface inchangée. Toutes les nouvelles fonctions retournent les mêmes types qu'avant.
