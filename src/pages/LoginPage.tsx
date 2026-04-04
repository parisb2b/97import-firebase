import React, { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { signInWithPopup } from 'firebase/auth'
import { authClient, microsoftProvider, facebookProvider } from '../lib/firebase'

export default function LoginPage() {
  const { signInClient, signInWithGoogle } = useAuth()
  const { t } = useLang()
  const [, setLocation] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInClient(email, password)
      setLocation('/')
    } catch {
      setError(t('auth_error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      setLocation('/')
    } catch {
      setError('Connexion Google échouée.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMicrosoft() {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(authClient, microsoftProvider)
      setLocation('/')
    } catch (err: any) {
      setError(err?.code === 'auth/popup-closed-by-user'
        ? 'Connexion annulée.'
        : 'Connexion Microsoft échouée.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFacebook() {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(authClient, facebookProvider)
      setLocation('/')
    } catch (err: any) {
      setError(err?.code === 'auth/popup-closed-by-user'
        ? 'Connexion annulée.'
        : 'Connexion Facebook échouée.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        border: '0.5px solid #E5E7EB',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{
            color: '#1E3A5F',
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '-0.3px',
          }}>
            97import.com
          </h1>
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '0.5px solid #FECACA',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#DC2626',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>{t('auth_email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>{t('auth_password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
            {loading ? t('msg_loading') : t('btn_login')}
          </button>
        </form>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#E5E7EB' }} />
          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>ou</span>
          <div style={{ flex: 1, height: '0.5px', background: '#E5E7EB' }} />
        </div>

        {/* Boutons OAuth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={oauthBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.7 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.4 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.2 5.2C36.9 36.2 44 31 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            {t('auth_google')}
          </button>

          {/* Microsoft */}
          <button onClick={handleMicrosoft} disabled={loading} style={oauthBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 21 21">
              <rect width="10" height="10" fill="#F25022"/>
              <rect x="11" width="10" height="10" fill="#7FBA00"/>
              <rect y="11" width="10" height="10" fill="#00A4EF"/>
              <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
            </svg>
            {t('auth_microsoft')}
          </button>

          {/* Facebook */}
          <button onClick={handleFacebook} disabled={loading} style={oauthBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {t('auth_facebook')}
          </button>
        </div>

        {/* Lien inscription */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6B7280' }}>
          {t('auth_no_account')}{' '}
          <a href="/register" style={{ color: '#1E3A5F', fontWeight: '600', textDecoration: 'none' }}>
            {t('auth_create')}
          </a>
        </p>
      </div>
    </div>
  )
}

// ── Styles locaux ──────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '0.5px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px',
    background: disabled ? '#93A8C2' : '#1E3A5F',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif',
  }
}

const oauthBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  background: '#fff',
  color: '#374151',
  border: '0.5px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontFamily: 'Inter, sans-serif',
}
