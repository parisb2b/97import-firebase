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
  // Titre & sous-titres : rose/saumon
  title: [200, 127, 107] as [number, number, number],       // #C87F6B

  // Texte
  black: [0, 0, 0] as [number, number, number],
  darkGray: [74, 74, 74] as [number, number, number],       // #4A4A4A
  gray: [128, 128, 128] as [number, number, number],        // #808080
  lightGray: [229, 229, 229] as [number, number, number],   // #E5E5E5
  white: [255, 255, 255] as [number, number, number],

  // Tableau — en-tetes violet/lavande (tel que dans les PDFs de reference)
  headerBg: [123, 128, 181] as [number, number, number],    // #7B80B5
  headerText: [255, 255, 255] as [number, number, number],  // blanc
}

// ═══════════════════════════════════════════════════════
// CONSTANTES MISE EN PAGE A4
// ═══════════════════════════════════════════════════════
export const PAGE = {
  marginL: 20,
  marginR: 190,       // 210 - 20
  width: 210,
  height: 297,
  contentWidth: 170,   // marginR - marginL
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
): number {
  // Logo en haut a droite
  try {
    doc.addImage(LUXENT_LOGO_BASE64, 'JPEG', 140, 12, 50, 16)
  } catch {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...PDF_COLORS.gray)
    doc.text('LUXENT LIMITED', PAGE.marginR, 20, { align: 'right' })
  }

  // Titre du document — rose/saumon, grande taille, leger
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(28)
  doc.setTextColor(...PDF_COLORS.title)
  doc.text(title, PAGE.marginL, 30)

  // Date sous le titre
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_COLORS.darkGray)
  doc.text(date, PAGE.marginL, 38)

  return 55
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
  const colR = 115
  const valueX = colL + 38
  const valueXR = colR + 35
  let y = startY

  // Titres de section
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(...PDF_COLORS.title)
  doc.text(lang === 'en' ? 'From' : '\u00C9metteur', colL, y)
  const destTitle = info.destTitle || (lang === 'en' ? 'Invoice to' : 'Destinataire')
  doc.text(destTitle, colR, y)
  y += 10

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
    const lines = doc.splitTextToSize(value, 55)
    doc.text(lines, vx, yPos)
    return yPos + (lines.length * 4.5)
  }

  let yL = y
  let yR = y

  // ── Emetteur (gauche) ──
  yL = addField(lang === 'en' ? 'Company :' : 'Soci\u00E9t\u00E9 :', em.societe, colL, valueX, yL, true)
  if (em.contact) {
    yL = addField(lang === 'en' ? 'Your contact :' : 'Votre contact :', em.contact, colL, valueX, yL)
  }
  yL = addField(lang === 'en' ? 'Address :' : 'Adresse :', em.adresse, colL, valueX, yL)
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
  yL = addField(lang === 'en' ? 'Country :' : 'Pays :', em.pays, colL, valueX, yL)
  yL = addField(
    lang === 'en' ? 'Company number :' : "Num\u00E9ro d'entreprise :",
    em.numero_entreprise, colL, valueX, yL,
  )
  yL = addField(
    lang === 'en' ? 'Email :' : 'Adresse email :',
    em.email, colL, valueX, yL,
  )

  // ── Destinataire (droite) ──
  const destLabel = dest.type === 'societe'
    ? (lang === 'en' ? 'Company :' : 'Soci\u00E9t\u00E9 :')
    : (lang === 'en' ? 'Name :' : 'Nom :')
  yR = addField(destLabel, dest.nom, colR, valueXR, yR, true)
  if (dest.adresse) {
    yR = addField(lang === 'en' ? 'Address :' : 'Adresse :', dest.adresse, colR, valueXR, yR)
  }
  if (dest.adresse2) {
    valueStyle()
    doc.text(dest.adresse2, valueXR, yR)
    yR += 4.5
  }
  if (dest.pays) {
    yR = addField(lang === 'en' ? 'Country :' : 'Pays :', dest.pays, colR, valueXR, yR)
  }
  if (dest.email) {
    yR = addField(lang === 'en' ? 'Email :' : 'Adresse email :', dest.email, colR, valueXR, yR)
  }
  if (dest.telephone) {
    yR = addField(lang === 'en' ? 'Phone :' : 'T\u00E9l :', dest.telephone, colR, valueXR, yR)
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
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: PDF_COLORS.black,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.2,
      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: PDF_COLORS.headerBg,
      textColor: PDF_COLORS.headerText,
      fontStyle: 'normal',
      fontSize: 8.5,
    },

    bodyStyles: {
      fillColor: PDF_COLORS.white,
      textColor: PDF_COLORS.black,
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
  doc.setTextColor(...PDF_COLORS.title)  // rose/saumon comme dans les refs
  doc.text('Total', PAGE.marginR - 45, y)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_COLORS.black)
  doc.text(
    lang === 'en' ? fmtEurEN(total) : fmtEur(total),
    PAGE.marginR,
    y,
    { align: 'right' },
  )

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

  if (y > 250) {
    doc.addPage()
    y = 25
  }

  y = addSectionTitle(doc, lang === 'en' ? 'Terms' : 'Conditions', y)
  y += 3

  doc.setFontSize(9)

  // Payment terms
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.black)
  const termLabel = lang === 'en' ? 'Payment terms : ' : 'Conditions de r\u00E8glement : '
  doc.text(termLabel, PAGE.marginL, y)
  doc.setFont('helvetica', 'normal')
  const termW = doc.getTextWidth(termLabel)
  doc.text(
    lang === 'en' ? 'Upon receipt' : '\u00C0 r\u00E9ception',
    PAGE.marginL + termW,
    y,
  )

  y += 5

  // Payment method
  doc.setFont('helvetica', 'bold')
  const methLabel = lang === 'en' ? 'Payment method : ' : 'Mode de r\u00E8glement : '
  doc.text(methLabel, PAGE.marginL, y)
  doc.setFont('helvetica', 'normal')
  const methW = doc.getTextWidth(methLabel)
  doc.text(
    lang === 'en' ? 'Bank transfer' : 'Virement bancaire',
    PAGE.marginL + methW,
    y,
  )

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
  const colR = PAGE.marginL + 100  // colonne droite
  let y = startY + 5

  if (y > 230) {
    doc.addPage()
    y = 25
  }

  // Titre "Acceptation du client" — colonne DROITE (meme hauteur que Conditions)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(...PDF_COLORS.title)
  doc.text(
    lang === 'en' ? 'Customer acceptance' : 'Acceptation du client',
    colR,
    y,
  )
  y += 13

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...PDF_COLORS.darkGray)

  doc.text(
    lang === 'en'
      ? 'At ______________, the ____/____/____'
      : '\u00C0 ______________, le ____/____/____',
    colR,
    y,
  )

  y += 20
  doc.text(
    lang === 'en' ? 'Signature' : 'Signature',
    colR,
    y,
  )

  y += 15
  doc.text(
    lang === 'en'
      ? 'Name and position of signatory'
      : 'Nom et qualit\u00E9 du signataire',
    colR,
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
  _currentPage: number,
  _totalPages: number,
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

    // Numero de document en bas a gauche
    doc.setFontSize(8)
    doc.setTextColor(...PDF_COLORS.gray)
    doc.text(docNumber, PAGE.marginL, 288)
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
