/**
 * AccessoiresPage — Catalogue accessoires mini-pelles
 * Fetches from Firestore where categorie == 'accessoires'
 * Falls back to hardcoded data if Firestore returns empty.
 */
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ACCESSOIRES_PRIX } from '@/data/pricing'
import { formatPrix, eurToYuan, MULTIPLICATEURS } from '@/utils/calculPrix'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import type { UserRole } from '@/types'

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

const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSIxNjAiIHk9IjEyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='

// ── Hardcoded fallback accessories ───────────────────────
interface Accessoire {
  id: string
  nom: string
  prix_achat: number
  image: string
  compatibles: string[]
}

const FALLBACK_ACCESSOIRES: Accessoire[] = [
  {
    id: 'godet-dents',
    nom: 'Godet dente',
    prix_achat: ACCESSOIRES_PRIX['godet-dents'],
    image: '/images/accessories/godet_dents.webp',
    compatibles: ['R18', 'R22', 'R32', 'R57'],
  },
  {
    id: 'godet-lisse',
    nom: 'Godet lisse',
    prix_achat: ACCESSOIRES_PRIX['godet-lisse'],
    image: '/images/accessories/godet_lisse.webp',
    compatibles: ['R18', 'R22', 'R32', 'R57'],
  },
  {
    id: 'godet-cribleur',
    nom: 'Godet cribleur',
    prix_achat: ACCESSOIRES_PRIX['godet-cribleur'],
    image: '/images/accessories/godet_cribleur.webp',
    compatibles: ['R22', 'R32', 'R57'],
  },
  {
    id: 'godet-inclinable',
    nom: 'Godet inclinable',
    prix_achat: ACCESSOIRES_PRIX['godet-inclinable'],
    image: '/images/accessories/godet_inclinable.webp',
    compatibles: ['R22', 'R32', 'R57'],
  },
  {
    id: 'marteau-hydraulique',
    nom: 'Marteau hydraulique',
    prix_achat: ACCESSOIRES_PRIX['marteau-hydraulique'],
    image: '/images/accessories/marteau_hydraulique.webp',
    compatibles: ['R22', 'R32', 'R57'],
  },
  {
    id: 'tariere',
    nom: 'Tariere',
    prix_achat: ACCESSOIRES_PRIX['tariere'],
    image: '/images/accessories/tariere.webp',
    compatibles: ['R22', 'R32', 'R57'],
  },
  {
    id: 'grappin',
    nom: 'Grappin',
    prix_achat: ACCESSOIRES_PRIX['grappin'],
    image: '/images/accessories/grappin.webp',
    compatibles: ['R32', 'R57'],
  },
  {
    id: 'fourche',
    nom: 'Fourche',
    prix_achat: ACCESSOIRES_PRIX['fourche'],
    image: '/images/accessories/fourche.webp',
    compatibles: ['R18', 'R22', 'R32', 'R57'],
  },
]

// ── Price calculation using MULTIPLICATEURS ──────────────
function calculerPrix(
  prixAchat: number,
  role: UserRole
): { montant: number | null; label: string; prixPublic: number } {
  const prixPublic = prixAchat * MULTIPLICATEURS.user
  switch (role) {
    case 'user':
      return { montant: prixAchat * MULTIPLICATEURS.user, label: 'Prix HT', prixPublic }
    case 'partner':
      return { montant: prixAchat * MULTIPLICATEURS.partner, label: 'Prix partenaire HT', prixPublic }
    case 'vip':
      return { montant: prixAchat * MULTIPLICATEURS.vip, label: 'Prix negocie HT', prixPublic }
    case 'admin':
      return { montant: prixAchat, label: 'Prix achat HT', prixPublic }
    default:
      return { montant: null, label: 'Connectez-vous', prixPublic }
  }
}

// ── Component ────────────────────────────────────────────
export default function AccessoiresPage() {
  const { role } = useAuth()
  const { addToCart } = useCart()
  const [accessoires, setAccessoires] = useState<Accessoire[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAccessoires() {
      setLoading(true)
      try {
        const q = query(collection(db, 'products'), where('categorie', '==', 'accessoires'))
        const snap = await getDocs(q)
        const data: Accessoire[] = snap.docs
          .map(d => {
            const raw = d.data()
            return {
              id: d.id,
              nom: raw.nom ?? d.id,
              prix_achat: raw.prix_achat ?? ACCESSOIRES_PRIX[d.id] ?? 0,
              image: raw.images?.[0] ?? PLACEHOLDER,
              compatibles: raw.compatibles ?? ['R18', 'R22', 'R32', 'R57'],
            }
          })
          .filter(a => a.prix_achat > 0)

        setAccessoires(data.length > 0 ? data : FALLBACK_ACCESSOIRES)
      } catch (err) {
        console.error('Erreur chargement accessoires:', err)
        setAccessoires(FALLBACK_ACCESSOIRES)
      } finally {
        setLoading(false)
      }
    }
    fetchAccessoires()
  }, [])

  function handleAddToCart(acc: Accessoire) {
    const prix = calculerPrix(acc.prix_achat, role)
    if (prix.montant == null) return

    addToCart({
      id: acc.id,
      name: acc.nom,
      prixAchat: acc.prix_achat,
      prixUnitaire: prix.montant,
      image: acc.image,
      type: 'accessory',
    })

    setAddedId(acc.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Responsive media queries ──────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .acc-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .acc-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

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
          backgroundImage: 'url(/images/portal/accessoires_hero.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1,
        }} />
        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(232,145,58,0.25)',
            border: '1px solid rgba(232,145,58,0.5)',
            color: '#FCD49A',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Equipements compatibles Rippa
          </span>
          <h1 style={{
            color: C.white, fontSize: '42px', fontWeight: '800',
            margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.15,
          }}>
            Accessoires Mini-pelles
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '17px', margin: 0, lineHeight: 1.6 }}>
            Godets, marteaux hydrauliques, tarieres, grappins et fourches.
            Compatibles avec toute la gamme Rippa R18 a R57 PRO.
          </p>
        </div>
      </section>

      {/* ── GRILLE ──────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 60px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: C.gray500 }}>
            Chargement des accessoires...
          </div>
        ) : accessoires.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: C.gray500 }}>
            Aucun accessoire disponible pour le moment.
          </div>
        ) : (
          <div
            className="acc-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
            }}
          >
            {accessoires.map(acc => {
              const prix = calculerPrix(acc.prix_achat, role)
              const hovered = hoveredId === acc.id
              const justAdded = addedId === acc.id

              return (
                <div
                  key={acc.id}
                  onMouseEnter={() => setHoveredId(acc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: C.white,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: `1px solid ${C.gray200}`,
                    boxShadow: hovered
                      ? '0 12px 32px rgba(27,42,74,0.15)'
                      : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Image */}
                  <div style={{
                    height: '200px',
                    background: C.gray100,
                    overflow: 'hidden',
                  }}>
                    <img
                      src={acc.image}
                      alt={acc.nom}
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      margin: '0 0 8px',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: C.gray900,
                    }}>
                      {acc.nom}
                    </h3>

                    {/* Compatible models */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                      {acc.compatibles.map(model => (
                        <span key={model} style={{
                          background: `${C.navy}10`,
                          color: C.navy,
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          letterSpacing: '0.3px',
                        }}>
                          {model}
                        </span>
                      ))}
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Price */}
                    <div style={{ marginBottom: '16px' }}>
                      {prix.montant != null ? (
                        <>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            color: C.green,
                            lineHeight: 1.2,
                          }}>
                            {formatPrix(prix.montant)}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: C.gray500,
                            marginTop: '2px',
                          }}>
                            {prix.label} | ~{eurToYuan(prix.montant)} RMB
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: C.navy,
                            lineHeight: 1.2,
                          }}>
                            {formatPrix(prix.prixPublic)}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: C.orange,
                            fontWeight: '600',
                            marginTop: '4px',
                          }}>
                            Connectez-vous pour votre prix
                          </div>
                        </>
                      )}
                    </div>

                    {/* Ajouter au panier */}
                    <button
                      onClick={() => handleAddToCart(acc)}
                      disabled={prix.montant == null}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: justAdded
                          ? C.green
                          : prix.montant != null
                            ? C.orange
                            : C.gray200,
                        color: prix.montant != null ? C.white : C.gray500,
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: prix.montant != null ? 'pointer' : 'default',
                        transition: 'background 0.2s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      {justAdded ? 'Ajoute !' : 'Ajouter au panier'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
