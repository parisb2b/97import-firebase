import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, clientAuth } from '../../lib/firebase';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';

export default function Catalogue() {
  const [, params] = useRoute('/catalogue/:categorie');
  const categorie = params?.categorie || '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filterGamme, setFilterGamme] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          setUserRole(snap.data()?.role || 'user');
        } catch { setUserRole('user'); }
      } else {
        setUserRole(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'products'));
        const all: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = categorie
          ? all.filter(p => p.categorie === categorie && p.actif !== false && p.type !== 'service')
          : all.filter(p => p.actif !== false && p.categorie !== 'Logistique' && p.type !== 'service');
        setProducts(filtered);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    setFilterGamme('');
  }, [categorie]);

  // Get distinct gammes for filter chips
  const gammes = [...new Set(products.map(p => p.gamme).filter(Boolean))].sort();

  const displayed = filterGamme ? products.filter(p => p.gamme === filterGamme) : products;

  // Only show "parent" products — hide accessories and options
  const mainProducts = displayed.filter(p => {
    if (p.ref_parente || p.option_payante) return false;
    const isAccessoire = p.machine_id || p.machine_compatible || p.type === 'accessoire' || p.type === 'accessory';
    return !isAccessoire;
  });

  return (
    <>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0B2545, #1E3A5F)',
        padding: '32px 0',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <Breadcrumb items={[
            { label: 'Accueil', href: '/' },
            ...(categorie ? [{ label: categorie }] : [{ label: 'Tous les produits' }]),
          ]} />
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginTop: 12 }}>
            {categorie || 'Catalogue'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            {loading ? 'Chargement...' : `${mainProducts.length} produits disponibles`}
          </p>
        </div>
      </div>

      {/* Filters */}
      {gammes.length > 1 && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterGamme('')}
            style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid #E5E7EB', cursor: 'pointer',
              background: !filterGamme ? '#0B2545' : 'white', color: !filterGamme ? 'white' : '#374151',
              fontSize: 13, fontWeight: 500,
            }}>
            Tous
          </button>
          {gammes.map(g => (
            <button key={g} onClick={() => setFilterGamme(g)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1px solid #E5E7EB', cursor: 'pointer',
                background: filterGamme === g ? '#0B2545' : 'white', color: filterGamme === g ? 'white' : '#374151',
                fontSize: 13, fontWeight: 500,
              }}>
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 20px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Chargement des produits...</div>
        ) : mainProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Aucun produit dans cette catégorie</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {mainProducts.map(p => (
              <ProductCard key={p.id} product={p} userRole={userRole} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
