# AUDIT UX ADMIN — Bugs de Parcours Administrateur
Date : 2026-04-14 | Branche : v2

---

## CRITIQUES (empechent l'admin de travailler)

### 1. Dashboard : stats KPI hardcodees — donnees fausses affichees
**Dashboard.tsx:54-62** : Les stats initiales sont hardcodees (`devisEnAttente: 7`, `caEncaisse: 34200`, `commissionsDues: 8320`). Les requetes Firestore mettent a jour seulement `devisEnAttente` et `savUrgents` (lignes 114-126). Les KPI `caEncaisse`, `devisVip`, `devisStd`, `commissionsDues`, `commissionsPartenaires` restent aux valeurs hardcodees meme si Firestore est vide.
**Impact** : L'admin voit "34 200 € encaisses" et "8 320 € de commissions" alors qu'il y a 0 devis. Donnees completement fausses.

### 2. Bouton "Ajouter partenaire" = alert() placeholder
**Partenaires.tsx:63** : `onClick={() => alert('Ajouter partenaire')}`. Le bouton n'ouvre aucun formulaire — il affiche juste un alert JavaScript.
**Impact** : L'admin ne peut pas ajouter de nouveau partenaire depuis le back-office.

### 3. Bouton "Exporter Excel" dans ListeDevis — aucun onClick
**ListeDevis.tsx:178** : Le bouton "Exporter" n'a pas de handler onClick. Il ne fait rien.
**Impact** : L'admin ne peut pas exporter la liste des devis en Excel.

### 4. AdminLogin : aucune verification de role admin
**AdminLogin.tsx:14-25** : `signInWithEmailAndPassword(adminAuth, email, password)` — n'importe quel compte Firebase (client, partenaire) peut se connecter au back-office admin. Aucune verification du role `admin` apres login.
**Impact** : Un client `client@97import.com` peut acceder au dashboard admin complet.

### 5. DetailDevis : pas de validation des champs obligatoires avant sauvegarde
**DetailDevis.tsx:143-169** : `handleSave` fait un `updateDoc` sans verifier que `client_nom`, `client_email` ou les lignes du devis sont remplis. Les OrangeIndicators (lignes 286-293) sont decoratifs — ils marquent les champs vides mais n'empechent pas la sauvegarde.
**Impact** : L'admin peut sauvegarder un devis incomplet (client vide, 0 ligne) → PDF genere avec des champs vides.

---

## IMPORTANTS (mauvaise experience admin)

### 6. Aucune confirmation apres sauvegarde — 7 pages affectees
Les pages suivantes sauvegardent dans Firestore sans aucun feedback visuel :
- **DetailDevis.tsx:143** — `handleSave` : pas de toast, pas d'alert
- **EditProduit.tsx:38** — `handleSave` : redirect silencieuse
- **NouveauProduit.tsx:22** — redirect sans confirmation
- **NouveauConteneur.tsx:41** — redirect sans confirmation
- **Partenaires.tsx:44** — `toggleActif` : pas de feedback

Seules `Parametres.tsx` et `GestionSite.tsx` affichent un message de succes.
**Impact** : L'admin clique "Enregistrer", rien ne se passe visuellement → il clique encore → doublon ou confusion.

### 7. Timeout 3 secondes hardcode dans 7 pages — faux loading
**Pattern** : `setTimeout(() => setLoading(false), 3000)` utilise comme fallback.
Pages affectees : `Dashboard.tsx:69`, `ListeDevis.tsx:61`, `CatalogueProduits.tsx:51`, `Clients.tsx:22`, `Partenaires.tsx:22`, `Logs.tsx:21`, `ListeConteneurs.tsx:40`.
**Impact** : Si Firestore repond en 200ms, l'admin attend quand meme 3 secondes. Si Firestore met plus de 3s, le loading disparait avant que les donnees arrivent.

### 8. Erreurs Firestore silencieuses — console.error seulement
Sur 16 pages admin, les blocs `catch` font uniquement `console.error()`. L'admin ne voit aucun message d'erreur si une requete echoue.
**Impact** : Si Firestore est indisponible ou un index manque, l'admin voit une page vide sans explication.

### 9. alert() utilise comme feedback dans 6 pages
- **ListeDevis.tsx:56** : `alert('Erreur lors de la generation du PDF')`
- **EditProduit.tsx:47** : `alert()` pour erreur de sauvegarde
- **GestionSite.tsx:50** : `alert()` pour erreur
- **Factures.tsx:62,73,88** : `alert()` pour erreurs PDF
- **NotesCommission.tsx:62,65,88** : `alert()` pour erreurs

**Impact** : Les `alert()` natifs bloquent l'interface et sont incompatibles avec un UX professionnel.

### 10. CatalogueProduits : produits demo hardcodes masquent l'etat vide
**CatalogueProduits.tsx:70-99** : Si Firestore ne retourne pas de produits, des produits demo hardcodes sont affiches (mini-pelles, maisons, solaire fictifs). L'admin ne sait pas si ce sont de vrais produits ou des demos.
**Impact** : Confusion entre donnees reelles et donnees de demonstration.

### 11. FraisLogistique : erreurs avalees silencieusement
**FraisLogistique.tsx:48** : `catch(() => {})` — les erreurs sont completement ignorees sans meme un `console.error`.
**Impact** : Si le chargement des frais echoue, aucun feedback. La page semble vide sans raison.

---

## MINEURS (ameliorations)

### 12. GestionSite : 2 boutons "Enregistrer" dans 2 cartes separees
**GestionSite.tsx:68,95** : Chaque section (Hero, Contacts) a son propre bouton "Enregistrer". L'admin doit cliquer le bon bouton pour chaque section.
**Impact** : Confusant — l'admin peut sauvegarder une section et oublier l'autre.

### 13. Parametres : pas de validation sur les champs numeriques
**Parametres.tsx:87-103** : Les inputs `type="number"` pour les multiplicateurs (user ×2, partner ×1.2) et le taux RMB acceptent des valeurs negatives ou zero.
**Impact** : L'admin peut accidentellement mettre un multiplicateur a 0 → tous les prix a 0 €.

### 14. TauxRMB : pas de message si l'API echoue
**TauxRMB.tsx:43** : Si l'appel a l'API exchangerate echoue, seul un `console.error` est emis. L'admin ne voit pas de message d'erreur.
**Impact** : L'admin pense que le taux est a jour alors que l'API n'a pas repondu.

### 15. Logs : JSON brut dans les cellules du tableau
**Logs.tsx:76** : `JSON.stringify(log.details)` affiche le JSON brut dans une cellule `<td>`. Pas de troncature ni de formatage.
**Impact** : Les lignes de log avec des details longs debordent et rendent le tableau illisible.

### 16. FraisLogistique : tarifs maritimes hardcodes dans le composant
**FraisLogistique.tsx:24-33** : Les prix de fret (MQ: 2800€, GP: 3200€, etc.) sont hardcodes dans le code. L'admin ne peut pas les modifier depuis l'interface.
**Impact** : Pour mettre a jour les tarifs, il faut modifier le code source.

### 17. console.log de debug en production
**ListeDevis.tsx:48** : `console.log('PDF data:', JSON.stringify(data, null, 2))` — log verbeux dans la console en production.
**Impact** : Bruit dans la console, potentielle fuite d'infos sensibles (donnees devis).

---

## COHERENCE FRONT ↔ BACK-OFFICE

### 18. Devis front : champs `destination` et `is_vip` absents
**Panier.tsx:160-176** : Le front cree un devis avec `numero`, `client_id`, `statut`, `lignes`, `total_ht`, etc. Mais le champ `destination` (lu par le Dashboard pour les stats par territoire) et `is_vip` (lu par ListeDevis pour le badge VIP) ne sont pas crees.
**Impact** : Les devis front apparaissent dans le back-office sans destination et sans badge VIP. Le Dashboard ne peut pas calculer les stats par destination.

### 19. Collection `notes_commission` vs `commissions` — noms incoherents
**Dashboard.tsx:103** lit `notes_commission` tandis que **NotesCommission.tsx:47** et **Factures.tsx:86** lisent `commissions`. Deux noms differents pour la meme donnee.
**Impact** : Si les commissions sont ecrites dans `commissions`, le Dashboard ne les voit pas (il lit `notes_commission`). Les stats commissions du dashboard seront toujours a 0.

### 20. Produit desactive (actif=false) : front le filtre mais le back-office affiche tout
**Catalogue.tsx:42** : Le front filtre `actif !== false`. Le back-office (`CatalogueProduits.tsx`) affiche tous les produits sans distinction. C'est correct pour l'admin, mais il n'y a **aucun indicateur visuel** pour savoir quels produits sont inactifs (pas de badge "Inactif" ni de grisage).
**Impact** : L'admin ne voit pas facilement quels produits sont visibles sur le site.

---

## RESUME PAR PRIORITE

| # | Severite | Page | Bug |
|---|----------|------|-----|
| 1 | CRITIQUE | Dashboard | Stats KPI hardcodees (34200€, 8320€) — fausses |
| 2 | CRITIQUE | Partenaires | "Ajouter partenaire" = alert() placeholder |
| 3 | CRITIQUE | ListeDevis | "Exporter Excel" sans onClick |
| 4 | CRITIQUE | AdminLogin | Aucune verification de role admin |
| 5 | CRITIQUE | DetailDevis | Pas de validation avant sauvegarde |
| 6 | IMPORTANT | 7 pages | Pas de confirmation apres sauvegarde |
| 7 | IMPORTANT | 7 pages | Timeout 3s hardcode = faux loading |
| 8 | IMPORTANT | 16 pages | Erreurs Firestore silencieuses |
| 9 | IMPORTANT | 6 pages | alert() natif comme feedback |
| 10 | IMPORTANT | CatalogueProduits | Produits demo hardcodes |
| 11 | IMPORTANT | FraisLogistique | Erreurs avalees silencieusement |
| 12 | MINEUR | GestionSite | 2 boutons Enregistrer separés |
| 13 | MINEUR | Parametres | Pas de validation numerique |
| 14 | MINEUR | TauxRMB | Pas de message si API echoue |
| 15 | MINEUR | Logs | JSON brut dans les cellules |
| 16 | MINEUR | FraisLogistique | Tarifs hardcodes dans le code |
| 17 | MINEUR | ListeDevis | console.log debug en production |
| 18 | COHERENCE | Panier→Admin | Champs destination et is_vip manquants |
| 19 | COHERENCE | Dashboard vs NotesCommission | Collection notes_commission vs commissions |
| 20 | COHERENCE | CatalogueProduits | Pas d'indicateur visuel pour produits inactifs |
