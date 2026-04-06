import { useState, useEffect } from 'react'
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminButton, AdminInput,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'

interface MediaItem {
  name: string
  fullPath: string
  url: string
  size: number
  contentType: string
}

const FOLDERS = ['products', 'logos', 'accessories', 'houses', 'solar', 'portal', 'documents', 'videos']

export default function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFolder, setCurrentFolder] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { loadMedia() }, [currentFolder])

  async function loadMedia() {
    setLoading(true)
    try {
      const folderRef = ref(storage, currentFolder || '/')
      const result = await listAll(folderRef)

      const mediaItems: MediaItem[] = []
      for (const itemRef of result.items.slice(0, 100)) {
        try {
          const [url, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef),
          ])
          mediaItems.push({
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            url,
            size: metadata.size || 0,
            contentType: metadata.contentType || '',
          })
        } catch {
          // Fichier inaccessible
        }
      }
      setItems(mediaItems)
    } catch (err) {
      console.error('Erreur chargement médias:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const filtered = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, marginBottom: '16px' }}>
          🖼️ Médiathèque
        </h1>

        {/* Dossiers */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <AdminButton variant={currentFolder === '' ? 'primary' : 'ghost'} size="sm"
            onClick={() => setCurrentFolder('')}>/ Racine</AdminButton>
          {FOLDERS.map(f => (
            <AdminButton key={f} variant={currentFolder === f ? 'primary' : 'ghost'} size="sm"
              onClick={() => setCurrentFolder(f)}>📁 {f}</AdminButton>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <AdminInput placeholder="Rechercher un fichier..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ fontSize: 12, color: ADMIN_COLORS.grayText, marginBottom: 12 }}>
          {filtered.length} fichier(s) dans /{currentFolder || 'racine'}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <AdminCard>
            <div style={{ padding: 40, textAlign: 'center', color: ADMIN_COLORS.grayText }}>
              Aucun fichier dans ce dossier
            </div>
          </AdminCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {filtered.map(item => (
              <div key={item.fullPath} style={{
                background: '#fff', border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
              }} onClick={() => window.open(item.url, '_blank')}>
                <div style={{
                  height: 120, background: ADMIN_COLORS.grayBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {item.contentType.startsWith('image/') ? (
                    <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 32 }}>
                      {item.contentType.includes('pdf') ? '📄' : item.contentType.includes('video') ? '🎬' : '📁'}
                    </span>
                  )}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 10, color: ADMIN_COLORS.grayText, marginTop: 2 }}>
                    {formatSize(item.size)} · {item.contentType.split('/')[1]?.toUpperCase() || '?'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
