import React from 'react'
import { useLocation, Link } from 'wouter'
import { useAdminAuth } from '../../contexts/AuthContext'
import { ADMIN_COLORS } from '../../components/admin/AdminUI'

const NAV_SECTIONS = [
  {
    label: 'COMMERCE',
    items: [
      { icon: '📊', label: 'Tableau de bord',    path: '/admin' },
      { icon: '📄', label: 'Devis & Facturation', path: '/admin/devis' },
      { icon: '👥', label: 'Clients',             path: '/admin/users' },
      { icon: '🤝', label: 'Partenaires',          path: '/admin/partenaires' },
    ],
  },
  {
    label: 'CATALOGUE',
    items: [
      { icon: '📦', label: 'Produits',     path: '/admin/products' },
      { icon: '🛒', label: 'Suivi Achats', path: '/admin/suivi-achats' },
      { icon: '🖼️', label: 'Médias',       path: '/admin/media' },
    ],
  },
  {
    label: 'CONFIGURATION',
    items: [
      { icon: '⚙️', label: 'Paramètres',   path: '/admin/parametres' },
      { icon: '🌐', label: 'Contenu Site', path: '/admin/contenu' },
    ],
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation()
  const { adminProfile, signOutAdmin } = useAdminAuth()

  function isActive(path: string) {
    if (path === '/admin') return location === '/admin'
    return location.startsWith(path)
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: ADMIN_COLORS.font,
    }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '220px',
        minWidth: '220px',
        background: '#111827',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '0.5px solid #1F2937',
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '-0.2px',
          }}>
            97import
          </div>
          <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>
            Back-office
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              <div style={{
                fontSize: '9px',
                fontWeight: '700',
                color: '#4B5563',
                letterSpacing: '1px',
                padding: '12px 16px 4px',
                textTransform: 'uppercase',
              }}>
                {section.label}
              </div>

              {/* Items */}
              {section.items.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link key={item.path} href={item.path}>
                    <a style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: active ? '600' : '400',
                      color: active ? '#fff' : '#9CA3AF',
                      background: active ? '#1F2937' : 'transparent',
                      borderLeft: active
                        ? `3px solid ${ADMIN_COLORS.navy}`
                        : '3px solid transparent',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}>
                      <span style={{ fontSize: '14px' }}>{item.icon}</span>
                      {item.label}
                    </a>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{
          borderTop: '0.5px solid #1F2937',
          padding: '12px 16px',
        }}>
          {adminProfile && (
            <div style={{
              fontSize: '11px',
              color: '#6B7280',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {adminProfile.email}
            </div>
          )}
          <button
            onClick={() => signOutAdmin()}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'transparent',
              border: '0.5px solid #374151',
              borderRadius: '5px',
              fontSize: '11px',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontFamily: ADMIN_COLORS.font,
              textAlign: 'left',
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <main style={{
        marginLeft: '220px',
        flex: 1,
        background: ADMIN_COLORS.grayBg,
        minHeight: '100vh',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
