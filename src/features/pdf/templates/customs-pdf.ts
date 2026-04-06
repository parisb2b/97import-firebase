/**
 * customs-pdf.ts — Generateur PDF Frais de Dedouanement
 * Couleur accent : #7C3AED (Purple)
 * 1 page — 2 colonnes : Libelle | Montant HT
 */
import {
  createDoc, addHeader, addParties, addTotal,
  addFooter, fmtEur, LUXENT_EMETTEUR, PDF_COLORS, PAGE,
} from '../lib/pdf-engine'
import autoTable from 'jspdf-autotable'

export interface LigneDouane {
  libelle: string
  montant: number
}

export interface FraisDouaneData {
  numero: string
  date: string
  client: {
    nom: string
    societe?: string
    adresse?: string
    adresse2?: string
    pays?: string
    email?: string
    telephone?: string
  }
  lignes: LigneDouane[]
  total_ht: number
  devis_ref?: string
  lang?: 'fr' | 'en'
}

export function generateCustomsPDF(data: FraisDouaneData): ReturnType<typeof createDoc> {
  const doc = createDoc()
  const lang = data.lang || 'fr'
  const accent = PDF_COLORS.customs

  const titlePrefix = lang === 'en' ? 'Customs fees' : 'Frais de d\u00E9douanement'
  let y = addHeader(doc, `${titlePrefix} ${data.numero}`, data.date, accent)

  const clientNom = data.client.societe || data.client.nom
  y = addParties(doc, {
    emetteur: {
      societe: LUXENT_EMETTEUR.societe,
      adresse: LUXENT_EMETTEUR.adresse,
      adresse2: LUXENT_EMETTEUR.adresse2,
      adresse3: LUXENT_EMETTEUR.adresse3,
      pays: lang === 'en' ? LUXENT_EMETTEUR.pays_en : LUXENT_EMETTEUR.pays_fr,
      numero_entreprise: LUXENT_EMETTEUR.numero_entreprise,
      email: LUXENT_EMETTEUR.email,
    },
    destinataire: {
      type: data.client.societe ? 'societe' : 'particulier',
      nom: clientNom,
      adresse: data.client.adresse,
      adresse2: data.client.adresse2,
      pays: data.client.pays || 'France',
      email: data.client.email,
      telephone: data.client.telephone,
    },
    lang,
  }, y)

  if (data.devis_ref) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...PDF_COLORS.darkGray)
    doc.text(`${lang === 'en' ? 'Ref. quotation' : 'R\u00E9f. devis'} : ${data.devis_ref}`, 15, y)
    y += 8
  }

  autoTable(doc, {
    startY: y,
    head: [[lang === 'en' ? 'Description' : 'Libell\u00E9', lang === 'en' ? 'Amount excl. tax' : 'Montant HT']],
    body: data.lignes.map(l => [l.libelle, fmtEur(l.montant)]),
    theme: 'plain',
    margin: { left: PAGE.marginL, right: PAGE.width - PAGE.marginR },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: PDF_COLORS.darkGray,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.3,
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: PDF_COLORS.white,
      textColor: accent,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 40, halign: 'right' as const },
    },
  })

  y = (doc as any).lastAutoTable?.finalY ?? y + 30

  const tvaText = lang === 'en'
    ? 'Reverse charge VAT'
    : 'TVA non applicable, art. 293 B du CGI'
  addTotal(doc, data.total_ht, y, tvaText, lang, accent)

  addFooter(doc, `${titlePrefix} ${data.numero}`, 1, 1, lang)
  return doc
}
