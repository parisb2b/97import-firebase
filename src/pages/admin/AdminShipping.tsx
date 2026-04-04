import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const COLORS = {
  navy: '#1B2A4A', green: '#2D7D46', orange: '#E8913A',
  gray: '#6B7280', lightGray: '#F3F4F6',
}

const DESTINATIONS = ['martinique', 'guadeloupe', 'guyane', 'reunion', 'mayotte']
const DEST_LABELS: Record<string, string> = {
  martinique: '🏝️ Martinique (972)',
  guadeloupe: '🏝️ Guadeloupe (971)',
  guyane: '🌿 Guyane (973)',
  reunion: '🌋 Réunion (974)',
  mayotte: '🏝️ Mayotte (976)',
}

interface ShippingPrices {
  [dest: string]: { '20ft': number | null; '40ft': number | null }
}

export default function AdminShipping() {
  const [prices, setPrices] = useState<ShippingPrices>({})
  const [pricePerM3, setPricePerM3] = useState(250)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadShipping() }, [])

  async function loadShipping() {
    try {
      const snap = await getDoc(doc(db, 'admin_params', 'shipping'))
      if (snap.exists()) {
        const data = snap.data()
        setPrices(data.prices || {})
        setPricePerM3(data.pricePerM3 || 250)
      } else {
        // Valeurs par défaut
        const defaults: ShippingPrices = {
          martinique: { '20ft': 5500, '40ft': 9500 },
          guadeloupe: { '20ft': 5000, '40ft': 8500 },
          guyane: { '20ft': null, '40ft': null },
          reunion: { '20ft': null, '40ft': null },
          mayotte: { '20ft': null, '40ft': null },
        }
        setPrices(defaults)
      }
    } catch (err) {
      console.error('Erreur chargement shipping:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'admin_params', 'shipping'), {
        prices,
        pricePerM3,
        updated_at: new Date(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
    } finally {
      setSaving(false)
    }
  }

  function updatePrice(dest: string, size: '20ft' | '40ft', value: string) {
    const num = value === '' ? null : Number(value)
    setPrices(prev => ({
      ...prev,
      [dest]: { ...prev[dest], [size]: num },
    }))
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: COLORS.gray }}>Chargement...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy }}>🚢 Tarifs livraison</h1>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: '#fff',
          background: saved ? COLORS.green : COLORS.navy,
        }}>
          {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>

      {/* Prix au m³ */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 12 }}>Prix au m³</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="number"
            value={pricePerM3}
            onChange={e => setPricePerM3(Number(e.target.value))}
            style={{
              padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8,
              fontSize: 16, fontWeight: 600, width: 120, textAlign: 'right',
            }}
          />
          <span style={{ color: COLORS.gray }}>€ / m³</span>
        </div>
      </div>

      {/* Tableau par destination */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: COLORS.lightGray }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: COLORS.navy }}>Destination</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: COLORS.navy }}>Container 20ft (€)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: COLORS.navy }}>Container 40ft (€)</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: COLORS.navy }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {DESTINATIONS.map(dest => {
              const p = prices[dest] || { '20ft': null, '40ft': null }
              const hasPrice = p['20ft'] !== null || p['40ft'] !== null
              return (
                <tr key={dest} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{DEST_LABELS[dest]}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <input
                      type="number"
                      value={p['20ft'] ?? ''}
                      onChange={e => updatePrice(dest, '20ft', e.target.value)}
                      placeholder="Sur devis"
                      style={{
                        padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6,
                        fontSize: 14, width: 120, textAlign: 'right',
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <input
                      type="number"
                      value={p['40ft'] ?? ''}
                      onChange={e => updatePrice(dest, '40ft', e.target.value)}
                      placeholder="Sur devis"
                      style={{
                        padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6,
                        fontSize: 14, width: 120, textAlign: 'right',
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: hasPrice ? COLORS.green + '15' : COLORS.orange + '15',
                      color: hasPrice ? COLORS.green : COLORS.orange,
                    }}>
                      {hasPrice ? 'Tarif fixe' : 'Sur devis'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div style={{
        marginTop: 20, padding: 16, background: '#EFF6FF', borderRadius: 10,
        border: '1px solid #BFDBFE', fontSize: 13, color: '#1E40AF',
      }}>
        ℹ️ Les destinations sans tarif fixe affichent "Sur devis" côté client.
        Les prix incluent le transport maritime depuis Ningbo/Shanghai vers le port de destination.
      </div>
    </div>
  )
}
