import { Link } from 'wouter';
import { getImagePrincipale } from '@/lib/productMediaHelpers';
import PriceDisplay from './PriceDisplay';

interface Props {
  product: any;
  onAddToCart?: () => void;
}

export default function ProductCard({ product }: Props) {
  const img = getImagePrincipale(product);
  const ref = product.reference || product.id;

  // Badges dynamiques
  const badges: { label: string; color: string }[] = [];

  // Badge nouveau si créé < 30 jours
  if (product.created_at) {
    const created = product.created_at?.toDate ? product.created_at.toDate() : new Date(product.created_at);
    const daysAgo = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 30) {
      badges.push({ label: 'Nouveau', color: 'var(--success)' });
    }
  }

  // Badge VIP si prix négocié
  if (product.is_vip) {
    badges.push({ label: 'VIP', color: '#7c3aed' });
  }

  return (
    <Link href={`/produit/${ref}`} style={cardStyle} className="product-card">
      {/* Image avec badges overlay */}
      <div style={imageWrapperStyle}>
        {img ? (
          <img
            src={img}
            alt={product.nom_fr || ref}
            style={imageStyle}
            loading="lazy"
          />
        ) : (
          <div style={placeholderStyle}>
            <span style={{ fontSize: 40 }}>📦</span>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div style={badgesContainerStyle}>
            {badges.map((b, i) => (
              <span
                key={i}
                style={{ ...badgeStyle, background: b.color }}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Référence en bas */}
        <div style={refOverlayStyle}>
          <code style={refCodeStyle}>{ref}</code>
        </div>
      </div>

      {/* Contenu */}
      <div style={contentStyle}>
        {/* Catégorie chip */}
        {product.categorie && (
          <div style={categoryChipStyle}>{product.categorie}</div>
        )}

        {/* Nom */}
        <h3 style={nameStyle}>{product.nom_fr || ref}</h3>

        {/* Description courte */}
        {product.description_courte_fr && (
          <p style={descStyle}>
            {product.description_courte_fr.substring(0, 80)}
            {product.description_courte_fr.length > 80 ? '...' : ''}
          </p>
        )}

        {/* Prix */}
        <div style={priceWrapperStyle}>
          <PriceDisplay product={product} />
        </div>
      </div>
    </Link>
  );
}

/* ═══ STYLES ═══ */

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'var(--text)',
  boxShadow: 'var(--shadow)',
  transition: 'var(--transition)',
  cursor: 'pointer',
  height: '100%',
};

const imageWrapperStyle: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '4/3',
  background: 'var(--bg-2)',
  overflow: 'hidden',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const placeholderStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-3)',
};

const badgesContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  color: '#fff',
  borderRadius: 'var(--radius-full)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  boxShadow: 'var(--shadow-sm)',
};

const refOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  right: 8,
};

const refCodeStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.7)',
  color: '#fff',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 10,
  fontFamily: 'monospace',
  fontWeight: 600,
};

const contentStyle: React.CSSProperties = {
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const categoryChipStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  borderRadius: 'var(--radius-full)',
  fontSize: 10,
  fontWeight: 600,
  marginBottom: 8,
  alignSelf: 'flex-start',
  textTransform: 'capitalize',
};

const nameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: 6,
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const descStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-3)',
  lineHeight: 1.5,
  marginBottom: 12,
  flex: 1,
};

const priceWrapperStyle: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: 8,
  borderTop: '1px solid var(--border)',
};
