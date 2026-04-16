import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';
import PopupAcompte from './PopupAcompte';

interface Acompte {
  montant: number;
  date: string;
  type_compte: string;
  statut: string;
  iban_utilise?: string;
}

interface Devis {
  id: string;
  numero: string;
  total_ht: number;
  lignes: { nom_fr: string; ref: string; qte: number; prix_unitaire: number; total: number }[];
  acomptes: Acompte[];
  client_nom: string;
  createdAt: any;
}

interface VirementRow {
  acompte: Acompte;
  devis: Devis;
  index: number;
}

export default function MesVirements({ userId, profile }: { userId: string; profile: any }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<VirementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [popupDevis, setPopupDevis] = useState<Devis | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
      const snap = await getDocs(q);
      const allRows: VirementRow[] = [];
      snap.docs.forEach(d => {
        const devis = { id: d.id, ...d.data() } as Devis;
        (devis.acomptes || []).forEach((a, i) => {
          allRows.push({ acompte: a, devis, index: i });
        });
      });
      allRows.sort((a, b) => new Date(b.acompte.date).getTime() - new Date(a.acompte.date).getTime());
      setRows(allRows);
    } catch (err) {
      console.error(err);
      showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  const totalEncaisse = (d: Devis) => (d.acomptes || []).filter(a => a.statut === 'encaisse').reduce((s, a) => s + a.montant, 0);
  const totalDeclare = (d: Devis) => (d.acomptes || []).filter(a => a.statut === 'declare').reduce((s, a) => s + a.montant, 0);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.devis.numero?.toLowerCase().includes(s) || r.acompte.statut?.toLowerCase().includes(s);
  });

  const statutBadge = (statut: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      declare: { bg: '#FEF3C7', color: '#92400E', label: 'Déclaré' },
      encaisse: { bg: '#DCFCE7', color: '#166534', label: 'Encaissé' },
      rejete: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejeté' },
    };
    const s = map[statut] || map.declare;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{s.label}</span>;
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes virements</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Historique de tous vos virements et acomptes.</p>

      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>Aucun virement enregistré.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 120px 100px 90px 90px 1fr', padding: '12px 16px', borderBottom: '2px solid #E5E7EB', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>
            <span>Date</span><span>Référence</span><span>Montant</span><span>Type</span><span>Statut</span><span>Devis/Cmd</span>
          </div>
          {filtered.map((r) => {
            const key = `${r.devis.id}_${r.index}`;
            const isOpen = expandedKey === key;
            const encaisse = totalEncaisse(r.devis);
            const declare = totalDeclare(r.devis);
            const solde = r.devis.total_ht - encaisse - declare;

            return (
              <div key={key}>
                <div onClick={() => setExpandedKey(isOpen ? null : key)}
                  style={{ display: 'grid', gridTemplateColumns: '100px 120px 100px 90px 90px 1fr', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 13, alignItems: 'center', background: isOpen ? '#F9FAFB' : '#fff' }}>
                  <span style={{ color: '#6B7280' }}>{new Date(r.acompte.date).toLocaleDateString('fr-FR')}</span>
                  <span style={{ fontWeight: 600, color: '#1565C0' }}>{r.devis.numero}</span>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{r.acompte.montant?.toLocaleString('fr-FR')} €</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{r.acompte.type_compte === 'pro' ? 'Pro' : 'Perso'}</span>
                  {statutBadge(r.acompte.statut)}
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>CMD-{r.devis.numero?.replace(/^DVS-/, '')}</span>
                </div>

                {isOpen && (
                  <div style={{ padding: '16px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>
                      <strong>Produit :</strong> {r.devis.lignes?.[0]?.nom_fr || '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#166534' }}>Encaissé</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>{encaisse.toLocaleString('fr-FR')} €</p>
                      </div>
                      <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#92400E' }}>Déclaré</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#92400E' }}>{declare.toLocaleString('fr-FR')} €</p>
                      </div>
                      <div style={{ flex: 1, background: '#DBEAFE', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#1E40AF' }}>Solde</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF' }}>{Math.max(0, solde).toLocaleString('fr-FR')} €</p>
                      </div>
                    </div>
                    {/* Historique acomptes de ce devis */}
                    <div style={{ fontSize: 12, marginBottom: 10 }}>
                      {(r.devis.acomptes || []).map((a, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                          <span style={{ color: '#6B7280' }}>{new Date(a.date).toLocaleDateString('fr-FR')}</span>
                          <span style={{ fontWeight: 600 }}>{a.montant?.toLocaleString('fr-FR')} €</span>
                          {statutBadge(a.statut)}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setPopupDevis(r.devis)} style={{
                      padding: '8px 16px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      + Verser un autre acompte
                    </button>
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
          onAcompteAdded={loadData}
        />
      )}
    </div>
  );
}
