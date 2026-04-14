import { useState, useEffect } from 'react';
import { useLocation, Redirect } from 'wouter';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';

interface DevisLine {
  ref: string;
  nom_fr: string;
  qte: number;
  prix_unitaire: number;
  total: number;
  prix_negocie?: number;
}

interface Devis {
  id: string;
  numero: string;
  statut: string;
  total_ht: number;
  lignes: DevisLine[];
  client_nom: string;
  client_email: string;
  client_id: string;
  partenaire_code: string;
  createdAt: any;
}

export default function EspacePartenaire() {
  const [, setLocation] = useLocation();
  const user = clientAuth.currentUser;
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('devis_recus');
  const [editedPrices, setEditedPrices] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        // Find partner code
        const pSnap = await getDocs(query(collection(db, 'partners'), where('userId', '==', user.uid)));
        if (pSnap.empty) { setLoading(false); return; }
        const code = pSnap.docs[0].data().code;
        setPartnerCode(code);

        // Load quotes for this partner
        const q = query(collection(db, 'quotes'), where('partenaire_code', '==', code), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setDevis(snap.docs.map(d => ({ id: d.id, ...d.data() } as Devis)));
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <Redirect to="/connexion" />;

  const handleLogout = async () => {
    await clientAuth.signOut();
    setLocation('/');
  };

  const updatePrixNegocie = (devisId: string, index: number, value: number) => {
    setEditedPrices(prev => {
      const current = prev[devisId] || [];
      const updated = [...current];
      updated[index] = value;
      return { ...prev, [devisId]: updated };
    });
  };

  const handleSendVIP = async (d: Devis) => {
    const prices = editedPrices[d.id] || [];
    const updatedLignes = d.lignes.map((l, i) => ({
      ...l,
      prix_negocie: prices[i] !== undefined ? prices[i] : l.prix_unitaire,
    }));

    try {
      await updateDoc(doc(db, 'quotes', d.id), {
        lignes: updatedLignes,
        statut: 'vip_envoye',
      });
      // Update local state
      setDevis(prev => prev.map(dd => dd.id === d.id ? { ...dd, lignes: updatedLignes, statut: 'vip_envoye' } : dd));
      alert('Devis VIP envoye au client !');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Unique clients from devis
  const clients = [...new Map(devis.map(d => [d.client_id, { id: d.client_id, nom: d.client_nom, email: d.client_email }])).values()];

  // Commissions (simple: 5% of total for encaissed quotes)
  const totalCommissions = devis
    .filter(d => d.statut === 'accepte' || d.statut === 'livre')
    .reduce((s, d) => s + d.total_ht * 0.05, 0);

  const sectionLabel: React.CSSProperties = {
    fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.35)',
    padding: '16px 20px 6px', fontWeight: 600,
  };

  const menuBtn = (id: string, icon: string, label: string) => (
    <button key={id} onClick={() => {
      if (id === 'logout') handleLogout();
      else if (id === 'profil') setLocation('/profil');
      else if (id === 'achats') setLocation('/catalogue');
      else if (id === 'mes_devis') setLocation('/espace-client');
      else setActiveView(id);
    }}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px',
      border: 'none', cursor: 'pointer', fontSize: 13,
      background: activeView === id ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: 'white', fontWeight: activeView === id ? 600 : 400,
    }}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );

  const statutStyle = (statut: string): React.CSSProperties => {
    const colors: Record<string, { bg: string; color: string }> = {
      nouveau: { bg: '#DBEAFE', color: '#1E40AF' },
      vip_envoye: { bg: '#EDE9FE', color: '#7C3AED' },
      accepte: { bg: '#DCFCE7', color: '#166534' },
    };
    const s = colors[statut] || { bg: '#F3F4F6', color: '#374151' };
    return { background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 };
  };

  return (
    <div style={{ background: '#F9FAFB', minHeight: '80vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 80, background: '#0B2545', borderRadius: 16, overflow: 'hidden' }}>
          {/* User card */}
          <div style={{ padding: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', marginBottom: 12,
            }}>
              {user.displayName?.[0]?.toUpperCase() || '👤'}
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{user.displayName || 'Partenaire'}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{user.email}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span style={{ background: 'rgba(124,58,237,0.3)', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, color: '#C4B5FD' }}>
                PARTENAIRE {partnerCode}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div style={sectionLabel}>Mon espace client</div>
          {menuBtn('mes_devis', '📋', 'Mes devis')}
          {menuBtn('profil', '👤', 'Mon profil')}
          {menuBtn('achats', '🛍', 'Continuer mes achats')}

          <div style={sectionLabel}>Espace partenaire</div>
          {menuBtn('mes_clients', '👥', 'Mes clients')}
          {menuBtn('devis_recus', '📄', 'Devis recus')}
          {menuBtn('commissions', '💰', 'Commissions')}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8 }} />
          {menuBtn('logout', '🚪', 'Deconnexion')}
        </div>

        {/* Content */}
        <div>
          {/* Devis recus */}
          {activeView === 'devis_recus' && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0B2545', marginBottom: 4 }}>Devis recus</h1>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Gerez les devis de vos clients et negociez les prix VIP</p>

              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
              ) : devis.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 16, padding: 60, textAlign: 'center' }}>
                  <p style={{ color: '#6B7280' }}>Aucun devis recu pour le moment</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {devis.map(d => {
                    const isOpen = expandedId === d.id;
                    const prices = editedPrices[d.id] || [];

                    return (
                      <div key={d.id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                        {/* Header */}
                        <div onClick={() => setExpandedId(isOpen ? null : d.id)}
                          style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, color: '#0B2545', fontSize: 15 }}>{d.numero}</span>
                              <span style={statutStyle(d.statut)}>{d.statut}</span>
                            </div>
                            <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                              {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} · <span style={{ color: '#1E40AF', fontWeight: 600 }}>{d.client_nom || d.client_email}</span> · {d.lignes?.[0]?.nom_fr}
                            </p>
                          </div>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#0B2545' }}>{d.total_ht?.toLocaleString('fr-FR')} €</span>
                          <span style={{ fontSize: 18, color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}>▾</span>
                        </div>

                        {/* Body */}
                        {isOpen && (
                          <div style={{ borderTop: '1px solid #F3F4F6', padding: 20 }}>
                            {/* Products with editable prices */}
                            {d.lignes?.map((l, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0B2545' }}>{l.nom_fr}</p>
                                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>x{l.qte} · Prix public: {l.prix_unitaire?.toLocaleString('fr-FR')} €</p>
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, color: '#7C3AED', fontWeight: 600 }}>Prix negocie</label>
                                  <input type="number"
                                    value={prices[i] !== undefined ? prices[i] : (l.prix_negocie || l.prix_unitaire)}
                                    onChange={e => updatePrixNegocie(d.id, i, Number(e.target.value))}
                                    style={{
                                      width: 100, padding: '6px 10px', border: '2px solid #7C3AED', borderRadius: 8,
                                      fontSize: 14, fontWeight: 700, color: '#7C3AED', textAlign: 'center', background: '#EDE9FE', outline: 'none',
                                    }}
                                  />
                                </div>
                              </div>
                            ))}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                              <button onClick={() => handleSendVIP(d)} style={{
                                flex: 1, padding: '14px 0', border: 'none', borderRadius: 12,
                                background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', color: 'white',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                              }}>
                                📨 Envoyer le devis VIP au client
                              </button>
                              <button style={{
                                padding: '14px 24px', border: '1px solid #E5E7EB', borderRadius: 12,
                                background: 'white', color: '#374151', fontSize: 14, cursor: 'pointer',
                              }}>
                                Apercu PDF
                              </button>
                            </div>

                            {/* Info note */}
                            <div style={{
                              marginTop: 16, background: '#F0FDFA', borderRadius: 12, padding: 14,
                              fontSize: 12, color: '#0D9488', lineHeight: 1.5,
                            }}>
                              💡 Le client recevra le devis VIP par email et dans son espace client. Les prix publics seront barres, les prix negocies affiches en violet.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Mes clients */}
          {activeView === 'mes_clients' && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0B2545', marginBottom: 24 }}>Mes clients</h1>
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {clients.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Aucun client pour le moment</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                        {['Nom', 'Email', 'Nb devis', 'Total commandes'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(c => {
                        const cDevis = devis.filter(d => d.client_id === c.id);
                        const totalCmd = cDevis.reduce((s, d) => s + (d.total_ht || 0), 0);
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0B2545' }}>{c.nom || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{c.email}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>{cDevis.length}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0B2545' }}>{totalCmd.toLocaleString('fr-FR')} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* Commissions */}
          {activeView === 'commissions' && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0B2545', marginBottom: 24 }}>Commissions</h1>
              <div style={{ background: '#DCFCE7', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#166534' }}>Total commissions estimees</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: '#166534' }}>{Math.round(totalCommissions).toLocaleString('fr-FR')} €</p>
                <p style={{ fontSize: 12, color: '#166534', opacity: 0.7, marginTop: 4 }}>5% sur les devis acceptes/livres</p>
              </div>
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {devis.filter(d => d.statut === 'accepte' || d.statut === 'livre').length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Aucune commission pour le moment</div>
                ) : (
                  devis.filter(d => d.statut === 'accepte' || d.statut === 'livre').map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0B2545' }}>{d.numero} — {d.client_nom}</p>
                        <p style={{ fontSize: 12, color: '#9CA3AF' }}>{d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>+{Math.round(d.total_ht * 0.05).toLocaleString('fr-FR')} €</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>sur {d.total_ht.toLocaleString('fr-FR')} €</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
