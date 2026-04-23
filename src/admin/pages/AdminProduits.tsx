import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { calculerCompletude, CATEGORIES, StatutCompletude, manqueCodeHs, CHAMPS_ESSENTIEL } from '../../lib/productHelpers';
import { loadFilters, saveFilters, resetFilters, hasActiveFilters } from '../../lib/filterPersistence';

interface Product {
  id: string;
  reference: string;
  categorie?: string;
  nom_fr?: string;
  prix_achat?: number;
  actif?: boolean;
  est_kit?: boolean;
  composition_kit?: any;
  fournisseur?: string;
  [key: string]: any;
}

type SortColumn = 'reference' | 'nom_fr' | 'categorie' | 'prix_achat' | 'completude_statut';
type SortDir = 'asc' | 'desc';

const STATUT_BADGE: Record<StatutCompletude, { label: string; color: string; bg: string; bar: string }> = {
  complet:     { label: '● Complet',    color: '#065F46', bg: '#D1FAE5', bar: '#10B981' },
  pret_site:   { label: '● Prêt site',  color: '#1E40AF', bg: '#DBEAFE', bar: '#3B82F6' },
  a_enrichir:  { label: '● À enrichir', color: '#92400E', bg: '#FEF3C7', bar: '#F59E0B' },
  bloquant:    { label: '● Bloquant',   color: '#991B1B', bg: '#FEE2E2', bar: '#EF4444' },
};

export default function AdminProduits() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les filtres sauvegardés depuis localStorage
  const savedFilters = loadFilters();
  const [searchTerm, setSearchTerm] = useState(savedFilters.recherche || '');
  const [categoryFilter, setCategoryFilter] = useState(savedFilters.categorie || 'TOUS');
  const [statutFilter, setStatutFilter] = useState(savedFilters.statut || 'TOUS');
  const [actifFilter, setActifFilter] = useState(savedFilters.actif || 'TOUS');

  const [sortCol, setSortCol] = useState<SortColumn>('reference');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => { loadProducts(); }, []);

  // Sauvegarder les filtres dans localStorage à chaque changement
  useEffect(() => {
    saveFilters({
      recherche: searchTerm,
      categorie: categoryFilter,
      statut: statutFilter,
      actif: actifFilter,
    });
  }, [searchTerm, categoryFilter, statutFilter, actifFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'products'), orderBy('reference', 'asc')));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const productsAvecCompletude = useMemo(() =>
    products.map(p => ({ ...p, _completude: calculerCompletude(p) })), [products]);

  const stats = useMemo(() => {
    const s = { total: productsAvecCompletude.length, complet: 0, pret_site: 0, a_enrichir: 0, bloquant: 0, code_hs_manquant: 0 };
    for (const p of productsAvecCompletude) {
      s[p._completude.statut]++;
      if (manqueCodeHs(p) && p.actif) s.code_hs_manquant++;
    }
    return s;
  }, [productsAvecCompletude]);

  const filtered = useMemo(() => {
    return productsAvecCompletude.filter(p => {
      if (categoryFilter !== 'TOUS' && p.categorie !== categoryFilter) return false;
      if (statutFilter !== 'TOUS' && p._completude.statut !== statutFilter) return false;
      if (actifFilter === 'ACTIF' && p.actif !== true) return false;
      if (actifFilter === 'MASQUE' && p.actif === true) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return p.reference?.toLowerCase().includes(term) ||
        p.nom_fr?.toLowerCase().includes(term) ||
        p.fournisseur?.toLowerCase().includes(term);
    });
  }, [productsAvecCompletude, categoryFilter, statutFilter, actifFilter, searchTerm]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a: any, b: any) => {
      let valA, valB;
      if (sortCol === 'completude_statut') {
        const order: any = { complet: 0, pret_site: 1, a_enrichir: 2, bloquant: 3 };
        valA = order[a._completude.statut]; valB = order[b._completude.statut];
      } else { valA = a[sortCol]; valB = b[sortCol]; }
      if (valA === undefined) valA = sortDir === 'asc' ? Infinity : -Infinity;
      if (valB === undefined) valB = sortDir === 'asc' ? Infinity : -Infinity;
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = (valB||'').toString().toLowerCase(); }
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
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E3A5F', margin: 0 }}>Produits</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>
            Gestion du catalogue — {stats.total} produit{stats.total > 1 ? 's' : ''} au total
          </p>
        </div>
        <Link href="/admin/produits/nouveau">
          <button style={{ padding: '10px 20px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Nouveau produit
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: stats.code_hs_manquant > 0 ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total" value={stats.total} bg="#fff" color="#111827" border="#E5E7EB" />
        <StatCard label="Complets" value={stats.complet} bg="#D1FAE5" color="#065F46" border="#6EE7B7" />
        <StatCard label="Prêts site" value={stats.pret_site} bg="#DBEAFE" color="#1E40AF" border="#93C5FD" />
        <StatCard label="À enrichir" value={stats.a_enrichir} bg="#FEF3C7" color="#92400E" border="#FCD34D" />
        <StatCard label="Bloquants" value={stats.bloquant} bg="#FEE2E2" color="#991B1B" border="#FCA5A5" />
        {stats.code_hs_manquant > 0 && (
          <StatCard label="⚠️ Code HS manquant" value={stats.code_hs_manquant} bg="#FEF3C7" color="#92400E" border="#FCD34D" />
        )}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par référence, nom, fournisseur..."
          style={{ flex: 1, minWidth: 250, padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14 }} />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="TOUS">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} style={selectStyle}>
          <option value="TOUS">Toutes complétudes</option>
          <option value="complet">● Complets</option>
          <option value="pret_site">● Prêts site</option>
          <option value="a_enrichir">● À enrichir</option>
          <option value="bloquant">● Bloquants</option>
        </select>
        <select value={actifFilter} onChange={e => setActifFilter(e.target.value)} style={selectStyle}>
          <option value="TOUS">Tous statuts</option>
          <option value="ACTIF">Actifs sur le site</option>
          <option value="MASQUE">Masqués</option>
        </select>

        {/* Bouton Réinitialiser - visible uniquement si au moins un filtre actif */}
        {hasActiveFilters({ recherche: searchTerm, categorie: categoryFilter, statut: statutFilter, actif: actifFilter }) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('TOUS');
              setStatutFilter('TOUS');
              setActifFilter('TOUS');
              resetFilters();
            }}
            style={{
              padding: '6px 12px',
              background: '#E5E7EB',
              color: '#374151',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
            title="Effacer tous les filtres"
          >
            🔄 Réinitialiser filtres
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>
      ) : sorted.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', background: '#F9FAFB', borderRadius: 16, border: '1px dashed #E5E7EB' }}>
          Aucun produit ne correspond aux filtres
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle} onClick={() => toggleSort('reference')}>Référence {sortIcon('reference')}</th>
                <th style={thStyle} onClick={() => toggleSort('nom_fr')}>Nom {sortIcon('nom_fr')}</th>
                <th style={thStyle} onClick={() => toggleSort('categorie')}>Catégorie {sortIcon('categorie')}</th>
                <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('prix_achat')}>Prix achat {sortIcon('prix_achat')}</th>
                <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => toggleSort('completude_statut')}>Complétude {sortIcon('completude_statut')}</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Site</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const badge = STATUT_BADGE[p._completude.statut];
                const catLabel = CATEGORIES.find(c => c.id === p.categorie)?.label || p.categorie || '—';
                const percent = Math.round((p._completude.essentiel / CHAMPS_ESSENTIEL.length) * 100);
                return (
                  <tr key={p.id}
                    onClick={() => setLocation(`/admin/produits/${encodeURIComponent(p.reference)}`)}
                    style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}><code style={refCodeStyle}>{p.reference}</code></td>
                    <td style={tdStyle}>
                      <strong>{p.nom_fr || '— Sans nom —'}</strong>
                      {p.est_kit && Array.isArray(p.composition_kit) && (
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          🔧 Kit composé de {p.composition_kit.length} produit{p.composition_kit.length > 1 ? 's' : ''}
                        </div>
                      )}
                      {manqueCodeHs(p) && p.actif && (
                        <div style={{
                          display: 'inline-block',
                          fontSize: 10,
                          color: '#92400E',
                          background: '#FEF3C7',
                          border: '1px solid #FCD34D',
                          padding: '2px 8px',
                          borderRadius: 10,
                          marginTop: 4,
                          fontWeight: 600,
                        }}>
                          ⚠️ Code HS manquant
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>{catLabel}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {typeof p.prix_achat === 'number' && p.prix_achat > 0
                        ? p.prix_achat.toLocaleString('fr-FR') + ' €'
                        : <span style={{ color: '#9CA3AF' }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: badge.bar }}></div>
                        </div>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {badge.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {p.actif ? <span style={{ color: '#059669' }}>✓ Actif</span> : <span style={{ color: '#9CA3AF' }}>— Masqué</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#6B7280' }}>→</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
        {sorted.length} / {stats.total} produit{sorted.length > 1 ? 's' : ''} affiché{sorted.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}

function StatCard({ label, value, bg, color, border }: any) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: bg, border: `1px solid ${border}` }}>
      <div style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = { minWidth: 180, padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, background: '#fff', fontFamily: 'inherit', color: '#111827' };
const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, cursor: 'pointer', userSelect: 'none' };
const tdStyle: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' };
const refCodeStyle: React.CSSProperties = { fontFamily: 'SF Mono, Monaco, Menlo, monospace', fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#1E3A5F' };
