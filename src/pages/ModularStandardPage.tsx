/**
 * ModularStandardPage — Maisons modulaires Standard
 * 3 tailles: 20ft, 30ft, 40ft avec options
 */
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { calculerPrix, formatPrix, eurToYuan, formatYuan } from '@/utils/calculPrix'
import { MODULAR_STANDARD_SIZES, MODULAR_OPTIONS_PRIX } from '@/data/pricing'

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

const FEATURES = [
  'Structure en acier galvanise',
  'Isolation thermique standard',
  'Cuisine equipee basique (evier, plan de travail, rangements)',
  'Salle de bain complete (douche, WC, lavabo)',
  'Revetement sol PVC',
  'Fenêtres double vitrage aluminium',
  'Porte d\'entree securisee',
  'Installation electrique aux normes',
  'Plomberie complete',
]

const OPTIONS = [
  { key: 'extra_room', label: 'Piece supplementaire', desc: 'Ajout d\'une cloison pour creer une piece', prix: MODULAR_OPTIONS_PRIX.extra_room },
  { key: 'ac', label: 'Climatisation', desc: 'Split AC reversible chaud/froid', prix: MODULAR_OPTIONS_PRIX.ac },
  { key: 'solar', label: 'Kit solaire integre', desc: 'Panneaux + onduleur + batterie', prix: MODULAR_OPTIONS_PRIX.solar },
  { key: 'furniture', label: 'Pack mobilier', desc: 'Mobilier complet (lit, canape, table, chaises)', prix: MODULAR_OPTIONS_PRIX.furniture },
]

const SPECS = [
  { label: 'Structure', value: 'Acier galvanise Q235B' },
  { label: 'Murs', value: 'Panneaux sandwich EPS 50mm' },
  { label: 'Toiture', value: 'Panneau sandwich + membrane etanche' },
  { label: 'Sol', value: 'Plancher MGO + revetement PVC' },
  { label: 'Fenêtres', value: 'Aluminium double vitrage' },
  { label: 'Electrique', value: '220V / 50Hz, tableau divisionnaire' },
  { label: 'Plomberie', value: 'PVC + PPR, raccordement standard' },
  { label: 'Duree de vie', value: '> 25 ans' },
]

const SHIPPING_DESTINATIONS = [
  { label: 'Martinique', key: 'martinique' as const },
  { label: 'Guadeloupe', key: 'guadeloupe' as const },
]

export default function ModularStandardPage() {
  const { role } = useAuth()
  const [selectedSize, setSelectedSize] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({})
  const [selectedImage, setSelectedImage] = useState(0)

  const size = MODULAR_STANDARD_SIZES[selectedSize]

  // Calculate total prix_achat
  const optionsTotal = OPTIONS.reduce((sum, opt) => {
    return sum + (selectedOptions[opt.key] ? opt.prix : 0)
  }, 0)
  const totalPrixAchat = size.prixAchat + optionsTotal

  const prix = calculerPrix(totalPrixAchat, role)

  const galleryImages = [
    '/images/products/modular_standard/exterior_1.jpeg',
    '/images/products/modular_standard/exterior_2.jpeg',
    '/images/products/modular_standard/exterior_3.jpeg',
    '/images/products/modular_standard/exterior_4.jpeg',
  ]

  function toggleOption(key: string) {
    setSelectedOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.green} 100%)`,
        padding: '48px 24px 40px', textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-block', background: 'rgba(255,255,255,0.15)',
          padding: '4px 14px', borderRadius: '20px',
          fontSize: '12px', fontWeight: '600', color: C.white,
          letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '14px',
        }}>
          Gamme Standard
        </span>
        <h1 style={{ color: C.white, fontSize: '36px', fontWeight: '800', margin: '0 0 10px' }}>
          Maison Modulaire Standard
        </h1>
        <p style={{ color: '#CBD5E1', fontSize: '16px', margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          La solution economique pour votre habitat modulaire. Cuisine, salle de bain et finitions de qualite.
        </p>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px', alignItems: 'start' }}>

          {/* ── LEFT: Gallery + Specs ─────────────────── */}
          <div>
            {/* Gallery */}
            <div style={{
              background: C.white, borderRadius: '14px', overflow: 'hidden',
              border: `1px solid ${C.gray200}`, marginBottom: '24px',
            }}>
              <div style={{ height: '360px', background: C.gray100, position: 'relative' }}>
                <img
                  src={galleryImages[selectedImage]}
                  alt={`Standard ${size.name}`}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                    el.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:64px">🏠</div>'
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: '64px', height: '48px', borderRadius: '6px',
                      border: selectedImage === i ? `2px solid ${C.green}` : `1px solid ${C.gray200}`,
                      overflow: 'hidden', cursor: 'pointer', padding: 0, background: C.gray100,
                    }}
                  >
                    <img
                      src={img} alt=""
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '24px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.navy, margin: '0 0 16px' }}>
                Caracteristiques incluses
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: C.gray700 }}>
                    <span style={{ color: C.green, fontWeight: '700', flexShrink: 0 }}>+</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs table */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`,
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
          </div>

          {/* ── RIGHT: Configurator ───────────────────── */}
          <div style={{ position: 'sticky', top: '80px' }}>
            {/* Size selector */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                Choisissez votre taille
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MODULAR_STANDARD_SIZES.map((s, i) => {
                  const sp = calculerPrix(s.prixAchat, role)
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSize(i); setSelectedImage(0) }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 16px', borderRadius: '10px',
                        border: selectedSize === i ? `2px solid ${C.green}` : `1px solid ${C.gray200}`,
                        background: selectedSize === i ? '#F0FFF4' : C.white,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: C.navy }}>{s.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {sp.montant !== null ? (
                          <>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: C.navy }}>
                              {formatPrix(sp.montant)} <span style={{ fontSize: '11px', fontWeight: '500', color: C.gray500 }}>HT</span>
                            </div>
                            <div style={{ fontSize: '11px', color: C.orange, fontWeight: '600' }}>
                              {formatYuan(eurToYuan(sp.montant))}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: C.gray500 }}>Connectez-vous</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Options */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                Options
              </h3>
              {OPTIONS.map(opt => {
                const optPrix = calculerPrix(opt.prix, role)
                return (
                  <label
                    key={opt.key}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 0', cursor: 'pointer',
                      borderBottom: `1px solid ${C.gray100}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedOptions[opt.key]}
                      onChange={() => toggleOption(opt.key)}
                      style={{ marginTop: '3px', accentColor: C.green }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: C.gray700 }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: C.gray500 }}>{opt.desc}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: opt.prix === 0 ? C.green : C.navy, whiteSpace: 'nowrap' }}>
                      {opt.prix === 0 ? 'Inclus' : (optPrix.montant !== null ? `+ ${formatPrix(optPrix.montant)}` : '---')}
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Shipping estimator */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                Estimation transport maritime
              </h3>
              {SHIPPING_DESTINATIONS.map(dest => {
                const cost = size.shipping[dest.key]
                return (
                  <div key={dest.key} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: `1px solid ${C.gray100}`,
                    fontSize: '13px',
                  }}>
                    <span style={{ color: C.gray700 }}>{dest.label}</span>
                    <span style={{ fontWeight: '700', color: C.navy }}>
                      {cost ? formatPrix(cost) : 'Sur devis'}
                    </span>
                  </div>
                )
              })}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', fontSize: '13px',
              }}>
                <span style={{ color: C.gray700 }}>Autres destinations</span>
                <span style={{ fontWeight: '600', color: C.orange }}>Sur devis</span>
              </div>
            </div>

            {/* Total + CTA */}
            <div style={{
              background: C.navy, borderRadius: '14px', padding: '24px',
              color: C.white,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Total {size.name}</span>
                {prix.montant !== null ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>
                      {formatPrix(prix.montant)} <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.7 }}>HT</span>
                    </div>
                    <div style={{ fontSize: '13px', color: C.orange, fontWeight: '600' }}>
                      {formatYuan(eurToYuan(prix.montant))}
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', opacity: 0.7 }}>Connectez-vous</span>
                )}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '16px' }}>
                {prix.label} — Hors transport
              </div>
              <a
                href={`https://wa.me/33663284908?text=Bonjour, je souhaite un devis pour une maison modulaire Standard ${size.name}.`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px', background: C.green, color: C.white,
                  borderRadius: '10px', fontWeight: '700', fontSize: '15px',
                  textDecoration: 'none',
                }}
              >
                Demander un devis
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
