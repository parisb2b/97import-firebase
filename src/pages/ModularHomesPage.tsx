/**
 * ModularHomesPage — Landing page maisons modulaires
 * Standard, Premium, Camping-Car Deluxe
 */
import { useState } from 'react'
import { Link } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { calculerPrix, formatPrix, eurToYuan, formatYuan } from '@/utils/calculPrix'
import {
  MODULAR_STANDARD_SIZES,
  MODULAR_PREMIUM_SIZES,
  CAMPING_CAR_PRIX_ACHAT,
} from '@/data/pricing'

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

const COMPARISON = [
  { feature: 'Surface habitable',       standard: '37 - 74 m2',      premium: '37 - 74 m2' },
  { feature: 'Tailles disponibles',     standard: '20, 30, 40 pieds', premium: '20, 30, 40 pieds' },
  { feature: 'Finitions',               standard: 'Basiques',         premium: 'Haut de gamme' },
  { feature: 'Cuisine equipee',         standard: 'Standard',         premium: 'Premium + ilot' },
  { feature: 'Salle de bain',           standard: '1 SDB standard',   premium: '1 SDB luxe + douche italienne' },
  { feature: 'Isolation',               standard: 'Standard',         premium: 'Renforcee thermique + phonique' },
  { feature: 'Design exterieur',        standard: 'Classique',        premium: 'Moderne / bardage bois' },
  { feature: 'Climatisation',           standard: 'Option (1 923 EUR)',premium: 'Incluse' },
  { feature: 'Prix a partir de (achat)',standard: '4 308 EUR HT',     premium: '7 631 EUR HT' },
]

export default function ModularHomesPage() {
  const { role } = useAuth()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  function prixDisplay(prixAchat: number) {
    const p = calculerPrix(prixAchat, role)
    if (p.montant === null) return { eur: 'Connectez-vous', rmb: '', label: '' }
    return {
      eur: formatPrix(p.montant),
      rmb: formatYuan(eurToYuan(p.montant)),
      label: p.label,
    }
  }

  const stdFrom = prixDisplay(MODULAR_STANDARD_SIZES[0].prixAchat)
  const premFrom = prixDisplay(MODULAR_PREMIUM_SIZES[0].prixAchat)
  const ccPrix = prixDisplay(CAMPING_CAR_PRIX_ACHAT)

  const CARDS = [
    {
      id: 'standard',
      title: 'Maison Standard',
      subtitle: 'Le meilleur rapport qualite-prix',
      image: '/images/products/modular_standard/exterior_1.jpeg',
      prixLabel: `A partir de ${stdFrom.eur} HT`,
      prixRmb: stdFrom.rmb,
      link: '/maisons/standard',
      color: C.green,
      features: ['20, 30 ou 40 pieds', 'Cuisine + SDB', 'Finitions basiques', 'Livrable DOM-TOM'],
    },
    {
      id: 'premium',
      title: 'Maison Premium',
      subtitle: 'Design moderne, finitions haut de gamme',
      image: '/images/products/modular_premium/exterior_1.jpg',
      prixLabel: `A partir de ${premFrom.eur} HT`,
      prixRmb: premFrom.rmb,
      link: '/maisons/premium',
      color: C.orange,
      features: ['20, 30 ou 40 pieds', 'Cuisine premium + ilot', 'Isolation renforcee', 'Bardage bois moderne'],
    },
    {
      id: 'camping-car',
      title: 'Camping-Car Deluxe',
      subtitle: 'Tiny house mobile tout confort',
      image: '/images/products/camping_car/exterior_main.webp',
      prixLabel: `${ccPrix.eur} HT`,
      prixRmb: ccPrix.rmb,
      link: '/maisons/camping-car',
      color: C.navy,
      features: ['Chambre + SDB', 'Cuisine equipee', 'Salon', 'Autonome / raccordable'],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #34567A 100%)`,
        padding: '64px 24px 56px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/portal/modular_home.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.08,
        }} />
        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(232,145,58,0.25)', border: '1px solid rgba(232,145,58,0.5)',
            color: '#FCD49A', padding: '4px 14px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '600', letterSpacing: '0.8px',
            textTransform: 'uppercase', marginBottom: '16px',
          }}>
            Habitation modulaire
          </span>
          <h1 style={{
            color: C.white, fontSize: '40px', fontWeight: '800',
            margin: '0 0 12px', letterSpacing: '-0.5px',
          }}>
            Maisons Modulaires
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '17px', margin: 0, lineHeight: 1.6 }}>
            Standard ou Premium, de 37 a 74 m2. Livrees en conteneur, assemblage rapide.
            Ideales pour les DOM-TOM.
          </p>
        </div>
      </section>

      {/* ── CARDS ─────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '-32px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {CARDS.map(card => {
            const hovered = hoveredCard === card.id
            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: C.white, borderRadius: '16px', overflow: 'hidden',
                  border: `1px solid ${C.gray200}`,
                  boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s', transform: hovered ? 'translateY(-6px)' : 'none',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ height: '200px', overflow: 'hidden', background: C.gray100 }}>
                  <img
                    src={card.image}
                    alt={card.title}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement
                      el.style.display = 'none'
                    }}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      transition: 'transform 0.5s',
                      transform: hovered ? 'scale(1.06)' : 'scale(1)',
                    }}
                  />
                </div>
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'inline-block', width: 'fit-content',
                    background: card.color, color: C.white,
                    padding: '2px 10px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: '700', marginBottom: '10px',
                  }}>
                    {card.id === 'camping-car' ? 'Camping-Car' : card.id.charAt(0).toUpperCase() + card.id.slice(1)}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: C.navy, margin: '0 0 6px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: C.gray500, margin: '0 0 14px' }}>
                    {card.subtitle}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', flex: 1 }}>
                    {card.features.map(f => (
                      <li key={f} style={{ fontSize: '13px', color: C.gray700, padding: '3px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: C.green, fontWeight: '700' }}>+</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: C.navy }}>{card.prixLabel}</div>
                    {card.prixRmb && (
                      <div style={{ fontSize: '12px', color: C.orange, fontWeight: '600' }}>{card.prixRmb}</div>
                    )}
                  </div>
                  <Link href={card.link} style={{ textDecoration: 'none' }}>
                    <button style={{
                      width: '100%', padding: '12px',
                      background: card.color, color: C.white,
                      border: 'none', borderRadius: '8px',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    }}>
                      Decouvrir
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── COMPARISON TABLE ──────────────────────────── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '56px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '26px', fontWeight: '700', color: C.navy, marginBottom: '8px' }}>
          Standard vs Premium
        </h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: C.gray500, marginBottom: '32px' }}>
          Comparez les deux gammes pour choisir la maison qui vous correspond.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            background: C.white, borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 16px', textAlign: 'left', background: C.navy, color: C.white, fontSize: '13px', fontWeight: '700' }}>
                  Caracteristique
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', background: C.green, color: C.white, fontSize: '13px', fontWeight: '700' }}>
                  Standard
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', background: C.orange, color: C.white, fontSize: '13px', fontWeight: '700' }}>
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: C.gray700 }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: C.gray700, textAlign: 'center' }}>
                    {row.standard}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: C.gray700, textAlign: 'center' }}>
                    {row.premium}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section style={{ background: C.navy, padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ color: C.white, fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>
          Un projet de maison modulaire ?
        </h2>
        <p style={{ color: '#CBD5E1', fontSize: '14px', marginBottom: '24px' }}>
          Contactez-nous pour un devis personnalise avec transport maritime inclus.
        </p>
        <a
          href="https://wa.me/33663284908?text=Bonjour, je suis interesse par une maison modulaire."
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-block', padding: '14px 36px',
            background: C.green, color: C.white,
            borderRadius: '10px', fontWeight: '700', fontSize: '15px',
            textDecoration: 'none',
          }}
        >
          Demander un devis
        </a>
      </section>
    </div>
  )
}
