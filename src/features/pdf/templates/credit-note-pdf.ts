/**
 * credit-note-pdf.ts — Generateur PDF Avoir (Credit Note)
 * Reproduit EXACTEMENT le design de A2500001.pdf
 *
 * Differences avec la facture standard :
 * - Titre : "Credit note AXXXXXXX" (toujours en anglais)
 * - En-tete destinataire : "Bill to" au lieu de "Invoice to"
 * - Tableau produits standard (5 colonnes)
 * - Langue par defaut : anglais
 */
import {
  createDoc, addHeader, addParties, addIBAN,
  addSectionTitle, addProductTable, addTotal,
  addConditions, addFooter,
  fmtEur, fmtEurEN, LUXENT_EMETTEUR,
  type TableColumn,
} from '../lib/pdf-engine'

// ── Types ────────────────────────────────────────────
export interface ProduitAvoir {
  nom: string
  numero_interne?: string
  quantite: number
  prixUnitaire: number
}

export interface ClientAvoir {
  type?: 'societe' | 'particulier'
  nom: string
  prenom?: string
  societe?: string
  email?: string
  telephone?: string
  adresse?: string
  adresse2?: string
  ville?: string
  cp?: string
  pays?: string
}

export interface AvoirData {
  numero_avoir: string    // ex: "A2500001"
  date: string
  contact?: string        // "Your contact"
  client: ClientAvoir
  produits: ProduitAvoir[]
  total_ht: number
  facture_ref?: string    // facture d'origine si applicable
  lang?: 'fr' | 'en'
}

// ── Generateur ───────────────────────────────────────
export function generateCreditNotePDF(data: AvoirData): ReturnType<typeof createDoc> {
  const doc = createDoc()
  const lang = data.lang || 'en'
  const fmt = lang === 'en' ? fmtEurEN : fmtEur

  // 1. En-tete
  const titlePrefix = lang === 'en' ? 'Credit note' : 'Avoir'
  let y = addHeader(doc, `${titlePrefix} ${data.numero_avoir}`, data.date)

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
      contact: data.contact,
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
    destTitle: lang === 'en' ? 'Bill to' : 'Destinataire',
  }, y)

  // 3. IBAN
  y = addIBAN(doc, y)

  // 4. Section "Details"
  y = addSectionTitle(doc, lang === 'en' ? 'Details' : 'D\u00E9tail', y)

  // 5. Tableau produits
  const columns: TableColumn[] = [
    { header: 'Type', width: 22, align: 'left' },
    { header: 'Description', width: 75, align: 'left' },
    { header: lang === 'en' ? 'Unit price' : 'Prix unitaire HT', width: 28, align: 'right' },
    { header: lang === 'en' ? 'Quantity' : 'Quantit\u00E9', width: 18, align: 'center' },
    { header: lang === 'en' ? 'Total excl. tax' : 'Total HT', width: 27, align: 'right' },
  ]

  const body = data.produits.map(p => [
    lang === 'en' ? 'Product' : 'Produit',
    p.nom,
    fmt(p.prixUnitaire),
    String(p.quantite),
    fmt(p.prixUnitaire * p.quantite),
  ])

  y = addProductTable(doc, columns, body, y)

  // 6. Total
  const tvaText = lang === 'en'
    ? 'Reverse charge VAT'
    : 'TVA non applicable, art. 293 B du CGI'
  y = addTotal(doc, data.total_ht, y, tvaText, lang)

  // 7. Conditions (PAS de signature pour les avoirs)
  addConditions(doc, y, lang)

  // 8. Pied de page
  addFooter(doc, `${titlePrefix} ${data.numero_avoir}`, 1, 1, lang)

  return doc
}
