import { Link } from 'wouter';
import { useI18n } from '../../i18n';

export default function Footer() {
  const { t } = useI18n();

  const CATEGORIES = [
    { label: t('nav.miniPelles'), path: '/catalogue/Mini-Pelle' },
    { label: t('nav.maisons'), path: '/catalogue/Maisons' },
    { label: t('nav.solaire'), path: '/catalogue/Solaire' },
    { label: t('nav.agricole'), path: '/catalogue/machines-agricoles' },
    { label: t('nav.divers'), path: '/catalogue/Divers' },
  ];

  const SERVICES = [
    { label: t('footer.importCle'), path: '/services' },
    { label: t('footer.transport'), path: '/services' },
    { label: t('footer.dedouanement'), path: '/services' },
    { label: t('footer.livraison'), path: '/services' },
  ];

  const INFO = [
    { label: t('footer.mentions'), path: '/mentions-legales' },
    { label: t('footer.cgv'), path: '/cgv' },
    { label: t('footer.rgpd'), path: '/rgpd' },
    { label: t('nav.contact'), path: '/contact' },
  ];
  return (
    <footer style={{ background: '#1565C0', color: 'white', padding: '48px 0 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          {/* Col 1: Logo + Contact */}
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
              🚢 97<span style={{ color: '#EA580C' }}>IMPORT</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
              {t('footer.desc')}
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
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>{t('footer.categories')}</h4>
            {CATEGORIES.map(c => (
              <Link key={c.path} href={c.path}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginBottom: 8 }}>{c.label}</div>
              </Link>
            ))}
          </div>

          {/* Col 3: Services */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>{t('footer.services')}</h4>
            {SERVICES.map(s => (
              <Link key={s.label} href={s.path}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginBottom: 8 }}>{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Col 4: Infos */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>{t('footer.informations')}</h4>
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
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
