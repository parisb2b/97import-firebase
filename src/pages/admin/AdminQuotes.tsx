import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminCardHeader, AdminButton, AdminInput, AdminSelect,
  BadgeStatut, PaiementRow, PaiementResume, DocumentRow,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'
import type { Quote } from '../../types'

type ViewMode = 'list' | 'detail'

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filtered, setFiltered] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<Quote | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')

  // VIP
  const [prixNegocie, setPrixNegocie] = useState('')
  const [notesInternes, setNotesInternes] = useState('')

  useEffect(() => { loadQuotes() }, [])

  useEffect(() => {
    let list = quotes
    if (filterStatut !== 'tous') list = list.filter(q => q.statut === filterStatut)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(q =>
        (q.numero_devis || '').toLowerCase().includes(s) ||
        (q.nom_client || '').toLowerCase().includes(s) ||
        (q.email_client || '').toLowerCase().includes(s)
      )
    }
    setFiltered(list)
  }, [quotes, filterStatut, search])

  async function loadQuotes() {
    try {
      const snap = await getDocs(collection(db, 'quotes'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote))
        .sort((a, b) => {
          const da = (a.created_at as any)?.toDate?.() || new Date(0)
          const db2 = (b.created_at as any)?.toDate?.() || new Date(0)
          return db2.getTime() - da.getTime()
        })
      setQuotes(data)
    } catch (err) {
      console.error('Erreur chargement devis:', err)
    } finally {
      setLoading(false)
    }
  }

  function openDetail(q: Quote) {
    setSelected(q)
    setPrixNegocie(q.prix_negocie ? String(q.prix_negocie) : '')
    setNotesInternes(q.notes_internes || '')
    setView('detail')
  }

  async function updateStatut(id: string, statut: string) {
    await updateDoc(doc(db, 'quotes', id), { statut, updated_at: serverTimestamp() })
    await loadQuotes()
    if (selected?.id === id) setSelected({ ...selected!, statut: statut as any })
  }

  async function saveVIP() {
    if (!selected) return
    const prix = parseFloat(prixNegocie)
    if (isNaN(prix) || prix <= 0) return
    const remise = selected.prix_total_calcule > 0
      ? Math.round((1 - prix / selected.prix_total_calcule) * 100)
      : 0
    await updateDoc(doc(db, 'quotes', selected.id), {
      prix_negocie: prix,
      remise_pct: remise,
      statut: 'vip',
      updated_at: serverTimestamp(),
    })
    await loadQuotes()
    setSelected({ ...selected, prix_negocie: prix, remise_pct: remise, statut: 'vip' })
  }

  async function encaisserAcompte(index: number) {
    if (!selected) return
    const acomptes = [...(selected.acomptes || [])]
    acomptes[index] = {
      ...acomptes[index],
      statut: 'encaisse',
      date_encaissement: new Date() as any,
    }
    const totalEncaisse = acomptes
      .filter(a => a.statut === 'encaisse')
      .reduce((s, a) => s + a.montant, 0)
    const montantRef = selected.prix_negocie || selected.prix_total_calcule
    const solde = montantRef - totalEncaisse

    await updateDoc(doc(db, 'quotes', selected.id), {
      acomptes,
      total_encaisse: totalEncaisse,
      solde_restant: solde,
      updated_at: serverTimestamp(),
    })
    await loadQuotes()
    setSelected({ ...selected, acomptes, total_encaisse: totalEncaisse, solde_restant: solde })
  }

  async function saveNotes() {
    if (!selected) return
    await updateDoc(doc(db, 'quotes', selected.id), {
      notes_internes: notesInternes,
      updated_at: serverTimestamp(),
    })
  }

  const STATUTS = ['tous', 'nouveau', 'en_cours', 'vip', 'accepte', 'refuse', 'facture']

  // ── LISTE ──
  if (view === 'list') {
    return (
      <AdminLayout>
        <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, marginBottom: '16px' }}>
            📄 Devis & Facturation
          </h1>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <AdminInput
                placeholder="Rechercher par n° devis, client, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ minWidth: 150 }}>
              <AdminSelect value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
                {STATUTS.map(s => <option key={s} value={s}>{s === 'tous' ? 'Tous les statuts' : s}</option>)}
              </AdminSelect>
            </div>
          </div>

          {/* Stats rapides */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['nouveau', 'vip', 'accepte', 'facture'].map(s => {
              const count = quotes.filter(q => q.statut === s).length
              return (
                <span key={s} style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: s === 'nouveau' ? ADMIN_COLORS.navyLight : s === 'vip' ? ADMIN_COLORS.purpleBgDark : ADMIN_COLORS.greenBg,
                  color: s === 'nouveau' ? ADMIN_COLORS.navy : s === 'vip' ? ADMIN_COLORS.purpleText : ADMIN_COLORS.greenText,
                  cursor: 'pointer',
                }} onClick={() => setFilterStatut(s === filterStatut ? 'tous' : s)}>
                  {s} ({count})
                </span>
              )
            })}
          </div>

          <AdminCard>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: ADMIN_COLORS.grayBg, borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>N° Devis</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Client</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Montant</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Statut</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Partenaire</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Aucun devis</td></tr>
                  ) : filtered.map(q => {
                    const date = (q.created_at as any)?.toDate?.()
                    return (
                      <tr key={q.id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}`, cursor: 'pointer' }}
                          onClick={() => openDetail(q)}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{q.numero_devis || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div>{q.nom_client || '—'}</div>
                          <div style={{ fontSize: 10, color: ADMIN_COLORS.grayText }}>{q.email_client}</div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                          {q.prix_negocie
                            ? <><span style={{ textDecoration: 'line-through', color: ADMIN_COLORS.grayText, fontSize: 10 }}>{q.prix_total_calcule?.toLocaleString('fr-FR')} €</span>{' '}
                                <span style={{ color: ADMIN_COLORS.purpleText }}>{q.prix_negocie.toLocaleString('fr-FR')} €</span></>
                            : `${(q.prix_total_calcule || 0).toLocaleString('fr-FR')} €`
                          }
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}><BadgeStatut statut={q.statut} /></td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11 }}>{q.partenaire_code || '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: ADMIN_COLORS.grayText }}>
                          {date ? date.toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <AdminButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(q) }}>
                            Ouvrir
                          </AdminButton>
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

  // ── DÉTAIL DEVIS (GDF) ──
  if (!selected) return null
  const montantRef = selected.prix_negocie || selected.prix_total_calcule || 0
  const totalEncaisse = selected.total_encaisse || 0
  const soldeRestant = selected.solde_restant ?? (montantRef - totalEncaisse)

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        {/* Retour */}
        <AdminButton variant="ghost" size="sm" onClick={() => { setView('list'); setSelected(null) }}
          style={{ marginBottom: 16 }}>
          ← Retour à la liste
        </AdminButton>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy }}>
            {selected.numero_devis || 'Devis'}
          </h1>
          <BadgeStatut statut={selected.statut} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* ── COLONNE GAUCHE : Info client + produits ── */}
          <div>
            <AdminCard>
              <AdminCardHeader>Client</AdminCardHeader>
              <div style={{ padding: '12px 16px', fontSize: 12 }}>
                <div><strong>{selected.nom_client}</strong></div>
                <div style={{ color: ADMIN_COLORS.grayText }}>{selected.email_client}</div>
                <div style={{ color: ADMIN_COLORS.grayText }}>{selected.telephone_client}</div>
                <div style={{ color: ADMIN_COLORS.grayText, marginTop: 4 }}>{selected.adresse_client} — {selected.ville_client}</div>
                {selected.destination_livraison && (
                  <div style={{ marginTop: 4 }}>🏝️ Livraison : {selected.destination_livraison}</div>
                )}
              </div>
            </AdminCard>

            <AdminCard style={{ marginTop: 16 }}>
              <AdminCardHeader>Produits ({selected.produits?.length || 0})</AdminCardHeader>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: ADMIN_COLORS.grayBg, borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                      <th style={{ padding: '6px 12px', textAlign: 'left' }}>Produit</th>
                      <th style={{ padding: '6px 12px', textAlign: 'center' }}>Qté</th>
                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>P.U. HT</th>
                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.produits || []).map((p, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                        <td style={{ padding: '6px 12px' }}>
                          <div>{p.nom}</div>
                          {p.numero_interne && <div style={{ fontSize: 10, color: ADMIN_COLORS.grayText }}>{p.numero_interne}</div>}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>{p.quantite}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{p.prixUnitaire?.toLocaleString('fr-FR')} €</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>
                          {(p.prixUnitaire * p.quantite).toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 14, borderTop: `1px solid ${ADMIN_COLORS.grayBorder}` }}>
                Total : {(selected.prix_total_calcule || 0).toLocaleString('fr-FR')} € HT
              </div>
            </AdminCard>

            {/* Notes internes */}
            <AdminCard style={{ marginTop: 16 }}>
              <AdminCardHeader>Notes internes</AdminCardHeader>
              <div style={{ padding: 12 }}>
                <textarea
                  value={notesInternes}
                  onChange={e => setNotesInternes(e.target.value)}
                  onBlur={saveNotes}
                  style={{
                    width: '100%', minHeight: 80, padding: 8, border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                    borderRadius: 5, fontSize: 12, fontFamily: ADMIN_COLORS.font, resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Notes visibles uniquement par l'admin..."
                />
              </div>
            </AdminCard>
          </div>

          {/* ── COLONNE DROITE : Actions + VIP + Acomptes + Documents ── */}
          <div>
            {/* Actions statut */}
            <AdminCard>
              <AdminCardHeader>Actions</AdminCardHeader>
              <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.statut === 'nouveau' && (
                  <>
                    <AdminButton variant="primary" size="sm" onClick={() => updateStatut(selected.id, 'en_cours')}>
                      Passer en cours
                    </AdminButton>
                    <AdminButton variant="danger" size="sm" onClick={() => updateStatut(selected.id, 'refuse')}>
                      Refuser
                    </AdminButton>
                  </>
                )}
                {['nouveau', 'en_cours'].includes(selected.statut) && (
                  <AdminButton variant="purple" size="sm" onClick={() => {
                    setPrixNegocie(String(selected.prix_total_calcule || 0))
                  }}>
                    ★ Passer en VIP
                  </AdminButton>
                )}
                {selected.statut === 'vip' && (
                  <AdminButton variant="success" size="sm" onClick={() => updateStatut(selected.id, 'accepte')}>
                    Accepter
                  </AdminButton>
                )}
                {selected.statut === 'accepte' && (
                  <AdminButton variant="success" size="sm" onClick={() => updateStatut(selected.id, 'facture')}>
                    Générer facture finale
                  </AdminButton>
                )}
              </div>
            </AdminCard>

            {/* VIP — Prix négocié */}
            {['nouveau', 'en_cours', 'vip'].includes(selected.statut) && (
              <AdminCard style={{ marginTop: 16 }}>
                <AdminCardHeader>★ Prix négocié VIP</AdminCardHeader>
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <AdminInput
                        label="Prix négocié HT (€)"
                        type="number"
                        value={prixNegocie}
                        onChange={e => setPrixNegocie(e.target.value)}
                        placeholder="Ex: 15000"
                      />
                    </div>
                    <AdminButton variant="purple" size="sm" onClick={saveVIP}>
                      Valider VIP
                    </AdminButton>
                  </div>
                  {selected.prix_negocie && (
                    <div style={{ marginTop: 8, fontSize: 11, color: ADMIN_COLORS.purpleText }}>
                      Prix initial : {selected.prix_total_calcule?.toLocaleString('fr-FR')} € → Négocié : {selected.prix_negocie.toLocaleString('fr-FR')} €
                      {selected.remise_pct ? ` (-${selected.remise_pct}%)` : ''}
                    </div>
                  )}
                </div>
              </AdminCard>
            )}

            {/* Acomptes */}
            <AdminCard style={{ marginTop: 16 }}>
              <AdminCardHeader>Acomptes & Paiements</AdminCardHeader>
              <div style={{ padding: 12 }}>
                {(selected.acomptes || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: ADMIN_COLORS.grayText, padding: '8px 0' }}>
                    Aucun acompte déclaré
                  </div>
                ) : (
                  <>
                    {selected.acomptes.map((a, i) => (
                      <PaiementRow
                        key={i}
                        numero={a.numero}
                        montant={a.montant}
                        type={a.type}
                        statut={a.statut}
                        date={a.date ? ((a.date as any)?.toDate?.() || new Date(a.date as any)).toLocaleDateString('fr-FR') : undefined}
                        onEncaisser={a.statut === 'en_attente' ? () => encaisserAcompte(i) : undefined}
                      />
                    ))}
                    <PaiementResume totalEncaisse={totalEncaisse} soldeRestant={soldeRestant} />
                  </>
                )}
              </div>
            </AdminCard>

            {/* Documents */}
            <AdminCard style={{ marginTop: 16 }}>
              <AdminCardHeader>Documents</AdminCardHeader>
              <div style={{ padding: 12 }}>
                <DocumentRow
                  label="DEVIS"
                  numero={selected.numero_devis}
                  couleurBg={ADMIN_COLORS.navyLight}
                  couleurBorder={ADMIN_COLORS.navyBorder}
                  couleurText={ADMIN_COLORS.navy}
                  pdfUrl={selected.pdf_url}
                  onPdf={() => selected.pdf_url && window.open(selected.pdf_url, '_blank')}
                />
                {selected.invoice_number && (
                  <DocumentRow
                    label="FACTURE"
                    numero={selected.invoice_number}
                    couleurBg={ADMIN_COLORS.greenBg}
                    couleurBorder={ADMIN_COLORS.greenBorder}
                    couleurText={ADMIN_COLORS.greenText}
                  />
                )}
              </div>
            </AdminCard>

            {/* Partenaire */}
            {selected.partenaire_code && (
              <AdminCard style={{ marginTop: 16 }}>
                <AdminCardHeader>Partenaire apporteur</AdminCardHeader>
                <div style={{ padding: 12, fontSize: 12 }}>
                  <div><strong>Code : {selected.partenaire_code}</strong></div>
                  {selected.commission_montant && (
                    <div style={{ marginTop: 4, color: ADMIN_COLORS.orangeText }}>
                      Commission : {selected.commission_montant.toLocaleString('fr-FR')} €
                    </div>
                  )}
                </div>
              </AdminCard>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
