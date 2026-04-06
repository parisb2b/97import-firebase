/**
 * pdf-engine.ts — Moteur PDF mutualise pour tous les documents LUXENT LIMITED
 *
 * Couleurs extraites des PDFs de reference (D2600022.pdf, F2600031.pdf)
 * NE PAS MODIFIER sans comparer aux PDFs source.
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LUXENT_LOGO_BASE64 } from './logo-base64'

// ═══════════════════════════════════════════════════════
// COULEURS — EXTRAITES DES PDFs DE REFERENCE
// ═══════════════════════════════════════════════════════
export const PDF_COLORS = {
  // Accent principal : Navy (ancien site 97import)
  accent: [30, 58, 95] as [number, number, number],         // #1E3A5F
  title: [30, 58, 95] as [number, number, number],          // #1E3A5F

  // Texte
  black: [0, 0, 0] as [number, number, number],
  darkGray: [55, 65, 81] as [number, number, number],       // #374151
  gray: [107, 114, 128] as [number, number, number],        // #6B7280
  lightGray: [191, 219, 254] as [number, number, number],   // #BFDBFE
  white: [255, 255, 255] as [number, number, number],

  // Tableau — en-tetes Navy fond blanc, bordures bleu clair
  headerBg: [255, 255, 255] as [number, number, number],    // blanc
  headerText: [30, 58, 95] as [number, number, number],     // #1E3A5F Navy

  // Couleurs specifiques par type de document
  green: [4, 120, 87] as [number, number, number],          // #047857 Facture
  deliveryGreen: [22, 163, 74] as [number, number, number], // #16A34A BL
  amber: [180, 83, 9] as [number, number, number],          // #B45309 Commission
  maritime: [2, 132, 199] as [number, number, number],      // #0284C7 Maritime
  customs: [124, 58, 237] as [number, number, number],      // #7C3AED Dedouanement

  // Fond sections
  sectionBg: [239, 246, 255] as [number, number, number],   // #EFF6FF
}

// ═══════════════════════════════════════════════════════
// CONSTANTES MISE EN PAGE A4
// ═══════════════════════════════════════════════════════
export const PAGE = {
  marginL: 15,
  marginR: 195,       // 210 - 15
  width: 210,
  height: 297,
  contentWidth: 180,   // marginR - marginL
}

// ═══════════════════════════════════════════════════════
// FORMATAGE PRIX
// ═══════════════════════════════════════════════════════

/** Format FR : "12 500,00 E" — espace normal U+0020 (pas narrow no-break space) */
export function fmtEur(n: number): string {
  const parts = n.toFixed(2).split('.')
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  // espace normal U+0020
  return `${intPart},${parts[1]} \u20AC`
}

/** Format EN : "E12,500.00" */
export function fmtEurEN(n: number): string {
  return '\u20AC' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

// ═══════════════════════════════════════════════════════
// CREER UN DOCUMENT A4
// ═══════════════════════════════════════════════════════
export function createDoc(): jsPDF {
  return new jsPDF('p', 'mm', 'a4')
}

// ═══════════════════════════════════════════════════════
// EN-TETE : Titre + Date + Logo
// ═══════════════════════════════════════════════════════
export function addHeader(
  doc: jsPDF,
  title: string,       // ex: "Facture F2600031"
  date: string,        // ex: "31 mars 2026"
  accentColor?: [number, number, number],
): number {
  const accent = accentColor || PDF_COLORS.accent

  // Logo en haut a droite
  try {
    doc.addImage(LUXENT_LOGO_BASE64, 'JPEG', 145, 10, 45, 14)
  } catch {
    // Fallback texte
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...accent)
    doc.text('97import.com', PAGE.marginR, 20, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...PDF_COLORS.gray)
    doc.text('Importation & Distribution', PAGE.marginR, 26, { align: 'right' })
  }

  // Titre du document — Bold 20pt couleur accent
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...accent)
  doc.text(title, PAGE.marginL, 24)

  // Date sous le titre
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...PDF_COLORS.gray)
  doc.text(`Date : ${date}`, PAGE.marginL, 30)

  // Ligne separateur
  doc.setDrawColor(...PDF_COLORS.lightGray)
  doc.setLineWidth(0.8)
  doc.line(PAGE.marginL, 34, PAGE.marginR, 34)

  return 42
}

// ═══════════════════════════════════════════════════════
// BLOC EMETTEUR / DESTINATAIRE (2 colonnes)
// ═══════════════════════════════════════════════════════
export interface PartyInfo {
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
  destinataire: {
    type: 'societe' | 'particulier'
    nom: string
    adresse?: string
    adresse2?: string
    pays?: string
    email?: string
    telephone?: string
  }
  lang?: 'fr' | 'en'
  destTitle?: string  // Override: "Bill to", "Invoice to", etc.
}

export function addParties(doc: jsPDF, info: PartyInfo, startY: number): number {
  const { emetteur: em, destinataire: dest, lang = 'fr' } = info
  const colL = PAGE.marginL
  const colR = 105
  let y = startY

  // Labels de section — Bold 7.5pt #4A90D9
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(74, 144, 217)  // #4A90D9
  doc.text(lang === 'en' ? 'FROM' : '\u00C9METTEUR', colL, y)
  const destTitle = info.destTitle || (lang === 'en' ? 'INVOICE TO' : 'DESTINATAIRE')
  doc.text(destTitle, colR, y)
  y += 5

  let yL = y
  let yR = y

  // ── Emetteur (gauche, largeur 85mm) ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...PDF_COLORS.accent)
  doc.text(em.societe, colL, yL)
  yL += 5

  if (em.contact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...PDF_COLORS.darkGray)
    doc.text(`Contact : ${em.contact}`, colL, yL)
    yL += 4
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...PDF_COLORS.darkGray)
  doc.text(em.adresse, colL, yL); yL += 4
  if (em.adresse2) { doc.text(em.adresse2, colL, yL); yL += 4 }
  if (em.adresse3) { doc.text(em.adresse3, colL, yL); yL += 4 }
  doc.text(lang === 'en' ? em.pays : em.pays, colL, yL); yL += 4
  doc.text(`${lang === 'en' ? 'Company No' : "N\u00B0 entreprise"} : ${em.numero_entreprise}`, colL, yL); yL += 4
  doc.text(`Email : ${em.email}`, colL, yL); yL += 4

  // ── Destinataire (droite, largeur 85mm) ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...PDF_COLORS.accent)
  doc.text(dest.nom, colR, yR)
  yR += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...PDF_COLORS.darkGray)
  if (dest.adresse) { doc.text(dest.adresse, colR, yR); yR += 4 }
  if (dest.adresse2) { doc.text(dest.adresse2, colR, yR); yR += 4 }
  if (dest.pays) { doc.text(dest.pays, colR, yR); yR += 4 }
  if (dest.email) { doc.text(`Email : ${dest.email}`, colR, yR); yR += 4 }
  if (dest.telephone) { doc.text(`${lang === 'en' ? 'Phone' : 'T\u00E9l'} : ${dest.telephone}`, colR, yR); yR += 4 }

  const maxY = Math.max(yL, yR) + 2

  // Ligne separateur
  doc.setDrawColor(...PDF_COLORS.lightGray)
  doc.setLineWidth(0.5)
  doc.line(PAGE.marginL, maxY, PAGE.marginR, maxY)

  return maxY + 4
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
// TITRE DE SECTION
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
// En-tetes violet/lavande (#7B80B5) avec texte blanc
// Lignes sur fond blanc, bordures gris clair
// ═══════════════════════════════════════════════════════
export interface TableColumn {
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
    theme: 'plain',
    margin: { left: PAGE.marginL, right: PAGE.width - PAGE.marginR },

    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: PDF_COLORS.darkGray,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.3,
      overflow: 'linebreak',
      minCellHeight: 10,
    },

    headStyles: {
      fillColor: PDF_COLORS.white,
      textColor: PDF_COLORS.accent,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.4,
    },

    bodyStyles: {
      fillColor: PDF_COLORS.white,
      textColor: PDF_COLORS.darkGray,
    },

    alternateRowStyles: {
      fillColor: PDF_COLORS.white,
    },

    columnStyles: Object.fromEntries(
      columns.map((c, i) => [
        i,
        {
          cellWidth: c.width,
          halign: (c.align || 'left') as 'left' | 'center' | 'right',
        },
      ]),
    ),

    // Bordures horizontales fines entre les lignes
    didDrawCell: (data: any) => {
      if (data.section === 'body') {
        doc.setDrawColor(...PDF_COLORS.lightGray)
        doc.setLineWidth(0.2)
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
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
  accentColor?: [number, number, number],
): number {
  const accent = accentColor || PDF_COLORS.accent
  let y = startY + 6

  // Boite arrondie pour le total
  const boxX = 113
  const boxW = 82
  const boxH = 14
  doc.setDrawColor(...accent)
  doc.setLineWidth(0.8)
  doc.roundedRect(boxX, y, boxW, boxH, 2, 2, 'S')

  // Label "TOTAL HT"
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...accent)
  doc.text(lang === 'en' ? 'TOTAL excl. tax :' : 'TOTAL HT :', boxX + 4, y + 9)

  // Montant
  doc.text(
    lang === 'en' ? fmtEurEN(total) : fmtEur(total),
    boxX + boxW - 4,
    y + 9,
    { align: 'right' },
  )

  y += boxH + 3

  // TVA mention — boite fond gris clair
  if (tvaText) {
    doc.setFillColor(249, 250, 251) // #F9FAFB
    doc.setDrawColor(...PDF_COLORS.lightGray)
    doc.setLineWidth(0.3)
    doc.roundedRect(boxX, y, boxW, 8, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...PDF_COLORS.gray)
    doc.text(tvaText, boxX + boxW / 2, y + 5.5, { align: 'center' })
    y += 10
  }

  return y + 4
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

  if (y > 250) {
    doc.addPage()
    y = 25
  }

  // Titre section — Bold 13pt Navy
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...PDF_COLORS.accent)
  doc.text(
    lang === 'en' ? 'General terms & Acceptance' : 'Conditions g\u00E9n\u00E9rales & Bon pour accord',
    PAGE.marginL, y,
  )
  y += 8

  // Section boxes — fond #EFF6FF, bordure #BFDBFE
  const sections = lang === 'en' ? [
    ['Payment terms', 'Upon receipt of invoice.'],
    ['Payment method', 'Bank transfer \u2014 details provided on the invoice.'],
    ['Delivery', 'Delivery times are indicative.\nShipping and customs fees not included.'],
    ['Validity', `This quotation is valid for 30 days.`],
  ] : [
    ['Conditions de r\u00E8glement', '\u00C0 r\u00E9ception de la facture.'],
    ['Mode de r\u00E8glement', 'Virement bancaire \u2014 coordonn\u00E9es fournies sur la facture.'],
    ['Livraison', 'Les d\u00E9lais sont donn\u00E9s \u00E0 titre indicatif.\nFrais de livraison et d\u00E9douanement non inclus.'],
    ['Validit\u00E9', 'Ce devis est valable 30 jours.'],
  ]

  for (const [label, value] of sections) {
    // Boite fond bleu clair
    const lines = doc.splitTextToSize(value, 160)
    const boxH = 6 + lines.length * 4
    doc.setFillColor(...PDF_COLORS.sectionBg)
    doc.setDrawColor(...PDF_COLORS.lightGray)
    doc.setLineWidth(0.3)
    doc.roundedRect(PAGE.marginL, y - 3, PAGE.contentWidth, boxH, 1, 1, 'FD')

    // Label bold
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...PDF_COLORS.accent)
    const labelText = `${label} : `
    doc.text(labelText, PAGE.marginL + 3, y + 1)
    const labelW = doc.getTextWidth(labelText)

    // Value normal
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...PDF_COLORS.darkGray)
    doc.text(lines, PAGE.marginL + 3 + labelW, y + 1)

    y += boxH + 2
  }

  return y + 2
}

// ═══════════════════════════════════════════════════════
// SECTION SIGNATURE (devis uniquement)
// ═══════════════════════════════════════════════════════
export function addSignature(
  doc: jsPDF,
  startY: number,
  lang: 'fr' | 'en' = 'fr',
): number {
  let y = startY

  if (y > 210) {
    doc.addPage()
    y = 25
  }

  // ── Zone signature (pleine largeur, sous les conditions) ──
  // Titre
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_COLORS.accent)
  doc.text(
    lang === 'en' ? 'Acceptance' : 'Bon pour accord',
    PAGE.width / 2,
    y,
    { align: 'center' },
  )
  y += 8

  // 2 colonnes : gauche "Fait a" / droite "Le"
  const colL = PAGE.marginL
  const colR = PAGE.marginL + 95

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...PDF_COLORS.darkGray)

  // Gauche
  doc.text(lang === 'en' ? 'At :' : 'Fait \u00E0 :', colL, y)
  doc.setDrawColor(...PDF_COLORS.lightGray)
  doc.setLineWidth(0.3)
  doc.roundedRect(colL, y + 2, 80, 22, 1, 1, 'S')

  // Droite
  doc.text(lang === 'en' ? 'Date :' : 'Le :', colR, y)
  doc.text(
    lang === 'en' ? 'Title of signatory :' : 'Qualit\u00E9 du signataire :',
    colR, y + 10,
  )
  y += 28

  // Signature
  doc.text(lang === 'en' ? 'Signature :' : 'Signature :', colL, y)
  doc.roundedRect(colL, y + 2, 80, 28, 1, 1, 'S')

  return y + 35
}

// ═══════════════════════════════════════════════════════
// PIED DE PAGE
// ═══════════════════════════════════════════════════════
export function addFooter(
  doc: jsPDF,
  docNumber: string,
  _currentPage: number,
  _totalPages: number,
  lang: 'fr' | 'en' = 'fr',
): void {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Ligne separateur
    doc.setDrawColor(...PDF_COLORS.lightGray)
    doc.setLineWidth(0.3)
    doc.line(PAGE.marginL, 285, PAGE.marginR, 285)

    // Centre : "NumDoc — 97import.com / LUXENT LIMITED"
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...PDF_COLORS.gray)
    doc.text(
      `${docNumber} \u2014 97import.com / LUXENT LIMITED`,
      PAGE.width / 2,
      289,
      { align: 'center' },
    )

    // Droite : "Page n / total"
    const pageText = lang === 'en'
      ? `Page ${i} / ${pageCount}`
      : `Page ${i} / ${pageCount}`
    doc.text(pageText, PAGE.marginR, 289, { align: 'right' })
  }
}

// ═══════════════════════════════════════════════════════
// EMETTEUR LUXENT (donnees fixes)
// ═══════════════════════════════════════════════════════
export const LUXENT_EMETTEUR = {
  societe: 'LUXENT LIMITED',
  adresse: '2ND FLOOR COLLEGE HOUSE, 17 KING',
  adresse2: 'EDWARDS ROAD RUISLIP',
  adresse3: 'HA47AE LONDON',
  pays_en: 'United Kingdom',
  pays_fr: 'Royaume-Uni',
  numero_entreprise: '14852122',
  email: 'luxent@ltd-uk.eu',
}
