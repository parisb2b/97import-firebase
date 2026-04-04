import * as XLSX from 'xlsx'

interface SuiviAchatRow {
  ref: string
  produit: string
  client: string
  prixAchat: number
  prixVente: number
  marge: number
  statut: string
  date: string
}

export function exportSuiviAchats(data: SuiviAchatRow[]): void {
  const worksheetData = data.map((row) => ({
    'Réf': row.ref,
    'Produit': row.produit,
    'Client': row.client,
    'Prix Achat (€)': row.prixAchat,
    'Prix Vente (€)': row.prixVente,
    'Marge (€)': row.marge,
    'Statut': row.statut,
    'Date': row.date,
  }))

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Réf
    { wch: 30 }, // Produit
    { wch: 25 }, // Client
    { wch: 14 }, // Prix Achat
    { wch: 14 }, // Prix Vente
    { wch: 12 }, // Marge
    { wch: 14 }, // Statut
    { wch: 12 }, // Date
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suivi Achats')

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `suivi-achats-${today}.xlsx`)
}
