import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface InvoiceProduct {
  name: string
  quantity: number
  prixHT: number
  total: number
}

interface Acompte {
  date: string
  montant: number
  reference: string
}

export interface InvoiceData {
  reference: string
  date: string
  client: { name: string; email: string; phone: string; address: string }
  products: InvoiceProduct[]
  destination: string
  shippingCost: number
  paymentTerms: string
  acomptes?: Acompte[]
  notes?: string
}

const NAVY = [15, 30, 75] as const
const TVA_RATE = 0.085

function formatEUR(amount: number): string {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // --- Header ---
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2])
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('97IMPORT', 15, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Import & Sourcing depuis la Chine', 15, 28)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageWidth - 15, 20, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Réf: ${data.reference}`, pageWidth - 15, 28, { align: 'right' })
  doc.text(`Date: ${data.date}`, pageWidth - 15, 34, { align: 'right' })

  // --- Client info ---
  let y = 52

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Client', 15, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(data.client.name, 15, y)
  y += 5
  if (data.client.address) {
    doc.text(data.client.address, 15, y)
    y += 5
  }
  doc.text(data.client.email, 15, y)
  y += 5
  if (data.client.phone) {
    doc.text(`Tél: ${data.client.phone}`, 15, y)
    y += 5
  }

  // Payment terms
  doc.setFont('helvetica', 'bold')
  doc.text('Conditions de paiement:', pageWidth / 2, 52)
  doc.setFont('helvetica', 'normal')
  doc.text(data.paymentTerms, pageWidth / 2, 58, { maxWidth: pageWidth / 2 - 15 })

  y += 10

  // --- Product table ---
  const tableBody = data.products.map((p) => [
    p.name,
    p.quantity.toString(),
    formatEUR(p.prixHT),
    formatEUR(p.total),
  ])

  ;(doc as any).autoTable({
    startY: y,
    head: [['Produit', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [NAVY[0], NAVY[1], NAVY[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 40 },
    },
    margin: { left: 15, right: 15 },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // --- Totals ---
  const subtotalHT = data.products.reduce((sum, p) => sum + p.total, 0)
  const tva = subtotalHT * TVA_RATE
  const totalTTC = subtotalHT + tva + data.shippingCost

  const totalsX = pageWidth - 80
  const valuesX = pageWidth - 15

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  doc.text('Sous-total HT:', totalsX, y)
  doc.text(formatEUR(subtotalHT), valuesX, y, { align: 'right' })
  y += 6

  doc.text(`TVA (${(TVA_RATE * 100).toFixed(1)}%):`, totalsX, y)
  doc.text(formatEUR(tva), valuesX, y, { align: 'right' })
  y += 6

  if (data.shippingCost > 0) {
    doc.text('Frais de livraison:', totalsX, y)
    doc.text(formatEUR(data.shippingCost), valuesX, y, { align: 'right' })
    y += 6
  }

  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2])
  doc.line(totalsX, y, valuesX, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total TTC:', totalsX, y)
  doc.text(formatEUR(totalTTC), valuesX, y, { align: 'right' })
  y += 10

  // --- Acomptes ---
  const acomptes = data.acomptes || []
  if (acomptes.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Acomptes versés', 15, y)
    y += 6

    ;(doc as any).autoTable({
      startY: y,
      head: [['Date', 'Référence', 'Montant']],
      body: acomptes.map((a) => [a.date, a.reference, formatEUR(a.montant)]),
      theme: 'plain',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        2: { halign: 'right' },
      },
      margin: { left: 15, right: 15 },
    })

    y = (doc as any).lastAutoTable.finalY + 6

    const totalAcomptes = acomptes.reduce((sum, a) => sum + a.montant, 0)
    const resteAPayer = totalTTC - totalAcomptes

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Total acomptes:', totalsX, y)
    doc.text(formatEUR(totalAcomptes), valuesX, y, { align: 'right' })
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(200, 0, 0)
    doc.text('Reste à payer:', totalsX, y)
    doc.text(formatEUR(resteAPayer), valuesX, y, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  // --- Notes ---
  if (data.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text(`Note: ${data.notes}`, 15, y, { maxWidth: pageWidth - 30 })
  }

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 30

  doc.setDrawColor(200, 200, 200)
  doc.line(15, footerY, pageWidth - 15, footerY)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('97IMPORT - Import & Sourcing depuis la Chine', 15, footerY + 5)
  doc.text('contact@97import.com | www.97import.com', 15, footerY + 10)

  doc.setFontSize(7)
  doc.text(
    'En cas de retard de paiement, une pénalité de 3 fois le taux d\'intérêt légal sera appliquée, ainsi qu\'une indemnité forfaitaire de 40€ pour frais de recouvrement.',
    15,
    footerY + 16,
    { maxWidth: pageWidth - 30 }
  )

  doc.text(`Page 1/1`, pageWidth - 15, footerY + 5, { align: 'right' })

  return doc
}
