import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import PopupAcompte from './PopupAcompte';
import { peutVerserAcompte } from '../../../lib/devisHelpers';

interface MesFacturesProps {
  userId: string;
  profile: any;
}

type SortColumn = 'devis' | 'numero' | 'type' | 'date' | 'montant';
type SortDirection = 'asc' | 'desc';

interface FactureLigne {
  devis_id: string;
  devis_total: number;
  devis_ref: any;
  numero: string;         // FA/FF/FL-YYMMNNN
  type: 'FA' | 'FF' | 'FL';
  type_label: string;
  date: string;
  montant: number;
  url: string;
}

export default function MesFactures({ userId, profile }: MesFacturesProps) {
  const [devisList, setDevisList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FA' | 'FF' | 'FL'>('ALL');

  const [modalFacture, setModalFacture] = useState<FactureLigne | null>(null);
  const [popupDevis, setPopupDevis] = useState<any>(null);

  useEffect(() => { loadDevis(); }, [userId]);

  const loadDevis = async () => {
    if (!userId) return;
    setLoading(true);
    const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ numero: d.id, ...d.data() }));
    setDevisList(all);
    setLoading(false);
  };

  // Aplatir en factures
  const factures: FactureLigne[] = [];
  for (const devis of devisList) {
    // FA (peut y en avoir plusieurs)
    const fas = Array.isArray(devis.factures_acompte_urls) ? devis.factures_acompte_urls : [];
    fas.forEach((f: any) => {
      // Trouver le montant dans les acomptes
      const acompte = (devis.acomptes || []).find((a: any) => a.ref_fa === f.ref_fa);
      factures.push({
        devis_id: devis.numero,
        devis_total: devis.total_ht || 0,
        devis_ref: devis,
        numero: f.ref_fa,
        type: 'FA',
        type_label: "Facture d'acompte",
        date: f.date || acompte?.date_encaissement || '',
        montant: acompte?.montant || 0,
        url: f.url,
      });
    });

    // FF
    if (devis.facture_finale_url) {
      factures.push({
        devis_id: devis.numero,
        devis_total: devis.total_ht || 0,
        devis_ref: devis,
        numero: `FF-${devis.numero.slice(4)}`,
        type: 'FF',
        type_label: 'Facture finale',
        date: devis.facture_finale_date || '',
        montant: devis.total_ht || 0,
        url: devis.facture_finale_url,
      });
    }

    // FL
    if (devis.facture_logistique_url) {
      factures.push({
        devis_id: devis.numero,
        devis_total: devis.total_ht || 0,
        devis_ref: devis,
        numero: `FL-${devis.numero.slice(4)}`,
        type: 'FL',
        type_label: 'Facture logistique',
        date: devis.facture_logistique_date || '',
        montant: devis.frais_logistique || 0,
        url: devis.facture_logistique_url,
      });
    }
  }

  // Filtre type + recherche
  const filtered = useMemo(() => {
    return factures.filter(f => {
      if (filterType !== 'ALL' && f.type !== filterType) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return f.devis_id.toLowerCase().includes(term) || f.numero.toLowerCase().includes(term);
    });
  }, [factures, filterType, searchTerm]);

  // Tri
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a: any, b: any) => {
      let valA = a[sortCol === 'devis' ? 'devis_id' : sortCol];
      let valB = b[sortCol === 'devis' ? 'devis_id' : sortCol];

      if (sortCol === 'date') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
      else if (typeof valA === 'string' || typeof valB === 'string') {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA === undefined || valA === null) valA = sortDir === 'asc' ? Infinity : -Infinity;
      if (valB === undefined || valB === null) valB = sortDir === 'asc' ? Infinity : -Infinity;

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortCol, sortDir]);

  const toggleSort = (col: SortColumn) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortIcon = (col: SortColumn) => sortCol !== col ? '⇅' : (sortDir === 'asc' ? '▲' : '▼');

  return (
    <div style={{ padding: '20px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1565C0', marginBottom: 8 }}>
        Mes factures
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
        Téléchargez vos factures d'acompte, finales et logistiques.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, minWidth: 240 }}
        />
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: 4, borderRadius: 12 }}>
          {(['ALL', 'FA', 'FF', 'FL'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: filterType === t ? '#1565C0' : 'transparent',
                color: filterType === t ? '#fff' : '#6B7280',
                cursor: 'pointer',
              }}>
              {t === 'ALL' ? 'Tous' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>
      ) : sorted.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF',
          background: '#F9FAFB', borderRadius: 16, border: '1px dashed #E5E7EB' }}>
          Aucune facture disponible
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle(() => toggleSort('numero'))}>N° Facture {sortIcon('numero')}</th>
                <th style={thStyle(() => toggleSort('type'))}>Type {sortIcon('type')}</th>
                <th style={thStyle(() => toggleSort('devis'))}>Devis {sortIcon('devis')}</th>
                <th style={thStyle(() => toggleSort('date'))}>Date {sortIcon('date')}</th>
                <th style={thStyle(() => toggleSort('montant'), 'right')}>Montant {sortIcon('montant')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6B7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, idx) => {
                const dateStr = f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '—';
                const typeBadge = {
                  FA: { bg: '#FEE2E2', color: '#991B1B' },
                  FF: { bg: '#D1FAE5', color: '#065F46' },
                  FL: { bg: '#DBEAFE', color: '#1E3A8A' },
                }[f.type];
                const canVerser = peutVerserAcompte(f.devis_ref);

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}><strong>{f.numero}</strong></td>
                    <td style={tdStyle}>
                      <span style={{
                        background: typeBadge.bg, color: typeBadge.color,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>{f.type_label}</span>
                    </td>
                    <td style={tdStyle}><span style={{ color: '#1565C0' }}>{f.devis_id}</span></td>
                    <td style={tdStyle}>{dateStr}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {f.montant.toLocaleString('fr-FR')} €
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setModalFacture(f)} title="Visualiser" style={btnIconStyle}>👁</button>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" title="Ouvrir dans un nouvel onglet" style={{ ...btnIconStyle, textDecoration: 'none', color: '#374151' }}>⬇️</a>
                        {canVerser && (
                          <button onClick={() => setPopupDevis(f.devis_ref)} title="Verser un autre acompte"
                            style={{ ...btnIconStyle, background: '#059669', color: '#fff' }}>💶</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalFacture && <ModalFacture f={modalFacture} onClose={() => setModalFacture(null)} />}
      {popupDevis && (
        <PopupAcompte
          devisId={popupDevis.id}
          devisNumero={popupDevis.numero}
          clientNom={popupDevis.client_nom || `${profile?.firstName || ''} ${profile?.lastName || ''}`}
          onClose={() => setPopupDevis(null)}
          onAcompteAdded={() => { setPopupDevis(null); loadDevis(); }} />
      )}
    </div>
  );
}

function ModalFacture({ f, onClose }: { f: FactureLigne, onClose: () => void }) {
  const dateStr = f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '—';
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 480, width: '90%' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1565C0' }}>
          Détail de la facture
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
          <DetailRow label="Numéro facture" value={<strong>{f.numero}</strong>} />
          <DetailRow label="Type" value={f.type_label} />
          <DetailRow label="Devis concerné" value={
            <a href={`/espace-client/devis/${f.devis_id}`} style={{ color: '#1565C0', fontWeight: 600 }}>
              {f.devis_id} →
            </a>
          } />
          <DetailRow label="Date" value={dateStr} />
          <DetailRow label="Montant" value={
            <strong style={{ color: '#1565C0', fontSize: 18 }}>{f.montant.toLocaleString('fr-FR')} €</strong>
          } />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <a href={f.url} target="_blank" rel="noopener"
             style={{ flex: 1, padding: 12, background: '#1565C0', color: '#fff', textAlign: 'center',
                      borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Ouvrir le PDF
          </a>
          <button onClick={onClose} style={{
            padding: 12, background: '#F3F4F6', color: '#374151',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const thStyle = (onClick?: () => void, align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  padding: '12px 16px', textAlign: align, fontWeight: 600, color: '#6B7280', fontSize: 12,
  textTransform: 'uppercase', cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
});
const tdStyle: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' };
const btnIconStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%', border: '1px solid #E5E7EB',
  background: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
};
