import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'

interface HeaderFooterConfig {
  logo_url: string
  site_name: string
  tagline_fr: string
  tagline_zh: string
  whatsapp: string
  email: string
  tiktok: string
  copyright: string
  nav_links: string[]
}

const DEFAULT_CONFIG: HeaderFooterConfig = {
  logo_url: '/images/logos/logo_import97_large.png',
  site_name: '97import.com',
  tagline_fr: "L'importation n'a jamais été aussi simple",
  tagline_zh: '进口从未如此简单',
  whatsapp: '33663284908',
  email: 'info@97import.com',
  tiktok: '@direxport',
  copyright: '© 2026 97import.com — LUXENT LIMITED, UK',
  nav_links: ['Mini-pelles', 'Maisons', 'Solaire', 'Accessoires', 'Contact'],
}

export default function AdminHeaderFooter() {
  const [config, setConfig] = useState<HeaderFooterConfig>(DEFAULT_CONFIG)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await setDoc(doc(db, 'admin_params', 'header_footer'), config)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const Field = ({ label, field, type = 'text' }: { label: string; field: keyof HeaderFooterConfig; type?: string }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={config[field] as string}
        onChange={e => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #D1D5DB',
          borderRadius: 8,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box' as const,
        }}
      />
    </div>
  )

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', sans-serif", maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
        Header & Footer
      </h1>
      <p style={{ color: '#6B7280', marginBottom: 32, fontSize: 14 }}>
        Configuration du logo, des liens de navigation et du footer du site.
      </p>

      <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 24, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
          Configuration Header
        </h2>
        <Field label="URL du logo" field="logo_url" />
        <Field label="Nom du site" field="site_name" />
        <Field label="Tagline français" field="tagline_fr" />
        <Field label="Tagline chinois" field="tagline_zh" />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 24, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
          Configuration Footer
        </h2>
        <Field label="WhatsApp (sans +)" field="whatsapp" />
        <Field label="Email" field="email" type="email" />
        <Field label="TikTok" field="tiktok" />
        <Field label="Copyright" field="copyright" />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          background: saved ? GREEN : NAVY,
          color: '#fff',
          border: 'none',
          padding: '12px 32px',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background 0.3s',
        }}
      >
        {loading ? 'Sauvegarde…' : saved ? '✅ Sauvegardé' : '💾 Sauvegarder'}
      </button>
    </div>
  )
}
