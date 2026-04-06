/**
 * deposit-invoice-pdf.ts — Generateur PDF Facture d'Acompte
 * Reproduit EXACTEMENT le design de FA2600007.pdf
 *
 * Differences avec la facture standard :
 * - Titre : "Facture d'acompte FAXXXXXXX"
 * - Tableau simplifie : 2 colonnes (Description + Total)
 * - Ligne unique : "Acompte de XX% pour le devis DXXXXXXX de XX XXX,XX EUR HT"
 */
import {
  createDoc, addHeader, addParties, addIBAN,
  addSectionTitle, addTotal, addConditions, addFooter,
  fmtEur, LUXENT_EMETTEUR, PDF_COLORS, PAGE,
} from '../lib/pdf-engine'
import autoTable from 'jspdf-autotable'

// ── Types ────────────────────────────────────────────
export interface ClientAcompte {
  type?: 'societe' | 'particulier'
  nom: string
  prenom?: string
  societe?: string
  email?: string
  telephone?: string
  adresse?: string
  adresse2?: string
  pays?: string
}

export interface AcompteData {
  numero_facture: string     // ex: "FA2600007"
  date: string
  client: ClientAcompte
  // Acompte
  pourcentage: number        // ex: 15.97
  numero_devis: string       // ex: "D2600008"
  montant_devis_ht: number   // ex: 17850
  montant_acompte: number    // ex: 2850
  lang?: 'fr' | 'en'
}

// ── Generateur ───────────────────────────────────────
export function generateDepositInvoicePDF(data: AcompteData): ReturnType<typeof createDoc> {
  const doc = createDoc()
  const lang = data.lang || 'fr'

  // 1. En-tete
  const title = lang === 'en'
    ? `Deposit invoice ${data.numero_facture}`
    : `Facture d\u2019acompte ${data.numero_facture}`
  let y = addHeader(doc, title, data.date)

  // 2. Emetteur / Destinataire
  const clientNom = data.client.societe
    || [data.client.prenom, data.client.nom].filter(Boolean).join(' ')
    || data.client.nom

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

  // 3. IBAN
  y = addIBAN(doc, y)

  // 4. Section "Detail"
  y = addSectionTitle(doc, lang === 'en' ? 'Details' : 'D\u00E9tail', y)

  // 5. Tableau simplifie — 2 colonnes seulement
  const descText = lang === 'en'
    ? `Deposit of ${data.pourcentage.toFixed(2).replace('.', ',')}% for quotation ${data.numero_devis} of ${fmtEur(data.montant_devis_ht)} excl. tax`
    : `Acompte de ${data.pourcentage.toFixed(2).replace('.', ',')}% pour le devis ${data.numero_devis} de ${fmtEur(data.montant_devis_ht)} HT`

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Total']],
    body: [[descText, fmtEur(data.montant_acompte)]],
    theme: 'plain',
    margin: { left: PAGE.marginL, right: PAGE.width - PAGE.marginR },

    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: PDF_COLORS.black,
      lineColor: PDF_COLORS.lightGray,
      lineWidth: 0.2,
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

    columnStyles: {
      0: { cellWidth: 143 },
      1: { cellWidth: 27, halign: 'right' as const },
    },
  })

  y = (doc as any).lastAutoTable?.finalY ?? y + 30

  // 6. Total
  const tvaText = lang === 'en'
    ? 'Reverse charge VAT'
    : 'TVA non applicable, art. 293 B du CGI'
  y = addTotal(doc, data.montant_acompte, y, tvaText, lang)

  // 7. Conditions
  addConditions(doc, y, lang)

  // 8. Pied de page
  const footerTitle = lang === 'en'
    ? `Deposit invoice ${data.numero_facture}`
    : `Facture d'acompte ${data.numero_facture}`
  addFooter(doc, footerTitle, 1, 1, lang)

  return doc
}
