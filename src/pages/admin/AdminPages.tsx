import { useState, useEffect } from 'react'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'

interface PageContent {
  id: string
  titre_fr: string
  titre_zh: string
  contenu_fr: string
  contenu_zh: string
  route: string
  actif: boolean
  updatedAt?: Date
}

const DEFAULT_PAGES: PageContent[] = [
  { id: 'about', titre_fr: 'À propos', titre_zh: '关于我们', route: '/about', contenu_fr: '', contenu_zh: '', actif: true },
  { id: 'services', titre_fr: 'Services', titre_zh: '服务', route: '/services', contenu_fr: '', contenu_zh: '', actif: true },
  { id: 'livraison', titre_fr: 'Livraison', titre_zh: '配送', route: '/livraison', contenu_fr: '', contenu_zh: '', actif: true },
  { id: 'legal', titre_fr: 'Mentions légales', titre_zh: '法律声明', route: '/mentions-legales', contenu_fr: '', contenu_zh: '', actif: true },
  { id: 'privacy', titre_fr: 'Confidentialité', titre_zh: '隐私政策', route: '/confidentialite', contenu_fr: '', contenu_zh: '', actif: true },
  { id: 'terms', titre_fr: 'CGV', titre_zh: '销售条款', route: '/conditions-vente', contenu_fr: '', contenu_zh: '', actif: true },
]

export default function AdminPages() {
  const [pages, setPages] = useState<PageContent[]>(DEFAULT_PAGES)
  const [selected, setSelected] = useState<PageContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const snap = await getDocs(collection(db, 'site_pages'))
        if (!snap.empty) {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PageContent[]
          setPages(data)
        }
      } catch { /* use defaults */ }
    }
    fetchPages()
  }, [])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'site_pages', selected.id), {
        ...selected,
        updatedAt: new Date(),
      })
      setPages(prev => prev.map(p => p.id === selected.id ? selected : p))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar pages */}
      <div style={{
        width: 260,
        background: '#F9FAFB',
        borderRight: '1px solid #E5E7EB',
        padding: '24px 0',
        overflow: 'auto',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', padding: '0 20px 16px', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
          Pages du site
        </h2>
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setSelected(page)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 20px',
              background: selected?.id === page.id ? '#EFF6FF' : 'transparent',
              border: 'none',
              borderLeft: selected?.id === page.id ? `3px solid ${NAVY}` : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: selected?.id === page.id ? 600 : 400, color: NAVY }}>
              {page.titre_fr}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{page.route}</div>
          </button>
        ))}
      </div>

      {/* Éditeur */}
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        {!selected ? (
          <div style={{ textAlign: 'center', padding: '80px 32px', color: '#6B7280' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <p>Sélectionnez une page à éditer</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, margin: 0 }}>
                Éditer : {selected.titre_fr}
              </h1>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saved ? GREEN : NAVY,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Sauvegarde…' : saved ? '✅ Sauvegardé' : '💾 Sauvegarder'}
              </button>
            </div>

            {(['fr', 'zh'] as const).map(lang => (
              <div key={lang} style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Titre {lang === 'fr' ? '🇫🇷 Français' : '🇨🇳 Chinois'}
                </label>
                <input
                  value={lang === 'fr' ? selected.titre_fr : selected.titre_zh}
                  onChange={e => setSelected(prev => prev ? { ...prev, [`titre_${lang}`]: e.target.value } : prev)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                />
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', margin: '16px 0 8px' }}>
                  Contenu {lang === 'fr' ? '🇫🇷 Français' : '🇨🇳 Chinois'}
                </label>
                <textarea
                  rows={10}
                  value={lang === 'fr' ? selected.contenu_fr : selected.contenu_zh}
                  onChange={e => setSelected(prev => prev ? { ...prev, [`contenu_${lang}`]: e.target.value } : prev)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
