import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import Breadcrumb from '../components/Breadcrumb';
import PriceDisplay, { getProductPrice } from '../components/PriceDisplay';
import { useToast } from '../components/Toast';
import ProductOptionSelector from '../components/ProductOptionSelector';
import {
  getAccessoiresCompatibles,
  extractGroupeCode,
  OptionsConfig,
} from '../../lib/productGroupHelpers';
import {
  getImagePrincipale,
  getMediasOrdonnesPourSite,
  getDocumentsPdf,
  getDescriptionMarketing,
  getPointsForts,
} from '@/lib/productMediaHelpers';

const B = '#1565C0';

export default function Produit() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [, params] = useRoute('/produit/:id');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [_user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);

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

  // Charger tous les produits pour accéder aux variantes + accessoires compatibles
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      } catch (err) {
        console.error('Erreur chargement produits:', err);
      }
    })();
  }, []);

  // Quand la ref sélectionnée change, charger le produit correspondant
  useEffect(() => {
    if (!selectedRef || allProducts.length === 0) {
      setSelectedProduct(null);
      return;
    }
    const found = allProducts.find(p => p.reference === selectedRef);
    setSelectedProduct(found || null);
  }, [selectedRef, allProducts]);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', params.id));
        if (snap.exists()) {
          const p: any = { id: snap.id, ...snap.data() };
          setProduct(p);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    setSelectedMediaIndex(0);
  }, [params?.id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>...</div>;
  if (!product) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>—</div>;

  const displayedProduct = selectedProduct || product;

  const pName = (p: any) => {
    const raw = lang === 'zh' ? (p.nom_zh || p.nom_fr) : lang === 'en' ? (p.nom_en || p.nom_fr) : p.nom_fr;
    return (raw || p.nom || p.numero_interne || '').replace(/\s*--\s*/g, ' — ');
  };
  const pDesc = (p: any) =>
    lang === 'zh' ? (p.description_zh || p.description_fr) : lang === 'en' ? (p.description_en || p.description_fr) : p.description_fr;
  const pMat = (p: any) =>
    lang === 'zh' ? (p.matiere_zh || p.matiere_fr) : lang === 'en' ? (p.matiere_en || p.matiere_fr) : p.matiere_fr;

  // Médias unifiés : vidéos d'abord, puis photos (selon visible_site)
  const medias = getMediasOrdonnesPourSite(product);
  // Image principale pour fallback
  const imagePrincipale = getImagePrincipale(product);

  const prevMedia = () => setSelectedMediaIndex(i => i > 0 ? i - 1 : medias.length - 1);
  const nextMedia = () => setSelectedMediaIndex(i => i < medias.length - 1 ? i + 1 : 0);

  const handleAddToCart = () => {
    const refFinale = selectedRef || product.reference || product.id;
    const produitAAjouter = displayedProduct || product;

    const saved = localStorage.getItem('cart');
    const cart = saved ? JSON.parse(saved) : [];
    const existing = cart.find((c: any) => c.id === produitAAjouter.id);
    if (existing) {
      existing.qte += 1;
    } else {
      cart.push({
        id: produitAAjouter.id,
        ref: refFinale,
        nom_fr: produitAAjouter.nom_fr || produitAAjouter.nom || produitAAjouter.numero_interne,
        prix: getProductPrice(produitAAjouter, userRole),
        qte: 1,
        image: getImagePrincipale(produitAAjouter) || '',
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    showToast(t('product.addToCart') + ' ✅');
  };

  // Specs for badges (top 4) - Use displayedProduct for specs
  const badges = [
    displayedProduct.moteur && { icon: '⚙️', label: displayedProduct.moteur, sub: t('product.moteur') },
    displayedProduct.puissance_kw && { icon: '⚡', label: `${displayedProduct.puissance_kw} kW`, sub: t('product.puissance') },
    displayedProduct.poids_net_kg && { icon: '⚖️', label: `${displayedProduct.poids_net_kg} kg`, sub: t('product.poids') },
    displayedProduct.longueur_cm && displayedProduct.largeur_cm && { icon: '📐', label: `${displayedProduct.longueur_cm}×${displayedProduct.largeur_cm} cm`, sub: 'Dimensions' },
  ].filter(Boolean) as { icon: string; label: string; sub: string }[];

  // Full specs table - Use displayedProduct for specs
  const specsTable = [
    { k: t('product.poids'), v: displayedProduct.poids_net_kg ? `${displayedProduct.poids_net_kg} kg` : null },
    { k: t('product.moteur'), v: displayedProduct.moteur },
    { k: t('product.puissance'), v: displayedProduct.puissance_kw ? `${displayedProduct.puissance_kw} kW` : null },
    { k: t('product.longueur'), v: displayedProduct.longueur_cm ? `${displayedProduct.longueur_cm} cm` : null },
    { k: t('product.largeur'), v: displayedProduct.largeur_cm ? `${displayedProduct.largeur_cm} cm` : null },
    { k: t('product.hauteur'), v: displayedProduct.hauteur_cm ? `${displayedProduct.hauteur_cm} cm` : null },
    { k: t('product.marque'), v: displayedProduct.marque },
    { k: t('product.matiere'), v: pMat(displayedProduct) },
    { k: t('product.codeHs'), v: displayedProduct.code_hs },
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
          {/* Main media viewer */}
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#F5F7FA' }}>
            {medias.length > 0 ? (
              <>
                {medias[selectedMediaIndex]?.type === 'video' ? (
                  <video
                    src={medias[selectedMediaIndex].url}
                    controls
                    poster={medias[selectedMediaIndex].thumbnail}
                    style={{ width: '100%', height: 400, objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={medias[selectedMediaIndex]?.url}
                    alt={pName(product)}
                    style={{ width: '100%', height: 400, objectFit: 'contain', padding: 20 }}
                  />
                )}

                {/* Arrows */}
                {medias.length > 1 && (
                  <>
                    <button onClick={prevMedia} style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 40, height: 40, borderRadius: '50%', border: 'none',
                      background: 'rgba(255,255,255,.9)', boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                      fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>←</button>
                    <button onClick={nextMedia} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 40, height: 40, borderRadius: '50%', border: 'none',
                      background: 'rgba(255,255,255,.9)', boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                      fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>→</button>
                  </>
                )}
              </>
            ) : imagePrincipale ? (
              <img
                src={imagePrincipale}
                alt={pName(product)}
                style={{ width: '100%', height: 400, objectFit: 'contain', padding: 20 }}
              />
            ) : (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
            )}
          </div>

          {/* Legal mention */}
          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
            Photos non contractuelles. Le modèle présenté inclut des options de série.
          </p>

          {/* Thumbnails */}
          {medias.length > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {medias.slice(0, 8).map((m, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMediaIndex(i)}
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: 12,
                    background: '#F5F7FA',
                    border: `2px solid ${selectedMediaIndex === i ? B : '#E8ECF4'}`,
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    flexShrink: 0,
                    overflow: 'hidden',
                    opacity: selectedMediaIndex === i ? 1 : 0.7,
                    transition: 'all .2s',
                  }}
                >
                  <img
                    src={m.type === 'video' ? (m.thumbnail || m.url) : m.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {m.type === 'video' && (
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      width: 24, height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                    }}>▶</div>
                  )}
                </button>
              ))}
            </div>
          )}
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
            <PriceDisplay product={displayedProduct} userRole={userRole} size="lg" />
          </div>

          {/* Product Options Selector */}
          {product.options_config && (
            <ProductOptionSelector
              optionsConfig={product.options_config as OptionsConfig}
              onSelectionChange={(ref) => {
                setSelectedRef(ref);
              }}
            />
          )}

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

      {/* Description marketing */}
      {(() => {
        const description = getDescriptionMarketing(product, 'fr');
        if (!description) return null;
        return (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 0' }}>
            <h2 style={{ fontSize: 20, color: B, marginBottom: 12, fontWeight: 700 }}>Description</h2>
            <div style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: '#374151',
              whiteSpace: 'pre-wrap',
            }}>
              {description}
            </div>
          </div>
        );
      })()}

      {/* Points forts */}
      {(() => {
        const points = getPointsForts(product);
        if (points.length === 0) return null;
        return (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 0' }}>
            <h3 style={{ fontSize: 18, color: B, marginBottom: 12, fontWeight: 700 }}>Points forts</h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              {points.map((pt, i) => (
                <li key={i} style={{
                  fontSize: 14,
                  color: '#374151',
                  paddingLeft: 24,
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    color: '#10B981',
                    fontWeight: 700,
                  }}>✓</span>
                  {pt.replace(/^✓\s*/, '')}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Caractéristiques techniques (mini-pelles enrichies, bilingue) */}
      {(() => {
        const c = product.caracteristiques;
        const dt = c?.donnees_techniques || [];
        if (dt.length === 0) return null;

        // Helpers schema bilingue avec fallback ancien schema
        const getLabel = (d: any) => {
          const k = `label_${lang}`;
          return (d[k] && String(d[k]).trim()) || d.label_fr || d.label || '';
        };
        const getEquipements = (): string[] => {
          if (!c) return [];
          const k = `equipements_${lang}`;
          if (Array.isArray(c[k]) && c[k].length > 0) return c[k];
          if (Array.isArray(c.equipements_fr) && c.equipements_fr.length > 0) return c.equipements_fr;
          if (Array.isArray(c.equipements)) return c.equipements;
          return [];
        };
        const equipements = getEquipements();

        return (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 0' }}>
            <h3 style={{ fontSize: 18, color: B, marginBottom: 12, fontWeight: 700 }}>
              📋 Caractéristiques techniques
            </h3>
            <div style={{ background: '#F9FAFB', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              {dt.map((d: any, i: number) => (
                <div key={i} style={{
                  display: 'flex',
                  padding: '10px 16px',
                  background: i % 2 === 0 ? '#fff' : '#F9FAFB',
                  borderBottom: i < dt.length - 1 ? '1px solid #E5E7EB' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: '#6B7280', flex: '0 0 40%', fontWeight: 500 }}>{getLabel(d)}</span>
                  <span style={{ fontSize: 13, color: '#1565C0', flex: 1, fontWeight: 600 }}>{d.valeur}</span>
                </div>
              ))}
            </div>

            {equipements.length > 0 && (
              <>
                <h4 style={{ fontSize: 15, color: B, marginTop: 20, marginBottom: 10, fontWeight: 700 }}>
                  🛠️ Équipements inclus
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {equipements.map((eq: string, i: number) => (
                    <li key={i} style={{
                      fontSize: 14, color: '#374151',
                      paddingLeft: 24, position: 'relative',
                    }}>
                      <span style={{ position: 'absolute', left: 0, color: '#10B981', fontWeight: 700 }}>✓</span>
                      {eq}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })()}

      {/* V44 — Bouton "Voir accessoires compatibles" (mini-pelles R22/R32/R57 uniquement) */}
      {(() => {
        if (product.categorie !== 'mini-pelle') return null;
        const m = String(product.reference || '').match(/^MP-(R\d+)-/);
        const gamme = m?.[1];
        if (!gamme || !['R22', 'R32', 'R57'].includes(gamme)) return null;
        return (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 0' }}>
            <Link href={`/catalogue/mini-pelle/${gamme}/accessoires`}>
              <a style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #EA580C, #F97316)',
                color: 'white',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(234, 88, 12, 0.25)'; }}
              >
                🛠️ Voir les accessoires compatibles avec la {gamme} PRO →
              </a>
            </Link>
          </div>
        );
      })()}

      {/* Documents PDF téléchargeables */}
      {(() => {
        const docs = getDocumentsPdf(product);
        if (docs.length === 0) return null;
        return (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 0' }}>
            <h3 style={{ fontSize: 18, color: B, marginBottom: 12, fontWeight: 700 }}>
              Documents techniques
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docs.map((d, i) => (
                <a
                  key={i}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: B,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
                >
                  <div style={{
                    width: 40, height: 40,
                    background: '#FEE2E2',
                    color: '#991B1B',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}>PDF</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{d.nom}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {d.taille_mo} Mo
                    </div>
                  </div>
                  <div style={{ color: '#EA580C', fontSize: 18 }}>↓</div>
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Accessoires compatibles section (mini-pelles uniquement) */}
      {(product.categorie?.toLowerCase().includes('mini-pelle') || product.reference?.startsWith('MP-')) && (() => {
        const groupeCode = extractGroupeCode(product.reference);
        const accessoires = groupeCode ? getAccessoiresCompatibles(allProducts, groupeCode) : [];

        if (accessoires.length === 0) return <div style={{ height: 60 }} />;

        return (
          <section style={{ padding: '48px 0', background: '#F9FAFB' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
              <div style={{
                background: '#fff', padding: 24, borderRadius: 16,
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}>
                <span style={{ fontSize: 32 }}>🔧</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>
                    Accessoires compatibles {groupeCode}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                    {accessoires.length} accessoire{accessoires.length > 1 ? 's' : ''} disponible{accessoires.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Preview 3 accessoires */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16, marginBottom: 20,
              }}>
                {accessoires.slice(0, 3).map(a => (
                  <Link
                    key={a.id}
                    href={`/produit/${a.reference || a.id}`}
                  >
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      background: '#fff', borderRadius: 12, overflow: 'hidden',
                      textDecoration: 'none', color: '#0F172A',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                    }}>
                      <div style={{
                        aspectRatio: '4/3', background: '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {a.image_principale ? (
                          <img src={a.image_principale} alt={a.nom_fr} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 40 }}>🔧</span>
                        )}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nom_fr || a.reference}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{a.reference}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bouton voir tous */}
              <div style={{ textAlign: 'center' }}>
                <Link href={`/catalogue/accessoires?compatible=${groupeCode}`}>
                  <a style={{
                    display: 'inline-block', padding: '12px 32px',
                    background: '#EA580C', color: '#fff',
                    textDecoration: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700,
                  }}>
                    Voir tous les accessoires compatibles →
                  </a>
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Bottom padding if not mini-pelle */}
      {!(product.categorie?.toLowerCase().includes('mini-pelle') || product.reference?.startsWith('MP-')) && <div style={{ height: 60 }} />}
    </>
  );
}
