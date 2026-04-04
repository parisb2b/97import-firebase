import { useState, useEffect, type FormEvent } from 'react'
import { collection, addDoc, getDocs, doc, runTransaction, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Product } from '@/types'

interface DevisFormProps {
  product?: Product
  onSuccess?: (ref: string) => void
}

const DESTINATIONS = [
  'Martinique',
  'Guadeloupe',
  'Guyane',
  'Reunion',
  'Mayotte',
]

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
}

export default function DevisForm({ product, onSuccess }: DevisFormProps) {
  const { user, profile } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState(DESTINATIONS[0])
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedProductId, setSelectedProductId] = useState(product?.id || '')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from auth
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setEmail(profile.email || '')
      setPhone(profile.phone || '')
    }
    if (user?.email && !profile) {
      setEmail(user.email)
    }
  }, [user, profile])

  // Load products for selector (only if no product prop)
  useEffect(() => {
    if (product) return
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'products'), where('actif', '==', true))
        )
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
        setProducts(list)
      } catch {
        // silently fail, user can type manually
      }
    }
    load()
  }, [product])

  async function getNextQuoteNumber(): Promise<string> {
    const counterRef = doc(db, 'counters', 'quotes')
    const newNumber = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef)
      const current = snap.exists() ? (snap.data().current || 0) : 0
      const next = current + 1
      tx.set(counterRef, { current: next }, { merge: true })
      return next
    })
    const year = new Date().getFullYear()
    return `DEV-${year}-${String(newNumber).padStart(4, '0')}`
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Veuillez remplir les champs obligatoires (nom, prenom, email).')
      return
    }
    if (!product && !selectedProductId) {
      setError('Veuillez selectionner un produit.')
      return
    }

    setLoading(true)
    try {
      const numero = await getNextQuoteNumber()
      const selectedProduct = product || products.find(p => p.id === selectedProductId)

      await addDoc(collection(db, 'quotes'), {
        numero_devis: numero,
        statut: 'pending',
        user_id: user?.uid || null,
        client: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city,
        },
        produit: selectedProduct ? {
          id: selectedProduct.id,
          nom: selectedProduct.nom,
          prix_achat: selectedProduct.prix_achat,
        } : null,
        product_id: selectedProduct?.id || null,
        quantity,
        message: message.trim(),
        created_at: serverTimestamp(),
      })

      setSuccess(numero)
      onSuccess?.(numero)
    } catch (err: any) {
      console.error('Quote submission error:', err)
      setError('Erreur lors de l\'envoi du devis. Veuillez reessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 40,
        background: '#F0FDF4',
        borderRadius: 12,
        border: '1px solid #BBF7D0',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>&#10003;</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 8 }}>
          Demande envoyee !
        </h3>
        <p style={{ color: '#374151', fontSize: 14, marginBottom: 4 }}>
          Votre reference de devis :
        </p>
        <p style={{
          fontSize: 22, fontWeight: 800, color: NAVY,
          background: '#fff', display: 'inline-block',
          padding: '8px 24px', borderRadius: 8, margin: '8px 0',
        }}>
          {success}
        </p>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 12 }}>
          Nous vous recontacterons sous 24-48h.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#fff',
      borderRadius: 12,
      padding: 28,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginTop: 0, marginBottom: 20 }}>
        Demander un devis
      </h3>

      {error && (
        <div style={{
          background: '#FEF2F2', color: '#991B1B', padding: '10px 14px',
          borderRadius: 8, fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Prenom *</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>Nom *</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>Telephone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>Destination *</label>
        <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
          {DESTINATIONS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Product selector when no product prop */}
      {!product && products.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Produit *</label>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">-- Selectionnez un produit --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
      )}

      {product && (
        <div style={{
          marginTop: 14, padding: '10px 14px', background: '#F5F5F5',
          borderRadius: 8, fontSize: 14, color: NAVY, fontWeight: 600,
        }}>
          Produit : {product.nom}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>Quantite</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ ...inputStyle, maxWidth: 120 }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>Message / Precisions</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 20,
          width: '100%',
          padding: '14px 0',
          background: loading ? '#9CA3AF' : GREEN,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {loading ? 'Envoi en cours...' : 'Envoyer la demande de devis'}
      </button>
    </form>
  )
}
