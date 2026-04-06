import { useState, useEffect } from 'react'
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminCardHeader, AdminButton, AdminInput,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'
import type { SiteContent } from '../../types'

const DEFAULT_SECTIONS = [
  { id: 'hero', section: 'hero', titre_fr: 'Importez directement de Chine', sous_titre_fr: 'Mini-pelles, maisons modulaires, panneaux solaires pour les DOM-TOM', actif: true },
  { id: 'about', section: 'about', titre_fr: 'À propos de 97import', corps_fr: '', actif: true },
  { id: 'banner', section: 'banner', titre_fr: 'Promotion en cours', corps_fr: '', actif: false },
  { id: 'footer_contact', section: 'footer_contact', titre_fr: 'Contact', corps_fr: 'info@97import.com | +33 6 63 28 49 08', actif: true },
  { id: 'livraison', section: 'livraison', titre_fr: 'Livraison DOM-TOM', corps_fr: 'Transport maritime depuis Ningbo/Shanghai', actif: true },
]

export default function AdminContenu() {
  const [sections, setSections] = useState<SiteContent[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { loadContent() }, [])

  async function loadContent() {
    try {
      const snap = await getDocs(collection(db, 'site_content'))
      if (snap.empty) {
        setSections(DEFAULT_SECTIONS as any)
      } else {
        setSections(snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteContent)))
      }
    } catch (err) {
      console.error('Erreur chargement contenu:', err)
      setSections(DEFAULT_SECTIONS as any)
    } finally {
      setLoading(false)
    }
  }

  function updateField(id: string, field: string, value: any) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  async function saveSection(s: SiteContent) {
    const { id, ...data } = s
    await setDoc(doc(db, 'site_content', id!), { ...data, updated_at: serverTimestamp() })
    setEditingId(null)
  }

  async function saveAll() {
    for (const s of sections) {
      const { id, ...data } = s
      await setDoc(doc(db, 'site_content', id!), { ...data, updated_at: serverTimestamp() })
    }
    alert('Contenu sauvegardé')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: 40, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy }}>
            🌐 Contenu Site
          </h1>
          <AdminButton variant="success" onClick={saveAll}>Enregistrer tout</AdminButton>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {sections.map(s => (
            <AdminCard key={s.id}>
              <AdminCardHeader
                actions={
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={s.actif}
                        onChange={e => updateField(s.id!, 'actif', e.target.checked)}
                      />
                      Actif
                    </label>
                    <AdminButton variant="ghost" size="sm" onClick={() => setEditingId(editingId === s.id ? null : s.id!)}>
                      {editingId === s.id ? 'Fermer' : 'Modifier'}
                    </AdminButton>
                  </div>
                }
              >
                {s.section?.toUpperCase()} — {s.titre_fr || '(sans titre)'}
              </AdminCardHeader>

              {editingId === s.id && (
                <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                  <AdminInput label="Titre FR" value={s.titre_fr || ''} onChange={e => updateField(s.id!, 'titre_fr', e.target.value)} />
                  <AdminInput label="Titre 中文" value={s.titre_zh || ''} onChange={e => updateField(s.id!, 'titre_zh', e.target.value)} />
                  <AdminInput label="Sous-titre FR" value={s.sous_titre_fr || ''} onChange={e => updateField(s.id!, 'sous_titre_fr', e.target.value)} />
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      Contenu FR
                    </label>
                    <textarea
                      value={s.corps_fr || ''}
                      onChange={e => updateField(s.id!, 'corps_fr', e.target.value)}
                      rows={4}
                      style={{
                        width: '100%', padding: 8, border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                        borderRadius: 5, fontSize: 12, fontFamily: ADMIN_COLORS.font, resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <AdminInput label="Image URL" value={s.image_url || ''} onChange={e => updateField(s.id!, 'image_url', e.target.value)} />
                  <AdminInput label="CTA Label FR" value={s.cta_label_fr || ''} onChange={e => updateField(s.id!, 'cta_label_fr', e.target.value)} />
                  <AdminInput label="CTA URL" value={s.cta_url || ''} onChange={e => updateField(s.id!, 'cta_url', e.target.value)} />
                  <AdminButton variant="success" size="sm" onClick={() => saveSection(s)}>Sauvegarder cette section</AdminButton>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
