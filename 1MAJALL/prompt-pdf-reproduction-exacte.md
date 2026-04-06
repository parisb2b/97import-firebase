# ════════════════════════════════════════════════════════
# PROMPT CLAUDE CODE — REPRODUCTION EXACTE DES PDFs DE PRODUCTION
# Dossier : C:\data-mc-2030\97import
# ════════════════════════════════════════════════════════
#
# ⚠️ OBJECTIF : Reproduire EXACTEMENT le design des PDFs existants
# dans C:\DATA-MC-2030\97IMPORT\PDF\
# Ces PDFs sont les MODÈLES DE RÉFÉRENCE DÉFINITIFS.
# Tout ce qui a été codé avant est OBSOLÈTE.
# SUPPRIMER et RÉÉCRIRE chaque fichier PDF template.
#
# MODÈLES DE RÉFÉRENCE (dans C:\DATA-MC-2030\97IMPORT\PDF\) :
#   D2600022.pdf → Devis (Quotation) — 3 pages
#   F2500039.pdf → Facture (Invoice) — 2 pages
#   F2600031.pdf → Facture — 2 pages
#   FA2600007.pdf → Facture d'acompte — 1 page
#   A2500001.pdf → Credit note (Avoir) — 1 page
#   luxent.JPG → Logo LUXENT LIMITED (globe doré + texte)
#
# ════════════════════════════════════════════════════════

## RÈGLE OBLIGATOIRE — À exécuter EN PREMIER
```powershell
git fetch origin && git reset --hard origin/main
git tag backup-pdf-reproduction-$(Get-Date -Format "yyyyMMdd-HHmm")
git push origin --tags
git log --oneline -3
```

## ÉTAPE 0 — OUVRIR ET LIRE LES PDFs DE RÉFÉRENCE

AVANT d'écrire une seule ligne de code, ouvrir et lire CHAQUE PDF
de référence dans C:\DATA-MC-2030\97IMPORT\PDF\ pour comprendre
la mise en page exacte.

```powershell
# Vérifier que les fichiers existent
Get-ChildItem "C:\DATA-MC-2030\97IMPORT\PDF\" | Select-Object Name, Length
```

# ════════════════════════════════════════════════════════
# CHARTE GRAPHIQUE EXACTE — EXTRAITE DES PDFs DE RÉFÉRENCE
# ════════════════════════════════════════════════════════
#
# Les PDFs de référence utilisent ce design EXACT :
#
# ┌─────────────────────────────────────────────────────────┐
# │                                                         │
# │  Quotation D2600022              [LOGO LUXENT LIMITED]  │
# │  March 18, 2026                  globe doré + texte     │
# │                                                         │
# │                                                         │
# │  From                            Invoice to             │
# │  ─────────────────                ─────────────────     │
# │  Company:  LUXENT LIMITED        Company:  JM PREST...  │
# │  Address:  2ND FLOOR...          Address:  Quartier...  │
# │  Country:  United Kingdom        Country:  Martinique   │
# │  Company number: 14852122        Email:    jmpresta...  │
# │  Email:    luxent@ltd-uk.eu                             │
# │                                                         │
# │  Account Name: LUXENT LIMITED                           │
# │  IBAN: DE76202208000059568830                           │
# │  SWIFT Code: SXPYDEHH                                  │
# │  Bank Name: Banking Circle S.A.                        │
# │  Country: Germany                                       │
# │  Bank Address: Maximilianstr. 54                        │
# │  City: Munich                                           │
# │  Postal Code: D-80538                                   │
# │                                                         │
# │  Details                                                │
# │  ┌──────┬──────────────┬────────┬────────┬───────────┐ │
# │  │ Type │ Description  │ Unit   │ Qty    │ Total     │ │
# │  │      │              │ price  │        │ excl. tax │ │
# │  ├──────┼──────────────┼────────┼────────┼───────────┤ │
# │  │Produit│ Nom produit │ X €    │ 1      │ X €       │ │
# │  └──────┴──────────────┴────────┴────────┴───────────┘ │
# │                                                         │
# │                        Reverse charge VAT / TVA non app │
# │                        Total       XX XXX,XX €          │
# │                                                         │
# │  Terms / Conditions                                     │
# │  Payment terms : À réception                            │
# │  Payment method : Virement bancaire                     │
# │                                                         │
# │                              Page X of/sur X            │
# └─────────────────────────────────────────────────────────┘
#
# COULEURS EXACTES :
#
#   TITRE DOCUMENT ("Facture F2600031") :
#     Couleur : Rose/saumon foncé (#C87F6B) — PAS bleu, PAS noir
#     Police : Helvetica Light / Fine, taille 28-30pt
#     Le titre est grand, léger, élégant
#
#   DATE sous le titre :
#     Couleur : Gris foncé (#4A4A4A)
#     Police : Helvetica Normal, taille 11pt
#
#   SOUS-TITRES "Émetteur" / "Destinataire" / "Détail" / "Conditions" :
#     Couleur : Rose/saumon (#C87F6B) — même couleur que le titre
#     Police : Helvetica Normal, taille 16pt
#
#   LABELS ("Société :", "Adresse :", "Pays :", etc.) :
#     Couleur : Gris moyen (#808080)
#     Police : Helvetica Normal, taille 9pt
#
#   VALEURS (nom société, adresse, etc.) :
#     Couleur : Noir (#000000)
#     Police : Helvetica Bold (pour noms société) ou Normal, taille 9pt
#
#   SECTION IBAN :
#     Couleur : Gris foncé (#4A4A4A)
#     Police : Helvetica Normal, taille 8pt
#     Position : sous le bloc Émetteur, avant "Détail"
#
#   TABLEAU — EN-TÊTES :
#     Fond : Rose très pâle (#FBF0ED) — SUBTIL, presque blanc rosé
#     Texte : Noir (#000000)
#     Bordure gauche des en-têtes : Fine ligne rose (#C87F6B)
#     Police : Helvetica Normal, taille 8-9pt
#
#   TABLEAU — LIGNES DONNÉES :
#     Fond : Blanc pur (#FFFFFF)
#     Texte : Noir (#000000)
#     Bordures : Gris très clair (#E5E5E5) — séparations horizontales fines
#     Police : Helvetica Normal, taille 8-9pt
#
#   TOTAL :
#     "Reverse charge VAT" ou "TVA non applicable..." :
#       Couleur : Gris (#808080), taille 8pt, aligné à droite
#     "Total" label :
#       Couleur : Noir (#000000), Helvetica Bold, taille 10pt
#     Montant total :
#       Couleur : Noir (#000000), Helvetica Normal, taille 10pt
#     PAS d'encadré arrondi — juste texte aligné à droite
#
#   SECTION CONDITIONS :
#     Titre "Conditions" : Rose/saumon (#C87F6B), taille 16pt
#     Labels "Conditions de règlement :" : Helvetica Bold, noir, 9pt
#     Valeurs : Helvetica Normal, noir, 9pt
#
#   SECTION SIGNATURE (devis uniquement) :
#     Titre "Customer acceptance" : Rose/saumon (#C87F6B)
#     Texte : "At _____, the __/__/__"
#     "Signature" + "Name and position of signatory"
#
#   PIED DE PAGE :
#     "Page X of/sur X" : Gris (#808080), taille 7pt, en bas à droite
#     Numéro document : En bas au centre, même style
#
#   LOGO :
#     Position : En haut à droite, aligné avec le titre
#     Fichier : luxent.JPG (globe doré + texte LUXENT LIMITED)
#     Taille : environ 45mm × 15mm
#     Le logo doit être embarqué en base64 dans le code
#
# CE QU'ON NE VEUT PLUS JAMAIS VOIR :
#   ❌ Fond bleu foncé dans les en-têtes du tableau
#   ❌ Texte blanc dans les en-têtes du tableau
#   ❌ Bordures noires épaisses
#   ❌ Fond gris pour les blocs émetteur/client
#   ❌ Encadré arrondi coloré pour le total
#   ❌ Couleur bleu marine (#1E3A5F) — c'est le site web, PAS les PDFs
#   ❌ "97import.com" en gros dans les PDFs — c'est LUXENT LIMITED
#   ❌ Titre "DEVIS" en majuscules bleues
#
# ════════════════════════════════════════════════════════


## ÉTAPE 1 — EMBARQUER LE LOGO EN BASE64

Le logo luxent.JPG est dans C:\DATA-MC-2030\97IMPORT\PDF\luxent.JPG
Il doit aussi être copié dans le projet :

```powershell
# Copier le logo dans le projet
Copy-Item "C:\DATA-MC-2030\97IMPORT\PDF\luxent.JPG" "C:\data-mc-2030\97import\src\assets\luxent.jpg" -Force

# Convertir en base64 pour l'embarquer dans le PDF
$bytes = [System.IO.File]::ReadAllBytes("C:\DATA-MC-2030\97IMPORT\PDF\luxent.JPG")
$base64 = [System.Convert]::ToBase64String($bytes)
Write-Output "data:image/jpeg;base64,$base64" | Out-File "C:\data-mc-2030\97import\src\features\pdf\lib\logo-base64.ts" -Encoding utf8
```

Puis créer le fichier `src/features/pdf/lib/logo-base64.ts` :
```typescript
// Logo LUXENT LIMITED en base64 — généré automatiquement
export const LUXENT_LOGO_BASE64 = 'data:image/jpeg;base64,...'
// ↑ Coller le contenu généré par la commande PowerShell ci-dessus
```


## ÉTAPE 2 — CRÉER LE MOTEUR PDF MUTUALISÉ

Créer `src/features/pdf/lib/pdf-engine.ts` :

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LUXENT_LOGO_BASE64 } from './logo-base64'

// ═══════════════════════════════════════════════════════
// COULEURS — EXTRAITES DES PDFs DE RÉFÉRENCE
// NE PAS MODIFIER
// ═══════════════════════════════════════════════════════
export const PDF_COLORS = {
  // Titre & sous-titres : rose/saumon
  title: [200, 127, 107] as [number, number, number],       // #C87F6B

  // Texte principal
  black: [0, 0, 0] as [number, number, number],
  darkGray: [74, 74, 74] as [number, number, number],       // #4A4A4A
  gray: [128, 128, 128] as [number, number, number],        // #808080
  lightGray: [229, 229, 229] as [number, number, number],   // #E5E5E5

  // Tableau
  headerBg: [251, 240, 237] as [number, number, number],    // #FBF0ED rose très pâle
  headerBorderLeft: [200, 127, 107] as [number, number, number], // #C87F6B
  white: [255, 255, 255] as [number, number, number],
}

// ═══════════════════════════════════════════════════════
// CONSTANTES MISE EN PAGE
// ═══════════════════════════════════════════════════════
export const PAGE = {
  marginL: 20,
  marginR: 190,    // 210 - 20
  width: 210,
  height: 297,
  contentWidth: 170, // marginR - marginL
}

// ═══════════════════════════════════════════════════════
// FORMATAGE
// ═══════════════════════════════════════════════════════
export function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + ' €'
}

export function fmtEurEN(n: number): string {
  return '€' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

// ═══════════════════════════════════════════════════════
// CRÉER UN DOCUMENT A4
// ═══════════════════════════════════════════════════════
export function createDoc(): jsPDF {
  return new jsPDF('p', 'mm', 'a4')
}

// ═══════════════════════════════════════════════════════
// EN-TÊTE : Titre + Date + Logo
// ═══════════════════════════════════════════════════════
export function addHeader(
  doc: jsPDF,
  title: string,      // ex: "Facture F2600031" ou "Quotation D2600022"
  date: string,        // ex: "31 mars 2026" ou "March 18, 2026"
): number {
  // Logo en haut à droite
  try {
    doc.addImage(LUXENT_LOGO_BASE64, 'JPEG', 140, 12, 50, 16)
  } catch (e) {
    // Si le logo ne charge pas, mettre le texte
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...PDF_COLORS.gray)
    doc.text('LUXENT LIMITED', PAGE.marginR, 20, { align: 'right' })
  }

  // Titre du document
  doc.setFont('helvetica', 'normal')  // Light/thin — helvetica normal est le plus proche
  doc.setFontSize(28)
  doc.setTextColor(...PDF_COLORS.title)
  doc.text(title, PAGE.marginL, 30)

  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_COLORS.darkGray)
  doc.text(date, PAGE.marginL, 38)

  return 55 // Y après l'en-tête
}

// ═══════════════════════════════════════════════════════
// BLOC ÉMETTEUR / DESTINATAIRE
// Layout en 2 colonnes avec labels gris + valeurs noires
// ═══════════════════════════════════════════════════════
interface PartyInfo {
  // Émetteur
  emetteur: {
    societe: string
    contact?: string
    adresse: string
    adresse2?: string
    adresse3?: string
    pays: string
    numero_entreprise: string
    email: string
  }
  // Destinataire
  destinataire: {
    type: 'societe' | 'particulier'
    nom: string
    adresse?: string
    adresse2?: string
    pays?: string
    email?: string
    telephone?: string
  }
  // Langue
  lang?: 'fr' | 'en'
}

export function addParties(doc: jsPDF, info: PartyInfo, startY: number): number {
  const { emetteur: em, destinataire: dest, lang = 'fr' } = info
  const colL = PAGE.marginL
  const colR = 115
  const labelX = colL
  const valueX = colL + 38
  const labelXR = colR
  const valueXR = colR + 35
  let y = startY

  // ── Titre ÉMETTEUR ──
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(...PDF_COLORS.title)
  doc.text(lang === 'en' ? 'From' : 'Émetteur', colL, y)
  doc.text(lang === 'en' ? 'Invoice to' : 'Destinataire', colR, y)
  y += 10

  // ── Labels + Valeurs ÉMETTEUR ──
  const labelStyle = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...PDF_COLORS.gray)
  }
  const valueStyle = (bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...PDF_COLORS.black)
  }

  const addField = (label: string, value: string, x: number, vx: number, yPos: number, bold = false): number => {
    labelStyle()
    doc.text(label, x, yPos)
    valueStyle(bold)
    // Wrap long values
    const lines = doc.splitTextToSize(value, 55)
    doc.text(lines, vx, yPos)
    return yPos + (lines.length * 4.5)
  }

  let yL = y
  let yR = y

  // Émetteur gauche
  yL = addField(lang === 'en' ? 'Company :' : 'Société :', em.societe, labelX, valueX, yL, true)
  if (em.contact) {
    yL = addField(lang === 'en' ? 'Your contact :' : 'Votre contact :', em.contact, labelX, valueX, yL)
  }
  yL = addField(lang === 'en' ? 'Address :' : 'Adresse :', em.adresse, labelX, valueX, yL)
  if (em.adresse2) {
    valueStyle()
    doc.text(em.adresse2, valueX, yL)
    yL += 4.5
  }
  if (em.adresse3) {
    valueStyle()
    doc.text(em.adresse3, valueX, yL)
    yL += 4.5
  }
  yL = addField(lang === 'en' ? 'Country :' : 'Pays :', em.pays, labelX, valueX, yL)
  yL = addField(lang === 'en' ? 'Company number :' : "Numéro d'entreprise :", em.numero_entreprise, labelX, valueX, yL)
  yL = addField(lang === 'en' ? 'Email :' : 'Adresse email :', em.email, labelX, valueX, yL)

  // Destinataire droite
  if (dest.type === 'societe') {
    yR = addField(lang === 'en' ? 'Company :' : 'Société :', dest.nom, labelXR, valueXR, yR, true)
  } else {
    yR = addField(lang === 'en' ? 'Name :' : 'Nom :', dest.nom, labelXR, valueXR, yR, true)
  }
  if (dest.adresse) {
    yR = addField(lang === 'en' ? 'Address :' : 'Adresse :', dest.adresse, labelXR, valueXR, yR)
  }
  if (dest.adresse2) {
    valueStyle()
    doc.text(dest.adresse2, valueXR, yR)
    yR += 4.5
  }
  if (dest.pays) {
    yR = addField(lang === 'en' ? 'Country :' : 'Pays :', dest.pays, labelXR, valueXR, yR)
  }
  if (dest.email) {
    yR = addField(lang === 'en' ? 'Email :' : 'Adresse email :', dest.email, labelXR, valueXR, yR)
  }
  if (dest.telephone) {
    yR = addField(lang === 'en' ? 'Phone :' : 'Tél :', dest.telephone, labelXR, valueXR, yR)
  }

  return Math.max(yL, yR) + 5
}

// ═══════════════════════════════════════════════════════
// SECTION IBAN
// ═══════════════════════════════════════════════════════
export function addIBAN(doc: jsPDF, startY: number): number {
  let y = startY
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_COLORS.darkGray)

  const lines = [
    'Account Name: LUXENT LIMITED',
    'IBAN: DE76202208000059568830',
    'SWIFT Code: SXPYDEHH',
    'Bank Name: Banking Circle S.A.',
    'Country: Germany',
    'Bank Address: Maximilianstr. 54',
    'City: Munich',
    'Postal Code: D-80538',
  ]

  for (const line of lines) {
    doc.text(line, PAGE.marginL, y)
    y += 4
  }

  return y + 5
}

// ═══════════════════════════════════════════════════════
// TITRE DE SECTION ("Détail", "Conditions")
// ═══════════════════════════════════════════════════════
export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(...PDF_COLORS.title)
  doc.text(title, PAGE.marginL, y)
  return y + 8
}

// ═══════════════════════════════════════════════════════
// TABLEAU PRODUITS
// ═══════════════════════════════════════════════════════
interface TableColumn {
  header: string
  width: number
  align?: 'left' | 'center' | 'right'
}

export function addProductTable(
  doc: jsPDF,
  columns: TableColumn[],
  body: string[][],
  startY: number,
): number {
  autoTable(doc, {
    startY,
    head: [columns.map(c => c.header)],
    body,
    theme: 'plain',  // On gère les styles nous-mêmes
    margin: { left: PAGE.marginL, right: PAGE.width - PAGE.marginR },

    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: PDF_COLORS.black,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.2,
      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: PDF_COLORS.headerBg,     // Rose très pâle
      textColor: PDF_COLORS.black,         // Texte noir
      fontStyle: 'normal',                 // PAS bold
      fontSize: 8.5,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.2,
    },

    bodyStyles: {
      fillColor: PDF_COLORS.white,
      textColor: PDF_COLORS.black,
    },

    alternateRowStyles: {
      fillColor: PDF_COLORS.white,  // PAS d'alternance
    },

    columnStyles: Object.fromEntries(
      columns.map((c, i) => [
        i,
        {
          cellWidth: c.width,
          halign: (c.align || 'left') as 'left' | 'center' | 'right',
        },
      ])
    ),

    // Ligne rose à gauche des en-têtes
    didDrawCell: (data: any) => {
      if (data.section === 'head') {
        doc.setDrawColor(...PDF_COLORS.headerBorderLeft)
        doc.setLineWidth(1.5)
        doc.line(
          data.cell.x,
          data.cell.y,
          data.cell.x,
          data.cell.y + data.cell.height,
        )
      }
    },
  })

  return (doc as any).lastAutoTable?.finalY ?? startY + 40
}

// ═══════════════════════════════════════════════════════
// SECTION TOTAL
// ═══════════════════════════════════════════════════════
export function addTotal(
  doc: jsPDF,
  total: number,
  startY: number,
  tvaText?: string,
  lang: 'fr' | 'en' = 'fr',
): number {
  let y = startY + 8

  // TVA mention
  if (tvaText) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...PDF_COLORS.gray)
    doc.text(tvaText, PAGE.marginR, y, { align: 'right' })
    y += 6
  }

  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...PDF_COLORS.black)
  doc.text('Total', PAGE.marginR - 45, y)

  doc.setFont('helvetica', 'normal')
  doc.text(lang === 'en' ? fmtEurEN(total) : fmtEur(total), PAGE.marginR, y, { align: 'right' })

  return y + 10
}

// ═══════════════════════════════════════════════════════
// SECTION CONDITIONS
// ═══════════════════════════════════════════════════════
export function addConditions(
  doc: jsPDF,
  startY: number,
  lang: 'fr' | 'en' = 'fr',
): number {
  let y = startY + 5

  // Vérifier saut de page
  if (y > 250) {
    doc.addPage()
    y = 25
  }

  y = addSectionTitle(doc, lang === 'en' ? 'Terms' : 'Conditions', y)
  y += 3

  doc.setFontSize(9)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.black)
  doc.text(lang === 'en' ? 'Payment terms : ' : 'Conditions de règlement : ', PAGE.marginL, y)
  doc.setFont('helvetica', 'normal')
  const termLabel = lang === 'en' ? 'Payment terms : ' : 'Conditions de règlement : '
  const termW = doc.getTextWidth(termLabel)
  doc.text(lang === 'en' ? 'Upon receipt' : 'À réception', PAGE.marginL + termW, y)

  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text(lang === 'en' ? 'Payment method : ' : 'Mode de règlement : ', PAGE.marginL, y)
  doc.setFont('helvetica', 'normal')
  const methLabel = lang === 'en' ? 'Payment method : ' : 'Mode de règlement : '
  const methW = doc.getTextWidth(methLabel)
  doc.text(lang === 'en' ? 'Bank transfer' : 'Virement bancaire', PAGE.marginL + methW, y)

  return y + 10
}

// ═══════════════════════════════════════════════════════
// SECTION SIGNATURE (devis uniquement)
// ═══════════════════════════════════════════════════════
export function addSignature(
  doc: jsPDF,
  startY: number,
  lang: 'fr' | 'en' = 'fr',
): number {
  let y = startY + 5

  // Vérifier saut de page
  if (y > 230) {
    doc.addPage()
    y = 25
  }

  y = addSectionTitle(
    doc,
    lang === 'en' ? 'Customer acceptance' : 'Acceptation du client',
    y,
  )
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...PDF_COLORS.darkGray)

  doc.text(
    lang === 'en'
      ? 'At ______________, the ____/____/____'
      : 'À ______________, le ____/____/____',
    PAGE.marginL,
    y,
  )

  y += 20
  doc.text(lang === 'en' ? 'Signature' : 'Signature', PAGE.marginL, y)

  y += 15
  doc.text(
    lang === 'en'
      ? 'Name and position of signatory'
      : 'Nom et qualité du signataire',
    PAGE.marginL,
    y,
  )

  return y + 10
}

// ═══════════════════════════════════════════════════════
// PIED DE PAGE
// ═══════════════════════════════════════════════════════
export function addFooter(
  doc: jsPDF,
  docNumber: string,
  currentPage: number,
  totalPages: number,
  lang: 'fr' | 'en' = 'fr',
): void {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...PDF_COLORS.gray)

    const pageText = lang === 'en'
      ? `Page ${i} of ${pageCount}`
      : `Page ${i} sur ${pageCount}`

    doc.text(pageText, PAGE.marginR, 288, { align: 'right' })

    if (i > 1) {
      // Numéro de document en haut des pages suivantes
      doc.setFontSize(8)
      doc.setTextColor(...PDF_COLORS.title)
      doc.text(docNumber, PAGE.marginR, 10, { align: 'right' })
    }
  }
}
```


## ÉTAPE 3 — RÉÉCRIRE quote-pdf.ts (DEVIS)

Trouver et SUPPRIMER le contenu de l'ancien fichier, puis réécrire :

```powershell
Get-ChildItem -Recurse -Include "*.ts" -Path "src" | Where-Object { $_.Name -match "quote.*pdf|pdf.*quote" }
```

Le nouveau quote-pdf.ts doit utiliser le moteur pdf-engine.ts
et reproduire EXACTEMENT le layout de D2600022.pdf :

```typescript
import {
  createDoc, addHeader, addParties, addIBAN,
  addSectionTitle, addProductTable, addTotal,
  addConditions, addSignature, addFooter,
  fmtEur, PAGE,
} from '../lib/pdf-engine'

interface ProduitDevis {
  nom: string
  numero_interne?: string
  quantite: number
  prixUnitaire: number
  description?: string  // description technique optionnelle
}

interface ClientDevis {
  type?: 'societe' | 'particulier'
  nom: string
  prenom?: string
  societe?: string
  email: string
  telephone?: string
  adresse?: string
  adresse2?: string
  ville?: string
  cp?: string
  pays?: string
}

interface DevisData {
  numero_devis: string
  date: string
  client: ClientDevis
  produits: ProduitDevis[]
  total_ht: number
  partenaire_code?: string
  lang?: 'fr' | 'en'
}

export function generateQuotePDF(data: DevisData): ReturnType<typeof createDoc> {
  const doc = createDoc()
  const lang = data.lang || 'fr'

  // 1. En-tête
  const titlePrefix = lang === 'en' ? 'Quotation' : 'Devis'
  let y = addHeader(doc, `${titlePrefix} ${data.numero_devis}`, data.date)

  // 2. Émetteur / Destinataire
  const clientNom = data.client.societe
    || [data.client.prenom, data.client.nom].filter(Boolean).join(' ')
    || data.client.nom

  const clientAdresse = data.client.adresse
    || ''

  const clientAdresse2 = [data.client.cp, data.client.ville]
    .filter(Boolean).join(' ') || undefined

  y = addParties(doc, {
    emetteur: {
      societe: 'LUXENT LIMITED',
      adresse: '2ND FLOOR COLLEGE HOUSE, 17 KING',
      adresse2: 'EDWARDS ROAD RUISLIP',
      adresse3: 'HA47AE LONDON',
      pays: lang === 'en' ? 'United Kingdom' : 'Royaume-Uni',
      numero_entreprise: '14852122',
      email: 'luxent@ltd-uk.eu',
    },
    destinataire: {
      type: data.client.societe ? 'societe' : 'particulier',
      nom: clientNom,
      adresse: clientAdresse,
      adresse2: clientAdresse2,
      pays: data.client.pays || (lang === 'en' ? 'France' : 'France'),
      email: data.client.email,
      telephone: data.client.telephone,
    },
    lang,
  }, y)

  // 3. IBAN
  y = addIBAN(doc, y)

  // 4. Section "Détail"
  y = addSectionTitle(doc, lang === 'en' ? 'Details' : 'Détail', y)

  // 5. Tableau produits
  const columns = [
    { header: 'Type', width: 22, align: 'left' as const },
    { header: 'Description', width: 75, align: 'left' as const },
    { header: lang === 'en' ? 'Unit price' : 'Prix unitaire HT', width: 28, align: 'right' as const },
    { header: lang === 'en' ? 'Quantity' : 'Quantité', width: 18, align: 'center' as const },
    { header: lang === 'en' ? 'Total excl. tax' : 'Total HT', width: 27, align: 'right' as const },
  ]

  const body = data.produits.map(p => {
    const ref = p.numero_interne ? `${p.numero_interne} - ` : ''
    const desc = p.description
      ? `${ref}${p.nom}\n${p.description}`
      : `${ref}${p.nom}`

    return [
      lang === 'en' ? 'Product' : 'Produit',
      desc,
      fmtEur(p.prixUnitaire),
      String(p.quantite),
      fmtEur(p.prixUnitaire * p.quantite),
    ]
  })

  y = addProductTable(doc, columns, body, y)

  // 6. Total
  const tvaText = lang === 'en'
    ? 'Reverse charge VAT'
    : 'TVA non applicable, art. 293 B du CGI'
  y = addTotal(doc, data.total_ht, y, tvaText, lang)

  // 7. Conditions
  y = addConditions(doc, y, lang)

  // 8. Signature
  addSignature(doc, y, lang)

  // 9. Pied de page
  addFooter(doc, data.numero_devis, 1, 1, lang)

  return doc
}
```

## ÉTAPE 4 — RÉÉCRIRE invoice-pdf.ts (FACTURE)

Même approche — reproduire F2500039.pdf et F2600031.pdf.
La facture est identique au devis SAUF :
- Titre : "Facture F2600031" au lieu de "Devis D2600022"
- Peut avoir un champ "Votre contact" dans l'émetteur
- PAS de section signature
- La section "Conditions" est identique

Utiliser les mêmes fonctions du moteur `pdf-engine.ts`.

## ÉTAPE 5 — RÉÉCRIRE les autres PDFs

Pour CHAQUE template PDF existant dans `src/features/pdf/templates/` :
- commission-pdf.ts → Même style, titre "Note de commission NC..."
- delivery-pdf.ts → Même style, titre "Bon de livraison BL..."
- maritime-pdf.ts → Même style, titre "Frais maritimes FM..."
- customs-pdf.ts → Même style, titre "Dédouanement DD..."

Tous doivent utiliser les fonctions du moteur `pdf-engine.ts`
et avoir la MÊME apparence que les PDFs de référence.

## ÉTAPE 6 — FACTURE D'ACOMPTE

Reproduire FA2600007.pdf — Layout identique aux autres mais :
- Titre : "Facture d'acompte FA2600007"
- Tableau simplifié : 2 colonnes seulement ("Description" + "Total")
- Ligne unique : "Acompte de XX% pour le devis DXXXXXXX de XX XXX,XX € HT"

## ÉTAPE 7 — BUILD ET TEST

```powershell
npm run build
```

Corriger TOUTES les erreurs TypeScript.

```powershell
npm run dev
```

Test : se connecter, ajouter un produit au panier, générer un devis.
Le PDF téléchargé DOIT ressembler à D2600022.pdf.

## ÉTAPE 8 — COMMIT

```powershell
git add -A
git commit -m "refactor: tous les PDFs reproduisent le design exact de production LUXENT"
git push origin main
git tag v5.16-pdf-production
git push origin --tags
```

MAJALL.TXT :
```
DATE : [date]
TAG : v5.16-pdf-production
TYPE : refactor
DESCRIPTION : Reproduction EXACTE des PDFs de production
  (C:\DATA-MC-2030\97IMPORT\PDF\) avec moteur mutualisé pdf-engine.ts.
  Logo LUXENT embarqué en base64. Couleur rose/saumon #C87F6B.
  Tableau en-têtes rose pâle #FBF0ED. Support FR/EN.
FICHIERS :
  - CRÉÉ : src/features/pdf/lib/pdf-engine.ts (moteur mutualisé)
  - CRÉÉ : src/features/pdf/lib/logo-base64.ts (logo embarqué)
  - RÉÉCRIT : src/features/pdf/templates/quote-pdf.ts
  - RÉÉCRIT : src/features/pdf/templates/invoice-pdf.ts
  - RÉÉCRIT : src/features/pdf/templates/commission-pdf.ts
  - RÉÉCRIT : src/features/pdf/templates/delivery-pdf.ts
  - RÉÉCRIT : src/features/pdf/templates/maritime-pdf.ts
  - RÉÉCRIT : src/features/pdf/templates/customs-pdf.ts
  - COPIÉ : src/assets/luxent.jpg
PUBLIÉ : 97import.com ✅
```

## RAPPORT FINAL OBLIGATOIRE

```
FICHIERS DE RÉFÉRENCE LUS :
- [ ] D2600022.pdf (devis)
- [ ] F2500039.pdf (facture)
- [ ] F2600031.pdf (facture)
- [ ] FA2600007.pdf (facture acompte)
- [ ] A2500001.pdf (avoir)
- [ ] luxent.JPG (logo)

MOTEUR pdf-engine.ts :
- [ ] createDoc()
- [ ] addHeader() avec logo
- [ ] addParties() avec labels gris + valeurs noires
- [ ] addIBAN()
- [ ] addProductTable() avec en-têtes rose pâle
- [ ] addTotal() sans encadré
- [ ] addConditions()
- [ ] addSignature()
- [ ] addFooter()

TEMPLATES RÉÉCRITS :
- [ ] quote-pdf.ts → reproduit D2600022.pdf
- [ ] invoice-pdf.ts → reproduit F2500039.pdf / F2600031.pdf
- [ ] commission-pdf.ts → même style
- [ ] delivery-pdf.ts → même style
- [ ] maritime-pdf.ts → même style
- [ ] customs-pdf.ts → même style

BUILD : ✅/❌
TEST PDF GÉNÉRÉ : ✅/❌
COMMIT : [hash]
TAG : v5.16-pdf-production
```
