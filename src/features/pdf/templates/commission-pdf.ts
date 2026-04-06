/**
 * commission-pdf.ts — Generateur PDF Note de Commission
 * Couleur accent : #B45309 (Amber)
 * 1 page — 6 colonnes
 */
import {
  createDoc, addHeader, addParties, addTotal,
  addFooter, fmtEur, LUXENT_EMETTEUR, PDF_COLORS, PAGE,
} from '../lib/pdf-engine'
import autoTable from 'jspdf-autotable'

export interface LigneCommission {
  ref_devis: string
  client: string
  produit: string
  prix_remise: number
  prix_partenaire: number
  commission: number
}

export interface CommissionData {
  numero: string
  date: string
  partenaire: {
    nom: string
    code: string
    adresse?: string
    email?: string
  }
  lignes: LigneCommission[]
  total_commission: number
  lang?: 'fr' | 'en'
}

export function generateCommissionPDF(data: CommissionData): ReturnType<typeof createDoc> {
  const doc = createDoc()
  const lang = data.lang || 'fr'
  const accent = PDF_COLORS.amber

  const titlePrefix = lang === 'en' ? 'Commission note' : 'Note de commission'
  let y = addHeader(doc, `${titlePrefix} ${data.numero}`, data.date, accent)

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
      type: 'societe',
      nom: `${data.partenaire.nom} (${data.partenaire.code})`,
      adresse: data.partenaire.adresse,
      email: data.partenaire.email,
    },
    lang,
    destTitle: lang === 'en' ? 'PARTNER' : 'PARTENAIRE',
  }, y)

  // Tableau 6 colonnes
  const head = [
    lang === 'en' ? 'Quote ref.' : 'R\u00E9f. devis',
    'Client',
    lang === 'en' ? 'Product' : 'Produit',
    lang === 'en' ? 'Discounted price' : 'Prix remis\u00E9',
    lang === 'en' ? 'Partner price' : 'Prix partenaire',
    'Commission',
  ]

  const body = data.lignes.map(l => [
    l.ref_devis,
    l.client,
    l.produit,
    fmtEur(l.prix_remise),
    fmtEur(l.prix_partenaire),
    fmtEur(l.commission),
  ])

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: 'plain',
    margin: { left: PAGE.marginL, right: PAGE.width - PAGE.marginR },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      textColor: PDF_COLORS.darkGray,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.3,
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: PDF_COLORS.white,
      textColor: accent,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 28 },
      2: { cellWidth: 49 },
      3: { cellWidth: 28, halign: 'right' as const },
      4: { cellWidth: 26, halign: 'right' as const },
      5: { cellWidth: 24, halign: 'right' as const },
    },
  })

  y = (doc as any).lastAutoTable?.finalY ?? y + 40

  const tvaText = lang === 'en'
    ? 'Reverse charge VAT'
    : 'TVA non applicable, art. 293 B du CGI'
  addTotal(doc, data.total_commission, y, tvaText, lang, accent)

  addFooter(doc, `${titlePrefix} ${data.numero}`, 1, 1, lang)
  return doc
}
