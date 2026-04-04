/**
 * MiniPellesPage — Catalogue mini-pelles Rippa
 * Fetches from Firestore where categorie == 'mini-pelles'
 */
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Link } from 'wouter'
import { db } from '@/lib/firebase'
import { Product } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { calculerPrix, formatPrix, eurToYuan, formatYuan } from '@/utils/calculPrix'
// MINI_PELLES_PRIX available in '@/data/pricing' as fallback

// ── Design tokens ────────────────────────────────────────
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
  gray900: '#111827',
}

const SPECS: Record<string, { poids: string; profondeur: string; moteur: string; debit: string }> = {
  'r18': { poids: '1 800 kg', profondeur: '2 200 mm', moteur: 'Kubota D902', debit: '38 L/min' },
  'r22': { poids: '2 200 kg', profondeur: '2 600 mm', moteur: 'Kubota D1105', debit: '45 L/min' },
  'r32': { poids: '3 200 kg', profondeur: '3 100 mm', moteur: 'Yanmar 3TNV88', debit: '56 L/min' },
  'r57': { poids: '5 700 kg', profondeur: '3 800 mm', moteur: 'Yanmar 4TNV94', debit: '72 L/min' },
}

const WEIGHT_RANGES = [
  { label: 'Toutes', min: 0, max: 99999 },
  { label: '< 2.5t', min: 0, max: 2500 },
  { label: '2.5t - 4t', min: 2500, max: 4000 },
  { label: '> 4t', min: 4000, max: 99999 },
]

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSIxNjAiIHk9IjEyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='

function getModelKey(nom: string): string {
  const m = nom.toLowerCase().match(/r(\d+)/)
  return m ? `r${m[1]}` : ''
}

export default function MiniPellesPage() {
  const { role } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchModel, setSearchModel] = useState('')
  const [weightRange, setWeightRange] = useState(0) // index into WEIGHT_RANGES
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const q = query(collection(db, 'products'), where('categorie', '==', 'mini-pelles'))
        const snap = await getDocs(q)
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => p.actif !== false)
        setProducts(data)
      } catch (err) {
        console.error('Erreur chargement mini-pelles:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const range = WEIGHT_RANGES[weightRange]
  const filtered = products.filter(p => {
    const key = getModelKey(p.nom)
    if (searchModel && !p.nom.toLowerCase().includes(searchModel.toLowerCase())) return false
    const spec = SPECS[key]
    if (spec) {
      const w = parseInt(spec.poids.replace(/\s/g, ''))
      if (w < range.min || w >= range.max) return false
    }
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #2A4F7F 100%)`,
        padding: '60px 24px 50px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/portal/minipelle_hero.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1,
        }} />
        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(45,125,70,0.25)',
            border: '1px solid rgba(45,125,70,0.5)',
            color: '#6EE7A0',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Marque Rippa -- Importation directe
          </span>
          <h1 style={{
            color: C.white, fontSize: '42px', fontWeight: '800',
            margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.15,
          }}>
            Mini-pelles Rippa
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '17px', margin: 0, lineHeight: 1.6 }}>
            De 1,8 a 5,7 tonnes. Moteurs Kubota et Yanmar. Livraison DOM-TOM incluse sur devis.
          </p>
        </div>
      </section>

      {/* ── FILTRES ─────────────────────────────────────── */}
      <div style={{
        maxWidth: '1100px', margin: '-24px auto 0', padding: '0 20px',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          background: C.white, borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: '16px 20px',
          display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Rechercher un modele (R18, R22...)"
            value={searchModel}
            onChange={e => setSearchModel(e.target.value)}
            style={{
              flex: 1, minWidth: '200px', padding: '10px 14px',
              border: `1px solid ${C.gray200}`, borderRadius: '8px',
              fontSize: '14px', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {WEIGHT_RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setWeightRange(i)}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  border: weightRange === i ? 'none' : `1px solid ${C.gray200}`,
                  background: weightRange === i ? C.navy : C.white,
                  color: weightRange === i ? C.white : C.gray700,
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRILLE ──────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: C.gray500 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: C.gray500 }}>
            Aucune mini-pelle ne correspond a vos criteres.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {filtered.map(p => {
              const key = getModelKey(p.nom)
              const spec = SPECS[key]
              const prix = calculerPrix(p.prix_achat, role)
              const hovered = hoveredId === p.id

              return (
                <div
                  key={p.id}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: C.white, borderRadius: '14px',
                    overflow: 'hidden',
                    border: `1px solid ${C.gray200}`,
                    boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s', transform: hovered ? 'translateY(-4px)' : 'none',
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {/* Image */}
                  <div style={{ height: '210px', overflow: 'hidden', background: C.gray100, position: 'relative' }}>
                    <img
                      src={p.images?.[0] || PLACEHOLDER}
                      alt={p.nom}
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.4s',
                        transform: hovered ? 'scale(1.06)' : 'scale(1)',
                      }}
                    />
                    <span style={{
                      position: 'absolute', top: '10px', left: '10px',
                      background: C.orange, color: C.white,
                      padding: '3px 10px', borderRadius: '6px',
                      fontSize: '11px', fontWeight: '700',
                    }}>
                      Rippa
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: C.navy, margin: '0 0 8px' }}>
                      {p.nom}
                    </h3>

                    {/* Specs */}
                    {spec && (
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
                        marginBottom: '12px', fontSize: '12px', color: C.gray500,
                      }}>
                        <span>Poids: <strong style={{ color: C.gray700 }}>{spec.poids}</strong></span>
                        <span>Prof.: <strong style={{ color: C.gray700 }}>{spec.profondeur}</strong></span>
                        <span>Moteur: <strong style={{ color: C.gray700 }}>{spec.moteur}</strong></span>
                        <span>Debit: <strong style={{ color: C.gray700 }}>{spec.debit}</strong></span>
                      </div>
                    )}

                    {/* Prix */}
                    <div style={{ marginBottom: '14px', flex: 1 }}>
                      {prix.montant === null ? (
                        <span style={{ fontSize: '13px', color: C.gray500 }}>Connectez-vous pour voir le prix</span>
                      ) : (
                        <div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: C.navy }}>
                            {formatPrix(prix.montant)}
                            <span style={{ fontSize: '11px', fontWeight: '500', color: C.gray500, marginLeft: '4px' }}>HT</span>
                          </div>
                          <div style={{ fontSize: '12px', color: C.orange, fontWeight: '600' }}>
                            {formatYuan(eurToYuan(prix.montant))}
                          </div>
                          <span style={{ fontSize: '11px', color: C.gray500 }}>{prix.label}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/produit/${p.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                        <button style={{
                          width: '100%', padding: '10px',
                          background: C.navy, color: C.white,
                          border: 'none', borderRadius: '8px',
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        }}>
                          Voir la fiche
                        </button>
                      </Link>
                      <a
                        href={`https://wa.me/33663284908?text=Bonjour, je suis interesse par la mini-pelle ${encodeURIComponent(p.nom)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          padding: '10px 14px',
                          background: C.green, color: C.white,
                          border: 'none', borderRadius: '8px',
                          fontSize: '12px', fontWeight: '600',
                          textDecoration: 'none', display: 'flex', alignItems: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Devis
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── CTA BOTTOM ──────────────────────────────────── */}
      <section style={{
        background: C.navy, padding: '48px 24px', textAlign: 'center',
      }}>
        <h2 style={{ color: C.white, fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>
          Besoin d'un devis personnalise ?
        </h2>
        <p style={{ color: '#CBD5E1', fontSize: '14px', marginBottom: '24px' }}>
          Transport maritime inclus vers Martinique, Guadeloupe, Guyane, Reunion.
        </p>
        <a
          href="https://wa.me/33663284908?text=Bonjour, je souhaite un devis pour une mini-pelle Rippa."
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '14px 36px',
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
