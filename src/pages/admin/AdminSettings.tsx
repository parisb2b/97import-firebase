import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'

interface SiteSettings {
  maintenance_mode: boolean
  whatsapp_number: string
  email_contact: string
  email_devis: string
  tiktok_url: string
  facebook_url: string
  taux_eur_rmb: number
  tva_domtom: number
  devise_defaut: 'EUR' | 'RMB'
  langue_defaut: 'fr' | 'zh'
  analytics_enabled: boolean
}

const DEFAULT_SETTINGS: SiteSettings = {
  maintenance_mode: false,
  whatsapp_number: '33663284908',
  email_contact: 'info@97import.com',
  email_devis: 'devis@97import.com',
  tiktok_url: 'https://www.tiktok.com/@direxport',
  facebook_url: '',
  taux_eur_rmb: 8,
  tva_domtom: 8.5,
  devise_defaut: 'EUR',
  langue_defaut: 'fr',
  analytics_enabled: true,
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'admin_params', 'site_settings'), {
        ...settings,
        updatedAt: new Date(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Erreur sauvegarde settings:', e)
    }
    setSaving(false)
  }

  const Toggle = ({ label, field }: { label: string; field: keyof SiteSettings }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F3F4F6' }}>
      <label style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{label}</label>
      <button
        onClick={() => setSettings(prev => ({ ...prev, [field]: !prev[field as keyof SiteSettings] }))}
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          background: settings[field] ? GREEN : '#D1D5DB',
          border: 'none',
          cursor: 'pointer',
          position: 'relative' as const,
          transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute' as const,
          top: 3,
          left: settings[field] ? 24 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )

  const Field = ({ label, field, type = 'text' }: { label: string; field: keyof SiteSettings; type?: string }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={settings[field] as string | number}
        onChange={e => setSettings(prev => ({
          ...prev,
          [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
        }))}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #D1D5DB',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'inherit',
          boxSizing: 'border-box' as const,
        }}
      />
    </div>
  )

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', sans-serif", maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, margin: 0 }}>Paramètres du site</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Configuration générale de 97import.com</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saved ? GREEN : NAVY,
            color: '#fff',
            border: 'none',
            padding: '10px 28px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {saving ? 'Sauvegarde…' : saved ? '✅ Sauvegardé' : '💾 Sauvegarder'}
        </button>
      </div>

      {/* Contact */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 20 }}>📞 Contact</h2>
        <Field label="Numéro WhatsApp (sans +)" field="whatsapp_number" />
        <Field label="Email contact" field="email_contact" type="email" />
        <Field label="Email devis" field="email_devis" type="email" />
        <Field label="TikTok URL" field="tiktok_url" />
      </div>

      {/* Finance */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 20 }}>💱 Finance</h2>
        <Field label="Taux EUR/RMB" field="taux_eur_rmb" type="number" />
        <Field label="TVA DOM-TOM (%)" field="tva_domtom" type="number" />
      </div>

      {/* Toggles */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8 }}>⚙️ Options</h2>
        <Toggle label="Mode maintenance" field="maintenance_mode" />
        <Toggle label="Analytics activés" field="analytics_enabled" />
      </div>

      {/* Alerte maintenance */}
      {settings.maintenance_mode && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <strong style={{ color: '#92400E', fontSize: 14 }}>Mode maintenance activé</strong>
            <p style={{ color: '#92400E', fontSize: 13, margin: '2px 0 0' }}>
              Le site affiche une page de maintenance pour les visiteurs.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
