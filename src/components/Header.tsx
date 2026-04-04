import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { useLang, LangToggle } from '@/contexts/LanguageContext'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/contexts/AuthContext'

const NAV_LINKS = [
  { href: '/mini-pelles', labelKey: 'cat_mini_pelles' as const },
  { href: '/maisons', labelKey: 'cat_maisons' as const },
  { href: '/solaire', labelKey: 'cat_solaire' as const },
  { href: '/accessoires', labelKey: 'cat_accessories' as const },
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/contact', label: 'Contact' },
]

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [location] = useLocation()
  const { t } = useLang()
  const { count } = useCart()
  const { user, profile, signOutClient } = useAuth()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: NAVY,
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 20px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/images/logos/logo_import97_large.png"
            alt="97import.com"
            style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
            97import<span style={{ color: GREEN }}>.com</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }} className="header-desktop-nav">
          {NAV_LINKS.map(link => {
            const isActive = location === link.href || location.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? GREEN : '#fff',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  borderBottom: isActive ? `2px solid ${GREEN}` : '2px solid transparent',
                  paddingBottom: 2,
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {link.labelKey ? t(link.labelKey) : link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LangToggle style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />

          {/* Cart */}
          <Link href="/panier" style={{ position: 'relative', textDecoration: 'none', color: '#fff' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -8,
                background: GREEN,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {count}
              </span>
            )}
          </Link>

          {/* User menu */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="header-desktop-nav">
              <Link href="/mon-compte" style={{
                color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500,
              }}>
                {profile?.first_name || t('nav_account')}
              </Link>
              <button
                onClick={() => signOutClient()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {t('nav_logout')}
              </button>
            </div>
          ) : (
            <Link href="/connexion" style={{
              color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500,
            }} className="header-desktop-nav">
              {t('nav_login')}
            </Link>
          )}

          {/* Hamburger */}
          <button
            className="header-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen
                ? <path d="M18 6L6 18M6 6l12 12" />
                : <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: NAVY,
          padding: '12px 20px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }} className="header-mobile-menu">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '10px 0',
                color: location === link.href ? GREEN : '#fff',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 500,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {link.labelKey ? t(link.labelKey) : link.label}
            </Link>
          ))}
          <div style={{ paddingTop: 12 }}>
            {user ? (
              <>
                <Link href="/mon-compte" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>
                  {t('nav_account')}
                </Link>
                <button onClick={() => { signOutClient(); setMenuOpen(false) }} style={{
                  display: 'block', marginTop: 8, background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', padding: 0,
                }}>
                  {t('nav_logout')}
                </button>
              </>
            ) : (
              <Link href="/connexion" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>
                {t('nav_login')}
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .header-desktop-nav { display: none !important; }
          .header-hamburger { display: block !important; }
        }
      `}</style>
    </header>
  )
}
