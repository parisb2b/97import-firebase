import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'wouter';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductCard from '@/front/components/ProductCard';

const CATEGORIES_INFO: Record<string, { label: string; desc: string; image: string; color: string; icon: string }> = {
  'mini-pelle': {
    label: 'Mini-Pelles RIPPA',
    desc: 'Excavateurs compacts professionnels de 1 à 7 tonnes. Idéales pour terrassement, BTP et travaux agricoles en DOM-TOM.',
    image: '/images/categories/mini-pelle.webp',
    color: '#1565C0',
    icon: '🚜',
  },
  'maison-modulaire': {
    label: 'Maisons Modulaires',
    desc: 'Maisons préfabriquées Standard et Premium en 20, 30 ou 40 pieds. Livraison clé-en-main pour votre projet de construction.',
    image: '/images/categories/maison-modulaire.jpg',
    color: '#10B981',
    icon: '🏠',
  },
  'solaire': {
    label: 'Kits Solaires',
    desc: 'Kits photovoltaïques complets 10/12/20kW avec panneaux Jinko Solar et onduleurs Deye. Toiture ou installation au sol.',
    image: '/images/categories/solaire.webp',
    color: '#F59E0B',
    icon: '☀️',
  },
  'agricole': {
    label: 'Matériel Agricole',
    desc: 'Tracteurs compacts, motoculteurs et accessoires agricoles. Solutions adaptées aux exploitations DOM-TOM.',
    image: '/images/categories/agricole.jpg',
    color: '#84CC16',
    icon: '🌾',
  },
  'divers': {
    label: 'Produits Divers',
    desc: 'Groupes électrogènes, climatisations, mobilier sur mesure et autres équipements professionnels.',
    image: '/images/categories/divers.jpg',
    color: '#8B5CF6',
    icon: '📦',
  },
};

const CATEGORIES_EXCLUES = ['logistique'];

function normalizeCategorie(cat: string | undefined): string {
  if (!cat) return '';
  return cat.toLowerCase().trim().replace(/\s+/g, '-');
}

export default function Catalogue() {
  const params = useParams<{ categorie?: string }>();
  const categorie = params?.categorie;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGamme, setFilterGamme] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'price-asc' | 'price-desc'>('recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Charger les produits
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'products'));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setProducts(all);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtrage
  const filtered = useMemo(() => {
    return products.filter(p => {
      if (p.actif === false) return false;
      if (p.type === 'service') return false;

      const catNormalisee = normalizeCategorie(p.categorie);

      if (categorie) {
        const catRecherchee = normalizeCategorie(categorie);
        if (catNormalisee !== catRecherchee) return false;
      } else {
        if (CATEGORIES_EXCLUES.includes(catNormalisee)) return false;
      }

      // Filtre gamme
      if (filterGamme && p.gamme !== filterGamme) return false;

      // Masquer accessoires de la liste principale
      if (p.ref_parente || p.option_payante) return false;
      const isAccessoire = p.machine_id || p.machine_compatible || p.type === 'accessoire';
      if (isAccessoire) return false;

      return true;
    });
  }, [products, categorie, filterGamme]);

  // Tri
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'recent') {
      arr.sort((a, b) => {
        const dA = a.created_at?.toDate?.() || new Date(0);
        const dB = b.created_at?.toDate?.() || new Date(0);
        return dB.getTime() - dA.getTime();
      });
    } else if (sortBy === 'name') {
      arr.sort((a, b) => (a.nom_fr || '').localeCompare(b.nom_fr || ''));
    } else if (sortBy === 'price-asc') {
      arr.sort((a, b) => (a.prix_achat || 0) - (b.prix_achat || 0));
    } else if (sortBy === 'price-desc') {
      arr.sort((a, b) => (b.prix_achat || 0) - (a.prix_achat || 0));
    }
    return arr;
  }, [filtered, sortBy]);

  // Liste des gammes disponibles pour le filtre
  const gammes = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach(p => { if (p.gamme) set.add(p.gamme); });
    return Array.from(set).sort();
  }, [filtered]);

  const catInfo = categorie ? CATEGORIES_INFO[categorie] : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>

      {/* ═══ HERO CATÉGORIE ═══ */}
      {catInfo ? (
        <section style={{
          ...heroStyle,
          background: `linear-gradient(135deg, ${catInfo.color}dd 0%, ${catInfo.color}99 100%)`,
        }}>
          <div style={heroInnerStyle}>
            <div style={heroTextStyle}>
              <div style={heroIconStyle}>{catInfo.icon}</div>
              <h1 style={heroTitleStyle}>{catInfo.label}</h1>
              <p style={heroDescStyle}>{catInfo.desc}</p>
              <div style={heroStatsStyle}>
                <span style={heroStatStyle}>
                  <strong>{filtered.length}</strong> produit{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div style={heroImageWrapperStyle}>
              <img
                src={catInfo.image}
                alt={catInfo.label}
                style={heroImageStyle}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        </section>
      ) : (
        <section style={{ ...heroStyle, background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-2) 100%)' }}>
          <div style={heroInnerStyle}>
            <div style={heroTextStyle}>
              <h1 style={heroTitleStyle}>Catalogue complet</h1>
              <p style={heroDescStyle}>
                Découvrez l'intégralité de notre offre : mini-pelles, maisons modulaires, kits solaires, matériel agricole et plus.
              </p>
              <div style={heroStatsStyle}>
                <span style={heroStatStyle}>
                  <strong>{filtered.length}</strong> produits disponibles
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ BREADCRUMB + FILTRES TOOLBAR ═══ */}
      <div style={toolbarStyle}>
        <div style={toolbarInnerStyle}>
          <div style={breadcrumbStyle}>
            <Link href="/" style={breadcrumbLinkStyle}>Accueil</Link>
            <span style={breadcrumbSepStyle}>›</span>
            <Link href="/catalogue" style={breadcrumbLinkStyle}>Catalogue</Link>
            {categorie && (
              <>
                <span style={breadcrumbSepStyle}>›</span>
                <span style={{ color: 'var(--text)' }}>{catInfo?.label || categorie}</span>
              </>
            )}
          </div>

          <div style={toolbarRightStyle}>
            {/* Bouton filtres mobile */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              style={mobileFilterButtonStyle}
              className="mobile-only"
            >
              ⚙️ Filtres
            </button>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={sortSelectStyle}
            >
              <option value="recent">Plus récents</option>
              <option value="name">Nom A→Z</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* ═══ LAYOUT FILTRES + GRILLE ═══ */}
      <div style={contentStyle}>
        <div style={layoutStyle}>

          {/* Filtres latéraux */}
          <aside
            style={{
              ...sidebarStyle,
              ...(showMobileFilters ? mobileSidebarOpenStyle : {}),
            }}
            className="sidebar-filters"
          >
            <div style={filterSectionStyle}>
              <h4 style={filterTitleStyle}>Catégories</h4>
              <div style={filterListStyle}>
                <Link
                  href="/catalogue"
                  style={{
                    ...filterItemStyle,
                    ...(!categorie ? filterItemActiveStyle : {}),
                  }}
                >
                  Toutes les catégories
                </Link>
                {Object.entries(CATEGORIES_INFO).map(([slug, info]) => (
                  <Link
                    key={slug}
                    href={`/catalogue/${slug}`}
                    style={{
                      ...filterItemStyle,
                      ...(categorie === slug ? filterItemActiveStyle : {}),
                    }}
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Filtre gamme si dispo */}
            {gammes.length > 0 && (
              <div style={filterSectionStyle}>
                <h4 style={filterTitleStyle}>Gamme</h4>
                <div style={filterListStyle}>
                  <button
                    onClick={() => setFilterGamme('')}
                    style={{
                      ...filterItemStyle,
                      ...(filterGamme === '' ? filterItemActiveStyle : {}),
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Toutes
                  </button>
                  {gammes.map(g => (
                    <button
                      key={g}
                      onClick={() => setFilterGamme(g)}
                      style={{
                        ...filterItemStyle,
                        ...(filterGamme === g ? filterItemActiveStyle : {}),
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Grille produits */}
          <div style={gridWrapperStyle}>
            {loading ? (
              <div style={emptyStateStyle}>Chargement...</div>
            ) : sorted.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Aucun produit dans cette catégorie</div>
              </div>
            ) : (
              <div style={gridStyle}>
                {sorted.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar-filters { display: none; }
          .mobile-only { display: inline-flex !important; }
        }
        @media (min-width: 1025px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══ STYLES ═══ */

const heroStyle: React.CSSProperties = {
  color: '#fff',
  padding: '48px 24px',
};

const heroInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1.5fr 1fr',
  gap: 32,
  alignItems: 'center',
};

const heroTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const heroIconStyle: React.CSSProperties = {
  fontSize: 48,
  marginBottom: 16,
};

const heroTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 'clamp(24px, 4vw, 40px)',
  fontWeight: 800,
  marginBottom: 12,
  lineHeight: 1.1,
};

const heroDescStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
  opacity: 0.92,
  marginBottom: 20,
  maxWidth: 600,
};

const heroStatsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
};

const heroStatStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: 'rgba(255,255,255,0.2)',
  borderRadius: 'var(--radius-full)',
  fontSize: 13,
};

const heroImageWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const heroImageStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: 200,
  objectFit: 'contain',
  borderRadius: 'var(--radius-lg)',
  filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.25))',
};

const toolbarStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid var(--border)',
};

const toolbarInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '14px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
};

const breadcrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  color: 'var(--text-3)',
};

const breadcrumbLinkStyle: React.CSSProperties = {
  color: 'var(--text-3)',
  textDecoration: 'none',
};

const breadcrumbSepStyle: React.CSSProperties = {
  opacity: 0.5,
};

const toolbarRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const mobileFilterButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'none',
};

const sortSelectStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  outline: 'none',
};

const contentStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '32px 24px',
};

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '240px 1fr',
  gap: 24,
};

const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const mobileSidebarOpenStyle: React.CSSProperties = {
  display: 'flex',
};

const filterSectionStyle: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
};

const filterTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: 'var(--text-3)',
  marginBottom: 12,
};

const filterListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const filterItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
  color: 'var(--text-2)',
  fontSize: 13,
  background: 'transparent',
  transition: 'var(--transition-fast)',
};

const filterItemActiveStyle: React.CSSProperties = {
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  fontWeight: 600,
};

const gridWrapperStyle: React.CSSProperties = {
  minHeight: 400,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 20,
};

const emptyStateStyle: React.CSSProperties = {
  padding: 60,
  textAlign: 'center',
  background: '#fff',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-2)',
};
