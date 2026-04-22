import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SearchBar from '@/front/components/SearchBar';

export default function Home() {
  const [, navigate] = useLocation();
  const [productsCount, setProductsCount] = useState<Record<string, number>>({
    'mini-pelle': 0,
    'maison-modulaire': 0,
    'solaire': 0,
    'agricole': 0,
    'divers': 0,
  });

  // Compter les produits par catégorie
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const counts: Record<string, number> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.actif !== false && data.type !== 'service') {
            const cat = (data.categorie || '').toLowerCase().trim().replace(/\s+/g, '-');
            counts[cat] = (counts[cat] || 0) + 1;
          }
        });
        setProductsCount(counts as any);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
      }
    })();
  }, []);

  const categories = [
    {
      slug: 'mini-pelle',
      label: 'Mini-Pelles',
      desc: 'Excavateurs compacts 1-7 tonnes RIPPA',
      icon: '🚜',
      image: '/images/categories/mini-pelle.webp',
      color: '#1565C0',
    },
    {
      slug: 'maison-modulaire',
      label: 'Maisons modulaires',
      desc: 'Standard et Premium 20/30/40 pieds',
      icon: '🏡',
      image: '/images/categories/maison-modulaire.jpg',
      color: '#10B981',
    },
    {
      slug: 'solaire',
      label: 'Kits solaires',
      desc: 'Panneaux Jinko + onduleurs Deye',
      icon: '☀️',
      image: '/images/categories/solaire.webp',
      color: '#F59E0B',
    },
    {
      slug: 'agricole',
      label: 'Matériel agricole',
      desc: 'Tracteurs, motoculteurs, accessoires',
      icon: '🌾',
      image: '/images/categories/agricole.jpg',
      color: '#84CC16',
    },
    {
      slug: 'divers',
      label: 'Divers',
      desc: 'Groupes électrogènes, climatiseurs, etc.',
      icon: '📦',
      image: '/images/categories/divers.jpg',
      color: '#8B5CF6',
    },
  ];

  const stats = [
    { value: '5+', label: 'Années d\'expérience', icon: '⭐' },
    { value: '500+', label: 'Conteneurs livrés', icon: '📦' },
    { value: '300+', label: 'Clients DOM-TOM', icon: '👥' },
    { value: '110+', label: 'Références produits', icon: '🛒' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════ */}
      <section style={heroStyle}>
        <div style={heroBackgroundShape}></div>

        <div style={heroInnerStyle} className="hero-grid">
          <div style={heroTextZone}>
            <h1 style={heroTitleStyle}>
              Importation directe<br />
              <span style={{ color: 'var(--orange)' }}>Chine → DOM-TOM</span>
            </h1>
            <p style={heroSubtitleStyle}>
              Mini-pelles, maisons modulaires, kits solaires et matériel professionnel.
              Livraison maritime garantie en Martinique, Guadeloupe, Guyane et Réunion.
            </p>

            {/* Search bar */}
            <div style={{ marginBottom: 32, maxWidth: 580 }}>
              <SearchBar variant="hero" placeholder="Rechercher un produit (ex: mini-pelle R22, kit solaire 10kW...)" />
            </div>

            {/* Stats compact */}
            <div style={heroStatsStyle} className="stats-hero">
              {stats.slice(0, 3).map(s => (
                <div key={s.label} style={heroStatItemStyle}>
                  <div style={heroStatValueStyle}>{s.value}</div>
                  <div style={heroStatLabelStyle}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cargo image animé */}
          <div style={heroImageZone}>
            <img
              src="/images/hero/cargo.png"
              alt="Cargo 97import"
              className="anim-float"
              style={heroCargoStyle}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Wave bottom */}
        <div style={heroWaveStyle}></div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CATEGORIES SECTION
          ═══════════════════════════════════════════════════════ */}
      <section style={sectionStyle}>
        <div style={sectionInnerStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Nos catégories</h2>
            <p style={sectionSubtitleStyle}>
              Découvrez notre gamme complète de produits importés directement de Chine
            </p>
          </div>

          <div style={categoriesGridStyle}>
            {categories.map(cat => {
              const count = productsCount[cat.slug] || 0;
              return (
                <Link
                  key={cat.slug}
                  href={`/catalogue/${cat.slug}`}
                  style={categoryCardStyle}
                >
                  <div style={{ ...categoryImageWrapperStyle, background: cat.color }}>
                    <img
                      src={cat.image}
                      alt={cat.label}
                      style={categoryImageStyle}
                      onError={(e) => {
                        // Fallback : masquer l'image et garder le fond coloré + icône
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div style={categoryIconOverlayStyle}>{cat.icon}</div>
                  </div>
                  <div style={categoryContentStyle}>
                    <h3 style={categoryTitleStyle}>{cat.label}</h3>
                    <p style={categoryDescStyle}>{cat.desc}</p>
                    {count > 0 && (
                      <div style={categoryCountStyle}>
                        {count} produit{count > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          POURQUOI 97IMPORT (chiffres clés)
          ═══════════════════════════════════════════════════════ */}
      <section style={{ ...sectionStyle, background: 'var(--bg-2)' }}>
        <div style={sectionInnerStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Pourquoi 97import ?</h2>
            <p style={sectionSubtitleStyle}>
              Votre partenaire de confiance pour l'importation depuis la Chine
            </p>
          </div>

          <div style={statsGridStyle}>
            {stats.map(s => (
              <div key={s.label} style={statCardStyle}>
                <div style={statIconStyle}>{s.icon}</div>
                <div style={statValueLargeStyle}>{s.value}</div>
                <div style={statLabelStyle}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={advantagesGridStyle}>
            <Advantage
              icon="🏭"
              title="Direct usine Chine"
              desc="Pas d'intermédiaire, prix d'usine garantis avec marge transparente"
            />
            <Advantage
              icon="🚢"
              title="Logistique maritime"
              desc="Conteneurs 20 ou 40 pieds, livraison clé-en-main en DOM-TOM"
            />
            <Advantage
              icon="📋"
              title="Dédouanement inclus"
              desc="Nous gérons toutes les formalités douanières pour vous"
            />
            <Advantage
              icon="✅"
              title="Garantie produits"
              desc="Tous nos produits sont conformes CE et garantis"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PARTENAIRES FOURNISSEURS
          ═══════════════════════════════════════════════════════ */}
      <section style={sectionStyle}>
        <div style={sectionInnerStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Nos fournisseurs partenaires</h2>
            <p style={sectionSubtitleStyle}>
              Marques chinoises de référence avec qualité garantie
            </p>
          </div>

          <div style={partnersGridStyle}>
            <PartnerLogo name="Jinko Solar" desc="Panneaux Tiger Neo 600W bifacial" />
            <PartnerLogo name="Deye" desc="Onduleurs hybrides certifiés CE" />
            <PartnerLogo name="RIPPA" desc="Mini-pelles compactes professionnelles" />
            <PartnerLogo name="Banking Circle" desc="Paiement sécurisé international" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA FINAL
          ═══════════════════════════════════════════════════════ */}
      <section style={ctaSectionStyle}>
        <div style={ctaInnerStyle}>
          <h2 style={ctaTitleStyle}>Prêt à lancer votre projet d'importation ?</h2>
          <p style={ctaDescStyle}>
            Demandez votre devis gratuit en quelques clics. Notre équipe vous répond sous 24h.
          </p>
          <div style={ctaButtonsStyle}>
            <Link href="/contact" style={ctaPrimaryButtonStyle}>
              Demander un devis
            </Link>
            <Link href="/catalogue" style={ctaSecondaryButtonStyle}>
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* Styles responsive */}
      <style>{`
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 640px) {
          .stats-hero { gap: 16px !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══ COMPOSANTS LOCAUX ═══ */

function Advantage({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={advantageCardStyle}>
      <div style={advantageIconStyle}>{icon}</div>
      <h3 style={advantageTitleStyle}>{title}</h3>
      <p style={advantageDescStyle}>{desc}</p>
    </div>
  );
}

function PartnerLogo({ name, desc }: { name: string; desc: string }) {
  return (
    <div style={partnerCardStyle}>
      <div style={partnerNameStyle}>{name}</div>
      <div style={partnerDescStyle}>{desc}</div>
    </div>
  );
}

/* ═══ STYLES ═══ */

const heroStyle: React.CSSProperties = {
  position: 'relative',
  background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)',
  color: '#fff',
  overflow: 'hidden',
  minHeight: 580,
};

const heroBackgroundShape: React.CSSProperties = {
  position: 'absolute',
  top: '-50%',
  right: '-20%',
  width: '60%',
  height: '160%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)',
  pointerEvents: 'none',
};

const heroInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '64px 24px 100px',
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr',
  gap: 40,
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
};

const heroTextZone: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const heroTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 'clamp(28px, 5vw, 52px)',
  fontWeight: 800,
  lineHeight: 1.1,
  marginBottom: 20,
  letterSpacing: '-0.02em',
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: 17,
  lineHeight: 1.6,
  opacity: 0.92,
  marginBottom: 32,
  maxWidth: 580,
};

const heroStatsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 32,
  flexWrap: 'wrap',
};

const heroStatItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const heroStatValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 28,
  fontWeight: 800,
  color: 'var(--orange-light)',
  lineHeight: 1,
};

const heroStatLabelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.85,
  marginTop: 4,
};

const heroImageZone: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const heroCargoStyle: React.CSSProperties = {
  maxWidth: '100%',
  height: 'auto',
  filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.25))',
};

const heroWaveStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: -1,
  left: 0,
  right: 0,
  height: 60,
  background: 'var(--bg)',
  clipPath: 'ellipse(70% 100% at 50% 100%)',
};

const sectionStyle: React.CSSProperties = {
  padding: '64px 0',
  background: 'var(--bg)',
};

const sectionInnerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '0 24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: 700,
  margin: '0 auto 48px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 'clamp(24px, 3vw, 36px)',
  fontWeight: 800,
  color: 'var(--text)',
  marginBottom: 12,
};

const sectionSubtitleStyle: React.CSSProperties = {
  fontSize: 15,
  color: 'var(--text-3)',
  lineHeight: 1.6,
};

const categoriesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 20,
};

const categoryCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'var(--text)',
  boxShadow: 'var(--shadow)',
  transition: 'var(--transition)',
  cursor: 'pointer',
};

const categoryImageWrapperStyle: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '4/3',
  overflow: 'hidden',
};

const categoryImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const categoryIconOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  width: 40,
  height: 40,
  background: 'rgba(255,255,255,0.95)',
  borderRadius: 'var(--radius)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  boxShadow: 'var(--shadow)',
};

const categoryContentStyle: React.CSSProperties = {
  padding: 20,
};

const categoryTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 17,
  fontWeight: 700,
  marginBottom: 6,
  color: 'var(--text)',
};

const categoryDescStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-3)',
  lineHeight: 1.5,
  marginBottom: 12,
};

const categoryCountStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  borderRadius: 'var(--radius-full)',
  fontSize: 11,
  fontWeight: 600,
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 20,
  marginBottom: 64,
};

const statCardStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 32,
  background: 'var(--bg)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
};

const statIconStyle: React.CSSProperties = {
  fontSize: 32,
  marginBottom: 12,
};

const statValueLargeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 40,
  fontWeight: 800,
  color: 'var(--blue)',
  lineHeight: 1,
  marginBottom: 8,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-3)',
  fontWeight: 500,
};

const advantagesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 20,
};

const advantageCardStyle: React.CSSProperties = {
  padding: 24,
  background: 'var(--bg)',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'center',
};

const advantageIconStyle: React.CSSProperties = {
  fontSize: 36,
  marginBottom: 12,
};

const advantageTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 8,
  color: 'var(--text)',
};

const advantageDescStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-3)',
  lineHeight: 1.5,
};

const partnersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 20,
};

const partnerCardStyle: React.CSSProperties = {
  padding: 24,
  background: 'var(--bg-2)',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'center',
  border: '1px solid var(--border)',
};

const partnerNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--blue)',
  marginBottom: 6,
};

const partnerDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-3)',
};

const ctaSectionStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-2) 100%)',
  padding: '64px 24px',
  color: '#fff',
  textAlign: 'center',
};

const ctaInnerStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: '0 auto',
};

const ctaTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 'clamp(22px, 3vw, 32px)',
  fontWeight: 800,
  marginBottom: 16,
};

const ctaDescStyle: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.95,
  marginBottom: 32,
  lineHeight: 1.6,
};

const ctaButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const ctaPrimaryButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  background: '#fff',
  color: 'var(--orange)',
  textDecoration: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 15,
  fontWeight: 700,
  transition: 'var(--transition)',
};

const ctaSecondaryButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  background: 'transparent',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 15,
  fontWeight: 700,
  border: '2px solid #fff',
  transition: 'var(--transition)',
};
