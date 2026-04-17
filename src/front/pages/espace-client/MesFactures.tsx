import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';
import PopupAcompte from './PopupAcompte';
import { peutVerserAcompte } from '../../../lib/devisHelpers';

interface Devis {
  id: string;
  numero: string;
  statut: string;
  statut_paiement?: string;
  total_ht: number;
  total_encaisse?: number;
  acomptes?: any[];
  client_nom: string;
  lignes?: any[];
}

interface FactureRow {
  numero: string;
  type: string;
  typeLabel: string;
  date: string;
  montant: number;
  url: string;
  devisId: string;
  produit: string;
  devis: Devis;
}

export default function MesFactures({ userId, profile }: { userId: string; profile?: any }) {
  const { showToast } = useToast();
  const [factures, setFactures] = useState<FactureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [popupDevis, setPopupDevis] = useState<Devis | null>(null);

  const loadFactures = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
      const snap = await getDocs(q);
      const allFactures: FactureRow[] = [];

      snap.docs.forEach(d => {
        const data = d.data();
        const devis: Devis = {
          id: d.id,
          numero: data.numero || '',
          statut: data.statut || 'nouveau',
          statut_paiement: data.statut_paiement,
          total_ht: data.total_ht || 0,
          total_encaisse: data.total_encaisse || 0,
          acomptes: data.acomptes || [],
          client_nom: data.client_nom || '',
          lignes: data.lignes || [],
        };
        const n = data.numero?.replace(/^DVS-/, '') || '';
        const date = data.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—';
        const produit = data.lignes?.[0]?.nom_fr || 'Produit';

        if (data.facture_acompte_url) {
          allFactures.push({ numero: `FA-${n}`, type: 'FA', typeLabel: 'Facture acompte', date, montant: (data.acomptes || []).filter((a: any) => a.statut === 'encaisse').reduce((s: number, a: any) => s + a.montant, 0), url: data.facture_acompte_url, devisId: d.id, produit, devis });
        }
        if (data.facture_finale_url) {
          allFactures.push({ numero: `FF-${n}`, type: 'FF', typeLabel: 'Facture finale', date, montant: data.total_ht || 0, url: data.facture_finale_url, devisId: d.id, produit, devis });
        }
        if (data.facture_logistique_url) {
          allFactures.push({ numero: `FL-${n}`, type: 'FL', typeLabel: 'Facture logistique', date, montant: data.frais_logistique || 0, url: data.facture_logistique_url, devisId: d.id, produit, devis });
        }
      });

      setFactures(allFactures);
    } catch (err) {
      console.error(err);
      showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactures();
  }, [userId]);

  const filtered = factures.filter(f => {
    if (!search) return true;
    const s = search.toLowerCase();
    return f.numero.toLowerCase().includes(s) || f.typeLabel.toLowerCase().includes(s) || f.produit.toLowerCase().includes(s);
  });

  const typeColor: Record<string, { bg: string; color: string }> = {
    FA: { bg: '#FEF3C7', color: '#92400E' },
    FF: { bg: '#DCFCE7', color: '#166534' },
    FL: { bg: '#DBEAFE', color: '#1E40AF' },
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes factures</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Toutes vos factures : acompte, finale et logistique.</p>

      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher une facture..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>
          {search ? 'Aucune facture trouvée.' : 'Aucune facture disponible pour le moment.'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 150px 120px 80px', padding: '12px 16px', borderBottom: '2px solid #E5E7EB', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>
            <span>N° Facture</span><span>Type</span><span>Date</span><span>Montant</span><span>Actions</span>
          </div>

          {filtered.map((f) => {
            const isOpen = expandedId === f.numero;
            const tc = typeColor[f.type] || typeColor.FA;
            return (
              <div key={f.numero}>
                <div onClick={() => setExpandedId(isOpen ? null : f.numero)}
                  style={{ display: 'grid', gridTemplateColumns: '130px 1fr 150px 120px 80px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 13, alignItems: 'center', background: isOpen ? '#F9FAFB' : '#fff' }}>
                  <span style={{ fontWeight: 700, color: '#1565C0' }}>{f.numero}</span>
                  <span style={{ background: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, display: 'inline-block', width: 'fit-content' }}>{f.typeLabel}</span>
                  <span style={{ color: '#6B7280' }}>{f.date}</span>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{f.montant?.toLocaleString('fr-FR')} €</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={e => { e.stopPropagation(); window.open(f.url, '_blank'); }}
                      style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>👁</button>
                    <button onClick={e => { e.stopPropagation(); const a = document.createElement('a'); a.href = f.url; a.download = f.numero + '.pdf'; a.click(); }}
                      style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>📥</button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '16px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: 12 }}>
                    <p style={{ marginBottom: 6 }}><strong>Émetteur :</strong> LUXENT LIMITED</p>
                    <p style={{ marginBottom: 6 }}><strong>Produits :</strong> {f.produit}</p>
                    <p style={{ marginBottom: 10 }}><strong>Montant :</strong> {f.montant?.toLocaleString('fr-FR')} €</p>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button onClick={() => { const a = document.createElement('a'); a.href = f.url; a.download = f.numero + '.pdf'; a.click(); }}
                        style={{ padding: '8px 16px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        📥 Télécharger PDF
                      </button>
                      {peutVerserAcompte(f.devis) && (
                        <button onClick={() => setPopupDevis(f.devis)}
                          style={{ padding: '8px 16px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          💶 Verser un acompte
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {popupDevis && (
        <PopupAcompte
          devisId={popupDevis.id}
          devisNumero={popupDevis.numero}
          clientNom={popupDevis.client_nom || `${profile?.firstName || ''} ${profile?.lastName || ''}`}
          onClose={() => setPopupDevis(null)}
          onAcompteAdded={loadFactures}
        />
      )}
    </div>
  );
}
