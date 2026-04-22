import { useClientAuth } from '@/front/hooks/useClientAuth';

interface Props {
  product: any;
}

export default function PriceDisplay({ product }: Props) {
  const { role, loading } = useClientAuth();

  if (loading) {
    return <div style={{ fontSize: 13, color: 'var(--text-3)' }}>...</div>;
  }

  const prixAchat = product.prix_achat || 0;

  if (role === 'visitor') {
    return (
      <div>
        <div style={{
          padding: '10px 12px', background: 'var(--bg-2)',
          borderLeft: '3px solid var(--orange)',
          borderRadius: 'var(--radius-sm)', marginBottom: 8,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, marginBottom: 4 }}>
            🔒 Prix réservé aux utilisateurs
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Connectez-vous pour voir les prix
          </div>
        </div>
        <a href="/connexion" style={{
          display: 'inline-block', padding: '6px 12px',
          background: '#DC2626', color: '#fff', textDecoration: 'none',
          borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600,
        }}>
          Se connecter
        </a>
      </div>
    );
  }

  if (role === 'vip' && product.prix_vip_negocie && product.prix_vip_negocie > 0) {
    const prixPublic = prixAchat * 2;
    return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Prix public :</div>
        <div style={{
          fontSize: 14, color: 'var(--text-3)',
          textDecoration: 'line-through', marginBottom: 8
        }}>
          {prixPublic.toLocaleString('fr-FR')} €
        </div>
        <div style={{ fontSize: 11, color: '#7c3aed', marginBottom: 2, fontWeight: 600 }}>
          Prix VIP négocié HT :
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>
          {product.prix_vip_negocie.toLocaleString('fr-FR')} €
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
        <div style={{ marginBottom: 4 }}><strong>Admin</strong> — Tous les prix :</div>
        <div>💼 Achat : <strong>{prixAchat.toLocaleString('fr-FR')} €</strong></div>
        <div style={{ color: 'var(--orange)' }}>🤝 Partenaire : <strong>{(prixAchat * 1.2).toLocaleString('fr-FR')} €</strong></div>
        <div style={{ color: 'var(--blue)' }}>🏷️ Public : <strong>{(prixAchat * 2).toLocaleString('fr-FR')} €</strong></div>
        {product.prix_vip_negocie && (
          <div style={{ color: '#7c3aed' }}>
            ⭐ VIP : <strong>{product.prix_vip_negocie.toLocaleString('fr-FR')} €</strong>
          </div>
        )}
      </div>
    );
  }

  // user, vip sans prix négocié, partner
  let prixAffiche = 0;
  let libelle = '';
  let couleur = 'var(--blue)';

  if (role === 'partner') {
    prixAffiche = prixAchat * 1.2;
    libelle = 'Prix partenaire HT';
    couleur = 'var(--orange)';
  } else {
    prixAffiche = prixAchat * 2;
    libelle = 'Prix public HT';
    couleur = 'var(--blue)';
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2, fontWeight: 500 }}>
        {libelle} :
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: couleur }}>
        {prixAffiche.toLocaleString('fr-FR')} €
      </div>
    </div>
  );
}
