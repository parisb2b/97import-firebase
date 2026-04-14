# AUDIT UX — Bugs de Parcours Utilisateur
Date : 2026-04-14 | Branche : v2

---

## CRITIQUES (bloquent l'utilisateur)

### 1. Inscription : le profil n'est PAS cree dans `users/` — role introuvable ensuite
**Inscription.tsx:33** ecrit dans `profiles/{uid}` mais JAMAIS dans `users/{uid}`. Or Header.tsx, Produit.tsx et Catalogue.tsx lisent le role depuis `users/{uid}`. Un nouvel inscrit n'a pas de document `users/`, donc `snap.data()?.role` retourne `undefined` → fallback `'user'`.
**Impact** : Pas bloquant pour un client (fallback OK), mais **bloquant si un admin cree un partenaire via l'inscription front** — le role ne sera jamais lu correctement.
**Recommandation** : Inscription doit ecrire dans `users/{uid}` en plus de (ou a la place de) `profiles/{uid}`.

### 2. Panier Header : compteur toujours a 0 — le panier semble vide
**Header.tsx:50** : `const [cartCount] = useState(0);` avec le commentaire `// TODO: connect to cart context`. Le compteur n'est JAMAIS mis a jour. L'utilisateur ajoute un produit, le Header affiche toujours 0 article.
**Impact** : L'utilisateur pense que l'ajout au panier n'a pas fonctionne. Aucun feedback visuel dans le header.

### 3. Connexion : le partenaire est redirige vers `/` au lieu de `/espace-partenaire`
**Connexion.tsx:16-28** : `checkProfileAndRedirect()` verifie si le profil est complet (telephone+adresse), puis redirige vers `/profil` ou `/`. Il ne verifie JAMAIS le role. Un partenaire qui se connecte arrive sur la homepage, pas sur son espace partenaire.
**Impact** : Le partenaire doit cliquer manuellement sur son nom dans le header pour acceder a son espace.

### 4. Profil : apres sauvegarde, l'utilisateur est redirige vers `/` au lieu de `/espace-client`
**Profil.tsx:75** : `setLocation('/')` apres la sauvegarde. Un nouvel inscrit qui vient de completer son profil se retrouve sur la homepage au lieu de son espace client.
**Impact** : L'utilisateur doit naviguer manuellement vers son espace. Parcours interrompu.

---

## IMPORTANTS (mauvaise experience)

### 5. Aucun message de confirmation apres ajout au panier — juste un `alert('OK!')`
**Produit.tsx:101** : `alert('OK!')` — c'est un alert JavaScript natif, pas un toast ou une notification elegante. L'utilisateur voit une popup du navigateur avec "OK!" sans contexte.
**Impact** : Experience brute. Pas de detail sur ce qui a ete ajoute, pas de lien vers le panier.

### 6. Aucun message de succes apres creation du devis
**Panier.tsx:177-182** : Apres `setDoc` du devis dans Firestore, le code fait `setPopupStep(null)` puis `setLocation('/espace-client')` sans aucun message de confirmation. L'utilisateur est redirige sans savoir si le devis a ete cree.
**Impact** : L'utilisateur ne sait pas si la creation a reussi, surtout si la redirection est lente.

### 7. Aucun message de confirmation apres sauvegarde du profil
**Profil.tsx:57-80** : Apres le `setDoc`, redirection silencieuse vers `/`. Pas de toast, pas d'alert, pas de feedback.
**Impact** : L'utilisateur ne sait pas si ses informations ont ete sauvegardees.

### 8. Erreurs Firestore silencieuses — page blanche sans message
**Produit.tsx** : Si le produit n'est pas trouve, affiche juste "—" (un tiret). Pas de message "Produit introuvable, retourner au catalogue".
**EspaceClient.tsx** : Si la requete `quotes` echoue (ex: index Firestore manquant), le catch fait `console.error` mais l'utilisateur voit juste "Chargement..." indefiniment.
**Panier.tsx:183-184** : Si la creation du devis echoue, le catch fait `console.error` mais l'utilisateur ne voit aucune erreur.
**Impact** : L'utilisateur est bloque sans savoir pourquoi.

### 9. Profil.tsx lit depuis `profiles/` mais la clef i18n `profil.subtitleDesc` n'existe pas
**Profil.tsx:103** : `{t('profil.subtitleDesc')}` — cette cle n'est pas dans fr.json/en.json/zh.json. L'utilisateur voit le texte brut `profil.subtitleDesc` au lieu d'une traduction.
**Impact** : Texte non traduit visible par l'utilisateur.

---

## MINEURS (ameliorations UX)

### 10. Toggle langue ne change PAS les noms de produits dans le catalogue
**Catalogue.tsx** : Passe `lang` a ProductCard, qui affiche `nom_zh`/`nom_en`/`nom_fr`. Mais les noms des **categories** (Mini-Pelle, Maisons, Solaire) et les descriptions de la **homepage** restent en francais car elles viennent de Firestore (`p.categorie`).
**Impact** : Experience i18n incomplete — les titres changent mais les noms de categories restent en FR.

### 11. "Verser un acompte" dans EspaceClient ouvre WhatsApp au lieu d'un popup
**EspaceClient.tsx:93** : `handleVerserAcompte` ouvre WhatsApp avec un message pre-rempli. Ce n'est pas un vrai processus de paiement — c'est un workaround.
**Impact** : L'utilisateur s'attend a un formulaire de virement comme dans le panier (popup RIB). Il se retrouve sur WhatsApp a la place.

### 12. Footer : liens Mentions legales, CGV, RGPD affichent un placeholder vide
**FrontApp.tsx:44-46** : Les 3 pages legales sont des `Placeholder` qui affichent juste "[nom] — page a venir". Pour un site commercial, c'est problematique.
**Impact** : Absence de mentions legales obligatoires. Probleme legal potentiel.

### 13. Bouton "Rechercher" dans SearchBar est decoratif
**SearchBar.tsx:63** : Le bouton n'a pas d'onClick. La recherche fonctionne via `onChange` sur l'input, mais un utilisateur qui tape puis clique "Rechercher" ne comprend pas pourquoi il ne se passe rien de plus.
**Impact** : Confusion UX mineure.

### 14. Panier : pas de message d'erreur si le panier est vide et l'utilisateur clique "Generer devis"
**Panier.tsx:128** : `if (cart.length === 0) return;` — le bouton ne fait rien silencieusement. Pas de message "Votre panier est vide".
**Impact** : L'utilisateur clique et rien ne se passe.

### 15. EspacePartenaire : `alert('Devis VIP envoye au client !')` — alert natif
**EspacePartenaire.tsx:92** : Meme probleme que le #5. Un alert JavaScript natif au lieu d'un toast elegant.
**Impact** : Experience brute.

---

## RESUME PAR PRIORITE

| # | Severite | Page | Bug |
|---|----------|------|-----|
| 1 | CRITIQUE | Inscription | Profile cree dans `profiles/` mais pas `users/` |
| 2 | CRITIQUE | Header | Compteur panier toujours 0 |
| 3 | CRITIQUE | Connexion | Partenaire redirige vers `/` au lieu de `/espace-partenaire` |
| 4 | CRITIQUE | Profil | Redirect vers `/` au lieu de `/espace-client` |
| 5 | IMPORTANT | Produit | `alert('OK!')` au lieu d'un toast |
| 6 | IMPORTANT | Panier | Pas de message de succes apres creation devis |
| 7 | IMPORTANT | Profil | Pas de feedback apres sauvegarde |
| 8 | IMPORTANT | Multiple | Erreurs Firestore silencieuses |
| 9 | IMPORTANT | Profil | Cle i18n `profil.subtitleDesc` manquante |
| 10 | MINEUR | Catalogue/Home | Categories non traduites (Firestore en FR) |
| 11 | MINEUR | EspaceClient | "Verser acompte" → WhatsApp au lieu de popup |
| 12 | MINEUR | Footer | Mentions/CGV/RGPD = placeholders |
| 13 | MINEUR | SearchBar | Bouton "Rechercher" decoratif |
| 14 | MINEUR | Panier | Clic "Generer devis" silencieux si panier vide |
| 15 | MINEUR | EspacePartenaire | alert() natif pour confirmation VIP |
