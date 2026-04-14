import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import Breadcrumb from '../components/Breadcrumb';
import PriceDisplay, { getProductPrice } from '../components/PriceDisplay';
import { useToast } from '../components/Toast';

const B = '#1565C0';

export default function Produit() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [, params] = useRoute('/produit/:id');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [_user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasAccessoires, setHasAccessoires] = useState(false);
  const [accCount, setAccCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          setUserRole(snap.data()?.role || 'user');
        } catch { setUserRole('user'); }
      } else {
        setUserRole(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', params.id));
        if (snap.exists()) {
          const p: any = { id: snap.id, ...snap.data() };
          setProduct(p);
          const accQ = query(collection(db, 'products'), where('machine_compatible', '==', p.gamme || p.id));
          const accSnap = await getDocs(accQ);
          setHasAccessoires(accSnap.size > 0);
          setAccCount(accSnap.size);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    setSelectedImg(0);
    setShowVideo(false);
  }, [params?.id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>...</div>;
  if (!product) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>—</div>;

  const pName = (p: any) => {
    const raw = lang === 'zh' ? (p.nom_zh || p.nom_fr) : lang === 'en' ? (p.nom_en || p.nom_fr) : p.nom_fr;
    return (raw || p.nom || p.numero_interne || '').replace(/\s*--\s*/g, ' — ');
  };
  const pDesc = (p: any) =>
    lang === 'zh' ? (p.description_zh || p.description_fr) : lang === 'en' ? (p.description_en || p.description_fr) : p.description_fr;
  const pMat = (p: any) =>
    lang === 'zh' ? (p.matiere_zh || p.matiere_fr) : lang === 'en' ? (p.matiere_en || p.matiere_fr) : p.matiere_fr;

  const images = product.images_urls || [];
  const hasVideoUrl = !!product.video_url;

  const prevImage = () => setSelectedImg(i => i > 0 ? i - 1 : images.length - 1);
  const nextImage = () => setSelectedImg(i => i < images.length - 1 ? i + 1 : 0);

  const handleAddToCart = () => {
    const saved = localStorage.getItem('cart');
    const cart = saved ? JSON.parse(saved) : [];
    const existing = cart.find((c: any) => c.id === product.id);
    if (existing) {
      existing.qte += 1;
    } else {
      cart.push({
        id: product.id,
        ref: product.numero_interne || product.id,
        nom_fr: product.nom_fr || product.nom || product.numero_interne,
        prix: getProductPrice(product, userRole),
        qte: 1,
        image: product.images_urls?.[0] || '',
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    showToast(t('product.addToCart') + ' ✅');
  };

  // Specs for badges (top 4)
  const badges = [
    product.moteur && { icon: '⚙️', label: product.moteur, sub: t('product.moteur') },
    product.puissance_kw && { icon: '⚡', label: `${product.puissance_kw} kW`, sub: t('product.puissance') },
    product.poids_net_kg && { icon: '⚖️', label: `${product.poids_net_kg} kg`, sub: t('product.poids') },
    product.longueur_cm && product.largeur_cm && { icon: '📐', label: `${product.longueur_cm}×${product.largeur_cm} cm`, sub: 'Dimensions' },
  ].filter(Boolean) as { icon: string; label: string; sub: string }[];

  // Full specs table
  const specsTable = [
    { k: t('product.poids'), v: product.poids_net_kg ? `${product.poids_net_kg} kg` : null },
    { k: t('product.moteur'), v: product.moteur },
    { k: t('product.puissance'), v: product.puissance_kw ? `${product.puissance_kw} kW` : null },
    { k: t('product.longueur'), v: product.longueur_cm ? `${product.longueur_cm} cm` : null },
    { k: t('product.largeur'), v: product.largeur_cm ? `${product.largeur_cm} cm` : null },
    { k: t('product.hauteur'), v: product.hauteur_cm ? `${product.hauteur_cm} cm` : null },
    { k: t('product.marque'), v: product.marque },
    { k: t('product.matiere'), v: pMat(product) },
    { k: t('product.codeHs'), v: product.code_hs },
  ].filter(s => s.v);

  return (
    <>
      {/* Breadcrumb banner */}
      <div style={{ background: 'linear-gradient(135deg, #1565C0, #1E88E5)', padding: '24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <Breadcrumb items={[
            { label: t('nav.accueil'), href: '/' },
            { label: product.categorie || 'Catalogue', href: `/catalogue/${product.categorie || ''}` },
            { label: pName(product) },
          ]} />
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

        {/* LEFT — Gallery */}
        <div>
          {/* Main image / video */}
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#F5F7FA' }}>
            {showVideo && product.video_url ? (
              <>
                {product.video_url.includes('youtube') || product.video_url.includes('youtu.be') ? (
                  <iframe
                    src={product.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    style={{ width: '100%', height: 400, border: 'none' }}
                    allowFullScreen
                  />
                ) : (
                  <video src={product.video_url} controls style={{ width: '100%', height: 400, objectFit: 'contain' }} />
                )}
                <button onClick={() => setShowVideo(false)} style={{
                  position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16,
                }}>✕</button>
              </>
            ) : images.length > 0 ? (
              <img src={images[selectedImg]} alt={pName(product)}
                style={{ width: '100%', height: 400, objectFit: 'contain', padding: 20 }} />
            ) : (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
            )}

            {/* Arrows */}
            {images.length > 1 && !showVideo && (
              <>
                <button onClick={prevImage} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 40, height: 40, borderRadius: '50%', border: 'none',
                  background: 'rgba(255,255,255,.9)', boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                  fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>←</button>
                <button onClick={nextImage} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 40, height: 40, borderRadius: '50%', border: 'none',
                  background: 'rgba(255,255,255,.9)', boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                  fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>→</button>
              </>
            )}
          </div>

          {/* Legal mention */}
          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
            Photos non contractuelles. Le modèle présenté inclut des options de série.
          </p>

          {/* Thumbnails */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {hasVideoUrl && (
              <div onClick={() => { setShowVideo(true); }} style={{
                width: 74, height: 74, borderRadius: 12, background: '#1565C0',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', flexShrink: 0,
              }}>
                <span style={{ fontSize: 24, color: '#fff' }}>▶</span>
                <span style={{ position: 'absolute', bottom: 4, fontSize: 8, color: 'rgba(255,255,255,.7)' }}>Vidéo</span>
              </div>
            )}
            {images.map((img: string, i: number) => (
              <img key={i} src={img} onClick={() => { setSelectedImg(i); setShowVideo(false); }} style={{
                width: 74, height: 74, borderRadius: 12, objectFit: 'cover', cursor: 'pointer',
                border: `2px solid ${i === selectedImg && !showVideo ? B : 'transparent'}`,
                opacity: i === selectedImg && !showVideo ? 1 : 0.7,
                transition: 'all .2s', flexShrink: 0,
              }} />
            ))}
            {product.fiche_pdf_url && (
              <a href={product.fiche_pdf_url} target="_blank" rel="noopener" style={{
                width: 74, height: 74, borderRadius: 12, background: '#F5F7FA',
                border: '2px solid #E8ECF4', cursor: 'pointer', textDecoration: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0,
              }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <span style={{ fontSize: 9, color: '#6B7280' }}>Fiche PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* RIGHT — Product info */}
        <div>
          {/* Badge */}
          {product.marque && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#E0F2F1', color: '#00897B', fontSize: 12, fontWeight: 600,
              padding: '5px 12px', borderRadius: 20, marginBottom: 14,
            }}>
              ✅ {product.marque} · {t('product.importDirecte')}
            </span>
          )}

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: B, lineHeight: 1.2, marginBottom: 6 }}>
            {pName(product)}
          </h1>

          {/* Reference */}
          {(product.reference || product.numero_interne) && (
            <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
              {t('product.ref')} : {product.reference || product.numero_interne}
            </span>
          )}

          {/* Gamme */}
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 22, marginTop: 4 }}>
            {product.gamme ? `${t('product.gamme')} ${product.gamme}` : ''}{product.gamme && product.categorie ? ' · ' : ''}{product.categorie || ''}
          </p>

          {/* Description */}
          {pDesc(product) && (
            <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>
              {pDesc(product)}
            </p>
          )}

          {/* Price */}
          <div style={{ marginBottom: 22 }}>
            <PriceDisplay product={product} userRole={userRole} size="lg" />
          </div>

          {/* Action buttons */}
          {userRole && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button onClick={handleAddToCart} style={{
                flex: 1, padding: '14px 24px', background: `linear-gradient(135deg, ${B}, #1E88E5)`,
                color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                🛒 {t('product.addToCart')}
              </button>
              <Link href="/panier">
                <button style={{
                  padding: '14px 20px', background: 'transparent', color: B,
                  border: `2px solid ${B}`, borderRadius: 12, fontSize: 15, cursor: 'pointer',
                }}>
                  📋 {t('product.devis')}
                </button>
              </Link>
            </div>
          )}

          {/* Price mention */}
          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 4, marginBottom: 8 }}>
            *Le prix final sera confirmé par devis officiel. Garantie constructeur incluse.
          </p>
        </div>
      </div>

      {/* Badges specs */}
      {badges.length > 0 && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {badges.map((b, i) => (
              <div key={i} style={{
                flex: '1 1 120px', padding: '14px 16px', borderRadius: 16,
                border: '1px solid #E8ECF4', background: '#F9FAFB', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{b.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: B }}>{b.label}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specs table */}
      {specsTable.length > 0 && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: B, marginBottom: 16 }}>
            {t('product.specs')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#E8ECF4', borderRadius: 12, overflow: 'hidden' }}>
            {specsTable.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{s.k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: B }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessoires banner */}
      {hasAccessoires && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 60px' }}>
          <Link href={`/catalogue/${product.categorie}`}>
            <div style={{
              background: `linear-gradient(135deg, ${B}, #1E88E5)`, borderRadius: 16,
              padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
                  🔧 {t('product.accessories')} {product.gamme || pName(product)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                  {accCount} {t('product.accessoriesCount')}
                </div>
              </div>
              <span style={{ color: 'white', fontSize: 24 }}>→</span>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom padding if no accessories */}
      {!hasAccessoires && <div style={{ height: 60 }} />}
    </>
  );
}
