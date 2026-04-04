/**
 * generateDevisPdf.ts — Génération PDF devis client
 * jsPDF + jspdf-autotable
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Product } from '../types'
import { calculerPrix, formatPrix } from './calculPrix'
import { UserRole } from '../types'

const LOGO_URL =
  'https://firebasestorage.googleapis.com/v0/b/import2030.firebasestorage.app/o/logos%2Flogo_import97_large.png?alt=media'

const COMPANY = {
  nom: '97import',
  adresse: 'Martinique — DOM-TOM',
  email: 'contact@97import.com',
  tel: '+596 696 00 00 00',
  siret: '— (en cours)',
}

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url)
    const blob = await resp.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export interface DevisParams {
  product: Product
  role: UserRole
  prixNegocie?: number
  clientNom?: string
  clientEmail?: string
  clientTel?: string
  clientAdresse?: string
  numeroDevis?: string
  quantite?: number
}

export async function generateDevisPdf(params: DevisParams): Promise<void> {
  const {
    product,
    role,
    prixNegocie,
    clientNom = '',
    clientEmail = '',
    clientTel = '',
    clientAdresse = '',
    numeroDevis,
    quantite = 1,
  } = params

  const prix = calculerPrix(product.prix_achat, role, prixNegocie)
  const prixUnit = prix.montant ?? product.prix_achat * 2
  const prixTotal = prixUnit * quantite

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ── Fond header navy ──────────────────────────────────────
  doc.setFillColor(30, 58, 95)  // #1E3A5F
  doc.rect(0, 0, pageW, 45, 'F')

  // ── Logo ──────────────────────────────────────────────────
  const logoB64 = await loadImageBase64(LOGO_URL)
  if (logoB64) {
    doc.addImage(logoB64, 'PNG', 12, 8, 50, 22)
  } else {
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('97import', 14, 20)
  }

  // ── Titre devis ───────────────────────────────────────────
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', pageW - 14, 18, { align: 'right' })

  // Numéro & date
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const numDevis = numeroDevis || `D${new Date().getFullYear().toString().slice(2)}-XXX`
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${numDevis}`, pageW - 14, 26, { align: 'right' })
  doc.text(`Date : ${dateStr}`, pageW - 14, 32, { align: 'right' })
  doc.text(`Valable 30 jours`, pageW - 14, 38, { align: 'right' })

  // ── Bloc ÉMETTEUR ─────────────────────────────────────────
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  let y = 54
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(COMPANY.nom, 14, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(COMPANY.adresse, 14, y + 5)
  doc.text(COMPANY.email, 14, y + 10)
  doc.text(COMPANY.tel, 14, y + 15)

  // ── Bloc CLIENT ───────────────────────────────────────────
  if (clientNom || clientEmail) {
    doc.setFillColor(239, 246, 255)  // navyLight
    doc.roundedRect(pageW / 2, y - 4, pageW / 2 - 14, 30, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 95)
    doc.text('CLIENT', pageW / 2 + 6, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    if (clientNom)     doc.text(clientNom,     pageW / 2 + 6, y + 8)
    if (clientEmail)   doc.text(clientEmail,   pageW / 2 + 6, y + 13)
    if (clientTel)     doc.text(clientTel,     pageW / 2 + 6, y + 18)
    if (clientAdresse) doc.text(clientAdresse, pageW / 2 + 6, y + 23)
  }

  // ── Ligne séparatrice ─────────────────────────────────────
  y = 90
  doc.setDrawColor(191, 219, 254)  // navyBorder
  doc.setLineWidth(0.3)
  doc.line(14, y, pageW - 14, y)

  // ── Titre produit ─────────────────────────────────────────
  y += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 95)
  doc.text(product.nom, 14, y)

  if (product.numero_interne) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`Réf. interne : ${product.numero_interne}`, 14, y + 6)
    y += 6
  }
  if (product.reference) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`SKU : ${product.reference}`, 14, y + 5)
    y += 5
  }

  y += 8

  // ── Tableau produit ───────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [['Désignation', 'Réf. interne', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: [[
      product.nom,
      product.numero_interne || '—',
      String(quantite),
      formatPrix(prixUnit),
      formatPrix(prixTotal),
    ]],
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // ── Totaux ────────────────────────────────────────────────
  const tvaRate = 8.5  // DOM-TOM
  const montantTVA = prixTotal * tvaRate / 100
  const montantTTC = prixTotal + montantTVA

  autoTable(doc, {
    startY: y,
    body: [
      ['', 'Total HT', formatPrix(prixTotal)],
      ['', `TVA (${tvaRate}% DOM-TOM)`, formatPrix(montantTVA)],
      ['', 'Total TTC', formatPrix(montantTTC)],
    ],
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 45, fontStyle: 'bold', textColor: [30, 58, 95] },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // ── Specs techniques (si disponibles) ─────────────────────
  const specs = (product as any).specs_raw
  if (specs && Object.keys(specs).length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 95)
    doc.text('Spécifications techniques', 14, y)
    y += 4

    const specsRows = Object.entries(specs).map(([k, v]) => [
      String(k), String(v)
    ])

    autoTable(doc, {
      startY: y,
      body: specsRows,
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', textColor: [60, 60, 60] },
        1: { cellWidth: 115 },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    })

    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Dimensions ────────────────────────────────────────────
  const hasDims = product.longueur_cm || product.largeur_cm || product.hauteur_cm
  if (hasDims) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    const dimStr = `Dimensions : ${product.longueur_cm || '—'} × ${product.largeur_cm || '—'} × ${product.hauteur_cm || '—'} cm`
    const poidsStr = product.poids_net_kg ? `  |  Poids net : ${product.poids_net_kg} kg` : ''
    doc.text(dimStr + poidsStr, 14, y)
    y += 8
  }

  // ── Note prix ─────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(107, 114, 128)
  doc.text(`Prix indiqué : ${prix.label}`, 14, y)
  y += 5
  doc.text('Transport, installation et frais de dédouanement non inclus sauf mention contraire.', 14, y)

  // ── Footer ────────────────────────────────────────────────
  doc.setFillColor(30, 58, 95)
  doc.rect(0, pageH - 18, pageW, 18, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text(`${COMPANY.nom} · ${COMPANY.adresse} · ${COMPANY.email} · ${COMPANY.tel}`, pageW / 2, pageH - 10, { align: 'center' })
  doc.text('Ce devis n\'a pas valeur de contrat.  Devis non signé = aucun engagement.', pageW / 2, pageH - 5, { align: 'center' })

  // ── Téléchargement ────────────────────────────────────────
  const filename = `Devis_${numDevis}_${product.reference || product.id}.pdf`
  doc.save(filename)
}
