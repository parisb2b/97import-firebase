import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import { AdminCard, AdminCardHeader, ADMIN_COLORS } from '../../components/admin/AdminUI'

interface KPI {
  label: string
  value: string
  icon: string
  color: string
  sub?: string
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [recentQuotes, setRecentQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    try {
      const [quotesSnap, profilesSnap, productsSnap, partnersSnap] = await Promise.all([
        getDocs(collection(db, 'quotes')),
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'partners')),
      ])

      const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
      const totalCA = quotes
        .filter(q => ['accepte', 'facture'].includes(q.statut))
        .reduce((sum, q) => sum + (q.prix_negocie || q.prix_total_calcule || 0), 0)

      const nouveaux = quotes.filter(q => q.statut === 'nouveau').length
      const vipCount = quotes.filter(q => q.statut === 'vip').length
      const activeProducts = productsSnap.docs.filter(d => d.data().actif !== false).length

      setKpis([
        { label: 'Chiffre d\'affaires', value: `${totalCA.toLocaleString('fr-FR')} €`, icon: '💰', color: ADMIN_COLORS.greenText, sub: 'Devis acceptés + facturés' },
        { label: 'Devis', value: String(quotes.length), icon: '📄', color: ADMIN_COLORS.navy, sub: `${nouveaux} nouveau(x), ${vipCount} VIP` },
        { label: 'Clients inscrits', value: String(profilesSnap.size), icon: '👥', color: '#7C3AED', sub: `${partnersSnap.size} partenaires` },
        { label: 'Produits actifs', value: String(activeProducts), icon: '📦', color: ADMIN_COLORS.orangeBtn, sub: `sur ${productsSnap.size} total` },
      ])

      // 10 derniers devis
      const sorted = quotes
        .sort((a, b) => {
          const da = a.created_at?.toDate?.() || new Date(0)
          const db2 = b.created_at?.toDate?.() || new Date(0)
          return db2.getTime() - da.getTime()
        })
        .slice(0, 10)
      setRecentQuotes(sorted)
    } catch (err) {
      console.error('Erreur dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
    nouveau: { bg: ADMIN_COLORS.navyLight, color: ADMIN_COLORS.navy },
    en_cours: { bg: ADMIN_COLORS.orangeBg, color: ADMIN_COLORS.orangeText },
    vip: { bg: ADMIN_COLORS.purpleBgDark, color: ADMIN_COLORS.purpleText },
    accepte: { bg: ADMIN_COLORS.greenBg, color: ADMIN_COLORS.greenText },
    refuse: { bg: '#FEF2F2', color: '#DC2626' },
    facture: { bg: ADMIN_COLORS.greenBg, color: ADMIN_COLORS.greenText },
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: 40, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, marginBottom: '20px' }}>
          📊 Tableau de bord
        </h1>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 8, padding: '16px 20px',
              borderLeft: `4px solid ${kpi.color}`,
              border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
              borderLeftWidth: '4px', borderLeftColor: kpi.color,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: ADMIN_COLORS.grayText }}>{kpi.label}</span>
                <span style={{ fontSize: '20px' }}>{kpi.icon}</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, marginTop: 2 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>

        {/* Derniers devis */}
        <AdminCard>
          <AdminCardHeader>10 derniers devis</AdminCardHeader>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: ADMIN_COLORS.grayBg, borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>N°</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Client</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Montant</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Statut</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.map((q) => {
                  const sc = STATUT_COLORS[q.statut] || { bg: ADMIN_COLORS.grayBg, color: ADMIN_COLORS.grayText }
                  const date = q.created_at?.toDate?.()
                  return (
                    <tr key={q.id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{q.numero_devis || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{q.nom_client || q.email_client || '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {(q.prix_negocie || q.prix_total_calcule || 0).toLocaleString('fr-FR')} €
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: sc.bg, color: sc.color,
                        }}>
                          {q.statut}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: ADMIN_COLORS.grayText }}>
                        {date ? date.toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  )
                })}
                {recentQuotes.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: ADMIN_COLORS.grayText }}>Aucun devis</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
