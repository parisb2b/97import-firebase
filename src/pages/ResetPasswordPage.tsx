import { useState } from 'react'
import { Link, useSearch, useLocation } from 'wouter'
import { confirmPasswordReset } from 'firebase/auth'
import { authClient } from '@/lib/firebase'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

export default function ResetPasswordPage() {
  const search = useSearch()
  const [, navigate] = useLocation()
  const params = new URLSearchParams(search)
  const oobCode = params.get('oobCode') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!oobCode) {
      setError('Lien de réinitialisation invalide ou expiré.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await confirmPasswordReset(authClient, oobCode, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      if (err?.code === 'auth/expired-action-code') {
        setError('Ce lien a expiré. Veuillez refaire une demande.')
      } else if (err?.code === 'auth/invalid-action-code') {
        setError('Ce lien est invalide. Veuillez refaire une demande.')
      } else {
        setError('Erreur lors de la réinitialisation. Veuillez réessayer.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', borderRadius: '8px',
    border: `1px solid ${C.navy}20`, fontSize: '1rem', boxSizing: 'border-box',
  }

  if (success) {
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#10003;</div>
          <h2 style={{ color: C.green, marginBottom: '0.5rem' }}>Mot de passe modifié !</h2>
          <p style={{ color: C.gray, lineHeight: 1.6, marginBottom: '1rem' }}>
            Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
          </p>
          <Link href="/login">
            <a style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}>
              Se connecter maintenant
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
          Nouveau mot de passe
        </h1>
        <p style={{ color: C.gray, textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: C.navy, fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.95rem' }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: C.navy, fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.95rem' }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              style={inputStyle}
            />
          </div>

          {error && <p style={{ color: '#DC2626', margin: 0, fontSize: '0.9rem' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: C.orange, color: C.white, padding: '0.85rem',
              borderRadius: '8px', border: 'none', fontWeight: 700,
              fontSize: '1rem', cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          <Link href="/forgot-password">
            <a style={{ color: C.green, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              Renvoyer un lien
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}
