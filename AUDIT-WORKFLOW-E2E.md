# AUDIT WORKFLOW END-TO-END
**Date** : 2026-04-24 10:20
**Objectif** : valider que le workflow est prêt pour test manuel

---

## 📊 TABLEAU RÉCAPITULATIF

| Étape | Fonctionnalité | Statut | Commentaire |
|-------|----------------|--------|-------------|
| 1-5  | Panier + popup Partenaire | ✅ OK | Code vérifié, statut 'en_negociation_partenaire' |
| 6    | Création devis (en_negociation_partenaire) | ✅ OK | Panier.tsx ligne 150 |
| 7    | Notification email partenaire | ✅ OK | notifyDevisCree (3 emails: client, admin, partner) |
| 8    | Partenaire négocie VIP | ✅ OK | GestionDevisPartner.tsx |
| 9    | Renvoi VIP au client | ✅ OK | notifyDevisVipEnvoye + token généré |
| 10   | Email client reçu avec lien signature | ✅ OK | Lien /signature/{token} dans email |
| 11   | Signature client (Option A ou B) | ✅ OK | DevisCard + SignatureDevis pages |
| 12   | Acompte débloqué après signature | ✅ OK | Flow RIB → Acompte post-signature |
| 13   | Client déclare versement | ✅ OK | notifyAcompteDeclare (3 emails) |
| 14   | Admin encaisse | ✅ OK | PopupEncaisserAcompte + notifyAcompteEncaisse |
| 15   | Commission auto + notif | ❌ À FAIRE | P3-WF1-C2 (pas encore implémenté) |
| 16   | 2e acompte | ✅ OK | Même flow que 1er acompte |
| 17   | Alerte 3e acompte | ❌ À FAIRE | P3-WF1-C2 (popup info "dernier acompte") |
| 18   | Solde forcé après 3e | ❌ À FAIRE | P3-WF1-C2 (bloquer 4e acompte) |

---

## 🔍 DÉTAILS DE L'AUDIT

### 1. UTILISATEURS DE TEST

#### Comptes existants
✅ **client@97import.com** | role=user | nom=Jean Dupont
✅ **vip@97import.com** | role=vip | nom=—
✅ **admin@97import.com** | role=admin | nom=—

#### Comptes manquants
❌ **partenaire@97import.com** : N'EXISTE PAS
❌ **pierre.bernard@97import.com** : N'EXISTE PAS

#### Partenaires actifs trouvés
🔍 **2 partenaires** dans Firestore :
  - christellechen77@gmail.com (role=partner) **⚠️ PAS DE CODE PARTENAIRE**
  - tt@sasfr.com (dubourg thierry) (role=partner) **⚠️ PAS DE CODE PARTENAIRE**

**⚠️ PROBLÈME CRITIQUE** : Aucun partenaire n'a de `partenaire_code` défini dans Firestore.
→ Les devis créés avec partenaire auront un code null ou invalide
→ Il faut créer un vrai compte partenaire avec code (ex: "PB" pour Pierre Bernard)

---

### 2. FONCTIONS EMAIL

#### Toutes les fonctions nécessaires sont présentes

```
174: export async function notifyDevisCree(devis: any): Promise<void>
285: export async function notifyDevisVipEnvoye(devis: any, partenaireName?: string): Promise<void>
368: export async function notifyAcompteDeclare(devis: any, acompte: any): Promise<void>
467: export async function notifyAcompteEncaisse(devis, acompte, factureUrl?): Promise<void>
643: export async function notifySignatureClient(devis: any, partenaireName?: string): Promise<void>
```

#### Mapping événement → fonction

| Étape | Événement | Fonction | Fichier d'appel |
|-------|-----------|----------|-----------------|
| 6 | Devis créé | `notifyDevisCree` | Panier.tsx:170 |
| 9 | VIP envoyé | `notifyDevisVipEnvoye` | GestionDevisPartner.tsx:152 |
| 11 | Signature | `notifySignatureClient` | DevisCard.tsx:93, SignatureDevis.tsx:119 |
| 13 | Acompte déclaré | `notifyAcompteDeclare` | PopupAcompte.tsx:83, DevisCard.tsx:154, SignatureDevis.tsx:184 |
| 14 | Acompte encaissé | `notifyAcompteEncaisse` | PopupEncaisserAcompte.tsx:120 |

✅ **Toutes les fonctions sont appelées aux bons endroits**

---

### 3. EMAILS ENVOYÉS (collection mail/)

#### Statistiques
- **Total emails** : 37
- **État** : 100% SUCCESS (0 erreur)
- **Extension Trigger Email** : ✅ Opérationnelle avec Resend

#### Par événement
```
devis_vip_envoye           : 8
devis_vip_envoye_admin     : 8
devis_cree_admin           : 7
devis_cree                 : 7
acompte_declare_client     : 3
acompte_declare_admin      : 3
```

#### Événements manquants (normaux car pas encore testés)
- `signature_client` : 0
- `signature_admin` : 0
- `signature_partenaire` : 0
- `acompte_encaisse_client` : 0
- `acompte_encaisse_partenaire` : 0

**Raison** : La fonctionnalité signature (P3-WF1-C1) n'a pas encore été testée manuellement.

---

### 4. DERNIER DEVIS DE TEST

#### 5 derniers devis en base

Tous les devis ont :
- Statut : `nouveau` (ancien statut, avant P3-WF1-A)
- Is VIP : False
- Token signature : False
- Signé le : False
- Acomptes : 1 (statut=declare)

**⚠️ CONCLUSION** : Les devis en base ont été créés AVANT les changements P3-WF1-A et P3-WF1-C1.
→ Il faut créer un NOUVEAU devis pour tester le workflow complet.

---

### 5. CODE WORKFLOW VÉRIFIÉ

#### ✅ ÉTAPE 6 : Panier.tsx (création devis)
```typescript
statut: 'en_negociation_partenaire',  // ✅ Nouveau statut OK
is_vip: false,
lignes,
total_ht: total,
partenaire_code: selectedPartner || null,
acomptes: [],

await setDoc(doc(db, 'quotes', devisId), devisData);
await notifyDevisCree(devisData);  // ✅ Email envoyé
```

#### ✅ ÉTAPE 9 : GestionDevisPartner.tsx (VIP)
```typescript
const signatureToken = crypto.randomUUID().replace(/-/g, '');  // ✅ Token 32 char
const tokenExpiry = new Date();
tokenExpiry.setDate(tokenExpiry.getDate() + 30);  // ✅ Expiration 30j

await updateDoc(doc(db, 'quotes', d.id), {
  is_vip: true,
  statut: 'devis_vip_envoye',  // ✅ Statut corrigé
  signature_token: signatureToken,
  signature_token_expiry: tokenExpiry.toISOString(),
  signature_token_used: false,
});

await notifyDevisVipEnvoye(devisAJour, partenaireName);  // ✅ Email avec lien token
```

#### ✅ ÉTAPE 11 : Signature (2 options)
**Option A** : DevisCard.tsx (espace client)
```typescript
await updateDoc(doc(db, 'quotes', devis.id), {
  signe_le: serverTimestamp(),
  statut: 'signe',
});
await notifySignatureClient(devisAJour, partenaireName);
setShowPopupRIB(true);  // ✅ Flow RIB → Acompte
```

**Option B** : SignatureDevis.tsx (/signature/:token)
```typescript
// Validation token + expiration + used
await updateDoc(doc(db, 'quotes', devis.id), {
  signe_le: serverTimestamp(),
  signature_token_used: true,
  statut: 'signe',
});
await notifySignatureClient(devisAJour, partenaireName);
setStep('rib');  // ✅ Flow RIB → Acompte → Terminé
```

#### ✅ ÉTAPE 13 : Client déclare acompte
```typescript
// PopupAcompte.tsx, DevisCard.tsx, SignatureDevis.tsx
const newAcompte = {
  montant: montantAcompte,
  type_compte: typeCompte,
  date: new Date().toISOString(),
  statut: 'declare',
  ref_fa: '',
};

await updateDoc(doc(db, 'quotes', devis.id), {
  acomptes: [...acomptes, newAcompte],
});

await notifyAcompteDeclare(devisAJour, newAcompte);  // ✅ 3 emails
```

#### ✅ ÉTAPE 14 : Admin encaisse
```typescript
// PopupEncaisserAcompte.tsx
await notifyAcompteEncaisse(devisData, acompte, factureUrl);  // ✅ Email avec FA en PJ
```

#### ❌ ÉTAPE 15 : Commission auto
**Statut** : NON IMPLÉMENTÉ (à faire dans P3-WF1-C2)

Actuellement :
- `generateNoteCommission` existe dans pdf-generator.ts
- Utilisé uniquement pour génération manuelle de PDF
- Pas d'appel automatique après encaissement acompte
- Pas de création auto doc dans collection `commissions`

---

## ✅ CE QUI EST PRÊT POUR LE TEST

### Workflow complet (étapes 1-14)
- ✅ Panier : création devis avec partenaire
- ✅ Email partenaire : notification nouveau devis
- ✅ Espace partenaire : négociation prix VIP
- ✅ Email client : offre VIP + lien signature
- ✅ Signature Option A : bouton dans espace client
- ✅ Signature Option B : lien token autonome
- ✅ Flow post-signature : RIB → Acompte
- ✅ Email client : confirmation signature
- ✅ Email partenaire : félicitations
- ✅ Client déclare acompte
- ✅ Email admin : alerte virement à vérifier
- ✅ Admin encaisse acompte
- ✅ Email client : facture acompte en PJ

### Système email
- ✅ Extension Firestore Trigger Email opérationnelle
- ✅ 37 emails envoyés, 100% SUCCESS
- ✅ 0 email en erreur

### Sécurité signature
- ✅ Token unique 32 caractères (UUID v4 sans tirets)
- ✅ Expiration 30 jours
- ✅ Flag `signature_token_used` anti-réutilisation
- ✅ Validation côté serveur (query Firestore)

---

## ⚠️ PROBLÈMES POTENTIELS DÉTECTÉS

### 🔴 CRITIQUE : Pas de partenaire avec code
**Impact** : ❌ BLOQUANT pour test complet

Les 2 partenaires existants n'ont pas de `partenaire_code` :
- christellechen77@gmail.com
- tt@sasfr.com

**Solution** : Créer un compte partenaire de test avec :
```
email: pierre.bernard@97import.com
role: partner
partenaire_code: "PB"
prenom: "Pierre"
nom: "Bernard"
```

### 🟡 ATTENTION : Devis existants en ancien format
**Impact** : ⚠️ Mineur (pollution visuelle)

Les 5 derniers devis ont statut `nouveau` au lieu de `en_negociation_partenaire`.

**Solution** : Pas besoin de migrer, créer un nouveau devis pour le test.

### 🟡 ATTENTION : Signature jamais testée
**Impact** : ⚠️ À surveiller

Aucun email `signature_client/admin/partenaire` dans la collection mail.

**Solution** : Normal, à tester manuellement.

---

## ❌ CE QUI N'EST PAS ENCORE IMPLÉMENTÉ

### Étape 15 : Commission automatique (P3-WF1-C2)
**Ce qui manque** :
- Création auto doc dans `commissions/` après encaissement
- Calcul `commission_montant = prix_VIP - prix_partenaire`
- Email notification commission générée (partenaire)

**Code à créer** :
- Fonction `generateCommissionAuto` dans lib/commissionHelpers.ts
- Appel dans PopupEncaisserAcompte.tsx après encaissement
- Fonction `notifyCommissionGeneree` dans emailService.ts

### Étapes 17-18 : Alertes acomptes multiples (P3-WF1-C2)
**Ce qui manque** :
- Popup info "Attention : dernier acompte autorisé" avant 3e
- Bloquer saisie 4e acompte (forcer solde)
- Calcul auto du solde exact

**Code à créer** :
- Condition dans PopupVerserAcompte.tsx
- Message info si `acomptes.length === 2`
- Bloquer si `acomptes.length >= 3`

---

## 🎯 RECOMMANDATIONS POUR LE TEST MANUEL

### AVANT LE TEST : Créer le compte partenaire

```bash
# Via Firebase Console ou script
Collection: users
Document ID: (auto)
Champs:
  email: "pierre.bernard@97import.com"
  role: "partner"
  partenaire_code: "PB"
  prenom: "Pierre"
  nom: "Bernard"
  actif: true
  created_at: (timestamp)
```

### SCÉNARIO DE TEST COMPLET

#### Prérequis
1. ✅ Créer compte partenaire Pierre Bernard (code "PB")
2. ✅ Se déconnecter de tous les comptes
3. ✅ Créer un NOUVEAU compte client (ex: test2@97import.com)
4. ✅ Avoir une boîte mail accessible pour vérifier les emails

#### Workflow à suivre (étapes 1-14)

**ÉTAPE 1-5 : Création devis**
1. Se connecter avec test2@97import.com
2. Ajouter 2-3 produits au panier
3. Clic "Créer mon devis"
4. Sélectionner partenaire "PB - Pierre Bernard"
5. Valider

**✅ Vérifications** :
- Devis créé avec statut `en_negociation_partenaire`
- Email reçu par client (test2@97import.com)
- Email reçu par admin (parisb2b@gmail.com)
- Email reçu par partenaire (pierre.bernard@97import.com)

---

**ÉTAPE 8-9 : Négociation VIP**
1. Se déconnecter
2. Se connecter avec pierre.bernard@97import.com
3. Aller dans "Gestion devis"
4. Clic sur le nouveau devis
5. Négocier prix VIP (entre min et max)
6. Clic "📨 Envoyer le devis VIP au client"

**✅ Vérifications** :
- Devis mis à jour avec `is_vip: true`, `statut: devis_vip_envoye`
- Champs `signature_token`, `signature_token_expiry`, `signature_token_used: false` créés
- Email reçu par client avec lien `/signature/{token}`
- Email reçu par admin

---

**ÉTAPE 10-11 : Signature (tester les 2 options)**

**Test Option B** (lien token) :
1. Copier le lien `/signature/{token}` depuis l'email client
2. Ouvrir en navigation privée (pas besoin de connexion)
3. Vérifier l'aperçu du devis
4. Clic "✍️ Je signe ce devis"
5. Remplir RIB (ou passer)
6. Déclarer acompte (ex: 30% = 500€)
7. Écran final "🎉 Tout est en ordre !"

**✅ Vérifications** :
- Devis mis à jour avec `signe_le`, `statut: signe`, `signature_token_used: true`
- Acompte ajouté avec `statut: declare`
- Email reçu par client (signature confirmée)
- Email reçu par admin (devis signé)
- Email reçu par partenaire (félicitations)
- Email reçu par client (acompte déclaré)
- Email reçu par admin (virement à vérifier)

**Test Option A** (espace client) :
1. Se connecter avec test2@97import.com
2. Aller dans "Mes devis"
3. Clic sur le devis VIP
4. Clic "✍️ Je signe ce devis"
5. Flow identique : RIB → Acompte

---

**ÉTAPE 14 : Admin encaisse**
1. Se connecter avec admin@97import.com
2. Aller dans "Acomptes à encaisser"
3. Clic "Encaisser" sur l'acompte déclaré
4. Remplir : montant = 500€, type_compte = perso, télécharger FA
5. Valider

**✅ Vérifications** :
- Acompte mis à jour avec `statut: encaisse`, `ref_fa: FA-xxx`
- Email reçu par client avec FA en pièce jointe
- Email reçu par partenaire (commission confirmée)
- Collection `mail/` contient nouvel event `acompte_encaisse_client`

---

**ÉTAPE 16 : 2e acompte** (optionnel)
1. Client retourne dans "Mes devis"
2. Clic "💶 Verser un acompte"
3. Déclarer 2e acompte
4. Admin encaisse

---

### CE QUI NE SERA PAS TESTABLE
- ❌ Étape 15 : Commission auto (pas encore codé)
- ❌ Étape 17 : Alerte "dernier acompte" (pas encore codé)
- ❌ Étape 18 : Bloquer 4e acompte (pas encore codé)

**Ces fonctionnalités seront dans P3-WF1-C2**

---

## 🎯 RÉSULTAT FINAL

### Peut-on lancer le test manuel ?

**🟡 OUI avec réserve** :

✅ **Conditions remplies** :
- [x] Comptes de test existent (user, vip, admin)
- [x] Fonctions email en place pour étapes 6, 7, 9, 11, 13, 14
- [x] Extension Firestore Trigger Email fonctionnelle (37 emails SUCCESS)
- [x] Code P3-WF1-A et P3-WF1-C1 déployé sur branche v2
- [x] Build : 0 erreur TypeScript

❌ **Blocage actuel** :
- [ ] **Aucun partenaire n'a de code** (partenaire_code vide)

### Action requise AVANT le test

🔴 **CRÉER UN COMPTE PARTENAIRE AVEC CODE**

Option 1 : Via Firebase Console
```
Collection: users → Add document
{
  email: "pierre.bernard@97import.com",
  role: "partner",
  partenaire_code: "PB",
  prenom: "Pierre",
  nom: "Bernard",
  actif: true,
  created_at: (timestamp auto)
}
```

Option 2 : Via UI espace admin
- Si existe un outil "Créer partenaire" dans l'admin
- Sinon, créer manuellement dans Firestore

### Scénario de test recommandé

Voir section "RECOMMANDATIONS POUR LE TEST MANUEL" ci-dessus.

**Durée estimée** : 20-30 minutes pour un test complet.

---

## 📝 NOTES COMPLÉMENTAIRES

### Logs à surveiller pendant le test
```bash
# Suivre les emails en temps réel
firebase firestore:watch mail --limit 10

# Vérifier les erreurs
firebase functions:log
```

### Debugging si problème
- Vérifier collection `mail/` pour voir si emails créés
- Vérifier `delivery.state` des emails (SUCCESS / ERROR)
- Console navigateur : chercher erreurs JavaScript
- Network tab : vérifier appels Firestore

### Après le test réussi
- Noter toutes les observations
- Capturer screenshots des emails reçus
- Vérifier que tous les champs Firestore sont corrects
- Préparer feedback pour P3-WF1-C2 (commission auto + alertes)

---

**Généré le** : 2026-04-24 à 10:20
**Par** : Claude Opus 4.6
**Projet** : 97import-firebase
**Branche** : v2
**Dernier commit** : 6465a08 (P3-WF1-C1)
