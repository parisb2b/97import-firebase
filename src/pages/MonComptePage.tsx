/**
 * MonComptePage — Espace client
 * Profil, Mes Devis, Sécurité
 */
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore'
import { Link, useLocation } from 'wouter'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLang, LangToggle } from '../contexts/LanguageContext'
import { useCart } from '../features/cart/CartContext'
import { Quote } from '../types'
import { formatPrix } from '../utils/calculPrix'

type Tab = 'profil' | 'devis' | 'securite'

const ROLE_LABEL: Record<string, string> = {
  visitor: 'Visiteur',
  user:    'Client',
  partner: 'Partenaire',
  vip:     '★ VIP',
  admin:   'Administrateur',
}

const ROLE_COLOR: Record<string, string> = {
  user:    '#1E3A5F',
  partner: '#059669',
  vip:     '#6B21A8',
  admin:   '#DC2626',
}

const STATUT_LABEL: Record<string, string> = {
  nouveau:  'Nouveau',
  en_cours: 'En cours',
  vip:      '★ VIP',
  accepte:  'Accepté',
  refuse:   'Refusé',
}

const STATUT_COLOR: Record<string, { bg: string; color: string }> = {
  nouveau:  { bg: '#EFF6FF', color: '#1E3A5F' },
  en_cours: { bg: '#FFFBEB', color: '#92400E' },
  vip:      { bg: '#EDE9FE', color: '#6B21A8' },
  accepte:  { bg: '#F0FDF4', color: '#166534' },
  refuse:   { bg: '#FEF2F2', color: '#DC2626' },
}

export default function MonComptePage() {
  const [, navigate] = useLocation()
  const { user, profile, role, loading, signOutClient } = useAuth()
  const { lang, t } = useLang()
  const { count } = useCart()

  const [tab, setTab]         = useState<Tab>('profil')
  const [quotes, setQuotes]   = useState<Quote[]>([])
  const [quotesLoading, setQuotesLoading] = useState(false)

  // Champs profil éditables
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [adresse,   setAdresse]   = useState('')
  const [ville,     setVille]     = useState('')
  const [cp,        setCp]        = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  // Redirect si non connecté
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading])

  // Init champs depuis profil
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
      setAdresse(profile.adresse_facturation || '')
      setVille(profile.ville_facturation || '')
      setCp(profile.cp_facturation || '')
    }
  }, [profile])

  // Charger les devis
  useEffect(() => {
    if (tab !== 'devis' || !user) return
    async function loadQuotes() {
      setQuotesLoading(true)
      try {
        const q = query(
          collection(db, 'quotes'),
          where('user_id', '==', user!.uid),
          orderBy('created_at', 'desc')
        )
        const snap = await getDocs(q)
        setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote)))
      } catch (err) {
        console.error(err)
        // Si pas d'index: requête sans orderBy
        try {
          const q2 = query(collection(db, 'quotes'), where('user_id', '==', user!.uid))
          const snap2 = await getDocs(q2)
          setQuotes(snap2.docs.map(d => ({ id: d.id, ...d.data() } as Quote)))
        } catch {}
      } finally {
        setQuotesLoading(false)
      }
    }
    loadQuotes()
  }, [tab, user])

  async function handleSaveProfil() {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        first_name: firstName,
        last_name: lastName,
        phone,
        adresse_facturation: adresse,
        ville_facturation: ville,
        cp_facturation: cp,
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOutClient()
    navigate('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <p style={{ color: '#6B7280' }}>⏳ {t('msg_loading')}</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── BANNIÈRE ──────────────────────────────────── */}
      <div style={{ background: '#1D4ED8', color: '#fff', textAlign: 'center', padding: '5px', fontSize: '12px', fontWeight: '600' }}>
        {lang === 'fr' ? '-50% PAR RAPPORT AUX PRIX MARTINIQUE' : '比马提尼克岛零售价低50%'}
      </div>

      {/* ── NAVBAR ────────────────────────────────────── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#1E3A5F' }}>97import</span>
          </Link>
          <Link href="/catalogue" style={{ textDecoration: 'none', fontSize: '13px', color: '#6B7280' }}>
            ← {lang === 'fr' ? 'Catalogue' : '目录'}
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LangToggle />
          <button
            onClick={handleSignOut}
            style={{ padding: '6px 14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            {t('nav_logout')}
          </button>
          <Link href="/panier" style={{ textDecoration: 'none', position: 'relative' }}>
            <span style={{ fontSize: '20px' }}>🛒</span>
            {count > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#DC2626', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* ── HEADER COMPTE ─────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)', padding: '28px 20px', color: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Avatar */}
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : '👤'}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user.displayName || user.email}
            </h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{user.email}</span>
              <span style={{ padding: '1px 8px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                {ROLE_LABEL[role] || role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex' }}>
          {([
            { key: 'profil',   label: lang === 'fr' ? '👤 Mon Profil' : '👤 个人资料' },
            { key: 'devis',    label: lang === 'fr' ? '📋 Mes Devis' : '📋 我的报价' },
            { key: 'securite', label: lang === 'fr' ? '🔐 Sécurité' : '🔐 安全' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '14px 20px',
                border: 'none',
                borderBottom: tab === key ? '2px solid #1E3A5F' : '2px solid transparent',
                background: 'none',
                fontSize: '13px',
                fontWeight: tab === key ? '700' : '500',
                color: tab === key ? '#1E3A5F' : '#6B7280',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENU ───────────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px' }}>

        {/* ── TAB: PROFIL ─────────────────────────────── */}
        {tab === 'profil' && (
          <div>
            {saved && (
              <div style={{ padding: '10px 16px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', color: '#166534', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                ✅ {lang === 'fr' ? 'Profil sauvegardé !' : '资料已保存！'}
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  {lang === 'fr' ? 'Informations personnelles' : '个人信息'}
                </span>
                {!editing && (
                  <button onClick={() => setEditing(true)} style={{ padding: '6px 14px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    ✏️ {lang === 'fr' ? 'Modifier' : '编辑'}
                  </button>
                )}
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field
                  label={lang === 'fr' ? 'Prénom' : '名字'}
                  value={firstName}
                  editing={editing}
                  onChange={setFirstName}
                />
                <Field
                  label={lang === 'fr' ? 'Nom' : '姓氏'}
                  value={lastName}
                  editing={editing}
                  onChange={setLastName}
                />
                <Field
                  label={lang === 'fr' ? 'Email' : '邮箱'}
                  value={user.email || ''}
                  editing={false}
                  onChange={() => {}}
                  disabled
                />
                <Field
                  label={lang === 'fr' ? 'Téléphone' : '电话'}
                  value={phone}
                  editing={editing}
                  onChange={setPhone}
                  type="tel"
                />
                <Field
                  label={lang === 'fr' ? 'Adresse' : '地址'}
                  value={adresse}
                  editing={editing}
                  onChange={setAdresse}
                  style={{ gridColumn: '1 / -1' }}
                />
                <Field
                  label={lang === 'fr' ? 'Code postal' : '邮编'}
                  value={cp}
                  editing={editing}
                  onChange={setCp}
                />
                <Field
                  label={lang === 'fr' ? 'Ville' : '城市'}
                  value={ville}
                  editing={editing}
                  onChange={setVille}
                />
              </div>
              {editing && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '10px', background: '#F9FAFB' }}>
                  <button
                    onClick={handleSaveProfil}
                    disabled={saving}
                    style={{ padding: '8px 20px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
                  >
                    {saving ? '⏳...' : `💾 ${t('btn_save')}`}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    style={{ padding: '8px 16px', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    {t('btn_cancel')}
                  </button>
                </div>
              )}
            </div>

            {/* Rôle & statut */}
            <div style={{ marginTop: '16px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                {lang === 'fr' ? 'Statut du compte' : '账户状态'}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', background: ROLE_COLOR[role] || '#6B7280', color: '#fff', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                  {ROLE_LABEL[role] || role}
                </span>
                {role === 'user' && (
                  <span style={{ padding: '4px 12px', background: '#EFF6FF', color: '#1E3A5F', borderRadius: '12px', fontSize: '12px' }}>
                    {lang === 'fr' ? 'Contactez-nous pour accès partenaire' : '联系我们申请合作伙伴权限'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: DEVIS ──────────────────────────────── */}
        {tab === 'devis' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E3A5F', marginBottom: '16px' }}>
              {lang === 'fr' ? '📋 Mes demandes de devis' : '📋 我的报价申请'}
            </h2>
            {quotesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>⏳ {t('msg_loading')}</div>
            ) : quotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '15px' }}>{lang === 'fr' ? 'Aucun devis pour l\'instant.' : '暂无报价记录。'}</p>
                <Link href="/catalogue">
                  <button style={{ marginTop: '16px', padding: '10px 20px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    {lang === 'fr' ? '→ Explorer le catalogue' : '→ 浏览目录'}
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quotes.map(q => {
                  const sc = STATUT_COLOR[q.statut] || { bg: '#F9FAFB', color: '#6B7280' }
                  const rawDate = q.created_at
                  const dateStr = rawDate
                    ? (typeof (rawDate as any).toDate === 'function'
                        ? (rawDate as any).toDate().toLocaleDateString('fr-FR')
                        : (rawDate as Date).toLocaleDateString('fr-FR'))
                    : '—'
                  return (
                    <div key={q.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                            {q.numero_devis}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{dateStr}</div>
                        </div>
                        <span style={{ padding: '3px 10px', background: sc.bg, color: sc.color, borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          {STATUT_LABEL[q.statut] || q.statut}
                        </span>
                      </div>
                      {q.produits && q.produits.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#374151', marginBottom: '8px' }}>
                          {q.produits.map((p: any) => (
                            <span key={p.id} style={{ marginRight: '8px' }}>• {p.nom} ×{p.quantite || 1}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                        <span style={{ color: '#6B7280' }}>
                          {lang === 'fr' ? 'Total estimé :' : '预计总额:'} <strong style={{ color: '#1E3A5F' }}>{formatPrix(q.prix_total_calcule || 0)}</strong>
                        </span>
                        {q.total_encaisse > 0 && (
                          <span style={{ color: '#166534' }}>
                            {lang === 'fr' ? 'Encaissé :' : '已付:'} <strong>{formatPrix(q.total_encaisse)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SÉCURITÉ ───────────────────────────── */}
        {tab === 'securite' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  🔐 {lang === 'fr' ? 'Sécurité du compte' : '账户安全'}
                </span>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px', padding: '14px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <p style={{ fontSize: '13px', color: '#1E3A5F', margin: 0 }}>
                    <strong>{lang === 'fr' ? 'Email de connexion :' : '登录邮箱：'}</strong> {user.email}
                  </p>
                </div>
                {user.providerData[0]?.providerId === 'password' ? (
                  <div>
                    <p style={{ fontSize: '13px', color: '#374151', marginBottom: '16px' }}>
                      {lang === 'fr' ? 'Pour changer votre mot de passe, déconnectez-vous et utilisez le lien "Mot de passe oublié" sur la page de connexion.' : '如需更改密码，请退出登录并在登录页面使用"忘记密码"功能。'}
                    </p>
                    <button
                      onClick={handleSignOut}
                      style={{ padding: '10px 20px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {t('nav_logout')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                      {lang === 'fr' ? 'Vous êtes connecté via :' : '您通过以下方式登录：'}{' '}
                      <strong>{user.providerData[0]?.providerId?.replace('.com', '')}</strong>
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>
                      {lang === 'fr' ? 'La gestion du mot de passe se fait directement sur votre compte Google/Microsoft/Facebook.' : '密码管理请在您的Google/Microsoft/Facebook账户中进行。'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ marginTop: '16px', padding: '16px 20px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', marginBottom: '8px' }}>
                ⚠️ {lang === 'fr' ? 'Zone danger' : '危险操作'}
              </p>
              <p style={{ fontSize: '12px', color: '#991B1B', marginBottom: '12px' }}>
                {lang === 'fr' ? 'La suppression de votre compte est irréversible. Contactez-nous pour toute demande.' : '账户删除不可撤销。如需帮助请联系我们。'}
              </p>
              <a href="mailto:contact@97import.com?subject=Suppression compte" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '7px 14px', background: 'transparent', color: '#DC2626', border: '1px solid #DC2626', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {lang === 'fr' ? 'Demander la suppression du compte' : '申请删除账户'}
                </button>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer style={{ background: '#1E3A5F', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '20px', fontSize: '12px', marginTop: '40px' }}>
        © 2025 97import — Importation directe Chine → DOM-TOM
      </footer>
    </div>
  )
}

// ── Composant champ éditable ──────────────────────────────
interface FieldProps {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
  type?: string
  disabled?: boolean
  style?: React.CSSProperties
}

function Field({ label, value, editing, onChange, type = 'text', disabled = false, style }: FieldProps) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      {editing && !disabled ? (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
        />
      ) : (
        <div style={{ fontSize: '13px', color: disabled ? '#9CA3AF' : '#111827', padding: '8px 0' }}>
          {value || <span style={{ color: '#D1D5DB' }}>—</span>}
        </div>
      )}
    </div>
  )
}
