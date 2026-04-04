import { Link } from 'wouter'
import { useLang } from '@/contexts/LanguageContext'

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'
const ORANGE = '#E8913A'

const PRODUITS = [
  {
    id: 'tracteur-compact',
    nom_fr: 'Tracteur Compact',
    nom_zh: '紧凑型拖拉机',
    desc_fr: 'Tracteur compact idéal pour les petites exploitations DOM-TOM. Puissance 35-60 CV.',
    desc_zh: '适合DOM-TOM小农场的紧凑型拖拉机，功率35-60马力。',
    image: '/images/portal/agri_tractor.jpg',
    prix: '12 500 € HT',
  },
  {
    id: 'motoculteur',
    nom_fr: 'Motoculteur Pro',
    nom_zh: '专业旋耕机',
    desc_fr: 'Motoculteur professionnel pour la préparation des sols tropicaux.',
    desc_zh: '适合热带土壤的专业旋耕机。',
    image: '/images/portal/agri_tractor.jpg',
    prix: '2 800 € HT',
  },
  {
    id: 'remorque-agricole',
    nom_fr: 'Remorque Agricole',
    nom_zh: '农用拖车',
    desc_fr: 'Remorque 3T benne basculante, idéale pour le transport de récoltes.',
    desc_zh: '3吨自卸拖车，适合农作物运输。',
    image: '/images/portal/agri_tractor.jpg',
    prix: '3 200 € HT',
  },
]

export default function AgriculturePage() {
  const { lang } = useLang()

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#374151' }}>

      {/* Hero */}
      <section style={{
        background: `linear-gradient(135deg, ${NAVY}, #2D4A7A)`,
        padding: '60px 32px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(232,145,58,0.2)',
            border: `1px solid ${ORANGE}`,
            borderRadius: 20,
            padding: '4px 16px',
            fontSize: 12,
            fontWeight: 700,
            color: ORANGE,
            marginBottom: 20,
            letterSpacing: '0.8px',
            textTransform: 'uppercase' as const,
          }}>
            🚜 {lang === 'fr' ? 'Machines Agricoles' : '农业机械'}
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 16px' }}>
            {lang === 'fr' ? 'Équipements Agricoles DOM-TOM' : 'DOM-TOM农业设备'}
          </h1>
          <p style={{ fontSize: 17, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
            {lang === 'fr'
              ? 'Tracteurs, motoculteurs et équipements agricoles adaptés aux conditions tropicales. Livraison directe depuis la Chine.'
              : '适应热带条件的拖拉机、旋耕机和农业设备，直接从中国发货。'}
          </p>
        </div>
      </section>

      {/* Produits */}
      <section style={{ background: '#F9FAFB', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 40 }}>
            {lang === 'fr' ? 'Notre gamme agricole' : '我们的农业系列'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {PRODUITS.map(prod => (
              <div key={prod.id} style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}>
                <div style={{ height: 200, overflow: 'hidden' }}>
                  <img
                    src={prod.image}
                    alt={prod.nom_fr}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).src = '/images/portal/agri_tractor.jpg' }}
                  />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>
                    {lang === 'fr' ? prod.nom_fr : prod.nom_zh}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '0 0 16px' }}>
                    {lang === 'fr' ? prod.desc_fr : prod.desc_zh}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: GREEN }}>{prod.prix}</span>
                    <a
                      href={`https://wa.me/33663284908?text=${encodeURIComponent(`Bonjour, je suis intéressé par ${prod.nom_fr}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#25D366',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      💬 Devis
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: NAVY, padding: '48px 32px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>
          {lang === 'fr' ? 'Besoin d\'un devis personnalisé ?' : '需要个性化报价？'}
        </h2>
        <p style={{ color: '#CBD5E1', marginBottom: 24, fontSize: 14 }}>
          {lang === 'fr' ? 'Contactez-nous via WhatsApp pour un devis rapide' : '通过WhatsApp联系我们获取快速报价'}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://wa.me/33663284908"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#25D366',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            💬 WhatsApp
          </a>
          <Link href="/contact" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '12px 28px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
          }}>
            {lang === 'fr' ? 'Formulaire contact' : '联系表单'}
          </Link>
        </div>
      </section>
    </div>
  )
}
