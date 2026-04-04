import { Link, useSearch } from 'wouter'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

export default function ConfirmationPage() {
  const search = useSearch()
  const params = new URLSearchParams(search)
  const reference = params.get('ref') || 'N/A'

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{
        maxWidth: '600px', width: '100%', textAlign: 'center',
        background: C.white, borderRadius: '16px', padding: '3rem 2rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        {/* Success icon */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: C.green, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem',
          fontSize: '2.5rem',
        }}>
          <span style={{ color: C.white }}>&#10003;</span>
        </div>

        <h1 style={{ color: C.navy, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Merci pour votre demande !
        </h1>
        <p style={{ color: C.gray, marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Votre demande a bien été enregistrée. Notre équipe vous contactera dans les plus brefs délais.
        </p>

        {/* Reference */}
        <div style={{
          background: C.light, borderRadius: '10px', padding: '1rem',
          marginBottom: '2rem',
        }}>
          <p style={{ color: C.gray, margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>Numéro de référence</p>
          <p style={{ color: C.navy, margin: 0, fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            {reference}
          </p>
        </div>

        {/* Next steps */}
        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: C.navy, fontSize: '1.1rem', marginBottom: '0.8rem' }}>Prochaines étapes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              'Notre équipe étudie votre demande (sous 24-48h)',
              'Vous recevrez un devis détaillé par email',
              'Après validation, nous lançons la commande',
              'Suivi régulier jusqu\'à la livraison',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: C.orange, color: C.white, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</div>
                <span style={{ color: C.gray, fontSize: '0.95rem' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{
          background: C.navy, borderRadius: '10px', padding: '1.2rem',
          color: C.white, marginBottom: '2rem', fontSize: '0.9rem',
        }}>
          <p style={{ margin: '0 0 0.3rem 0', fontWeight: 600 }}>Une question ?</p>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Email : contact@97import.com | WhatsApp : +33 6 63 28 49 08
          </p>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/">
            <a style={{
              background: C.green, color: C.white, padding: '0.7rem 1.5rem',
              borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
            }}>
              Retour à l'accueil
            </a>
          </Link>
          <Link href="/catalogue">
            <a style={{
              background: 'transparent', color: C.navy, padding: '0.7rem 1.5rem',
              borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
              border: `1px solid ${C.navy}30`,
            }}>
              Voir le catalogue
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}
