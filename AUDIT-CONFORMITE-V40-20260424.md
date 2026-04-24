# 🔍 AUDIT CONFORMITÉ v40 — 97IMPORT
**Date** : 2026-04-24
**Auditeur** : Claude Code
**Branche** : v2
**Commit analysé** : 1397551

---

## 📊 SYNTHÈSE EXÉCUTIVE

| # | Point audité | Statut | Gravité |
|---|--------------|--------|---------|
| 1 | Parcours VIP | ⚠️ | 🟡 |
| 2 | Conversion Devis→Commande | ✅ | 🟢 |
| 3 | Limite 3 acomptes + bouton solde | ⚠️ | 🟡 |
| 4 | Commission au solde uniquement | ❌ | 🔴 |
| 5 | Sécurité rôles + fallback admin | ✅ | 🟢 |
| 6 | UI : Modifier/Dupliquer | ❌ | 🟡 |
| 7 | Emails à chaque statut | ❌ | 🔴 |

**Score global de conformité** : 2/7 (29%)

**Alertes critiques** :
- 🔴 **Point 4** : Commissions jamais créées (infrastructure existe mais pas appelée)
- 🔴 **Point 7** : Aucun email envoyé automatiquement (fonctions existent mais jamais appelées)
- 🟡 **Point 3** : Pas de bouton distinct "Payer le Solde"
- 🟡 **Point 1** : Champ `prix_vip_negocie` absent de la base Firestore

---

## 🔎 DÉTAIL PAR POINT

### Point 1 — Parcours VIP
**Statut** : ⚠️ Partiel

**(a) Bouton "Demander Prix VIP" côté client**
- **NON TROUVÉ** dans `src/front/`
- Aucun bouton "Demander VIP" / "Prix VIP" / `demanderVIP` / `requestVIP`
- Impact : Le client ne peut pas initier une demande VIP depuis l'interface

**(b) Modification prix par partenaire/admin**
- Trouvé dans : `src/lib/quoteStatusHelpers.ts:46`
- Extrait :
  ```typescript
  prix_vip_negocie?: number;   // prix final négocié par le partenaire
  ```
- Trouvé dans : `src/lib/commissionHelpers.ts:35`
  ```typescript
  const prix_vip = ligne.prix_vip_negocie || ligne.prix_unitaire_final;
  ```
- **Mécanisme** : Le type existe dans les helpers mais aucune interface UI pour saisir ce prix n'a été trouvée dans DetailDevis.tsx ou dans l'espace partenaire.

**(c) Affichage prix barré + violet**
- Trouvé dans : `src/admin/pages/DetailDevis.tsx:414,419`
  ```tsx
  <div style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 12 }}>
  color: estNegocie ? '#7c3aed' : '#111827',
  ```
- Trouvé dans : `src/front/pages/espace-partenaire/GestionDevisPartner.tsx:244,253`
  ```tsx
  <label style={{ fontSize: 10, color: '#7C3AED', fontWeight: 600, display: 'block', marginBottom: 4 }}>Prix négocié</label>
  border: `2px solid ${estValide ? '#7C3AED' : '#EF4444'}`,
  ```
- **OK** : Le code d'affichage existe bien (prix barré en gris, prix VIP en violet #7C3AED)

**Structure Firestore observée (quotes.lignes[\*])** :
```
Champs: ['nom_fr', 'qte', 'ref', 'prix_unitaire', 'total', 'type']
prix_vip_negocie présent : NON
```

**❌ Manquants précis** :
1. `src/front/pages/Panier.tsx` ou `Produit.tsx` : ajouter bouton "Demander Prix VIP"
2. Champ Firestore `prix_vip_negocie` **absent des lignes** sauvegardées (le type existe en code mais n'est jamais sauvegardé)
3. Interface de saisie du prix négocié manquante dans DetailDevis.tsx ou GestionDevisPartner.tsx

**Risque métier** : Le parcours VIP est incomplet. Les clients ne peuvent pas demander de prix spécial, et même si un partenaire négocie, le prix n'est pas persisté en base. Le code d'affichage est prêt mais inutilisable sans les données.

---

### Point 2 — Conversion Devis → Commande
**Statut** : ✅ Fait

**Transition automatique de statut**
- Trouvé dans : `src/admin/components/PopupEncaisserAcompte.tsx:110-119`
- Extrait :
  ```typescript
  // Déterminer le nouveau statut du devis
  let nouveauStatut = devis.statut;
  if (Math.abs(soldeRestant) < 0.01) {
    nouveauStatut = 'solde_paye';
  } else if (nouveauStatut === 'nouveau' || nouveauStatut === 'brouillon') {
    const nbEncaisses = acomptesActuels.filter((a: any) => a.encaisse).length;
    if (nbEncaisses === 1) nouveauStatut = 'acompte_1';
    else if (nbEncaisses === 2) nouveauStatut = 'acompte_2';
    else if (nbEncaisses === 3) nouveauStatut = 'acompte_3';
  }
  ```

**Label PDF : "DEVIS" vs "COMMANDE"**
- Les 13 statuts sont bien définis dans `src/lib/quoteStatusHelpers.ts:14-18`
- La conversion se fait automatiquement au premier acompte encaissé (statut → `acompte_1`)

**✅ Conclusion** : La conversion automatique est bien implémentée. Dès le premier acompte, le statut passe de `nouveau`/`brouillon` à `acompte_1`, puis `acompte_2`, `acompte_3`, et `solde_paye`.

**Risque métier** : Aucun (point conforme).

---

### Point 3 — Gestion des acomptes (limite 3 + bouton solde)
**Statut** : ⚠️ Partiel

**Limite 3 acomptes partiels**
- Trouvé dans : `src/lib/quoteStatusHelpers.ts:71,77,84`
  ```typescript
  export function getNbAcomptesEncaisses(acomptes: Acompte[] = []): number {
    return acomptes.filter(a => a.encaisse === true && !a.is_solde).length;
  }
  export function peutAjouterAcompte(acomptes: Acompte[] = [], soldeRestant: number): boolean { ... }
  export function prochainPaiementEstSolde(acomptes: Acompte[] = []): boolean {
    return getNbAcomptesEncaisses(acomptes) >= 3;
  }
  ```
- **OK** : La limite de 3 acomptes est bien codée

**4e paiement = solde forcé**
- Trouvé dans : `src/lib/quoteStatusHelpers.ts:110`
  ```typescript
  if (prochainPaiementEstSolde(acomptes) && Math.abs(montant - restant) > 0.01) {
    return { ok: false, erreur: '4e paiement = solde forcé obligatoire' };
  }
  ```
- **OK** : La validation force bien le 4e paiement à être exactement égal au solde

**Bouton "Payer le Solde" distinct**
- **NON TROUVÉ** : Aucun bouton séparé avec "Payer le Solde" / `payerSolde` / "Solde final" trouvé
- Le système utilise le même popup `PopupEncaisserAcompte` pour tous les paiements

**❌ Manquants précis** :
1. Créer un bouton distinct "Payer le Solde" visible après 3 acomptes ou quand l'utilisateur veut clôturer
2. Actuellement, il faut passer par le même popup "Encaisser" ce qui peut prêter à confusion

**Risque métier** : Faible. Le solde forcé fonctionne mais l'UX n'est pas optimale (pas de bouton dédié distinct).

---

### Point 4 — Commissions (déclenchement au solde uniquement)
**Statut** : ❌ Non fait

**Appel à `creerCommissionDevis`**
- Fonction existe : `src/lib/commissionHelpers.ts:84`
- **Aucun appel trouvé** dans les fichiers .tsx (ni PopupEncaisserAcompte, ni DetailDevis, ni ailleurs)
- Résultat : La commission n'est **JAMAIS créée automatiquement**

**Email partenaire commission**
- Fonction existe : `src/lib/emailService.ts:955`
  ```typescript
  export async function envoyerEmailCommissionPartenaire(params: { ... })
  ```
- **Aucun appel trouvé** dans le code

**Structure Firestore observée (collection `commissions`)** :
```
Commissions en base: 0
```

**❌ Manquants précis** :
1. `src/admin/components/PopupEncaisserAcompte.tsx` : ajouter après `updateDoc` (ligne ~125) :
   ```typescript
   if (nouveauStatut === 'solde_paye') {
     await creerCommissionDevis({
       devis_id: devis.id,
       devis_numero: devis.numero,
       partenaire_code: devis.partenaire_code,
       lignes: devis.lignes,
     });
     await envoyerEmailCommissionPartenaire({ ... });
   }
   ```
2. Importer les fonctions depuis `commissionHelpers.ts` et `emailService.ts`

**Risque métier** : 🔴 **CRITIQUE**. Les partenaires ne reçoivent **jamais** leurs commissions car elles ne sont jamais enregistrées en base. Le système de commission est complètement inopérant malgré l'infrastructure existante.

---

### Point 5 — Sécurité & rôles (filtre partners + fallback admin)
**Statut** : ✅ Fait

**Dropdown partenaires (source collection)**
- Trouvé dans : `src/front/pages/Panier.tsx:113`
  ```typescript
  const q = query(collection(db, 'partners'), where('actif', '==', true));
  ```
- **OK** : Les partenaires sont chargés dynamiquement depuis la collection et filtrés sur `actif === true`

**Fallback admin**
- Trouvé dans : `src/lib/commissionHelpers.ts:94`
  ```typescript
  if (!params.partenaire_code || params.partenaire_code === 'ADMIN' || params.partenaire_code === 'admin') {
    return { ok: true };  // Pas d'erreur, juste pas de commission
  }
  ```
- **OK** : Si pas de partenaire ou code "ADMIN", la commission n'est pas créée (comportement attendu)

**Filtrage devis par partenaire**
- Trouvé dans : `src/front/pages/EspacePartenaire.tsx:42`
  ```typescript
  const pSnap = await getDocs(query(collection(db, 'partners'), where('userId', '==', u.uid)));
  ```
- Le filtrage est fait par `userId` du partenaire connecté

**✅ Conclusion** : La sécurité et les rôles sont bien implémentés.

**Risque métier** : Aucun (point conforme).

---

### Point 6 — Interface (boutons Modifier, Dupliquer)
**Statut** : ❌ Non fait

**Bouton "Modifier" (conditions d'affichage)**
- Trouvé dans : `src/admin/pages/DetailDevis.tsx:283`
  ```tsx
  <Button variant="p" onClick={handleSave} disabled={saving}>
    {saving ? t('loading') : t('btn.enregistrer')}
  </Button>
  ```
- Aucune condition de désactivation basée sur le statut (acompte_1, acompte_2, etc.)
- Le bouton "Enregistrer" est toujours visible et actif
- **ATTENTION** : Ligne 405-406 montre qu'il y a une logique de lecture seule :
  ```tsx
  const estLectureSeule = devis.statut === 'signe' || devis.statut === 'acompte_1'
    || devis.statut === 'acompte_2' || devis.statut === 'acompte_3'
  ```
- Mais cette variable `estLectureSeule` est définie mais **non utilisée** pour désactiver les inputs

**Bouton "Dupliquer"**
- Trouvé : `src/admin/components/produit/ModalDupliquerProduit.tsx` (pour les produits uniquement)
- **NON TROUVÉ** pour les devis
- Aucun bouton "Dupliquer" / "Cloner" / `duplicate` trouvé pour les devis

**❌ Manquants précis** :
1. `src/admin/pages/DetailDevis.tsx` : utiliser la variable `estLectureSeule` pour désactiver les inputs et le bouton "Enregistrer"
2. Créer un composant `ModalDupliquerDevis.tsx` sur le modèle de `ModalDupliquerProduit.tsx`
3. Ajouter un bouton "📋 Dupliquer" dans l'en-tête de DetailDevis.tsx

**Risque métier** : Moyen. Sans bouton Dupliquer, l'admin doit recréer manuellement des devis similaires (perte de temps). Sans désactivation des champs, risque de modifier un devis qui est déjà en cours de paiement (incohérence).

---

### Point 7 — Emails (notifications à chaque changement de statut)
**Statut** : ❌ Non fait

**Fonctions email existantes dans `emailService.ts`** :
- L.218 : `notifyDevisCree`
- L.332 : `notifyDevisVipEnvoye`
- L.497 : `notifyAcompteDeclare`
- L.595 : `notifyAcompteEncaisse`
- L.735 : `envoyerEmailFactureAcompte`
- L.807 : `notifySignatureClient`
- L.913 : `envoyerEmailFactureFinale`
- L.955 : `envoyerEmailCommissionPartenaire`

**Appels à ces fonctions dans le code** :
- Recherche : `grep -rn "envoyerEmail\|sendEmail" src --include="*.tsx"`
- Résultat : **AUCUN APPEL TROUVÉ** en dehors de `emailService.ts` lui-même

**Exemple d'absence** :
- `PopupEncaisserAcompte.tsx` ligne 126 appelle `notifyAcompteEncaisse` mais :
  - N'appelle pas `envoyerEmailFactureAcompte`
  - N'appelle pas `envoyerEmailFactureFinale` quand `solde_paye` est atteint
  - N'appelle pas `envoyerEmailCommissionPartenaire`
- Aucun changement de statut ne déclenche d'email dans `DetailDevis.tsx`

**❌ Manquants précis** :
1. `src/admin/components/PopupEncaisserAcompte.tsx` ligne ~140 : après `updateDoc`, ajouter :
   ```typescript
   if (nouveauStatut === 'solde_paye') {
     await envoyerEmailFactureFinale({ ... });
   }
   ```
2. `src/admin/pages/DetailDevis.tsx` : dans `handleSave`, détecter les changements de statut et appeler les emails correspondants :
   - `signe` → `notifySignatureClient`
   - `commande_ferme` → nouvel email "Commande lancée"
   - `embarque_chine` → nouvel email "Conteneur parti"
   - `arrive_port_domtom` → nouvel email "Arrivé au port"
   - `livre` → nouvel email "Livré"
3. Créer les templates email manquants pour les nouveaux statuts (embarque, arrivé, livré)

**Risque métier** : 🔴 **CRITIQUE**. Les clients ne reçoivent **AUCUNE notification automatique** des changements de statut. Ils ne savent pas quand leur commande est lancée, expédiée, arrivée ou livrée. Très mauvaise expérience utilisateur.

---

## 🛠️ FEUILLE DE ROUTE CORRECTIVE (PRIORISÉE)

### 🔴 Priorité 1 — Bloquant pour production

- [ ] **[P7-EMAILS]** Brancher les emails automatiques sur les changements de statut (estimation : 60 min)
  - Fichiers : `PopupEncaisserAcompte.tsx`, `DetailDevis.tsx`
  - Ajouter appels à `envoyerEmailFactureFinale`, `envoyerEmailCommissionPartenaire`, `notifySignatureClient`
  - Créer les templates manquants pour `commande_ferme`, `embarque_chine`, etc.

- [ ] **[P4-COMMISSION]** Déclencher création commission au `solde_paye` (estimation : 30 min)
  - Fichiers : `PopupEncaisserAcompte.tsx`
  - Importer `creerCommissionDevis` et l'appeler après `updateDoc` si `nouveauStatut === 'solde_paye'`
  - Appeler `envoyerEmailCommissionPartenaire` juste après

- [ ] **[BUGFIX-ACOMPTES]** Rétrocompatibilité format acomptes `statut: 'declare'` (estimation : 15 min)
  - Fichiers : `PopupEncaisserAcompte.tsx`
  - Accepter à la fois `encaisse === false` ET `statut === 'declare'` dans le filtre
  - Toujours sauvegarder en nouveau format (`encaisse: boolean`)

### 🟡 Priorité 2 — Important mais pas bloquant

- [ ] **[P1-VIP-SAVE]** Sauvegarder `prix_vip_negocie` en Firestore (estimation : 20 min)
  - Fichiers : `DetailDevis.tsx`, `Panier.tsx`, `GestionDevisPartner.tsx`
  - Ajouter le champ dans l'objet ligne lors de la sauvegarde
  - Vérifier qu'il est bien affiché dans les PDF

- [ ] **[P6-DUPLIQUER]** Créer bouton "Dupliquer" pour les devis (estimation : 45 min)
  - Fichiers : créer `src/admin/components/ModalDupliquerDevis.tsx`
  - Ajouter bouton dans `DetailDevis.tsx`
  - Copier tout sauf numéro, statut, acomptes

- [ ] **[P6-READONLY]** Utiliser la variable `estLectureSeule` pour désactiver les inputs (estimation : 15 min)
  - Fichiers : `DetailDevis.tsx`
  - Ajouter `disabled={estLectureSeule}` sur tous les inputs pertinents
  - Désactiver le bouton "Enregistrer" si `estLectureSeule === true`

### 🟢 Priorité 3 — Nice-to-have

- [ ] **[P3-BTN-SOLDE]** Créer bouton distinct "Payer le Solde" (estimation : 30 min)
  - Fichiers : `DetailDevis.tsx`
  - Afficher ce bouton au lieu de "Encaisser" quand `prochainPaiementEstSolde() === true`
  - Ouvrir le même popup mais avec message clair "Paiement final - Solde"

- [ ] **[P1-VIP-BTN]** Ajouter bouton "Demander Prix VIP" côté client (estimation : 40 min)
  - Fichiers : `Panier.tsx`, `Produit.tsx`
  - Créer popup demande VIP → envoie email au partenaire
  - Changer statut devis → `en_negociation_partenaire`

---

## 📎 ANNEXES

### Structure Firestore observée

**Collection `quotes` (DVS-2604001)** :
```json
{
  "numero": "DVS-2604001",
  "statut": "signe",
  "partenaire_code": "UD",
  "total_ht": null,
  "lignes": [
    {
      "ref": "...",
      "nom_fr": "...",
      "qte": 1,
      "prix_unitaire": 123,
      "total": 123,
      "type": "..."
    }
  ],
  "acomptes": [
    {
      "statut": "declare",
      "montant": 30,
      "date": "2026-04-24T15:06:39.060Z",
      "type_compte": "perso",
      "iban_utilise": "DE93..."
    }
  ]
}
```
**⚠️ Champs manquants dans lignes** : `prix_vip_negocie`, `prix_partenaire`
**⚠️ Ancienne structure acomptes** : `statut: 'declare'` au lieu de `encaisse: false`

**Collection `partners`** :
```
Champs: nom, code, email, tel, actif, userId, commission_taux
```

**Collection `commissions`** :
```
Vide (0 docs)
```

**Collection `mail`** :
```
1+ docs (Firebase Trigger Email Extension configurée)
```

---

### Fichiers sources inspectés

- `src/front/pages/Panier.tsx` (178 lignes)
- `src/admin/pages/DetailDevis.tsx` (531 lignes)
- `src/admin/pages/Dashboard.tsx` (213 lignes)
- `src/lib/emailService.ts` (1025 lignes)
- `src/admin/components/PopupEncaisserAcompte.tsx` (222 lignes)
- `src/admin/pages/Partenaires.tsx` (179 lignes)
- `src/admin/pages/AcomptesEncaisser.tsx` (191 lignes)
- `src/admin/pages/Factures.tsx` (226 lignes)
- `src/lib/quoteStatusHelpers.ts` (280 lignes)
- `src/lib/commissionHelpers.ts` (202 lignes)

---

### Commandes grep utilisées (pour reproductibilité)

```bash
# Point 1
grep -rn "Demander.*VIP\|Prix VIP\|demanderVIP" src/front --include="*.tsx"
grep -rn "prix_vip_negocie\|setPrixVIP" src --include="*.tsx" --include="*.ts"
grep -rn "#7C3AED\|line-through" src --include="*.tsx"

# Point 2
grep -rn "statut.*=.*'acompte\|statut.*=.*'commande" src --include="*.tsx"

# Point 3
grep -rn "prochainPaiementEstSolde\|peutAjouterAcompte" src --include="*.ts"

# Point 4
grep -rn "creerCommissionDevis" src --include="*.tsx"

# Point 5
grep -rn "collection.*partners" src --include="*.tsx"

# Point 6
grep -rn "Dupliquer\|duplicate" src --include="*.tsx"

# Point 7
grep -rn "envoyerEmail\|notifyAcompteEncaisse" src --include="*.tsx"
```

---

## 🎯 CONCLUSION

**Score de conformité** : 2/7 (29%)

L'infrastructure P3-COMPLET (helpers, types, fonctions) est **complète et bien codée**, mais **l'intégration dans les composants UI est manquante à 70%**.

Les points critiques (emails automatiques et commissions) sont **totalement inopérants** malgré un code existant de qualité. C'est un problème de **câblage** : les fonctions existent mais ne sont jamais appelées au bon moment.

**Prochaine étape recommandée** : Commencer par les 3 tâches 🔴 Priorité 1 (bugfix acomptes, commission auto, emails auto) avant de passer aux améliorations UX.
