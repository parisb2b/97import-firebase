import { useState } from 'react'

const STORAGE_KEY = 'cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    return !localStorage.getItem(STORAGE_KEY)
  })

  if (!visible) return null

  function handleChoice(accepted: boolean) {
    localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'refused')
    setVisible(false)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#1B2A4A',
      color: '#fff',
      padding: '16px 24px',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      flexWrap: 'wrap',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    }}>
      <p style={{ margin: 0, fontSize: 13, maxWidth: 600 }}>
        Ce site utilise des cookies pour ameliorer votre experience.
        En continuant, vous acceptez notre{' '}
        <a href="/confidentialite" style={{ color: '#E8913A', textDecoration: 'underline' }}>
          politique de confidentialite
        </a>.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => handleChoice(true)}
          style={{
            background: '#2D7D46',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Accepter
        </button>
        <button
          onClick={() => handleChoice(false)}
          style={{
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 6,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Refuser
        </button>
      </div>
    </div>
  )
}
