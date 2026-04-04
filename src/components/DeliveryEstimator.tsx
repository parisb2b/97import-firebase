import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface DeliveryEstimatorProps {
  productId?: string
  destination?: string
}

const DESTINATIONS = [
  { value: 'martinique', label: 'Martinique' },
  { value: 'guadeloupe', label: 'Guadeloupe' },
  { value: 'guyane', label: 'Guyane' },
  { value: 'reunion', label: 'Reunion' },
  { value: 'mayotte', label: 'Mayotte' },
]

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'
const ORANGE = '#E8913A'

export default function DeliveryEstimator({ destination: defaultDest }: DeliveryEstimatorProps) {
  const [destination, setDestination] = useState(defaultDest || 'martinique')
  const [shippingCosts, setShippingCosts] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'shipping'))
        if (snap.exists()) {
          setShippingCosts(snap.data().costs || {})
        }
      } catch {
        // fallback: no data
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const cost = shippingCosts[destination]
  const isSurDevis = cost === null || cost === undefined

  return (
    <div style={{
      background: '#F5F5F5',
      borderRadius: 10,
      padding: '18px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>
        Estimation livraison
      </h4>

      <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>
        Destination
      </label>
      <select
        value={destination}
        onChange={e => setDestination(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: 6,
          fontSize: 14,
          fontFamily: "'Inter', sans-serif",
          boxSizing: 'border-box',
          marginBottom: 14,
        }}
      >
        {DESTINATIONS.map(d => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      {loading ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Chargement...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Frais de port :</span>
            {isSurDevis ? (
              <span style={{ fontSize: 14, fontWeight: 700, color: ORANGE }}>
                Sur devis
              </span>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(cost)}
              </span>
            )}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Delai estime :</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>
              6-8 semaines
            </span>
          </div>
        </div>
      )}

      {isSurDevis && !loading && (
        <p style={{
          fontSize: 11, color: '#9CA3AF', marginTop: 10, marginBottom: 0,
          lineHeight: 1.4,
        }}>
          Les frais de livraison vers {DESTINATIONS.find(d => d.value === destination)?.label} sont
          calcules sur devis. Contactez-nous pour un tarif personnalise.
        </p>
      )}
    </div>
  )
}
