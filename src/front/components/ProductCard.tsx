import { Link } from 'wouter';
import PriceDisplay from './PriceDisplay';

const CAT_ICONS: Record<string, string> = {
  'Mini-Pelle': '🏗️', 'Maisons': '🏠', 'Solaire': '☀️',
  'machines-agricoles': '🚜', 'Divers': '📦',
};

interface ProductCardProps {
  product: any;
  userRole?: string | null;
  lang?: string;
}

export default function ProductCard({ product, userRole, lang = 'fr' }: ProductCardProps) {
  const img = product.images_urls?.[0];
  const icon = CAT_ICONS[product.categorie] || '📦';
  const name = lang === 'zh' ? (product.nom_zh || product.nom_fr) : lang === 'en' ? (product.nom_en || product.nom_fr) : product.nom_fr;

  return (
    <Link href={`/produit/${product.id}`}>
      <div style={{
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid #F3F4F6',
      }}
        onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
        onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
      >
        {/* Image */}
        <div style={{ height: 180, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', borderRadius: '12px 12px 0 0' }}>
          {img ? (
            <img src={img} alt={product.nom_fr || product.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 56 }}>{icon}</span>
          )}
          {product.badge && (
            <span style={{
              position: 'absolute', top: 8, left: 8, background: '#EA580C', color: 'white',
              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            }}>{product.badge}</span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{product.gamme || product.categorie}</div>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0B2545', marginBottom: 6, lineHeight: 1.3 }}>
            {(name || product.nom || product.numero_interne || '').replace(/\s*--\s*/g, ' — ')}
          </h3>

          {/* Tags */}
          {(product.poids_net_kg || product.longueur_cm) && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {product.poids_net_kg && <span style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 12, fontSize: 10 }}>{product.poids_net_kg}kg</span>}
              {product.marque && <span style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 12, fontSize: 10 }}>{product.marque}</span>}
            </div>
          )}

          {/* Prix */}
          <PriceDisplay product={product} userRole={userRole} size="sm" />
        </div>
      </div>
    </Link>
  );
}
