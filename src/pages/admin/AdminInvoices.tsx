import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const COLORS = {
  navy: '#1B2A4A', green: '#2D7D46', orange: '#E8913A',
  red: '#DC2626', gray: '#6B7280', lightGray: '#F3F4F6',
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#9CA3AF', sent: '#3B82F6', paid: '#2D7D46',
  partial: '#E8913A', overdue: '#DC2626', cancelled: '#6B7280',
}

interface Invoice {
  id: string
  reference: string
  quote_ref?: string
  client_name: string
  client_email: string
  total_ht: number
  total_ttc: number
  statut: string
  date_emission: any
  date_echeance?: any
  acomptes?: Array<{ montant: number; date: string }>
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { loadInvoices() }, [])

  async function loadInvoices() {
    try {
      const snap = await getDocs(collection(db, 'invoices'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]
      data.sort((a, b) => {
        const da = a.date_emission?.toMillis?.() || 0
        const db_ = b.date_emission?.toMillis?.() || 0
        return db_ - da
      })
      setInvoices(data)
    } catch (err) {
      console.error('Erreur chargement factures:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatut(id: string, statut: string) {
    try {
      await updateDoc(doc(db, 'invoices', id), { statut })
      setInvoices(prev => prev.map(inv =>
        inv.id === id ? { ...inv, statut } : inv
      ))
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
    }
  }

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.statut === filter)

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: COLORS.gray }}>Chargement des factures...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy }}>🧾 Factures</h1>
        <span style={{ fontSize: 14, color: COLORS.gray }}>{invoices.length} facture(s)</span>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'draft', 'sent', 'paid', 'partial', 'overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
            background: filter === f ? COLORS.navy : COLORS.lightGray,
            color: filter === f ? '#fff' : COLORS.gray,
          }}>
            {f === 'all' ? 'Toutes' : f === 'draft' ? 'Brouillon' : f === 'sent' ? 'Envoyée' :
             f === 'paid' ? 'Payée' : f === 'partial' ? 'Partielle' : 'En retard'}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: COLORS.lightGray }}>
              {['Référence', 'Client', 'Total TTC', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: COLORS.navy }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: COLORS.gray }}>Aucune facture</td></tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{inv.reference || inv.id.slice(0, 8)}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.client_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{(inv.total_ttc || 0).toLocaleString('fr-FR')} €</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      color: '#fff', background: STATUS_COLORS[inv.statut] || COLORS.gray,
                    }}>
                      {inv.statut}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={inv.statut}
                      onChange={e => updateStatut(inv.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                    >
                      <option value="draft">Brouillon</option>
                      <option value="sent">Envoyée</option>
                      <option value="paid">Payée</option>
                      <option value="partial">Partielle</option>
                      <option value="overdue">En retard</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
