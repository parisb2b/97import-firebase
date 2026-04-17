import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type SortColumn = 'numero' | 'type' | 'destination' | 'date_depart_est' | 'statut';
type SortDirection = 'asc' | 'desc';
type StatutFilter = 'TOUS' | 'preparation' | 'en_chargement' | 'en_mer' | 'arrive' | 'livre';

interface Conteneur {
  id: string;
  numero: string;
  type: string;
  destination: string;
  date_depart_est?: any;
  date_arrivee_est?: any;
  statut: string;
  port_chargement?: string;
  port_destination?: string;
  devis_lies?: string[];
  num_physique?: string;
  [key: string]: any;
}

export default function ListeConteneurs() {
  const [, setLocation] = useLocation();
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('TOUS');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<SortColumn>('date_depart_est');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  useEffect(() => { loadConteneurs(); }, []);

  const loadConteneurs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'conteneurs'), orderBy('created_at', 'desc')));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conteneur));
      setConteneurs(list);
    } catch (err) {
      console.error('Erreur chargement conteneurs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage
  const filtered = useMemo(() => {
    return conteneurs.filter(c => {
      if (statutFilter !== 'TOUS' && c.statut !== statutFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.numero?.toLowerCase().includes(term) ||
        c.destination?.toLowerCase().includes(term) ||
        c.type?.toLowerCase().includes(term) ||
        c.num_physique?.toLowerCase().includes(term)
      );
    });
  }, [conteneurs, statutFilter, searchTerm]);

  // Tri
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a: any, b: any) => {
      let valA: any = a[sortCol];
      let valB: any = b[sortCol];

      // Dates : convertir en timestamp numérique
      if (sortCol === 'date_depart_est') {
        valA = valA?.toDate ? valA.toDate().getTime() : (valA ? new Date(valA).getTime() || 0 : 0);
        valB = valB?.toDate ? valB.toDate().getTime() : (valB ? new Date(valB).getTime() || 0 : 0);
      }

      // Strings : lowercase pour tri alpha cohérent
      else if (typeof valA === 'string' || typeof valB === 'string') {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      // Fallback : valeurs undefined mises à la fin
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

  const STATUTS: { value: StatutFilter, label: string, color: string }[] = [
    { value: 'TOUS', label: 'Tous', color: '#6B7280' },
    { value: 'preparation', label: 'Préparation', color: '#1565C0' },
    { value: 'en_chargement', label: 'Chargement', color: '#D97706' },
    { value: 'en_mer', label: 'En mer', color: '#2563EB' },
    { value: 'arrive', label: 'Arrivé', color: '#059669' },
    { value: 'livre', label: 'Livré', color: '#065F46' },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E3A5F', margin: 0 }}>
            Conteneurs
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0 0' }}>
            Gestion des conteneurs d'expédition
          </p>
        </div>
        <Link href="/admin/conteneurs/nouveau">
          <button style={{
            padding: '12px 24px',
            background: '#EA580C',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            + Nouveau conteneur
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
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {s.label} {statutFilter === s.value && `(${filtered.length})`}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher par numéro, destination, type, N° physique..."
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
          padding: 60, textAlign: 'center', color: '#9CA3AF',
          background: '#F9FAFB', borderRadius: 16, border: '1px dashed #E5E7EB'
        }}>
          {conteneurs.length === 0
            ? <>Aucun conteneur créé.<br/><Link href="/admin/conteneurs/nouveau" style={{ color: '#EA580C', fontWeight: 600 }}>Créer le premier</Link></>
            : 'Aucun conteneur ne correspond aux filtres'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle(() => toggleSort('numero'))}>N° Conteneur {sortIcon('numero')}</th>
                <th style={thStyle(() => toggleSort('type'))}>Type {sortIcon('type')}</th>
                <th style={thStyle(() => toggleSort('destination'))}>Destination {sortIcon('destination')}</th>
                <th style={thStyle(() => toggleSort('date_depart_est'))}>Départ estimé {sortIcon('date_depart_est')}</th>
                <th style={thStyle(() => toggleSort('statut'))}>Statut {sortIcon('statut')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const dateDepart = c.date_depart_est?.toDate
                  ? c.date_depart_est.toDate().toLocaleDateString('fr-FR')
                  : (c.date_depart_est ? new Date(c.date_depart_est).toLocaleDateString('fr-FR') : '—');
                const statutInfo = STATUTS.find(s => s.value === c.statut) || STATUTS[1];
                const nbDevis = Array.isArray(c.devis_lies) ? c.devis_lies.length : 0;

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                      onClick={() => setLocation(`/admin/conteneurs/${c.id}`)}>
                    <td style={tdStyle}>
                      <strong style={{ color: '#1E3A5F' }}>{c.numero}</strong>
                      {nbDevis > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#6B7280' }}>
                          ({nbDevis} devis)
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: '#DBEAFE', color: '#1E3A8A',
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {c.type || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>{destinationLabel(c.destination)}</td>
                    <td style={tdStyle}>{dateDepart}</td>
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
                      <Link href={`/admin/conteneurs/${c.id}`}>
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

function destinationLabel(code: string): string {
  const map: Record<string, string> = {
    MQ: '🇲🇶 Martinique',
    GP: '🇬🇵 Guadeloupe',
    GF: '🇬🇫 Guyane',
    RE: '🇷🇪 Réunion',
    FR: '🇫🇷 France Métro.',
  };
  return map[code] || code || '—';
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
