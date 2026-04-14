interface PriceDisplayProps {
  product: any;
  userRole?: string | null; // null = visitor, 'user', 'partner', 'vip', 'admin'
  size?: 'sm' | 'md' | 'lg';
}

export default function PriceDisplay({ product, userRole, size = 'md' }: PriceDisplayProps) {
  if (!userRole) {
    return (
      <div style={{
        background: '#DC2626', color: 'white', borderRadius: 12,
        padding: size === 'sm' ? '6px 12px' : '10px 16px',
        fontSize: size === 'sm' ? 11 : 13, fontWeight: 600, textAlign: 'center',
      }}>
        🔒 Se connecter pour voir le prix
      </div>
    );
  }

  const prixAchat = product.prix_achat || 0;
  let price = prixAchat * 2;
  let label = 'Prix client';

  if (userRole === 'partner') { price = prixAchat * 1.2; label = 'Prix partenaire'; }
  if (userRole === 'admin') { price = prixAchat; label = 'Prix achat'; }

  if (!prixAchat) return <span style={{ fontSize: 12, color: '#6B7280' }}>Sur devis</span>;

  const fontSize = size === 'lg' ? 28 : size === 'md' ? 20 : 14;

  return (
    <div>
      <div style={{ fontSize, fontWeight: 800, color: '#0B2545' }}>
        {Math.round(price).toLocaleString('fr-FR')} € <span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>HT</span>
      </div>
      {size !== 'sm' && (
        <div style={{ fontSize: 11, color: '#6B7280' }}>{label} · Hors livraison</div>
      )}
      {userRole === 'admin' && (
        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
          Public: {Math.round(prixAchat * 2).toLocaleString('fr-FR')}€ · Part: {Math.round(prixAchat * 1.2).toLocaleString('fr-FR')}€
        </div>
      )}
    </div>
  );
}
