import { useEffect, useState } from 'react'

interface CartNotificationProps {
  productName: string | null
  onDismiss: () => void
}

export default function CartNotification({ productName, onDismiss }: CartNotificationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!productName) {
      setVisible(false)
      return
    }

    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, 3000)

    return () => clearTimeout(timer)
  }, [productName, onDismiss])

  if (!visible || !productName) return null

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      right: 20,
      zIndex: 10000,
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: "'Inter', sans-serif",
      animation: 'slideInRight 0.3s ease-out',
      maxWidth: 340,
      borderLeft: '4px solid #2D7D46',
    }}>
      <span style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#F0FDF4',
        color: '#2D7D46',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 700,
        flexShrink: 0,
      }}>
        &#10003;
      </span>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1B2A4A' }}>
          {productName}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>
          Ajoute au panier
        </p>
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss() }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#9CA3AF',
          cursor: 'pointer',
          fontSize: 18,
          padding: '0 0 0 8px',
          lineHeight: 1,
        }}
        aria-label="Fermer"
      >
        &times;
      </button>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
