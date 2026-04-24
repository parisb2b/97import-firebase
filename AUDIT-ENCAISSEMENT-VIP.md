# AUDIT — Encaissement acompte VIP (DVS-2604024)
**Date** : 2026-04-24 11:20
**Objectif** : identifier où les prix VIP se perdent dans le flow d'encaissement

---

## 🎯 HYPOTHÈSE VALIDÉE

Le prix VIP (25000 €) est correctement stocké dans `devis.prix_negocies[ref]` ET correctement passé au générateur PDF, MAIS :
- ✅ Le popup d'encaissement passe TOUTES les données VIP au générateur
- ✅ Les données VIP existent dans Firestore (is_vip=True, prix_negocies map, total_ht=25000)
- ❌ **Le générateur `generateFactureAcompte` n'UTILISE PAS ces données VIP**
- ❌ Conséquence : la facture PDF affiche `ligne.prix_unitaire` (28050 €) au lieu du prix négocié (25000 €)

**Conclusion** : Le problème est **uniquement** dans `generateFactureAcompte` ligne 580 de `pdf-generator.ts`.

---

## 🔍 FLOW D'ENCAISSEMENT (complet)

```
1. AcomptesEncaisser.tsx (src/admin/pages/AcomptesEncaisser.tsx)
   → Liste les devis avec acomptes déclarés
   → Affiche total_ht = 25000 € (VIP, correct) ✅
   → Bouton "Encaisser" ouvre PopupEncaisserAcompte
   → Passe le devis COMPLET en props

2. PopupEncaisserAcompte.tsx (src/admin/components/PopupEncaisserAcompte.tsx)
   → Reçoit devis complet avec TOUTES les propriétés :
      * devis.is_vip = true
      * devis.prix_negocies = { "MP-R32-001": 25000 }
      * devis.total_ht = 25000
      * devis.total_ht_public = 28050
      * devis.lignes = [{ ref: "MP-R32-001", prix_unitaire: 28050, qte: 1, ... }]
   → N'affiche PAS les lignes dans l'interface (uniquement les acomptes) ✅
   → Au clic "Confirmer" (ligne 82-89) :

3. Appel au générateur PDF
   const pdfDoc = generateFactureAcompte(
     {
       ...devis,              // ← Spread COMPLET avec is_vip, prix_negocies, etc.
       acomptes: acomptesActuels,
     },
     acomptesActuels[selectedIndex],
     emetteur
   );
   → Les données VIP SONT passées ✅

4. generateFactureAcompte (src/lib/pdf-generator.ts, ligne 553-710)
   → Reçoit quote = devis complet (ligne 553)
   → NE LIT PAS quote.is_vip ❌
   → NE PASSE PAS quote.prix_negocies à drawProductTable ❌
   → Ligne 580 : appelle drawProductTable SANS options VIP

   LIGNE 580 (PROBLÉMATIQUE) :
   y = drawProductTable(doc, quote.lignes || [], y + 2);

   ATTENDU (comme dans generateDevis ligne 530-534) :
   const isVip = quote.is_vip === true;
   y = drawProductTable(doc, quote.lignes || [], y + 2, {
     headerColor: isVip ? C.violet : C.salmon,
     isVip,
     prixNegocies: quote.prix_negocies || {}
   });

5. drawProductTable (src/lib/pdf-generator.ts, ligne 282-390)
   → Reçoit options = undefined ❌
   → Donc isVip = false, prixNegocies = {}
   → Ligne 345 : prixNegocie = prixPublic (pas de négociation détectée)
   → Ligne 375-379 : affiche prix_unitaire normal (28050 €)
   → Pas de prix barré, pas de violet
```

**Résultat** : Sur le PDF FA-2604014, on voit 28050 € au lieu de ~~28050 €~~ **25000 €**.

---

## 📊 DONNÉES VÉRIFIÉES

### Firestore — Devis DVS-2604024

```
is_vip               : ✅ True
prix_negocies        : ✅ { "MP-R32-001": 25000 }
total_ht             : ✅ 25000 (prix VIP)
total_ht_public      : ✅ 28050 (prix public)
lignes               : ✅ [{ ref: "MP-R32-001", prix_unitaire: 28050, qte: 1, ... }]
statut               : ✅ "signe"
numero               : ✅ "DVS-2604024"
```

**Validation** : TOUTES les données VIP sont présentes et correctes en base.

---

## 📋 FICHIERS ANALYSÉS

### 1. AcomptesEncaisser.tsx

**Fichier** : `src/admin/pages/AcomptesEncaisser.tsx` (190 lignes)

**Comment le total est affiché** :
```tsx
// Ligne 122
{formatEuros(q.total_ht || 0)}
```
→ Affiche `total_ht` = 25000 € (prix VIP, correct) ✅

**Comment le devis est passé au popup** :
Le composant `AcomptesEncaisser` charge les devis depuis Firestore avec `onSnapshot`, récupère TOUS les champs, et passe le devis complet à `PopupEncaisserAcompte`.

**Conclusion** : Aucun problème dans ce fichier. Le total VIP est affiché correctement et le devis complet est passé.

---

### 2. PopupEncaisserAcompte.tsx

**Fichier** : `src/admin/components/PopupEncaisserAcompte.tsx` (221 lignes)

**Structure des props** :
```tsx
interface Props {
  devis: any;  // ← Devis COMPLET avec tous les champs
  onClose: () => void;
  onSuccess: () => void;
}
```

**Rendu des lignes** :
Le popup N'AFFICHE PAS les lignes de produits. Il affiche uniquement :
- La liste des acomptes déclarés (statut='declare')
- Le montant de chaque acompte
- Un bouton pour sélectionner et encaisser

**Imports PDF** (ligne 5) :
```tsx
import { generateFactureAcompte } from '../../lib/pdf-generator';
```

**Appel au générateur** (lignes 82-89) :
```tsx
const pdfDoc = generateFactureAcompte(
  {
    ...devis,                    // ← Spread COMPLET
    acomptes: acomptesActuels,   // ← Tableau mis à jour
  },
  acomptesActuels[selectedIndex],  // ← Acompte cible
  emetteur
);
```

**Analyse** :
- ✅ Le spread `...devis` inclut TOUS les champs : `is_vip`, `prix_negocies`, `lignes`, `total_ht`, `total_ht_public`, etc.
- ✅ Aucun filtrage, aucune perte de données
- ✅ Le devis passé au générateur EST complet

**Conclusion** : Aucun problème dans ce fichier. Les données VIP sont correctement passées au générateur.

---

### 3. Générateur PDF utilisé

**Quel générateur est appelé ?** : `generateFactureAcompte` (pdf-generator.ts)

**Fichier** : `src/lib/pdf-generator.ts`

**Fonction** : `generateFactureAcompte` (lignes 553-710)

**Ligne d'appel problématique** : 580

**Arguments passés** :
1. `quote` : devis complet avec `is_vip`, `prix_negocies`, `lignes`, etc.
2. `acompteCible` : l'acompte en cours d'encaissement
3. `emetteur` : données émetteur (optionnel)

**Code actuel ligne 580** :
```typescript
y = drawProductTable(doc, quote.lignes || [], y + 2);
```

**Problème** :
- Appelle `drawProductTable` SANS le 4ème paramètre `options`
- Donc `drawProductTable` reçoit `options = undefined`
- Dans `drawProductTable` (ligne 289) : `const isVip = options?.isVip || false;` → **false**
- Dans `drawProductTable` (ligne 290) : `const prixNegocies = options?.prixNegocies || {};` → **{}**
- Ligne 345-346 : `const prixNegocie = isVip && prixNegocies[ref] !== undefined ? prixNegocies[ref] : prixPublic;`
  → Comme `isVip = false`, alors `prixNegocie = prixPublic`
- Ligne 375-379 : Affiche le prix normal sans barré

**Code attendu (comme dans generateDevis ligne 515-534)** :
```typescript
const isVip = quote.is_vip === true;
y = drawProductTable(doc, quote.lignes || [], y + 2, {
  headerColor: isVip ? C.violet : C.salmon,
  isVip,
  prixNegocies: quote.prix_negocies || {}
});
```

---

### 4. Autre générateur (NON utilisé)

**Fichier** : `src/lib/generateInvoiceAcompte.ts` (269 lignes)

**Statut** : ❌ **JAMAIS IMPORTÉ, JAMAIS UTILISÉ**

**Vérification** :
```bash
$ grep -rln "from.*generateInvoiceAcompte" src/
(aucun résultat)
```

**Conclusion** : Ce fichier est du code mort. Il peut être supprimé ou gardé pour référence, mais n'affecte pas le problème actuel.

---

## 🎯 PROBLÈMES IDENTIFIÉS

### Problème UNIQUE — generateFactureAcompte ligne 580

**Fichier** : `src/lib/pdf-generator.ts`
**Fonction** : `generateFactureAcompte`
**Ligne** : 580

**Code actuel** :
```typescript
y = drawProductTable(doc, quote.lignes || [], y + 2);
```

**Problème** :
Appel incomplet à `drawProductTable`. Le 4ème paramètre `options` est omis, donc la fonction `drawProductTable` ne reçoit pas les informations VIP (`isVip`, `prixNegocies`).

**Impact** :
- La fonction `drawProductTable` existe déjà avec TOUTE la logique VIP (lignes 343-374)
- Cette logique gère parfaitement les prix barrés + prix VIP en violet
- MAIS elle n'est jamais déclenchée car `isVip = false` et `prixNegocies = {}`

**Code attendu** :
```typescript
// Ligne 553-560 : détecter VIP (ajouter après les lignes existantes)
const isVip = quote.is_vip === true;
const color = isVip ? C.violet : C.salmon;  // Optionnel, peut garder C.salmon pour FA

// Ligne 580 : passer les options VIP
y = drawProductTable(doc, quote.lignes || [], y + 2, {
  headerColor: C.salmon,  // Garder couleur saumon pour facture acompte
  isVip,
  prixNegocies: quote.prix_negocies || {}
});
```

**Note sur les couleurs** :
- Dans `generateDevis` : couleur violet si VIP (ligne 516)
- Dans `generateFactureAcompte` : couleur saumon (ligne 561, en-tête)
- Recommandation : garder saumon pour l'en-tête de la facture (cohérence document type)
- Mais utiliser violet dans le tableau pour les prix VIP

---

## 🛠️ STRATÉGIE DE FIX RECOMMANDÉE

### Fix UNIQUE — generateFactureAcompte (pdf-generator.ts)

**Fichier à modifier** : `src/lib/pdf-generator.ts`

**Changement minimal** (3 lignes à ajouter) :

**Avant (ligne 553-580)** :
```typescript
export function generateFactureAcompte(quote: any, acompteCible: any, emetteur?: any): jsPDF {
  const doc = new jsPDF();
  const cfg = getConfig(emetteur);
  const numero = acompteCible?.ref_fa || quote?.numero_fa || 'FA-' + (quote.numero || '').replace('DVS-', '');
  const date = formatDate(acompteCible?.date_encaissement || acompteCible?.createdAt || quote.createdAt);

  drawLogo(doc, cfg.showLogo);
  drawHeader(doc, "Facture d'Acompte", numero, date, C.salmon);

  // ... code existant ...

  // Tableau produits (ligne 580)
  y = drawProductTable(doc, quote.lignes || [], y + 2);
```

**Après (ajouter détection VIP + options à l'appel)** :
```typescript
export function generateFactureAcompte(quote: any, acompteCible: any, emetteur?: any): jsPDF {
  const doc = new jsPDF();
  const cfg = getConfig(emetteur);
  const numero = acompteCible?.ref_fa || quote?.numero_fa || 'FA-' + (quote.numero || '').replace('DVS-', '');
  const date = formatDate(acompteCible?.date_encaissement || acompteCible?.createdAt || quote.createdAt);

  // AJOUT : Détecter si VIP
  const isVip = quote.is_vip === true;

  drawLogo(doc, cfg.showLogo);
  drawHeader(doc, "Facture d'Acompte", numero, date, C.salmon);

  // ... code existant ...

  // Tableau produits (ligne 580 modifiée)
  y = drawProductTable(doc, quote.lignes || [], y + 2, {
    headerColor: C.salmon,  // Garder saumon pour l'en-tête
    isVip,
    prixNegocies: quote.prix_negocies || {}
  });
```

**Justification** :
1. Copie exacte de la logique de `generateDevis` (lignes 515-534)
2. Aucun changement à `drawProductTable` (elle fonctionne déjà parfaitement)
3. 3 lignes ajoutées au total
4. Impact immédiat : toutes les factures acompte VIP afficheront les prix corrects

**Résultat attendu** :
- Prix public (28050 €) affiché barré en gris
- Prix VIP (25000 €) affiché en violet bold en dessous
- Total ligne = prix VIP × qté

---

## 🧪 TEST DE VALIDATION

**Devis de test** : DVS-2604024

### Avant fix

1. Aller dans admin → Acomptes à encaisser
2. Sélectionner DVS-2604024 (acompte déjà encaissé FA-2604014)
3. Télécharger le PDF FA-2604014
4. **Observé** : Ligne produit affiche "28050 €" (prix public)
5. **Observé** : Total = 28050 €
6. **Problème** : Pas de prix barré, pas de prix VIP

### Après fix

1. (Simuler) Encaisser un nouvel acompte sur DVS-2604024
2. Télécharger le PDF FA généré
3. **Attendu** : Ligne produit affiche "~~28050 €~~ **25000 €**"
4. **Attendu** : Prix public en gris barré
5. **Attendu** : Prix VIP en violet bold
6. **Attendu** : Total = 25000 €

### Comparaison avec devis PDF

1. Générer le PDF devis DVS-2604024
2. **Référence** : Doit afficher les mêmes prix VIP
3. **Vérification** : Cohérence devis PDF ↔ facture acompte PDF

---

## 📋 SCOPE DU PROMPT DE FIX

**Fichiers à modifier** : **1 seul**
- `src/lib/pdf-generator.ts` (ligne 580 + ajout ligne isVip ~559)

**Fichiers INTERDITS** :
- ❌ `drawProductTable` (déjà fonctionnelle, NE PAS modifier)
- ❌ `PopupEncaisserAcompte.tsx` (correct, NE PAS modifier)
- ❌ `AcomptesEncaisser.tsx` (correct, NE PAS modifier)
- ❌ Affichage des acomptes bas de facture (parfait, NE PAS toucher)
- ❌ `generateInvoiceAcompte.ts` (non utilisé)
- ❌ `admin.css`

**Règles** :
1. Utiliser la logique VIP qui marche dans `generateDevis` (référence)
2. Couleur en-tête facture : garder saumon C.salmon
3. Couleur prix VIP dans le tableau : violet C.violet
4. Copier les 3 lignes de `generateDevis` (515-516 + 530-534 adaptées)

---

## ✅ RÉSUMÉ EXÉCUTIF

### Diagnostic

**Le problème n'est PAS** :
- ❌ Les données en base (toutes présentes et correctes)
- ❌ Le chargement des données (devis complet chargé)
- ❌ Le passage des données au générateur (spread complet)
- ❌ La fonction `drawProductTable` (elle fonctionne parfaitement)

**Le problème EST** :
- ✅ **Une seule ligne** (ligne 580) dans `generateFactureAcompte`
- ✅ Appel incomplet à `drawProductTable` (paramètre `options` manquant)

### Solution

**Temps de fix** : 2 minutes
**Lignes à modifier** : 3 lignes (1 ajout + 1 modification)
**Risque** : Très faible (copie code existant qui marche)
**Impact** : Immédiat sur toutes les factures acompte VIP futures

### Comparaison avec audit précédent

**Audit AUDIT-PRIX-VIP-DVS-2604024.md** identifiait 3 problèmes :
1. Back-office DetailDevis
2. PDF Facture acompte (generateFactureAcompte ligne 580)
3. Confusion entre 2 générateurs

**Cet audit confirme** :
- Problème #2 est le SEUL problème réel pour l'encaissement
- Problème #3 résolu : `generateInvoiceAcompte.ts` n'est jamais utilisé
- Problème #1 (DetailDevis) est indépendant de l'encaissement

---

## 📁 FICHIERS ANALYSÉS

- ✅ `src/admin/pages/AcomptesEncaisser.tsx` (190 lignes) — Correct
- ✅ `src/admin/components/PopupEncaisserAcompte.tsx` (221 lignes) — Correct
- ✅ `src/lib/pdf-generator.ts` (1047 lignes) — Ligne 580 à fixer
- ✅ `src/lib/generateInvoiceAcompte.ts` (269 lignes) — Non utilisé
- ✅ Firestore : devis DVS-2604024 — Données complètes et correctes

**Rapport généré le** : 2026-04-24 11:20
**Mode** : LECTURE SEULE (aucune modification effectuée)

---

## 🎯 NEXT ACTION

Créer prompt **FIX-PDF-FACTURE-ACOMPTE-VIP** avec :
- Scope strict : 1 fichier, 3 lignes
- Référence : `generateDevis` lignes 515-534
- Test : DVS-2604024
- Durée estimée : 5 minutes
