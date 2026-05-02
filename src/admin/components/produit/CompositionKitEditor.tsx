import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { adminDb as db } from '../../../lib/firebase';
import SearchInput from '../atoms/SearchInput';

interface Composant { ref: string; qte_par_kit: number; }
interface Props {
  composition: Composant[];
  onChange: (composition: Composant[]) => void;
}

export default function CompositionKitEditor({ composition, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [composantNames, setComposantNames] = useState<Record<string, string>>({});
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const loadNames = async () => {
      const names: Record<string, string> = {};
      for (const c of composition) {
        try {
          const snap = await getDoc(doc(db, 'products', c.ref));
          if (snap.exists()) names[c.ref] = snap.data().nom_fr || c.ref;
        } catch (_) {}
      }
      setComposantNames(names);
    };
    loadNames();
  }, [composition]);

  const handleSearch = async (term: string) => {
    setSearch(term);
    if (term.length < 2) { setSearchResults([]); return; }
    try {
      const snap = await getDocs(collection(db, 'products'));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const results = all.filter(p =>
        p.reference?.toLowerCase().includes(term.toLowerCase()) ||
        p.nom_fr?.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 10);
      setSearchResults(results);
    } catch (_) {}
  };

  const handleAdd = (product: any) => {
    if (composition.some(c => c.ref === product.reference)) {
      alert('Ce composant est déjà dans la liste');
      return;
    }
    onChange([...composition, { ref: product.reference, qte_par_kit: 1 }]);
    setComposantNames({ ...composantNames, [product.reference]: product.nom_fr });
    setSearch(''); setSearchResults([]); setShowSearch(false);
  };

  const handleRemove = (ref: string) => onChange(composition.filter(c => c.ref !== ref));
  const handleChangeQte = (ref: string, qte: number) =>
    onChange(composition.map(c => c.ref === ref ? { ...c, qte_par_kit: qte } : c));

  return (
    <div>
      {composition.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', background: '#F9FAFB', borderRadius: 10 }}>
          Aucun composant. Cliquez sur "+ Ajouter un composant" ci-dessous.
        </div>
      )}

      {composition.map(c => (
        <div key={c.ref} style={{
          display: 'grid', gridTemplateColumns: '2fr 100px 40px', gap: 10,
          alignItems: 'center', padding: '10px 14px', background: '#F9FAFB',
          borderRadius: 10, marginBottom: 8, border: '1px solid #E5E7EB',
        }}>
          <div>
            <code style={{ background: '#E0E7FF', color: '#3730A3', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontFamily: 'SF Mono, Monaco, monospace' }}>{c.ref}</code>
            <div style={{ fontSize: 13, color: '#111827', marginTop: 4 }}>
              {composantNames[c.ref] || <em style={{ color: '#DC2626' }}>Produit introuvable</em>}
            </div>
          </div>
          <input type="number" value={c.qte_par_kit} min={1}
            onChange={e => handleChangeQte(c.ref, Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => handleRemove(c.ref)}
            style={{ background: 'transparent', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 8, cursor: 'pointer', fontSize: 14, padding: '6px 10px', fontWeight: 700 }}
            title="Supprimer">×</button>
        </div>
      ))}

      {composition.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 40px', gap: 10, padding: '4px 14px', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginTop: 4 }}>
          <div></div><div style={{ textAlign: 'center' }}>Qté / kit</div><div></div>
        </div>
      )}

      {showSearch ? (
        <div style={{ marginTop: 12, padding: 14, background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          {/* V46 Checkpoint F — SearchInput avec loupe */}
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Rechercher un produit par référence ou nom..."
            autoFocus
          />
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
              {searchResults.map(p => (
                <div key={p.reference} onClick={() => handleAdd(p)}
                  style={{ padding: 10, cursor: 'pointer', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FFF7ED')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                  <div>
                    <code style={{ fontSize: 12, color: '#1565C0' }}>{p.reference}</code>
                    <div style={{ fontSize: 13 }}>{p.nom_fr}</div>
                  </div>
                  <button style={{ background: '#EA580C', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>+ Ajouter</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setShowSearch(false); setSearch(''); setSearchResults([]); }}
            style={{ marginTop: 8, background: 'transparent', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
        </div>
      ) : (
        <button onClick={() => setShowSearch(true)}
          style={{ width: '100%', padding: 10, background: 'transparent', border: '1.5px dashed #E5E7EB', color: '#6B7280', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }}>+ Ajouter un composant</button>
      )}
    </div>
  );
}
