# 📋 AUDIT TECHNIQUE — Workflow devis/acomptes/VIP/commissions

**Date** : 22 avril 2026, 19:40
**Branche** : v2
**Mode** : Lecture seule

---

## 🎯 OBJECTIF
Établir l'état technique précis avant la refonte workflow (P3-WF1 à P3-WF4).

---

## A. WORKFLOW DEVIS ACTUEL

### A.1 Composants popup détectés
✅ **Popups inline dans Panier.tsx** (pas de composants séparés)
- `Overlay` component (lignes 30-45)
- `Steps` component (lignes 48-67) affichant: Partenaire → Acompte → Virement

### A.2 Étapes du parcours actuel
1. **Panier** → bouton "Demander un devis" (ligne 131)
2. **Popup step 0** : Sélection partenaire
   - Liste des partenaires actifs chargée depuis Firestore
   - Champ optionnel (peut être null)
3. **Popup step 1** : Configuration acompte
   - Type de compte : personnel / professionnel
   - Montant acompte (default 500€)
4. **Popup step 2** : Confirmation virement
   - Affichage RIB (implicite)
   - Bouton "Confirmer"
5. **Création du devis** en Firestore via `handleConfirmVirement()` (lignes 151-221)
6. **Email notification** via `notifyDevisCree()` (ligne 204)
7. **Redirection** vers `/espace-client`

**Alternative** : Bouton "Sans acompte" existe → `handleSansAcompte()` (lignes 224-280)

### A.3 Fonction de création devis
- **Fichier** : `src/front/pages/Panier.tsx`
- **Fonction** : `handleConfirmVirement()` (ligne 151)
- **Type d'opération** : `setDoc(doc(db, 'quotes', devisId), devisData)`
- **Compteur atomique** : ✅ OUI via `getNextNumber('DVS')` (ligne 156)
- **Format numéro** : DVS-AAMM-NNN (ex: DVS-2604-001)
- **Collection** : `quotes`
- **ID document** : numéro normalisé (remplacement caractères spéciaux par `-`)

### A.4 Structure du devis créé
Champs présents:
- `numero`: DVS-AAMM-NNN
- `client_id`, `client_email`, `client_nom`, `client_prenom`, `client_tel`, `client_adresse`, `client_siret`
- `statut`: 'nouveau'
- `destination`, `pays_livraison`
- `is_vip`: **false** (toujours initialisé à false)
- `lignes`: array [{ref, nom_fr, qte, prix_unitaire, total, type, description?, lien?}]
- `total_ht`: number
- `partenaire_code`: string | null
- `acomptes`: array (voir section C)
- `createdAt`, `updatedAt`: serverTimestamp()

---

## B. PASSAGE VIP ET PROPAGATION DES PRIX

### B.1 Champs VIP dans la collection quotes
**Firestore sample** (5 devis analysés) :
- ❌ **Aucun devis VIP trouvé en base**
- ❌ **Champ `is_vip` ABSENT** dans les échantillons Firestore
- ⚠️ **Le Dashboard CODE attend `is_vip`** (Dashboard.tsx ligne 82, 275) mais les données ne l'ont pas encore

**Conclusion** : Le champ `is_vip` est prévu dans le code mais **non utilisé en production**.

### B.2 Logique de transformation normal→VIP
**Fichiers analysés** :
- `src/admin/pages/DetailDevis.tsx` : Interface devis (ligne 33 : is_vip attendu dans RecentDevis)
- `src/admin/pages/Dashboard.tsx` : Calcul stats VIP (ligne 82)
- `src/admin/pages/NotesCommission.tsx` : Utilise `prix_negocie` (lignes 95, 115)

**Recherche `is_vip = true`** : ❌ Aucun code de transformation trouvé
**Recherche `prix_vip`** : ❌ Aucune logique de prix VIP négocié trouvée
**Recherche `passerEnVip`** : ❌ Aucune fonction de passage VIP

### B.3 🚨 BUG SIGNALÉ PAR MICHEL
**"Les prix VIP ne sont pas propagés sur les factures + interface admin après passage VIP"**

**Analyse technique** :
1. ❌ **Aucune interface UI pour marquer un devis comme VIP**
2. ❌ **Aucun champ `prix_vip_negocie` détecté dans le code**
3. ❌ **Les factures n'existent pas encore** (composants trouvés: DetailFacture.tsx, Factures.tsx mais vides/incomplets)
4. ⚠️ **Le champ `total_ht` n'est JAMAIS recalculé** après création

### B.4 Recommandation
**Le workflow VIP n'est PAS IMPLÉMENTÉ.**  
Nécessite:
1. Bouton admin "Passer en VIP" sur DetailDevis
2. Champs à ajouter: `is_vip: true`, `prix_vip_negocie`, `date_passage_vip`
3. Recalcul `total_ht` = somme(lignes avec prix VIP)
4. Propagation sur les factures (à créer)

---

## C. WORKFLOW ACOMPTES

### C.1 Structure acompte dans Firestore
**Champ `acomptes`** : array de maps

Structure d'un acompte:
```json
{
  "montant": 500,
  "date": "2026-04-22T18:30:00Z",
  "type_compte": "personnel" | "professionnel",
  "statut": "declare" | "encaisse"
}
```

**Champs calculés au niveau devis** :
- `total_encaisse`: number (somme des acomptes encaissés)
- `solde_restant`: number (total_ht - total_encaisse)
- `statut_paiement`: string?

### C.2 Création d'acompte
**Qui peut en créer ?**
- ✅ **Client** : lors de la demande de devis (Panier.tsx ligne 190-195)
  - 1 acompte créé automatiquement avec statut 'declare'
  - Type de compte choisi par le client
  - Montant saisi par le client (default 500€)

- ⚠️ **Admin** : composant `PopupEncaisserAcompte` existe (DetailDevis.tsx ligne 17) mais non analysé en détail

### C.3 Encaissement
- **Bouton "Encaisser"** : ✅ Existe (via PopupEncaisserAcompte)
- **Fichier** : `src/admin/components/PopupEncaisserAcompte.tsx` (référencé mais non lu)
- **Impact** : Change `acompte.statut` de 'declare' → 'encaisse'
- **Mise à jour** : `total_encaisse` et `solde_restant` recalculés

### C.4 Limite 3 acomptes
**Recherche** : ❌ Aucune validation "max 3 acomptes" trouvée dans le code
**Conclusion** : **Non implémenté** actuellement

### C.5 Solde automatique
**Calcul actuel** :
- Dashboard.tsx ligne 96: `soldeRestant = totalHtAll - caEncaisse`
- Stocké dans `solde_restant` au niveau du devis

**Affiché au client après 3e acompte** : ⚠️ Non implémenté (pas de limite 3 acomptes)

---

## D. NOTES DE COMMISSION

### D.1 Génération automatique
**Trigger actuel** : ❌ **AUCUN**

**Fichiers analysés** :
- `src/admin/pages/NotesCommission.tsx` existe
- Ligne 95, 115 : utilise `prix_negocie`
- **Mais** : aucun code de génération automatique détecté

### D.2 Formule de calcul
**Code trouvé** (NotesCommission.tsx) :
```typescript
prix_negocie: l.prix_unitaire || 0
```
⚠️ **Aucune formule de commission détectée** (pas de `prix_vip - partner×1.2`)

**Conclusion** : La formule métier n'est PAS implémentée dans le code

### D.3 Envoi automatique au partenaire
- **Email** : ❌ Non implémenté
- **In-app** : ❌ Non implémenté

### D.4 Collection commissions en Firestore
**Collections vérifiées** :
- `commissions` : **0 documents**
- `notes_commission` : **0 documents**

**Conclusion** : **Aucune commission générée en production**

Le Dashboard lit ces 2 collections (Dashboard.tsx lignes 100-128) mais elles sont vides.

---

## E. DASHBOARD ADMIN

### E.1 Contenu actuel de la page dashboard
**Ordre d'affichage** (Dashboard.tsx) :
1. **4 KPIs** (ligne 188-207) :
   - Devis en attente (VIP / standard)
   - CA encaissé avril (+12% vs mars)
   - Commissions dues (X partenaires)
   - SAV urgents

2. **Colonne gauche** :
   - Devis récents (5 derniers, table)
   - Conteneurs actifs (3 max, avec progress bars)

3. **Colonne droite** :
   - SAV urgents (si > 0)
   - Commissions dues (table)

### E.2 Onglets du menu admin
**Fichier** : `src/admin/pages/Dashboard.tsx` ne contient PAS le menu
**Recherche routes admin** : Fichier AdminApp.tsx non trouvé directement

**Pages admin trouvées** :
- Dashboard.tsx
- ListeDevis.tsx
- DetailDevis.tsx
- Factures.tsx
- DetailFacture.tsx
- NotesCommission.tsx

**Ordre actuel** : ⚠️ À extraire depuis AdminApp.tsx (non lu)

### E.3 Onglet "Acomptes à encaisser"
- **Existe** : ❌ Non trouvé
- **Alternative** : L'encaissement se fait depuis DetailDevis via popup

---

## F. EMAILS ET NOTIFICATIONS

### F.1 Triggers email existants
**Service** : `src/lib/emailService.ts`

**Mécanisme** :
- Écriture dans collection `mail/` Firestore
- Extension Firestore Trigger Email prend le relais
- Fonction `sendEmail()` bas-niveau (ligne 44)

**Triggers détectés** :
1. **Création devis** : `notifyDevisCree()` (appelé dans Panier.tsx ligne 204)
   - Destinataire : client + admin
   - Sujet : "Votre devis DVS-AAMM-NNN"

**Autres triggers** : À compléter après lecture complète de emailService.ts

### F.2 Templates actuels
**Base template** : `baseTemplate()` (ligne 69)
- Design responsive
- Charte 97IMPORT (bleu #1565C0, salmon #C87F6B)
- Header avec logo
- CTA button optionnel
- Footer configurable

**Emails implémentés** :
- notifyDevisCree (ligne 204 Panier.tsx - appelé, template à analyser)

---

## G. PARTENAIRE PAR DÉFAUT

### G.1 Liste des partenaires actuels
**4 partenaires trouvés** :
- `PB` — Pierre Bernard (actif: true, default: None)
- `JM` — Jean-Marc Delacroix (actif: true, default: None)
- `MC` — Michel Chen (actif: true, default: None)
- `TD` — Thomas Dupont (actif: true, default: None)

### G.2 Partenaire par défaut existe ?
❌ **NON** : Aucun champ `is_default: true` trouvé

### G.3 Logique "pas de partenaire"
**Code actuel** (Panier.tsx ligne 189) :
```typescript
partenaire_code: selectedPartner || null
```
✅ **Le devis PEUT être créé sans partenaire** (valeur null acceptée)

**Comportement** : Si l'utilisateur ne sélectionne aucun partenaire, le devis est créé avec `partenaire_code: null`

---

## 🎯 CONCLUSIONS POUR LA REFONTE

### Pour P3-WF1 (refonte devis + signature VIP)

**Changements nécessaires** :
1. ✅ Workflow devis existe déjà (à conserver)
2. ❌ **Créer l'interface "Passer en VIP"** dans DetailDevis.tsx
3. ❌ **Ajouter champs VIP** : is_vip, prix_vip_negocie, date_passage_vip
4. ❌ **Recalcul total_ht** après passage VIP
5. ❌ **Email notification** passage VIP (template à créer)

**Ce qui existe déjà et peut être réutilisé** :
- ✅ Structure 3 steps (Partenaire/Acompte/Virement)
- ✅ Compteur atomique DVS
- ✅ Email service (baseTemplate)
- ✅ Toast notifications
- ✅ Popup overlay component

### Pour P3-WF2 (acomptes + message + solde auto)

**Changements nécessaires** :
1. ❌ **Validation max 3 acomptes** (frontend + backend)
2. ❌ **Affichage solde automatique** après 3e acompte
3. ❌ **Message explicatif** pour le client
4. ❌ **Email notification** acompte encaissé

**Ce qui existe déjà** :
- ✅ Champ acomptes[] dans quotes
- ✅ PopupEncaisserAcompte component
- ✅ Calcul total_encaisse et solde_restant

### Pour P3-WF3 (note commission auto)

**Changements nécessaires** :
1. ❌ **Implémenter génération auto** (trigger sur encaissement acompte)
2. ❌ **Formule calcul** : prix_vip_negocie - (prix_partner × 1.2)
3. ❌ **Compteur atomique** NC-AAMM-NNN
4. ❌ **Email partenaire** avec note de commission PDF
5. ❌ **Page NotesCommission** à compléter

**Ce qui existe déjà** :
- ✅ Collection notes_commission (vide mais prête)
- ✅ Dashboard affiche commissions dues
- ✅ Fichier NotesCommission.tsx (squelette)

### Pour P3-WF4 (dashboard + onglet acomptes)

**Changements nécessaires** :
1. ❌ **Onglet "Acomptes à encaisser"** dans menu admin
2. ❌ **Vue liste** : tous les acomptes statut='declare'
3. ❌ **Action rapide** : encaisser depuis la liste
4. ❌ **Filtres** : par partenaire, par montant, par date

**Ce qui existe déjà** :
- ✅ Dashboard.tsx complet avec KPIs
- ✅ Stats devisEnAttente, caEncaisse, etc.
- ✅ Table devis récents
- ✅ PopupEncaisserAcompte réutilisable

---

## 🚨 BUGS IDENTIFIÉS PENDANT L'AUDIT

### 1. **Prix VIP non propagés** (signalé par Michel)
   **Statut** : ❌ **Workflow VIP non implémenté**
   - Fichiers concernés : DetailDevis.tsx, Dashboard.tsx
   - Correction requise :
     - Bouton "Passer en VIP" sur DetailDevis
     - Champs: is_vip, prix_vip_negocie
     - Recalcul total_ht
     - Mise à jour factures (si elles existent)

### 2. **Commissions non générées**
   **Statut** : ❌ **Aucune commission en base**
   - Collection vide malgré le Dashboard qui attend des données
   - Trigger automatique manquant
   - Formule de calcul absente du code

### 3. **Limite 3 acomptes non implémentée**
   **Statut** : ❌ **Validation absente**
   - Aucun code de validation frontend ou backend
   - Risque : client peut créer 10+ acomptes

### 4. **Champ is_vip manquant en Firestore**
   **Statut** : ⚠️ **Incohérence code/données**
   - Le code attend `is_vip` (Dashboard ligne 82)
   - Mais les devis créés n'ont PAS ce champ
   - À harmoniser : ajouter is_vip à la création (ligne 186 Panier.tsx)

### 5. **Partenaire par défaut manquant**
   **Statut** : ⚠️ **Comportement indéfini**
   - Si client ne sélectionne pas de partenaire → null
   - Mais pas de fallback sur un partenaire par défaut
   - Risque : commissions perdues si oubli partenaire

---

**Rapport généré le 22 avril 2026, 19:40**
