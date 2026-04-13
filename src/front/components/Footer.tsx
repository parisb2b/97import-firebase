import { Link } from 'wouter';

const CATEGORIES = [
  { label: 'Mini-Pelles', path: '/catalogue/Mini-Pelle' },
  { label: 'Maisons Modulaires', path: '/catalogue/Maisons' },
  { label: 'Kits Solaires', path: '/catalogue/Solaire' },
  { label: 'Machines Agricoles', path: '/catalogue/machines-agricoles' },
  { label: 'Divers', path: '/catalogue/Divers' },
];

const SERVICES = [
  { label: 'Import clé en main', path: '/services' },
  { label: 'Transport maritime', path: '/services' },
  { label: 'Dédouanement', path: '/services' },
  { label: 'Livraison DOM-TOM', path: '/services' },
];

const INFO = [
  { label: 'Mentions légales', path: '/mentions-legales' },
  { label: 'CGV', path: '/cgv' },
  { label: 'RGPD', path: '/rgpd' },
  { label: 'Contact', path: '/contact' },
];

export default function Footer() {
  return (
    <footer style={{ background: '#0B2545', color: 'white', padding: '48px 0 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          {/* Col 1: Logo + Contact */}
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
              🚢 97<span style={{ color: '#EA580C' }}>IMPORT</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
              Import direct de Chine vers les DOM-TOM. Mini-pelles, maisons modulaires, kits solaires.
              Prix usine, livraison maritime incluse.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <a href="https://wa.me/33663284908" style={{
                background: '#25D366', borderRadius: 8, padding: '6px 14px', fontSize: 12,
                color: 'white', textDecoration: 'none', fontWeight: 600,
              }}>WhatsApp</a>
              <a href="mailto:parisb2b@gmail.com" style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', fontSize: 12,
                color: 'white', textDecoration: 'none',
              }}>Email</a>
            </div>
          </div>

          {/* Col 2: Catégories */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Catégories</h4>
            {CATEGORIES.map(c => (
              <Link key={c.path} href={c.path}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginBottom: 8 }}>{c.label}</div>
              </Link>
            ))}
          </div>

          {/* Col 3: Services */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Services</h4>
            {SERVICES.map(s => (
              <Link key={s.label} href={s.path}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginBottom: 8 }}>{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Col 4: Infos */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Informations</h4>
            {INFO.map(i => (
              <Link key={i.label} href={i.path}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginBottom: 8 }}>{i.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.15)',
          marginTop: 32,
          paddingTop: 16,
          textAlign: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
        }}>
          © {new Date().getFullYear()} 97import.com — Tous droits réservés · LUXENT LIMITED · N° 14852122
        </div>
      </div>
    </footer>
  );
}
