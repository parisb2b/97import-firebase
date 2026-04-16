import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { generateDevis, downloadPDF } from '../../../lib/pdf-generator';
import { useToast } from '../../components/Toast';

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
  is_vip?: boolean;
  createdAt: any;
}

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  nouveau: { bg: '#DBEAFE', color: '#1E40AF', label: 'Nouveau' },
  en_cours: { bg: '#FEF3C7', color: '#92400E', label: 'En cours' },
  accepte: { bg: '#DCFCE7', color: '#166534', label: 'Accepté' },
  vip_envoye: { bg: '#EDE9FE', color: '#7C3AED', label: 'VIP envoyé' },
  refuse: { bg: '#FEE2E2', color: '#991B1B', label: 'Refusé' },
  expire: { bg: '#F3F4F6', color: '#6B7280', label: 'Expiré' },
};

export default function GestionDevisPartner({ partnerCode }: { partnerCode: string }) {
  const { showToast } = useToast();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editedPrices, setEditedPrices] = useState<Record<string, number[]>>({});

  const loadDevis = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quotes'), where('partenaire_code', '==', partnerCode));
      const snap = await getDocs(q);
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Devis))
        .sort((a, b) => (b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0) - (a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0));
      setDevis(list);
    } catch (err) {
      console.error(err);
      showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDevis(); }, [partnerCode]);

  const updatePrixNegocie = (devisId: string, index: number, value: number) => {
    setEditedPrices(prev => {
      const current = [...(prev[devisId] || [])];
      current[index] = value;
      return { ...prev, [devisId]: current };
    });
  };

  const handleSendVIP = async (d: Devis) => {
    const prices = editedPrices[d.id] || [];
    const prixNegocies = d.lignes.map((l, i) => ({
      ref: l.ref,
      prix_negocie: prices[i] !== undefined ? prices[i] : (l.prix_negocie || l.prix_unitaire),
    }));

    try {
      await updateDoc(doc(db, 'quotes', d.id), {
        is_vip: true,
        prix_negocies: prixNegocies,
        statut: 'vip_envoye',
        updatedAt: new Date(),
      });
      showToast(`Devis VIP envoyé à ${d.client_nom || d.client_email} ✅`);
      await loadDevis();
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'envoi', 'error');
    }
  };

  const handlePreviewPDF = async (d: Devis) => {
    try {
      const emSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      const emetteur = emSnap.exists() ? emSnap.data() : undefined;
      const quoteSnap = await getDoc(doc(db, 'quotes', d.id));
      if (!quoteSnap.exists()) return;
      downloadPDF(generateDevis(quoteSnap.data(), emetteur), `${d.numero}.pdf`);
    } catch (err) {
      showToast('Erreur PDF', 'error');
    }
  };

  const filtered = devis.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.numero?.toLowerCase().includes(s) || d.client_nom?.toLowerCase().includes(s) || d.lignes?.[0]?.nom_fr?.toLowerCase().includes(s);
  });

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Gestion des devis</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Gérez les devis de vos clients et négociez les prix VIP.</p>

      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher par numéro, client ou produit..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>
          {search ? 'Aucun devis trouvé.' : 'Aucun devis reçu pour le moment.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(d => {
            const isOpen = expandedId === d.id;
            const prices = editedPrices[d.id] || [];
            const sc = STATUT_COLORS[d.statut] || { bg: '#F3F4F6', color: '#374151', label: d.statut };

            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                {/* Header */}
                <div onClick={() => setExpandedId(isOpen ? null : d.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#1565C0', fontSize: 14 }}>{d.numero}</span>
                      <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{sc.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} · <span style={{ color: '#1E40AF', fontWeight: 600 }}>{d.client_nom || d.client_email}</span> · {d.lignes?.[0]?.nom_fr || 'Produit'}
                    </p>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#1565C0', whiteSpace: 'nowrap' }}>{d.total_ht?.toLocaleString('fr-FR')} €</span>
                  <span style={{ fontSize: 16, color: '#9CA3AF', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : '', display: 'inline-block' }}>▾</span>
                </div>

                {/* Body */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: 20 }}>
                    {/* Products with editable VIP prices */}
                    {d.lignes?.map((l, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid #F9FAFB' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#1565C0' }}>{l.nom_fr}</p>
                          <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                            Réf: {l.ref} · x{l.qte} · <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>{l.prix_unitaire?.toLocaleString('fr-FR')} €</span> (prix public)
                          </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <label style={{ fontSize: 10, color: '#7C3AED', fontWeight: 600, display: 'block', marginBottom: 4 }}>Prix négocié</label>
                          <input
                            type="number"
                            value={prices[i] !== undefined ? prices[i] : (l.prix_negocie || l.prix_unitaire)}
                            onChange={e => updatePrixNegocie(d.id, i, Number(e.target.value))}
                            style={{
                              width: 100, padding: '6px 10px',
                              border: '2px solid #7C3AED', borderRadius: 8,
                              fontSize: 14, fontWeight: 700, color: '#7C3AED',
                              textAlign: 'center', background: '#EDE9FE', outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                      <button onClick={() => handleSendVIP(d)} style={{
                        flex: 1, padding: '14px 0', border: 'none', borderRadius: 12,
                        background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', color: '#fff',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      }}>
                        📨 Envoyer le devis VIP au client
                      </button>
                      <button onClick={() => handlePreviewPDF(d)} style={{
                        padding: '14px 24px', border: '1px solid #E5E7EB', borderRadius: 12,
                        background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
                      }}>
                        Aperçu PDF
                      </button>
                    </div>

                    {/* Note info */}
                    <div style={{
                      marginTop: 16, background: '#F0FDFA', borderRadius: 12, padding: 14,
                      fontSize: 12, color: '#0D9488', lineHeight: 1.6,
                    }}>
                      💡 Le client recevra le devis VIP par email et dans son espace client. Les prix publics seront barrés, les prix négociés affichés en violet.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
