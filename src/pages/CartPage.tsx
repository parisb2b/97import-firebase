import { Link } from 'wouter'
import { useCart } from '@/features/cart/CartContext'
import { formatPrix } from '@/utils/calculPrix'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
  red: '#DC2626',
}

export default function CartPage() {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
        <h1 style={{ color: C.navy, fontSize: '1.8rem', marginBottom: '0.5rem' }}>Votre panier est vide</h1>
        <p style={{ color: C.gray, marginBottom: '2rem' }}>Découvrez notre catalogue pour trouver les produits qu'il vous faut.</p>
        <Link href="/catalogue">
          <a style={{
            background: C.green, color: C.white, padding: '0.8rem 2rem',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '1rem',
          }}>
            Voir le catalogue
          </a>
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '2rem' }}>Mon Panier</h1>

      {/* Cart items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', gap: '1rem', alignItems: 'center',
            background: C.white, borderRadius: '10px', padding: '1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            <img
              src={item.image}
              alt={item.name}
              style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', background: C.light }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ color: C.navy, margin: '0 0 0.3rem 0', fontSize: '1.05rem' }}>{item.name}</h3>
              {item.numeroInterne && (
                <p style={{ color: C.gray, fontSize: '0.85rem', margin: '0 0 0.3rem 0' }}>Réf: {item.numeroInterne}</p>
              )}
              <p style={{ color: C.green, fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                {formatPrix(item.prixUnitaire)}
              </p>
            </div>

            {/* Quantity controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                style={{
                  width: '32px', height: '32px', border: `1px solid ${C.navy}20`,
                  borderRadius: '6px', background: C.light, cursor: 'pointer', fontSize: '1.1rem',
                }}
              >−</button>
              <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 600, color: C.navy }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                style={{
                  width: '32px', height: '32px', border: `1px solid ${C.navy}20`,
                  borderRadius: '6px', background: C.light, cursor: 'pointer', fontSize: '1.1rem',
                }}
              >+</button>
            </div>

            {/* Subtotal */}
            <div style={{ minWidth: '100px', textAlign: 'right' }}>
              <p style={{ fontWeight: 700, color: C.navy, margin: 0 }}>
                {formatPrix(item.prixUnitaire * item.quantity)}
              </p>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.id)}
              title="Supprimer"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.red, fontSize: '1.3rem', padding: '0.3rem',
              }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        background: C.white, borderRadius: '10px', padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem', color: C.navy, fontWeight: 600 }}>Total HT</span>
          <span style={{ fontSize: '1.5rem', color: C.green, fontWeight: 700 }}>{formatPrix(total)}</span>
        </div>
        <p style={{ color: C.gray, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Les frais de transport maritime et le dédouanement sont calculés sur devis.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/contact">
            <a style={{
              flex: 1, minWidth: '200px', background: C.orange, color: C.white,
              padding: '0.9rem 1.5rem', borderRadius: '8px', textDecoration: 'none',
              fontWeight: 700, fontSize: '1rem', textAlign: 'center',
              display: 'inline-block',
            }}>
              Demander un devis
            </a>
          </Link>
          <button
            onClick={clearCart}
            style={{
              padding: '0.9rem 1.5rem', borderRadius: '8px', border: `1px solid ${C.red}`,
              background: 'transparent', color: C.red, cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem',
            }}
          >
            Vider le panier
          </button>
        </div>
      </div>
    </div>
  )
}
