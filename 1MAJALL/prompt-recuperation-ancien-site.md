# ════════════════════════════════════════════════════════
# PROMPT CLAUDE CODE — NOUVELLE APPROCHE
# RÉCUPÉRER L'ANCIEN SITE QUI MARCHAIT → L'ADAPTER À FIREBASE
# Dossier projet : C:\data-mc-2030\97import
# ════════════════════════════════════════════════════════
#
# ⚠️ CONTEXTE IMPORTANT :
# Le nouveau site Firebase (localhost:5173) a beaucoup de bugs :
#   - PDFs avec mauvais format de prix, texte corrompu
#   - Pages produit incohérentes entre catégories
#   - Boutons manquants ou qui pointent vers WhatsApp
#
# L'ANCIEN SITE (97import.com sur Vercel/Supabase) fonctionne BIEN.
# Son code source est sauvegardé en local dans 2 répertoires.
#
# STRATÉGIE : NE PAS recoder de zéro.
# → Scanner l'ancien code source
# → Extraire les templates PDF, les pages produit, la mise en page
# → Les adapter au nouveau projet Firebase
#
# ════════════════════════════════════════════════════════

## RÈGLE OBLIGATOIRE — À exécuter EN PREMIER
```powershell
git fetch origin && git reset --hard origin/main
git tag backup-migration-ancien-$(Get-Date -Format "yyyyMMdd-HHmm")
git push origin --tags
git log --oneline -3
```

# ══════════════════════════════════════════════════════
# PHASE A — SCANNER L'ANCIEN CODE SOURCE (LECTURE SEULE)
# ══════════════════════════════════════════════════════
#
# NE RIEN MODIFIER. Juste LIRE et COMPRENDRE.
# Les 2 répertoires à scanner :
#
#   1. C:\DATA-MC-2030\97IMPORT\97import2026_siteweb
#   2. C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL
#

## ÉTAPE 1 — Lister la structure des 2 répertoires

```powershell
Write-Host "════════════════════════════════════════"
Write-Host "RÉPERTOIRE 1 : 97import2026_siteweb"
Write-Host "════════════════════════════════════════"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\97import2026_siteweb" -Recurse -Depth 3 | Where-Object { $_.Extension -match "\.(tsx|ts|js|jsx|css|json)$" -or $_.PSIsContainer } | ForEach-Object {
  $indent = "  " * ($_.FullName.Split("\").Count - "C:\DATA-MC-2030\97IMPORT\97import2026_siteweb".Split("\").Count)
  $icon = if ($_.PSIsContainer) { "📁" } else { "📄" }
  Write-Host "$indent$icon $($_.Name)"
}

Write-Host "`n════════════════════════════════════════"
Write-Host "RÉPERTOIRE 2 : MIGRATION_PACKAGE_FINAL"
Write-Host "════════════════════════════════════════"
Get-ChildItem -Path "C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL" -Recurse -Depth 3 | Where-Object { $_.Extension -match "\.(tsx|ts|js|jsx|css|json)$" -or $_.PSIsContainer } | ForEach-Object {
  $indent = "  " * ($_.FullName.Split("\").Count - "C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL".Split("\").Count)
  $icon = if ($_.PSIsContainer) { "📁" } else { "📄" }
  Write-Host "$indent$icon $($_.Name)"
}
```

## ÉTAPE 2 — Trouver les fichiers PDF templates de l'ancien site

```powershell
Write-Host "`n════════════════════════════════════════"
Write-Host "FICHIERS PDF TEMPLATES (ancien site)"
Write-Host "════════════════════════════════════════"

# Chercher dans les 2 répertoires
$paths = @(
  "C:\DATA-MC-2030\97IMPORT\97import2026_siteweb",
  "C:\DATA-MC-2030\97IMPORT\MIGRATION_PACKAGE_FINAL"
)

foreach ($basePath in $paths) {
  Write-Host "`n--- $basePath ---"
  
  # Fichiers PDF/devis/facture
  Get-ChildItem -Path $basePath -Recurse -Include "*.ts","*.tsx","*.js" | Select-String -Pattern "jsPDF|jspdf|autoTable|generateQuote|generateInvoice|generateDevis|generateFacture|quote-pdf|invoice-pdf|commission-pdf|delivery-pdf|maritime-pdf|customs-pdf" | Select-Object Path, LineNumber -Unique | ForEach-Object {
    $rel = $_.Path.Replace($basePath, "")
    Write-Host "  📄 $rel (ligne $($_.LineNumber))"
  }
}
```

## ÉTAPE 3 — Trouver les pages produit de l'ancien site

```powershell
Write-Host "`n════════════════════════════════════════"
Write-Host "PAGES PRODUIT (ancien site)"
Write-Host "════════════════════════════════════════"

foreach ($basePath in $paths) {
  Write-Host "`n--- $basePath ---"
  
  # Pages produit, maison, accessoires, solaire
  Get-ChildItem -Path $basePath -Recurse -Include "*.tsx","*.jsx" | Select-String -Pattern "ProductPage|ProductDetail|MaisonPage|CampingCar|MiniPelle|SolairePage|AccessoirePage|Ajouter au panier|addToCart|Générer Devis|Fiche technique" | Select-Object Path -Unique | ForEach-Object {
    $rel = $_.Path.Replace($basePath, "")
    Write-Host "  📄 $rel"
  }
}
```

## ÉTAPE 4 — Lire le contenu des fichiers PDF trouvés

```powershell
Write-Host "`n════════════════════════════════════════"
Write-Host "CONTENU DES TEMPLATES PDF"
Write-Host "════════════════════════════════════════"

# Lire chaque fichier PDF template trouvé à l'étape 2
# Afficher le contenu COMPLET de chaque fichier
# C'est ESSENTIEL pour comprendre le format exact

# Exemple (adapter les chemins selon ce qui a été trouvé) :
foreach ($basePath in $paths) {
  $pdfFiles = Get-ChildItem -Path $basePath -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.Name -match "pdf|devis|facture|invoice|quote|commission" }
  
  foreach ($file in $pdfFiles) {
    Write-Host "`n═══ $($file.Name) ═══"
    Write-Host "Chemin: $($file.FullName)"
    Write-Host "─────────────────────────"
    type $file.FullName
    Write-Host "─────────────────────────"
  }
}
```

## ÉTAPE 5 — Lire les pages produit clés

```powershell
Write-Host "`n════════════════════════════════════════"
Write-Host "CONTENU DES PAGES PRODUIT"
Write-Host "════════════════════════════════════════"

# Chercher les fichiers de page produit/maison/catalogue
foreach ($basePath in $paths) {
  $pageFiles = Get-ChildItem -Path $basePath -Recurse -Include "*.tsx","*.jsx" | Where-Object { $_.Name -match "Product|Maison|Camping|MiniPelle|Solaire|Accessoire|Catalogue" }
  
  foreach ($file in $pageFiles) {
    $size = (Get-Content $file.FullName | Measure-Object -Line).Lines
    Write-Host "`n═══ $($file.Name) ($size lignes) ═══"
    Write-Host "Chemin: $($file.FullName)"
    
    if ($size -le 200) {
      type $file.FullName
    } else {
      Write-Host "(Fichier long — affichage des 50 premières lignes)"
      Get-Content $file.FullName -Head 50
      Write-Host "..."
      Write-Host "(+ les imports et les fonctions clés)"
      Get-Content $file.FullName | Select-String -Pattern "import |export |function |const.*=.*\(|return \(" | Select-Object -First 30
    }
  }
}
```

# ══════════════════════════════════════════════════════
# PHASE B — PRODUIRE LE RAPPORT D'ANALYSE
# ══════════════════════════════════════════════════════
#
# APRÈS avoir lu tous les fichiers, produire ce rapport :

```
RAPPORT D'ANALYSE DE L'ANCIEN SITE
═══════════════════════════════════

1. TEMPLATES PDF TROUVÉS :
   - [ ] quote-pdf.ts → chemin: ___
   - [ ] invoice-pdf.ts → chemin: ___
   - [ ] commission-pdf.ts → chemin: ___
   - [ ] delivery-pdf.ts → chemin: ___
   - [ ] maritime-pdf.ts → chemin: ___
   - [ ] customs-pdf.ts → chemin: ___
   
   Librairie utilisée : jsPDF / autre ?
   Import autoTable : comment ?
   Format prix : quelle fonction ?
   Logo : comment est-il embarqué ?
   Couleurs : quelles constantes ?

2. PAGES PRODUIT TROUVÉES :
   - [ ] Fiche mini-pelle → chemin: ___
   - [ ] Fiche maison → chemin: ___
   - [ ] Fiche camping-car → chemin: ___
   - [ ] Fiche kit solaire → chemin: ___
   - [ ] Fiche accessoire → chemin: ___
   - [ ] Page catalogue → chemin: ___
   
   Boutons présents : lesquels ?
   Handler "Générer Devis PDF" : quelle fonction ?
   Handler "Ajouter au panier" : quelle fonction ?

3. CE QUI FONCTIONNE DANS L'ANCIEN ET QU'ON DOIT GARDER :
   - ___
   - ___

4. CE QUI UTILISE SUPABASE ET QU'ON DOIT ADAPTER À FIREBASE :
   - ___
   - ___

5. FICHIERS À COPIER DIRECTEMENT (pas de modif nécessaire) :
   - ___

6. FICHIERS À ADAPTER (Supabase → Firebase) :
   - ___
```

# ══════════════════════════════════════════════════════
# PHASE C — COPIER ET ADAPTER
# ══════════════════════════════════════════════════════
#
# UNIQUEMENT APRÈS avoir produit le rapport ci-dessus.
# Pour chaque fichier identifié :

## ÉTAPE 6 — Copier les templates PDF de l'ancien site

Pour chaque template PDF trouvé dans l'ancien code :

1. COPIER le fichier tel quel dans le nouveau projet
   (dans `src/features/pdf/templates/`)
2. Remplacer UNIQUEMENT les appels Supabase :
   - `supabase.from('products')` → `getDocs(collection(db, 'products'))`
   - `supabase.from('quotes')` → `addDoc(collection(db, 'quotes'), ...)`
   - etc.
3. NE PAS changer les couleurs, les positions, les tailles, le format
4. NE PAS changer la fonction de formatage des prix
5. NE PAS changer le layout du PDF

Si l'ancien code utilise un format de prix qui marche (pas de slash),
le GARDER tel quel.

## ÉTAPE 7 — Copier les pages produit de l'ancien site

Pour chaque page produit (mini-pelle, maison, camping-car, etc.) :

1. COMPARER l'ancien composant avec le nouveau
2. Si l'ancien est MIEUX (boutons corrects, layout correct) → LE COPIER
3. Adapter uniquement :
   - Imports Supabase → Firebase
   - `useSupabase()` → `db` de firebase.ts
   - Routes/navigation si changées
4. GARDER les boutons, le layout, les styles

## ÉTAPE 8 — Corriger la numérotation

La numérotation dans le NOUVEAU code doit être :
  D2604001 = D + année(26) + mois(04) + séquence(001)

Réécrire `src/lib/devisNumber.ts` avec la formule :
```typescript
export async function getNextDocNumber(
  prefix: string,
  partenaireCode?: string,
): Promise<string> {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const counterKey = `${prefix}_${yy}${mm}`
  const counterRef = doc(db, 'counters', counterKey)

  const newNum = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef)
    const current = snap.exists() ? snap.data().value : 0
    t.set(counterRef, { value: current + 1 })
    return current + 1
  })

  const base = `${prefix}${yy}${mm}${String(newNum).padStart(3, '0')}`
  return partenaireCode ? `${base}-${partenaireCode}` : base
}
```

## ÉTAPE 9 — Corriger les bugs PDF restants

Après copie des anciens templates, vérifier et corriger :

1. **Format prix** — Si le slash `/` apparaît encore :
   Le problème vient de `Intl.NumberFormat` qui utilise un
   narrow no-break space (U+202F) que jsPDF affiche comme `/`.
   SOLUTION : remplacer dans la fonction fmtEur :
   ```typescript
   function fmtEur(n: number): string {
     const parts = n.toFixed(2).split('.')
     const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
     return `${int},${parts[1]} €`
   }
   ```

2. **"Conditions de règlementÀ réception"** — texte collé :
   Il manque le séparateur " : " entre le label et la valeur.
   Le label bold doit se terminer par " : "
   puis la valeur en normal commence.
   ```typescript
   // MAUVAIS :
   doc.text('Conditions de règlement', x, y)      // bold
   doc.text('À réception', x + largeurLabel, y)    // normal
   // largeurLabel est trop court → les textes se chevauchent
   
   // CORRECT :
   doc.setFont('helvetica', 'bold')
   const label = 'Conditions de règlement : '
   doc.text(label, x, y)
   const labelW = doc.getTextWidth(label)
   doc.setFont('helvetica', 'normal')
   doc.text('À réception', x + labelW, y)
   ```

3. **"Acceptation" corrompu** — "Acceiptation" :
   Vérifier que le texte est écrit UNE SEULE FOIS.
   Si le code écrit "Acceptation" puis "Conditions" par-dessus
   au même Y, les caractères se mélangent.
   Les 2 sections doivent être côte à côte (gauche/droite)
   OU l'une au-dessus de l'autre avec suffisamment d'espace.

4. **Adresse client manquante** :
   Le PDF doit afficher l'adresse complète du client.
   Vérifier que le handler passe TOUS les champs :
   ```typescript
   client_adresse: profile.adresse_facturation || '',
   client_ville: profile.ville_facturation || '',
   client_cp: profile.cp_facturation || '',
   ```
   Et que le template PDF les affiche.

## ÉTAPE 10 — Build + Test + Commit

```powershell
npm run build
```

Corriger TOUTES les erreurs TypeScript.

```powershell
npm run dev
```

TESTS :
1. /produit/r18-pro → 4 boutons + "Générer Devis PDF" télécharge un PDF correct
2. /maisons/standard → MÊMES boutons que mini-pelle
3. /maisons/camping-car-deluxe → MÊMES boutons
4. /cart → "Demander un devis" → pop-up partenaire → PDF
5. PDF généré → prix "24 300,00 €" (sans slash)
6. PDF → "Conditions de règlement : À réception" (avec espace)
7. PDF → "Acceptation du client" lisible (pas corrompu)
8. PDF → adresse client complète (rue + CP + ville)
9. PDF → numéro D2604XXX

```powershell
git add -A
git commit -m "refactor: récupération templates PDF et pages produit de l'ancien site + adaptation Firebase"
git push origin main
git tag v5.18-migration-ancien-site
git push origin --tags
```

# RAPPORT FINAL OBLIGATOIRE :
```
PHASE A — SCAN ANCIEN SITE :
  Répertoire 1 (97import2026_siteweb) : [nb fichiers trouvés]
  Répertoire 2 (MIGRATION_PACKAGE_FINAL) : [nb fichiers trouvés]
  Templates PDF trouvés : [liste]
  Pages produit trouvées : [liste]

PHASE B — FICHIERS COPIÉS :
  - [ ] quote-pdf.ts ← ancien chemin
  - [ ] invoice-pdf.ts ← ancien chemin
  - [ ] [pages produit copiées]

PHASE C — ADAPTATIONS :
  - [ ] Supabase → Firebase (nb remplacements)
  - [ ] Numérotation D2604XXX
  - [ ] Format prix corrigé (slash supprimé)
  - [ ] Sections Conditions/Acceptation corrigées
  - [ ] Adresse client complète dans le PDF

BUILD : ✅/❌
TESTS : ✅/❌ (détail de chaque test)
COMMIT : [hash]
TAG : v5.18-migration-ancien-site
```
