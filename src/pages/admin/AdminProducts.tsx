/**
 * AdminProducts — Gestion catalogue Firestore
 * Liste, recherche, modification inline: nom_chinois, dimensions, prix_yuan
 */
import { useState, useEffect } from 'react'
import {
  collection, getDocs, doc, updateDoc, query, orderBy
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Product } from '../../types'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminCardHeader, AdminButton,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'

const CATEGORIES = ['mini-pelles', 'maisons', 'solaire', 'accessoires']

export default function AdminProducts() {
  const [products, setProducts]   = useState<Product[]>([])
  const [filtered, setFiltered]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing]     = useState<string | null>(null)
  const [editData, setEditData]   = useState<Partial<Product>>({})
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState<string | null>(null)

  // Charger les produits
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const snap = await getDocs(query(collection(db, 'products'), orderBy('categorie')))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
        setProducts(data)
        setFiltered(data)
      } catch (err) {
        console.error(err)
        // Fallback sans orderBy
        try {
          const snap2 = await getDocs(collection(db, 'products'))
          const data2 = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Product))
          setProducts(data2)
          setFiltered(data2)
        } catch {}
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtres
  useEffect(() => {
    let res = products
    if (catFilter !== 'all') {
      res = res.filter(p => p.categorie === catFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(p =>
        p.nom?.toLowerCase().includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        p.numero_interne?.toLowerCase().includes(q) ||
        p.nom_chinois?.toLowerCase().includes(q)
      )
    }
    setFiltered(res)
  }, [search, catFilter, products])

  function startEdit(p: Product) {
    setEditing(p.id)
    setEditData({
      nom_chinois:          p.nom_chinois || '',
      prix_achat_yuan:      p.prix_achat_yuan || 0,
      longueur_cm:          p.longueur_cm || 0,
      largeur_cm:           p.largeur_cm || 0,
      hauteur_cm:           p.hauteur_cm || 0,
      poids_net_kg:         p.poids_net_kg || 0,
      poids_brut_kg:        p.poids_brut_kg || 0,
      qte_pieces_par_unite: p.qte_pieces_par_unite || 1,
      code_hs:              p.code_hs || '',
      matiere_fr:           p.matiere_fr || '',
      actif:                p.actif,
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const updatePayload: any = { ...editData }
      // Convertir les champs numériques
      ;['prix_achat_yuan', 'longueur_cm', 'largeur_cm', 'hauteur_cm',
        'poids_net_kg', 'poids_brut_kg', 'qte_pieces_par_unite'].forEach(k => {
        if (updatePayload[k] !== undefined) {
          updatePayload[k] = Number(updatePayload[k]) || 0
        }
      })
      await updateDoc(doc(db, 'products', id), updatePayload)
      // Mettre à jour l'état local
      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, ...updatePayload } : p
      ))
      setEditing(null)
      setSaved(id)
      setTimeout(() => setSaved(null), 2000)
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setEditing(null)
    setEditData({})
  }

  // Stats
  const total   = products.length
  const actifs  = products.filter(p => p.actif).length
  const avecImg = products.filter(p => (p.images?.length || 0) > 0).length
  const avecChinois = products.filter(p => p.nom_chinois).length

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, margin: 0 }}>
            📦 Catalogue Produits
          </h1>
          <div style={{ fontSize: '12px', color: ADMIN_COLORS.grayText }}>
            {total} produits · {actifs} actifs · {avecImg} avec images · {avecChinois}/{total} nom 中文
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total',        val: total,       bg: ADMIN_COLORS.navyLight, color: ADMIN_COLORS.navy },
            { label: 'Actifs',       val: actifs,      bg: ADMIN_COLORS.greenBg,   color: ADMIN_COLORS.greenText },
            { label: 'Avec photos',  val: avecImg,     bg: ADMIN_COLORS.orangeBg,  color: ADMIN_COLORS.orangeText },
            { label: 'Nom chinois',  val: `${avecChinois}/${total}`, bg: ADMIN_COLORS.purpleBgDark, color: ADMIN_COLORS.purpleText },
          ].map(({ label, val, bg, color }) => (
            <div key={label} style={{ padding: '12px 16px', background: bg, borderRadius: '8px', border: `0.5px solid ${ADMIN_COLORS.grayBorder}` }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color }}>{val}</div>
              <div style={{ fontSize: '11px', color, opacity: 0.75, marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <AdminCard style={{ marginBottom: '16px' }}>
          <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="🔍 Rechercher par nom, réf, SKU, 中文..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '6px 10px', border: `0.5px solid ${ADMIN_COLORS.grayBorder}`, borderRadius: '5px', fontSize: '12px', fontFamily: ADMIN_COLORS.font, outline: 'none' }}
            />
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              style={{ padding: '6px 10px', border: `0.5px solid ${ADMIN_COLORS.grayBorder}`, borderRadius: '5px', fontSize: '12px', fontFamily: ADMIN_COLORS.font, background: '#fff', cursor: 'pointer' }}
            >
              <option value="all">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ fontSize: '12px', color: ADMIN_COLORS.grayText }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </AdminCard>

        {/* Tableau */}
        <AdminCard>
          <AdminCardHeader>
            Produits ({filtered.length})
          </AdminCardHeader>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: ADMIN_COLORS.grayText, fontSize: '13px' }}>
              ⏳ Chargement...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: ADMIN_COLORS.font }}>
                <thead>
                  <tr style={{ background: ADMIN_COLORS.grayBg, borderBottom: `0.5px solid ${ADMIN_COLORS.grayBorder}` }}>
                    {['Photo', 'Nom FR / 中文', 'Réf. interne', 'Catégorie', 'Prix achat €', 'Prix ¥', 'Dimensions', 'Statut', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const isEditing = editing === p.id
                    const isSaved   = saved === p.id
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                          background: isEditing ? ADMIN_COLORS.navyLight : (isSaved ? '#F0FDF4' : (idx % 2 === 0 ? '#fff' : ADMIN_COLORS.grayBg)),
                        }}
                      >
                        {/* Photo */}
                        <td style={{ padding: '8px 12px' }}>
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.nom}
                              style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: `0.5px solid ${ADMIN_COLORS.grayBorder}` }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <div style={{ width: '48px', height: '36px', background: ADMIN_COLORS.grayBg, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                              📦
                            </div>
                          )}
                        </td>

                        {/* Nom */}
                        <td style={{ padding: '8px 12px', minWidth: '200px' }}>
                          <div style={{ fontWeight: '600', color: ADMIN_COLORS.navy }}>{p.nom}</div>
                          {isEditing ? (
                            <input
                              placeholder="名称 (中文)..."
                              value={String(editData.nom_chinois || '')}
                              onChange={e => setEditData(prev => ({ ...prev, nom_chinois: e.target.value }))}
                              style={{ marginTop: '4px', width: '100%', padding: '4px 6px', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', fontSize: '12px', fontFamily: ADMIN_COLORS.font, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <div style={{ color: p.nom_chinois ? ADMIN_COLORS.purpleText : ADMIN_COLORS.grayText, fontSize: '11px', marginTop: '2px' }}>
                              {p.nom_chinois || <span style={{ opacity: 0.5 }}>— 中文 à compléter</span>}
                            </div>
                          )}
                        </td>

                        {/* Réf interne */}
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: ADMIN_COLORS.navy, whiteSpace: 'nowrap' }}>
                          {p.numero_interne || '—'}
                        </td>

                        {/* Catégorie */}
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 6px', background: ADMIN_COLORS.navyLight, color: ADMIN_COLORS.navy, borderRadius: '8px', fontSize: '10px', fontWeight: '600' }}>
                            {p.categorie}
                          </span>
                        </td>

                        {/* Prix achat € */}
                        <td style={{ padding: '8px 12px', fontWeight: '700', color: ADMIN_COLORS.navy, whiteSpace: 'nowrap' }}>
                          {p.prix_achat > 0 ? `${p.prix_achat.toLocaleString('fr-FR')} €` : <span style={{ color: ADMIN_COLORS.grayText }}>—</span>}
                        </td>

                        {/* Prix ¥ */}
                        <td style={{ padding: '8px 12px', minWidth: '100px' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              placeholder="¥ yuan"
                              value={String(editData.prix_achat_yuan || '')}
                              onChange={e => setEditData(prev => ({ ...prev, prix_achat_yuan: Number(e.target.value) }))}
                              style={{ width: '80px', padding: '4px 6px', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', fontSize: '12px', fontFamily: ADMIN_COLORS.font, background: '#fff', outline: 'none' }}
                            />
                          ) : (
                            <span style={{ color: p.prix_achat_yuan ? ADMIN_COLORS.navy : ADMIN_COLORS.grayText, fontWeight: p.prix_achat_yuan ? '600' : '400' }}>
                              {p.prix_achat_yuan ? `¥ ${p.prix_achat_yuan.toLocaleString()}` : '—'}
                            </span>
                          )}
                        </td>

                        {/* Dimensions */}
                        <td style={{ padding: '8px 12px', minWidth: '180px' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {[
                                { key: 'longueur_cm', ph: 'L' },
                                { key: 'largeur_cm',  ph: 'l' },
                                { key: 'hauteur_cm',  ph: 'H' },
                              ].map(({ key, ph }) => (
                                <input
                                  key={key}
                                  type="number"
                                  placeholder={ph}
                                  value={String((editData as any)[key] || '')}
                                  onChange={e => setEditData(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                  style={{ width: '44px', padding: '4px', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', fontSize: '11px', fontFamily: ADMIN_COLORS.font, background: '#fff', outline: 'none', textAlign: 'center' }}
                                />
                              ))}
                              <span style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, alignSelf: 'center' }}>cm</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: (p.longueur_cm || p.largeur_cm || p.hauteur_cm) ? '#374151' : ADMIN_COLORS.grayText }}>
                              {p.longueur_cm || p.largeur_cm || p.hauteur_cm
                                ? `${p.longueur_cm || '?'} × ${p.largeur_cm || '?'} × ${p.hauteur_cm || '?'} cm`
                                : '— à compléter'}
                            </span>
                          )}
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '8px 12px' }}>
                          {isEditing ? (
                            <select
                              value={String(editData.actif)}
                              onChange={e => setEditData(prev => ({ ...prev, actif: e.target.value === 'true' }))}
                              style={{ padding: '4px 6px', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', fontSize: '11px', fontFamily: ADMIN_COLORS.font, background: '#fff' }}
                            >
                              <option value="true">✅ Actif</option>
                              <option value="false">⛔ Inactif</option>
                            </select>
                          ) : (
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: p.actif ? ADMIN_COLORS.greenBg : '#FEF2F2', color: p.actif ? ADMIN_COLORS.greenText : '#DC2626' }}>
                              {p.actif ? '✅ Actif' : '⛔ Inactif'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <AdminButton variant="success" size="sm" onClick={() => saveEdit(p.id)} disabled={saving}>
                                {saving ? '⏳' : '💾'}
                              </AdminButton>
                              <AdminButton variant="ghost" size="sm" onClick={cancelEdit}>
                                ✕
                              </AdminButton>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <AdminButton variant="ghost" size="sm" onClick={() => startEdit(p)}>
                                ✏️ Éditer
                              </AdminButton>
                              <a href={`/produit/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                <AdminButton variant="ghost" size="sm">↗</AdminButton>
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        {/* Légende complétude */}
        <div style={{ marginTop: '16px', padding: '12px 16px', background: ADMIN_COLORS.orangeBg, borderRadius: '8px', border: `0.5px solid ${ADMIN_COLORS.orangeBorder}`, fontSize: '11px', color: ADMIN_COLORS.orangeText }}>
          <strong>À compléter :</strong> Cliquez sur ✏️ Éditer pour renseigner le nom chinois, le prix en yuan et les dimensions.
          Ces informations sont indispensables pour les documents douaniers.
        </div>
      </div>
    </AdminLayout>
  )
}
