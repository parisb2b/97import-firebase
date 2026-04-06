import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminButton, AdminInput,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'

interface ProductRow {
  id: string
  numero_interne: string
  nom: string
  nom_chinois: string
  reference: string
  categorie: string
  prix_achat: number
  prix_achat_yuan: number
  longueur_cm: number
  largeur_cm: number
  hauteur_cm: number
  poids_net_kg: number
  poids_brut_kg: number
  volume_m3: number
  qte_pieces_par_unite: number
  code_hs: string
  matiere_fr: string
  matiere_en: string
  matiere_zh: string
  description_fr: string
  description_zh: string
  actif: boolean
}

export default function AdminSuiviAchats() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    try {
      const snap = await getDocs(collection(db, 'products'))
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter((p: any) => p.actif !== false)
        .sort((a: any, b: any) => (a.numero_interne || '').localeCompare(b.numero_interne || ''))
      setProducts(data)
    } catch (err) {
      console.error('Erreur chargement produits:', err)
    } finally {
      setLoading(false)
    }
  }

  function exportExcel() {
    // Export CSV (compatible Excel)
    const headers = [
      'N° Interne', 'Nom FR', 'Nom 中文', 'Référence', 'Catégorie',
      'Prix Achat €', 'Prix Achat ¥', 'Longueur cm', 'Largeur cm', 'Hauteur cm',
      'Volume m³', 'Poids net kg', 'Poids brut kg', 'Qté/unité',
      'Code HS', 'Matière FR', 'Matière EN', 'Matière 中文',
      'Description FR', 'Description 中文', 'Actif',
    ]

    const filtered = getFiltered()
    const rows = filtered.map(p => [
      p.numero_interne || '', p.nom || '', p.nom_chinois || '', p.reference || '', p.categorie || '',
      p.prix_achat || '', p.prix_achat_yuan || '',
      p.longueur_cm || '', p.largeur_cm || '', p.hauteur_cm || '',
      p.volume_m3 || '', p.poids_net_kg || '', p.poids_brut_kg || '', p.qte_pieces_par_unite || '',
      p.code_hs || '', p.matiere_fr || '', p.matiere_en || '', p.matiere_zh || '',
      (p.description_fr || '').replace(/[\n\r]/g, ' '), (p.description_zh || '').replace(/[\n\r]/g, ' '),
      p.actif ? 'Oui' : 'Non',
    ])

    const BOM = '\uFEFF'
    const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `suivi-achats-97import-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function getFiltered() {
    if (!search) return products
    const s = search.toLowerCase()
    return products.filter(p =>
      (p.nom || '').toLowerCase().includes(s) ||
      (p.nom_chinois || '').toLowerCase().includes(s) ||
      (p.numero_interne || '').toLowerCase().includes(s) ||
      (p.reference || '').toLowerCase().includes(s)
    )
  }

  const filtered = getFiltered()

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy }}>
            🛒 Suivi Achats
          </h1>
          <AdminButton variant="success" onClick={exportExcel}>
            📥 Export Excel (CSV)
          </AdminButton>
        </div>

        <div style={{ marginBottom: 16 }}>
          <AdminInput
            placeholder="Rechercher par nom, n° interne, référence..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: 12, color: ADMIN_COLORS.grayText, marginBottom: 12 }}>
          {filtered.length} produit(s) — 21 colonnes pour le fournisseur chinois
        </div>

        <AdminCard>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: 1200 }}>
              <thead>
                <tr style={{ background: ADMIN_COLORS.grayBg, borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                  {['N°', 'Nom FR', 'Nom 中文', 'Réf', 'Cat.', '€', '¥', 'L cm', 'l cm', 'H cm', 'Vol m³', 'Net kg', 'Brut kg', 'Qté', 'HS', 'Matière'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={16} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={16} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Aucun produit</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.numero_interne || '—'}</td>
                    <td style={{ padding: '6px 8px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{p.nom_chinois || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{p.reference || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{p.categorie || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.prix_achat || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.prix_achat_yuan || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.longueur_cm || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.largeur_cm || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.hauteur_cm || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.volume_m3 || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.poids_net_kg || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.poids_brut_kg || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.qte_pieces_par_unite || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{p.code_hs || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{p.matiere_fr || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
