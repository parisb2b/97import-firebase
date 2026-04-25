import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import PopupSAV from './PopupSAV';

interface SavDemande {
  id: string;
  numero: string;
  statut: string;
  type_probleme: string;
  description: string;
  commande_ref: string;
  photos_urls: string[];
  messages: { auteur: string; texte: string; date: string }[];
  createdAt: any;
}

const STATUT_SAV: Record<string, { bg: string; color: string; label: string }> = {
  nouveau: { bg: '#DBEAFE', color: '#1E40AF', label: 'Nouveau' },
  en_cours: { bg: '#FEF3C7', color: '#92400E', label: 'En cours' },
  resolu: { bg: '#DCFCE7', color: '#166534', label: 'Résolu' },
  ferme: { bg: '#F3F4F6', color: '#6B7280', label: 'Fermé' },
};

export default function SAV({ userId, profile }: { userId: string; profile: any }) {
  const [demandes, setDemandes] = useState<SavDemande[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [commandes, setCommandes] = useState<{ id: string; numero: string; mainProduct: string }[]>([]);
  const [photoZoom, setPhotoZoom] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load SAV
      const qSav = query(collection(db, 'sav'), where('userId', '==', userId));
      const snapSav = await getDocs(qSav);
      const list = snapSav.docs
        .map(d => ({ id: d.id, ...d.data() } as SavDemande))
        .sort((a, b) => (b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0) - (a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0));
      setDemandes(list);

      // Load commandes for popup
      const qCmd = query(collection(db, 'quotes'), where('client_id', '==', userId));
      const snapCmd = await getDocs(qCmd);
      const cmds = snapCmd.docs
        .filter(d => d.data().acomptes?.some((a: any) => a.encaisse === true)) // v43 P3-COMPLET format
        .map(d => ({
          id: d.id,
          numero: `CMD-${(d.data().numero || '').replace(/^DVS-/, '')}`,
          mainProduct: d.data().lignes?.[0]?.nom_fr || 'Commande',
        }));
      setCommandes(cmds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  const enCours = demandes.filter(d => d.statut === 'nouveau' || d.statut === 'en_cours').length;
  const resolues = demandes.filter(d => d.statut === 'resolu').length;

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>SAV</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Gérez vos demandes de service après-vente.</p>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#92400E' }}>En cours</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#92400E' }}>{enCours}</p>
        </div>
        <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#166534' }}>Résolues</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>{resolues}</p>
        </div>
        <div style={{ flex: 1, background: '#DBEAFE', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#1E40AF' }}>Total</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#1E40AF' }}>{demandes.length}</p>
        </div>
      </div>

      {/* Bouton nouvelle demande */}
      <button onClick={() => setShowPopup(true)} style={{
        padding: '10px 20px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 12,
        fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 20,
      }}>
        + Nouvelle demande SAV
      </button>

      {/* Liste demandes */}
      {demandes.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: '#6B7280' }}>
          Aucune demande SAV.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {demandes.map(d => {
            const isOpen = expandedId === d.id;
            const statut = STATUT_SAV[d.statut] || STATUT_SAV.nouveau;
            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div onClick={() => setExpandedId(isOpen ? null : d.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#1565C0', fontSize: 14 }}>{d.numero}</span>
                      <span style={{ background: statut.bg, color: statut.color, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{statut.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} · {d.commande_ref} · {d.type_probleme}
                    </p>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.description}
                  </p>
                  <span style={{ fontSize: 16, color: '#9CA3AF', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : '', display: 'inline-block' }}>▾</span>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: 20 }}>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
                      <strong>Description :</strong>
                      <p style={{ marginTop: 4, color: '#6B7280' }}>{d.description}</p>
                    </div>

                    {/* Photos */}
                    {d.photos_urls && d.photos_urls.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <strong style={{ fontSize: 12, color: '#374151' }}>Photos jointes :</strong>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          {d.photos_urls.map((url, i) => (
                            <img key={i} src={url} alt={`Photo ${i + 1}`}
                              onClick={() => setPhotoZoom(url)}
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid #E5E7EB' }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {d.messages && d.messages.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <strong style={{ fontSize: 12, color: '#374151' }}>Échanges :</strong>
                        <div style={{ marginTop: 6 }}>
                          {d.messages.map((m, i) => (
                            <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 10, marginBottom: 6, fontSize: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: m.auteur === 'admin' ? '#1565C0' : '#374151' }}>{m.auteur === 'admin' ? '97IMPORT' : 'Vous'}</span>
                                <span style={{ color: '#9CA3AF', fontSize: 10 }}>{new Date(m.date).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <p style={{ color: '#6B7280' }}>{m.texte}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      <strong>Statut actuel :</strong> {statut.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Popup SAV */}
      {showPopup && (
        <PopupSAV userId={userId} profile={profile} commandes={commandes}
          onClose={() => setShowPopup(false)} onSavCreated={loadData} />
      )}

      {/* Photo zoom */}
      {photoZoom && (
        <div onClick={() => setPhotoZoom(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 9500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <img src={photoZoom} alt="Zoom" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
