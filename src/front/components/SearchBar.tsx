import { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLocation } from 'wouter';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [, navigate] = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDocs(collection(db, 'products')).then(snap => {
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResults([]); setShowDropdown(false); return; }
    const search = q.toLowerCase();
    const filtered = allProducts.filter(p => {
      const fields = [p.nom_fr, p.nom, p.reference, p.categorie, p.gamme, p.description_fr, p.marque, p.moteur]
        .filter(Boolean).join(' ').toLowerCase();
      return fields.includes(search);
    }).slice(0, 8);
    setResults(filtered);
    setShowDropdown(filtered.length > 0);
  }, [q, allProducts]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (product: any) => {
    setShowDropdown(false);
    setQ('');
    navigate(`/produit/${product.id}`);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
      <div style={{
        display: 'flex', background: '#fff', borderRadius: 12,
        overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un produit, une categorie..."
          style={{
            flex: 1, border: 'none', padding: '14px 18px', fontSize: 14,
            outline: 'none', fontFamily: 'inherit', color: '#0B2545',
          }}
        />
        <button style={{
          background: '#0B2545', color: '#fff', border: 'none',
          padding: '14px 22px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 0.5,
        }}>
          Rechercher
        </button>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: 8, zIndex: 100, maxHeight: 400, overflowY: 'auto',
        }}>
          {results.map(p => (
            <div key={p.id} onClick={() => handleSelect(p)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {p.images_urls?.[0] ? (
                <img src={p.images_urls[0]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0B2545' }}>{p.nom_fr || p.nom}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.categorie}{p.gamme ? ` · ${p.gamme}` : ''}{p.reference ? ` · ${p.reference}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
