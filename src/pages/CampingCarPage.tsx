/**
 * CampingCarPage — Camping-Car Deluxe single product page
 * prix_achat 41269 EUR
 */
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { calculerPrix, formatPrix, eurToYuan, formatYuan } from '@/utils/calculPrix'
import { CAMPING_CAR_PRIX_ACHAT, CAMPING_CAR_SHIPPING } from '@/data/pricing'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray500: '#6B7280',
  gray700: '#374151',
}

const GALLERY = [
  '/images/products/camping_car/exterior_main.webp',
  '/images/products/camping_car/exterior_front_side.jpg',
  '/images/products/camping_car/interior_living.jpg',
  '/images/products/camping_car/bedroom.jpg',
  '/images/products/camping_car/kitchen.jpg',
  '/images/products/camping_car/bathroom.jpg',
]

const GALLERY_LABELS = [
  'Exterieur face', 'Exterieur lateral', 'Salon', 'Chambre', 'Cuisine', 'Salle de bain',
]

const AREAS = [
  {
    title: 'Chambre',
    icon: '🛏',
    features: ['Lit double 140x200', 'Rangements integres', 'Eclairage LED', 'Prises USB'],
  },
  {
    title: 'Salle de bain',
    icon: '🚿',
    features: ['Douche italienne', 'WC chimique / raccordable', 'Lavabo + miroir', 'Chauffe-eau instantane'],
  },
  {
    title: 'Cuisine',
    icon: '🍳',
    features: ['Plaque 2 feux induction', 'Evier inox', 'Refrigerateur 90L', 'Plan de travail + rangements'],
  },
  {
    title: 'Salon / Sejour',
    icon: '🛋',
    features: ['Banquette convertible', 'Table rabattable', 'Fenêtres panoramiques', 'Climatisation reversible'],
  },
]

const SPECS = [
  { label: 'Dimensions', value: '7.5m x 2.5m x 3.2m (L x l x H)' },
  { label: 'Surface', value: '~18 m2 habitable' },
  { label: 'Structure', value: 'Chassis acier galvanise + caisse aluminium' },
  { label: 'Isolation', value: 'PU 50mm murs + 75mm toiture' },
  { label: 'Electrique', value: '220V + 12V, tableau divisionnaire' },
  { label: 'Eau', value: 'Reservoir 200L eau propre + 100L eaux grises' },
  { label: 'Chauffage/Clim', value: 'Split AC reversible 9000 BTU' },
  { label: 'Fenêtres', value: 'Double vitrage aluminium' },
  { label: 'Poids', value: '~3 500 kg' },
]

const SHIPPING_LABELS: Record<string, string> = {
  martinique: 'Martinique',
  guadeloupe: 'Guadeloupe',
  guyane: 'Guyane',
  reunion: 'Reunion',
  mayotte: 'Mayotte',
}

export default function CampingCarPage() {
  const { role } = useAuth()
  const [selectedImage, setSelectedImage] = useState(0)

  const prix = calculerPrix(CAMPING_CAR_PRIX_ACHAT, role)

  return (
    <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #1A3055 50%, #2A4F7F 100%)`,
        padding: '48px 24px 40px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/camping-car/hero_bg.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1,
        }} />
        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block', background: 'rgba(232,145,58,0.25)',
            border: '1px solid rgba(232,145,58,0.5)',
            color: '#FCD49A', padding: '4px 14px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '600', letterSpacing: '0.8px',
            textTransform: 'uppercase', marginBottom: '14px',
          }}>
            Produit exclusif
          </span>
          <h1 style={{ color: C.white, fontSize: '38px', fontWeight: '800', margin: '0 0 10px' }}>
            Camping-Car Deluxe
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '16px', margin: 0, lineHeight: 1.6 }}>
            Tiny house mobile tout confort. Chambre, cuisine, salon et salle de bain.
            Autonome ou raccordable.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

          {/* ── LEFT ──────────────────────────────────── */}
          <div>
            {/* Gallery */}
            <div style={{
              background: C.white, borderRadius: '14px', overflow: 'hidden',
              border: `1px solid ${C.gray200}`, marginBottom: '24px',
            }}>
              <div style={{ height: '400px', background: C.gray100, position: 'relative' }}>
                <img
                  src={GALLERY[selectedImage]}
                  alt={GALLERY_LABELS[selectedImage]}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                    el.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:64px">🚐</div>'
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{
                  position: 'absolute', bottom: '12px', left: '12px',
                  background: 'rgba(0,0,0,0.6)', color: C.white,
                  padding: '4px 10px', borderRadius: '6px',
                  fontSize: '12px', fontWeight: '600',
                }}>
                  {GALLERY_LABELS[selectedImage]}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto' }}>
                {GALLERY.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: '72px', height: '52px', borderRadius: '6px', flexShrink: 0,
                      border: selectedImage === i ? `2px solid ${C.orange}` : `1px solid ${C.gray200}`,
                      overflow: 'hidden', cursor: 'pointer', padding: 0, background: C.gray100,
                    }}
                  >
                    <img
                      src={img} alt={GALLERY_LABELS[i]}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Areas / Rooms */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
              marginBottom: '24px',
            }}>
              {AREAS.map(area => (
                <div key={area.title} style={{
                  background: C.white, borderRadius: '14px', padding: '20px',
                  border: `1px solid ${C.gray200}`,
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{area.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 10px' }}>
                    {area.title}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {area.features.map(f => (
                      <li key={f} style={{ fontSize: '12px', color: C.gray700, padding: '2px 0', display: 'flex', gap: '6px' }}>
                        <span style={{ color: C.green, fontWeight: '700' }}>+</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Specs */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '24px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.navy, margin: '0 0 16px' }}>
                Specifications techniques
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {SPECS.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: '10px 0', fontSize: '13px', fontWeight: '600', color: C.gray500, width: '140px' }}>
                        {s.label}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: '13px', color: C.gray700 }}>
                        {s.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Video placeholder */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.navy, margin: '0 0 16px' }}>
                Video de presentation
              </h3>
              <div style={{
                height: '280px', background: C.gray100, borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '12px',
              }}>
                <span style={{ fontSize: '48px' }}>🎬</span>
                <span style={{ fontSize: '14px', color: C.gray500 }}>Video a venir</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Price + Shipping ───────────────── */}
          <div style={{ position: 'sticky', top: '80px' }}>
            {/* Price card */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <div style={{
                display: 'inline-block',
                background: C.orange, color: C.white,
                padding: '3px 10px', borderRadius: '6px',
                fontSize: '11px', fontWeight: '700', marginBottom: '12px',
              }}>
                Camping-Car Deluxe
              </div>
              {prix.montant !== null ? (
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: C.navy }}>
                    {formatPrix(prix.montant)}
                    <span style={{ fontSize: '13px', fontWeight: '500', color: C.gray500, marginLeft: '6px' }}>HT</span>
                  </div>
                  <div style={{ fontSize: '14px', color: C.orange, fontWeight: '600', marginBottom: '4px' }}>
                    {formatYuan(eurToYuan(prix.montant))}
                  </div>
                  <span style={{ fontSize: '12px', color: C.gray500 }}>{prix.label}</span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: C.gray500 }}>Connectez-vous pour voir le prix</span>
              )}
            </div>

            {/* Shipping */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                Transport maritime
              </h3>
              {Object.entries(CAMPING_CAR_SHIPPING).map(([key, cost]) => (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: `1px solid ${C.gray100}`,
                  fontSize: '13px',
                }}>
                  <span style={{ color: C.gray700 }}>{SHIPPING_LABELS[key] || key}</span>
                  <span style={{ fontWeight: '700', color: cost ? C.navy : C.orange }}>
                    {cost ? formatPrix(cost) : 'Sur devis'}
                  </span>
                </div>
              ))}
            </div>

            {/* Highlights */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                Points forts
              </h3>
              {[
                'Tout confort (4 espaces de vie)',
                'Autonome ou raccordable aux reseaux',
                'Climatisation reversible',
                'Transport conteneur 40ft',
                'Pret a vivre des la livraison',
              ].map(pt => (
                <div key={pt} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 0', fontSize: '13px', color: C.gray700,
                }}>
                  <span style={{ color: C.green, fontWeight: '700' }}>+</span> {pt}
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="https://wa.me/33663284908?text=Bonjour, je suis interesse par le Camping-Car Deluxe."
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center',
                padding: '16px', background: C.green, color: C.white,
                borderRadius: '12px', fontWeight: '700', fontSize: '16px',
                textDecoration: 'none',
              }}
            >
              Demander un devis
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
