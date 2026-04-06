/**
 * delivery-pdf.ts — Generateur PDF Bon de Livraison (Delivery Note)
 * Couleur accent : #16A34A (Green)
 * 1 page — 4 colonnes : Ref. Interne | Produit | Qte | Etat
 */
import {
  createDoc, addHeader, addParties, addProductTable,
  addFooter, LUXENT_EMETTEUR, PDF_COLORS,
  type TableColumn,
} from '../lib/pdf-engine'

export interface ProduitBL {
  nom: string
  numero_interne?: string
  quantite: number
  etat?: string  // ex: "Neuf", "Conforme"
}

export interface ClientBL {
  nom: string
  societe?: string
  adresse?: string
  adresse2?: string
  pays?: string
  email?: string
  telephone?: string
}

export interface BLData {
  numero_bl: string
  date: string
  client: ClientBL
  produits: ProduitBL[]
  devis_ref?: string
  lang?: 'fr' | 'en'
}

export function generateDeliveryPDF(data: BLData): ReturnType<typeof createDoc> {
  const doc = createDoc()
  const lang = data.lang || 'fr'
  const accent = PDF_COLORS.deliveryGreen

  const titlePrefix = lang === 'en' ? 'Delivery note' : 'Bon de livraison'
  let y = addHeader(doc, `${titlePrefix} ${data.numero_bl}`, data.date, accent)

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

  const columns: TableColumn[] = [
    { header: lang === 'en' ? 'Ref.' : 'R\u00E9f. Interne', width: 35, align: 'left' },
    { header: lang === 'en' ? 'Product' : 'Produit', width: 95, align: 'left' },
    { header: lang === 'en' ? 'Qty' : 'Qt\u00E9', width: 20, align: 'center' },
    { header: lang === 'en' ? 'Condition' : '\u00C9tat', width: 30, align: 'center' },
  ]

  const body = data.produits.map(p => [
    p.numero_interne || '\u2014',
    p.nom,
    String(p.quantite),
    p.etat || (lang === 'en' ? 'New' : 'Neuf'),
  ])

  y = addProductTable(doc, columns, body, y)

  addFooter(doc, `${titlePrefix} ${data.numero_bl}`, 1, 1, lang)
  return doc
}
