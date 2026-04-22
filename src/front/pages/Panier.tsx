import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import TunnelCommande from '@/front/components/TunnelCommande';

interface CartItem {
  ref: string;
  nom_fr: string;
  prix_unitaire: number;
  qte: number;
  image?: string | null;
  categorie?: string;
}

export default function Panier() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<CartItem[]>([]);
  const [showTunnel, setShowTunnel] = useState(false);

  useEffect(() => {
    loadCart();
    window.addEventListener('storage', loadCart);
    return () => window.removeEventListener('storage', loadCart);
  }, []);

  const loadCart = () => {
    try {
      const stored = localStorage.getItem('cart');
      setItems(stored ? JSON.parse(stored) : []);
    } catch { setItems([]); }
  };

  const updateQty = (ref: string, newQty: number) => {
    if (newQty < 1) return;
    const updated = items.map(it => it.ref === ref ? { ...it, qte: newQty } : it);
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (ref: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    const updated = items.filter(it => it.ref !== ref);
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const clearCart = () => {
    if (!confirm('Vider tout le panier ?')) return;
    setItems([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('storage'));
  };

  const total = items.reduce((s, it) => s + (it.prix_unitaire * it.qte), 0);

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ background: '#fff', padding: 48, borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, marginBottom: 8 }}>
            Votre panier est vide
          </h2>
          <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>
            Découvrez nos produits et ajoutez-les à votre demande de devis.
          </p>
          <Link href="/catalogue" style={{
            display: 'inline-block', padding: '12px 24px', background: 'var(--orange)',
            color: '#fff', textDecoration: 'none', borderRadius: 'var(--radius)', fontWeight: 600,
          }}>
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)', padding: '32px 0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, margin: 0 }}>
            Mon panier ({items.length} article{items.length > 1 ? 's' : ''})
          </h1>
          <button onClick={clearCart} style={{
            padding: '8px 14px', background: 'transparent', color: 'var(--danger)',
            border: '1px solid var(--danger)', borderRadius: 'var(--radius)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Vider le panier
          </button>
        </div>

        <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', padding: '14px 20px',
              background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
              fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <div style={{ flex: 2 }}>Produit</div>
              <div style={{ width: 110, textAlign: 'center' }}>Quantité</div>
              <div style={{ width: 110, textAlign: 'right' }}>Prix unit.</div>
              <div style={{ width: 110, textAlign: 'right' }}>Sous-total</div>
              <div style={{ width: 40 }}></div>
            </div>

            {items.map(it => (
              <div key={it.ref} style={{
                display: 'flex', alignItems: 'center', padding: '20px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 60, height: 60, background: 'var(--bg-2)',
                    borderRadius: 'var(--radius)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {it.image ? (
                      <img src={it.image} alt={it.nom_fr} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <span style={{ fontSize: 24 }}>📦</span>}
                  </div>
                  <div>
                    <Link href={`/produit/${it.ref}`} style={{
                      display: 'block', fontWeight: 600, color: 'var(--text)',
                      textDecoration: 'none', marginBottom: 4,
                    }}>
                      {it.nom_fr}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
                      <code>{it.ref}</code>
                      {it.categorie && (
                        <span style={{
                          padding: '2px 8px', background: 'var(--blue-light)',
                          color: 'var(--blue)', borderRadius: 'var(--radius-full)',
                          fontSize: 10, fontWeight: 600,
                        }}>{it.categorie}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ width: 110, display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    background: '#fff', overflow: 'hidden',
                  }}>
                    <button onClick={() => updateQty(it.ref, it.qte - 1)} style={qtyBtnStyle}>−</button>
                    <input type="number" value={it.qte}
                      onChange={e => updateQty(it.ref, parseInt(e.target.value) || 1)}
                      style={qtyInputStyle} />
                    <button onClick={() => updateQty(it.ref, it.qte + 1)} style={qtyBtnStyle}>+</button>
                  </div>
                </div>

                <div style={{ width: 110, textAlign: 'right', fontWeight: 600 }}>
                  {it.prix_unitaire.toLocaleString('fr-FR')} €
                </div>

                <div style={{ width: 110, textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>
                  {(it.prix_unitaire * it.qte).toLocaleString('fr-FR')} €
                </div>

                <div style={{ width: 40, textAlign: 'right' }}>
                  <button onClick={() => removeItem(it.ref)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 18, padding: 4,
                  }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <aside style={{
            background: '#fff', padding: 24, borderRadius: 'var(--radius-lg)',
            height: 'fit-content', position: 'sticky', top: 84,
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'var(--font-head)' }}>
              Récapitulatif
            </h3>

            <div style={recapRowStyle}>
              <span>Sous-total HT</span>
              <span style={{ fontWeight: 600 }}>{total.toLocaleString('fr-FR')} €</span>
            </div>
            <div style={recapRowStyle}>
              <span>Livraison</span>
              <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>À calculer</span>
            </div>
            <div style={{
              ...recapRowStyle, borderTop: '2px solid var(--border)',
              paddingTop: 14, marginTop: 8,
            }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Total HT</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)' }}>
                {total.toLocaleString('fr-FR')} €
              </span>
            </div>

            <button onClick={() => setShowTunnel(true)} style={{
              width: '100%', padding: '14px 20px', background: 'var(--orange)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', marginTop: 16, marginBottom: 8,
            }}>
              📋 Demander un devis
            </button>

            <Link href="/catalogue" style={{
              display: 'block', width: '100%', padding: 10,
              color: 'var(--text-2)', textAlign: 'center',
              textDecoration: 'none', fontSize: 13,
            }}>
              ← Continuer mes achats
            </Link>

            <div style={{
              marginTop: 20, padding: 16, background: 'var(--bg-2)',
              borderRadius: 'var(--radius)', display: 'flex',
              flexDirection: 'column', gap: 8,
            }}>
              {[
                { icon: '🚢', text: 'Livraison maritime DOM-TOM' },
                { icon: '📋', text: 'Dédouanement inclus' },
                { icon: '💬', text: 'Devis gratuit sous 24h' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-2)' }}>
                  <span>{a.icon}</span><span>{a.text}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {showTunnel && (
        <TunnelCommande
          items={items} total={total}
          onClose={() => setShowTunnel(false)}
          onSuccess={(quoteNumber) => {
            setShowTunnel(false);
            localStorage.removeItem('cart');
            setItems([]);
            window.dispatchEvent(new Event('storage'));
            alert(`✅ Devis ${quoteNumber} créé avec succès !`);
            navigate('/mon-compte');
          }}
        />
      )}

      <style>{`
        @media (max-width: 1024px) { .cart-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  padding: '6px 10px', background: 'transparent', border: 'none',
  cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
};

const qtyInputStyle: React.CSSProperties = {
  width: 40, padding: '6px 0', border: 'none',
  borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
  textAlign: 'center', fontSize: 13, fontWeight: 600, outline: 'none',
  fontFamily: 'inherit',
};

const recapRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 0', fontSize: 14,
};
