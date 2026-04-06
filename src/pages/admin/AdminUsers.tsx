import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminInput, AdminSelect,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'
import type { UserProfile, UserRole } from '../../types'

const ROLES: UserRole[] = ['visitor', 'user', 'vip', 'partner', 'admin']

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#FEF2F2', color: '#DC2626' },
  partner: { bg: ADMIN_COLORS.orangeBg, color: ADMIN_COLORS.orangeText },
  vip: { bg: ADMIN_COLORS.purpleBgDark, color: ADMIN_COLORS.purpleText },
  user: { bg: ADMIN_COLORS.navyLight, color: ADMIN_COLORS.navy },
  visitor: { bg: ADMIN_COLORS.grayBg, color: ADMIN_COLORS.grayText },
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filtered, setFiltered] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('tous')

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    let list = users
    if (filterRole !== 'tous') list = list.filter(u => u.role === filterRole)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s) ||
        (u.phone || '').includes(s)
      )
    }
    setFiltered(list)
  }, [users, filterRole, search])

  async function loadUsers() {
    try {
      const snap = await getDocs(collection(db, 'profiles'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile))
        .sort((a, b) => {
          const da = (a.created_at as any)?.toDate?.() || new Date(0)
          const db2 = (b.created_at as any)?.toDate?.() || new Date(0)
          return db2.getTime() - da.getTime()
        })
      setUsers(data)
    } catch (err) {
      console.error('Erreur chargement users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(uid: string, newRole: UserRole) {
    await updateDoc(doc(db, 'profiles', uid), { role: newRole, updated_at: serverTimestamp() })
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u))
  }

  // Stats
  const stats = ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r).length }))

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, marginBottom: '16px' }}>
          👥 Clients
        </h1>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {stats.map(s => {
            const rc = ROLE_COLORS[s.role] || ROLE_COLORS.user
            return (
              <span key={s.role} style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: rc.bg, color: rc.color, cursor: 'pointer',
              }} onClick={() => setFilterRole(s.role === filterRole ? 'tous' : s.role)}>
                {s.role} ({s.count})
              </span>
            )
          })}
          <span style={{
            padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: ADMIN_COLORS.grayBg, color: ADMIN_COLORS.grayText,
          }}>
            Total : {users.length}
          </span>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <AdminInput
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ minWidth: 140 }}>
            <AdminSelect value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="tous">Tous les rôles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </AdminSelect>
          </div>
        </div>

        <AdminCard>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: ADMIN_COLORS.grayBg, borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Nom</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Téléphone</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Ville</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Rôle</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Aucun utilisateur</td></tr>
                ) : filtered.map(u => {
                  const date = (u.created_at as any)?.toDate?.()
                  const rc = ROLE_COLORS[u.role] || ROLE_COLORS.user
                  return (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                        {u.first_name} {u.last_name}
                      </td>
                      <td style={{ padding: '8px 12px' }}>{u.email}</td>
                      <td style={{ padding: '8px 12px' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {u.ville_facturation || '—'}
                        {u.pays_facturation ? `, ${u.pays_facturation}` : ''}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value as UserRole)}
                          style={{
                            padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: rc.bg, color: rc.color, border: 'none', cursor: 'pointer',
                            fontFamily: ADMIN_COLORS.font,
                          }}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: ADMIN_COLORS.grayText }}>
                        {date ? date.toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
