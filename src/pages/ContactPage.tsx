import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Veuillez remplir les champs obligatoires.')
      return
    }
    setSending(true)
    setError('')
    try {
      await addDoc(collection(db, 'contacts'), {
        ...form,
        createdAt: serverTimestamp(),
        status: 'new',
      })
      setSent(true)
    } catch {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', borderRadius: '8px',
    border: `1px solid ${C.navy}20`, fontSize: '1rem',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: C.navy, fontWeight: 600,
    marginBottom: '0.3rem', fontSize: '0.95rem',
  }

  if (sent) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: C.green, marginBottom: '0.5rem' }}>Message envoyé avec succès !</h2>
        <p style={{ color: C.gray, textAlign: 'center', maxWidth: '450px' }}>
          Nous avons bien reçu votre message. Notre équipe vous répondra sous 24 à 48 heures.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '0.5rem' }}>Contactez-nous</h1>
      <p style={{ color: C.gray, marginBottom: '2rem' }}>
        Une question, un projet ? Notre équipe est à votre écoute.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nom complet *</label>
            <input style={inputStyle} value={form.name} onChange={e => update('name', e.target.value)} placeholder="Votre nom" />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="votre@email.com" />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input style={inputStyle} type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+33 6 ..." />
          </div>
          <div>
            <label style={labelStyle}>Sujet</label>
            <select style={inputStyle} value={form.subject} onChange={e => update('subject', e.target.value)}>
              <option value="">Sélectionnez un sujet</option>
              <option value="devis">Demande de devis</option>
              <option value="commande">Suivi de commande</option>
              <option value="produit">Question produit</option>
              <option value="livraison">Livraison / Transport</option>
              <option value="sav">Service après-vente</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Message *</label>
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              value={form.message}
              onChange={e => update('message', e.target.value)}
              placeholder="Décrivez votre besoin..."
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
            {sending ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>
        </form>

        {/* Contact info sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* WhatsApp */}
          <div style={{ background: C.light, borderRadius: '10px', padding: '1.5rem' }}>
            <h3 style={{ color: C.navy, margin: '0 0 0.5rem 0' }}>WhatsApp</h3>
            <p style={{ color: C.gray, margin: '0 0 0.8rem 0', fontSize: '0.9rem' }}>
              Réponse rapide par messagerie
            </p>
            <a
              href="https://wa.me/33663284908"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', background: '#25D366', color: C.white,
                padding: '0.6rem 1.2rem', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.95rem',
              }}
            >
              Ouvrir WhatsApp
            </a>
          </div>

          {/* Email */}
          <div style={{ background: C.light, borderRadius: '10px', padding: '1.5rem' }}>
            <h3 style={{ color: C.navy, margin: '0 0 0.5rem 0' }}>Email</h3>
            <a href="mailto:contact@97import.com" style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}>
              contact@97import.com
            </a>
          </div>

          {/* Horaires */}
          <div style={{ background: C.light, borderRadius: '10px', padding: '1.5rem' }}>
            <h3 style={{ color: C.navy, margin: '0 0 0.5rem 0' }}>Horaires</h3>
            <p style={{ color: C.gray, margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
              Lundi - Vendredi : 9h00 - 18h00<br />
              Samedi : 9h00 - 12h00<br />
              Dimanche : Fermé
            </p>
          </div>

          {/* Adresse / Map placeholder */}
          <div style={{
            background: C.navy, borderRadius: '10px', padding: '1.5rem', color: C.white,
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Nos bureaux</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.9 }}>
              97import / DOM-TOM Import<br />
              Martinique, France<br />
              DOM-TOM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
