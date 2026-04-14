import { Link } from 'wouter';

interface PriceDisplayProps {
  product: any;
  userRole?: string | null; // null = visitor, 'user', 'partner', 'vip', 'admin'
  size?: 'sm' | 'md' | 'lg';
}

function getAchat(product: any): number {
  return product.prix_achat_eur || product.prix_achat || 0;
}

function getAchatCNY(product: any): number {
  return product.prix_achat_cny || product.prix_achat_yuan || 0;
}

function getPublic(product: any): number {
  return product.prix_public_eur || product.prix_public || Math.round(getAchat(product) * 2) || 0;
}

export function getProductPrice(product: any, role: string | null | undefined): number {
  const achat = getAchat(product);
  const pub = getPublic(product);
  if (!achat && !pub) return 0;
  if (role === 'partner') return Math.round(achat * 1.2) || Math.round(pub * 0.6);
  return pub || Math.round(achat * 2);
}

export default function PriceDisplay({ product, userRole, size = 'md' }: PriceDisplayProps) {
  const achat = getAchat(product);
  const achatCNY = getAchatCNY(product);
  const pub = getPublic(product);
  const partner = Math.round(achat * 1.2) || Math.round(pub * 0.6);

  // Visitor — locked
  if (!userRole) {
    if (size === 'sm') {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #B71C1C, #C62828)', color: 'white', borderRadius: 12,
          padding: '6px 12px', fontSize: 11, fontWeight: 600, textAlign: 'center',
        }}>
          🔒 Connectez-vous
        </div>
      );
    }
    return (
      <div style={{
        background: 'linear-gradient(135deg, #B71C1C, #C62828)', borderRadius: 16, padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
        <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Prix reserve aux membres</h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 14 }}>Creez un compte gratuit pour voir les prix</p>
        <Link href="/connexion">
          <span style={{
            display: 'inline-block', background: '#fff', color: '#C62828', borderRadius: 10,
            padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Se connecter / Creer un compte
          </span>
        </Link>
      </div>
    );
  }

  // No price data
  if (!achat && !pub) return <span style={{ fontSize: 12, color: '#6B7280' }}>Sur devis</span>;

  // Admin — show all 4 prices
  if (userRole === 'admin') {
    if (size === 'sm') {
      return (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0B2545' }}>{achat.toLocaleString('fr-FR')} €</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Achat · Pub: {pub.toLocaleString('fr-FR')}€</div>
        </div>
      );
    }
    const prices = [
      achatCNY > 0 && { label: 'Achat ¥', value: achatCNY, suffix: ' ¥', dim: true },
      achat > 0 && { label: 'Achat €', value: achat, suffix: ' €', dim: false },
      partner > 0 && { label: 'Partenaire', value: partner, suffix: ' €', dim: false },
      pub > 0 && { label: 'Public', value: pub, suffix: ' €', dim: false },
    ].filter(Boolean) as { label: string; value: number; suffix: string; dim: boolean }[];

    return (
      <div style={{
        background: 'linear-gradient(135deg, #0B2545, #1565C0)', borderRadius: 16, padding: 20,
      }}>
        {prices.map((p, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            borderBottom: i < prices.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{p.label}</span>
            <span style={{ color: p.dim ? 'rgba(255,255,255,0.5)' : '#fff', fontSize: 18, fontWeight: 700 }}>
              {Math.round(p.value).toLocaleString('fr-FR')}{p.suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Partner
  if (userRole === 'partner') {
    const fontSize = size === 'lg' ? 28 : size === 'md' ? 20 : 14;
    return (
      <div>
        <div style={{ fontSize, fontWeight: 800, color: '#0B2545' }}>
          {partner.toLocaleString('fr-FR')} € <span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>HT</span>
        </div>
        {size !== 'sm' && <div style={{ fontSize: 11, color: '#6B7280' }}>Prix partenaire · Hors livraison</div>}
      </div>
    );
  }

  // User / VIP
  const fontSize = size === 'lg' ? 28 : size === 'md' ? 20 : 14;
  return (
    <div>
      <div style={{ fontSize, fontWeight: 800, color: '#0B2545' }}>
        {pub.toLocaleString('fr-FR')} € <span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>HT</span>
      </div>
      {size !== 'sm' && <div style={{ fontSize: 11, color: '#6B7280' }}>Prix public · Hors livraison</div>}
    </div>
  );
}
