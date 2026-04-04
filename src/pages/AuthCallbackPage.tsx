import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { authClient } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

/**
 * Page de callback OAuth (Google Sign-In redirect)
 * Firebase gère le callback automatiquement via onAuthStateChanged.
 * Cette page redirige l'utilisateur après la connexion.
 */
export default function AuthCallbackPage() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authClient, (user) => {
      if (user) {
        // Utilisateur connecté → rediriger vers le compte
        setLocation('/mon-compte')
      } else {
        // Pas d'utilisateur → rediriger vers la connexion
        setLocation('/connexion')
      }
    })

    // Timeout de sécurité après 5s
    const timeout = setTimeout(() => {
      setLocation('/connexion')
    }, 5000)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [setLocation])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 20,
      background: '#F9FAFB',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Spinner */}
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #E5E7EB',
        borderTop: '4px solid #1B2A4A',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#6B7280', fontSize: 16 }}>
        Connexion en cours…
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
