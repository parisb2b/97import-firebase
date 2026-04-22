import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import SearchBar from './SearchBar';
import { useClientAuth } from '../hooks/useClientAuth';

export default function Header() {
  const [location] = useLocation();
  const { t, lang, setLang } = useI18n();
  const { user, role } = useClientAuth();
  const [cartCount, setCartCount] = useState(0);
  const [times, setTimes] = useState({ paris: '', martinique: '', chine: '' });
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // 3 horloges (mise à jour chaque minute)
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setTimes({
        paris: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        martinique: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Martinique' }),
        chine: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }),
      });
    };
    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, []);

  // Récupérer le compte panier
  useEffect(() => {
    const updateCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.reduce((sum: number, item: any) => sum + (item.qte || 1), 0));
      } catch { setCartCount(0); }
    };
    updateCount();
    window.addEventListener('cart-updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [location]);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(clientAuth);
      setShowUserMenu(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Items de navigation
  const navItems = [
    { label: t('nav.accueil'), icon: '🏠', path: '/', exact: true },
    { label: t('nav.miniPelles'), icon: '🚜', path: '/catalogue/mini-pelle' },
    { label: t('nav.maisons'), icon: '🏡', path: '/catalogue/maison-modulaire' },
    { label: t('nav.solaire'), icon: '☀️', path: '/catalogue/solaire' },
    { label: t('nav.agricole'), icon: '🌾', path: '/catalogue/agricole' },
    { label: t('nav.divers'), icon: '📦', path: '/catalogue/divers' },
    { label: t('nav.contact'), icon: '📞', path: '/contact' },
  ];

  return (
    <header style={headerStyle}>
      <div style={headerInnerStyle}>

        {/* ═══ LOGO ═══ */}
        <Link href="/" style={logoStyle}>
          <div style={logoIconStyle}>🚢</div>
          <div>
            <div style={logoTextStyle}>
              97<span style={{ color: 'var(--orange)' }}>import</span>
              <span style={logoDomainStyle}>.com</span>
            </div>
            <div style={logoTaglineStyle}>{t('header.tagline') || 'Direct usine Chine'}</div>
          </div>
        </Link>

        {/* ═══ NAVIGATION CENTRALE (desktop only) ═══ */}
        <nav className="nav-desktop" style={navStyle}>
          {navItems.map(item => {
            const isActive = (item as any).exact
              ? location === item.path
              : location.startsWith(item.path) && item.path !== '/';
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  ...navItemStyle,
                  ...(isActive ? navItemActiveStyle : {}),
                }}
              >
                <span style={navIconStyle}>{item.icon}</span>
                <span style={navLabelStyle}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ═══ ZONE DROITE ═══ */}
        <div style={rightZoneStyle}>

          {/* 3 horloges (cachées sur mobile) */}
          <div className="header-clock" style={clocksContainerStyle}>
            <div style={clockMiniStyle}>
              <span style={{ fontSize: 11 }}>🇫🇷</span>
              <span>{times.paris}</span>
            </div>
            <div style={clockMiniStyle}>
              <span style={{ fontSize: 11 }}>🇲🇶</span>
              <span>{times.martinique}</span>
            </div>
            <div style={clockMiniStyle}>
              <span style={{ fontSize: 11 }}>🇨🇳</span>
              <span>{times.chine}</span>
            </div>
          </div>

          {/* Bouton recherche */}
          <button
            onClick={() => setSearchOpen(true)}
            style={searchIconButtonStyle}
            title="Rechercher"
          >
            🔍
          </button>

          {/* Sélecteur langue */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              style={langButtonStyle}
            >
              <span>{lang === 'fr' ? '🇫🇷' : lang === 'zh' ? '🇨🇳' : '🇬🇧'}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{lang.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>▾</span>
            </button>

            {showLangMenu && (
              <div style={langDropdownStyle}>
                {[
                  { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
                  { code: 'zh' as const, label: '中文', flag: '🇨🇳' },
                  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    style={langOptionStyle}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton panier avec badge */}
          <Link href="/panier" style={cartButtonStyle}>
            <span style={{ fontSize: 18 }}>🛒</span>
            {cartCount > 0 && (
              <span style={cartBadgeStyle}>{cartCount}</span>
            )}
          </Link>

          {/* Avatar utilisateur ou bouton connexion */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={userButtonStyle}
              >
                <div style={avatarStyle}>
                  {user.email?.[0]?.toUpperCase() || '👤'}
                </div>
                <span className="user-email" style={{ fontSize: 13, fontWeight: 500 }}>
                  {user.email?.split('@')[0] || 'Mon compte'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>▾</span>
              </button>

              {showUserMenu && (
                <div style={userDropdownStyle}>
                  {role === 'partner' ? (
                    <Link
                      href="/espace-partenaire"
                      style={userOptionStyle}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Mon espace partenaire
                    </Link>
                  ) : (
                    <Link
                      href="/espace-client"
                      style={userOptionStyle}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Mon espace client
                    </Link>
                  )}

                  <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

                  <button
                    onClick={handleSignOut}
                    style={{ ...userOptionStyle, color: 'var(--danger)', textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/connexion" style={connectionButtonStyle}>
              Se connecter
            </Link>
          )}

          {/* Burger menu mobile */}
          <button
            className="burger-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={burgerButtonStyle}
          >
            ☰
          </button>
        </div>
      </div>

      {/* ═══ MENU MOBILE OVERLAY ═══ */}
      {mobileMenuOpen && (
        <div style={mobileMenuStyle}>
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              style={mobileNavItemStyle}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ═══ OVERLAY RECHERCHE ═══ */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={searchOverlayStyle}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={searchOverlayInnerStyle}
          >
            <SearchBar variant="hero" placeholder="Rechercher un produit..." />
            <button
              onClick={() => setSearchOpen(false)}
              style={searchCloseStyle}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ═══ STYLES RESPONSIVE ═══ */}
      <style>{`
        @media (max-width: 1024px) {
          .nav-desktop { display: none !important; }
          .burger-menu { display: flex !important; }
        }
        @media (min-width: 1025px) {
          .burger-menu { display: none !important; }
        }
        @media (max-width: 768px) {
          .header-clock { display: none !important; }
          .user-email { display: none !important; }
        }
      `}</style>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════
   STYLES (utilisent les variables CSS de variables.css)
   ═══════════════════════════════════════════════════════ */

const headerStyle: React.CSSProperties = {
  background: 'var(--bg)',
  borderBottom: '1px solid var(--border)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: 'var(--shadow-sm)',
};

const headerInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  height: 64,
  padding: '0 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textDecoration: 'none',
  flexShrink: 0,
};

const logoIconStyle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
};

const logoTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--blue)',
  lineHeight: 1.1,
};

const logoDomainStyle: React.CSSProperties = {
  color: 'var(--text-3)',
  fontWeight: 400,
};

const logoTaglineStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-3)',
  marginTop: 2,
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  flex: 1,
  justifyContent: 'center',
};

const navItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '8px 12px',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
  color: 'var(--text-2)',
  transition: 'var(--transition-fast)',
  cursor: 'pointer',
};

const navItemActiveStyle: React.CSSProperties = {
  background: 'var(--blue-light)',
  color: 'var(--blue)',
};

const navIconStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
};

const navLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
};

const rightZoneStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
  marginLeft: 'auto',
};

const clocksContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius)',
};

const clockMiniStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-2)',
  padding: '2px 6px',
};

const langButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 12px',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'var(--transition-fast)',
};

const langDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  right: 0,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
  minWidth: 140,
  padding: 6,
  zIndex: 200,
};

const langOptionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 12px',
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 13,
  textAlign: 'left',
  color: 'var(--text)',
  fontFamily: 'inherit',
};

const cartButtonStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
  color: 'var(--text)',
  transition: 'var(--transition-fast)',
};

const cartBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  background: 'var(--orange)',
  color: '#fff',
  borderRadius: 'var(--radius-full)',
  fontSize: 10,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'pulse 2s ease-in-out infinite',
};

const userButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px 6px 6px',
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'var(--transition-fast)',
};

const avatarStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  background: 'linear-gradient(135deg, var(--blue), var(--blue-2))',
  color: '#fff',
  borderRadius: 'var(--radius-full)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 13,
};

const userDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  right: 0,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
  minWidth: 180,
  padding: 6,
  zIndex: 200,
};

const userOptionStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 13,
  textAlign: 'left',
  color: 'var(--text)',
  textDecoration: 'none',
  fontFamily: 'inherit',
};

const connectionButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  background: '#DC2626',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 12,
  fontWeight: 600,
  transition: 'var(--transition-fast)',
  whiteSpace: 'nowrap',
};

const searchIconButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  background: 'var(--bg-2)',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 18,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const searchOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 9998,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: 80,
};

const searchOverlayInnerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 700,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const searchCloseStyle: React.CSSProperties = {
  alignSelf: 'center',
  padding: '8px 16px',
  background: 'transparent',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
};

const burgerButtonStyle: React.CSSProperties = {
  display: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  background: 'var(--bg-2)',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 20,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const mobileMenuStyle: React.CSSProperties = {
  position: 'fixed',
  top: 68,
  left: 0,
  right: 0,
  background: 'var(--bg)',
  borderBottom: '1px solid var(--border)',
  boxShadow: 'var(--shadow-lg)',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  zIndex: 99,
};

const mobileNavItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
  color: 'var(--text)',
  fontSize: 14,
  fontWeight: 500,
};
