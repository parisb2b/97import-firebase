import { Link } from 'wouter';
import { useI18n } from '../../i18n';

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <div style={footerInnerStyle} className="footer-grid">

        {/* ═══ COLONNE 1 — Logo + slogan + contact ═══ */}
        <div style={columnStyle}>
          <Link href="/" style={footerLogoStyle}>
            <div style={{ fontSize: 28 }}>🚢</div>
            <div>
              <div style={footerLogoTextStyle}>
                97<span style={{ color: 'var(--orange)' }}>import</span>
                <span style={{ opacity: 0.6 }}>.com</span>
              </div>
              <div style={footerTaglineStyle}>
                {t('header.tagline') || 'Import Chine → DOM-TOM'}
              </div>
            </div>
          </Link>

          <p style={footerDescStyle}>
            {t('footer.desc') || 'Votre partenaire pour l\'importation de matériel professionnel depuis la Chine vers Martinique, Guadeloupe, Guyane et Réunion.'}
          </p>

          <div style={contactInfoStyle}>
            <div style={contactRowStyle}>
              <span>📧</span>
              <a href="mailto:contact@97import.com" style={contactLinkStyle}>
                contact@97import.com
              </a>
            </div>
            <div style={contactRowStyle}>
              <span>📱</span>
              <a href="https://wa.me/33663284908" style={contactLinkStyle}>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ═══ COLONNE 2 — Catalogue + Services ═══ */}
        <div style={columnStyle}>
          <h4 style={columnTitleStyle}>{t('footer.categories') || 'Catalogue'}</h4>
          <ul style={linkListStyle}>
            <FooterLink href="/catalogue/mini-pelle">{t('nav.miniPelles') || 'Mini-pelles'}</FooterLink>
            <FooterLink href="/catalogue/maison-modulaire">{t('nav.maisons') || 'Maisons modulaires'}</FooterLink>
            <FooterLink href="/catalogue/solaire">{t('nav.solaire') || 'Kits solaires'}</FooterLink>
            <FooterLink href="/catalogue/agricole">{t('nav.agricole') || 'Matériel agricole'}</FooterLink>
            <FooterLink href="/catalogue/divers">{t('nav.divers') || 'Divers'}</FooterLink>
          </ul>

          <h4 style={{ ...columnTitleStyle, marginTop: 24 }}>{t('footer.services') || 'Services'}</h4>
          <ul style={linkListStyle}>
            <FooterLink href="/services">{t('footer.importCle') || 'Logistique'}</FooterLink>
            <FooterLink href="/services">{t('footer.dedouanement') || 'Dédouanement'}</FooterLink>
            <FooterLink href="/services">SAV</FooterLink>
          </ul>
        </div>

        {/* ═══ COLONNE 3 — Compte + Réseaux ═══ */}
        <div style={columnStyle}>
          <h4 style={columnTitleStyle}>{t('footer.account') || 'Mon compte'}</h4>
          <ul style={linkListStyle}>
            <FooterLink href="/connexion">{t('auth.connexion') || 'Se connecter'}</FooterLink>
            <FooterLink href="/inscription">{t('auth.inscription') || 'Créer un compte'}</FooterLink>
            <FooterLink href="/mon-compte">{t('footer.myQuotes') || 'Mes devis'}</FooterLink>
            <FooterLink href="/contact">{t('nav.contact') || 'Contact'}</FooterLink>
          </ul>

          <h4 style={{ ...columnTitleStyle, marginTop: 24 }}>{t('footer.followUs') || 'Suivez-nous'}</h4>
          <div style={socialListStyle}>
            <a href="https://www.tiktok.com/@direxport" target="_blank" rel="noopener noreferrer" style={socialIconStyle}>
              📱 TikTok @direxport
            </a>
          </div>
        </div>
      </div>

      {/* ═══ BARRE BAS ═══ */}
      <div style={footerBottomStyle}>
        <div style={footerBottomInnerStyle} className="footer-bottom-inner">
          <div style={copyrightStyle}>
            © {year} 97import.com — {t('footer.allRights') || 'Tous droits réservés'}
          </div>
          <div style={legalLinksStyle}>
            <Link href="/cgv" style={legalLinkStyle}>CGV</Link>
            <Link href="/mentions-legales" style={legalLinkStyle}>{t('footer.mentions') || 'Mentions légales'}</Link>
            <Link href="/confidentialite" style={legalLinkStyle}>{t('footer.privacy') || 'Confidentialité'}</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-bottom-inner { flex-direction: column !important; text-align: center; gap: 12px !important; }
        }
      `}</style>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} style={footerLinkStyle}>
        {children}
      </Link>
    </li>
  );
}

/* ═══ STYLES ═══ */

const footerStyle: React.CSSProperties = {
  background: 'var(--blue)',
  color: '#fff',
  marginTop: 64,
};

const footerInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '48px 24px',
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 1fr',
  gap: 48,
};

const columnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const footerLogoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  textDecoration: 'none',
  color: '#fff',
  marginBottom: 16,
};

const footerLogoTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 22,
  fontWeight: 800,
  lineHeight: 1.1,
};

const footerTaglineStyle: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.8,
  marginTop: 2,
};

const footerDescStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  opacity: 0.85,
  marginBottom: 20,
};

const contactInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const contactRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 13,
};

const contactLinkStyle: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  opacity: 0.9,
};

const columnTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 14,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  opacity: 0.95,
};

const linkListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const footerLinkStyle: React.CSSProperties = {
  color: '#fff',
  opacity: 0.85,
  textDecoration: 'none',
  fontSize: 13,
  transition: 'var(--transition-fast)',
};

const socialListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const socialIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#fff',
  opacity: 0.9,
  textDecoration: 'none',
  fontSize: 13,
};

const footerBottomStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(0,0,0,0.1)',
};

const footerBottomInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '16px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
};

const copyrightStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
};

const legalLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
};

const legalLinkStyle: React.CSSProperties = {
  color: '#fff',
  opacity: 0.75,
  textDecoration: 'none',
  fontSize: 12,
};
