import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import { regrouperProduitsParGroupe } from '../../lib/productGroupHelpers';

const CATEGORIES_INFO: Record<string, { label: string; desc: string; image: string | null; color: string; icon: string }> = {
  'mini-pelle': {
    label: 'Mini-Pelles RIPPA',
    desc: 'Excavateurs compacts professionnels 1-7 tonnes. Idéales pour terrassement, BTP et travaux en DOM-TOM.',
    image: '/images/categories/mini-pelle.webp',
    color: '#1565C0',
    icon: '🚜',
  },
  'maison-modulaire': {
    label: 'Maisons Modulaires',
    desc: 'Maisons préfabriquées Standard et Premium 20/30/40 pieds. Livraison clé-en-main.',
    image: '/images/categories/maison-modulaire.jpg',
    color: '#1565C0',
    icon: '🏠',
  },
  'solaire': {
    label: 'Kits Solaires',
    desc: 'Kits photovoltaïques 10/12/20kW avec panneaux Jinko Solar et onduleurs Deye.',
    image: '/images/categories/solaire.webp',
    color: '#1565C0',
    icon: '☀️',
  },
  'agricole': {
    label: 'Matériel Agricole',
    desc: 'Tracteurs compacts, motoculteurs et accessoires adaptés aux exploitations DOM-TOM.',
    image: null,
    color: '#1565C0',
    icon: '🌾',
  },
  'divers': {
    label: 'Produits Divers',
    desc: 'Groupes électrogènes, climatisations, mobilier sur mesure et équipements professionnels.',
    image: null,
    color: '#1565C0',
    icon: '📦',
  },
};

export default function Catalogue() {
  const [, params] = useRoute('/catalogue/:categorie');
  const categorie = params?.categorie || '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filterGamme, setFilterGamme] = useState('');
  const { t, lang } = useI18n();

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

        // Helper local pour normaliser les catégories (gère anciennes et nouvelles)
        const normalizeCategorie = (cat: string | undefined): string => {
          if (!cat) return '';
          // Normaliser : tout en minuscule, remplacer espaces par tirets
          return cat.toLowerCase().trim().replace(/\s+/g, '-');
        };

        // Catégories à exclure du catalogue public (services internes)
        const CATEGORIES_EXCLUES = ['logistique'];

        const filtered = categorie
          ? all.filter(p => {
              const catNormalisee = normalizeCategorie(p.categorie);
              const catRecherchee = normalizeCategorie(categorie);
              return catNormalisee === catRecherchee &&
                     p.actif !== false &&
                     p.type !== 'service';
            })
          : all.filter(p => {
              const catNormalisee = normalizeCategorie(p.categorie);
              return p.actif !== false &&
                     !CATEGORIES_EXCLUES.includes(catNormalisee) &&
                     p.type !== 'service';
            });

        // Regrouper les variantes (ex: MP-R22-001/002/003 → 1 seule carte R22)
        const grouped = regrouperProduitsParGroupe(filtered);
        setProducts(grouped);
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
  }).sort((a, b) => (a.ordre || 99) - (b.ordre || 99) || (a.reference || '').localeCompare(b.reference || ''));

  const catInfo = categorie ? CATEGORIES_INFO[categorie] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>

      {/* ═══ HERO CATÉGORIE DYNAMIQUE ═══ */}
      {catInfo ? (
        <section style={{
          color: '#fff',
          padding: '48px 24px',
          background: catInfo.image
            ? `linear-gradient(135deg, ${catInfo.color}dd 0%, ${catInfo.color}99 100%)`
            : `linear-gradient(135deg, ${catInfo.color} 0%, ${catInfo.color}cc 100%)`,
        }}>
          <div style={{
            maxWidth: 1400, margin: '0 auto',
            display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32,
            alignItems: 'center',
          }} className="cat-hero-grid">
            <div>
              <Breadcrumb items={[
                { label: t('nav.accueil'), href: '/' },
                { label: catInfo.label },
              ]} />
              <div style={{ fontSize: 48, marginBottom: 16, marginTop: 12 }}>{catInfo.icon}</div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.1 }}>
                {catInfo.label}
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.92, marginBottom: 20, maxWidth: 600 }}>
                {catInfo.desc}
              </p>
              <div style={{ fontSize: 14, opacity: 0.85 }}>
                {loading ? 'Chargement...' : `${mainProducts.length} produits disponibles`}
              </div>
            </div>
            {catInfo.image && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={catInfo.image}
                  alt={catInfo.label}
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 16, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.25))' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        </section>
      ) : (
        /* Hero catalogue complet (pas de catégorie sélectionnée) */
        <section style={{
          color: '#fff', padding: '48px 24px',
          background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Breadcrumb items={[
              { label: t('nav.accueil'), href: '/' },
              { label: 'Catalogue' },
            ]} />
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, marginBottom: 12, marginTop: 12 }}>
              Catalogue complet
            </h1>
            <p style={{ fontSize: 15, opacity: 0.92, maxWidth: 700 }}>
              L'intégralité de notre offre : mini-pelles, maisons modulaires, kits solaires, matériel agricole et plus.
            </p>
            <div style={{ fontSize: 14, opacity: 0.85, marginTop: 16 }}>
              {loading ? 'Chargement...' : `${mainProducts.length} produits disponibles`}
            </div>
          </div>
        </section>
      )}

      {/* ═══ FILTERS ═══ */}
      {gammes.length > 1 && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          <button onClick={() => setFilterGamme('')}
            style={{
              padding: '8px 20px', borderRadius: 20, border: '1px solid #E5E7EB', cursor: 'pointer',
              background: !filterGamme ? '#1565C0' : 'white', color: !filterGamme ? 'white' : '#374151',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            }}>
            Tous
          </button>
          {gammes.map(g => (
            <button key={g} onClick={() => setFilterGamme(g)}
              style={{
                padding: '8px 20px', borderRadius: 20, border: '1px solid #E5E7EB', cursor: 'pointer',
                background: filterGamme === g ? '#1565C0' : 'white', color: filterGamme === g ? 'white' : '#374151',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              }}>
              {g}
            </button>
          ))}
        </div>
      )}

      {/* ═══ GRID ═══ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#6B7280', fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            Chargement des produits...
          </div>
        ) : mainProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#6B7280', fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            Aucun produit dans cette catégorie
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {mainProducts.map(p => (
              <ProductCard key={p.id} product={p} userRole={userRole} lang={lang} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .cat-hero-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </div>
  );
}
