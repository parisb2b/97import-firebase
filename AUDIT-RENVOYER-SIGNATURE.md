# AUDIT — Renvoi devis + Signature + Commission auto
**Date** : 2026-04-23 16:50
**Objectif** : vérifier ce qui existe avant P3-WF1-C

---

## 📊 TABLEAU SYNTHÈSE

| Point | Statut | Commentaire |
|-------|--------|-------------|
| Bouton "Renvoyer au client" change le statut | ✅ OUI | statut → 'vip_envoye' (ancien nom) |
| Bouton "Renvoyer au client" envoie email | ✅ OUI | via notifyDevisVipEnvoye() |
| Système de token/deep-link | ❌ NON | Aucune trace de crypto/UUID/token |
| Champ signe_le en Firestore | ❌ NON | Aucun champ signature dans devis |
| Bouton "Je signe" dans espace client | ❌ NON | Aucune UI de signature |
| Commission auto dans PopupEncaisserAcompte | ❌ NON | Génération manuelle uniquement |
| Mention "Signé le" dans PDF devis | 🟡 PARTIEL | Zone vide "Signature :" (papier) |
| Système email Resend opérationnel | ✅ OUI | 3 emails envoyés, Firestore extension OK |

---

## 🔍 DÉTAILS PAR PARTIE

### Partie A — Bouton "Renvoyer au client"

**Localisation** : `src/front/pages/espace-partenaire/GestionDevisPartner.tsx`

**Fonction** : `handleSendVIP` (ligne 81)

**Ce qu'elle fait** :
1. Valide les prix négociés (bornes min/max selon coefficients VIP)
2. Construit un objet `prix_negocies` (map, pas array)
3. Calcule le nouveau `total_ht` négocié
4. Met à jour Firestore :
   ```typescript
   await updateDoc(doc(db, 'quotes', d.id), {
     is_vip: true,
     prix_negocies: prixNegociesMap,
     total_ht_public: d.total_ht,    // conserve le total public original
     total_ht: totalHtNegocie,        // nouveau total négocié
     statut: 'vip_envoye',             // ⚠️ ancien nom (pas 'devis_vip_envoye')
     updatedAt: new Date(),
   });
   ```
5. Envoie email via `notifyDevisVipEnvoye(devisAJour, partenaireName)`
6. Affiche toast de confirmation

**⚠️ Problème détecté** : Le statut utilisé est `'vip_envoye'` (ancien) alors que dans P3-WF1-A on a défini `'devis_vip_envoye'`. Il faudra harmoniser.

**Email envoyé** : Oui, via `emailService.ts` → collection `mail/` → Trigger Email extension → Resend

---

### Partie B — Système token/deep-link

**Recherche effectuée** :
- Grep sur `crypto.randomUUID`, `uuidv4`, `generateToken`, `signature_token` → **0 résultat**
- Routes dans `FrontApp.tsx` → Aucune route `/signature/:token` ou similaire

**Conclusion** : **Aucun système de token/lien deep-link n'existe.**

**Routing actuel** : Wouter (pas React Router)

**Routes existantes** :
- `/` (Home)
- `/catalogue/:categorie?/:gamme?`
- `/produit/:id`
- `/connexion`, `/inscription`, `/panier`
- `/espace-client`, `/espace-partenaire`
- `/profil`
- Pas de route dynamique pour signature

**Impact pour P3-WF1-C** :
- Option B (lien deep-link avec token) → **À créer de zéro**
- Option A (redirection vers espace-client) → **Faisable facilement** (route existe déjà)

---

### Partie C — Signature existante

**Recherche code** :
- Grep sur `signe_le`, `signature_date`, `is_signed` → **0 résultat** (sauf le statut 'signe' ajouté dans P3-WF1-A)

**Firestore** :
- 3 devis testés (DVS-2604001, 002, 003) → **Aucun champ** `signe_le`, `signature_token`, `date_signature`, `is_signed`

**Espace client** :
- Fichiers : `MesDevis.tsx`, `DevisCard.tsx`
- Grep sur `signe`, `signer`, `sign(` → **0 résultat**
- **Aucun bouton "Je signe"** dans l'UI

**Conclusion** : **Aucune logique de signature n'existe.** Le statut `'signe'` a été ajouté dans P3-WF1-A mais n'est pas encore utilisé.

**À créer pour P3-WF1-C** :
- Champ Firestore `signe_le: timestamp` (ou `date_signature`)
- Bouton dans espace client (MesDevis ou DevisCard)
- Handler pour passer statut `'devis_vip_envoye'` → `'signe'`
- Condition d'affichage : `devis.statut === 'devis_vip_envoye'`

---

### Partie D — Commission auto dans PopupEncaisserAcompte

**Fichier** : `src/admin/components/PopupEncaisserAcompte.tsx` (221 lignes)

**Grep "commission"** : **0 résultat** dans ce fichier

**Recherche `generateNoteCommission`** :
- Utilisé dans :
  - `DetailCommission.tsx` (ligne 47) — génère PDF d'une NC existante
  - `Factures.tsx` (ligne 89) — génère PDF d'une NC existante
  - `NotesCommission.tsx` (ligne 123) — génère PDF d'une NC existante
  - `pdf-generator.ts` (ligne 718) — définition de la fonction

**Collection Firestore** :
- `commissions/` → **0 documents**
- `notes_commission/` → **Non testée** (probablement vide aussi)

**Conclusion** : **Aucune génération automatique de commission lors de l'encaissement d'acompte.**

**Workflow actuel (manuel)** :
1. Admin encaisse acompte via `PopupEncaisserAcompte`
2. Devis passe au statut suivant (`acompte_1`, `acompte_2`, `acompte_3`, `solde_paye`)
3. Génération de Facture Acompte (FA)
4. **Aucune NC créée automatiquement**

**Workflow à créer** :
1. Détecter si `devis.partenaire_code` existe
2. Si oui, créer automatiquement une NC lors de l'encaissement
3. Utiliser `commissionHelpers.ts` (à vérifier s'il existe)
4. Calculer montant commission (5% du `montant_acompte`)
5. Ajouter document dans `commissions/` avec statut `'non_payee'`

---

### Partie E — PDF devis : support signature

**Fichier** : `src/lib/pdf-generator.ts` (1025 lignes)

**Fonction signature** : `drawConditionsSignature` (ligne 449)

**Ce qu'elle fait** :
```typescript
doc.text('À _______, le __/__/____', 120, y);
doc.text('Signature :', 120, y + 4);
doc.text('Nom et qualité :', 120, y + 8);
```

→ Zone de signature **vide**, à remplir manuellement au stylo (format papier).

**Aucune mention "Signé le [date]"** actuellement.

**À modifier pour P3-WF1-C** :
Si `devis.signe_le` existe :
```typescript
if (quote.signe_le) {
  const dateSig = formatDate(quote.signe_le);
  doc.setFont('helvetica', 'bold');
  doc.text(`✓ Signé le ${dateSig}`, 120, y);
  if (quote.client_nom) {
    doc.text(`Par ${quote.client_nom}`, 120, y + 4);
  }
} else {
  // Zone vide actuelle
  doc.text('À _______, le __/__/____', 120, y);
  doc.text('Signature :', 120, y + 4);
}
```

**Impact** : Modification mineure (~10 lignes) dans `generateDevis()`.

---

### Partie F — Système email

**Fichier** : `src/lib/emailService.ts` (624 lignes)

**Config** :
- FROM: `'97import <notifications@97import.com>'`
- REPLY_TO: `'parisb2b@gmail.com'`
- ADMIN_EMAIL: `'parisb2b@gmail.com'`
- URLs: `https://97import.com/espace-client`, `/espace-partenaire`

**Firestore collection `mail/`** :
- 3 emails envoyés
- Structure :
  - `to` (destinataire)
  - `from`
  - `replyTo`
  - `message` (subject, html, text, attachments)
  - `delivery` (statut envoi via extension)
  - `_metadata` (event, devis_id, created_at)

**Extension Trigger Email** : ✅ Opérationnelle (Resend SMTP configuré)

**Fonctions existantes** :
- `notifyDevisCree(devisData)`
- `notifyDevisVipEnvoye(devis, partenaireName)`
- `notifyAcompteDeclare(devis)`
- `notifyAcompteEncaisse(devis, acompte, faUrl)`

**À créer pour P3-WF1-C** :
```typescript
async function notifySignatureClient(devis: any) {
  // Email au client : confirmation signature + prochaines étapes (acompte)
  // Email à l'admin : alerte "Devis signé"
  // Email au partenaire : notification signature (si partenaire_code existe)
}
```

---

## 🎯 RECOMMANDATIONS POUR P3-WF1-C

### ✅ Ce qui fonctionne déjà (à ne pas refaire)

1. **Bouton "Renvoyer au client" (partenaire)** :
   - ✅ Change statut vers `'vip_envoye'`
   - ✅ Envoie email via `notifyDevisVipEnvoye()`
   - ⚠️ **À corriger** : utilise `'vip_envoye'` au lieu de `'devis_vip_envoye'`

2. **Système email (Resend + Firestore)** :
   - ✅ Fonctionne (3 emails envoyés)
   - ✅ Extension Trigger Email opérationnelle
   - ✅ `emailService.ts` bien structuré

3. **Statut 'signe' défini** :
   - ✅ Type `QuoteStatus` inclut `'signe'`
   - ✅ Couleur (vert) et libellé définis
   - ✅ `calculerStatut()` préserve ce statut

4. **PDF devis** :
   - ✅ Fonction `drawConditionsSignature()` existe
   - ✅ Zone signature affichée (vide pour l'instant)

---

### ❌ Ce qui manque (à créer)

1. **Champ signature dans Firestore** :
   - Ajouter `signe_le: timestamp` (ou `date_signature: timestamp`)
   - Optionnel : `signature_ip`, `signature_user_agent` (traçabilité)

2. **UI signature dans espace client** :
   - Fichier : `MesDevis.tsx` ou `DevisCard.tsx`
   - Bouton "✓ Je signe ce devis" visible si `devis.statut === 'devis_vip_envoye'`
   - Handler `handleSigner()` :
     ```typescript
     await updateDoc(doc(db, 'quotes', devis.id), {
       statut: 'signe',
       signe_le: serverTimestamp(),
       updatedAt: serverTimestamp(),
     });
     await notifySignatureClient(devis);
     ```

3. **Fonction email signature** :
   - Fichier : `emailService.ts`
   - `notifySignatureClient(devis)` → 3 destinataires (client, admin, partenaire)

4. **Commission auto** :
   - Fichier : `PopupEncaisserAcompte.tsx`
   - Après création FA, si `devis.partenaire_code` existe :
     ```typescript
     if (devis.partenaire_code) {
       const montantCommission = montant_acompte * 0.05;
       await addDoc(collection(db, 'commissions'), {
         devis_id: devis.id,
         devis_numero: devis.numero,
         partenaire_code: devis.partenaire_code,
         montant_ht: montantCommission,
         statut: 'non_payee',
         date_creation: serverTimestamp(),
         // ... autres champs
       });
     }
     ```

5. **Système token/deep-link (Option B)** :
   - Fonction `crypto.randomUUID()` pour générer token
   - Champ Firestore `signature_token: string` dans devis
   - Route Wouter `/signature/:token`
   - Page `SignatureDevis.tsx` (lit token, charge devis, affiche bouton)
   - Lien email : `https://97import.com/signature/${token}`

---

### 🟡 Ce qui est partiel (à compléter)

1. **Statut 'vip_envoye' vs 'devis_vip_envoye'** :
   - `GestionDevisPartner.tsx` utilise `'vip_envoye'` (ancien)
   - `quoteStatusHelpers.ts` définit `'devis_vip_envoye'` (nouveau, P3-WF1-A)
   - **Action** : harmoniser en changeant `'vip_envoye'` → `'devis_vip_envoye'` dans `handleSendVIP`

2. **PDF devis avec signature** :
   - Zone signature existe (vide)
   - **Action** : ajouter condition `if (quote.signe_le)` pour afficher "✓ Signé le [date]"

---

### ⚠️ Questions ouvertes (pour Michel)

1. **Préférence Option A vs B** :
   - **Option A** (simple) : Bouton "Je signe" dans espace client (connexion requise)
   - **Option B** (avancée) : Lien deep-link avec token dans email (signature sans connexion)
   - **Recommandation** : Commencer par Option A (+ rapide), Option B en amélioration future

2. **Commission : déclenchement** :
   - À chaque acompte ? → Non, seulement au **1er acompte** (statut `'signe'` → `'acompte_1'`)
   - Ou au solde payé ? → Non, trop tard pour le partenaire

3. **Email signature : contenu** :
   - Client : "Merci, voici comment verser le 1er acompte" (afficher RIB LUXENT ?)
   - Admin : "Alerte : Devis DVS-XXX signé, en attente 1er acompte"
   - Partenaire : "Votre client a signé, suivi de la commande"

---

### 🔐 Faisabilité Option B (signature via token dans email)

**Système token** : ❌ À créer (pas de crypto.randomUUID() actuellement)

**Route signature** : ❌ À créer (`/signature/:token`)

**Complexité** : 🟡 **Moyenne**
- Créer route + page `SignatureDevis.tsx`
- Générer et stocker token lors de `handleSendVIP`
- Valider token (expiration ? usage unique ?)
- Gérer erreurs (token invalide, expiré, déjà utilisé)

**Risque** : 🟡 **Moyen**
- Token exposé dans URL → risque si email intercepté
- Mitigation : expiration 7 jours, usage unique, log IP

**Fallback Option A** : ✅ **Facile**
- Si Option B échoue ou bloque, rediriger vers `/connexion?redirect=/espace-client`
- Dans `MesDevis.tsx`, afficher le bouton "Je signe" pour le devis VIP

**Recommandation** : **Implémenter Option A d'abord** (1-2h), Option B ensuite si besoin (3-4h).

---

### 📋 Scope recommandé pour P3-WF1-C (Option A uniquement)

**Fichiers à modifier** :

1. `src/front/pages/espace-partenaire/GestionDevisPartner.tsx`
   - Ligne 132 : `'vip_envoye'` → `'devis_vip_envoye'`

2. `src/front/pages/espace-client/MesDevis.tsx` ou `DevisCard.tsx`
   - Ajouter bouton "✓ Je signe ce devis" (condition : `statut === 'devis_vip_envoye'`)
   - Handler `handleSigner(devis)` → change statut + email

3. `src/lib/emailService.ts`
   - Nouvelle fonction `notifySignatureClient(devis)`

4. `src/admin/components/PopupEncaisserAcompte.tsx`
   - Après création FA, vérifier `partenaire_code` → créer commission auto

5. `src/lib/pdf-generator.ts`
   - Fonction `drawConditionsSignature()` : condition `if (quote.signe_le)` afficher date

**Fichiers à créer** :

Aucun (Option A réutilise composants existants)

**Durée estimée** : **3-4 heures**
- Harmonisation statut (30min)
- Bouton signature + handler (1h)
- Email signature (1h)
- Commission auto (1h)
- PDF signature (30min)
- Tests (30min)

---

### 🧪 Stratégie de test B → A

**Pas applicable** : Option B non implémentée dans ce scope.

Si Option B implémentée ultérieurement :
- Le fallback vers Option A est **facile** : simplement ne pas inclure le lien token dans l'email, rediriger vers connexion
- Le bouton dans espace client (Option A) reste fonctionnel dans tous les cas

---

## 📌 CONCLUSION

**Prêt pour P3-WF1-C** :
- ✅ Système email fonctionne
- ✅ Statut 'signe' défini
- ✅ Bouton partenaire "Renvoyer" existe (à corriger nom statut)
- ❌ Signature client : **à créer** (Option A recommandée)
- ❌ Commission auto : **à créer**

**Risques faibles** : Toutes les briques existent (emails, Firestore, UI), il suffit de les assembler.

**Option A (simple)** recommandée pour P3-WF1-C, Option B (token deep-link) pour amélioration future.
