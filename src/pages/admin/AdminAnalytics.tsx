import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const COLORS = {
  navy: '#1B2A4A', green: '#2D7D46', orange: '#E8913A',
  purple: '#7C3AED', gray: '#6B7280', lightGray: '#F3F4F6',
}

interface KPI {
  label: string
  value: string
  icon: string
  color: string
}

export default function AdminAnalytics() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      // Charger les stats depuis Firestore
      const [quotesSnap, profilesSnap, productsSnap] = await Promise.all([
        getDocs(collection(db, 'quotes')),
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'products')),
      ])

      const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
      const totalCA = quotes
        .filter((q: any) => q.statut === 'paid' || q.statut === 'accepted')
        .reduce((sum: number, q: any) => sum + (q.total_ht || 0), 0)

      setKpis([
        { label: 'Chiffre d\'affaires', value: `${totalCA.toLocaleString('fr-FR')} €`, icon: '💰', color: COLORS.green },
        { label: 'Devis total', value: String(quotes.length), icon: '📋', color: COLORS.navy },
        { label: 'Clients inscrits', value: String(profilesSnap.size), icon: '👥', color: COLORS.purple },
        { label: 'Produits actifs', value: String(productsSnap.docs.filter(d => d.data().actif !== false).length), icon: '📦', color: COLORS.orange },
      ])

      // Top produits (par nombre de devis)
      const productCounts: Record<string, number> = {}
      quotes.forEach((q: any) => {
        const items = q.produits || q.items || []
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const name = item.nom || item.name || 'Inconnu'
            productCounts[name] = (productCounts[name] || 0) + 1
          })
        }
      })
      const sorted = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
      setTopProducts(sorted)
    } catch (err) {
      console.error('Erreur analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: COLORS.gray }}>Chargement des analytics...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy, marginBottom: 24 }}>
        📊 Analytics
      </h1>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 12, padding: 20,
            borderLeft: `4px solid ${kpi.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Top Produits */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.navy, marginBottom: 16 }}>
          🏆 Top Produits (par devis)
        </h2>
        {topProducts.length === 0 ? (
          <p style={{ color: COLORS.gray }}>Aucune donnée disponible</p>
        ) : (
          topProducts.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #E5E7EB' : 'none',
            }}>
              <span style={{ fontWeight: 500 }}>
                <span style={{ color: COLORS.orange, marginRight: 8 }}>#{i + 1}</span>
                {p.name}
              </span>
              <span style={{
                background: COLORS.lightGray, padding: '4px 12px',
                borderRadius: 20, fontSize: 13, fontWeight: 600,
              }}>
                {p.count} devis
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
