import { Link } from 'wouter'

const NAVY = '#1B2A4A'

const footerLinkStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
  textDecoration: 'none',
  fontSize: 13,
  lineHeight: '2',
  display: 'block',
  transition: 'color 0.2s',
}

export default function Footer() {
  return (
    <footer style={{
      background: NAVY,
      color: '#fff',
      padding: '48px 20px 24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 32,
      }}>
        {/* Navigation */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#fff' }}>Navigation</h4>
          <Link href="/" style={footerLinkStyle}>Accueil</Link>
          <Link href="/catalogue" style={footerLinkStyle}>Catalogue</Link>
          <Link href="/services" style={footerLinkStyle}>Services</Link>
          <Link href="/livraison" style={footerLinkStyle}>Livraison</Link>
          <Link href="/contact" style={footerLinkStyle}>Contact</Link>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#fff' }}>Categories</h4>
          <Link href="/mini-pelles" style={footerLinkStyle}>Mini-pelles</Link>
          <Link href="/maisons" style={footerLinkStyle}>Maisons modulaires</Link>
          <Link href="/solaire" style={footerLinkStyle}>Kits solaires</Link>
          <Link href="/accessoires" style={footerLinkStyle}>Accessoires</Link>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#fff' }}>Contact</h4>
          <a
            href="https://wa.me/33663284908"
            target="_blank"
            rel="noopener noreferrer"
            style={footerLinkStyle}
          >
            WhatsApp: +33 6 63 28 49 08
          </a>
          <a href="mailto:contact@97import.com" style={footerLinkStyle}>
            contact@97import.com
          </a>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <a href="#" aria-label="Facebook" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
            </a>
            <a href="#" aria-label="Instagram" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
            </a>
          </div>
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#fff' }}>Legal</h4>
          <Link href="/legal" style={footerLinkStyle}>Mentions legales</Link>
          <Link href="/confidentialite" style={footerLinkStyle}>Politique de confidentialite</Link>
          <Link href="/cgv" style={footerLinkStyle}>CGV</Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        marginTop: 36,
        paddingTop: 20,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
      }}>
        &copy; 2026 97import.com — Import de marchandises chinoises vers les DOM-TOM
      </div>
    </footer>
  )
}
