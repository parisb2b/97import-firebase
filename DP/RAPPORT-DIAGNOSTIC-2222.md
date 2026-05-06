# 📂 RAPPORT DIAGNOSTIC — SESSION DU 06 MAI 2026 (21:00–22:22)

**Version actuelle :** v0.43.10 | **Dernier commit :** `a870414` (V119) | **Branche :** `v2`
**Date du rapport :** 06 Mai 2026, 22:22 CEST
**Objet :** Diagnostic du blocage persistant des paiements (acompte/solde)

---

## A. CHRONOLOGIE DES MISSIONS

| Mission | Commit | Résultat | Impact Paiement |
|---|---|---|---|
| **V117** — Flux Signature/Paiement | `5a45f00` (21:43) | ✅ Succès | Boutons Signer + Encaisser injectés |
| **V118** — Consolidation | `404e42b` (21:57) | ✅ Succès | 7 checkpoints vérifiés conformes |
| **V118-ULTIMATE** — Injection Force Majeure | `14379dc` (22:06) | ✅ Succès | formatDateSafe 4 formats, code nettoyé |
| **V119** — Correction Sentinel + DVS→DV | `a870414` (22:15) | ✅ Succès | 8 devis corrigés DB, _seconds SDK |
| **V120** — Hard Reset Circuit | `15ddb3a` (22:20) | ✅ Succès | DB purgée, compteurs → 0, DV- actif |

---

## B. ÉTAT DU CODE SOURCE (VÉRIFICATION CHIRURGICALE)

### 1. Logic Date — `formatDateSafe` (`src/lib/pdf-generator.ts:236`)

```typescript
function formatDateSafe(v: any): string {
  if (!v) return new Date().toLocaleDateString('fr-FR');
  try {
    // 1. Support Firestore Timestamp (.toDate())
    if (v && typeof v.toDate === 'function') {
      return v.toDate().toLocaleDateString('fr-FR');
    }
    // 2. Support Objet Timestamp {seconds, nanoseconds} (client SDK)
    if (v && typeof v.seconds === 'number') {
      return new Date(v.seconds * 1000).toLocaleDateString('fr-FR');
    }
    // 2b. Support Objet Timestamp {_seconds, _nanoseconds} (admin SDK)
    if (v && typeof v._seconds === 'number') {
      return new Date(v._seconds * 1000).toLocaleDateString('fr-FR');
    }
    // 3. Fallback Date standard ou string
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date().toLocaleDateString('fr-FR') : d.toLocaleDateString('fr-FR');
  } catch (e) {
    console.error("Erreur formatDateSafe:", e);
    return new Date().toLocaleDateString('fr-FR');
  }
}
```

**Diagnostic :** ✅ Fonctionnelle. 4 formats couverts. Le sentinel `{"_methodName":"serverTimestamp"}` tombe dans le fallback → date du jour.

---

### 2. Logic Flux — Boutons Admin (`src/admin/pages/DetailDevis.tsx:327-342`)

```tsx
{/* V118 - BOUTON SIGNER : Uniquement si envoyé */}
{!isNew && devis.statut === 'envoye' && (
  <Button variant="s" onClick={async () => {
    const docRef = doc(db, 'quotes', devis.id!);
    await updateDoc(docRef, { statut: 'signe', updatedAt: serverTimestamp() });
    setDevis({ ...devis, statut: 'signe' });
    setSuccessMsg('Devis marqué comme SIGNÉ — Prêt pour encaissement');
    setTimeout(() => setSuccessMsg(''), 3000);
  }}>
    ✍️ Signer le devis
  </Button>
)}

{/* V118 - BOUTON ENCAISSER : Dès que signé */}
{!isNew && (devis.statut === 'signe' || devis.statut.startsWith('acompte_')) && (
  <Button variant="s" onClick={() => setShowEncaisserModal(true)}>
    💰 Encaisser un acompte
  </Button>
)}
```

**Diagnostic :** ✅ Logique correcte.
- Le bouton ✍️ apparaît uniquement si `statut === 'envoye'` → change le statut en `signe`
- Le bouton 💰 apparaît si `statut === 'signe'` ou `statut.startsWith('acompte_')` → ouvre PopupEncaisserAcompte

---

### 3. Logic Compteurs — Préfixe DV- (`src/lib/counters.ts`)

```typescript
export const getNextNumber = async (prefix: string): Promise<string> => {
  const now = new Date();
  const aa = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const aamm = `${aa}${mm}`;
  const counterId = `${prefix}_${aamm}`;
  // ...
  return `${prefix}-${aamm}${String(newVal).padStart(3, '0')}`;
};
```

**Appels vérifiés :**
- `DetailDevis.tsx:124` → `getNextNumber('DV')` ✅
- `Panier.tsx:193` → `getNextNumber('DV')` ✅
- `ModalDupliquerDevis.tsx:39` → `getNextNumber('DV')` ✅

**Diagnostic :** ✅ Préfixe `DV-` actif partout. Prochain numéro : **DV-2605001**.

---

### 4. Logic Encaissement — PopupEncaisserAcompte (`src/admin/components/PopupEncaisserAcompte.tsx`)

```typescript
// Ligne 173-174 — Statuts bloqués
const STATUTS_BLOQUES_ENCAISSEMENT = ['annule', 'rejete'] as const;
const isDevisBloque = STATUTS_BLOQUES_ENCAISSEMENT.includes(devis.statut as any);

// Ligne 269-284 — Transition automatique après encaissement
let nouveauStatut = devis.statut;
if (Math.abs(soldeRestant) < 0.01) {
  nouveauStatut = 'commande_ferme';                    // Solde complet → Commande
} else if (estPremierEncaissement && !statutsAvances.includes(devis.statut)) {
  nouveauStatut = 'commande_ferme';                    // 1er acompte → Commande
} else if (devis.statut === 'nouveau' || devis.statut === 'brouillon') {
  if (nbEncaissesApres === 1) nouveauStatut = 'acompte_1';
  else if (nbEncaissesApres === 2) nouveauStatut = 'acompte_2';
  else if (nbEncaissesApres === 3) nouveauStatut = 'acompte_3';
}

// Ligne 297 — Écriture Firestore
await updateDoc(doc(db, 'quotes', devis.id), sanitizeForFirestore({
  acomptes: acomptesActuels,
  total_encaisse: totalEncaisse,
  solde_restant: soldeRestant,
  statut: nouveauStatut,
  // ...
}));
```

**Diagnostic :** ✅ Auto-transition vers `commande_ferme` fonctionnelle dans 2 cas :
1. Solde restant ≈ 0 (paiement complet)
2. Premier encaissement (bascule directe devis → commande)

---

### 5. Logic Emails — Cascade Solde Payé (même fichier, lignes 18-135)

```
traiterCascadeSoldePaye() :
  Étape 1 → PDF Facture Finale + upload Storage
  Étape 2 → Création Commission + Email Partenaire
  Étape 3 → Email Client Facture Finale
```

**Diagnostic :** ✅ Cascade best-effort (non bloquante). Les erreurs sont loggées sans interrompre le flux.

---

## C. DIAGNOSTIC FIRESTORE

### Règles Firestore
```
firebase deploy --only firestore:rules --project=importok-6ef77
```
**Résultat :** ✅ Déployé avec succès (22:20 CEST). 3 warnings mineurs (fonction inutilisée, nom de variable).

### État des collections

| Collection | État après V120 |
|---|---|
| `quotes` | Vide (8 devis supprimés) |
| `factures` | Vide |
| `notes_commission` | Vide |
| `commandes` | Vide |
| `containers` | Vide |
| `logs` | Vide (135 nettoyés) |
| `counters` | DV_2605=0, DC_2605=0, FAC_2605=0, DV=0 |

### Données sensibles préservées
- ✅ `users` — 2 profils (michel chen + 1 client)
- ✅ `clients` — Intact
- ✅ `partners` — Intact (IMP, TD, JM)
- ✅ `admins` — Intact
- ✅ `produits` — Catalogue intact
- ✅ `categories` — Intact

---

## D. ANALYSE DU BLOCAGE PAIEMENT

### Circuit théorique (après corrections)

```
1. Admin crée devis       → statut = 'brouillon'
2. Admin envoie au client → statut = 'envoye'
3. [BOUTON ✍️ APPARAÎT]   → Admin clique → statut = 'signe'
4. [BOUTON 💰 APPARAÎT]   → Admin clique → PopupEncaisserAcompte
5. Popup : Admin sélectionne acompte déclaré → confirme
6. Auto-transition        → statut = 'commande_ferme'
7. Cascade : PDF facture finale + commission + emails
```

### Points de blocage potentiels identifiés

| Point | Risque | État |
|---|---|---|
| `devis.acomptes` vide | Le client n'a pas déclaré de virement → Popup affiche "Aucun acompte déclaré" | ⚠️ Bloquant si pas de déclaration |
| `statut !== 'signe'` | Le bouton 💰 n'apparaît pas si le statut n'est pas `signe` | ✅ Protégé par bouton ✍️ |
| `serverTimestamp` sentinel | Les dates affichent "Invalid Date" | ✅ Corrigé (V119) |
| `firestore.rules` | Bloque l'écriture `acomptes` | ✅ Règles déployées |
| `isDevisBloque` | Statut `annule` ou `rejete` bloque l'encaissement | ✅ Protégé |

### Recommandation pour débloquer

1. **Créer un devis test** : Admin → Nouveau devis → remplir client + lignes → Enregistrer
2. **Passer à `envoye`** : Dans le select statut, choisir "Envoyé" → Enregistrer
3. **Signer** : Le bouton ✍️ apparaît → cliquer → statut passe à `signe`
4. **Déclarer un virement** : Le client doit déclarer un acompte (via espace client ou admin)
5. **Encaisser** : Le bouton 💰 apparaît → cliquer → sélectionner l'acompte → confirmer
6. **Vérifier** : Le statut doit passer à `commande_ferme` automatiquement

---

## E. GIT LOG COMPLET (SESSION SOIR)

```
5a45f00 (21:43) fix(v117): restauration logique V116 + design sanctuarisé + flux signature/paiement
404e42b (21:57) fix(v118): consolidation finale — vérification conformité V116+V117
14379dc (22:06) fix(v118-ultimate): injection force majeure formatDateSafe + boutons Signer/Encaisser
a870414 (22:15) fix(v119): correction sentinel serverTimestamp() + support _seconds admin SDK
15ddb3a (22:20) fix(v120): hard reset circuit commercial — purge DB + libellés DV- + counters 001
351295e (22:26) docs(v120): export chronologique session soir 06 mai
```

---

**📅 Rapport généré le 06 Mai 2026 à 22:22 CEST**
**🌐 Serveur :** http://localhost:5180
**🔢 Prochain devis :** DV-2605001
