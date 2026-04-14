import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';

const CAT_ICONS: Record<string, string> = {
  'Mini-Pelle': '🏗️', 'Maisons': '🏠', 'Solaire': '☀️',
  'machines-agricoles': '🚜', 'Divers': '📦', 'solaire': '☀️', 'divers': '📦',
};

const CAT_DESC: Record<string, string> = {
  'Mini-Pelle': 'Mini-pelles RIPPA 1.8T à 5.7T. Import direct usine Chine.',
  'Maisons': 'Maisons modulaires 20, 30, 40 pieds. Standard et Premium.',
  'Solaire': 'Kits solaires complets 5kW à 20kW. Panneaux Jinko.',
  'machines-agricoles': 'Motoculteurs et équipements agricoles.',
  'Divers': 'Groupes électrogènes, climatisation, mobilier.',
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, 'products')).then(snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Map<string, { nom: string; count: number; image: string | null }>();
    products.forEach(p => {
      const cat = p.categorie;
      if (!cat || cat === 'Logistique') return;
      if (!cats.has(cat)) cats.set(cat, { nom: cat, count: 0, image: null });
      const c = cats.get(cat)!;
      c.count++;
      if (!c.image && p.images_urls?.length) c.image = p.images_urls[0];
    });
    return Array.from(cats.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  return (
    <>
      {/* HERO */}
      <section style={{
        background: 'linear-gradient(180deg, #4DA8DA 0%, #A8DFFA 100%)',
        padding: '60px 0 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ flex: '0 0 280px' }}>
            <img src="/images/hero_cargo_97import.png" alt="97import cargo" style={{ width: 280, filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0B2545', lineHeight: 1.2, marginBottom: 16 }}>
              L'importation simplifiée de la <span style={{ color: '#EA580C' }}>Chine</span> vers les Antilles.
            </h1>
            <p style={{ fontSize: 16, color: '#1E3A5F', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
              Mini-pelles, maisons modulaires, kits solaires. Prix usine, livraison DOM-TOM incluse.
            </p>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <input type="text" placeholder="Rechercher un produit, une catégorie..." style={{
                width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                fontSize: 15, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', outline: 'none',
              }} />
            </div>
          </div>
          <div style={{ flex: '0 0 250px', textAlign: 'center' }}>
            <div style={{
              width: 220, height: 180, borderRadius: 16, overflow: 'hidden', margin: '0 auto',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}>
              <img src="/images/hero_maison.png" alt="Maison modulaire" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ marginTop: 8, fontSize: 13, color: '#0B2545', fontWeight: 600 }}>Maison modulaire 20P</p>
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0B2545', textAlign: 'center', marginBottom: 8 }}>Nos catégories</h2>
        <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: 40 }}>
          {loading ? 'Chargement...' : `${products.length} produits disponibles`}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {categories.map(cat => (
            <Link key={cat.nom} href={`/catalogue/${cat.nom}`}>
              <div style={{
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: 'white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s',
              }}>
                <div style={{ height: 160, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {cat.image ? <img src={cat.image} alt={cat.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 48 }}>{CAT_ICONS[cat.nom] || '📦'}</span>}
                </div>
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0B2545', marginBottom: 4 }}>{cat.nom}</h3>
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{CAT_DESC[cat.nom] || `${cat.count} produits`}</p>
                  <span style={{ display: 'inline-block', background: '#C87F6B', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    PRIX -50% vs distribution
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: 'linear-gradient(135deg, #0B2545, #1E3A5F)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, textAlign: 'center', color: 'white' }}>
          <div><div style={{ fontSize: 36, fontWeight: 800 }}>{loading ? '...' : products.length}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Produits catalogue</div></div>
          <div><div style={{ fontSize: 36, fontWeight: 800, color: '#EA580C' }}>-50%</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>vs distribution locale</div></div>
          <div><div style={{ fontSize: 36, fontWeight: 800 }}>4</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>DOM-TOM desservis</div></div>
          <div><div style={{ fontSize: 36, fontWeight: 800 }}>100%</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Import direct usine</div></div>
        </div>
      </section>
    </>
  );
}
