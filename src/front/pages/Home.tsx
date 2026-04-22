import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import SearchBar from '../components/SearchBar';

export default function Home() {
  useI18n(); // Keep i18n initialized
  const [products, setProducts] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, 'products')).then(snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const productsCount = useMemo(() => products.length, [products]);

  // Category cards (5 catégories)
  const categories = [
    { slug: 'mini-pelle', label: 'Mini-Pelles', desc: 'Excavateurs compacts 1-7 tonnes RIPPA', icon: '🚜', image: '/images/categories/mini-pelle.webp', color: '#1565C0' },
    { slug: 'maison-modulaire', label: 'Maisons modulaires', desc: 'Standard et Premium 20/30/40 pieds', icon: '🏠', image: '/images/categories/maison-modulaire.jpg', color: '#10B981' },
    { slug: 'solaire', label: 'Kits solaires', desc: 'Panneaux Jinko + onduleurs Deye', icon: '☀️', image: '/images/categories/solaire.webp', color: '#F59E0B' },
    { slug: 'agricole', label: 'Matériel agricole', desc: 'Tracteurs, motoculteurs, accessoires', icon: '🌾', image: null, color: '#84CC16' },
    { slug: 'divers', label: 'Divers', desc: 'Groupes électrogènes, climatiseurs', icon: '📦', image: null, color: '#8B5CF6' },
  ];

  const stats = [
    { value: '5+', label: 'Années d\'expérience', icon: '⭐' },
    { value: '500+', label: 'Conteneurs livrés', icon: '📦' },
    { value: '300+', label: 'Clients DOM-TOM', icon: '👥' },
    { value: productsCount > 0 ? `${productsCount}+` : '110+', label: 'Références produits', icon: '🛒' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ═══ HERO SECTION ═══ */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)',
        color: '#fff',
        overflow: 'hidden',
        minHeight: 580,
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          padding: '64px 24px 100px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 40,
          alignItems: 'center',
        }} className="home-hero-grid">
          <div>
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 20,
            }}>
              Importation directe<br />
              <span style={{ color: '#EA580C' }}>Chine → DOM-TOM</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, opacity: 0.92, marginBottom: 32, maxWidth: 580 }}>
              Mini-pelles, maisons modulaires, kits solaires et matériel professionnel.
              Livraison maritime garantie en Martinique, Guadeloupe, Guyane et Réunion.
            </p>

            <div style={{ marginBottom: 32, maxWidth: 500 }}>
              <SearchBar />
            </div>

            {/* 3 stats compact */}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {stats.slice(0, 3).map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#FED7AA' }}>{s.value}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cargo image */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="/images/hero/cargo.png"
              alt="Cargo 97import"
              style={{ maxWidth: '100%', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.25))', animation: 'float 3s ease-in-out infinite' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Wave bottom */}
        <div style={{
          position: 'absolute', bottom: -1, left: 0, right: 0, height: 60,
          background: '#FFFFFF', clipPath: 'ellipse(70% 100% at 50% 100%)',
        }} />
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section style={{ padding: '64px 0', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
              Nos catégories
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 600, margin: '0 auto' }}>
              Découvrez notre gamme complète de produits importés directement de Chine
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
          }}>
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/catalogue/${cat.slug}`}
              >
                <div
                  style={{
                    display: 'flex', flexDirection: 'column',
                    background: '#fff', borderRadius: 16,
                    overflow: 'hidden', textDecoration: 'none', color: '#0F172A',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.14)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    position: 'relative', aspectRatio: '4/3', overflow: 'hidden',
                    background: cat.image ? '#F3F4F6' : `linear-gradient(135deg, ${cat.color}, ${cat.color}aa)`,
                  }}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 80, color: 'rgba(255,255,255,0.9)',
                      }}>
                        {cat.icon}
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      width: 40, height: 40, background: 'rgba(255,255,255,0.95)',
                      borderRadius: 10, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                      {cat.icon}
                    </div>
                  </div>

                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{cat.label}</h3>
                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{cat.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ POURQUOI 97IMPORT ═══ */}
      <section style={{ padding: '64px 0', background: '#F9FAFB' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
              Pourquoi 97import ?
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 600, margin: '0 auto' }}>
              Votre partenaire de confiance pour l'importation depuis la Chine
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20, marginBottom: 48,
          }}>
            {stats.map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: 32, background: '#fff',
                borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#1565C0', lineHeight: 1, marginBottom: 8 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {[
              { icon: '🏭', title: 'Direct usine Chine', desc: 'Pas d\'intermédiaire, prix d\'usine garantis' },
              { icon: '🚢', title: 'Logistique maritime', desc: 'Conteneurs 20/40 pieds, livraison clé-en-main' },
              { icon: '✅', title: 'Conformité CE', desc: 'Tous nos produits sont certifiés CE' },
            ].map(a => (
              <div key={a.title} style={{ padding: 24, background: '#fff', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{a.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOURNISSEURS PARTENAIRES (3 cards, sans Banking Circle) ═══ */}
      <section style={{ padding: '64px 0', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
              Nos fournisseurs partenaires
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280' }}>
              Marques chinoises de référence avec qualité garantie
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20, maxWidth: 900, margin: '0 auto',
          }}>
            {[
              { name: 'Jinko Solar', desc: 'Panneaux Tiger Neo 600W bifacial' },
              { name: 'Deye', desc: 'Onduleurs hybrides certifiés CE' },
              { name: 'RIPPA', desc: 'Mini-pelles compactes professionnelles' },
            ].map(p => (
              <div key={p.name} style={{
                padding: 28, background: '#F9FAFB', borderRadius: 16,
                textAlign: 'center', border: '1px solid #E5E7EB',
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1565C0', marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section style={{
        background: 'linear-gradient(135deg, #EA580C 0%, #F5924A 100%)',
        padding: '64px 24px', color: '#fff', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, marginBottom: 16 }}>
            Prêt à lancer votre projet d'importation ?
          </h2>
          <p style={{ fontSize: 16, opacity: 0.95, marginBottom: 32, lineHeight: 1.6 }}>
            Demandez votre devis gratuit en quelques clics. Notre équipe vous répond sous 24h.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/catalogue">
              <a style={{
                padding: '14px 32px', background: '#fff', color: '#EA580C',
                textDecoration: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                display: 'inline-block',
              }}>Voir le catalogue</a>
            </Link>
            <Link href="/contact">
              <a style={{
                padding: '14px 32px', background: 'transparent', color: '#fff',
                textDecoration: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                border: '2px solid #fff',
                display: 'inline-block',
              }}>Nous contacter</a>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (max-width: 1024px) {
          .home-hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
