# 🔍 SNAPSHOT V43 — AUDIT TECHNIQUE 97IMPORT

**Date** : 2026-04-25
**Branche** : v2
**Commit analysé** : `00dbbb4` (`00dbbb4996a205f0d0b3db6010c923ec024fdd35`)
**Tag de backup global** : `backup-mission-v43-20260425-1727`
**Auditeur** : Claude Code (Senior Architect)
**Mode** : Read-only — aucune modification du code source

---

## 📊 SYNTHÈSE EXÉCUTIVE

| Section | Score | Détail |
|---|---|---|
| Cohérence formats acomptes | ⚠️ Mismatch critique | Création P3 (`encaisse: bool`) mais 4 fichiers lisent encore `statut === 'encaisse'` |
| Couverture emails par statut | ❌ 5 / 14 statuts couverts | Aucun email pour `commande_ferme`, `en_production`, `embarque_chine`, `arrive_port_domtom`, `livre`, `termine`, `nouveau`, `en_negociation_partenaire` |
| Calcul commission | ⚠️ Code mort | `creerCommissionDevis()` définie (`commissionHelpers.ts:84`) mais **JAMAIS** appelée |
| Numérotation documents | ✅ Conforme | Transactions atomiques OK ; mais 3 implémentations parallèles à unifier |
| Helpers paiement (P3) | ✅ Complets | `prochainPaiementEstSolde`, `getSoldeRestant`, `validerNouveauPaiement` présents |
| PDF v40 (charte salmon/violet) | ✅ Conforme | `#C87F6B`, `#FBF0ED`, `#7C3AED` correctement utilisés |
| Tampon "VALIDÉ" PDF | ❌ Absent | Seul un texte `✓ Devis signé électroniquement` (pas de stamp graphique) |
| Cloud Functions | ❌ Absent | Pas de dossier `functions/` → Étape 3.1 devra utiliser Option B (trigger client) |
| Firebase Admin SDK | ❌ Absent | Pas de `firebase-admin-sdk.json` à la racine → Étape 2 (migration) bloquée tant que credentials non fournies |
| collection `factures` | ⚠️ Inexistante | Factures = PDF en Storage, métadonnées dans `quotes.acomptes[].facture_acompte_*` |
| `commission_generated` | ❌ Absent | Champ non présent → impossible de garder l'idempotence sans modif |
| `date_commande` | ❌ Absente | Aucun champ stocké lors transition `commande_ferme` |

### 🔥 Top 5 anomalies bloquantes

1. **Mismatch format acomptes** (ancien `statut` vs nouveau `encaisse`) → Dashboard/CA encaissé incorrect, emails lisent mauvais montant. Fichiers concernés :
   - `src/admin/pages/Dashboard.tsx:89`
   - `src/lib/emailService.ts:609`
   - `src/front/pages/espace-client/MesVirements.tsx:178,296`
   - `src/lib/commissionHelpers.ts:200` (hybrid check)
2. **`creerCommissionDevis()` jamais appelée** → aucune note de commission créée automatiquement. Code mort dans `commissionHelpers.ts:84-156`.
3. **3 fonctions email mortes** : `envoyerEmailFactureAcompte` (L735), `envoyerEmailFactureFinale` (L913), `envoyerEmailCommissionPartenaire` (L955) → définies, jamais appelées.
4. **Statuts `commande_ferme` → `termine` non notifiés** : 8 statuts sur 14 sans email associé.
5. **Pas de Firebase Functions activé** + **Pas de `firebase-admin-sdk.json`** → l'Étape 2 (script migration) ne peut pas démarrer tant que credentials non fournies. L'Étape 3.1 (transition auto Devis→Commande) doit utiliser **Option B** (trigger côté client).

---

# 1️⃣ INVENTAIRE UI (6 fichiers)

## 1.1 — `src/front/pages/Panier.tsx`

| # | Type | Libellé exact | Condition d'affichage | Fonction appelée | Ligne |
|---|------|---------------|----------------------|-------------------|-------|
| 1 | Link | "Voir le catalogue" | `cart.length === 0` | `setLocation('/catalogue')` | 226 |
| 2 | Button | "−" (qté moins) | `cart.length > 0` | `updateQte(item.id, item.qte - 1)` | 265 |
| 3 | Button | "+" (qté plus) | `cart.length > 0` | `updateQte(item.id, item.qte + 1)` | 268 |
| 4 | IconButton | "🗑" (supprimer) | `cart.length > 0` | `removeItem(item.id)` | 284 |
| 5 | Input | "Nom du produit souhaité" | toujours | `setCustomNom(e.target.value)` | 300 |
| 6 | Input | qté custom (number) | toujours | `setCustomQte(Number(...) \|\| 1)` | 303 |
| 7 | Input | "Description détaillée…" | toujours | `setCustomDesc(e.target.value)` | 306 |
| 8 | Input | "Lien YouTube ou site…" | toujours | `setCustomLien(e.target.value)` | 310 |
| 9 | Button | "📦 Ajouter au devis" | toujours | `handleAddCustom()` | 313 |
| 10 | Button | `t('cart.genererDevis')` | `cart.length > 0` | `handleOpenPopup()` | 348 |
| 11 | Button | sélection partenaire | `popupStep === 0` | `setSelectedPartner(p.code)` | 377 |
| 12 | Button | `t('popup.confirmer')` | `popupStep === 0` | `handleCreateQuote()` | 389 |

**État local** : `cart`, `submitting`, `customNom`, `customQte`, `customDesc`, `customLien`, `popupStep`, `partners`, `selectedPartner`.

**Effets / Firestore** :
- `useEffect L68` : chargement panier depuis `localStorage`.
- `handleOpenPopup L112` : `getDocs(query(collection(db,'partners'), where('actif','==',true)))`.
- `handleCreateQuote L129` : `setDoc(doc(db,'quotes',devisId), {...})` + `notifyDevisCree()`.

---

## 1.2 — `src/front/pages/SignatureDevis.tsx`

| # | Type | Libellé exact | Condition d'affichage | Fonction appelée | Ligne |
|---|------|---------------|----------------------|-------------------|-------|
| 1 | Button | "Accéder à mon espace client" | `step === 'invalid'` | `setLocation('/espace-client')` | 224 |
| 2 | Button | "Accéder à mon espace client" | `step === 'deja_signe'` | `setLocation('/espace-client')` | 255 |
| 3 | Button | "✍️ Je signe le devis" | `step === 'apercu'` | `handleSigner()` | 416 |
| 4 | Button | "📄 Voir plus de détails…" | `step === 'apercu'` | `setLocation('/espace-client')` | 434 |
| 5 | Button | "Accéder à mon espace client" | `step === 'termine'` | `setLocation('/espace-client')` | 468 |
| 6 | Component | `<PopupSaisieRIB>` | `step === 'rib'` | `handleRIBSubmit(data)` | 493 |
| 7 | Component | `<PopupVerserAcompte>` | `step === 'acompte'` | `handleAcompteSubmit(data)` | 504 |

**État local** : `step` (loading→invalid→deja_signe→apercu→signer→rib→acompte→termine), `devis`, `error`.

**Effets / Firestore** :
- `useEffect L44` : `getDocs(query(collection(db,'quotes'), where('signature_token','==',token)))`.
- `handleSigner L95` : `updateDoc(doc(db,'quotes',devis.id), {signe_le, statut})` + `notifySignatureClient()`.
- `handleRIBSubmit L144` : `updateDoc(...)` enregistre IBAN/BIC.
- `handleAcompteSubmit L164` : `updateDoc(...)` ajoute acompte + `notifyAcompteDeclare()`.

---

## 1.3 — `src/front/pages/espace-client/PopupAcompte.tsx`

| # | Type | Libellé exact | Condition d'affichage | Fonction appelée | Ligne |
|---|------|---------------|----------------------|-------------------|-------|
| 1 | Button | "👤 Compte personnel" / "🏢 Compte professionnel" (toggle) | toujours | `setTypeCompte(type)` | 121 |
| 2 | Input | montant (number) | toujours | `setMontant(Number(e.target.value))` | 134 |
| 3 | Button | "✅ J'ai effectué le virement — Confirmer" | toujours | `handleConfirm()` | 159 |
| 4 | Button | "Fermer — Je virerai plus tard" | toujours | `onClose()` | 169 |

**État local** : `typeCompte` ('perso'|'pro'), `montant` (init 500), `submitting`.

**Effets / Firestore** :
- `useEffect L42` : `getDocs(query(collection(db,'quotes')))` calcule montant suggéré.
- `handleConfirm L58` : `updateDoc(...)` ajoute acompte (format **P3-COMPLET, encaisse:false**) + `notifyAcompteDeclare()`.

---

## 1.4 — `src/front/pages/espace-client/DevisCard.tsx`

| # | Type | Libellé exact | Condition d'affichage | Fonction appelée | Ligne |
|---|------|---------------|----------------------|-------------------|-------|
| 1 | Button | "📄 PDF" | header non-déplié | `handleDownloadDevis(e)` | 228 |
| 2 | Button | header (toggle ouvert/fermé) | toujours | `setOpen(!open)` | 193 |
| 3 | Button | "✍️ Je signe ce devis" | `devis.statut === 'devis_vip_envoye' && !devis.signe_le` | `handleSigner()` | 452 |
| 4 | Button | "💶 Verser un acompte" | `peutVerserAcompte(devis)` | `setShowPopupAcompte(true)` | 498 |
| 5 | Link | "👁" (voir document) | `disponible === true` | `window.open(url, '_blank')` | 589 |
| 6 | Link | "⬇️" (télécharger document) | `disponible === true` | download PDF | 590 |
| 7 | Link | liens multi-factures | `urls.length > 0` | open document | 630 |
| 8 | Component | `<PopupAcompte>` | `showPopupAcompte` | `onAcompteAdded()` | 521 |
| 9 | Component | `<PopupSaisieRIB>` | `showPopupRIB` | `handleRIBSubmit(data)` | 535 |
| 10 | Component | `<PopupVerserAcompte>` | `showPopupVerserAcompte` | `handleAcompteSignatureSubmit(data)` | 548 |

**État local** : `open`, `showPopupAcompte`, `showPopupRIB`, `showPopupVerserAcompte`.

**Effets / Firestore** :
- `handleDownloadDevis L51` : `getDoc(doc(db,'admin_params','emetteur'))` + `generateDevis()` + `downloadPDF()`.
- `handleSigner L69` : `updateDoc(...)` + `notifySignatureClient()`.
- `handleRIBSubmit L111` : enregistre RIB.
- `handleAcompteSignatureSubmit L133` : ajoute acompte + `notifyAcompteDeclare()`.

---

## 1.5 — `src/admin/pages/DetailDevis.tsx`

| # | Type | Libellé exact | Condition d'affichage | Fonction appelée | Ligne |
|---|------|---------------|----------------------|-------------------|-------|
| 1 | Button | `t('btn.encaisser')` | `!isNew && acomptes.some(a => !a.encaisse)` | `handleEncaisser()` | 282 |
| 2 | Button | `t('btn.enregistrer')` | toujours | `handleSave()` | 286 |
| 3 | Button | "PDF" | `!isNew` | `generateDevis()` + `downloadPDF()` | 290 |
| 4 | Input | "Nom" (client_nom) | toujours | `setDevis({...,client_nom})` | 315 |
| 5 | Input | "Email" (client_email) | toujours | `setDevis({...,client_email})` | 320 |
| 6 | Input | "Téléphone" (client_tel) | toujours | `setDevis({...,client_tel})` | 325 |
| 7 | Input | "SIRET" (client_siret) | toujours | `setDevis({...,client_siret})` | 330 |
| 8 | Input | "Adresse" (textarea) | toujours | `setDevis({...,client_adresse})` | 335 |
| 9 | Select | "Destination" | toujours | `setDevis({...,destination})` | 340 |
| 10 | Select | "Statut" | toujours | `setDevis({...,statut})` | 351 |
| 11 | Button | "+ Ajouter une ligne" | toujours | `handleAddLigne()` | 365 |
| 12 | Input | "Réf" (par ligne) | `lignes.length>0` | `handleLigneChange(idx,'ref',v)` | 387 |
| 13 | Input | "Désignation" (par ligne) | `lignes.length>0` | `handleLigneChange(idx,'nom_fr',v)` | 391 |
| 14 | Input | "Qté" (par ligne) | `lignes.length>0` | `handleLigneChange(idx,'qte',v)` | 395 |
| 15 | Input | "PU HT" (par ligne) | `lignes.length>0 && !estLectureSeule` | `handleLigneChange(idx,'prix_unitaire',v)` | 430 |
| 16 | Button | "✕" (supprimer ligne) | `lignes.length>0` | `handleRemoveLigne(idx)` | 461 |
| 17 | Component | `<PopupEncaisserAcompte>` | `showEncaisserModal` | onSuccess callback | 520 |

**État local** : `devis` (Devis), `loading`, `error`, `saving`, `successMsg`, `errorMsg`, `emetteurData`, `showEncaisserModal`.

**Effets / Firestore** :
- `useEffect L83` : `getDoc(doc(db,'admin_params','emetteur'))`.
- `useEffect L95` : `getDoc(doc(db,'quotes',params.id))` + `getDoc(doc(db,'users',client_id))`.
- `handleSave L174` : `setDoc()` ou `updateDoc()`.
- `handleEncaisser L243` : ouvre modal d'encaissement.

⚠️ **Observation** : `estLectureSeule` n'est pas (encore) défini dans ce fichier — à introduire en Étape 3.1 pour gating UI.

---

## 1.6 — `src/admin/pages/Dashboard.tsx`

| # | Type | Libellé exact | Condition d'affichage | Fonction appelée | Ligne |
|---|------|---------------|----------------------|-------------------|-------|
| 1 | Link | "Voir tout" (devis) | toujours | navigate `/admin/devis` | 217 |
| 2 | Link | "👁" (devis demo) | `recentDevis.length === 0` | navigate `/admin/devis/D2604006` | 246 |
| 3 | IconButton | "👁" (voir devis) | `recentDevis.length > 0` | navigate `/admin/devis/{d.id}` | 286 |
| 4 | Link | "Gérer" (conteneurs) | toujours | navigate `/admin/conteneurs` | 301 |
| 5 | Link | "Traiter →" (SAV urgents) | `stats.savUrgents > 0` | navigate `/admin/sav` | 387 |
| 6 | Link | "Voir tout" (commissions) | toujours | navigate `/admin/commissions` | 402 |

**État local** : `stats` (devisTotal, devisEnAttente, devisVip, devisStd, **caEncaisse**, **soldeRestant**, commissionsDues, commissionsPartenaires, savUrgents), `recentDevis`, `conteneurs`, `commissions`, `loading`, `errorMsg`.

**Effets / Firestore** (`useEffect L73 → loadData()`) :
- `getDocs(collection(db,'quotes'))` — TOUS les devis
- `getDocs(collection(db,'commissions'))`
- `getDocs(collection(db,'notes_commission'))`
- `getDocs(query(collection(db,'sav'), where('statut','==','nouveau')))`
- `getDocs(query(collection(db,'containers'), where('statut','in',[...]), limit(3)))`

🔴 **BUG critique L84-89** : le calcul `caEncaisse` filtre `a.statut === 'encaisse'` (ancien format). Avec le format P3 (`encaisse: boolean`), ce calcul renvoie systématiquement 0. **À corriger en Étape 2/3.**

---

## Statistiques UI globales

| Fichier | Total | Button | Input | Select | Link | IconButton | Popup |
|---|---|---|---|---|---|---|---|
| Panier.tsx | 12 | 6 | 4 | 0 | 1 | 1 | 0 |
| SignatureDevis.tsx | 7 | 5 | 0 | 0 | 0 | 0 | 2 |
| PopupAcompte.tsx | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| DevisCard.tsx | 10 | 4 | 0 | 0 | 3 | 0 | 3 |
| DetailDevis.tsx | 17 | 4 | 8 | 2 | 0 | 0 | 1 |
| Dashboard.tsx | 6 | 0 | 0 | 0 | 6 | 0 | 0 |
| **TOTAL** | **56** | 22 | 13 | 2 | 10 | 1 | 6 |

---

# 2️⃣ STRUCTURE FIRESTORE

## 2.1 — Collection `quotes`

### Schéma document

| Champ | Type | Optionnel | Source code | Notes |
|---|---|---|---|---|
| `numero` | string | Non | `Panier.tsx:160` | Format `DVS-AAMM-NNN` |
| `client_id` | string | Non | `DetailDevis.tsx:140` | UID Firebase users/ |
| `client_email` | string | Non | `DetailDevis.tsx:142` | |
| `client_nom` | string | Non | `DetailDevis.tsx:141` | |
| `client_prenom` | string | Oui | `Panier.tsx:164` | |
| `client_tel` | string | Oui | `DetailDevis.tsx:143` | |
| `client_adresse` | string | Oui | `DetailDevis.tsx:144` | |
| `client_siret` | string | Oui | `DetailDevis.tsx:145` | |
| `partenaire_id` | string \| null | Oui | `DetailDevis.tsx:146` | null = ADMIN |
| `partenaire_code` | string | Oui | `Panier.tsx:174` | Ex: "CHN", "ADMIN" |
| `statut` | string | Non | voir énum `quoteStatusHelpers.ts:4-17` | |
| `lignes` | QuoteLine[] | Non | `DetailDevis.tsx:148` | voir sous-structure |
| `acomptes` | Acompte[] | Non | `DetailDevis.tsx:151` | voir sous-structure (P3) |
| `total_ht` | number | Non | `DetailDevis.tsx:149` | |
| `acompte_pct` | number | Oui | `DetailDevis.tsx:150` | défaut 30 |
| `total_encaisse` | number | Oui | `DetailDevis.tsx:152` | calculé |
| `solde_restant` | number | Oui | `DetailDevis.tsx:153` | calculé |
| `destination` | string | Oui | `Panier.tsx:169` | MQ/GP/RE/GF/FR |
| `is_vip` | boolean | Oui | `Panier.tsx:171` | |
| `prix_negocies` | Record<string,number> | Oui | `DetailDevis.tsx:46` | map ref → prix VIP par ligne |
| `signature_token` | string | Oui | `SignatureDevis.tsx:44` | token URL signature |
| `signe_le` | string | Oui | `SignatureDevis.tsx:95` | ISO 8601 |
| `devis_url` | string | Oui | `DetailDevis.tsx:299` | URL PDF Storage |
| `createdAt` | Timestamp | Non | `Panier.tsx:176` | `serverTimestamp()` |
| `updatedAt` | Timestamp | Oui | `Panier.tsx:177` | `serverTimestamp()` |
| `commission_generated` | boolean | **❌ ABSENT** | — | À ajouter en v43 |
| `date_commande` | string | **❌ ABSENT** | — | À ajouter en v43 |

### Sous-structure `QuoteLine` (élément de `lignes[]`)

| Champ | Type | Optionnel | Notes |
|---|---|---|---|
| `reference` / `ref` | string | Non | doublons legacy |
| `nom` / `nom_fr` | string | Non | doublons legacy |
| `quantite` / `qte` | number | Non | doublons legacy |
| `prix_achat` | number | Oui | coût fournisseur |
| `prix_partenaire` | number | Oui | base de calcul commission |
| **`prix_vip_negocie`** | number | Oui | **prix VIP au niveau LIGNE** (`quoteStatusHelpers.ts:46`) |
| `prix_unitaire_final` / `prix_unitaire` | number | Non | doublons legacy |
| `total_ligne` / `total` | number | Non | doublons legacy |
| `type` | 'product' \| 'custom' | Oui | |
| `description` | string | Oui | produit sur-mesure |
| `lien` | string | Oui | URL externe |

> 🔍 **Observation** : `prix_vip_negocie` est bien stocké **au niveau LIGNE** (pas au niveau document). Confirmation : `quoteStatusHelpers.ts:46` + `GestionDevisPartner.tsx:137`.

### Sous-structure `Acompte` (élément de `acomptes[]`) — Format P3-COMPLET

```typescript
interface Acompte {
  numero: number;                           // 0 (solde forcé) | 1 | 2 | 3
  montant: number;
  date_reception: string;                   // ISO 8601
  reference_virement?: string;
  facture_acompte_numero?: string;          // FA-AC-AAMM-NNN
  facture_acompte_pdf_url?: string;
  is_solde: boolean;
  encaisse: boolean;                        // true = validé admin / false = déclaré client
  created_at: string;                       // ISO 8601
  created_by: string;                       // 'client' | 'admin' | 'migration_v43'
  type_compte?: 'perso' | 'pro';
  iban_utilise?: string;
}
```

Source : `quoteStatusHelpers.ts:20-30` + `PopupEncaisserAcompte.tsx:71-82` + `PopupAcompte.tsx:67-80`.

### Énumération `statut` (15 valeurs — `quoteStatusHelpers.ts:4-17`)

| Statut | Sémantique | Phase workflow |
|---|---|---|
| `nouveau` | Devis créé par client | P1 |
| `en_negociation_partenaire` | Partenaire en cours de négociation | P3-WF1 |
| `devis_vip_envoye` | Partenaire a renvoyé le devis VIP | P3-WF1 |
| `signe` | Devis signé client | P3-WF2 |
| `acompte_1` | 1er acompte encaissé | P3-WF3 |
| `acompte_2` | 2e acompte encaissé | P3-WF3 |
| `acompte_3` | 3e acompte encaissé | P3-WF3 |
| `solde_paye` | Solde encaissé | P3-WF3 |
| `commande_ferme` | Commande passée fournisseur | P3-WF4 |
| `en_production` | Production lancée | P3-WF4 |
| `embarque_chine` | Conteneur parti | P3-WF5 |
| `arrive_port_domtom` | Arrivée port DOM-TOM | P3-WF5 |
| `livre` | Livré chez client | P3-WF6 |
| `termine` | Clôturé | — |
| `annule` | Annulé | — |

### Détection ancien vs nouveau format ACOMPTES

#### 🟡 Ancien format (legacy) — détecté en LECTURE dans :

```typescript
// src/admin/pages/Dashboard.tsx:84-89
if (devis.acomptes && Array.isArray(devis.acomptes)) {
  for (const a of devis.acomptes) {
    if (a.statut === 'encaisse') caEncaisse += (a.montant || 0);
  }
}
```

```typescript
// src/lib/emailService.ts:609
.filter((a: any) => a.statut === 'encaisse')
```

```typescript
// src/front/pages/espace-client/MesVirements.tsx:178, 296
v.statut === 'encaisse'
```

```typescript
// src/lib/commissionHelpers.ts:200 (HYBRID — supporte les deux)
return devis.acomptes.some((a: any) =>
  a.statut === 'encaisse' || a.statut === 'confirme' || a.encaisse === true
);
```

#### ✅ Nouveau format P3-COMPLET — détecté en ÉCRITURE dans :

```typescript
// src/admin/components/PopupEncaisserAcompte.tsx:71-82
{
  numero: estSolde ? 0 : (nbPartiels + 1),
  montant: acompteCible.montant,
  date_reception: acompteCible.date || new Date().toISOString(),
  reference_virement: acompteCible.reference_virement || undefined,
  facture_acompte_numero: numeroFA,
  facture_acompte_pdf_url: '',
  is_solde: estSolde,
  encaisse: true,
  created_at: acompteCible.created_at || new Date().toISOString(),
  created_by: acompteCible.created_by || 'admin',
}
```

```typescript
// src/front/pages/espace-client/PopupAcompte.tsx:67-80
{
  numero: 1,                       // recalculé à l'encaissement
  montant,
  date_reception: new Date().toISOString(),
  is_solde: false,
  encaisse: false,
  created_at: new Date().toISOString(),
  created_by: 'client',
  type_compte: typeCompte,
  iban_utilise: rib.iban,
}
```

#### 🔴 Conséquences des mismatches détectés

1. **Dashboard CA encaissé** = toujours 0 ou sous-évalué (P3 invisible).
2. **Email `notifyAcompteEncaisse`** : montant total recalculé incorrectement (L609 emailService).
3. **MesVirements client** : affichage incorrect du statut "encaissé" pour les acomptes P3.
4. La création d'acomptes côté client (`PopupAcompte.tsx`) utilise déjà le nouveau format → mais l'admin lit parfois encore l'ancien → bug "Aucun acompte à encaisser" possible.

---

## 2.2 — Collection `products`

| Champ | Type | Optionnel | Notes |
|---|---|---|---|
| `numero_interne` | string | Non | référence unique (clé) |
| `categorie` | string | Non | mini-pelles / maisons-modulaires / solaire / … |
| `sous_categorie` | string | Oui | |
| `nom_fr` | string | Non | |
| `nom_zh` | string | Oui | |
| `nom_en` | string | Oui | |
| `description_fr/zh/en` | string | Oui | |
| `fournisseur` | string | Oui | |
| `prix_achat_cny` | number | Non | |
| `prix_achat_eur` | number | Oui | converti |
| `code_hs` | string | Non | code douanier |
| `dimensions` | `{l, L, h, volume_m3, poids_kg}` | Oui | volume calculé auto |
| `actif` | boolean | Oui | défaut false |
| `photos` | string[] | Oui | URLs Storage |
| `video_url` | string | Oui | YouTube/Vimeo |
| `createdAt`, `updatedAt` | Timestamp | Non / Oui | |

⚠️ **NB pour Étape 3.3 (Import Excel)** : Le mapping demandé par la mission utilise les champs `prix_achat`, `prix_partenaire`, `prix_unitaire` (non présents dans le schéma actuel — celui-ci utilise `prix_achat_cny`/`prix_achat_eur`). À clarifier avec Michel : soit on enrichit le schéma, soit on map différemment.

### Endroits d'écriture
- `src/admin/pages/NouveauProduit.tsx:17` — `setDoc(...)`
- `src/admin/components/ProductForm.tsx:42` — `updateDoc(...)` (auto-save 800ms)
- `src/admin/pages/FicheProduit.tsx` — `setDoc(..., {merge: !isCreation})`
- `src/admin/pages/EditProduit.tsx` — `updateDoc(...)`
- `src/admin/components/produit/ModalDupliquerProduit.tsx` — `setDoc(...)`

---

## 2.3 — Collection `partners`

| Champ | Type | Optionnel | Notes |
|---|---|---|---|
| `nom` | string | Non | raison sociale |
| `code` | string | Non | 2-3 lettres majuscules ("CHN") |
| `email` | string | Oui | |
| `tel` | string | Oui | |
| `commission_taux` | number | Oui | % sur marge (défaut 0) |
| `actif` | boolean | Non | filtré dans le panier |
| `userId` | string | Oui | UID Firebase |
| `createdAt` | Timestamp | Oui | |

### Endroits d'écriture
- `src/admin/pages/Partenaires.tsx:75` — `addDoc(...)`
- `src/admin/pages/Partenaires.tsx:45` — `updateDoc(..., {actif: !p.actif})`

---

## 2.4 — Collection `commissions` (= "notes_commission")

> ⚠️ Le code utilise **`commissions`** (cf. `commissionHelpers.ts:109`, `Dashboard.tsx`) ET aussi **`notes_commission`** (cf. `Dashboard.tsx`). Deux collections différentes ou alias ? À clarifier.

| Champ | Type | Optionnel | Notes |
|---|---|---|---|
| `devis_id` | string | Oui | |
| `devis_numero` | string | Non | DVS-… |
| `partenaire_code` | string | Non | |
| `lignes` | CommissionLigne[] | Non | détail par ligne |
| `total_commission` | number | Non | |
| `statut` | string | Non | `'en_attente'` \| `'payee'` |
| `created_at` | Timestamp | Non | |
| `note_commission_numero` | string | Oui | NC-AAMM-NNN |
| `note_commission_pdf_url` | string | Oui | |
| `date_versement` | string | Oui | |
| `date_envoi` | Timestamp | Oui | |
| `paiement` | object | Oui | méthode/date/ref |
| `partenaire_nom`, `partenaire_id`, `client_nom`, `quote_id` | string | Oui | dénormalisés |

### Sous-structure `CommissionLigne`

```typescript
{
  reference: string;
  nom: string;
  prix_partenaire: number;
  prix_vip_negocie: number;
  quantite: number;
  commission_unitaire: number;       // = max(0, prix_vip - prix_partenaire)
  commission_totale: number;         // = unitaire × quantite
}
```

### Endroits d'écriture
- `src/lib/commissionHelpers.ts:109` — `addDoc(collection(db,'commissions'), {...})` ⚠️ **mais cette fonction `creerCommissionDevis` n'est jamais appelée**
- `src/admin/components/commission/ModalNouvelleCommission.tsx` — création manuelle
- `src/admin/pages/NotesCommission.tsx:135` — repassage `'en_attente'`
- `src/admin/pages/NotesCommission.tsx:210` — `date_envoi: serverTimestamp()`
- `src/admin/components/commission/ModalMarquerPayee.tsx` — `statut: 'payee'`

---

## 2.5 — Collection `factures`

❌ **N'existe pas** comme collection séparée. Les factures (acompte + finale) sont :
- **Générées dynamiquement** via `src/lib/generateInvoiceAcompte.ts` et `src/lib/generateInvoiceFinale.ts`.
- **Stockées en Firebase Storage** : `factures_acompte/{numeroFA}.pdf`.
- **Référencées dans** : `quotes.acomptes[].facture_acompte_pdf_url` (et `quotes.facture_finale_url` si existe).

➡️ **Recommandation** : Pas besoin de créer cette collection en v43, sauf besoin métier explicite (ex: liste filtrable des factures par client).

---

## 2.6 — Collection `mail` (Firebase Trigger Email)

```typescript
{
  to: string | string[],
  cc?: string | string[],
  bcc?: string | string[],
  replyTo?: string,
  from?: string,                  // défaut '97import <notifications@97import.com>'
  message: {
    subject: string,
    html: string,
    text: string,
    attachments?: { filename, path }[],
  },
  _metadata?: {
    event: string,                // ex: 'devis_cree', 'acompte_encaisse'
    devis_id?: string,
    created_at: Timestamp,
  },
}
```

### Endroits d'écriture
- `src/lib/emailService.ts:52` — wrapper `sendEmail()` interne
- `src/lib/emailService.ts:344, 404, 449` — appels directs `addDoc` (devis VIP)
- `src/admin/pages/NotesCommission.tsx:182` — envoi note commission

---

# 3️⃣ ANALYSE MOTEURS

## 3.1 — `src/lib/pdf-generator.ts` (888 lignes)

### Fonctions exportées

| Fonction | Signature (résumée) | Ligne |
|---|---|---|
| `generateDevis` | `(quote: any, emetteur?: any) => jsPDF` | 510 |
| `generateFactureFinale` | `(quote: any, numero: string, emetteur?: any) => jsPDF` | 553 |
| `generateNoteCommission` | `(note: any, emetteur?: any) => jsPDF` | 581 |
| `downloadPDF` | helper interne (probable) | — |

### Endroits d'appel

- `generateDevis` → `Factures.tsx`, `ListeDevis.tsx`, `DetailDevis.tsx`, `GestionDevisPartner.tsx`, `DevisCard.tsx`, `DetailCommission.tsx` (6).
- `generateFactureFinale` → `Factures.tsx`, `DetailFacture.tsx`.
- `generateNoteCommission` → `DetailCommission.tsx`, `Factures.tsx`, `NotesCommission.tsx`.

### Prix barrés VIP

✅ **Implémenté correctement** :
- `pdf-generator.ts:8` `salmon: [200, 127, 107]` (`#C87F6B`)
- `pdf-generator.ts:9` `salmonLight: [251, 240, 237]` (`#FBF0ED`)
- `pdf-generator.ts:345` `const estNegocie = isVip && prixNegocie !== prixPublic`
- `pdf-generator.ts:349-355` : prix public en gris + barré (via `doc.line()`)
- `pdf-generator.ts:357-359` : prix VIP en violet `#7C3AED` (`[124, 58, 237]`) + bold

### Tampon "VALIDÉ"

❌ **ABSENT**. Le seul indicateur de validation est un texte `✓ Devis signé électroniquement` dans `drawConditionsSignature()` (ligne 449). Pas d'image stamp.

➡️ La mission v43 mentionne le tampon comme contrainte (« seule injection de données autorisée → prix barré VIP + tampon "VALIDÉ" »). Si Michel veut le tampon, **dérogation à la règle d'or** nécessaire (création `DEMANDE-MICHEL-V43.md`).

---

## 3.2 — `src/lib/counters.ts` (23 lignes)

```typescript
export const getNextNumber = async (prefix: string): Promise<string>
```

**Mécanisme** :
1. `aamm = AAMM` (ex: `2604` pour avril 2026).
2. ID compteur Firestore : `counters/{prefix}_{aamm}` (ex: `DVS_2604`).
3. `runTransaction(...)` atomique : lit valeur, incrémente, écrit.
4. Retourne `${prefix}-${aamm}${paddedCount}` → `DVS-2604001`.

**Préfixes attendus** (commentaire L22) : `DVS | FA | F | NC | CONT | SAV | LA | STK`.

**Appels détectés** :
- `DVS` : `Panier.tsx`, `DetailDevis.tsx`
- `CTN` : `NouveauConteneur.tsx`
- `LA` : `NouvelleListeAchat.tsx`
- `SAV` : `PopupSAV.tsx`

### `src/lib/ncNumerotation.ts`

Fichier séparé (47 lignes) : `genererNumeroNC()` → format `NC-AAMM-NNN` avec compteur dédié `nc_${aamm}`. **Logique dupliquée** par rapport à `counters.ts`.

⚠️ **3e implémentation** : `quoteStatusHelpers.generateNumeroDocument` (L245) gère aussi `FA-AC` / `FA` / `NC` via le compteur. Trois sources de vérité → maintenance fragile.

---

## 3.3 — `src/lib/emailService.ts` (1001 lignes) ⚠️ CRITIQUE

### Fonctions exportées (8)

| # | Fonction | Ligne | Statut |
|---|---|---|---|
| 1 | `notifyDevisCree` | 218 | ✅ Appelée |
| 2 | `notifyDevisVipEnvoye` | 332 | ✅ Appelée |
| 3 | `notifyAcompteDeclare` | 497 | ✅ Appelée (3×) |
| 4 | `notifyAcompteEncaisse` | 595 | ✅ Appelée |
| 5 | `envoyerEmailFactureAcompte` | 735 | ❌ **MORTE** |
| 6 | `notifySignatureClient` | 807 | ✅ Appelée (2×) |
| 7 | `envoyerEmailFactureFinale` | 913 | ❌ **MORTE** |
| 8 | `envoyerEmailCommissionPartenaire` | 955 | ❌ **MORTE** |

### Couverture par statut `quotes.statut`

| Statut | Email associé | Couverture |
|---|---|---|
| `nouveau` | — | ❌ |
| `en_negociation_partenaire` | — | ❌ |
| `devis_vip_envoye` | `notifyDevisVipEnvoye` | ✅ |
| `signe` | `notifySignatureClient` | ✅ |
| `acompte_1` | `notifyAcompteEncaisse` | ✅ |
| `acompte_2` | `notifyAcompteEncaisse` | ✅ |
| `acompte_3` | `notifyAcompteEncaisse` | ✅ |
| `solde_paye` | `notifyAcompteEncaisse` (dernière) | ⚠️ Partiel |
| `commande_ferme` | — | ❌ |
| `en_production` | — | ❌ |
| `embarque_chine` | — | ❌ |
| `arrive_port_domtom` | — | ❌ |
| `livre` | — | ❌ |
| `termine` | — | ❌ |

**Couverture : 5 / 14 statuts (≈ 36 %)**.

🔴 La mission v43 stipule « emails systématiques à chaque changement de statut ». **L'écart à combler est important** — décider en Étape 3 quels statuts notifier.

---

## 3.4 — `src/lib/quoteStatusHelpers.ts` (277 lignes)

### Fonctions exportées

| Fonction | Ligne | Rôle |
|---|---|---|
| `getTotalEncaisse` | 54 | Somme `acomptes[].montant` où `encaisse===true` |
| `getSoldeRestant` | 63 | `total_ht - total_encaisse` |
| `getNbAcomptesEncaisses` | 70 | Compteur acomptes encaissés non-solde |
| `peutAjouterAcompte` | 77 | OK si `<= 3` partiels et solde > 0 |
| **`prochainPaiementEstSolde`** | 84 | `getNbAcomptesEncaisses(...) >= 3` |
| `estEntierementPaye` | 91 | `solde_restant <= 0.01` |
| **`validerNouveauPaiement`** | 98 | min 50€, max solde restant, solde forcé au 4e |
| `calculerStatutPaiement` | 121 | Statut auto via nb acomptes |
| `libelleStatut` | 145 | Labels FR (15) |
| `couleurStatut` | 169 | Couleurs badges (15) |
| `footerTextPDF` | 193 | Footer PDF selon contexte |
| `generateNumeroDocument` | 245 | FA-AC / FA / NC via counter |

### Helpers de paiement (extraits)

```typescript
// L84-86
export function prochainPaiementEstSolde(acomptes: Acompte[] = []): boolean {
  return getNbAcomptesEncaisses(acomptes) >= 3;
}

// L98-114 (résumé)
export function validerNouveauPaiement(montant, soldeRestant, nbActuel): {ok, error?} {
  if (montant < 50) return error('Montant minimum 50€');
  if (montant > soldeRestant + 0.01) return error('> solde restant');
  if (nbActuel >= 3 && Math.abs(montant - soldeRestant) > 0.01) {
    return error('4e paiement = solde forcé');
  }
  return ok;
}
```

✅ **L'infrastructure P3 est déjà présente.** Étape 3.2 = simplement câbler les boutons UI sur ces helpers.

---

## 3.5 — `src/lib/commissionHelpers.ts` (201 lignes)

### Fonctions exportées

| Fonction | Ligne | Statut |
|---|---|---|
| `calculerCommissionLigne` | 31 | ✅ |
| `calculerCommissionDevis` | 59 | ✅ |
| **`creerCommissionDevis`** | 84 | ❌ **JAMAIS APPELÉE** |
| `calculateCommission` (deprecated) | 158 | ✅ |
| `estEligibleCommission` (deprecated) | 197 | ✅ |

### Logique de calcul

**Par ligne** (`L42`) :
```typescript
const commission_unitaire = Math.max(0, prix_vip - prix_partenaire);
// Commission = (prix_vip_negocie - prix_partenaire) × quantite
```

**Garde-fou anti vente à perte** (L38-39) : refuse si `prix_vip < prix_partenaire - 0.01`.

### Règle ADMIN (L94)

```typescript
if (!params.partenaire_code ||
    params.partenaire_code === 'ADMIN' ||
    params.partenaire_code === 'admin') {
  return { ok: true };   // Pas de commission, pas d'erreur
}
```

✅ Conforme au cahier des charges (case-insensitive).

### Appels effectifs

- `calculateCommission` (legacy) → `ModalNouvelleCommission.tsx`, `MesCommissionsPartner.tsx`.
- `estEligibleCommission` (legacy) → `ModalNouvelleCommission.tsx`, `MesCommissionsPartner.tsx`.
- **`creerCommissionDevis`** : **0 appel**. Tout le pipeline async qui écrit en `commissions/` est inutilisé.

🔴 **Conséquence** : Aujourd'hui les commissions sont créées **manuellement** depuis l'admin (`ModalNouvelleCommission`). Le déclenchement automatique au solde — exigé par la mission v43 — n'est **pas implémenté**.

---

# 4️⃣ MISMATCHES & DETTE TECHNIQUE

| # | Catégorie | Fichier:ligne | Description | Sévérité |
|---|---|---|---|---|
| M1 | Format acompte | `Dashboard.tsx:84-89` | Lit `a.statut === 'encaisse'` (legacy) → P3 invisible, CA encaissé erroné | 🔴 Critique |
| M2 | Format acompte | `emailService.ts:609` | Idem M1 dans le calcul de l'email d'encaissement | 🔴 Critique |
| M3 | Format acompte | `MesVirements.tsx:178,296` | Idem M1 côté espace client | 🔴 Critique |
| M4 | Format acompte | `commissionHelpers.ts:200` | Hybrid check OK mais maintient la dette (ne fait pas la migration) | 🟡 Important |
| M5 | Code mort | `emailService.ts:735,913,955` | 3 fonctions email jamais appelées | 🟡 Important |
| M6 | Code mort | `commissionHelpers.ts:84` | `creerCommissionDevis` jamais appelée → workflow auto cassé | 🔴 Critique |
| M7 | Schéma | `quotes.commission_generated` | Champ absent → impossible d'éviter la double création | 🟡 Important |
| M8 | Schéma | `quotes.date_commande` | Champ absent → audit trail incomplet | 🟠 Mineur |
| M9 | Numérotation | 3 sources (`counters.ts`, `ncNumerotation.ts`, `generateNumeroDocument`) | Logiques parallèles → maintenance fragile | 🟠 Mineur |
| M10 | UI | `DetailDevis.tsx` | Pas de gating `estLectureSeule` (à introduire 3.1) | 🟡 Important |
| M11 | PDF | `pdf-generator.ts` | Pas de tampon "VALIDÉ" graphique (vs spec v43) | 🟠 Mineur |
| M12 | I18n | `src/i18n/*.json` | Format JSON, pas TS comme spec v43 (3.4) | 🟢 Info |
| M13 | Schema products | `prix_achat`, `prix_partenaire`, `prix_unitaire` ≠ schéma actuel | Incompatible avec mapping Excel demandé | 🟡 Important |
| M14 | Cloud Functions | dossier `functions/` absent | Étape 3.1 doit utiliser Option B (trigger client) | 🟢 Info |
| M15 | Admin SDK | `firebase-admin-sdk.json` absent | Étape 2 (migration) bloquée jusqu'à fourniture credentials | 🔴 Bloquant |
| M16 | Collection | `commissions` ET `notes_commission` mentionnées | Collection cible à confirmer (probable alias / migration en cours) | 🟡 Important |

---

# 5️⃣ RECOMMANDATIONS POUR ÉTAPES 2 & 3

## Préalables avant Étape 2 (migration)

1. **🔴 BLOQUANT** : Fournir `firebase-admin-sdk.json` à la racine du repo (ou variable d'env `GOOGLE_APPLICATION_CREDENTIALS`). Le projet Firebase est `importok-6ef77` selon la spec.
2. **À confirmer** : la collection cible des commissions est-elle `commissions` ou `notes_commission` ? Le code lit dans les deux. Le script de migration ne touche que `quotes.acomptes`, mais autant clarifier.

## Recommandations Étape 2 — Script de migration

- Le script `scripts/migrate-acomptes-v43.js` doit :
  - Ne migrer **QUE** les acomptes ayant `statut: 'declare' | 'encaisse'` (laisser les acomptes P3 intacts).
  - Recalculer `total_encaisse`, `solde_restant` après migration.
  - Recalculer `statut` du devis si nécessaire (`acompte_1/2/3/solde_paye`) via `calculerStatutPaiement`.
  - Mode `--dry-run` par défaut serait plus sûr (même si la mission demande l'inverse) — à valider avec Michel.
  - Backup JSON **avant** toute écriture (déjà spec'é).

## Recommandations Étape 3.1 — Transition Devis → Commande

- **Pas de Cloud Function** disponible → utiliser **Option B (trigger client)**.
- Endroits où câbler le déclenchement :
  - `src/admin/components/PopupEncaisserAcompte.tsx` : après `updateDoc` qui passe le 1er acompte à `encaisse: true`, mettre `statut: 'commande_ferme'` + `date_commande: serverTimestamp()`.
  - `src/admin/pages/DetailDevis.tsx` : introduire `estLectureSeule` (liste statuts ≥ `signe`) + bandeau 🔒 + gating des inputs/selects/btn "Ajouter ligne"/"Supprimer ligne". Garder actifs : "Encaisser", "Dupliquer" (à créer), "Solde", select admin.
  - Email : ajouter `notifyCommandeFerme(devis)` dans `emailService.ts`.

## Recommandations Étape 3.2 — Limite 3 acomptes + bouton Solde + commission

- Câblage UI :
  - `DetailDevis.tsx` + `DevisCard.tsx` : importer `prochainPaiementEstSolde` et `getSoldeRestant` (déjà disponibles).
  - Afficher bouton 🏁 "Payer le Solde" si `prochainPaiementEstSolde===true && soldeRestant > 0.01`, sinon 💰 "Verser un acompte" (avec validation `peutAjouterAcompte`).
- Validation côté `PopupAcompte.tsx` : utiliser `validerNouveauPaiement(...)` (déjà présent dans `quoteStatusHelpers.ts:98`).
- Création commission au solde :
  - Ajouter dans `PopupEncaisserAcompte.tsx`, après l'`updateDoc` qui marque `is_solde:true, encaisse:true` :
    ```typescript
    await creerCommissionDevis({...});  // depuis commissionHelpers.ts
    await updateDoc(doc(db,'quotes',devis.id), { commission_generated: true });
    ```
  - Ajouter le champ `commission_generated: boolean` au schéma `quotes` (juste un `setDoc({merge:true})`).
  - Skip si `partenaire_code === 'ADMIN'` (déjà géré dans `creerCommissionDevis`).

## Recommandations Étape 3.3 — Import Excel produits

- ⚠️ **Mismatch schéma** : la mission demande de mapper `prix_achat`, `prix_partenaire`, `prix_unitaire`, mais le schéma actuel utilise `prix_achat_cny`, `prix_achat_eur`. **Décision à prendre avec Michel** :
  1. Soit on enrichit le schéma `products` avec les 3 nouveaux champs (compatibilité ascendante).
  2. Soit on map vers les noms existants (`prix_achat → prix_achat_eur`).
  3. Soit on crée un type `prix_partenaire` distinct (utilisé dans la commission).
- SheetJS (`xlsx`) à ajouter aux dépendances si non présent (`npm i xlsx`).
- ID document `products/` = `reference` (clé unique) — déjà la convention.

## Recommandations Étape 3.4 — i18n FR/ZH

- ⚠️ Le projet utilise **`.json`** (`fr.json`, `zh.json`, `en.json`), pas `.ts` comme spec'é. Adapter les ajouts en JSON.
- `en.json` existe → décider s'il faut aussi traduire en EN (mission v43 dit "FR/ZH" uniquement).
- L'index est `src/i18n/index.tsx`.

## Recommandations transverses

- **Corriger en priorité M1/M2/M3** (mismatch format acompte) avant ou en parallèle de l'Étape 2 — sinon le Dashboard montrera des chiffres faux même après migration.
- **Décider du sort des 3 fonctions email mortes** (M5) :
  1. Soit les supprimer (recommandé).
  2. Soit les câbler dans le workflow.
- **Tampon "VALIDÉ" PDF (M11)** : dérogation `pdf-generator.ts` requise — créer `DEMANDE-MICHEL-V43.md` si Michel exige cette fonctionnalité.
- **Unifier les 3 implémentations de numérotation** (M9) en post-mission v43 (ne pas mélanger).

---

## Inventaire des dépendances tierces utiles à v43

| Lib | Présente ? | Usage v43 |
|---|---|---|
| `xlsx` (SheetJS) | À vérifier dans `package.json` | Import Excel (3.3) |
| `firebase-admin` | Probablement absent | Migration script (E2) |
| `jspdf` / `jspdf-autotable` | Présent (utilisé dans pdf-generator) | Tampon VALIDÉ (3.1) |
| `firebase/firestore` (`runTransaction`, `serverTimestamp`) | Présent | Counters + triggers client |

---

# ✅ PRÉ-FLIGHT CHECKLIST (avant Étape 2)

- [ ] `firebase-admin-sdk.json` fourni à la racine
- [ ] Confirmation collection commission cible (`commissions` vs `notes_commission`)
- [ ] Décision mapping `products` (Étape 3.3) : enrichissement de schéma OU mapping inverse
- [ ] Décision sort des 3 fonctions email mortes
- [ ] Décision sur le tampon "VALIDÉ" PDF (dérogation `pdf-generator.ts` ?)
- [ ] Confirmation : on **corrige** M1/M2/M3 (mismatch lecture) **dans la même mission v43** ou plus tard ?

---

**FIN AUDIT V43**
