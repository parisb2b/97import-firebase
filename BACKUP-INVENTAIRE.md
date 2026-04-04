# BACKUP-INVENTAIRE.md — 97import.com
## Date : 2026-04-04
## Version : v1.0.0-firebase

---

## État du projet au moment de la sauvegarde

### Stack technique
- **Frontend** : React 19 + Vite 8 + TypeScript
- **Backend** : Firebase (Auth + Firestore + Storage + Functions)
- **Routing** : wouter
- **Hébergement** : Vercel (projet prj_jhYpQpP3WSwMXrsgzQcElM84A4sq)
- **Domaine** : 97import.com + www.97import.com

### Firebase
- **Projet** : import2030
- **Region** : europe-west1
- **Auth** : Dual instances (authClient + authAdmin)
- **Firestore** : Collections actives (users, products, quotes, contacts, leads)

### Fichiers source
- **Pages publiques** : 27 pages
- **Pages admin** : 19 pages
- **Hooks** : 7 hooks
- **Composants** : 10 composants
- **Fichiers TS/TSX** : 91 fichiers
- **Médias dans public/** : 183 fichiers

---

## Inventaire des répertoires

```
C:\DATA-MC-2030\97IMPORT\
├── src/
│   ├── pages/          → 27 pages publiques + admin/
│   ├── components/     → Header, Footer, ErrorBoundary, etc.
│   ├── contexts/       → AuthContext, LanguageContext
│   ├── features/       → cart, account, pricing, pdf, excel
│   ├── hooks/          → 7 hooks Firebase
│   ├── lib/            → firebase.ts (dual apps)
│   ├── data/           → pricing.ts, translations.json, settings.json
│   ├── types/          → index.ts (interfaces Firestore)
│   └── utils/          → calculPrix.ts
├── public/
│   ├── images/         → 163 médias organisés
│   ├── documents/      → 4 PDFs fiches techniques
│   └── docs/           → 1 PDF maison modulaire
├── scripts/
│   └── media_sync.mjs  → Script synchronisation médias
└── rapports/
    ├── RAPPORT-MEDIAS.md
    ├── RAPPORT-STRUCTURE.md
    ├── RAPPORT-ALIGNEMENT.md
    └── medias-inventory.json
```

---

## Variables d'environnement Vercel (Firebase)
- VITE_FIREBASE_API_KEY ✅
- VITE_FIREBASE_AUTH_DOMAIN ✅
- VITE_FIREBASE_PROJECT_ID ✅
- VITE_FIREBASE_STORAGE_BUCKET ✅
- VITE_FIREBASE_MESSAGING_SENDER_ID ✅
- VITE_FIREBASE_APP_ID ✅
- VITE_FIREBASE_MEASUREMENT_ID ✅
- VITE_VERCEL_DEPLOY_HOOK ✅

---

## Référence Git
- Commit initial : v1.0.0-firebase (tag de sécurité)
- Branch : main
