import { useState } from 'react'
import { Link } from 'wouter'
import { sendPasswordResetEmail } from 'firebase/auth'
import { authClient } from '@/lib/firebase'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Veuillez entrer votre adresse email.'); return }
    setSending(true)
    setError('')
    try {
      await sendPasswordResetEmail(authClient, email)
      setSent(true)
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        setError('Aucun compte associé à cet email.')
      } else {
        setError('Erreur lors de l\'envoi. Veuillez réessayer.')
      }
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div style={{
        minHeight: '50vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem',
      }}>
        <div style={{
          maxWidth: '450px', width: '100%', textAlign: 'center',
          background: C.white, borderRadius: '16px', padding: '2.5rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
          <h2 style={{ color: C.green, marginBottom: '0.5rem' }}>Email envoyé !</h2>
          <p style={{ color: C.gray, lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Si un compte existe pour <strong>{email}</strong>, vous recevrez
            un lien de réinitialisation dans quelques minutes. Pensez à vérifier vos spams.
          </p>
          <Link href="/login">
            <a style={{
              display: 'inline-block', color: C.green, textDecoration: 'none',
              fontWeight: 600, fontSize: '0.95rem',
            }}>
              Retour à la connexion
            </a>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '50vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{
        maxWidth: '450px', width: '100%',
        background: C.white, borderRadius: '16px', padding: '2.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ color: C.navy, fontSize: '1.6rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          Mot de passe oublié
        </h1>
        <p style={{ color: C.gray, textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: C.navy, fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.95rem' }}>
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: `1px solid ${C.navy}20`, fontSize: '1rem', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && <p style={{ color: '#DC2626', margin: 0, fontSize: '0.9rem' }}>{error}</p>}

          <button
            type="submit"
            disabled={sending}
            style={{
              background: C.orange, color: C.white, padding: '0.85rem',
              borderRadius: '8px', border: 'none', fontWeight: 700,
              fontSize: '1rem', cursor: sending ? 'wait' : 'pointer',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          <Link href="/login">
            <a style={{ color: C.green, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              Retour à la connexion
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}
