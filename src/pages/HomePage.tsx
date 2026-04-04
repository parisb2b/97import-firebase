import { useState } from 'react'
import { useLocation } from 'wouter'
import { useLang } from '../contexts/LanguageContext'

// ── Couleurs site ─────────────────────────────────────────
const C = {
  blue:    '#4A90D9',
  blueHov: '#3A7BC8',
  navy:    '#1E3A5F',
  gray50:  '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  white:   '#FFFFFF',
}

// ── Données catégories ────────────────────────────────────
const CATEGORIES = [
  {
    id: 'minipelles',
    path: '/mini-pelles',
    icon: '🦾',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    image: '/images/portal/agri_tractor.jpg',
    title_fr: 'Mini-pelles',
    title_zh: '小型挖掘机',
    desc_fr: 'R18, R22, R32, R57 PRO — Livraison DOM-TOM',
    desc_zh: 'R18, R22, R32, R57 PRO — 发货至DOM-TOM',
  },
  {
    id: 'maisons',
    path: '/maisons',
    icon: '🏠',
    color: '#059669',
    bgColor: '#ECFDF5',
    image: '/images/portal/modular_home.png',
    title_fr: 'Maisons Modulaires',
    title_zh: '模块化房屋',
    desc_fr: 'Standard & Premium, 20 à 40 pieds',
    desc_zh: '标准版和高级版，20至40英尺',
  },
  {
    id: 'solaire',
    path: '/solaire',
    icon: '☀️',
    color: '#EAB308',
    bgColor: '#FEFCE8',
    image: '/images/portal/solar_panel.jpg',
    title_fr: 'Panneaux Solaires',
    title_zh: '太阳能套件',
    desc_fr: 'Kits 10, 12, 20 kW — Jinko + Deye',
    desc_zh: '10、12、20 kW套装',
  },
  {
    id: 'accessoires',
    path: '/accessoires',
    icon: '🔧',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    image: '/images/accessories/godet_dents.webp',
    title_fr: 'Accessoires',
    title_zh: '配件',
    desc_fr: 'Godets, marteaux, tarières, grappins…',
    desc_zh: '铲斗、破碎锤、螺旋钻、抓斗…',
  },
]

// ── Arguments de confiance ────────────────────────────────
const TRUST = [
  {
    icon: '🌍',
    title_fr: 'Expertise DOM-TOM',
    title_zh: '海外省专业知识',
    desc_fr: 'Livraison maîtrisée vers Martinique, Guadeloupe, Guyane, Réunion et Mayotte.',
    desc_zh: '专业配送至马提尼克、瓜德罗普、法属圭亚那、留尼汪和马约特。',
  },
  {
    icon: '✅',
    title_fr: 'Qualité Certifiée',
    title_zh: '认证质量',
    desc_fr: 'Des produits rigoureusement sélectionnés pour leur robustesse et durabilité.',
    desc_zh: '严格筛选，确保产品坚固耐用。',
  },
  {
    icon: '💬',
    title_fr: 'SAV Réactif',
    title_zh: '快速售后服务',
    desc_fr: 'Assistance technique disponible via WhatsApp pour vous accompagner.',
    desc_zh: '通过WhatsApp提供技术支持。',
  },
]

export default function HomePage() {
  const { lang } = useLang()
  const [, setLocation] = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredCat, setHoveredCat] = useState<string | null>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.toLowerCase()
    if (!q) return
    if (/pelle|rippa|r18|r22|r32|r57/.test(q)) setLocation(`/mini-pelles?q=${q}`)
    else if (/maison|cabin|conteneur|modulaire/.test(q)) setLocation(`/maisons?q=${q}`)
    else if (/solaire|panneau|énergie|energie|kw/.test(q)) setLocation(`/solaire?q=${q}`)
    else setLocation(`/mini-pelles?q=${q}`)
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: C.gray700 }}>

      {/* ── BARRE TOP ────────────────────────────────── */}
      {/* Header + Nav gérés par le layout global App.tsx */}

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{
        backgroundImage: 'url(/images/portal/hero_ship.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '100px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '480px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Overlay sombre */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
        }} />

        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(74,144,217,0.2)',
            border: '1px solid rgba(74,144,217,0.4)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#93C5FD',
            marginBottom: '20px',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}>
            🚢 Importation Chine → DOM-TOM
          </div>

          <h1 style={{
            fontSize: '52px',
            fontWeight: '800',
            color: '#fff',
            lineHeight: '1.1',
            letterSpacing: '-1px',
            margin: '0 0 16px',
          }}>
            97import<span style={{ color: C.blue }}>.com</span>
          </h1>

          <p style={{
            fontSize: '18px',
            color: '#CBD5E1',
            margin: '0 0 36px',
            lineHeight: '1.6',
          }}>
            {lang === 'fr'
              ? "L'importation n'a jamais été aussi simple depuis la Chine vers les Antilles."
              : '从中国到法属安的列斯群岛，进口从未如此简单。'}
          </p>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '500px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher un produit…' : '搜索产品…'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '15px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button type="submit" style={{
              padding: '14px 24px',
              background: C.blue,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 200ms',
            }}>
              {lang === 'fr' ? 'Rechercher' : '搜索'}
            </button>
          </form>
        </div>
      </section>

      {/* ── CATÉGORIES ───────────────────────────────── */}
      <section style={{ background: C.gray50, padding: '64px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '30px',
            fontWeight: '700',
            color: C.navy,
            marginBottom: '8px',
          }}>
            {lang === 'fr' ? 'Nos Catégories' : '我们的类别'}
          </h2>
          <p style={{ textAlign: 'center', color: C.gray500, marginBottom: '40px', fontSize: '15px' }}>
            {lang === 'fr' ? 'Des équipements de qualité pro pour les DOM-TOM' : '为海外省提供专业级设备'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {CATEGORIES.map(cat => (
              <a
                key={cat.id}
                href={cat.path}
                style={{
                  textDecoration: 'none',
                  background: C.white,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: hoveredCat === cat.id
                    ? '0 20px 40px rgba(0,0,0,0.12)'
                    : '0 4px 16px rgba(0,0,0,0.06)',
                  transition: 'all 300ms',
                  transform: hoveredCat === cat.id ? 'translateY(-4px)' : 'none',
                  display: 'block',
                }}
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                {/* Image */}
                <div style={{
                  height: '160px',
                  background: cat.bgColor,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img
                    src={cat.image}
                    alt={cat.title_fr}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 700ms',
                      transform: hoveredCat === cat.id ? 'scale(1.08)' : 'scale(1)',
                    }}
                    onError={e => {
                      const el = e.target as HTMLImageElement
                      el.style.display = 'none'
                      el.parentElement!.style.display = 'flex'
                      el.parentElement!.style.alignItems = 'center'
                      el.parentElement!.style.justifyContent = 'center'
                      el.parentElement!.innerHTML = `<span style="font-size:48px">${cat.icon}</span>`
                    }}
                  />
                </div>

                {/* Texte */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      background: cat.bgColor,
                      color: cat.color,
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                    }}>
                      {cat.icon}
                    </span>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: C.navy,
                    }}>
                      {lang === 'fr' ? cat.title_fr : cat.title_zh}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: C.gray500, margin: 0, lineHeight: '1.5' }}>
                    {lang === 'fr' ? cat.desc_fr : cat.desc_zh}
                  </p>
                  <div style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {lang === 'fr' ? 'Voir la gamme' : '查看系列'} →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARGUMENTS DE CONFIANCE ───────────────────── */}
      <section style={{ background: C.white, padding: '64px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '26px',
            fontWeight: '700',
            color: C.navy,
            marginBottom: '40px',
          }}>
            {lang === 'fr' ? 'Pourquoi choisir 97import.com ?' : '为什么选择97import.com？'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {TRUST.map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '32px 24px',
                background: C.gray50,
                borderRadius: '16px',
                border: `1px solid ${C.gray200}`,
              }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, marginBottom: '10px' }}>
                  {lang === 'fr' ? item.title_fr : item.title_zh}
                </h3>
                <p style={{ fontSize: '13px', color: C.gray600, lineHeight: '1.6', margin: 0 }}>
                  {lang === 'fr' ? item.desc_fr : item.desc_zh}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA WHATSAPP ─────────────────────────────── */}
      <section style={{ background: C.navy, padding: '48px 32px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>
          {lang === 'fr' ? 'Un projet ? Contactez-nous' : '有项目？联系我们'}
        </h2>
        <p style={{ color: '#CBD5E1', marginBottom: '24px', fontSize: '14px' }}>
          {lang === 'fr'
            ? '+33 6 63 28 49 08 / +33 6 20 60 74 48'
            : '+33 6 63 28 49 08 / +33 6 20 60 74 48'}
        </p>
        <a
          href="https://wa.me/33663284908"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#25D366',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '15px',
            textDecoration: 'none',
          }}
        >
          💬 {lang === 'fr' ? 'WhatsApp' : 'WhatsApp联系'}
        </a>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{
        background: '#111827',
        color: '#9CA3AF',
        padding: '40px 32px',
        fontSize: '13px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
              97import.com
            </div>
            <div style={{ lineHeight: '1.8', maxWidth: '300px' }}>
              Spécialiste de l'importation depuis la Chine vers les DOM-TOM.
              Mini-pelles, maisons modulaires, panneaux solaires.
            </div>
            <div style={{ marginTop: '12px' }}>
              <a href="https://www.tiktok.com/@direxport" target="_blank" rel="noopener noreferrer"
                style={{ color: '#9CA3AF', textDecoration: 'none', marginRight: '12px' }}>
                TikTok
              </a>
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: '600', marginBottom: '8px' }}>Navigation</div>
            {['Mini-Pelles', 'Maisons', 'Solaire', 'Accessoires', 'Contact'].map(l => (
              <div key={l} style={{ marginBottom: '4px' }}>
                <a href={`/${l.toLowerCase()}`} style={{ color: '#9CA3AF', textDecoration: 'none' }}>
                  {l}
                </a>
              </div>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: '600', marginBottom: '8px' }}>Contact</div>
            <div>info@97import.com</div>
            <div>+33 6 63 28 49 08</div>
            <div style={{ marginTop: 6 }}>
              <a href="https://wa.me/33663284908" target="_blank" rel="noopener noreferrer"
                style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div style={{
          maxWidth: '1280px',
          margin: '24px auto 0',
          paddingTop: '20px',
          borderTop: '1px solid #1F2937',
          textAlign: 'center',
          fontSize: '12px',
        }}>
          © 2026 97import.com — Tous droits réservés — LUXENT LIMITED, UK
        </div>
      </footer>
    </div>
  )
}

