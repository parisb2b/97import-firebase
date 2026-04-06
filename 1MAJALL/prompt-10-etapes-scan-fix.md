# ════════════════════════════════════════════════════════
# PROMPT CLAUDE CODE — 10 ÉTAPES : SCAN + CORRECTIONS COMPLÈTES
# Dossier : C:\data-mc-2030\97import
# ════════════════════════════════════════════════════════
#
# CONTEXTE : Après migration Firebase, plusieurs pages sont cassées
# ou incohérentes. Ce prompt scanne d'abord le site tel qu'il est,
# puis corrige TOUT en une seule passe.
#
# ════════════════════════════════════════════════════════

## RÈGLE OBLIGATOIRE — À exécuter EN PREMIER
```powershell
git fetch origin && git reset --hard origin/main
git tag backup-scan-fix-$(Get-Date -Format "yyyyMMdd-HHmm")
git push origin --tags
git log --oneline -3
```

# ══════════════════════════════════════════════════════
# ÉTAPE 1 — SCANNER LA STRUCTURE DU SITE
# ══════════════════════════════════════════════════════
#
# OBJECTIF : Comprendre comment le site est organisé ACTUELLEMENT
# avant de toucher quoi que ce soit.
#
# Lister TOUS les fichiers de pages et composants :

```powershell
Write-Host "═══ STRUCTURE PAGES ═══"
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src\pages" | ForEach-Object {
  $rel = $_.FullName.Replace((Get-Location).Path + "\src\pages\", "")
  Write-Host "  📄 $rel"
}

Write-Host "`n═══ STRUCTURE FEATURES ═══"
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src\features" | ForEach-Object {
  $rel = $_.FullName.Replace((Get-Location).Path + "\src\features\", "")
  Write-Host "  📄 $rel"
}

Write-Host "`n═══ STRUCTURE COMPONENTS ═══"
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src\components" | ForEach-Object {
  $rel = $_.FullName.Replace((Get-Location).Path + "\src\components\", "")
  Write-Host "  📄 $rel"
}

Write-Host "`n═══ ROUTES / ROUTER ═══"
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "Route|path.*=|<Route|useRoute" | Select-Object -First 30

Write-Host "`n═══ FICHIER PRINCIPAL APP ═══"
type "src\App.tsx" 2>$null
```

# Afficher un RÉSUMÉ de ce qui a été trouvé :
# - Liste des routes (/, /catalogue, /produit/:slug, /maisons, /cart, etc.)
# - Quel composant gère chaque route
# - Où sont les boutons "Ajouter au panier" et "Demander un devis"


# ══════════════════════════════════════════════════════
# ÉTAPE 2 — SCANNER LES BOUTONS D'ACTION SUR CHAQUE PAGE PRODUIT
# ══════════════════════════════════════════════════════
#
# OBJECTIF : Identifier pourquoi /maisons n'a pas les mêmes boutons
# que /produit/r18-pro
#

```powershell
Write-Host "═══ BOUTONS DEVIS ═══"
Get-ChildItem -Recurse -Include "*.tsx" -Path "src" | Select-String -Pattern "Demander un devis|Générer Devis|devis.*PDF|whatsapp|wa\.me|handleDevis|generateQuote" | Select-Object Path, LineNumber, Line

Write-Host "`n═══ BOUTONS PANIER ═══"
Get-ChildItem -Recurse -Include "*.tsx" -Path "src" | Select-String -Pattern "Ajouter au panier|addToCart|handleAddCart" | Select-Object Path, LineNumber, Line

Write-Host "`n═══ LIENS WHATSAPP ═══"
Get-ChildItem -Recurse -Include "*.tsx" -Path "src" | Select-String -Pattern "whatsapp|wa\.me|WhatsApp" | Select-Object Path, LineNumber, Line
```

# RÉSULTAT ATTENDU :
# Un tableau montrant pour chaque page :
# | Page             | Ajouter panier | Générer Devis PDF | WhatsApp | Demander devis |
# |------------------|----------------|-------------------|----------|----------------|
# | /produit/:slug   | ✅             | ✅                | ✅       | ❌             |
# | /maisons/:type   | ❌             | ❌                | ✅       | ✅ → WhatsApp! |
# | /cart             | —              | —                 | ❌       | ✅             |


# ══════════════════════════════════════════════════════
# ÉTAPE 3 — UNIFORMISER LES BOUTONS SUR TOUTES LES PAGES PRODUIT
# ══════════════════════════════════════════════════════
#
# RÈGLE : TOUTES les pages produit (mini-pelles, maisons, kits solaires,
# accessoires) DOIVENT avoir les MÊMES 4 boutons dans le MÊME ORDRE :
#
#   1. [🛒 Ajouter au panier]      — bleu foncé #1E3A5F
#   2. [📄 Générer Devis PDF]      — orange #EA580C
#   3. [📋 Fiche technique PDF ↗]  — blanc bordure grise
#   4. [💬 Contacter via WhatsApp] — vert #16A34A
#
# Le bouton "Générer Devis PDF" :
#   - Génère directement un devis PDF pour CE produit uniquement
#   - Utilise generateQuotePDF() de quote-pdf.ts
#   - N'envoie PAS vers WhatsApp
#   - Utilise le prix selon le rôle (user = prix_achat × 2)
#
# Le bouton "Demander un devis" dans /cart (page panier) :
#   - Génère un devis pour TOUS les produits du panier
#   - Ouvre la pop-up partenaire [TD][JM][MC][Sans]
#   - Sauvegarde dans Firestore collection quotes
#
# ACTIONS :
# 1. Trouver le composant qui affiche les boutons sur /produit/:slug
#    (c'est le modèle correct)
# 2. Trouver le composant qui affiche les boutons sur /maisons
# 3. Remplacer les boutons de /maisons par les MÊMES que /produit/:slug
# 4. Faire pareil pour /kits-solaires et /accessoires si différent
# 5. SUPPRIMER tout lien whatsapp "wa.me" des boutons "Demander un devis"
#    (WhatsApp reste UNIQUEMENT dans le bouton "Contacter via WhatsApp")


# ══════════════════════════════════════════════════════
# ÉTAPE 4 — CORRIGER LE FORMAT DES PRIX DANS LE PDF
# ══════════════════════════════════════════════════════
#
# BUG : Le prix s'affiche "24 /300,00 €" avec un SLASH parasite
# au lieu de "24 300,00 €"
#
# CAUSE PROBABLE : La fonction fmtEur() ou le séparateur de milliers
# utilise un caractère non-breaking space ou narrow no-break space
# qui est mal rendu par jsPDF.
#

```powershell
# Trouver toutes les fonctions de formatage de prix
Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "src" | Select-String -Pattern "fmtEur|formatPrix|formatEur|Intl\.NumberFormat|toLocaleString.*EUR" | Select-Object Path, LineNumber, Line
```

# CORRECTION : Remplacer dans TOUTES les fonctions de formatage :
#
# ```typescript
# function fmtEur(n: number): string {
#   // Formater avec espaces normaux (pas narrow no-break space)
#   const parts = n.toFixed(2).split('.')
#   const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  // espace normal U+0020
#   return `${intPart},${parts[1]} €`
# }
# ```
#
# OU si on utilise Intl.NumberFormat :
# ```typescript
# function fmtEur(n: number): string {
#   const formatted = new Intl.NumberFormat('fr-FR', {
#     minimumFractionDigits: 2,
#     maximumFractionDigits: 2,
#   }).format(n)
#   // Remplacer narrow no-break space (U+202F) et no-break space (U+00A0)
#   // par un espace normal (U+0020)
#   return formatted.replace(/[\u00A0\u202F]/g, ' ') + ' €'
#   // Note : Intl.NumberFormat en fr-FR ajoute déjà €, vérifier
# }
# ```
#
# APPLIQUER cette correction dans :
# - pdf-engine.ts (fmtEur)
# - quote-pdf.ts (si fonction locale)
# - invoice-pdf.ts (si fonction locale)
# - Tout autre fichier qui formate des prix pour les PDFs


# ══════════════════════════════════════════════════════
# ÉTAPE 5 — CORRIGER LA SECTION "ACCEPTATION / CONDITIONS" DU PDF
# ══════════════════════════════════════════════════════
#
# BUG 1 : "Acceptation du client" s'affiche "Acceiptation du client"
#   → Le titre est corrompu, probablement des caractères superposés
#
# BUG 2 : "Conditions" et "Acceptation" sont fusionnées
#   → "Conditions de règlement" apparaît DANS le bloc "Acceptation"
#   → Elles doivent être 2 sections SÉPARÉES
#
# LAYOUT CORRECT (copié de D2600022.pdf de référence) :
#
#   ┌─────────────────────────────────────────────────┐
#   │ Conditions                    ← titre rose      │
#   │                                                  │
#   │ Conditions de règlement : À réception            │
#   │ Mode de règlement : Virement bancaire            │
#   │                                                  │
#   │                                                  │
#   │ Acceptation du client         ← titre rose       │
#   │                                                  │
#   │                  À ____________, le ___/___/___   │
#   │                                                  │
#   │                  Signature                        │
#   │                                                  │
#   │                  Nom et qualité du signataire     │
#   └─────────────────────────────────────────────────┘
#
# "Conditions" est une section à GAUCHE
# "Acceptation" démarre APRÈS ou à DROITE avec la date et signature
#
# ACTIONS :
# 1. Dans pdf-engine.ts : vérifier addConditions() et addSignature()
# 2. Le titre "Acceptation du client" doit être UNE SEULE fois,
#    en texte propre, police helvetica normal, couleur rose #C87F6B
# 3. Les "Conditions" (règlement + mode) sont une section AVANT
# 4. La date/signature est alignée à DROITE, pas à gauche
# 5. Reproduire EXACTEMENT le layout de D2600022.pdf page 3


# ══════════════════════════════════════════════════════
# ÉTAPE 6 — NOUVELLE NUMÉROTATION DES DOCUMENTS
# ══════════════════════════════════════════════════════
#
# ANCIENNE FORMULE : D + AA + 00001     → D2600001
# NOUVELLE FORMULE : D + AA + MM + 001  → D2604001
#
# Explication :
#   D    = Type document (D=Devis, F=Facture, FA=Facture acompte, etc.)
#   26   = Année 2026
#   04   = Mois d'avril
#   001  = N° séquentiel du mois (repart à 001 chaque mois)
#
# TOUS les types de documents :
#   D2604001   → Devis n°1 d'avril 2026
#   D2604001-MC → Devis n°1 d'avril 2026 avec partenaire MC
#   F2604001   → Facture n°1 d'avril 2026
#   FA2604001  → Facture d'acompte n°1 d'avril 2026
#   NC2604001  → Note de commission n°1 d'avril 2026
#   FM2604001  → Frais maritimes n°1 d'avril 2026
#   DD2604001  → Dédouanement n°1 d'avril 2026
#   BL2604001  → Bon de livraison n°1 d'avril 2026
#

```powershell
# Trouver la fonction de numérotation actuelle
Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "src" | Select-String -Pattern "getNextDevisNumber|getNextNumber|devis.*Number|counter.*devis|D\d{2}\d{5}|numero_devis" | Select-Object Path, LineNumber, Line
```

# RÉÉCRIRE la fonction de numérotation dans src/lib/devisNumber.ts :
#
# ```typescript
# import { doc, runTransaction } from 'firebase/firestore'
# import { db } from './firebase'
#
# /**
#  * Génère le prochain numéro de document
#  * Format : PREFIX + AA + MM + NNN
#  * Exemple : D2604001, F2604002, FA2604001
#  *
#  * Le compteur est par mois : il repart à 001 chaque nouveau mois.
#  * Collection Firestore : counters/{prefix}_{AAMM}
#  */
# export async function getNextDocNumber(
#   prefix: string,              // 'D', 'F', 'FA', 'NC', 'FM', 'DD', 'BL'
#   partenaireCode?: string,     // 'MC', 'TD', 'JM' ou undefined
# ): Promise<string> {
#   const now = new Date()
#   const yy = now.getFullYear().toString().slice(2)  // "26"
#   const mm = String(now.getMonth() + 1).padStart(2, '0')  // "04"
#   const counterKey = `${prefix}_${yy}${mm}`  // ex: "D_2604"
#
#   const counterRef = doc(db, 'counters', counterKey)
#
#   const newNum = await runTransaction(db, async (transaction) => {
#     const snap = await transaction.get(counterRef)
#     const current = snap.exists() ? snap.data().value : 0
#     const next = current + 1
#     transaction.set(counterRef, { value: next })
#     return next
#   })
#
#   // Format : D2604001
#   const base = `${prefix}${yy}${mm}${String(newNum).padStart(3, '0')}`
#
#   // Ajouter code partenaire si présent : D2604001-MC
#   return partenaireCode ? `${base}-${partenaireCode}` : base
# }
#
# // Raccourcis
# export const getNextDevisNumber = (code?: string) => getNextDocNumber('D', code)
# export const getNextFactureNumber = () => getNextDocNumber('F')
# export const getNextFactureAcompteNumber = () => getNextDocNumber('FA')
# export const getNextCommissionNumber = () => getNextDocNumber('NC')
# export const getNextMaritimeNumber = () => getNextDocNumber('FM')
# export const getNextDouaneNumber = () => getNextDocNumber('DD')
# export const getNextBLNumber = () => getNextDocNumber('BL')
# ```
#
# Mettre à jour TOUS les appels existants pour utiliser cette nouvelle fonction.
# Chercher et remplacer partout :
# ```powershell
# Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "src" | Select-String -Pattern "getNextDevisNumber|getNextNumber" | Select-Object Path, LineNumber
# ```


# ══════════════════════════════════════════════════════
# ÉTAPE 7 — SCANNER LE SITE EN PRODUCTION POUR COMPARAISON
# ══════════════════════════════════════════════════════
#
# Le site en production https://97import.com a la BONNE structure.
# Après migration Firebase, le localhost:5173 doit reproduire
# la MÊME organisation :
#
# NAVIGATION DU SITE (extraite de 97import.com) :
#   Mini-pelles       → /mini-pelles (liste) → /produit/:slug (fiche)
#   Maisons modulaires → /maisons (liste) → /maisons/:type (fiche)
#   Kits solaires      → /kits-solaires (liste)
#   Accessoires        → /accessoires (liste)
#   Catalogue          → /catalogue (tous les produits)
#   Contact            → /contact
#
# Vérifier que CHAQUE route existe dans le router local
# et que les composants sont les bons.

```powershell
# Vérifier le router
Get-ChildItem -Recurse -Include "*.tsx" -Path "src" | Select-String -Pattern "path.*mini-pelle|path.*maison|path.*solaire|path.*accessoire|path.*catalogue|path.*contact|path.*cart|path.*produit" | Select-Object Path, LineNumber, Line
```


# ══════════════════════════════════════════════════════
# ÉTAPE 8 — CORRIGER LA PAGE /ACCESSOIRES
# ══════════════════════════════════════════════════════
#
# D'après les captures, la page /accessoires ne ressemble pas
# au site en production. Vérifier :
#
# 1. La page existe-t-elle dans le router ?
# 2. Les produits de catégorie "accessoires" s'affichent-ils ?
# 3. Les images sont-elles correctes ?
# 4. Les boutons "Voir la fiche →" fonctionnent-ils ?
#
# La page /accessoires doit afficher les produits Firestore
# WHERE categorie == 'accessoires' avec le même layout
# que la page /catalogue mais filtré.


# ══════════════════════════════════════════════════════
# ÉTAPE 9 — VÉRIFIER LE BOUTON "GÉNÉRER DEVIS PDF" DEPUIS LA FICHE PRODUIT
# ══════════════════════════════════════════════════════
#
# Le bouton orange "Générer Devis PDF" sur la fiche produit doit :
#
# 1. Récupérer le profil du user connecté (Firestore profiles)
# 2. Si user non connecté → toast "Connectez-vous pour générer un devis"
# 3. Calculer le prix selon le rôle (user = prix_achat × 2)
# 4. Générer le numéro de devis via getNextDevisNumber()
# 5. Créer le PDF via generateQuotePDF() avec les données du produit
# 6. Sauvegarder dans Firestore collection quotes
# 7. Upload PDF dans Firebase Storage
# 8. Téléchargement automatique du PDF
# 9. Toast "Devis {numero} généré !"
#
# Le handler doit être dans le composant de fiche produit.
# Vérifier qu'il utilise bien les fonctions de pdf-engine.ts
# et quote-pdf.ts.
#
# Si le bouton "Générer Devis PDF" n'existe PAS sur les pages
# /maisons et /accessoires, L'AJOUTER avec le même handler.


# ══════════════════════════════════════════════════════
# ÉTAPE 10 — BUILD + TEST + COMMIT
# ══════════════════════════════════════════════════════

```powershell
npm run build
```

# Si erreurs TypeScript → corriger une par une.

```powershell
npm run dev
```

# TESTS MANUELS À EFFECTUER (localhost:5173) :
#
# TEST 1 — Page mini-pelle /produit/r18-pro :
#   ✅ 4 boutons visibles dans l'ordre correct
#   ✅ "Générer Devis PDF" → télécharge un PDF
#   ✅ PDF avec prix "19 076,00 €" (pas de slash)
#   ✅ Logo LUXENT visible
#   ✅ Section Conditions SÉPARÉE de Acceptation
#   ✅ Numéro format D2604XXX
#
# TEST 2 — Page maison /maisons/standard :
#   ✅ Bouton "Ajouter au panier" visible
#   ✅ Bouton "Générer Devis PDF" visible (pas WhatsApp)
#   ✅ "Demander un devis" dans le bloc total → même comportement
#
# TEST 3 — Page panier /cart :
#   ✅ "Demander un devis" → pop-up partenaire → PDF
#   ✅ Numéro format D2604XXX-MC (si partenaire MC)
#
# TEST 4 — PDF généré :
#   ✅ Prix formatés sans slash : "24 300,00 €"
#   ✅ "Acceptation du client" affiché correctement (pas "Acceiptation")
#   ✅ Conditions et Acceptation sont 2 blocs séparés
#   ✅ Logo LUXENT en haut à droite
#   ✅ Pied de page : numéro document + "Page 1 sur 1"

```powershell
git add -A
git commit -m "fix: scan complet + uniformisation boutons + prix PDF + numérotation AAMM + sections devis"
git push origin main
git tag v5.17-scan-fix-complet
git push origin --tags
```

# MAJALL.TXT :
```
DATE : [date]
TAG : v5.17-scan-fix-complet
TYPE : fix
DESCRIPTION :
  - Scan complet du site : routes, boutons, pages vérifiées
  - Boutons uniformisés sur toutes les pages produit (4 boutons identiques)
  - WhatsApp retiré du bouton "Demander un devis" (reste dans bouton dédié)
  - Prix PDF : slash parasite corrigé (narrow no-break space → espace normal)
  - Section Conditions + Acceptation : séparées correctement dans le PDF
  - Titre "Acceptation du client" : texte corrigé (plus de caractères corrompus)
  - Numérotation documents : D2604001 (année+mois+séquence mensuelle)
  - Compteurs Firestore par mois : counters/D_2604, counters/F_2604, etc.
  - Page /accessoires vérifiée et corrigée
  - Page /maisons : boutons alignés sur le modèle /produit/:slug
FICHIERS MODIFIÉS :
  - src/lib/devisNumber.ts (nouvelle formule AAMM)
  - src/features/pdf/lib/pdf-engine.ts (fmtEur corrigé)
  - src/features/pdf/templates/quote-pdf.ts (sections Conditions/Acceptation)
  - [pages produit modifiées pour boutons uniformes]
PUBLIÉ : 97import.com ✅
```

# RAPPORT FINAL OBLIGATOIRE :
```
SCAN ÉTAPE 1 — Structure pages : [nb fichiers]
SCAN ÉTAPE 2 — Boutons par page :
  /produit/:slug : Panier[✅/❌] DevisPDF[✅/❌] Fiche[✅/❌] WhatsApp[✅/❌]
  /maisons/:type : Panier[✅/❌] DevisPDF[✅/❌] Fiche[✅/❌] WhatsApp[✅/❌]
  /accessoires   : Panier[✅/❌] DevisPDF[✅/❌] Fiche[✅/❌] WhatsApp[✅/❌]
  /cart           : DemanderDevis[✅/❌]

CORRECTIONS :
- [ ] Boutons uniformisés sur /maisons
- [ ] WhatsApp retiré de "Demander un devis"
- [ ] fmtEur : slash corrigé
- [ ] "Acceptation du client" : texte propre
- [ ] Conditions / Acceptation : 2 sections séparées
- [ ] Numérotation D2604XXX
- [ ] getNextDocNumber() réécrit
- [ ] Page /accessoires vérifiée

BUILD : ✅/❌
TESTS : ✅/❌ (décrire chaque test)
COMMIT : [hash]
TAG : v5.17-scan-fix-complet
```
