import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { clientAuth, db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getNextNumber } from '../../lib/counters';

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

interface Partner {
  id: string;
  code: string;
  nom: string;
  actif: boolean;
}

// ─── Popup overlay ───
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'white', borderRadius: 20, maxWidth: 560, width: '100%',
        padding: 32, maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Step indicator ───
function Steps({ current }: { current: number }) {
  const labels = ['Partenaire', 'Acompte', 'Virement'];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
      {labels.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            background: i < current ? '#16A34A' : i === current ? '#0B2545' : '#E5E7EB',
            color: i <= current ? 'white' : '#9CA3AF',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          <span style={{ fontSize: 12, color: i === current ? '#0B2545' : '#9CA3AF', fontWeight: i === current ? 600 : 400 }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

export default function Panier() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Custom product form
  const [customNom, setCustomNom] = useState('');
  const [customQte, setCustomQte] = useState(1);
  const [customDesc, setCustomDesc] = useState('');
  const [customLien, setCustomLien] = useState('');

  // Popup state
  const [popupStep, setPopupStep] = useState<number | null>(null); // null=closed, 0=partner, 1=acompte, 2=rib

  // Partner popup
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  // Acompte popup
  const [typeCompte, setTypeCompte] = useState<'personnel' | 'professionnel'>('personnel');
  const [montantAcompte, setMontantAcompte] = useState(500);

  // Quote number (generated on confirm)
  const [quoteNumero, setQuoteNumero] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
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

  // ─── Open popup flow ───
  const handleOpenPopup = async () => {
    const user = clientAuth.currentUser;
    if (!user) { setLocation('/connexion'); return; }
    if (cart.length === 0) return;

    // Load partners
    try {
      const q = query(collection(db, 'partners'), where('actif', '==', true));
      const snap = await getDocs(q);
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Partner)));
    } catch { setPartners([]); }

    setSelectedPartner(null);
    setPopupStep(0);
  };

  // ─── Confirm & create quote ───
  const handleConfirmVirement = async () => {
    const user = clientAuth.currentUser;
    if (!user) return;
    setSubmitting(true);
    try {
      const numero = await getNextNumber('DVS');
      setQuoteNumero(numero);
      const devisId = numero.replace(/[^a-zA-Z0-9]/g, '-');
      const lignes = cart.map(item => ({
        ref: item.ref, nom_fr: item.nom_fr, qte: item.qte,
        prix_unitaire: item.prix, total: item.prix * item.qte,
        type: item.type || 'product',
        ...(item.description ? { description: item.description } : {}),
        ...(item.lien ? { lien: item.lien } : {}),
      }));

      await setDoc(doc(db, 'quotes', devisId), {
        numero,
        client_id: user.uid,
        client_email: user.email,
        client_nom: user.displayName || '',
        statut: 'nouveau',
        lignes,
        total_ht: total,
        partenaire_code: selectedPartner || null,
        acomptes: [{
          montant: montantAcompte,
          date: new Date().toISOString(),
          type_compte: typeCompte,
          statut: 'declare',
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      localStorage.removeItem('cart');
      setCart([]);
      setPopupStep(null);
      setLocation('/espace-client');
    } catch (err) {
      console.error('Error creating quote:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Download without deposit ───
  const handleSansAcompte = async () => {
    const user = clientAuth.currentUser;
    if (!user) return;
    setSubmitting(true);
    try {
      const numero = await getNextNumber('DVS');
      const devisId = numero.replace(/[^a-zA-Z0-9]/g, '-');
      const lignes = cart.map(item => ({
        ref: item.ref, nom_fr: item.nom_fr, qte: item.qte,
        prix_unitaire: item.prix, total: item.prix * item.qte,
        type: item.type || 'product',
      }));

      await setDoc(doc(db, 'quotes', devisId), {
        numero,
        client_id: user.uid,
        client_email: user.email,
        client_nom: user.displayName || '',
        statut: 'brouillon',
        lignes,
        total_ht: total,
        partenaire_code: selectedPartner || null,
        acomptes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      localStorage.removeItem('cart');
      setCart([]);
      setPopupStep(null);
      setLocation('/espace-client');
    } catch (err) {
      console.error('Error creating quote:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const closePopup = () => setPopupStep(null);

  const btnStyle = (bg: string, color: string = 'white'): React.CSSProperties => ({
    width: '100%', padding: '14px 0', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', background: bg, color,
  });

  return (
    <>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0B2545, #1E3A5F)', padding: '32px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800 }}>🛒 Mon Panier</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            {cart.length === 0 ? 'Votre panier est vide' : `${cart.length} article${cart.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 60px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#6B7280', marginBottom: 16 }}>Votre panier est vide</p>
            <Link href="/catalogue">
              <span style={{ color: '#0B2545', fontWeight: 600, cursor: 'pointer' }}>Voir le catalogue</span>
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
                      <p style={{ fontWeight: 600, color: '#0B2545', fontSize: 14 }}>{item.nom_fr}</p>
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
                        <p style={{ fontWeight: 700, color: '#0B2545', fontSize: 14 }}>
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
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B2545', marginBottom: 16 }}>
                  📦 Ajouter un produit sur mesure
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
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B2545', marginBottom: 16 }}>Recapitulatif</h2>

                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#4B5563' }}>{item.nom_fr} x{item.qte}</span>
                    <span style={{ fontWeight: 600, color: '#0B2545' }}>
                      {item.prix > 0 ? `${(item.prix * item.qte).toLocaleString('fr-FR')} €` : 'Sur devis'}
                    </span>
                  </div>
                ))}

                <div style={{ borderTop: '2px solid #0B2545', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0B2545' }}>Total HT</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#0B2545' }}>{total.toLocaleString('fr-FR')} €</span>
                </div>

                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                  Hors livraison · TVA non applicable art. 293B CGI
                </p>

                <button onClick={handleOpenPopup} disabled={submitting}
                  style={{ ...btnStyle('#EA580C'), marginTop: 20, opacity: submitting ? 0.5 : 1 }}>
                  📋 Generer mon devis gratuit
                </button>

                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
                  Le devis est envoye par email et disponible dans votre espace client
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* POPUP 1 — Partenaire                           */}
      {/* ═══════════════════════════════════════════════ */}
      {popupStep === 0 && (
        <Overlay onClose={closePopup}>
          <Steps current={0} />
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 48 }}>🤝</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0B2545', marginTop: 8 }}>Attribuer un partenaire</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              Selectionnez le partenaire qui vous a recommande (optionnel)
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {partners.map(p => (
              <button key={p.id} onClick={() => setSelectedPartner(p.code)}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: selectedPartner === p.code ? '2px solid #0B2545' : '2px solid #E5E7EB',
                  background: selectedPartner === p.code ? '#EFF6FF' : 'white',
                }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0B2545' }}>{p.code}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{p.nom}</div>
              </button>
            ))}
          </div>

          <button onClick={() => { setSelectedPartner(null); setPopupStep(1); }}
            style={{
              width: '100%', padding: '12px 0', border: '2px dashed #E5E7EB', borderRadius: 10,
              background: 'white', color: '#6B7280', fontSize: 14, cursor: 'pointer', marginBottom: 12,
            }}>
            Continuer sans partenaire →
          </button>

          <button onClick={() => setPopupStep(1)}
            disabled={!selectedPartner}
            style={{ ...btnStyle(selectedPartner ? '#0B2545' : '#D1D5DB'), opacity: selectedPartner ? 1 : 0.5 }}>
            Confirmer la selection →
          </button>
        </Overlay>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* POPUP 2 — Acompte                              */}
      {/* ═══════════════════════════════════════════════ */}
      {popupStep === 1 && (
        <Overlay onClose={closePopup}>
          <Steps current={1} />
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 48 }}>💰</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0B2545', marginTop: 8 }}>Acompte</h2>
          </div>

          {/* Recap */}
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{item.nom_fr} x{item.qte}</span>
                <span style={{ fontWeight: 600 }}>{item.prix > 0 ? `${(item.prix * item.qte).toLocaleString('fr-FR')} €` : 'Sur devis'}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total HT</span>
              <span>{total.toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          {/* Type de compte */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0B2545', marginBottom: 8 }}>Type de compte</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setTypeCompte('personnel')}
              style={{
                padding: 14, borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: typeCompte === 'personnel' ? '2px solid #0B2545' : '2px solid #E5E7EB',
                background: typeCompte === 'personnel' ? '#EFF6FF' : 'white',
              }}>
              <div style={{ fontSize: 24 }}>👤</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Compte personnel</div>
            </button>
            <button onClick={() => setTypeCompte('professionnel')}
              style={{
                padding: 14, borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: typeCompte === 'professionnel' ? '2px solid #0B2545' : '2px solid #E5E7EB',
                background: typeCompte === 'professionnel' ? '#EFF6FF' : 'white',
              }}>
              <div style={{ fontSize: 24 }}>🏢</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Compte professionnel</div>
            </button>
          </div>

          {/* Montant acompte */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0B2545', marginBottom: 8 }}>Montant de l'acompte (€)</p>
          <input type="number" value={montantAcompte} onChange={e => setMontantAcompte(Number(e.target.value) || 0)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 20, outline: 'none', boxSizing: 'border-box' }} />

          <button onClick={() => setPopupStep(2)}
            style={btnStyle('#0B2545')}>
            J'ai effectue le virement →
          </button>

          <button onClick={handleSansAcompte} disabled={submitting}
            style={{
              width: '100%', padding: '12px 0', border: 'none', borderRadius: 10,
              background: 'transparent', color: '#6B7280', fontSize: 13, cursor: 'pointer', marginTop: 8,
              textDecoration: 'underline',
            }}>
            Telecharger le devis sans acompte
          </button>
        </Overlay>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* POPUP 3 — RIB                                  */}
      {/* ═══════════════════════════════════════════════ */}
      {popupStep === 2 && (
        <Overlay onClose={closePopup}>
          <Steps current={2} />
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 48 }}>🏦</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0B2545', marginTop: 8 }}>Coordonnees bancaires</h2>
          </div>

          {/* RIB Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0B2545, #1E3A5F)', borderRadius: 16, padding: 24, color: 'white', marginBottom: 24,
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              LUXENT LIMITED — Compte {typeCompte}
            </p>
            <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>IBAN</span>
                <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}>DE76 2022 0800 0059 5688 30</p>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>SWIFT / BIC</span>
                <p style={{ fontWeight: 600 }}>SXPYDEHH</p>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Banque</span>
                <p style={{ fontWeight: 600 }}>Banking Circle S.A. — Munich</p>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Beneficiaire</span>
                <p style={{ fontWeight: 600 }}>LUXENT LIMITED</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Reference</span>
                <p style={{ fontWeight: 600 }}>{quoteNumero || 'DVS-...'} / {clientAuth.currentUser?.displayName || clientAuth.currentUser?.email || ''}</p>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Montant</span>
                <p style={{ fontWeight: 800, fontSize: 20, color: '#EA580C' }}>{montantAcompte.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          </div>

          <button onClick={handleConfirmVirement} disabled={submitting}
            style={{ ...btnStyle('#16A34A'), opacity: submitting ? 0.5 : 1 }}>
            {submitting ? 'Envoi en cours...' : "✅ J'ai effectue le virement — Confirmer"}
          </button>

          <button onClick={closePopup}
            style={{
              width: '100%', padding: '12px 0', border: 'none', borderRadius: 10,
              background: 'transparent', color: '#6B7280', fontSize: 13, cursor: 'pointer', marginTop: 8,
            }}>
            Fermer — Je virerai plus tard
          </button>
        </Overlay>
      )}
    </>
  );
}
