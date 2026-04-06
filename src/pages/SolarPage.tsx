/**
 * SolarPage — Kits solaires landing page
 * 3 kits: 10kW, 12kW, 20kW
 */
import { useState } from 'react'
import { Link } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { calculerPrix, formatPrix, eurToYuan, formatYuan } from '@/utils/calculPrix'
import { SOLAIRE_PRIX } from '@/data/pricing'

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
  yellow: '#F59E0B',
}

const KITS = [
  {
    id: 'kit-solaire-10kw',
    slug: 'kit-solaire-10kw',
    name: 'Kit Solaire 10 kW',
    power: '10 kW',
    prixAchat: SOLAIRE_PRIX['kit-solaire-10kw'],
    panels: '18 panneaux Jinko Tiger Neo 580W',
    inverter: 'Onduleur Deye SUN-10K-SG04LP3',
    battery: 'Batterie LiFePO4 10.24 kWh',
    image: '/images/solar/kit_overview.webp',
    highlight: false,
  },
  {
    id: 'kit-solaire-12kw',
    slug: 'kit-solaire-12kw',
    name: 'Kit Solaire 12 kW',
    power: '12 kW',
    prixAchat: SOLAIRE_PRIX['kit-solaire-12kw'],
    panels: '21 panneaux Jinko Tiger Neo 580W',
    inverter: 'Onduleur Deye SUN-12K-SG04LP3',
    battery: 'Batterie LiFePO4 10.24 kWh',
    image: '/images/solar/panel_detail.webp',
    highlight: true,
  },
  {
    id: 'kit-solaire-20kw',
    slug: 'kit-solaire-20kw',
    name: 'Kit Solaire 20 kW',
    power: '20 kW',
    prixAchat: SOLAIRE_PRIX['kit-solaire-20kw'],
    panels: '35 panneaux Jinko Tiger Neo 580W',
    inverter: 'Onduleur Deye SUN-20K-SG01HP3',
    battery: 'Batterie LiFePO4 20.48 kWh',
    image: '/images/solar/deye_inverter.webp',
    highlight: false,
  },
]

const BENEFITS = [
  {
    icon: '☀️',
    title: 'Ensoleillement exceptionnel',
    desc: 'Les DOM-TOM beneficient de plus de 2 500 heures de soleil par an, ideal pour le solaire.',
  },
  {
    icon: '💰',
    title: 'Economies immediates',
    desc: 'Reduisez votre facture EDF de 50 a 90% des la premiere annee d\'installation.',
  },
  {
    icon: '🔋',
    title: 'Autonomie energetique',
    desc: 'Batteries LiFePO4 pour stocker l\'energie et etre autonome meme la nuit.',
  },
  {
    icon: '🏆',
    title: 'Marques premium',
    desc: 'Jinko Tiger Neo (Tier 1 mondial) + onduleurs hybrides Deye, garantis 10 ans minimum.',
  },
  {
    icon: '🔧',
    title: 'Kit complet',
    desc: 'Panneaux + onduleur + batterie + cables + structure de fixation. Pret a installer.',
  },
  {
    icon: '🌍',
    title: 'Ecologie',
    desc: 'Reduisez votre empreinte carbone et participez a la transition energetique des DOM-TOM.',
  },
]

export default function SolarPage() {
  const { role } = useAuth()
  const [hoveredKit, setHoveredKit] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #1A3055 50%, #2D5A3D 100%)`,
        padding: '64px 24px 56px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/portal/solar_panel.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1,
        }} />
        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(245,158,11,0.25)', border: '1px solid rgba(245,158,11,0.5)',
            color: '#FDE68A', padding: '4px 14px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '600', letterSpacing: '0.8px',
            textTransform: 'uppercase', marginBottom: '16px',
          }}>
            Energie solaire DOM-TOM
          </span>
          <h1 style={{
            color: C.white, fontSize: '40px', fontWeight: '800',
            margin: '0 0 12px', letterSpacing: '-0.5px',
          }}>
            Kits Solaires Complets
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '17px', margin: 0, lineHeight: 1.6 }}>
            Panneaux Jinko Tiger Neo + onduleurs Deye. De 10 a 20 kW.
            Livraison conteneur vers tous les DOM-TOM.
          </p>
        </div>
      </section>

      {/* ── KITS GRID ─────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '-32px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {KITS.map(kit => {
            const prix = calculerPrix(kit.prixAchat, role)
            const hovered = hoveredKit === kit.id
            return (
              <div
                key={kit.id}
                onMouseEnter={() => setHoveredKit(kit.id)}
                onMouseLeave={() => setHoveredKit(null)}
                style={{
                  background: C.white, borderRadius: '16px', overflow: 'hidden',
                  border: kit.highlight ? `2px solid ${C.orange}` : `1px solid ${C.gray200}`,
                  boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s', transform: hovered ? 'translateY(-6px)' : 'none',
                  display: 'flex', flexDirection: 'column', position: 'relative',
                }}
              >
                {kit.highlight && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 2,
                    background: C.orange, color: C.white,
                    padding: '4px 12px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    POPULAIRE
                  </div>
                )}

                <div style={{ height: '200px', overflow: 'hidden', background: C.gray100 }}>
                  <img
                    src={kit.image}
                    alt={kit.name}
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
                    background: C.yellow + '20', color: C.yellow,
                    padding: '2px 10px', borderRadius: '6px',
                    fontSize: '13px', fontWeight: '700', marginBottom: '10px',
                  }}>
                    {kit.power}
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: C.navy, margin: '0 0 12px' }}>
                    {kit.name}
                  </h3>

                  <div style={{ fontSize: '13px', color: C.gray700, marginBottom: '6px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: C.green, fontWeight: '700' }}>+</span> {kit.panels}
                  </div>
                  <div style={{ fontSize: '13px', color: C.gray700, marginBottom: '6px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: C.green, fontWeight: '700' }}>+</span> {kit.inverter}
                  </div>
                  <div style={{ fontSize: '13px', color: C.gray700, marginBottom: '16px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: C.green, fontWeight: '700' }}>+</span> {kit.battery}
                  </div>

                  <div style={{ flex: 1 }} />

                  {/* Prix */}
                  <div style={{ marginBottom: '14px' }}>
                    {prix.montant !== null ? (
                      <div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: C.navy }}>
                          {formatPrix(prix.montant)}
                          <span style={{ fontSize: '12px', fontWeight: '500', color: C.gray500, marginLeft: '4px' }}>HT</span>
                        </div>
                        <div style={{ fontSize: '12px', color: C.orange, fontWeight: '600' }}>
                          {formatYuan(eurToYuan(prix.montant))}
                        </div>
                        <span style={{ fontSize: '11px', color: C.gray500 }}>{prix.label}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: C.gray500 }}>Connectez-vous pour voir le prix</span>
                    )}
                  </div>

                  <Link href={`/solaire/${kit.slug}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                      width: '100%', padding: '12px',
                      background: kit.highlight ? C.orange : C.navy, color: C.white,
                      border: 'none', borderRadius: '8px',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    }}>
                      Voir le detail du kit
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BRANDS ────────────────────────────────────── */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '56px 20px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: C.navy, marginBottom: '8px' }}>
          Des marques de reference mondiale
        </h2>
        <p style={{ fontSize: '14px', color: C.gray500, marginBottom: '32px' }}>
          Nous selectionnons les meilleurs fabricants Tier 1 pour garantir performance et durabilite.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '100px', height: '60px', background: C.white,
              borderRadius: '10px', border: `1px solid ${C.gray200}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', color: C.navy, marginBottom: '8px',
            }}>
              Jinko Solar
            </div>
            <span style={{ fontSize: '12px', color: C.gray500 }}>Panneaux Tiger Neo</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '100px', height: '60px', background: C.white,
              borderRadius: '10px', border: `1px solid ${C.gray200}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', color: C.navy, marginBottom: '8px',
            }}>
              Deye
            </div>
            <span style={{ fontSize: '12px', color: C.gray500 }}>Onduleurs hybrides</span>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '26px', fontWeight: '700', color: C.navy, marginBottom: '8px' }}>
          Pourquoi le solaire en DOM-TOM ?
        </h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: C.gray500, marginBottom: '40px' }}>
          Un investissement rentable des la premiere annee.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {BENEFITS.map(b => (
            <div key={b.title} style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`,
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{b.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: C.navy, margin: '0 0 8px' }}>
                {b.title}
              </h3>
              <p style={{ fontSize: '13px', color: C.gray500, margin: 0, lineHeight: 1.6 }}>
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section style={{ background: C.navy, padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ color: C.white, fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>
          Pret a passer au solaire ?
        </h2>
        <p style={{ color: '#CBD5E1', fontSize: '14px', marginBottom: '24px' }}>
          Devis gratuit sous 24h. Livraison en conteneur vers tous les DOM-TOM.
        </p>
        <a
          href="https://wa.me/33663284908?text=Bonjour, je suis interesse par un kit solaire pour les DOM-TOM."
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-block', padding: '14px 36px',
            background: C.orange, color: C.white,
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
