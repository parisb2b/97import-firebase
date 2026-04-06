/**
 * quote-pdf.ts — Generateur PDF Devis (Quotation)
 * Reproduit EXACTEMENT le design de D2600022.pdf
 */
import {
  createDoc, addHeader, addParties, addIBAN,
  addSectionTitle, addProductTable, addTotal,
  addConditions, addSignature, addFooter,
  fmtEur, fmtEurEN, LUXENT_EMETTEUR,
  type TableColumn,
} from '../lib/pdf-engine'

// ── Types publics ────────────────────────────────────
export interface ProduitDevis {
  nom: string
  numero_interne?: string
  quantite: number
  prixUnitaire: number
  description?: string
}

export interface ClientDevis {
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

export interface DevisData {
  numero_devis: string
  date: string
  client: ClientDevis
  produits: ProduitDevis[]
  total_ht: number
  partenaire_code?: string
  lang?: 'fr' | 'en'
}

// ── Generateur ───────────────────────────────────────
export function generateQuotePDF(data: DevisData): ReturnType<typeof createDoc> {
  const doc = createDoc()
  const lang = data.lang || 'en'
  const fmt = lang === 'en' ? fmtEurEN : fmtEur

  // 1. En-tete
  const titlePrefix = lang === 'en' ? 'Quotation' : 'Devis'
  let y = addHeader(doc, `${titlePrefix} ${data.numero_devis}`, data.date)

  // 2. Emetteur / Destinataire
  const clientNom = data.client.societe
    || [data.client.prenom, data.client.nom].filter(Boolean).join(' ')
    || data.client.nom

  const clientAdresse = data.client.adresse || ''
  const clientAdresse2 = [data.client.cp, data.client.ville]
    .filter(Boolean).join(' ') || undefined

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
      adresse: clientAdresse,
      adresse2: clientAdresse2,
      pays: data.client.pays || 'France',
      email: data.client.email,
      telephone: data.client.telephone,
    },
    lang,
  }, y)

  // 3. IBAN
  y = addIBAN(doc, y)

  // 4. Section "Details" / "Detail"
  y = addSectionTitle(doc, lang === 'en' ? 'Details' : 'D\u00E9tail', y)

  // 5. Tableau produits
  const columns: TableColumn[] = [
    { header: 'Type', width: 22, align: 'left' },
    { header: 'Description', width: 75, align: 'left' },
    { header: lang === 'en' ? 'Unit price' : 'Prix unitaire HT', width: 28, align: 'right' },
    { header: lang === 'en' ? 'Quantity' : 'Quantit\u00E9', width: 18, align: 'center' },
    { header: lang === 'en' ? 'Total excl. tax' : 'Total HT', width: 27, align: 'right' },
  ]

  const body = data.produits.map(p => {
    const ref = p.numero_interne ? `# ${p.numero_interne} - ` : ''
    const desc = p.description
      ? `${ref}${p.nom}\n${p.description}`
      : `${ref}${p.nom}`

    return [
      lang === 'en' ? 'Product' : 'Produit',
      desc,
      fmt(p.prixUnitaire),
      String(p.quantite),
      fmt(p.prixUnitaire * p.quantite),
    ]
  })

  y = addProductTable(doc, columns, body, y)

  // 6. Total
  const tvaText = lang === 'en'
    ? 'Reverse charge VAT'
    : 'TVA non applicable, art. 293 B du CGI'
  y = addTotal(doc, data.total_ht, y, tvaText, lang)

  // 7. Conditions (page 2 si necessaire)
  y = addConditions(doc, y, lang)

  // 8. Signature — sous les conditions (pas de chevauchement)
  y = addSignature(doc, y, lang)

  // 9. Pied de page
  addFooter(doc, `${titlePrefix} ${data.numero_devis}`, 1, 1, lang)

  return doc
}
