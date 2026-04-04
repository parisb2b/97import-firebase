import React, { useState } from 'react'
import { useLocation } from 'wouter'
import { useAdminAuth } from '../../contexts/AuthContext'

export default function AdminLoginPage() {
  const { signInAdmin } = useAdminAuth()
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
      await signInAdmin(email, password)
      setLocation('/admin')
    } catch (err: any) {
      setError(
        err?.message === 'Accès refusé — compte non administrateur'
          ? err.message
          : 'Email ou mot de passe incorrect.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1E3A5F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      }}>
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            background: '#1E3A5F',
            borderRadius: '10px',
            marginBottom: '12px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            color: '#1E3A5F',
            fontSize: '20px',
            fontWeight: '700',
          }}>
            Back-office Admin
          </h1>
          <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>
            97import.com — Accès restreint
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
            fontWeight: '500',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Email administrateur
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '0.5px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '0.5px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              background: loading ? '#93A8C2' : '#1E3A5F',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2px',
            }}
          >
            {loading ? 'Vérification...' : 'Connexion Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
