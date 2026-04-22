import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { searchProducts } from '@/lib/searchHelpers';
import ProductCard from '@/front/components/ProductCard';

export default function Recherche() {
  const [location] = useLocation();
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lire le query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
  }, [location]);

  // Charger les produits
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtrer dès que les produits ou la query changent
  useEffect(() => {
    if (query && allProducts.length > 0) {
      setResults(searchProducts(allProducts, query, 200));
    } else {
      setResults([]);
    }
  }, [query, allProducts]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>
      {/* Header de page */}
      <div style={pageHeaderStyle}>
        <div style={pageHeaderInnerStyle}>
          <h1 style={pageTitleStyle}>
            Résultats pour "<span style={{ color: 'var(--orange)' }}>{query}</span>"
          </h1>
          <p style={pageSubtitleStyle}>
            {loading ? 'Recherche en cours...' :
             `${results.length} produit${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Résultats */}
      <div style={contentStyle}>
        {loading ? (
          <div style={emptyStyle}>Chargement...</div>
        ) : results.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Aucun résultat
            </div>
            <div style={{ color: 'var(--text-3)' }}>
              Essayez avec d'autres mots-clés ou consultez notre catalogue complet.
            </div>
          </div>
        ) : (
          <div style={gridStyle}>
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const pageHeaderStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid var(--border)',
  padding: '32px 0',
};

const pageHeaderInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '0 24px',
};

const pageTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 28,
  fontWeight: 800,
  color: 'var(--text)',
  margin: 0,
};

const pageSubtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-3)',
  marginTop: 6,
};

const contentStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '32px 24px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 20,
};

const emptyStyle: React.CSSProperties = {
  padding: 80,
  textAlign: 'center',
  color: 'var(--text-2)',
};
