# AUDIT GLOBAL — État du projet 97import v2
**Date** : 2026-04-23 15:15
**Objectif** : faire un bilan précis avant P3-WF1 (workflow paiement acompte)

---

## 📊 TABLEAU SYNTHÈSE

| Fonctionnalité | Statut | Commentaire |
|----------------|--------|-------------|
| Panier + popup Partenaire | ✅ DÉJÀ FAIT | Popup 0, fonctionnel |
| Popup Acompte (à SUPPRIMER) | 🔴 À SUPPRIMER | Popup 1, step=1 dans Panier.tsx |
| Popup RIB (à SUPPRIMER) | 🔴 À SUPPRIMER | Popup 2, step=2 dans Panier.tsx |
| Espace partenaire + onglets | ✅ DÉJÀ FAIT | EspacePartenaire.tsx avec 3 onglets partner |
| Gestion devis VIP partenaire | ✅ DÉJÀ FAIT | GestionDevisPartner.tsx, négociation prix |
| Notification partenaire par email | 🟡 PARTIEL | Helpers email existent, à vérifier intégration |
| Bouton "Je signe le devis" (client) | ❌ MANQUANT | Aucune fonctionnalité de signature trouvée |
| Déblocage acompte après signature | ❌ MANQUANT | Pas de logique de signature → pas de déblocage |
| Page "Acomptes à encaisser" | ✅ DÉJÀ FAIT | AcomptesEncaisser.tsx existe |
| Modal "Marquer acompte reçu" | ✅ DÉJÀ FAIT | PopupEncaisserAcompte.tsx existe |
| Génération PDF facture acompte | ✅ DÉJÀ FAIT | generateInvoiceAcompte.ts existe |
| Historique paiements dans PDFs | 🟡 PARTIEL | À vérifier si dans tous les PDFs |
| Footer PDF dynamique | 🟡 PARTIEL | À vérifier implémentation |
| Email auto après acompte | 🟡 PARTIEL | À vérifier si déclenché auto |
| Limite 3 acomptes + 4e=solde | ✅ DÉJÀ FAIT | quoteStatusHelpers.ts complet |
| Note de commission auto | 🟡 PARTIEL | Generation existe, auto-création à vérifier |
| Alerte "dernier acompte" | ❌ MANQUANT | Pas trouvé dans espace client |
| Arrondi prix Public/Partenaire | 🔴 À MODIFIER | Utilise Math.round(), doit être Math.ceil() |
| Prix VIP dans back-office | 🔴 À RETIRER | Présent dans OngletEssentiel.tsx lignes 364-370 |

---

## 🔍 DÉTAILS PAR AUDIT

### Partie 1 — Panier et workflow devis

**Fichier** : `src/front/pages/Panier.tsx`

**Popups actuels** :
- Line 83 : `popupStep` state géré avec 3 valeurs (0, 1, 2)
  - **Popup 0** (Partner) : lignes 450-490 — ✅ À CONSERVER
  - **Popup 1** (Acompte) : lignes 494-558 — 🔴 À SUPPRIMER
  - **Popup 2** (RIB) : lignes 563+ — 🔴 À SUPPRIMER

**États utilisés** :
- `selectedPartnerId` (line 86) — à conserver
- `acomptePct` (line 90) — À SUPPRIMER (plus de saisie d'acompte initial)
- `typeCompte` (line 91) — À SUPPRIMER
- `hasRib`, `ribProvided` (line 92-93) — À SUPPRIMER

**Statuts de devis** :
Le fichier `src/lib/quoteStatusHelpers.ts` définit :
```typescript
export type QuoteStatus =
  | 'nouveau'
  | 'acompte_1' | 'acompte_2' | 'acompte_3'
  | 'solde_paye'
  | 'en_production';
```

**Statuts manquants pour nouveau workflow** :
- `en_negociation_partenaire` — quand devis envoyé au partenaire
- `devis_vip_envoye` — quand partenaire renvoie le devis VIP au client
- `signe` — quand client a signé le devis

---

### Partie 2 — Espace partenaire + devis VIP

**Fichiers** :
- `src/front/pages/EspacePartenaire.tsx` — ✅ Existe
- `src/front/pages/espace-partenaire/GestionDevisPartner.tsx` — ✅ Existe
- `src/front/pages/espace-partenaire/MesClientsPartner.tsx` — ✅ Existe
- `src/front/pages/espace-partenaire/MesCommissionsPartner.tsx` — ✅ Existe

**Fonctionnalités actuelles** :
- ✅ Espace avec 3 onglets partenaire (`p-clients`, `p-devis`, `p-commissions`)
- ✅ Partenaire peut voir devis de ses clients (GestionDevisPartner.tsx line 128 : `is_vip: true`)
- ✅ Logique VIP en place (champ `is_vip` utilisé dans multiples fichiers)
- ✅ Prix négociés partenaire (`prix_negocie` dans MesCommissionsPartner line 159)

**À vérifier** :
- 🟡 Le partenaire peut-il **renvoyer** le devis VIP négocié au client ?
- 🟡 Notifications email au partenaire quand nouveau devis arrive

---

### Partie 3 — Signature du devis

**Résultat** : ❌ **AUCUNE fonctionnalité de signature trouvée**

**Recherche effectuée** :
```bash
grep -rn "signature\|signer\|signe\|accepter.*devis\|Je signe" src/
```
→ Aucun résultat pertinent (seulement "conteneur_assigne" non lié)

**Ce qui manque** :
1. Bouton "Je signe le devis" dans l'espace client (MesDevis.tsx)
2. Champ `signe_le` ou `date_signature` dans Firestore
3. Statut `signe` dans QuoteStatus
4. Logique de déblocage acompte après signature

---

### Partie 4 — Workflow paiement acompte (admin)

**Fichiers** :
- ✅ `src/admin/pages/AcomptesEncaisser.tsx` — Existe
- ✅ `src/admin/components/PopupEncaisserAcompte.tsx` — Existe
- ✅ `src/lib/generateInvoiceAcompte.ts` — Existe
- ✅ `src/lib/quoteStatusHelpers.ts` — Helpers complets

**Fonctionnalités déjà en place** :
1. ✅ **Page acomptes à encaisser** — Liste devis avec acomptes en attente
2. ✅ **Modal marquer acompte reçu** — PopupEncaisserAcompte.tsx
3. ✅ **Génération PDF facture acompte** — generateInvoiceAcompte.ts
4. ✅ **Limite 3 acomptes** — quoteStatusHelpers.ts :
   - `peutAjouterAcompte(acomptes)` → max 3
   - `prochainPaiementEstSolde(acomptes)` → true si ≥3 acomptes

**Interface Acompte** (quoteStatusHelpers.ts lines 8-17) :
```typescript
export interface Acompte {
  numero: number;              // 1, 2, 3 ou 0 = solde
  montant: number;
  date_reception: string;
  reference_virement?: string;
  facture_acompte_numero?: string; // FA-AC-AAMM-NNN
  facture_acompte_pdf_url?: string;
  is_solde?: boolean;
  created_at: string;
  created_by: string;
}
```

**À vérifier** :
- 🟡 Historique paiements affiché dans TOUS les PDFs (devis, factures)
- 🟡 Footer PDF dynamique selon état (DEVIS VIP / FACTURE ACOMPTE / FACTURE PAYÉE)
- 🟡 Email automatique envoyé après validation acompte

---

### Partie 5 — Note de commission automatique

**Fichiers** :
- ✅ `src/lib/pdf-generator.ts` — Fonction `generateNoteCommission()` ligne 718
- ✅ `src/lib/ncNumerotation.ts` — Génération numéros NC-AAMM-NNN
- ✅ `src/admin/pages/NotesCommission.tsx` — Gestion notes commission

**Fonctionnalités existantes** :
- ✅ Génération PDF note de commission
- ✅ Numérotation automatique NC-AAMM-NNN
- ✅ Affichage dans espace partenaire (MesCommissionsPartner.tsx line 189-194)

**Ce qui manque** :
- ❌ **Création automatique** de la note de commission après validation 1er acompte
- Actuellement : création manuelle dans admin
- Nouveau workflow : doit se créer automatiquement et être envoyée au partenaire

---

### Partie 6 — Espace client : signature + alertes acompte

**Fichier** : `src/front/pages/EspaceClient.tsx`

**Onglets actuels** :
- Mes devis
- Mes commandes
- Mes virements
- Mes factures
- Suivre mes achats
- Continuer mes achats
- Mes infos
- Mes adresses
- SAV

**Ce qui manque** :
1. ❌ **Bouton "Je signe le devis"** dans MesDevis ou DevisCard
2. ❌ **Alerte "C'est votre dernier acompte avant le solde"** quand 3e acompte
3. ❌ **Affichage du solde à payer** après 3e acompte validé

---

### Partie 7 — Prix Public/Partenaire/VIP (affichage & arrondi)

**Fichier** : `src/front/components/PriceDisplay.tsx`

**Logique actuelle** (lines 18-28) :
```typescript
function getPublic(product: any): number {
  return product.prix_public_eur || product.prix_public || Math.round(getAchat(product) * 2) || 0;
}

export function getProductPrice(product: any, role: string | null | undefined): number {
  const achat = getAchat(product);
  const pub = getPublic(product);
  if (!achat && !pub) return 0;
  if (role === 'partner') return Math.round(achat * 1.2) || Math.round(pub * 0.6);
  return pub || Math.round(achat * 2);
}
```

**Problème** : 🔴 **Utilise `Math.round()` au lieu de `Math.ceil()`**

**Prix VIP dans back-office** : 🔴 **À RETIRER**
- Fichier : `src/admin/components/produit/OngletEssentiel.tsx`
- Lignes 364-370 : Affiche prix VIP négocié dans bloc "Prix de vente calculés"
- **Action** : retirer complètement la carte VIP, ne garder que Public et Partenaire

---

### Partie 8 — Mise à jour statut devis après paiement

**Fichier** : `src/lib/quoteStatusHelpers.ts`

**Fonctions existantes** :
- `getTotalPaye(acomptes)` — Total payé
- `getRestantAPayer(total_ht, acomptes)` — Restant à payer
- `getNbAcomptes(acomptes)` — Nombre acomptes (hors solde)
- `peutAjouterAcompte(acomptes)` — max 3
- `prochainPaiementEstSolde(acomptes)` — true si ≥3 acomptes
- ❌ **Manque** : `estEntierementPaye()` (fonction probablement commencée mais pas visible dans excerpt)

**Bouton "Lancer en production"** :
- 🟡 À vérifier si existe dans DetailDevis admin

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Étape 1 — P3-WF1-A : Nettoyage Panier + Signature client
**Objectif** : Supprimer popups Acompte/RIB + Ajouter signature devis

**Fichiers à modifier** :
- `src/front/pages/Panier.tsx` — Supprimer popup 1 & 2, garder popup 0
- `src/front/pages/espace-client/MesDevis.tsx` — Ajouter bouton "Je signe le devis"
- `src/front/pages/espace-client/DevisCard.tsx` — Afficher état "À signer" vs "Signé"
- `src/lib/quoteStatusHelpers.ts` — Ajouter statuts `en_negociation_partenaire`, `devis_vip_envoye`, `signe`

**Durée estimée** : 2-3h

---

### Étape 2 — P3-WF1-B : Workflow partenaire → client
**Objectif** : Workflow complet envoi devis au partenaire → négociation VIP → renvoi au client

**Fichiers à modifier** :
- `src/front/pages/Panier.tsx` — Après popup partenaire, créer devis avec statut `en_negociation_partenaire`
- `src/front/pages/espace-partenaire/GestionDevisPartner.tsx` — Ajouter bouton "Renvoyer le devis VIP au client"
- `src/lib/emailService.ts` — Email partenaire (nouveau devis) + Email client (devis VIP prêt)

**Durée estimée** : 3-4h

---

### Étape 3 — P3-WF1-C : Déblocage acompte après signature
**Objectif** : RIB + bouton acompte uniquement APRÈS signature

**Fichiers à modifier** :
- `src/front/pages/espace-client/MesDevis.tsx` — Logique conditionnelle :
  - Si non signé → bouton "Je signe"
  - Si signé → affiche RIB + bouton "J'ai versé mon 1er acompte"
- Firestore : ajouter champ `signe_le` (timestamp) sur devis

**Durée estimée** : 2h

---

### Étape 4 — P3-WF1-D : Commission auto + Alertes acompte
**Objectif** : Génération auto NC après 1er acompte + Alerte 3e acompte

**Fichiers à modifier** :
- `src/admin/components/PopupEncaisserAcompte.tsx` — Après validation acompte :
  - Si `numero === 1` (1er acompte) → générer note commission auto
  - Upload PDF NC dans Storage + envoyer au partenaire
- `src/front/pages/espace-client/MesDevis.tsx` — Alerte si `getNbAcomptes() === 2` :
  - "⚠️ C'est votre dernier acompte avant le solde"
- `src/front/pages/espace-client/MesDevis.tsx` — Si `getNbAcomptes() === 3` :
  - Afficher "💰 Solde à payer : XXX €"
  - Bouton "Payer le solde" (forcé)

**Durée estimée** : 3-4h

---

### Étape 5 — P3-WF1-E : Arrondi prix + Retrait VIP back-office
**Objectif** : Math.ceil() partout + Supprimer prix VIP du back-office produit

**Fichiers à modifier** :
- `src/front/components/PriceDisplay.tsx` — Remplacer `Math.round()` par `Math.ceil()`
- `src/admin/components/produit/OngletEssentiel.tsx` — Supprimer carte VIP (lignes 350-373)
  - Ne garder que 2 cartes : Public et Partenaire
- `src/lib/pdf-generator.ts` — Vérifier que PDFs utilisent Math.ceil()
- `src/lib/generateInvoiceAcompte.ts` — Idem

**Durée estimée** : 1-2h

---

## ✅ FONCTIONNALITÉS DÉJÀ OK (ne pas retoucher)

- ✅ Popup Partenaire dans Panier (popup 0)
- ✅ Espace partenaire avec 3 onglets
- ✅ Gestion devis VIP par partenaire (négociation prix)
- ✅ Page "Acomptes à encaisser" (admin)
- ✅ Modal "Marquer acompte reçu"
- ✅ Génération PDF facture acompte
- ✅ Limite 3 acomptes + helpers (quoteStatusHelpers.ts)
- ✅ Génération PDF note de commission (manuelle)
- ✅ Numérotation NC-AAMM-NNN

---

## 🔴 FONCTIONNALITÉS À SUPPRIMER

**Dans Panier.tsx** :
- 🔴 Popup Acompte (step 1, lignes 494-558)
- 🔴 Popup RIB (step 2, lignes 563+)
- 🔴 States : `acomptePct`, `typeCompte`, `hasRib`, `ribProvided`
- 🔴 Toute logique de saisie % acompte initial

**Dans OngletEssentiel.tsx** :
- 🔴 Carte "VIP" dans bloc "Prix de vente calculés" (lignes 350-373)

---

## 🟡 FONCTIONNALITÉS À MODIFIER (pas juste ajouter)

1. **Arrondi prix** : `Math.round()` → `Math.ceil()` partout
   - PriceDisplay.tsx
   - OngletEssentiel.tsx (bloc prix calculés)
   - Tous les PDFs

2. **Statuts devis** : Ajouter nouveaux statuts workflow
   - `en_negociation_partenaire`
   - `devis_vip_envoye`
   - `signe`

3. **Espace client** : Logique conditionnelle signature → acompte
   - MesDevis.tsx : bouton "Je signe" → RIB + acompte

---

## 📋 AJUSTEMENTS SPÉCIFIQUES

### 1. Prix VIP dans back-office (OngletEssentiel.tsx)

**Ligne actuelle 350-373** :
```tsx
<div style={{ background: '#fff', padding: 10, borderRadius: 4, textAlign: 'center' }}>
  <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 }}>
    VIP
  </div>
  <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed', marginTop: 2 }}>
    {product.prix_vip_negocie
      ? `${Number(product.prix_vip_negocie).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
      : '—'
    }
  </div>
  <div style={{ fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' }}>
    {product.prix_vip_negocie ? 'Négocié' : 'Non défini'}
  </div>
</div>
```

**Action** : SUPPRIMER complètement cette carte.
**Résultat** : Le grid doit passer de `gridTemplateColumns: 'repeat(3, 1fr)'` à `'repeat(2, 1fr)'`.

### 2. Arrondi à l'euro supérieur (Math.ceil)

**Emplacements à modifier** :

1. **PriceDisplay.tsx** (line 19, 26, 27, 35) :
   ```typescript
   // AVANT
   return Math.round(getAchat(product) * 2);
   const partner = Math.round(achat * 1.2);

   // APRÈS
   return Math.ceil(getAchat(product) * 2);
   const partner = Math.ceil(achat * 1.2);
   ```

2. **OngletEssentiel.tsx** (lignes ~327-347) :
   ```typescript
   // AVANT
   {((product.prix_achat || 0) * 2).toLocaleString(...)}
   {((product.prix_achat || 0) * 1.2).toLocaleString(...)}

   // APRÈS
   {Math.ceil((product.prix_achat || 0) * 2).toLocaleString(...)}
   {Math.ceil((product.prix_achat || 0) * 1.2).toLocaleString(...)}
   ```

3. **Tous les PDFs** : vérifier dans `pdf-generator.ts`, `generateInvoiceAcompte.ts`, etc.

---

## 📝 RÉCAPITULATIF FICHIERS IMPACTÉS PAR WORKFLOW

### Phase 1 — Nettoyage + Signature
- `src/front/pages/Panier.tsx`
- `src/front/pages/espace-client/MesDevis.tsx`
- `src/front/pages/espace-client/DevisCard.tsx`
- `src/lib/quoteStatusHelpers.ts`

### Phase 2 — Workflow partenaire
- `src/front/pages/Panier.tsx`
- `src/front/pages/espace-partenaire/GestionDevisPartner.tsx`
- `src/lib/emailService.ts`

### Phase 3 — Acompte après signature
- `src/front/pages/espace-client/MesDevis.tsx`

### Phase 4 — Commission auto + Alertes
- `src/admin/components/PopupEncaisserAcompte.tsx`
- `src/front/pages/espace-client/MesDevis.tsx`
- `src/lib/pdf-generator.ts` (si besoin)

### Phase 5 — Arrondi + VIP
- `src/front/components/PriceDisplay.tsx`
- `src/admin/components/produit/OngletEssentiel.tsx`
- `src/lib/pdf-generator.ts`
- `src/lib/generateInvoiceAcompte.ts`

---

## 🎬 CONCLUSION

**Complexité globale** : Moyenne-élevée

**Durée totale estimée** : 12-15h réparties en 5 prompts

**Point bloquant** : Aucun — l'infrastructure est solide, il s'agit surtout de :
1. Supprimer ce qui est en trop (popups acompte/RIB)
2. Ajouter la signature client
3. Automatiser la création de note de commission
4. Ajuster l'arrondi des prix
5. Retirer le prix VIP du back-office

**Prêt pour P3-WF1-A** : ✅ OUI
