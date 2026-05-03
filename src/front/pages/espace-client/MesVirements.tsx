import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import PopupAcompte from './PopupAcompte';
import { peutVerserAcompte } from '../../../lib/devisHelpers';

interface MesVirementsProps {
  userId: string;
  profile: any;
}

type SortColumn = 'devis' | 'date' | 'montant' | 'type_compte' | 'statut';
type SortDirection = 'asc' | 'desc';

export default function MesVirements({ userId, profile }: MesVirementsProps) {
  const [devisList, setDevisList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const [modalVirement, setModalVirement] = useState<any>(null);
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

  // Aplatir en virements
  const virements: any[] = [];
  for (const devis of devisList) {
    const acomptes = Array.isArray(devis.acomptes) ? devis.acomptes : [];
    acomptes.forEach((a: any, idx: number) => {
      virements.push({
        devis_id: devis.numero,
        devis_total: devis.total_ht || 0,
        devis_is_vip: devis.is_vip || false,
        devis_statut: devis.statut,
        devis_ref: devis,  // ref complète pour bouton acompte
        date: a.date_reception || a.date,
        date_encaissement: a.date_encaissement || a.date_reception,
        montant: a.montant || 0,
        type_compte: a.type_compte || 'pro',
        iban_utilise: a.iban_utilise,
        statut: a.statut,
        ref_fa: a.ref_fa,
        acompte_index: idx,
      });
    });
  }

  // Filtre recherche
  const filtered = useMemo(() => {
    return virements.filter(v => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        v.devis_id.toLowerCase().includes(term) ||
        v.ref_fa?.toLowerCase().includes(term) ||
        v.statut.toLowerCase().includes(term)
      );
    });
  }, [virements, searchTerm]);

  // Tri
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a: any, b: any) => {
      let valA: any = a[sortCol === 'devis' ? 'devis_id' : sortCol];
      let valB: any = b[sortCol === 'devis' ? 'devis_id' : sortCol];

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
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortIcon = (col: SortColumn) => {
    if (sortCol !== col) return '⇅';
    return sortDir === 'asc' ? '▲' : '▼';
  };

  return (
    <div style={{ padding: '20px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1565C0', marginBottom: 8 }}>
        Mes virements
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
        Suivez l'état de vos acomptes déclarés et encaissés.
      </p>

      <input
        type="text"
        placeholder="Rechercher par numéro de devis, FA ou statut..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          marginBottom: 16,
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          fontSize: 14,
        }}
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>
      ) : sorted.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: '#9CA3AF',
          background: '#F9FAFB', borderRadius: 16, border: '1px dashed #E5E7EB'
        }}>
          Aucun virement pour le moment
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle(() => toggleSort('devis'))}>
                  Devis {sortIcon('devis')}
                </th>
                <th style={thStyle(() => toggleSort('date'))}>
                  Date {sortIcon('date')}
                </th>
                <th style={thStyle(() => toggleSort('montant'), 'right')}>
                  Montant {sortIcon('montant')}
                </th>
                <th style={thStyle(() => toggleSort('type_compte'))}>
                  Compte {sortIcon('type_compte')}
                </th>
                <th style={thStyle(() => toggleSort('statut'))}>
                  Statut {sortIcon('statut')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6B7280' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, idx) => {
                const statutBadge = v.encaisse === true
                  ? { label: 'Encaissé', bg: '#D1FAE5', color: '#065F46' }
                  : { label: 'Déclaré', bg: '#FEF3C7', color: '#92400E' };

                const dateStr = v.date ? new Date(v.date).toLocaleDateString('fr-FR') : '—';
                const canVerser = peutVerserAcompte(v.devis_ref);

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>
                      <strong style={{ color: '#1565C0' }}>{v.devis_id}</strong>
                    </td>
                    <td style={tdStyle}>{dateStr}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {v.montant.toLocaleString('fr-FR')} €
                    </td>
                    <td style={tdStyle}>
                      {v.type_compte === 'perso' ? 'Personnel' : 'Professionnel'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: statutBadge.bg,
                        color: statutBadge.color,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                        {statutBadge.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setModalVirement(v)}
                          title="Visualiser"
                          style={btnIconStyle}
                        >
                          👁
                        </button>
                        {canVerser && (
                          <button
                            onClick={() => setPopupDevis(v.devis_ref)}
                            title="Verser un autre acompte"
                            style={{ ...btnIconStyle, background: '#059669', color: '#fff' }}
                          >
                            💶
                          </button>
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

      {/* Modal visualisation virement */}
      {modalVirement && (
        <ModalVirement v={modalVirement} onClose={() => setModalVirement(null)} />
      )}

      {/* Popup verser acompte */}
      {popupDevis && (
        <PopupAcompte
          devisId={popupDevis.id}
          devisNumero={popupDevis.numero}
          clientNom={popupDevis.client_nom || `${profile?.firstName || ''} ${profile?.lastName || ''}`}
          onClose={() => setPopupDevis(null)}
          onAcompteAdded={() => {
            setPopupDevis(null);
            loadDevis();
          }}
        />
      )}
    </div>
  );
}

// Modal visualisation
function ModalVirement({ v, onClose }: { v: any, onClose: () => void }) {
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('fr-FR') : '—';
  const dateEnc = v.date_encaissement
    ? new Date(v.date_encaissement).toLocaleDateString('fr-FR')
    : null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: 32,
        maxWidth: 480, width: '90%',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1565C0' }}>
          Détail du virement
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
          <DetailRow label="Devis concerné" value={
            <a href={`/espace-client/devis/${v.devis_id}`} style={{ color: '#1565C0', fontWeight: 600 }}>
              {v.devis_id} →
            </a>
          } />
          <DetailRow label="Total du devis" value={`${v.devis_total.toLocaleString('fr-FR')} €`} />
          <DetailRow label="Montant viré" value={
            <strong style={{ color: '#059669', fontSize: 18 }}>{v.montant.toLocaleString('fr-FR')} €</strong>
          } />
          <DetailRow label="Date déclaration" value={dateStr} />
          {dateEnc && <DetailRow label="Date encaissement" value={dateEnc} />}
          <DetailRow label="Type de compte" value={v.type_compte === 'perso' ? 'Personnel (N26)' : 'Professionnel (Banking Circle)'} />
          <DetailRow label="Statut" value={
            <span style={{
              background: v.encaisse === true ? '#D1FAE5' : '#FEF3C7',
              color: v.encaisse === true ? '#065F46' : '#92400E',
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            }}>
              {v.encaisse === true ? 'Encaissé' : 'Déclaré'}
            </span>
          } />
          {v.ref_fa && <DetailRow label="Référence FA" value={v.ref_fa} />}
        </div>

        <button onClick={onClose} style={{
          marginTop: 24, padding: 12, width: '100%',
          background: '#F3F4F6', color: '#374151',
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
        }}>
          Fermer
        </button>
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

// Styles
const thStyle = (onClick?: () => void, align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  padding: '12px 16px',
  textAlign: align,
  fontWeight: 600,
  color: '#6B7280',
  fontSize: 12,
  textTransform: 'uppercase',
  cursor: onClick ? 'pointer' : 'default',
  userSelect: 'none',
});

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};

const btnIconStyle: React.CSSProperties = {
  width: 36, height: 36,
  borderRadius: '50%',
  border: '1px solid #E5E7EB',
  background: '#fff',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
};
