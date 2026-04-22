import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { searchProducts } from '@/lib/searchHelpers';
import { getImagePrincipale } from '@/lib/productMediaHelpers';

interface Props {
  variant?: 'header' | 'hero'; // header = compact, hero = grande
  placeholder?: string;
}

export default function SearchBar({ variant = 'header', placeholder }: Props) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Charger tous les produits une fois (cache mémoire)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'products'));
        const products = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(p => p.actif !== false);
        setAllProducts(products);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Recherche live avec debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const found = searchProducts(allProducts, query, 8);
      setResults(found);
      setShowDropdown(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, allProducts]);

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleResultClick = (product: any) => {
    navigate(`/produit/${product.reference || product.id}`);
    setQuery('');
    setShowDropdown(false);
  };

  const isHero = variant === 'hero';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: isHero ? 580 : 400 }}>
      <form onSubmit={handleSubmit} style={isHero ? formHeroStyle : formHeaderStyle}>
        <span style={{ fontSize: 16, color: 'var(--text-3)', paddingLeft: isHero ? 12 : 8 }}>🔍</span>
        <input
          type="text"
          placeholder={placeholder || 'Rechercher (ex: mini-pelle, R22, kit solaire...)'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          style={isHero ? inputHeroStyle : inputHeaderStyle}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
            style={clearButtonStyle}
          >
            ✕
          </button>
        )}
        {isHero && (
          <button type="submit" style={searchButtonHeroStyle}>
            Rechercher
          </button>
        )}
      </form>

      {/* Dropdown résultats */}
      {showDropdown && query.length >= 2 && (
        <div style={dropdownStyle}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Chargement...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
              Aucun produit trouvé pour "<strong>{query}</strong>"
            </div>
          ) : (
            <>
              <div style={dropdownHeaderStyle}>
                {results.length} résultat{results.length > 1 ? 's' : ''}
              </div>
              {results.map(product => {
                const img = getImagePrincipale(product);
                return (
                  <button
                    key={product.id}
                    onClick={() => handleResultClick(product)}
                    style={dropdownItemStyle}
                  >
                    <div style={dropdownThumbStyle}>
                      {img ? (
                        <img src={img} alt={product.nom_fr} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 20 }}>📦</span>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={dropdownNameStyle}>{product.nom_fr || product.reference}</div>
                      <div style={dropdownMetaStyle}>
                        <span style={dropdownChipStyle}>{product.categorie}</span>
                        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>
                          {product.reference}
                        </span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--orange)', fontSize: 16 }}>→</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  navigate(`/recherche?q=${encodeURIComponent(query.trim())}`);
                  setShowDropdown(false);
                }}
                style={dropdownAllStyle}
              >
                Voir tous les résultats pour "{query}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ STYLES ═══ */

const formHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 10px 6px 4px',
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-full)',
  width: '100%',
};

const formHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 8,
  background: '#fff',
  borderRadius: 'var(--radius-full)',
  boxShadow: 'var(--shadow-xl)',
  width: '100%',
};

const inputHeaderStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  border: 'none',
  outline: 'none',
  fontSize: 13,
  background: 'transparent',
  color: 'var(--text)',
  fontFamily: 'inherit',
};

const inputHeroStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 8px',
  border: 'none',
  outline: 'none',
  fontSize: 15,
  background: 'transparent',
  color: 'var(--text)',
  fontFamily: 'inherit',
};

const clearButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  color: 'var(--text-3)',
  padding: 4,
  fontFamily: 'inherit',
};

const searchButtonHeroStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: 'var(--orange)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-xl)',
  maxHeight: 480,
  overflowY: 'auto',
  zIndex: 9999,
};

const dropdownHeaderStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 11,
  color: 'var(--text-3)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  background: 'var(--bg-2)',
  borderBottom: '1px solid var(--border)',
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
  width: '100%',
  fontFamily: 'inherit',
};

const dropdownThumbStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
};

const dropdownNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: 4,
};

const dropdownMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const dropdownChipStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  borderRadius: 'var(--radius-full)',
  fontSize: 10,
  fontWeight: 600,
};

const dropdownAllStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '14px 16px',
  background: 'var(--orange-light)',
  color: 'var(--orange-dark)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  textAlign: 'center',
};
