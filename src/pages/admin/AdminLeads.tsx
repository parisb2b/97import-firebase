import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'
const ORANGE = '#E8913A'

interface Lead {
  id: string
  nom: string
  email: string
  telephone?: string
  message: string
  source: string
  statut: 'nouveau' | 'contacté' | 'qualifié' | 'perdu'
  createdAt: Date
  produit?: string
}

const STATUS_COLORS: Record<Lead['statut'], string> = {
  nouveau: '#3B82F6',
  contacté: ORANGE,
  qualifié: GREEN,
  perdu: '#EF4444',
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Lead['statut'] | 'tous'>('tous')

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(100))
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date(),
        })) as Lead[]
        setLeads(data)
      } catch {
        // Si pas de leads en Firestore, utiliser exemples
        setLeads([])
      }
      setLoading(false)
    }
    fetchLeads()
  }, [])

  const updateStatut = async (id: string, statut: Lead['statut']) => {
    await updateDoc(doc(db, 'leads', id), { statut })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, statut } : l))
  }

  const filtered = filter === 'tous' ? leads : leads.filter(l => l.statut === filter)

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, margin: 0 }}>Leads & Prospects</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
            {leads.length} leads au total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['tous', 'nouveau', 'contacté', 'qualifié', 'perdu'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: filter === s ? 'none' : '1px solid #D1D5DB',
                background: filter === s ? NAVY : '#fff',
                color: filter === s ? '#fff' : '#374151',
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize' as const,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6B7280', textAlign: 'center', padding: 40 }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 32px',
          background: '#F9FAFB',
          borderRadius: 16,
          color: '#6B7280',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 16 }}>Aucun lead {filter !== 'tous' ? `"${filter}"` : ''}</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Les leads proviennent du formulaire contact et WhatsApp</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Nom', 'Email', 'Produit', 'Message', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: NAVY, fontSize: 14 }}>{lead.nom}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>
                    <a href={`mailto:${lead.email}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>{lead.email}</a>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13 }}>{lead.produit || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#6B7280', maxWidth: 200 }}>
                    {lead.message?.substring(0, 80)}{lead.message?.length > 80 ? '…' : ''}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF' }}>
                    {lead.createdAt.toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: STATUS_COLORS[lead.statut] + '20',
                      color: STATUS_COLORS[lead.statut],
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {lead.statut}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <select
                      value={lead.statut}
                      onChange={e => updateStatut(lead.id, e.target.value as Lead['statut'])}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid #D1D5DB',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="nouveau">nouveau</option>
                      <option value="contacté">contacté</option>
                      <option value="qualifié">qualifié</option>
                      <option value="perdu">perdu</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
