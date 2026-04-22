import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import SearchBar from '../components/SearchBar';
import { getImagePrincipale } from '@/lib/productMediaHelpers';

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
  const { t } = useI18n();
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
      if (!c.image) c.image = getImagePrincipale(p);
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
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1565C0', lineHeight: 1.2, marginBottom: 16 }}>
              {t('hero.title1')} {t('hero.title2')} <span style={{ color: '#EA580C' }}>{t('hero.titleHighlight')}</span> {t('hero.title3')}
            </h1>
            <p style={{ fontSize: 16, color: '#1565C0', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
              {t('hero.subtitle')}
            </p>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 20px' }}>
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
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: '#1565C0', marginBottom: 4 }}>{cat.nom}</h3>
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{CAT_DESC[cat.nom] || `${cat.count} produits`}</p>
                  <span style={{ display: 'inline-block', background: '#C87F6B', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {t('categories.prixBadge')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: 'linear-gradient(135deg, #1565C0, #1565C0)', padding: '48px 0' }}>
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
