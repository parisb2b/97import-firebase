import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { clientAuth, db } from '../../lib/firebase';
import { logError, logInfo, logWarn } from '../../lib/logService';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getNextNumber } from '../../lib/counters';
import { useI18n } from '../../i18n';
import { useToast } from '../components/Toast';
import { notifyDevisCree } from '../../lib/emailService';
import { sanitizeForFirestore } from '../../lib/firebaseUtils';

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


export default function Panier() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Custom product form
  const [customNom, setCustomNom] = useState('');
  const [customQte, setCustomQte] = useState(1);
  const [customDesc, setCustomDesc] = useState('');
  const [customLien, setCustomLien] = useState('');
  const [clientProfile, setClientProfile] = useState<any>(null);

  // V62 — chargement profil client pour adresse livraison
  useEffect(() => {
    const user = clientAuth.currentUser;
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setClientProfile(snap.data());
    }).catch(() => {});
  }, []);

  // Popup state
  const [popupStep, setPopupStep] = useState<number | null>(null); // null=closed, 0=partner, 1=acompte, 2=rib

  // Partner popup
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

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

  // ─── Open popup flow ───
  const handleOpenPopup = async () => {
    const user = clientAuth.currentUser;
    if (!user) { setLocation('/connexion'); return; }
    if (cart.length === 0) {
      showToast('Votre panier est vide', 'warning');
      return;
    }

    // Load partners
    try {
      const q = query(collection(db, 'partners'), where('actif', '==', true));
      const snap = await getDocs(q);
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Partner)));
    } catch { setPartners([]); }

    setSelectedPartner(null);
    setPopupStep(0);
  };

  // ─── Create quote ───
  const handleCreateQuote = async () => {
    const user = clientAuth.currentUser;
    if (!user) { logWarn('Panier', 'Tentative création devis sans auth'); return; }
    setSubmitting(true);
    logInfo('Panier', 'Début création devis', { items: cart.length, partner: selectedPartner });
    try {
      const numero = await getNextNumber('DVS');
      logInfo('Panier', 'Numéro devis obtenu', { numero });
      const devisId = numero.replace(/[^a-zA-Z0-9]/g, '-');
      const lignes = cart.map(item => {
        const prix_partenaire = item.prix * 0.7;
        return {
          reference: item.ref,
          ref: item.ref,
          nom: item.nom_fr,
          nom_fr: item.nom_fr,
          quantite: item.qte,
          qte: item.qte,
          prix_achat: undefined,
          prix_partenaire: prix_partenaire,
          prix_vip_negocie: undefined,
          prix_unitaire_final: item.prix,
          prix_unitaire: item.prix,
          total_ligne: item.prix * item.qte,
          total: item.prix * item.qte,
          type: item.type || 'product',
          ...(item.description ? { description: item.description } : {}),
          ...(item.lien ? { lien: item.lien } : {}),
        };
      });

      // Charger le profil client pour inclure toutes les infos
      let userProfile: any = {};
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) userProfile = userSnap.data();
      } catch {
        console.warn('Panier: échec chargement profil client');
      }

      const devisData = {
        numero,
        client_id: user.uid,
        client_email: userProfile.email || user.email,
        client_nom: user.displayName || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        client_prenom: userProfile.firstName || userProfile.prenom || '',
        client_tel: userProfile.phone || userProfile.telephone || '',
        client_adresse: [userProfile.adresse, userProfile.codePostal, userProfile.ville, userProfile.pays].filter(Boolean).join(', '),
        client_siret: userProfile.siret || '',
        statut: 'en_negociation_partenaire',
        destination: userProfile.pays || 'Martinique',
        pays_livraison: userProfile.pays || 'Martinique',
        is_vip: false,
        lignes,
        total_ht: total,
        partenaire_code: selectedPartner || 'ADMIN',
        acomptes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'quotes', devisId), sanitizeForFirestore(devisData));
      logInfo('Panier', 'Devis créé avec succès', { devisId, numero, total_ht: total });

      // Notification email
      try {
        await notifyDevisCree(devisData);
      } catch (err) {
        console.error('Erreur notification devis créé:', err);
      }

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
      setCart([]);
      setPopupStep(null);
      showToast('Devis ' + numero + ' créé avec succès !');
      setLocation('/espace-client');
    } catch (err: any) {
      console.error('Error creating quote:', err);
      logError('Panier', 'Échec création devis', { error: err?.message, code: err?.code });
      showToast('Erreur lors de la création du devis', 'error');
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
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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
                    <div style={{ flex: 1, minWidth: 0, overflowWrap: 'break-word' }}>
                      <p style={{ fontSize: 12, color: '#9CA3AF' }}>{item.ref}</p>
                      <p style={{ fontWeight: 600, color: '#1565C0', fontSize: 14, wordBreak: 'break-word' }}>{item.nom_fr}</p>
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

                {/* V62 — Adresse de livraison */}
                {clientProfile?.adresse_livraison && (
                  <div style={{ marginTop: 16, padding: 12, background: '#F0F4F8', borderRadius: 10, fontSize: 12 }}>
                    <p style={{ fontWeight: 600, color: '#1565C0', marginBottom: 6 }}>Adresse de livraison</p>
                    {clientProfile.adresse_livraison.identique_facturation ? (
                      <p style={{ color: '#4B5563' }}>Identique à l'adresse de facturation</p>
                    ) : (
                      <p style={{ color: '#4B5563' }}>
                        {clientProfile.adresse_livraison.rue}, {clientProfile.adresse_livraison.code_postal} {clientProfile.adresse_livraison.ville}
                      </p>
                    )}
                  </div>
                )}

                <button onClick={handleOpenPopup} disabled={submitting}
                  style={{ ...btnStyle('#EA580C'), marginTop: 20, opacity: submitting ? 0.5 : 1 }}>
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
      {/* POPUP 1 — Partenaire                           */}
      {/* ═══════════════════════════════════════════════ */}
      {popupStep === 0 && (
        <Overlay onClose={closePopup}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 48 }}>🤝</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginTop: 8 }}>{t('popup.partenaireTitle')}</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              {t('popup.partenaireDesc')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {partners.map(p => (
              <button key={p.id} onClick={() => setSelectedPartner(p.code)}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: selectedPartner === p.code ? '2px solid #1565C0' : '2px solid #E5E7EB',
                  background: selectedPartner === p.code ? '#EFF6FF' : 'white',
                }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1565C0' }}>{p.code}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{p.nom}</div>
              </button>
            ))}
          </div>

          <button onClick={handleCreateQuote} disabled={submitting}
            style={{ ...btnStyle('#1565C0'), opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '...' : t('popup.confirmer')}
          </button>
        </Overlay>
      )}

    </>
  );
}
