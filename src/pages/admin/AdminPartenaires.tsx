import { useState, useEffect } from 'react'
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminCardHeader, AdminButton, AdminInput,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'
import type { Partner } from '../../types'

export default function AdminPartenaires() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', code: '', email: '', telephone: '', commission_taux: '0.05' })

  useEffect(() => { loadPartners() }, [])

  async function loadPartners() {
    try {
      const snap = await getDocs(collection(db, 'partners'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Partner))
      setPartners(data)
    } catch (err) {
      console.error('Erreur chargement partenaires:', err)
    } finally {
      setLoading(false)
    }
  }

  function openEdit(p: Partner) {
    setEditing(p)
    setForm({
      nom: p.nom, code: p.code, email: p.email || '',
      telephone: p.telephone || '', commission_taux: String(p.commission_taux || 0.05),
    })
    setShowForm(true)
  }

  function openNew() {
    setEditing(null)
    setForm({ nom: '', code: '', email: '', telephone: '', commission_taux: '0.05' })
    setShowForm(true)
  }

  async function savePartner() {
    const data = {
      nom: form.nom,
      code: form.code.toUpperCase(),
      email: form.email,
      telephone: form.telephone,
      commission_taux: parseFloat(form.commission_taux) || 0.05,
      actif: true,
    }

    if (editing) {
      await updateDoc(doc(db, 'partners', editing.id), { ...data, updated_at: serverTimestamp() })
    } else {
      const id = `partner-${form.code.toLowerCase()}`
      await setDoc(doc(db, 'partners', id), { ...data, created_at: serverTimestamp() })
    }
    setShowForm(false)
    await loadPartners()
  }

  async function toggleActif(p: Partner) {
    await updateDoc(doc(db, 'partners', p.id), { actif: !p.actif, updated_at: serverTimestamp() })
    setPartners(prev => prev.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
  }

  // Stats commissions depuis quotes
  const [commissions, setCommissions] = useState<Record<string, number>>({})
  useEffect(() => {
    getDocs(collection(db, 'quotes')).then(snap => {
      const comms: Record<string, number> = {}
      snap.docs.forEach(d => {
        const q = d.data()
        if (q.partenaire_code && q.commission_montant) {
          comms[q.partenaire_code] = (comms[q.partenaire_code] || 0) + q.commission_montant
        }
      })
      setCommissions(comms)
    }).catch(() => {})
  }, [])

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy }}>
            🤝 Partenaires
          </h1>
          <AdminButton variant="primary" size="sm" onClick={openNew}>
            + Nouveau partenaire
          </AdminButton>
        </div>

        {/* Formulaire */}
        {showForm && (
          <AdminCard style={{ marginBottom: 16 }}>
            <AdminCardHeader>{editing ? 'Modifier' : 'Nouveau'} partenaire</AdminCardHeader>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AdminInput label="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                <AdminInput label="Code (2-3 lettres)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} maxLength={3} />
                <AdminInput label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <AdminInput label="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                <AdminInput label="Taux commission (ex: 0.05 = 5%)" type="number" step="0.01" value={form.commission_taux}
                  onChange={e => setForm({ ...form, commission_taux: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <AdminButton variant="success" size="sm" onClick={savePartner}>Enregistrer</AdminButton>
                <AdminButton variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</AdminButton>
              </div>
            </div>
          </AdminCard>
        )}

        {/* Liste */}
        <AdminCard>
          <AdminCardHeader>Partenaires actifs ({partners.filter(p => p.actif).length})</AdminCardHeader>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: ADMIN_COLORS.grayBg, borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Code</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Nom</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Téléphone</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Commission</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total commissions</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Statut</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</td></tr>
                ) : partners.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Aucun partenaire</td></tr>
                ) : partners.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: ADMIN_COLORS.orangeBtn }}>{p.code}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.nom}</td>
                    <td style={{ padding: '8px 12px' }}>{p.email || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{p.telephone || '—'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{((p.commission_taux || 0) * 100).toFixed(0)}%</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: ADMIN_COLORS.orangeText }}>
                      {(commissions[p.code] || 0).toLocaleString('fr-FR')} €
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: p.actif ? ADMIN_COLORS.greenBg : '#FEF2F2',
                        color: p.actif ? ADMIN_COLORS.greenText : '#DC2626',
                      }}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <AdminButton variant="ghost" size="sm" onClick={() => openEdit(p)}>Modifier</AdminButton>
                        <AdminButton variant={p.actif ? 'danger' : 'success'} size="sm" onClick={() => toggleActif(p)}>
                          {p.actif ? 'Désactiver' : 'Activer'}
                        </AdminButton>
                      </div>
                    </td>
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
