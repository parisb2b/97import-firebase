# AUDIT — Affichage prix VIP (DVS-2604024)
**Date** : 2026-04-24 11:15
**Objectif** : identifier le problème d'affichage prix barré + prix négocié
  - dans le back-office (fiche détail devis)
  - dans le PDF facture acompte

---

## 📊 DONNÉES DU DEVIS DVS-2604024

### Informations devis

- **Numéro** : DVS-2604024
- **Statut** : signe
- **Is VIP** : True
- **Total HT (VIP)** : 25000 €
- **Total HT public** : 28050 €
- **Signé le** : oui
- **Partenaire** : UD (Uber Deco)

### Lignes du devis (1)

| # | Ref | Qté | Prix unitaire | Libellé |
|---|-----|-----|---------------|---------|
| 1 | MP-R32-001 | 1 | 28050 | Mini-pelle R32 PRO — Chenilles cao |

### Prix négociés (1 entrées)

| Ref | Prix négocié |
|-----|--------------|
| MP-R32-001 | 25000 |

**Économie** : 28050 - 25000 = **3050 €** (10.87%)

### Acomptes (1)

- Acompte #1 : 5000 € — statut=encaisse — FA=FA-2604014

---

## 🔍 ANALYSE DU CODE

### Back-office : fichier DetailDevis

**Fichier** : `src/admin/pages/DetailDevis.tsx`
**Lignes pertinentes** : 380-412 (tableau des lignes)

**Problème identifié** :
Le composant affiche `ligne.prix_unitaire` directement dans un input (ligne 398) sans vérifier si une négociation existe dans `devis.prix_negocies[ligne.ref]`.

**Code actuel (ligne 397-401)** :
```tsx
<td>
  <input className="fi" type="number" value={ligne.prix_unitaire} min={0}
    style={{ textAlign: 'right' }}
    onChange={(e) => handleLigneChange(index, 'prix_unitaire', Number(e.target.value))} />
</td>
```

**Constatation** :
- ❌ Aucune mention de `prix_negocies` dans le fichier
- ❌ Aucune mention de `is_vip` dans le fichier
- ❌ Aucun affichage prix barré (pas de `line-through`)
- ✅ Le composant est en mode édition (inputs), ce qui complique l'affichage double prix

**Recommandation** :
Pour un devis signé (statut='signe'), les inputs devraient être en lecture seule et afficher :
- Prix public barré si VIP
- Prix négocié en violet si VIP

---

### PDF devis (generateDevis) — référence qui marche ✅

**Fichier** : `src/lib/pdf-generator.ts`
**Fonction** : `generateDevis` (ligne 510-548)
**Fonction helper** : `drawProductTable` (ligne 282-390)

**Logique VIP fonctionnelle** :

1. **Ligne 515** : Détecte si VIP
   ```typescript
   const isVip = quote.is_vip === true;
   const color = isVip ? C.violet : C.salmon;
   ```

2. **Lignes 530-534** : Passe les infos VIP à drawProductTable
   ```typescript
   y = drawProductTable(doc, quote.lignes || [], y + 2, {
     headerColor: color,
     isVip,
     prixNegocies: quote.prix_negocies || {}
   });
   ```

3. **Dans drawProductTable (lignes 343-374)** :
   ```typescript
   const ref = ligne.ref || ligne.reference || '';
   const prixPublic = ligne.prix_unitaire || 0;
   const prixNegocie = isVip && prixNegocies[ref] !== undefined
     ? prixNegocies[ref]
     : prixPublic;
   const estNegocie = isVip && prixNegocie !== prixPublic;

   if (estNegocie) {
     // Prix public barré en gris
     doc.setTextColor(...C.grayStrike);
     doc.text(formatEUR(prixPublic), colPrix, y + 5, { align: 'right' });
     doc.line(colPrix - pubW, y + 4, colPrix, y + 4); // ligne

     // Prix négocié en violet bold
     doc.setTextColor(...C.violet);
     doc.setFont('helvetica', 'bold');
     doc.text(formatEUR(prixNegocie), colPrix, y + 10, { align: 'right' });

     // Idem pour le total
   }
   ```

**Couleurs utilisées** :
- `C.violet = [124, 58, 237]` = #7C3AED (prix VIP)
- `C.grayStrike = [156, 163, 175]` = #9CA3AF (prix public barré)

---

### PDF facture acompte — problème identifié ❌

**Fichier principal** : `src/lib/pdf-generator.ts`
**Fonction** : `generateFactureAcompte` (ligne 553-710)

**Problème à la ligne 580** :
```typescript
y = drawProductTable(doc, quote.lignes || [], y + 2);
```

**Différence critique** :
- ❌ N'envoie PAS le paramètre `options` à drawProductTable
- ❌ Donc `isVip` est undefined → false
- ❌ Donc `prixNegocies` est undefined → {}
- ❌ Résultat : affiche uniquement le prix_unitaire (prix public) sans barré

**Fichier alternatif** : `src/lib/generateInvoiceAcompte.ts`
**Fonction** : `generateFactureAcomptePDF` (ligne 55-257)

**Problème différent** :
- ❌ N'affiche PAS DU TOUT les lignes de produits
- ❌ Ligne 131-143 : affiche seulement une ligne "Acompte n°X sur devis..."
- ⚠️ Le paramètre `devis_lignes` existe dans l'interface (ligne 43-51) mais n'est JAMAIS utilisé

**Conclusion** :
Il existe **deux** générateurs de facture acompte :
1. `pdf-generator.ts` → `generateFactureAcompte` : affiche les lignes mais sans VIP
2. `generateInvoiceAcompte.ts` → `generateFactureAcomptePDF` : n'affiche pas les lignes du tout

Il faut déterminer lequel est utilisé en production.

---

## 🔍 RÉFÉRENCE : Code qui FONCTIONNE (DevisCard.tsx)

**Fichier** : `src/front/pages/espace-client/DevisCard.tsx`
**Lignes** : 289-314

```tsx
{(devis.lignes || []).map((ligne: any, idx: number) => {
  const ref = ligne.ref || '';
  const prixPublic = ligne.prix_unitaire || 0;
  const prixNegocie = devis.prix_negocies?.[ref] ?? prixPublic;
  const estNegocie = devis.is_vip && prixNegocie !== prixPublic;
  const qte = ligne.qte || 1;
  const totalLigne = prixNegocie * qte;

  return (
    <tr key={idx}>
      ...
      <td style={{ padding: '10px 4px', textAlign: 'right' }}>
        {estNegocie && (
          <div style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 12 }}>
            {prixPublic.toLocaleString('fr-FR')} €
          </div>
        )}
        <div style={{ color: estNegocie ? '#7C3AED' : '#111827', fontWeight: estNegocie ? 600 : 400 }}>
          {prixNegocie.toLocaleString('fr-FR')} €
        </div>
      </td>
      ...
    </tr>
  );
})}
```

**Logique claire** :
1. Récupère `prixPublic = ligne.prix_unitaire`
2. Récupère `prixNegocie = devis.prix_negocies?.[ref] ?? prixPublic`
3. Teste `estNegocie = devis.is_vip && prixNegocie !== prixPublic`
4. Si négocié : affiche public barré + négocié violet
5. Sinon : affiche prix normal

---

## 🎯 DIAGNOSTIC PRÉCIS

### Différence 1 — Back-office DetailDevis.tsx

**Fichier** : `src/admin/pages/DetailDevis.tsx`
**Lignes** : 380-412

**Problème** :
Le tableau des lignes utilise des `<input>` éditables qui affichent uniquement `ligne.prix_unitaire`. Il n'y a aucune logique pour détecter si le devis est VIP et afficher le prix négocié.

**Cause** :
- Composant conçu pour éditer un devis, pas pour afficher un devis signé
- Pas de distinction entre mode "édition" et mode "lecture"
- Pas de gestion de `devis.is_vip` ni `devis.prix_negocies`

**Impact** :
Quand Michel ouvre DVS-2604024 dans l'admin, il voit seulement 28050 € (prix public) et ne voit pas le prix négocié de 25000 €.

---

### Différence 2 — PDF Facture acompte (pdf-generator.ts)

**Fichier** : `src/lib/pdf-generator.ts`
**Fonction** : `generateFactureAcompte`
**Ligne problématique** : 580

**Problème** :
```typescript
// ACTUEL (ligne 580)
y = drawProductTable(doc, quote.lignes || [], y + 2);

// ATTENDU (comme dans generateDevis ligne 530-534)
y = drawProductTable(doc, quote.lignes || [], y + 2, {
  headerColor: isVip ? C.violet : C.salmon,
  isVip: quote.is_vip || false,
  prixNegocies: quote.prix_negocies || {}
});
```

**Cause** :
Le développeur a oublié de passer le 4ème paramètre `options` à `drawProductTable`.

**Impact** :
La fonction `drawProductTable` reçoit `options = undefined`, donc :
- `isVip` = false
- `prixNegocies` = {}
- Ligne 346 : `estNegocie` = false
- Ligne 375-379 : affiche le prix normal sans barré

**Résultat** :
Sur le PDF FA-2604014, on voit 28050 € (prix public) au lieu de voir 28050 € barré + 25000 € violet.

---

### Différence 3 — PDF Facture acompte (generateInvoiceAcompte.ts)

**Fichier** : `src/lib/generateInvoiceAcompte.ts`
**Fonction** : `generateFactureAcomptePDF`
**Lignes** : 120-145

**Problème** :
Le générateur n'affiche PAS les lignes de produits. Il affiche seulement une ligne unique :
```
Acompte n°1 sur devis DVS-2604024 | 5000 €
```

**Cause** :
Ce générateur a été conçu pour être minimaliste. Le paramètre `devis_lignes` existe dans l'interface mais n'est jamais utilisé dans le code.

**Impact** :
Si ce générateur est utilisé (au lieu de celui dans pdf-generator.ts), le client ne voit pas du tout les produits commandés sur la facture.

**Question à clarifier** :
Quel générateur est utilisé en production ?
- `pdf-generator.ts` → `generateFactureAcompte` ?
- `generateInvoiceAcompte.ts` → `generateFactureAcomptePDF` ?

Il faut vérifier dans le code qui appelle la génération (probablement dans `PopupEncaisserAcompte.tsx` ou similaire).

---

## 🛠️ RECOMMANDATIONS POUR LE FIX

### Priorité 1 : Facture acompte PDF (pdf-generator.ts)

**Fichier** : `src/lib/pdf-generator.ts`
**Ligne à modifier** : 580

**Changement minimal** :
```typescript
// AVANT (ligne 580)
y = drawProductTable(doc, quote.lignes || [], y + 2);

// APRÈS
const isVip = quote.is_vip === true;
y = drawProductTable(doc, quote.lignes || [], y + 2, {
  headerColor: isVip ? C.violet : C.salmon,
  isVip,
  prixNegocies: quote.prix_negocies || {}
});
```

**Justification** :
- Copie exacte de la logique qui marche dans `generateDevis` (ligne 515-534)
- Aucun changement à `drawProductTable` (déjà fonctionnelle)
- Impact : toutes les factures acompte afficheront les prix VIP correctement

---

### Priorité 2 : Back-office DetailDevis.tsx

**Fichier** : `src/admin/pages/DetailDevis.tsx`
**Section** : Tableau des lignes (lignes 380-412)

**Approche 1 — Mode lecture seule pour devis signés** :

Quand `devis.statut === 'signe'`, remplacer les inputs par des divs en lecture seule avec affichage VIP.

```tsx
<td style={{ padding: '10px 4px', textAlign: 'right' }}>
  {devis.statut === 'signe' ? (
    // Mode lecture seule
    (() => {
      const ref = ligne.ref || '';
      const prixPublic = ligne.prix_unitaire || 0;
      const prixNegocie = devis.prix_negocies?.[ref] ?? prixPublic;
      const estNegocie = devis.is_vip && prixNegocie !== prixPublic;

      return (
        <div>
          {estNegocie && (
            <div style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 12 }}>
              {prixPublic.toLocaleString('fr-FR')} €
            </div>
          )}
          <div style={{ color: estNegocie ? '#7c3aed' : '#111827', fontWeight: estNegocie ? 600 : 400 }}>
            {prixNegocie.toLocaleString('fr-FR')} €
          </div>
        </div>
      );
    })()
  ) : (
    // Mode édition (existant)
    <input className="fi" type="number" value={ligne.prix_unitaire} min={0}
      style={{ textAlign: 'right' }}
      onChange={(e) => handleLigneChange(index, 'prix_unitaire', Number(e.target.value))} />
  )}
</td>
```

**Approche 2 — Badge VIP en plus de l'input** :

Garder l'input mais ajouter un badge violet en dessous si VIP :

```tsx
<td>
  <input className="fi" type="number" value={ligne.prix_unitaire} min={0}
    style={{ textAlign: 'right' }}
    onChange={(e) => handleLigneChange(index, 'prix_unitaire', Number(e.target.value))} />
  {(() => {
    const ref = ligne.ref || '';
    const prixNegocie = devis.prix_negocies?.[ref];
    const estNegocie = devis.is_vip && prixNegocie && prixNegocie !== ligne.prix_unitaire;

    return estNegocie ? (
      <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginTop: 2 }}>
        VIP: {prixNegocie.toLocaleString('fr-FR')} €
      </div>
    ) : null;
  })()}
</td>
```

**Recommandation** :
Approche 1 (lecture seule) est plus propre car un devis signé ne devrait pas être modifiable.

---

### Priorité 3 : Clarifier quel générateur est utilisé

**Vérifier** :
Chercher dans le code qui appelle la génération de facture acompte :
- `PopupEncaisserAcompte.tsx`
- Ou autre composant admin

**Si `generateInvoiceAcompte.ts` est utilisé** :
Alors il faut :
1. Soit ajouter l'affichage des lignes de produits avec VIP
2. Soit migrer vers `pdf-generator.ts` → `generateFactureAcompte` (+ fix Priorité 1)

**Si `pdf-generator.ts` est utilisé** :
Appliquer uniquement le fix Priorité 1.

---

## 🧪 CAS DE TEST

**Devis de référence** : **DVS-2604024**

### Test 1 : Back-office admin

1. Se connecter à l'admin
2. Ouvrir le devis DVS-2604024
3. **Avant fix** : on voit 28050 € dans la colonne prix unitaire
4. **Après fix** : on voit 28050 € barré + 25000 € en violet

### Test 2 : PDF Facture acompte

1. Télécharger le PDF de la facture FA-2604014
2. **Avant fix** : ligne produit affiche "28050 €"
3. **Après fix** : ligne produit affiche "~~28050 €~~ **25000 €**" (prix public barré + prix VIP violet)

### Test 3 : Cohérence totaux

1. Vérifier que le Total HT en bas du PDF = 25000 € (prix VIP)
2. Vérifier que c'est cohérent avec le prix unitaire affiché
3. Vérifier que l'économie de 3050 € est visible quelque part (ou calculable)

---

## 📋 SCOPE POUR LE PROMPT DE FIX

### Prompt FIX-AFFICHAGE-PRIX-VIP (à créer après cet audit)

**Fichiers à modifier** :
1. `src/lib/pdf-generator.ts` (ligne 580) — **PRIORITÉ 1**
2. `src/admin/pages/DetailDevis.tsx` (lignes 397-401) — **PRIORITÉ 2**
3. (Optionnel) `src/lib/generateInvoiceAcompte.ts` — si utilisé

**Durée estimée** : 30 min - 1h

**Règles** :
- Copier la logique VIP qui fonctionne dans `generateDevis` vers `generateFactureAcompte`
- Réutiliser le code de référence de `DevisCard.tsx` pour le back-office
- Ne PAS modifier `drawProductTable` (déjà fonctionnelle)
- Tester avec DVS-2604024

---

## 📌 CODE DE RÉFÉRENCE

### Code qui MARCHE : drawProductTable (pdf-generator.ts, lignes 343-374)

```typescript
const ref = ligne.ref || ligne.reference || '';
const prixPublic = ligne.prix_unitaire || 0;
const prixNegocie = isVip && prixNegocies[ref] !== undefined ? prixNegocies[ref] : prixPublic;
const estNegocie = isVip && prixNegocie !== prixPublic;

if (estNegocie) {
  // VIP: prix public barré + prix négocié en violet
  doc.setTextColor(...C.grayStrike);  // RGB(156, 163, 175) = #9CA3AF
  const pubText = formatEUR(prixPublic);
  doc.text(pubText, colPrix, y + 5, { align: 'right' });
  const pubW = doc.getTextWidth(pubText);
  doc.setDrawColor(...C.grayStrike);
  doc.line(colPrix - pubW, y + 4, colPrix, y + 4);  // Ligne barrée

  doc.setTextColor(...C.violet);  // RGB(124, 58, 237) = #7C3AED
  doc.setFont('helvetica', 'bold');
  doc.text(formatEUR(prixNegocie), colPrix, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // Total VIP (idem)
  const totalPub = prixPublic * (ligne.qte || 1);
  const totalNeg = prixNegocie * (ligne.qte || 1);
  doc.setTextColor(...C.grayStrike);
  const totPubText = formatEUR(totalPub);
  doc.text(totPubText, tableRight - 2, y + 5, { align: 'right' });
  const totPubW = doc.getTextWidth(totPubText);
  doc.line(tableRight - 2 - totPubW, y + 4, tableRight - 2, y + 4);

  doc.setTextColor(...C.violet);
  doc.setFont('helvetica', 'bold');
  doc.text(formatEUR(totalNeg), tableRight - 2, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
} else {
  // Normal
  doc.setTextColor(...C.black);
  doc.text(formatEUR(ligne.prix_unitaire), colPrix, y + 5, { align: 'right' });
  doc.text(formatEUR(ligne.total || (ligne.prix_unitaire || 0) * (ligne.qte || 1)), tableRight - 2, y + 5, { align: 'right' });
}
```

### Couleurs à utiliser

```typescript
// Dans pdf-generator.ts
const C = {
  violet: [124, 58, 237] as const,      // #7C3AED - prix VIP
  grayStrike: [156, 163, 175] as const,  // #9CA3AF - prix public barré
  black: [0, 0, 0] as const,
  // ...
};
```

```css
/* Dans React/TSX */
color: '#7C3AED'  /* Prix VIP */
color: '#9CA3AF'  /* Prix public barré */
textDecoration: 'line-through'
fontWeight: 600   /* Prix VIP */
```

---

## ✅ CONCLUSION

### Problèmes identifiés

1. **Back-office** : `DetailDevis.tsx` n'affiche pas les prix VIP, seulement les prix publics
2. **PDF Facture acompte** : `generateFactureAcompte` n'envoie pas les paramètres VIP à `drawProductTable`
3. **Confusion** : Deux générateurs de facture existent, besoin de clarifier lequel est utilisé

### Solution la plus simple

**PDF** : Ajouter 3 lignes dans `pdf-generator.ts` ligne 580
**Back-office** : Conditionner l'affichage selon `devis.statut === 'signe'`

### Impact estimé

- **Temps de dev** : 30 min - 1h
- **Risque** : Faible (copie code existant qui marche)
- **Test** : Simple (devis DVS-2604024 disponible)

---

## 📁 FICHIERS ANALYSÉS

- ✅ `src/admin/pages/DetailDevis.tsx` (476 lignes)
- ✅ `src/front/pages/espace-client/DevisCard.tsx` (référence)
- ✅ `src/lib/pdf-generator.ts` (1047 lignes)
- ✅ `src/lib/generateInvoiceAcompte.ts` (269 lignes)
- ✅ Firestore : devis DVS-2604024 (données réelles)

**Rapport généré le** : 2026-04-24 11:15
**Mode** : LECTURE SEULE (aucune modification effectuée)
