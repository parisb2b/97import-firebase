# ════════════════════════════════════════════════════════
# PROMPT CLAUDE CODE — MODE AUTONOME NUIT
# SCANNER L'ANCIEN SITE → RECONSTRUIRE LE BACK-OFFICE + FLUX COMPLET
# Dossier projet : C:\DATA-MC-2030\97IMPORT
# ════════════════════════════════════════════════════════
#
# ⚠️ MODE AUTONOME : Ne pose AUCUNE question. Exécute tout.
# Si un doute → prends la décision la plus logique et note-la dans le rapport.
# Écris TOUT le rapport dans C:\DATA-MC-2030\97IMPORT\1MAJALL\RAPPORT-NUIT-BACKOFFICE.md
#
# CONTEXTE :
# L'ancien site (Vercel/Supabase) avait un back-office fonctionnel
# avec gestion des devis, VIP, partenaires, factures.
# Le nouveau site Firebase (localhost:5173) a un back-office cassé.
# On doit récupérer la logique de l'ancien et l'adapter à Firebase.
#
# ════════════════════════════════════════════════════════

## RÈGLE OBLIGATOIRE — EN PREMIER
```powershell
cd C:\DATA-MC-2030\97IMPORT
git fetch origin && git reset --hard origin/main
git tag backup-backoffice-nuit-$(Get-Date -Format "yyyyMMdd-HHmm")
git push origin --tags
git log --oneline -3
```

# ══════════════════════════════════════════════════════
# ÉTAPE 1 — SCANNER LA STRUCTURE DE L'ANCIEN CODE SOURCE
# ══════════════════════════════════════════════════════
# NE RIEN MODIFIER. LIRE SEULEMENT.
#
# Répertoires à scanner :
#   C:\DATA-MC-2030\97IMPORT\97import2026_siteweb
#   C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL
#   C:\DATA-MC-2030\97IMPORT\src (nouveau projet Firebase actuel)

```powershell
Write-Host "═══ ÉTAPE 1 : SCAN STRUCTURE ═══"

# 1A — Ancien site
Write-Host "`n--- ANCIEN SITE (97import2026_siteweb) ---"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\97import2026_siteweb" -Recurse -Depth 4 -Include "*.tsx","*.ts","*.jsx" | ForEach-Object {
  $rel = $_.FullName.Replace("C:\DATA-MC-2030\97IMPORT\97import2026_siteweb\", "")
  Write-Host "  $rel"
}

# 1B — Migration package
Write-Host "`n--- MIGRATION PACKAGE ---"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL" -Recurse -Depth 4 -Include "*.tsx","*.ts","*.jsx" 2>$null | ForEach-Object {
  $rel = $_.FullName.Replace("C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL\", "")
  Write-Host "  $rel"
}

# 1C — Nouveau site Firebase actuel
Write-Host "`n--- NOUVEAU SITE FIREBASE (src/) ---"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\src" -Recurse -Depth 4 -Include "*.tsx","*.ts" | ForEach-Object {
  $rel = $_.FullName.Replace("C:\DATA-MC-2030\97IMPORT\src\", "")
  Write-Host "  $rel"
}
```

# ══════════════════════════════════════════════════════
# ÉTAPE 2 — SCANNER LE BACK-OFFICE DE L'ANCIEN SITE
# ══════════════════════════════════════════════════════
# Trouver et LIRE tous les fichiers admin de l'ancien site

```powershell
Write-Host "`n═══ ÉTAPE 2 : SCAN BACK-OFFICE ANCIEN ═══"

$ancienPaths = @(
  "C:\DATA-MC-2030\97IMPORT\97import2026_siteweb",
  "C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL"
)

foreach ($base in $ancienPaths) {
  Write-Host "`n--- $base ---"
  
  # Fichiers admin/back-office
  Write-Host "`n[PAGES ADMIN]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Where-Object { $_.Name -match "Admin|admin|BackOffice|Dashboard" } | ForEach-Object {
    Write-Host "  📄 $($_.FullName.Replace($base, ''))"
  }
  
  # Fichiers auth/login
  Write-Host "`n[AUTH / LOGIN]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Select-String -Pattern "signIn|login|AdminLogin|authAdmin|signInWithEmail" -List | ForEach-Object {
    Write-Host "  📄 $($_.Path.Replace($base, ''))"
  }
  
  # Fichiers devis/quotes
  Write-Host "`n[DEVIS / QUOTES]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Where-Object { $_.Name -match "Quote|Devis|devis|quote" } | ForEach-Object {
    Write-Host "  📄 $($_.FullName.Replace($base, ''))"
  }
  
  # Fichiers partenaires/VIP
  Write-Host "`n[PARTENAIRES / VIP]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Select-String -Pattern "partner|partenaire|VIP|vip|commission|prix_negocie" -List | ForEach-Object {
    Write-Host "  📄 $($_.Path.Replace($base, ''))"
  }
  
  # Fichiers rôles/profils
  Write-Host "`n[RÔLES / PROFILS]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Select-String -Pattern "role.*user|role.*vip|role.*partner|role.*admin|role.*visitor|handleChangeRole" -List | ForEach-Object {
    Write-Host "  📄 $($_.Path.Replace($base, ''))"
  }
}
```

# ══════════════════════════════════════════════════════
# ÉTAPE 3 — LIRE LE CONTENU DES FICHIERS ADMIN CLÉS
# ══════════════════════════════════════════════════════
# Lire le contenu COMPLET de chaque fichier admin trouvé

```powershell
Write-Host "`n═══ ÉTAPE 3 : LECTURE FICHIERS ADMIN ═══"

foreach ($base in $ancienPaths) {
  # Lire tous les fichiers admin
  $adminFiles = Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Where-Object {
    $_.Name -match "Admin|Dashboard|Quote|Devis|Partner|Login" -or
    $_.FullName -match "admin|back-office"
  }
  
  foreach ($file in $adminFiles) {
    $lines = (Get-Content $file.FullName | Measure-Object -Line).Lines
    $rel = $file.FullName.Replace($base, "")
    Write-Host "`n════ $($file.Name) ($lines lignes) ════"
    Write-Host "Chemin: $rel"
    Write-Host "────────────────────"
    
    if ($lines -le 300) {
      type $file.FullName
    } else {
      Write-Host "(Fichier long — 100 premières lignes + fonctions clés)"
      Get-Content $file.FullName -Head 100
      Write-Host "`n... (lignes 101-$($lines-50) omises) ...`n"
      Get-Content $file.FullName -Tail 50
    }
    Write-Host "────────────────────"
  }
}
```

# ══════════════════════════════════════════════════════
# ÉTAPE 4 — SCANNER LE FLUX DEVIS COMPLET DE L'ANCIEN SITE
# ══════════════════════════════════════════════════════
# Comprendre le parcours : panier → devis → VIP → acompte → facture

```powershell
Write-Host "`n═══ ÉTAPE 4 : FLUX DEVIS ANCIEN SITE ═══"

foreach ($base in $ancienPaths) {
  # Fichiers liés au flux devis
  Write-Host "`n--- $base ---"
  
  # Cart / Panier
  Write-Host "`n[PANIER / CART]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Where-Object { $_.Name -match "Cart|Panier|cart" } | ForEach-Object {
    Write-Host "`n═══ $($_.Name) ═══"
    type $_.FullName
  }
  
  # DevisForm / formulaire devis
  Write-Host "`n[FORMULAIRE DEVIS]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Where-Object { $_.Name -match "DevisForm|QuoteForm" } | ForEach-Object {
    Write-Host "`n═══ $($_.Name) ═══"
    type $_.FullName
  }
  
  # Espace client / Mon compte
  Write-Host "`n[ESPACE CLIENT]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Where-Object { $_.Name -match "MonCompte|Account|QuotesTab|ProfileTab" } | ForEach-Object {
    Write-Host "`n═══ $($_.Name) ═══"
    type $_.FullName
  }
  
  # Calcul prix
  Write-Host "`n[CALCUL PRIX]"
  Get-ChildItem -Path $base -Recurse -Include "*.tsx","*.ts" 2>$null | Where-Object { $_.Name -match "calculPrix|prix|pricing" } | ForEach-Object {
    Write-Host "`n═══ $($_.Name) ═══"
    type $_.FullName
  }
}
```

# ══════════════════════════════════════════════════════
# ÉTAPE 5 — SCANNER LE BACK-OFFICE ACTUEL (FIREBASE)
# ══════════════════════════════════════════════════════
# Comprendre l'état actuel pour savoir ce qui manque

```powershell
Write-Host "`n═══ ÉTAPE 5 : ÉTAT ACTUEL BACK-OFFICE FIREBASE ═══"

# Lister les pages admin actuelles
Write-Host "`n[PAGES ADMIN ACTUELLES]"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\src" -Recurse -Include "*.tsx","*.ts" | Where-Object {
  $_.FullName -match "admin" -or $_.Name -match "Admin"
} | ForEach-Object {
  $rel = $_.FullName.Replace("C:\DATA-MC-2030\97IMPORT\src\", "")
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  Write-Host "  📄 $rel ($lines lignes)"
}

# Lire le fichier firebase.ts (connexion)
Write-Host "`n[FIREBASE CONFIG]"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\src" -Recurse -Include "*.ts" | Where-Object { $_.Name -match "firebase" } | ForEach-Object {
  Write-Host "`n═══ $($_.Name) ═══"
  type $_.FullName
}

# Lire le router / App.tsx
Write-Host "`n[ROUTER]"
type "C:\DATA-MC-2030\97IMPORT\src\App.tsx" 2>$null

# Lire AdminLogin
Write-Host "`n[ADMIN LOGIN]"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\src" -Recurse -Include "*.tsx" | Where-Object { $_.Name -match "AdminLogin|LoginAdmin" } | ForEach-Object {
  Write-Host "`n═══ $($_.Name) ═══"
  type $_.FullName
}
```

# ══════════════════════════════════════════════════════
# ÉTAPE 6 — PRODUIRE LE RAPPORT DE COMPARAISON
# ══════════════════════════════════════════════════════
# AVANT de modifier quoi que ce soit, écrire un rapport dans :
# C:\DATA-MC-2030\97IMPORT\1MAJALL\RAPPORT-COMPARAISON.md

```
Le rapport DOIT contenir :

1. BACK-OFFICE ANCIEN (Supabase) :
   - Liste des pages admin avec leurs fonctionnalités
   - Flux devis complet : panier → devis → VIP → partenaire → acompte → facture
   - Comment le rôle VIP est géré (prix négocié)
   - Comment le partenaire modifie le prix
   - Comment l'admin encaisse et génère les factures

2. BACK-OFFICE ACTUEL (Firebase) :
   - Liste des pages admin existantes
   - Ce qui fonctionne
   - Ce qui est cassé ou manquant

3. PLAN D'ACTION :
   - Fichiers à copier de l'ancien vers le nouveau
   - Adaptations Supabase → Firebase nécessaires
   - Fonctionnalités manquantes à recréer

4. COMPTES TEST À CRÉER (Firebase Auth + Firestore profiles)
```

# ══════════════════════════════════════════════════════
# ÉTAPE 7 — CRÉER LES 5 COMPTES TEST DANS FIREBASE
# ══════════════════════════════════════════════════════
#
# Créer un script qui initialise les 5 types d'utilisateurs
# dans Firebase Auth ET dans Firestore collection 'profiles'.
#
# Les 5 comptes :
#
# ┌──────────┬──────────────────────────┬──────────────┬──────────────────────┐
# │ Rôle     │ Email                    │ Mot de passe │ Détails              │
# ├──────────┼──────────────────────────┼──────────────┼──────────────────────┤
# │ visitor  │ (pas de compte)          │ —            │ Non connecté         │
# │ user     │ user@97import.com        │ Test2026!    │ Client standard      │
# │ vip      │ vip@97import.com         │ Test2026!    │ Client VIP           │
# │ partner  │ partner@97import.com     │ Test2026!    │ Partenaire JM        │
# │ admin    │ admin@97import.com       │ Admin2026!   │ Administrateur       │
# └──────────┴──────────────────────────┴──────────────┴──────────────────────┘
#
# Créer le fichier : src/scripts/createTestUsers.ts
#

```typescript
// src/scripts/createTestUsers.ts
// Exécuter UNE SEULE FOIS avec : npx tsx src/scripts/createTestUsers.ts

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import * as dotenv from 'dotenv'
dotenv.config()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const testUsers = [
  {
    email: 'user@97import.com',
    password: 'Test2026!',
    profile: {
      role: 'user',
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '0601020304',
      email: 'user@97import.com',
      adresse_facturation: '15 rue des Lilas',
      ville_facturation: 'Fort-de-France',
      cp_facturation: '97200',
      pays_facturation: 'Martinique',
      adresse_livraison: '15 rue des Lilas',
      ville_livraison: 'Fort-de-France',
      cp_livraison: '97200',
      pays_livraison: 'Martinique',
      adresse_livraison_identique: true,
    }
  },
  {
    email: 'vip@97import.com',
    password: 'Test2026!',
    profile: {
      role: 'vip',
      first_name: 'Marie',
      last_name: 'Martin',
      phone: '0611223344',
      email: 'vip@97import.com',
      adresse_facturation: '8 avenue Foch',
      ville_facturation: 'Le Lamentin',
      cp_facturation: '97232',
      pays_facturation: 'Martinique',
      adresse_livraison: '8 avenue Foch',
      ville_livraison: 'Le Lamentin',
      cp_livraison: '97232',
      pays_livraison: 'Martinique',
      adresse_livraison_identique: true,
    }
  },
  {
    email: 'partner@97import.com',
    password: 'Test2026!',
    profile: {
      role: 'partner',
      first_name: 'Patrick',
      last_name: 'Bernard',
      phone: '0622334455',
      email: 'partner@97import.com',
      adresse_facturation: 'Quartier Reprise',
      ville_facturation: 'Rivière-Salée',
      cp_facturation: '97215',
      pays_facturation: 'Martinique',
      adresse_livraison: 'Quartier Reprise',
      ville_livraison: 'Rivière-Salée',
      cp_livraison: '97215',
      pays_livraison: 'Martinique',
      adresse_livraison_identique: true,
    }
  },
  {
    email: 'admin@97import.com',
    password: 'Admin2026!',
    profile: {
      role: 'admin',
      first_name: 'Michel',
      last_name: 'Chen',
      phone: '0663284908',
      email: 'admin@97import.com',
      adresse_facturation: '2 Rue Konrad Adenauer',
      ville_facturation: 'Bussy-Saint-Georges',
      cp_facturation: '77600',
      pays_facturation: 'France',
      adresse_livraison_identique: true,
    }
  },
]

async function createAllUsers() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║  CRÉATION DES 5 COMPTES TEST 97IMPORT  ║')
  console.log('╚════════════════════════════════════════╝')

  for (const user of testUsers) {
    try {
      console.log(`\n→ Création ${user.profile.role}: ${user.email}`)
      
      const cred = await createUserWithEmailAndPassword(auth, user.email, user.password)
      const uid = cred.user.uid
      console.log(`  ✅ Auth créé (uid: ${uid})`)
      
      await setDoc(doc(db, 'profiles', uid), {
        ...user.profile,
        created_at: serverTimestamp(),
      })
      console.log(`  ✅ Profile Firestore créé (rôle: ${user.profile.role})`)
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`  ⚠️ ${user.email} existe déjà — ignoré`)
      } else {
        console.error(`  ❌ Erreur: ${error.message}`)
      }
    }
  }

  // Créer aussi le partenaire dans la collection 'partners'
  console.log('\n→ Création partenaire JM dans collection partners...')
  try {
    await setDoc(doc(db, 'partners', 'partner-jm'), {
      nom: 'JM PRESTATIONS',
      code: 'JM',
      email: 'partner@97import.com',
      telephone: '0622334455',
      actif: true,
      created_at: serverTimestamp(),
    })
    console.log('  ✅ Partenaire JM créé')
  } catch (e: any) {
    console.log(`  ⚠️ ${e.message}`)
  }

  // Créer les autres partenaires
  const otherPartners = [
    { id: 'partner-td', nom: 'TD SERVICES', code: 'TD', email: 'td@example.com' },
    { id: 'partner-mc', nom: 'MC IMPORT', code: 'MC', email: 'mc@example.com' },
  ]
  for (const p of otherPartners) {
    try {
      await setDoc(doc(db, 'partners', p.id), {
        ...p, actif: true, telephone: '', created_at: serverTimestamp(),
      })
      console.log(`  ✅ Partenaire ${p.code} créé`)
    } catch (e: any) {
      console.log(`  ⚠️ ${e.message}`)
    }
  }

  console.log('\n════════════════════════════════════════')
  console.log('COMPTES CRÉÉS :')
  console.log('  user@97import.com     / Test2026!  → rôle: user')
  console.log('  vip@97import.com      / Test2026!  → rôle: vip')
  console.log('  partner@97import.com  / Test2026!  → rôle: partner (JM)')
  console.log('  admin@97import.com    / Admin2026! → rôle: admin')
  console.log('  (visitor = pas de compte, non connecté)')
  console.log('════════════════════════════════════════')
}

createAllUsers().catch(console.error).finally(() => process.exit(0))
```

Exécuter le script :
```powershell
npx tsx src/scripts/createTestUsers.ts
```

# ══════════════════════════════════════════════════════
# ÉTAPE 8 — COPIER ET ADAPTER LE BACK-OFFICE
# ══════════════════════════════════════════════════════
#
# POUR CHAQUE page admin trouvée dans l'ancien site (étape 3) :
#
# 1. COMPARER avec la version actuelle dans src/pages/admin/
# 2. Si l'ancienne version est PLUS COMPLÈTE → la copier
# 3. Adapter UNIQUEMENT :
#    - import supabase → import { db } from firebase.ts
#    - supabase.from('table').select() → getDocs(collection(db, 'table'))
#    - supabase.from('table').insert() → addDoc(collection(db, 'table'), data)
#    - supabase.from('table').update() → updateDoc(doc(db, 'table', id), data)
#    - supabase.from('table').delete() → updateDoc actif:false (soft delete)
# 4. NE PAS changer le layout, les couleurs, les boutons, la logique métier
#
# Pages admin attendues :
#   /admin/login      → AdminLogin.tsx (connexion admin séparée)
#   /admin            → AdminDashboard.tsx (stats)
#   /admin/devis      → AdminQuotes.tsx (liste devis + fiche détaillée + GDF)
#   /admin/users      → AdminUsers.tsx (liste clients + changement rôle)
#   /admin/partenaires → AdminPartenaires.tsx (partenaires TD/JM/MC)
#   /admin/products   → AdminProducts.tsx (CRUD produits)
#   /admin/suivi-achats → AdminSuiviAchats.tsx (export Excel)
#   /admin/parametres → AdminParametres.tsx (émetteur, RIB, config)
#   /admin/contenu    → AdminContenu.tsx (bannière, footer, contact)
#
# FLUX VIP dans AdminQuotes.tsx :
#   1. Devis arrive avec statut 'nouveau'
#   2. Admin clique "Passer en VIP" → saisit prix_negocie
#   3. Statut passe à 'vip'
#   4. Client voit son prix négocié dans /mon-compte
#   5. Client déclare un acompte (pop-up 3 étapes)
#   6. Admin voit le badge "Acompte déclaré" et clique "Encaisser"
#   7. Facture FA générée automatiquement
#   8. Quand solde = 0 → facture SOLDÉE + envoi notices techniques

# ══════════════════════════════════════════════════════
# ÉTAPE 9 — VÉRIFIER LA CONNEXION ADMIN
# ══════════════════════════════════════════════════════
#
# Le back-office utilise une INSTANCE AUTH SÉPARÉE (authAdmin)
# pour que la session admin ne se mélange pas avec la session client.
#
# Vérifier dans firebase.ts qu'il y a bien 2 instances :
#
# ```typescript
# // Instance client (site public + espace client)
# const appClient = initializeApp(firebaseConfig, 'client')
# export const authClient = getAuth(appClient)
#
# // Instance admin (back-office uniquement)
# const appAdmin = initializeApp(firebaseConfig, 'admin')
# export const authAdmin = getAuth(appAdmin)
#
# // Firestore et Storage partagés
# export const db = getFirestore(appClient)
# export const storage = getStorage(appClient)
# ```
#
# AdminLogin.tsx doit utiliser authAdmin, PAS authClient :
# ```typescript
# await signInWithEmailAndPassword(authAdmin, email, password)
# ```
#
# Si la page /admin/login ne fonctionne pas, vérifier :
# 1. Que authAdmin est bien exporté depuis firebase.ts
# 2. Que AdminLogin importe authAdmin (pas authClient)
# 3. Que le compte admin@97import.com existe dans Firebase Auth
# 4. Que le profil admin a role: 'admin' dans Firestore

# ══════════════════════════════════════════════════════
# ÉTAPE 10 — BUILD + TEST + COMMIT + RAPPORT
# ══════════════════════════════════════════════════════

```powershell
npm run build
```

# Si erreurs TypeScript → corriger une par une.
# NE PAS utiliser @ts-ignore sauf en dernier recours.

```powershell
npm run dev
```

# TESTS À EFFECTUER (localhost:5173) :
#
# TEST 1 — Visitor (non connecté) :
#   → Voir les produits SANS prix
#   → Bouton rouge "Se connecter pour voir les prix"
#
# TEST 2 — User (user@97import.com / Test2026!) :
#   → Voir les prix (prix_achat × 2)
#   → Ajouter au panier
#   → Demander un devis → pop-up partenaire → PDF D2604XXX
#   → /mon-compte → onglet "Mes devis" → devis visible
#
# TEST 3 — VIP (vip@97import.com / Test2026!) :
#   → Voir les prix négociés (si configuré par admin)
#   → Demander un devis
#   → Déclarer un acompte (pop-up 3 étapes)
#
# TEST 4 — Partner (partner@97import.com / Test2026!) :
#   → Voir les prix partenaire (prix_achat × 1.2)
#   → /mon-compte → onglet "Commissions"
#
# TEST 5 — Admin (admin@97import.com / Admin2026!) :
#   → /admin/login → se connecter
#   → /admin → Dashboard avec stats
#   → /admin/devis → liste des devis
#   → /admin/users → voir les 4 comptes test
#   → /admin/partenaires → voir JM, TD, MC
#   → /admin/products → liste des produits
#   → /admin/parametres → émetteur LUXENT + RIB

```powershell
git add -A
git commit -m "refactor: back-office reconstruit depuis ancien site + 5 comptes test + flux VIP complet"
git push origin main
git tag v5.19-backoffice-complet
git push origin --tags
```

# ══════════════════════════════════════════════════════
# RAPPORT FINAL → C:\DATA-MC-2030\97IMPORT\1MAJALL\RAPPORT-NUIT-BACKOFFICE.md
# ══════════════════════════════════════════════════════
#
# Le rapport DOIT contenir :
#
# ```markdown
# # RAPPORT NUIT — BACK-OFFICE 97IMPORT
# Date : [date]
#
# ## 1. SCAN ANCIEN SITE
# - Fichiers admin trouvés : [liste]
# - Fichiers devis trouvés : [liste]
# - Fichiers VIP/partenaire trouvés : [liste]
#
# ## 2. COMPARAISON ANCIEN vs NOUVEAU
# | Page | Ancien | Nouveau | Action |
# |------|--------|---------|--------|
# | AdminLogin | ✅ | ❌/✅ | Copié/Adapté/OK |
# | AdminDashboard | ✅ | ❌/✅ | ... |
# | AdminQuotes | ✅ | ❌/✅ | ... |
# | etc. |
#
# ## 3. COMPTES TEST CRÉÉS
# | Email | Rôle | Résultat |
# |-------|------|----------|
# | user@97import.com | user | ✅/❌ |
# | vip@97import.com | vip | ✅/❌ |
# | partner@97import.com | partner | ✅/❌ |
# | admin@97import.com | admin | ✅/❌ |
#
# ## 4. FICHIERS COPIÉS / ADAPTÉS
# - [liste des fichiers copiés avec changements Supabase→Firebase]
#
# ## 5. BUGS CORRIGÉS
# - [liste]
#
# ## 6. BUGS RESTANTS (si applicable)
# - [liste]
#
# ## 7. BUILD
# - Résultat : ✅/❌
# - Erreurs corrigées : [liste]
#
# ## 8. TESTS
# - Visitor : ✅/❌
# - User : ✅/❌
# - VIP : ✅/❌
# - Partner : ✅/❌
# - Admin login : ✅/❌
# - Admin pages : ✅/❌
#
# ## 9. COMMIT
# - Hash : [hash]
# - Tag : v5.19-backoffice-complet
# ```
