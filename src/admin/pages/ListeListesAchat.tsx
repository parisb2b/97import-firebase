import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import SearchInput from '../components/atoms/SearchInput';
import LoadingState from '../components/atoms/LoadingState';

type SortColumn = 'numero' | 'date_creation' | 'statut' | 'nb_lignes' | 'total_cny';
type SortDirection = 'asc' | 'desc';
type StatutFilter = 'TOUS' | 'brouillon' | 'envoyee';

interface ListeAchat {
  id: string;
  numero: string;
  date_creation?: any;
  date_envoi?: any;
  statut: 'brouillon' | 'envoyee';
  lignes?: any[];
  total_cny?: number;
  notes?: string;
  [key: string]: any;
}

export default function ListeListesAchat() {
  const [, setLocation] = useLocation();
  const [listes, setListes] = useState<ListeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('TOUS');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<SortColumn>('date_creation');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  useEffect(() => { loadListes(); }, []);

  const loadListes = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'listes_achat'), orderBy('created_at', 'desc')));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ListeAchat));
      setListes(list);
    } catch (err) {
      console.error('Erreur chargement listes achat:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return listes.filter(l => {
      if (statutFilter !== 'TOUS' && l.statut !== statutFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        l.numero?.toLowerCase().includes(term) ||
        l.notes?.toLowerCase().includes(term) ||
        l.lignes?.some((ln: any) =>
          ln.ref?.toLowerCase().includes(term) ||
          ln.nom_fr?.toLowerCase().includes(term)
        )
      );
    });
  }, [listes, statutFilter, searchTerm]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a: any, b: any) => {
      let valA: any = sortCol === 'nb_lignes'
        ? (a.lignes?.length || 0)
        : a[sortCol];
      let valB: any = sortCol === 'nb_lignes'
        ? (b.lignes?.length || 0)
        : b[sortCol];

      if (sortCol === 'date_creation') {
        valA = valA?.toDate ? valA.toDate().getTime() : (valA ? new Date(valA).getTime() || 0 : 0);
        valB = valB?.toDate ? valB.toDate().getTime() : (valB ? new Date(valB).getTime() || 0 : 0);
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

  const STATUTS = [
    { value: 'TOUS' as StatutFilter, label: 'Toutes', color: '#6B7280' },
    { value: 'brouillon' as StatutFilter, label: 'Brouillon', color: '#D97706' },
    { value: 'envoyee' as StatutFilter, label: 'Envoyée', color: '#059669' },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1565C0', margin: 0 }}>
            Listes d'achat
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0 0' }}>
            Préparation des bons de commande fournisseurs chinois
          </p>
        </div>
        <Link href="/admin/listes-achat/nouvelle">
          <button style={{
            padding: '12px 24px', background: '#EA580C',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            + Nouvelle liste
          </button>
        </Link>
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUTS.map(s => (
          <button
            key={s.value}
            onClick={() => setStatutFilter(s.value)}
            style={{
              padding: '8px 16px',
              border: statutFilter === s.value ? `2px solid ${s.color}` : '1px solid #E5E7EB',
              background: statutFilter === s.value ? `${s.color}15` : '#fff',
              color: statutFilter === s.value ? s.color : '#6B7280',
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {s.label} {statutFilter === s.value && `(${filtered.length})`}
          </button>
        ))}
      </div>

      {/* V46 Checkpoint F — SearchInput avec loupe */}
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Rechercher par numéro, réf produit, nom..."
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <LoadingState message="Chargement des listes d'achat…" />
      ) : sorted.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', color: '#9CA3AF',
          background: '#F9FAFB', borderRadius: 16, border: '1px dashed #E5E7EB'
        }}>
          {listes.length === 0
            ? <>Aucune liste créée.<br /><Link href="/admin/listes-achat/nouvelle" style={{ color: '#EA580C', fontWeight: 600 }}>Créer la première</Link></>
            : 'Aucune liste ne correspond aux filtres'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle(() => toggleSort('numero'))}>N° Liste {sortIcon('numero')}</th>
                <th style={thStyle(() => toggleSort('date_creation'))}>Date création {sortIcon('date_creation')}</th>
                <th style={thStyle(() => toggleSort('nb_lignes'))}>Nb produits {sortIcon('nb_lignes')}</th>
                <th style={thStyle(() => toggleSort('total_cny'))}>Total ¥ {sortIcon('total_cny')}</th>
                <th style={thStyle(() => toggleSort('statut'))}>Statut {sortIcon('statut')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((l) => {
                const dateCreation = l.date_creation?.toDate
                  ? l.date_creation.toDate().toLocaleDateString('fr-FR')
                  : (l.date_creation ? new Date(l.date_creation).toLocaleDateString('fr-FR') : '—');
                const statutInfo = STATUTS.find(s => s.value === l.statut) || STATUTS[1];
                const nbLignes = Array.isArray(l.lignes) ? l.lignes.length : 0;

                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                    onClick={() => setLocation(`/admin/listes-achat/${l.id}`)}>
                    <td style={tdStyle}>
                      <strong style={{ color: '#1565C0' }}>{l.numero}</strong>
                    </td>
                    <td style={tdStyle}>{dateCreation}</td>
                    <td style={tdStyle}>
                      <span style={{
                        background: '#DBEAFE', color: '#1E3A8A',
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {nbLignes}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ color: '#DC2626' }}>¥{(l.total_cny || 0).toLocaleString('fr-FR')}</strong>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: `${statutInfo.color}15`,
                        color: statutInfo.color,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {statutInfo.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <Link href={`/admin/listes-achat/${l.id}`}>
                        <button style={btnIconStyle} onClick={e => e.stopPropagation()} title="Ouvrir">
                          →
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = (onClick?: () => void): React.CSSProperties => ({
  padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 12,
  textTransform: 'uppercase', cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
});
const tdStyle: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' };
const btnIconStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%', border: '1px solid #E5E7EB',
  background: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
  color: '#EA580C',
};
