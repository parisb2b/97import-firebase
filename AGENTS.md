# AGENTS.md — 97IMPORT / 97importok-firebase

## Projet

97IMPORT est une plateforme B2B d'import Chine → DOM-TOM.

Stack :
- React 19
- TypeScript
- Vite
- Tailwind
- Firebase Auth / Firestore / Storage
- Vercel
- Resend

## Branche de travail

Toujours travailler sur :

```bash
v2
```

Ne jamais travailler directement sur `main`.

Ne jamais merger automatiquement `v2` vers `main`.

## Firebase

Project ID obligatoire :

```bash
importok-6ef77
```

Toutes les commandes Firebase doivent utiliser explicitement :

```bash
--project=importok-6ef77
```

Interdit :

```bash
firebase deploy
firebase deploy --only firestore:rules
firebase use import2030
firebase use
```

Autorisé uniquement après validation humaine :

```bash
firebase deploy --only firestore:rules --project=importok-6ef77
```

## Vercel

Preview front :

```text
https://97import-firebase-git-v2-parisb2bs-projects.vercel.app/
```

Preview admin :

```text
https://97import-firebase-git-v2-parisb2bs-projects.vercel.app/admin
```

## Secrets

Ne jamais lire, afficher, copier, zipper ou commiter :

```text
.env
.env.production
.env.local
firebase-admin-sdk.json
serviceAccountKey.json
*service-account*.json
tokens
clés API privées
tokens Vercel
tokens GitHub
```

Les fichiers `.env.example` sont autorisés uniquement sans valeurs sensibles.

## Commandes de validation

Après chaque modification :

```bash
npm run build
git status --short
```

## Collections à conserver

Ne jamais supprimer sans validation humaine explicite :

```text
users
clients
partners
products
categories
ports
admin_params
tarifs_logistiques
counters
```

## Données documentaires

Les collections documentaires peuvent être archivées ou purgées uniquement via script avec :

```text
- PROJECT_ID hardcodé
- vérification serviceAccount.project_id
- dry-run obligatoire
- archive JSON obligatoire
- ZIP archive obligatoire
- confirmation humaine obligatoire
```

Collections documentaires typiques :

```text
quotes
factures
invoices
logistics_invoices
commissions
notes_commission
conteneurs
containers
listes_achat
sav
mail
logs
```

## Scripts destructifs

Tout script destructif doit :

1. avoir `PROJECT_ID = 'importok-6ef77'`
2. vérifier `serviceAccount.project_id`
3. fonctionner par défaut en dry-run
4. exiger `--execute`
5. exiger un flag de confirmation explicite
6. afficher les collections touchées
7. refuser de toucher aux collections KEEP
8. créer une archive avant suppression

## Pricing

Règle métier :

```text
CNY = source de vérité unique
USD = calculé
EUR = calculé
Prix public = prix achat EUR × multiplicateur client
Prix partenaire = prix achat EUR × multiplicateur partenaire
```

Ne jamais rendre USD/EUR éditables si la logique pricing centralisée est active.

## Firestore Rules

Ne pas modifier `firestore.rules` sans :

```text
- expliquer pourquoi
- lancer build
- valider syntaxe rules
- demander validation humaine avant deploy
```

Déploiement rules uniquement avec :

```bash
firebase deploy --only firestore:rules --project=importok-6ef77
```

## Storage

Ne jamais modifier le bucket Storage dans `firebase.json` ou dans les variables d'environnement sans audit préalable.

Le projet historique a eu confusion entre :

```text
import2030
importok-6ef77
```

`import2030` est interdit.

## Rapports

Chaque mission doit générer un rapport :

```text
MAJ-VXX.txt
```

ou un rapport nommé explicitement.

Le rapport doit contenir :

```text
- résumé
- fichiers modifiés
- commandes exécutées
- tests effectués
- risques restants
- rollback plan
```

## Mode production Codex

Codex doit proposer les modifications sous forme de PR ou diff reviewable.

Codex ne doit jamais :

```text
- supprimer des données
- exécuter de migration destructrice
- déployer Firebase
- modifier main
- exposer des secrets
```

sans validation humaine explicite.
