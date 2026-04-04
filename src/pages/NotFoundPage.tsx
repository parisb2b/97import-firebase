import { Link } from 'wouter'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      textAlign: 'center',
    }}>
      {/* Big 404 */}
      <div style={{
        fontSize: '8rem', fontWeight: 900, color: C.navy, lineHeight: 1,
        opacity: 0.15, marginBottom: '-1rem',
      }}>
        404
      </div>

      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
        🔍
      </div>

      <h1 style={{ color: C.navy, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
        Page non trouvée
      </h1>
      <p style={{ color: C.gray, maxWidth: '450px', marginBottom: '2rem', lineHeight: 1.6 }}>
        Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
        Vérifiez l'URL ou explorez notre site.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/">
          <a style={{
            background: C.green, color: C.white, padding: '0.8rem 1.8rem',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
          }}>
            Retour à l'accueil
          </a>
        </Link>
        <Link href="/catalogue">
          <a style={{
            background: 'transparent', color: C.navy, padding: '0.8rem 1.8rem',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
            border: `1px solid ${C.navy}30`,
          }}>
            Voir le catalogue
          </a>
        </Link>
      </div>
    </div>
  )
}
