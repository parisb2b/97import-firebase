import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { GlobeToggle } from '../../components/GlobeToggle';

const NAV_ITEMS = [
  { path: '/', label: 'Accueil', icon: '🏠', exact: true },
  { path: '/catalogue/Mini-Pelle', label: 'Mini-Pelles', icon: '🚜' },
  { path: '/catalogue/Maisons', label: 'Maisons', icon: '🏠' },
  { path: '/catalogue/Solaire', label: 'Solaire', icon: '☀️' },
  { path: '/catalogue/Agricole', label: 'Agricole', icon: '🌾' },
  { path: '/catalogue/Divers', label: 'Divers', icon: '📦' },
  { path: '/services', label: 'Services', icon: '🔧' },
  { path: '/contact', label: 'Contact', icon: '✉️' },
];

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
    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
      <span>🇲🇶 {times.mq}</span>
      <span>·</span>
      <span>🇫🇷 {times.fr}</span>
      <span>·</span>
      <span>🇨🇳 {times.cn}</span>
    </div>
  );
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { t } = useI18n();
  const [location] = useLocation();
  const [cartCount] = useState(0); // TODO: connect to cart context

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'profiles', u.uid));
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
      background: '#0B2545',
      color: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
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
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>
              97<span style={{ color: '#EA580C' }}>IMPORT</span>
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const isActive = (item as any).exact ? location === item.path : location.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.8)',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
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
          <GlobeToggle />

          {/* Panier */}
          <Link href="/panier">
            <div style={{
              background: '#EA580C',
              borderRadius: 12,
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
            }}>
              🛒 {cartCount > 0 && <span style={{
                background: 'white',
                color: '#EA580C',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}>{cartCount}</span>}
            </div>
          </Link>

          {/* Connexion */}
          {user ? (
            <Link href={userRole === 'partner' ? '/espace-partenaire' : '/espace-client'}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '6px 14px',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                }}>
                  {user.displayName?.[0]?.toUpperCase() || '👤'}
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{user.displayName || user.email?.split('@')[0]}</span>
              </div>
            </Link>
          ) : (
            <Link href="/connexion">
              <span style={{
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 12,
                padding: '6px 16px',
                fontSize: 13,
                cursor: 'pointer',
                color: 'white',
              }}>
                {t('btn.connexion')}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
