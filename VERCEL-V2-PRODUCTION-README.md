# Vercel v2 — 97IMPORT

## URLs

Front preview :

```text
https://97import-firebase-git-v2-parisb2bs-projects.vercel.app/
```

Admin preview :

```text
https://97import-firebase-git-v2-parisb2bs-projects.vercel.app/admin
```

## Branche

```text
v2
```

## Tests manuels obligatoires après chaque PR Codex

1. Ouvrir FRONT
2. Ouvrir ADMIN
3. Login admin avec compte autorisé
4. Vérifier dashboard
5. Vérifier catalogue produits
6. Vérifier clients
7. Vérifier partenaires
8. Vérifier création devis test si mission documentaire
9. Vérifier absence d'erreur console majeure

## Variables Vercel à vérifier

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Ne jamais stocker ces valeurs dans le repo sauf `.env.example` sans secrets.
