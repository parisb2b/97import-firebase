/**
 * CataloguePage — Catalogue dynamique depuis Firestore
 * Filtre par catégorie, affiche les images Storage, prix selon rôle
 */
import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Link, useLocation } from 'wouter'
import { db } from '../lib/firebase'
import { Product } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { calculerPrix, formatPrix } from '../utils/calculPrix'
import { LangToggle, useLang } from '../contexts/LanguageContext'
import { useCart } from '../features/cart/CartContext'

// ── Mapping slug URL → categorie Firestore ────────────────
const CAT_MAP: Record<string, string | null> = {
  '/catalogue':    null,
  '/mini-pelles':  'mini-pelles',
  '/maisons':      'maisons',
  '/solaire':      'solaire',
  '/accessoires':  'accessoires',
}

const CAT_LABELS: Record<string, string> = {
  'mini-pelles': 'Mini-pelles',
  'maisons':     'Maisons & Camping-car',
  'solaire':     'Solaire',
  'accessoires': 'Accessoires',
}

const CAT_EMOJIS: Record<string, string> = {
  'mini-pelles': '🚜',
  'maisons':     '🏠',
  'solaire':     '☀️',
  'accessoires': '🔧',
}

// ── Placeholder image ─────────────────────────────────────
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSIxNjAiIHk9IjEyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='

export default function CataloguePage() {
  const [location] = useLocation()
  const { role } = useAuth()
  const { t, lang } = useLang()
  const { count } = useCart()

  const [products, setProducts]       = useState<Product[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(
    CAT_MAP[location] ?? null
  )

  // Sync filtre avec URL
  useEffect(() => {
    const cat = CAT_MAP[location] ?? null
    setActiveFilter(cat)
  }, [location])

  // Fetch Firestore — un seul where pour éviter l'index composite
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        // On filtre par catégorie côté Firestore, actif côté JS
        // (deux where sur champs différents nécessitent un index composite)
        let q
        if (activeFilter) {
          q = query(collection(db, 'products'), where('categorie', '==', activeFilter))
        } else {
          q = query(collection(db, 'products'))
        }
        const snap = await getDocs(q)
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => p.actif !== false)   // filtre actif côté client
        setProducts(data)
      } catch (err) {
        console.error('Erreur chargement produits:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [activeFilter])

  // Prix d'un produit selon rôle
  function getPrix(p: Product) {
    if (p.prix_achat === 0) return null  // accessoire sans prix fixe
    const r = calculerPrix(p.prix_achat, role)
    return r
  }

  const catTitle = activeFilter ? `${CAT_EMOJIS[activeFilter] || ''} ${CAT_LABELS[activeFilter] || activeFilter}` : '🏪 Catalogue complet'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── BANNIÈRE TOP ──────────────────────────────── */}
      <div style={{ background: '#1D4ED8', color: '#fff', textAlign: 'center', padding: '6px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>
        {lang === 'fr' ? '-50% PAR RAPPORT AUX PRIX MARTINIQUE' : '比马提尼克岛零售价低50%'}
      </div>

      {/* ── NAVBAR ────────────────────────────────────── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#1E3A5F' }}>97import</span>
          </Link>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { path: '/catalogue',   label: lang === 'fr' ? 'Tous' : '全部' },
              { path: '/mini-pelles', label: lang === 'fr' ? 'Mini-pelles' : '挖掘机' },
              { path: '/maisons',     label: lang === 'fr' ? 'Maisons' : '房屋' },
              { path: '/solaire',     label: lang === 'fr' ? 'Solaire' : '太阳能' },
              { path: '/accessoires', label: lang === 'fr' ? 'Accessoires' : '配件' },
            ].map(({ path, label }) => (
              <Link key={path} href={path} style={{ textDecoration: 'none' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: (CAT_MAP[location] === CAT_MAP[path]) ? '#fff' : '#374151',
                  background: (CAT_MAP[location] === CAT_MAP[path]) ? '#1E3A5F' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LangToggle />
          <Link href="/mon-compte" style={{ textDecoration: 'none', fontSize: '13px', color: '#374151', fontWeight: '500' }}>
            {t('nav_account')}
          </Link>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '6px 14px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {t('nav_login')}
            </button>
          </Link>
          <Link href="/panier" style={{ textDecoration: 'none', position: 'relative' }}>
            <span style={{ fontSize: '20px' }}>🛒</span>
            {count > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#DC2626', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* ── HEADER PAGE ───────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)', padding: '32px 20px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', margin: 0 }}>{catTitle}</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '6px', fontSize: '14px' }}>
          {loading ? '...' : `${products.length} produit${products.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── FILTRES ───────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { val: null,          label: lang === 'fr' ? 'Tous les produits' : '所有产品', emoji: '🏪' },
          { val: 'mini-pelles', label: lang === 'fr' ? 'Mini-pelles' : '挖掘机', emoji: '🚜' },
          { val: 'maisons',     label: lang === 'fr' ? 'Maisons & Camping-car' : '房屋', emoji: '🏠' },
          { val: 'solaire',     label: lang === 'fr' ? 'Solaire' : '太阳能', emoji: '☀️' },
          { val: 'accessoires', label: lang === 'fr' ? 'Accessoires' : '配件', emoji: '🔧' },
        ].map(({ val, label, emoji }) => (
          <button
            key={String(val)}
            onClick={() => setActiveFilter(val)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: activeFilter === val ? 'none' : '1px solid #E5E7EB',
              background: activeFilter === val ? '#1E3A5F' : '#fff',
              color: activeFilter === val ? '#fff' : '#374151',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* ── GRILLE PRODUITS ───────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px' }}>
        {loading ? (
          <SkeletonGrid />
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <p style={{ fontSize: '16px' }}>{t('msg_empty')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} role={role} getPrix={getPrix} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer style={{ background: '#1E3A5F', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '20px', fontSize: '12px', marginTop: '40px' }}>
        © 2025 97import — Importation directe Chine → DOM-TOM
        <br />
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>contact@97import.com</span>
      </footer>
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
          <div style={{ height: '200px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ padding: '16px' }}>
            <div style={{ height: '16px', background: '#E5E7EB', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '12px', background: '#E5E7EB', borderRadius: '4px', width: '60%', marginBottom: '16px' }} />
            <div style={{ height: '36px', background: '#E5E7EB', borderRadius: '8px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ProductCard ────────────────────────────────────────────
interface ProductCardProps {
  product: Product
  role: string
  getPrix: (p: Product) => ReturnType<typeof calculerPrix> | null
  lang: string
}

function ProductCard({ product, role, getPrix, lang }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)

  const prix = getPrix(product)
  const mainImage = product.images?.[0] || PLACEHOLDER

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '210px', overflow: 'hidden', background: '#F3F4F6' }}>
        <img
          src={imgError ? PLACEHOLDER : mainImage}
          alt={product.nom}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
        />
        {/* Badge catégorie */}
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'rgba(30,58,95,0.85)', color: '#fff',
          padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '600',
        }}>
          {CAT_EMOJIS[product.categorie || ''] || ''} {product.categorie || ''}
        </span>
        {/* Nb images */}
        {(product.images?.length || 0) > 1 && (
          <span style={{
            position: 'absolute', bottom: '8px', right: '8px',
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            padding: '2px 6px', borderRadius: '8px', fontSize: '10px',
          }}>
            📷 {product.images!.length}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Référence interne */}
        {product.numero_interne && (
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#6B7280', marginBottom: '4px', fontFamily: 'monospace' }}>
            {product.numero_interne}
          </span>
        )}

        {/* Nom produit */}
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 8px', lineHeight: '1.3' }}>
          {product.nom}
        </h3>

        {/* Prix */}
        <div style={{ marginBottom: '12px', flex: 1 }}>
          {prix === null ? (
            <span style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
              {lang === 'fr' ? 'Prix sur demande' : '价格面议'}
            </span>
          ) : prix.montant === null ? (
            <div>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                {lang === 'fr' ? '🔒 Connectez-vous pour voir le prix' : '🔒 登录查看价格'}
              </span>
            </div>
          ) : (
            <div>
              {prix.estVIP && (
                <span style={{ fontSize: '10px', background: '#EDE9FE', color: '#6B21A8', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', marginBottom: '4px', display: 'inline-block' }}>
                  ★ VIP
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#1E3A5F' }}>
                  {formatPrix(prix.montant)}
                </span>
                {role === 'user' && prix.prixPublic > prix.montant && (
                  <span style={{ fontSize: '12px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                    {formatPrix(prix.prixPublic * 1.5)}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>{prix.label}</span>
            </div>
          )}
        </div>

        {/* Bouton voir */}
        <Link href={`/produit/${product.id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            padding: '9px',
            background: '#1E3A5F',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2563EB')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1E3A5F')}
          >
            {lang === 'fr' ? 'Voir la fiche →' : '查看详情 →'}
          </button>
        </Link>
      </div>
    </div>
  )
}
