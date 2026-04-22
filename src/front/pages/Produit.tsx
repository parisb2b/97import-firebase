import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'wouter';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getImagePrincipale,
  getMediasOrdonnesPourSite,
  getDocumentsPdf,
  getDescriptionMarketing,
  getPointsForts,
} from '@/lib/productMediaHelpers';
import PriceDisplay from '@/front/components/PriceDisplay';
import ProductCard from '@/front/components/ProductCard';

type Tab = 'description' | 'specs' | 'forts' | 'documents';

export default function Produit() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [kitComponents, setKitComponents] = useState<any[]>([]);

  // Charger le produit
  useEffect(() => {
    if (!productId) return;

    (async () => {
      setLoading(true);
      try {
        // Essayer d'abord par référence (productId = reference dans v35g)
        let prodSnap = await getDoc(doc(db, 'products', productId));

        // Si pas trouvé, chercher par champ reference
        if (!prodSnap.exists()) {
          const allSnap = await getDocs(collection(db, 'products'));
          const found = allSnap.docs.find(d => d.data().reference === productId);
          if (found) {
            prodSnap = found;
          }
        }

        if (prodSnap.exists()) {
          const data = { id: prodSnap.id, ...prodSnap.data() };
          setProduct(data);
        }
      } catch (err) {
        console.error('Erreur chargement produit:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Charger les produits similaires + composition kit
  useEffect(() => {
    if (!product) return;

    (async () => {
      try {
        const allSnap = await getDocs(collection(db, 'products'));
        const all = allSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // Produits similaires : même catégorie, exclu le produit courant, max 4
        const similar = all
          .filter(p =>
            p.id !== product.id &&
            p.actif !== false &&
            p.categorie === product.categorie &&
            !p.ref_parente
          )
          .slice(0, 4);
        setSimilarProducts(similar);

        // Composition kit (si produit est un kit)
        if (product.est_kit && Array.isArray(product.composition_kit)) {
          const components = product.composition_kit
            .map((c: any) => {
              if (typeof c === 'string') return null;
              const found = all.find(p => p.reference === c.ref || p.id === c.ref);
              return found ? { ...found, _qte_par_kit: c.qte_par_kit || 1 } : null;
            })
            .filter(Boolean);
          setKitComponents(components);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [product]);

  const medias = useMemo(() => product ? getMediasOrdonnesPourSite(product) : [], [product]);
  const imagePrincipale = useMemo(() => product ? getImagePrincipale(product) : null, [product]);
  const description = useMemo(() => product ? getDescriptionMarketing(product, 'fr') : '', [product]);
  const pointsForts = useMemo(() => product ? getPointsForts(product) : [], [product]);
  const documentsPdf = useMemo(() => product ? getDocumentsPdf(product) : [], [product]);

  if (loading) {
    return (
      <div style={loadingStyle}>
        Chargement du produit...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={notFoundStyle}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <h2 style={{ marginBottom: 8 }}>Produit introuvable</h2>
        <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>
          Le produit "{productId}" n'existe pas ou n'est plus disponible.
        </p>
        <Link href="/catalogue" style={btnPrimaryStyle}>
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const ref = product.reference || product.id;
  const cat = product.categorie || '';

  // Specs techniques en tableau
  const specs: { label: string; value: string | number }[] = [];
  if (product.matiere_fr) specs.push({ label: 'Matière', value: product.matiere_fr });
  if (product.longueur_cm) specs.push({ label: 'Longueur', value: `${product.longueur_cm} cm` });
  if (product.largeur_cm) specs.push({ label: 'Largeur', value: `${product.largeur_cm} cm` });
  if (product.hauteur_cm) specs.push({ label: 'Hauteur', value: `${product.hauteur_cm} cm` });
  if (product.poids_brut_kg) specs.push({ label: 'Poids brut', value: `${product.poids_brut_kg} kg` });
  if (product.poids_net_kg) specs.push({ label: 'Poids net', value: `${product.poids_net_kg} kg` });
  if (product.volume_m3) specs.push({ label: 'Volume', value: `${product.volume_m3} m³` });
  if (product.code_hs) specs.push({ label: 'Code HS douane', value: product.code_hs });
  if (product.pays_origine) specs.push({ label: 'Pays origine', value: product.pays_origine });
  if (product.fournisseur) specs.push({ label: 'Fournisseur', value: product.fournisseur });
  if (product.ce_certification) specs.push({ label: 'Certification CE', value: 'Oui' });

  const handleAddToCart = () => {
    try {
      const stored = localStorage.getItem('cart');
      const cart = stored ? JSON.parse(stored) : [];

      const existingIndex = cart.findIndex((item: any) => item.ref === ref);
      if (existingIndex >= 0) {
        cart[existingIndex].qte += quantity;
      } else {
        cart.push({
          ref,
          nom_fr: product.nom_fr,
          prix_unitaire: product.prix_achat ? product.prix_achat * 2 : 0, // user price
          qte: quantity,
          image: imagePrincipale,
          categorie: cat,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`✅ ${product.nom_fr} ajouté au panier (x${quantity})`);
      // Rafraîchir le badge panier dans le header
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert('Erreur ajout panier : ' + err.message);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour, je suis intéressé par le produit ${product.nom_fr} (réf ${ref}). Pouvez-vous m'envoyer plus d'informations ?`
    );
    window.open(`https://wa.me/33620607448?text=${message}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>
      {/* ═══ BREADCRUMB ═══ */}
      <div style={breadcrumbStyle}>
        <div style={breadcrumbInnerStyle}>
          <Link href="/" style={breadcrumbLinkStyle}>Accueil</Link>
          <span style={breadcrumbSepStyle}>›</span>
          <Link href="/catalogue" style={breadcrumbLinkStyle}>Catalogue</Link>
          {cat && (
            <>
              <span style={breadcrumbSepStyle}>›</span>
              <Link href={`/catalogue/${cat.toLowerCase()}`} style={breadcrumbLinkStyle}>
                {cat}
              </Link>
            </>
          )}
          <span style={breadcrumbSepStyle}>›</span>
          <span style={{ color: 'var(--text)' }}>{product.nom_fr || ref}</span>
        </div>
      </div>

      {/* ═══ LAYOUT PRINCIPAL ═══ */}
      <div style={mainStyle}>
        <div style={mainInnerStyle} className="product-layout">

          {/* ═══ GAUCHE : GALERIE ═══ */}
          <div style={galleryColumnStyle}>
            <div style={mainMediaStyle}>
              {medias.length > 0 ? (
                medias[selectedMediaIndex]?.type === 'video' ? (
                  <video
                    key={selectedMediaIndex}
                    src={medias[selectedMediaIndex].url}
                    controls
                    poster={medias[selectedMediaIndex].thumbnail}
                    style={mainImageStyle}
                  />
                ) : (
                  <img
                    src={medias[selectedMediaIndex]?.url}
                    alt={product.nom_fr}
                    style={mainImageStyle}
                  />
                )
              ) : imagePrincipale ? (
                <img
                  src={imagePrincipale}
                  alt={product.nom_fr}
                  style={mainImageStyle}
                />
              ) : (
                <div style={noImageStyle}>
                  <span style={{ fontSize: 60 }}>📦</span>
                </div>
              )}
            </div>

            {/* Miniatures */}
            {medias.length > 1 && (
              <div style={thumbsGridStyle}>
                {medias.slice(0, 8).map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMediaIndex(i)}
                    style={{
                      ...thumbStyle,
                      borderColor: selectedMediaIndex === i ? 'var(--orange)' : 'var(--border)',
                    }}
                  >
                    <img
                      src={m.type === 'video' ? (m.thumbnail || m.url) : m.url}
                      alt=""
                      style={thumbImageStyle}
                    />
                    {m.type === 'video' && (
                      <div style={videoIconStyle}>▶</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══ DROITE : INFO + CTA ═══ */}
          <div style={infoColumnStyle}>

            {/* Catégorie chip */}
            {cat && (
              <Link href={`/catalogue/${cat.toLowerCase()}`} style={catChipStyle}>
                {cat}
              </Link>
            )}

            {/* Nom */}
            <h1 style={productNameStyle}>{product.nom_fr || ref}</h1>

            {/* Référence */}
            <div style={refDisplayStyle}>
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Référence :</span>
              <code style={refCodeStyle}>{ref}</code>
              {product.is_vip && (
                <span style={vipBadgeStyle}>VIP</span>
              )}
            </div>

            {/* Description courte */}
            {product.description_courte_fr && (
              <p style={shortDescStyle}>{product.description_courte_fr}</p>
            )}

            {/* Prix */}
            <div style={priceBlockStyle}>
              <PriceDisplay product={product} />
            </div>

            {/* Sélecteur quantité + boutons CTA */}
            <div style={ctaBlockStyle}>
              <div style={qtyStyle}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={qtyBtnStyle}
                >−</button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={qtyInputStyle}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={qtyBtnStyle}
                >+</button>
              </div>

              <button onClick={handleAddToCart} style={btnAddCartStyle}>
                🛒 Ajouter au panier
              </button>
            </div>

            <div style={secondaryCtaStyle}>
              <Link href="/contact" style={btnSecondaryStyle}>
                📋 Demander un devis
              </Link>
              <button onClick={handleWhatsApp} style={btnWhatsappStyle}>
                💬 WhatsApp
              </button>
            </div>

            {/* Avantages */}
            <div style={advantagesStyle}>
              <div style={advantageRowStyle}>
                <span>🚢</span>
                <span>Livraison maritime DOM-TOM</span>
              </div>
              <div style={advantageRowStyle}>
                <span>✅</span>
                <span>Conformité CE garantie</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION COMPOSITION KIT (si applicable) ═══ */}
      {product.est_kit && kitComponents.length > 0 && (
        <section style={sectionStyle}>
          <div style={sectionInnerStyle}>
            <h2 style={sectionTitleStyle}>Composition du kit</h2>
            <div style={kitTableStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Quantité</th>
                    <th style={thStyle}>Référence</th>
                    <th style={thStyle}>Désignation</th>
                  </tr>
                </thead>
                <tbody>
                  {kitComponents.map((c, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>
                        <strong>{c._qte_par_kit}</strong>
                      </td>
                      <td style={tdStyle}>
                        <code style={refCodeStyle}>{c.reference || c.id}</code>
                      </td>
                      <td style={tdStyle}>{c.nom_fr || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ═══ ONGLETS CONTENU ═══ */}
      <section style={sectionStyle}>
        <div style={sectionInnerStyle}>
          <div style={tabsHeaderStyle}>
            {[
              { id: 'description' as Tab, label: 'Description', show: !!description },
              { id: 'specs' as Tab, label: 'Spécifications techniques', show: specs.length > 0 },
              { id: 'forts' as Tab, label: 'Points forts', show: pointsForts.length > 0 },
              { id: 'documents' as Tab, label: 'Documents', show: documentsPdf.length > 0 },
            ].filter(t => t.show).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  ...tabBtnStyle,
                  ...(activeTab === t.id ? tabBtnActiveStyle : {}),
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={tabContentStyle}>
            {activeTab === 'description' && description && (
              <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                {description}
              </div>
            )}

            {activeTab === 'specs' && specs.length > 0 && (
              <table style={tableStyle}>
                <tbody>
                  {specs.map((s, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontWeight: 600, width: '40%', background: 'var(--bg-2)' }}>
                        {s.label}
                      </td>
                      <td style={tdStyle}>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'forts' && pointsForts.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pointsForts.map((pt, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, fontSize: 15, color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 18 }}>✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'documents' && documentsPdf.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {documentsPdf.map((d, i) => (
                  <a
                    key={i}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={pdfCardStyle}
                  >
                    <div style={pdfIconStyle}>PDF</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{d.nom}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                        {d.taille_mo} Mo
                      </div>
                    </div>
                    <span style={{ color: 'var(--orange)', fontSize: 18 }}>↓</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ PRODUITS SIMILAIRES ═══ */}
      {similarProducts.length > 0 && (
        <section style={sectionStyle}>
          <div style={sectionInnerStyle}>
            <h2 style={sectionTitleStyle}>Produits similaires</h2>
            <div style={similarGridStyle}>
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .product-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══ STYLES ═══ */

const loadingStyle: React.CSSProperties = {
  padding: 80,
  textAlign: 'center',
  color: 'var(--text-3)',
};

const notFoundStyle: React.CSSProperties = {
  padding: 80,
  textAlign: 'center',
  color: 'var(--text-2)',
};

const breadcrumbStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid var(--border)',
};

const breadcrumbInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  color: 'var(--text-3)',
  flexWrap: 'wrap',
};

const breadcrumbLinkStyle: React.CSSProperties = {
  color: 'var(--text-3)',
  textDecoration: 'none',
};

const breadcrumbSepStyle: React.CSSProperties = {
  opacity: 0.5,
};

const mainStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid var(--border)',
};

const mainInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '32px 24px 48px',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 48,
};

const galleryColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const mainMediaStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '4/3',
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
};

const mainImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
};

const noImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-3)',
};

const thumbsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
  gap: 8,
};

const thumbStyle: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1',
  background: 'var(--bg-2)',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  cursor: 'pointer',
  padding: 0,
  transition: 'var(--transition-fast)',
};

const thumbImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const videoIconStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'rgba(0,0,0,0.7)',
  color: '#fff',
  width: 24,
  height: 24,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
};

const infoColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const catChipStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  borderRadius: 'var(--radius-full)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'capitalize',
  textDecoration: 'none',
  alignSelf: 'flex-start',
  marginBottom: 12,
};

const productNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 'clamp(22px, 3vw, 32px)',
  fontWeight: 800,
  color: 'var(--text)',
  lineHeight: 1.2,
  margin: '0 0 16px',
};

const refDisplayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
};

const refCodeStyle: React.CSSProperties = {
  background: 'var(--bg-2)',
  color: 'var(--text-2)',
  padding: '3px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
  fontFamily: 'monospace',
  fontWeight: 600,
};

const vipBadgeStyle: React.CSSProperties = {
  background: '#7c3aed',
  color: '#fff',
  padding: '3px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
};

const shortDescStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-2)',
  lineHeight: 1.6,
  marginBottom: 24,
};

const priceBlockStyle: React.CSSProperties = {
  padding: 20,
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius-lg)',
  marginBottom: 24,
};

const ctaBlockStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 12,
};

const qtyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: '#fff',
  overflow: 'hidden',
};

const qtyBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--text)',
  fontFamily: 'inherit',
};

const qtyInputStyle: React.CSSProperties = {
  width: 50,
  padding: '10px 0',
  border: 'none',
  borderLeft: '1px solid var(--border)',
  borderRight: '1px solid var(--border)',
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
  fontFamily: 'inherit',
};

const btnAddCartStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 20px',
  background: 'var(--orange)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'var(--transition)',
};

const secondaryCtaStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 24,
};

const btnSecondaryStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  background: 'var(--bg)',
  color: 'var(--blue)',
  border: '1px solid var(--blue)',
  borderRadius: 'var(--radius)',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnWhatsappStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  background: '#25D366',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnPrimaryStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  background: 'var(--orange)',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 'var(--radius)',
  fontWeight: 600,
};

const advantagesStyle: React.CSSProperties = {
  padding: 16,
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const advantageRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 13,
  color: 'var(--text-2)',
};

const sectionStyle: React.CSSProperties = {
  padding: '48px 0',
};

const sectionInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '0 24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 24,
  fontWeight: 800,
  color: 'var(--text)',
  marginBottom: 24,
};

const kitTableStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-sm)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-3)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  background: 'var(--bg-2)',
  borderBottom: '1px solid var(--border)',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
  color: 'var(--text)',
  borderBottom: '1px solid var(--border)',
};

const tabsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  borderBottom: '2px solid var(--border)',
  marginBottom: 24,
  flexWrap: 'wrap',
};

const tabBtnStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  marginBottom: -2,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-3)',
  fontFamily: 'inherit',
  transition: 'var(--transition-fast)',
};

const tabBtnActiveStyle: React.CSSProperties = {
  color: 'var(--blue)',
  borderBottomColor: 'var(--blue)',
};

const tabContentStyle: React.CSSProperties = {
  background: '#fff',
  padding: 32,
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
};

const pdfCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 18px',
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
  color: 'var(--text)',
  transition: 'var(--transition-fast)',
};

const pdfIconStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  background: '#FEE2E2',
  color: '#991B1B',
  borderRadius: 'var(--radius)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
};

const similarGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 20,
};
