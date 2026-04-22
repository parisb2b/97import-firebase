import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { useToast } from '../components/Toast';
import TunnelCommande from '@/front/components/TunnelCommande';

interface CartItem {
  id: string;
  ref: string;
  nom_fr: string;
  prix: number;
  qte: number;
  image?: string;
  type?: 'product' | 'custom';
  description?: string;
  lien?: string;
}

export default function Panier() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [, navigate] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showTunnel, setShowTunnel] = useState(false);

  // Custom product form
  const [customNom, setCustomNom] = useState('');
  const [customQte, setCustomQte] = useState(1);
  const [customDesc, setCustomDesc] = useState('');
  const [customLien, setCustomLien] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQte = (id: string, qte: number) => {
    if (qte < 1) return;
    saveCart(cart.map(item => item.id === id ? { ...item, qte } : item));
  };

  const removeItem = (id: string) => {
    saveCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.prix * item.qte, 0);

  // ─── Add custom product ───
  const handleAddCustom = () => {
    if (!customNom.trim()) return;
    const id = `custom_${Date.now()}`;
    const newItem: CartItem = {
      id, ref: 'SUR-MESURE', nom_fr: customNom.trim(), prix: 0, qte: customQte,
      type: 'custom', description: customDesc, lien: customLien,
    };
    saveCart([...cart, newItem]);
    setCustomNom(''); setCustomQte(1); setCustomDesc(''); setCustomLien('');
  };

  // ─── Open tunnel to request quote ───
  const handleRequestQuote = () => {
    const user = clientAuth.currentUser;
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (cart.length === 0) {
      showToast('Votre panier est vide', 'warning');
      return;
    }
    setShowTunnel(true);
  };

  const btnStyle = (bg: string, color: string = 'white'): React.CSSProperties => ({
    width: '100%', padding: '14px 0', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', background: bg, color,
  });

  return (
    <>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1565C0, #1565C0)', padding: '32px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800 }}>{t('cart.title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            {cart.length === 0 ? t('cart.panierVide') : `${cart.length} ${t('cart.articles')}`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 60px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#6B7280', marginBottom: 16 }}>Votre panier est vide</p>
            <Link href="/catalogue">
              <span style={{ color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>Voir le catalogue</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

            {/* ═══ LEFT — Products ═══ */}
            <div>
              {/* Cart items */}
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                    borderBottom: '1px solid #F3F4F6',
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 8, background: '#F9FAFB', overflow: 'hidden',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.image ? (
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 24, color: '#D1D5DB' }}>{item.type === 'custom' ? '📦' : '🏷️'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: '#9CA3AF' }}>{item.ref}</p>
                      <p style={{ fontWeight: 600, color: '#1565C0', fontSize: 14 }}>{item.nom_fr}</p>
                      {item.type === 'custom' && (
                        <p style={{ fontSize: 11, color: '#EA580C', fontWeight: 500 }}>Produit sur mesure</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => updateQte(item.id, item.qte - 1)}
                        style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 14 }}>-</button>
                      <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{item.qte}</span>
                      <button onClick={() => updateQte(item.id, item.qte + 1)}
                        style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 14 }}>+</button>
                    </div>

                    {/* Price */}
                    <div style={{ width: 90, textAlign: 'right' }}>
                      {item.prix > 0 ? (
                        <p style={{ fontWeight: 700, color: '#1565C0', fontSize: 14 }}>
                          {(item.prix * item.qte).toLocaleString('fr-FR')} €
                        </p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#9CA3AF' }}>Sur devis</p>
                      )}
                    </div>

                    {/* Delete */}
                    <button onClick={() => removeItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#EF4444', padding: 4 }}>
                      🗑
                    </button>
                  </div>
                ))}
              </div>

              {/* ═══ Custom product form ═══ */}
              <div style={{
                marginTop: 24, border: '2px dashed #EA580C', borderRadius: 16, padding: 24, background: '#FFF7ED',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1565C0', marginBottom: 16 }}>
                  {t('cart.customProduct')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                  <input value={customNom} onChange={e => setCustomNom(e.target.value)}
                    placeholder="Nom du produit souhaité"
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none' }} />
                  <input type="number" min={1} value={customQte} onChange={e => setCustomQte(Number(e.target.value) || 1)}
                    style={{ width: 70, padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, textAlign: 'center', outline: 'none' }} />
                </div>
                <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)}
                  placeholder="Description détaillée (dimensions, matériaux, usage...)"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, resize: 'vertical', marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                <input value={customLien} onChange={e => setCustomLien(e.target.value)}
                  placeholder="Lien YouTube ou site (optionnel)"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={handleAddCustom}
                  style={{ ...btnStyle('#EA580C'), width: 'auto', padding: '10px 24px' }}>
                  📦 Ajouter au devis
                </button>
                <p style={{ fontSize: 11, color: '#92400E', marginTop: 8 }}>
                  ⚠️ L'ajout d'un produit sur mesure envoie une notification a l'equipe 97import
                </p>
              </div>
            </div>

            {/* ═══ RIGHT — Recap (sticky) ═══ */}
            <div style={{ position: 'sticky', top: 20 }}>
              <div style={{
                background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1565C0', marginBottom: 16 }}>{t('cart.recap')}</h2>

                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#4B5563' }}>{item.nom_fr} x{item.qte}</span>
                    <span style={{ fontWeight: 600, color: '#1565C0' }}>
                      {item.prix > 0 ? `${(item.prix * item.qte).toLocaleString('fr-FR')} €` : 'Sur devis'}
                    </span>
                  </div>
                ))}

                <div style={{ borderTop: '2px solid #1565C0', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1565C0' }}>{t('cart.totalHT')}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#1565C0' }}>{total.toLocaleString('fr-FR')} €</span>
                </div>

                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                  {t('cart.horsLivraison')}
                </p>

                <button onClick={handleRequestQuote}
                  style={{ ...btnStyle('#EA580C'), marginTop: 20 }}>
                  {t('cart.genererDevis')}
                </button>

                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
                  {t('cart.devisNote')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* TUNNEL COMMANDE                                 */}
      {/* ═══════════════════════════════════════════════ */}
      {showTunnel && (
        <TunnelCommande
          items={cart.map(item => ({
            ref: item.ref,
            nom_fr: item.nom_fr,
            prix_unitaire: item.prix,
            qte: item.qte,
            categorie: item.type === 'custom' ? 'Sur mesure' : undefined,
          }))}
          total={total}
          onClose={() => setShowTunnel(false)}
          onSuccess={(quoteNumber) => {
            setShowTunnel(false);
            localStorage.removeItem('cart');
            setCart([]);
            window.dispatchEvent(new Event('cart-updated'));
            showToast('Devis ' + quoteNumber + ' créé avec succès !');
            navigate('/espace-client');
          }}
        />
      )}
    </>
  );
}
