import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Types ──────────────────────────────────────────────────
export interface ProduitDevis {
  nom: string
  numero_interne: string
  quantite: number
  prixUnitaire: number   // prix selon role (deja calcule)
}

export interface DevisData {
  numero_devis: string
  date: string
  client: {
    nom: string
    prenom: string
    email: string
    telephone: string
    adresse: string
    ville: string
    cp: string
    pays: string
  }
  produits: ProduitDevis[]
  total_ht: number
  partenaire_code?: string
}

// ── Helpers ────────────────────────────────────────────────
function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

// ── Generateur PDF ─────────────────────────────────────────
export function generateQuotePDF(data: DevisData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')

  // ═══ EN-TETE EMETTEUR ═══
  doc.setFontSize(18)
  doc.setTextColor(30, 58, 95) // navy #1E3A5F
  doc.text('97import.com', 14, 20)

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('LUXENT LIMITED', 14, 28)
  doc.text('2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD', 14, 33)
  doc.text('RUISLIP HA4 7AE LONDON — UK', 14, 38)
  doc.text('Email : luxent@ltd-uk.eu', 14, 43)

  // ═══ TITRE DEVIS ═══
  doc.setFontSize(22)
  doc.setTextColor(30, 58, 95)
  doc.text('DEVIS', 140, 20, { align: 'center' })

  doc.setFontSize(11)
  doc.text(`N\u00B0 ${data.numero_devis}`, 196, 30, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Date : ${data.date}`, 196, 36, { align: 'right' })
  doc.text('Validite : 30 jours', 196, 42, { align: 'right' })

  // ═══ INFOS CLIENT ═══
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, 52, 182, 32, 2, 2, 'F')

  doc.setFontSize(10)
  doc.setTextColor(30, 58, 95)
  doc.text('CLIENT', 18, 60)

  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  const clientNom = `${data.client.prenom} ${data.client.nom}`
  doc.text(clientNom, 18, 66)
  doc.text(data.client.adresse || '', 18, 71)
  doc.text(
    `${data.client.cp || ''} ${data.client.ville || ''} \u2014 ${data.client.pays || ''}`,
    18,
    76,
  )
  doc.text(`Email : ${data.client.email}`, 110, 66)
  doc.text(`Tel : ${data.client.telephone || '\u2014'}`, 110, 71)

  if (data.partenaire_code) {
    doc.text(`Partenaire : ${data.partenaire_code}`, 110, 76)
  }

  // ═══ TABLEAU PRODUITS ═══
  const tableBody = data.produits.map((p, i) => [
    String(i + 1),
    p.numero_interne || '\u2014',
    p.nom,
    String(p.quantite),
    formatEur(p.prixUnitaire),
    formatEur(p.prixUnitaire * p.quantite),
  ])

  autoTable(doc, {
    startY: 92,
    head: [['#', 'Ref.', 'Designation', 'Qte', 'Prix unit. HT', 'Total HT']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 72 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // ═══ TOTAL ═══
  const finalY = (doc as any).lastAutoTable?.finalY || 160

  doc.setFillColor(30, 58, 95)
  doc.roundedRect(120, finalY + 5, 76, 14, 2, 2, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL HT :', 125, finalY + 14)
  doc.text(formatEur(data.total_ht), 192, finalY + 14, { align: 'right' })

  // ═══ MENTIONS LEGALES ═══
  const mentionsY = finalY + 30
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'Prix HT \u2014 hors frais de transport maritime et dedouanement (calcules sur devis).',
    14,
    mentionsY,
  )
  doc.text(
    "Ce devis est valable 30 jours a compter de sa date d'emission.",
    14,
    mentionsY + 5,
  )
  doc.text(
    'Les frais de livraison et de dedouanement seront precises dans un document separe.',
    14,
    mentionsY + 10,
  )
  doc.text(
    '97import.com \u2014 LUXENT LIMITED \u2014 Company Number 14852122',
    14,
    mentionsY + 20,
  )

  return doc
}
