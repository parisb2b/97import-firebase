# 08 — Audit workflow parcours client (6 phases)

**Date** : 2026-04-04
**Source** : Schema workflow 97import.com (6 phases)
**Methode** : Comparaison schema vs code source reel

---

## Resume

Le schema definit un parcours client complet en 6 phases :
1. Creation de compte
2. Navigation catalogue & panier
3. Demande de devis
4. Acompte & virement
5. Admin encaisse & genere les documents
6. Solde & livraison

Sur les 6 phases, **seules les phases 1 et 2 sont substantiellement implementees**.
Les phases 3 a 6 sont partielles ou absentes.

---

## Phase 1 — Creation de compte

### IMPLEMENTE

| Fonctionnalite | Fichier | Lignes | Statut |
|----------------|---------|--------|--------|
| Login email + mot de passe | `LoginPage.tsx` | 17-29 | OK |
| Google OAuth | `LoginPage.tsx` | 31-42 | OK |
| Profil auto-cree role=user | `AuthContext.tsx` | 123-142 (Google), 151-171 (email) | OK |
| Prix x2 pour user | `calculPrix.ts` | 79-84 | OK |
| Prix masques pour visiteur | `calculPrix.ts` | 75-76 | OK |

### MANQUANT

| Fonctionnalite | Attendu | Statut | Risque | Priorite |
|----------------|---------|--------|--------|----------|
| Page inscription dediee | Route `/register` avec formulaire | ABSENT — LoginPage reference `/register` mais aucune route ni formulaire | Eleve | P1 |
| Bouton rouge "Se connecter" | Bouton visible sur pages catalogue quand visiteur | PARTIEL — texte "Connectez-vous" mais pas de bouton cliquable | Moyen | P2 |

---

## Phase 2 — Navigation catalogue & panier

### IMPLEMENTE

| Fonctionnalite | Fichier | Statut |
|----------------|---------|--------|
| Prix user x2 | `calculPrix.ts:79-84` | OK |
| Prix VIP negocie | `calculPrix.ts:94-100` | OK |
| Prix partner x1.2 | `calculPrix.ts:86-91` | OK |
| Prix masques visiteur | `MiniPellesPage.tsx:248-261`, `CataloguePage.tsx:317-322` | OK |
| Ajout au panier | `CartContext.tsx:54-63` | OK |
| Persistence panier localStorage | `CartContext.tsx:34-44` (cle `rippa_cart`) | OK |
| Page panier | `CartPage.tsx` — items, quantites, total HT | OK |
| Clear panier au changement user | `CartContext.tsx:46-49` | OK |

### MANQUANT

| Fonctionnalite | Attendu | Statut | Risque | Priorite |
|----------------|---------|--------|--------|----------|
| Bouton "Ajouter au panier" sur mini-pelles | Bouton sur chaque fiche produit | ABSENT — seulement "Voir la fiche" et "Devis" | Moyen | P2 |
| Bouton panier sur ProductCard generique | Add-to-cart sur cartes produit | ABSENT — ProductCard n'a pas de bouton panier | Moyen | P2 |
| Selecteur quantite avant ajout | Choisir qte avant ajout | ABSENT — toujours qte=1, modifier apres | Faible | P3 |

---

## Phase 3 — Demande de devis

### IMPLEMENTE

| Fonctionnalite | Fichier | Statut |
|----------------|---------|--------|
| Formulaire devis | `DevisForm.tsx:42-303` | OK — nom, email, tel, destination, message |
| Generation numero devis | `DevisForm.tsx:88-99` | OK mais format DEV-YYYY-XXXX (pas D2600001) |
| Sauvegarde Firestore | `DevisForm.tsx:120-140` | OK — collection `quotes` |
| Helper numero atomique | `firebaseHelpers.ts:8-25` | OK — format D{YY}{XXXXX} (non utilise par DevisForm) |
| Visibilite "Mes devis" | `QuotesTab.tsx:45-70` | OK — filtre par user_id |
| Ecran de succes | `DevisForm.tsx:152-179` | OK — affiche reference devis |

### MANQUANT — CRITIQUE

| Fonctionnalite | Attendu (schema) | Statut | Risque | Priorite |
|----------------|------------------|--------|--------|----------|
| Pop-up choix partenaire | Modal [TD] [JM] [MC] [Sans partenaire] | **ABSENT** — aucune selection partenaire | Eleve | P1 |
| Vidage panier automatique | Panier vide apres soumission devis | **ABSENT** — `clearCart()` existe mais jamais appele apres devis | Eleve | P1 |
| Format numero D2600001 | Numero type D{YY}{NNNNN} | DIVERGENT — DevisForm utilise DEV-YYYY-XXXX, pas le helper | Moyen | P2 |
| Champ partenaire_code | Stocke dans le devis Firestore | **ABSENT** — pas capture | Eleve | P1 |

---

## Phase 4 — Acompte & virement

### STATUT : NON IMPLEMENTE

| Fonctionnalite | Attendu (schema) | Statut | Risque | Priorite |
|----------------|------------------|--------|--------|----------|
| Etape 1 : Montant libre (defaut 500EUR) | Input montant acompte | **ABSENT** — aucune page/composant | Critique | P1 |
| Etape 2 : Pro ou Perso | Selection type de compte | **ABSENT** — aucun UI | Critique | P1 |
| Etape 3 : RIB affiche + "J'ai vire" | Affichage coordonnees bancaires, bouton declaration | **ABSENT** — aucun composant | Critique | P1 |
| Email auto admin | Notification virement declare | PARTIEL — template existe (`notifications.ts:23-74`) mais jamais appele | Eleve | P1 |
| Statut "en attente" | Acompte en_attente dans Firestore | STRUCTURE OK (`types/index.ts:127-135`) mais aucun UI | Eleve | P1 |

**Note** : L'interface TypeScript `Acompte` est definie (type, montant, statut, date) et le tableau `acomptes[]` est prevu dans `Quote`, mais aucun composant frontend ne permet d'interagir avec ces donnees.

---

## Phase 5 — Admin encaisse & genere les documents

### IMPLEMENTE PARTIELLEMENT

| Fonctionnalite | Fichier | Statut |
|----------------|---------|--------|
| Bouton "Encaisser" (UI) | `AdminUI.tsx:270-327` (PaiementRow) | OK visuellement, handler non branche |
| Badge statuts colores | `AdminUI.tsx:29-72` (BadgeStatut) | OK — 12 statuts |
| Resume paiements | `AdminUI.tsx:337-372` (PaiementResume) | OK — total encaisse + solde restant |
| PDF Devis | `quote-pdf.ts` (181 lignes) | OK — complet |
| PDF Facture FA | `invoice-pdf.ts` (240 lignes) | OK — avec table acomptes et reste a payer |
| Schema facture | `types/index.ts:211-234` | OK — type_facture acompte/solde/avoir |
| Listing factures admin | `AdminInvoices.tsx` | OK — filtres, statuts, update |

### MANQUANT — CRITIQUE

| Fonctionnalite | Attendu (schema) | Statut | Risque | Priorite |
|----------------|------------------|--------|--------|----------|
| Handler "Encaisser" (logique metier) | Clic → update Firestore + totaux | **ABSENT** — bouton UI existe, aucune logique | Critique | P1 |
| Declenchement auto PDF | Generer PDF apres encaissement | **ABSENT** — fonctions PDF existent mais jamais appelees depuis admin | Critique | P1 |
| Frais FM/DD (template PDF) | Frais maritimes + dedouanement → Client + Partner | **ABSENT** — aucun fichier `fees-pdf.ts` | Eleve | P1 |
| Note NC commission (template PDF) | Commission partenaire | **ABSENT** — aucun fichier `commission-pdf.ts` | Eleve | P1 |
| Bon BL livraison (template PDF) | Bon de livraison → Client | **ABSENT** — aucun fichier `delivery-note-pdf.ts` | Eleve | P1 |
| Backend email (Cloud Functions) | Envoi reel des emails | **ABSENT** — aucun dossier `functions/`, callable non deploye | Critique | P1 |
| Admin Dashboard reel | KPIs, monitoring, generation docs | PLACEHOLDER — message "A implementer" | Eleve | P2 |
| Admin Parametres | Config RIB, emetteur, acompte | PLACEHOLDER | Eleve | P2 |
| Admin Partenaires | Commissions, tracking | PLACEHOLDER | Eleve | P2 |

---

## Phase 6 — Solde & livraison

### IMPLEMENTE PARTIELLEMENT

| Fonctionnalite | Fichier | Statut |
|----------------|---------|--------|
| Detection "ENTIEREMENT SOLDEE" | `AdminUI.tsx:337-372` | OK — vert si soldeRestant <= 0 |
| Type facture "solde" | `types/index.ts:224` | OK — `type_facture: 'solde'` |
| Reste a payer dans PDF | `invoice-pdf.ts:190-205` | OK — affiche en rouge |

### MANQUANT

| Fonctionnalite | Attendu (schema) | Statut | Risque | Priorite |
|----------------|------------------|--------|--------|----------|
| Passage auto en "SOLDEE" | Quand solde = 0, auto-update | **ABSENT** — update manuelle uniquement | Moyen | P2 |
| Email notices techniques | Envoi fiches techniques au client | **ABSENT** — aucun template ni declencheur | Moyen | P2 |
| Bundle documents complet | Generer tous les docs + envoi groupe | **ABSENT** | Moyen | P2 |
| Suivi livraison | Tracking, notification expedition | **ABSENT** | Moyen | P2 |

---

## Tableau recapitulatif par phase

| Phase | Description | % Implemente | Risque | Priorite |
|-------|-------------|-------------|--------|----------|
| 1 | Creation de compte | **85%** | Moyen | P2 (page inscription manquante) |
| 2 | Navigation & panier | **80%** | Faible | P2-P3 (boutons add-to-cart) |
| 3 | Demande de devis | **50%** | Eleve | P1 (popup partenaire, clear cart) |
| 4 | Acompte & virement | **5%** | Critique | P1 (workflow complet absent) |
| 5 | Admin encaisse & docs | **25%** | Critique | P1 (3 PDF manquants, handler absent) |
| 6 | Solde & livraison | **20%** | Moyen | P2 (auto-soldee, emails) |

---

## Les 15 actions prioritaires pour aligner le code avec le schema

| # | Action | Phase | Priorite |
|---|--------|-------|----------|
| 1 | Creer le workflow acompte complet (montant, pro/perso, RIB, "J'ai vire") | 4 | P1 |
| 2 | Creer la popup choix partenaire dans DevisForm | 3 | P1 |
| 3 | Appeler clearCart() apres soumission devis | 3 | P1 |
| 4 | Brancher le handler "Encaisser" sur la logique Firestore | 5 | P1 |
| 5 | Creer template PDF `commission-pdf.ts` (Note NC) | 5 | P1 |
| 6 | Creer template PDF `fees-pdf.ts` (Frais FM/DD) | 5 | P1 |
| 7 | Creer template PDF `delivery-note-pdf.ts` (Bon BL) | 5 | P1 |
| 8 | Deployer Firebase Cloud Functions pour l'envoi d'emails | 5 | P1 |
| 9 | Aligner le format numero devis (D2600001 via firebaseHelpers) | 3 | P2 |
| 10 | Creer la page inscription (/register) | 1 | P2 |
| 11 | Ajouter boutons "Ajouter au panier" sur MiniPellesPage | 2 | P2 |
| 12 | Implementer AdminDashboard reel (KPIs + monitoring) | 5 | P2 |
| 13 | Implementer AdminParametres (RIB, emetteur, config) | 5 | P2 |
| 14 | Auto-marquer facture SOLDEE quand solde = 0 | 6 | P2 |
| 15 | Email notices techniques au client apres solde | 6 | P2 |

---

## Niveau de risque global : ELEVE

Le parcours client complet (de l'inscription au paiement final) n'est pas fonctionnel de bout en bout.
Les phases 1-2 (vitrine/catalogue) fonctionnent. Les phases 3-6 (business/paiement) sont incompletes.
