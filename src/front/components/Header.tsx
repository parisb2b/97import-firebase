import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

const B = '#1565C0'; // bleu hero

function Clocks() {
  const [times, setTimes] = useState({ mq: '--:--', fr: '--:--', cn: '--:--' });

  useEffect(() => {
    const update = () => {
      const fmt = (tz: string) =>
        new Date().toLocaleTimeString('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
      setTimes({ mq: fmt('America/Martinique'), fr: fmt('Europe/Paris'), cn: fmt('Asia/Shanghai') });
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#94A3B8' }}>
      <span>🇲🇶 {times.mq}</span>
      <span>·</span>
      <span>🇫🇷 {times.fr}</span>
      <span>·</span>
      <span>🇨🇳 {times.cn}</span>
    </div>
  );
}

function LangDropdown() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const labels: Record<string, string> = { fr: 'FR', en: 'EN', zh: 'CN' };
  const options = [
    { code: 'fr' as const, flag: '🇫🇷', label: 'Français (FR)' },
    { code: 'zh' as const, flag: '🇨🇳', label: '中文 (CN)' },
    { code: 'en' as const, flag: '🇬🇧', label: 'English (EN)' },
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        border: '1px solid #E8ECF4', borderRadius: 20, padding: '4px 12px',
        background: 'transparent', cursor: 'pointer', fontSize: 12, color: B, fontWeight: 600,
      }}>
        🌐 {labels[lang]} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 6, zIndex: 200, minWidth: 160,
        }}>
          {options.map(o => (
            <div key={o.code} onClick={() => { setLang(o.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151',
                background: lang === o.code ? '#F0F4F8' : 'transparent',
                fontWeight: lang === o.code ? 600 : 400,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F7FA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = lang === o.code ? '#F0F4F8' : 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>{o.flag}</span>
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { t } = useI18n();
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: t('nav.accueil'), icon: '🏠', exact: true },
    { path: '/catalogue/Mini-Pelle', label: t('nav.miniPelles'), icon: '🚜' },
    { path: '/catalogue/Maisons', label: t('nav.maisons'), icon: '🏠' },
    { path: '/catalogue/Solaire', label: t('nav.solaire'), icon: '☀️' },
    { path: '/catalogue/Agricole', label: t('nav.agricole'), icon: '🌾' },
    { path: '/catalogue/Divers', label: t('nav.divers'), icon: '📦' },
    { path: '/services', label: t('nav.services'), icon: '🔧' },
    { path: '/contact', label: t('nav.contact'), icon: '✉️' },
  ];
  const [cartCount, setCartCount] = useState(0);

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
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          setUserRole(snap.data()?.role || 'user');
        } catch { setUserRole('user'); }
      } else {
        setUserRole(null);
      }
    });
    return () => unsub();
  }, []);

  return (
    <header style={{
      background: '#FFFFFF',
      color: B,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid #E8ECF4',
    }}>
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
        <Link href="/">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 24 }}>🚢</span>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5, color: B }}>
              97<span style={{ color: '#EA580C' }}>IMPORT</span>
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map(item => {
            const isActive = (item as any).exact ? location === item.path : location.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  color: isActive ? B : '#6B7280',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}>
                  {item.icon} {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clocks />
          <LangDropdown />

          {/* Panier */}
          <Link href="/panier">
            <div style={{
              position: 'relative',
              background: '#FFFFFF',
              border: `1px solid ${B}`,
              borderRadius: 10,
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: B,
            }}>
              🛒
              {cartCount > 0 && <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#EF4444',
                color: '#fff',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                border: '2px solid #fff',
              }}>{cartCount}</span>}
            </div>
          </Link>

          {/* Connexion */}
          {user ? (
            <Link href={userRole === 'partner' ? '/espace-partenaire' : '/espace-client'}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                border: '1px solid #E5E7EB', borderRadius: 12, padding: '6px 14px',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: B, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                }}>
                  {user.displayName?.[0]?.toUpperCase() || '👤'}
                </div>
                <span style={{ fontSize: 12, color: '#374151' }}>{user.displayName || user.email?.split('@')[0]}</span>
              </div>
            </Link>
          ) : (
            <Link href="/connexion">
              <span style={{
                border: `1px solid ${B}`,
                borderRadius: 12,
                padding: '6px 16px',
                fontSize: 13,
                cursor: 'pointer',
                color: B,
                fontWeight: 600,
              }}>
                {t('auth.connexion')}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
