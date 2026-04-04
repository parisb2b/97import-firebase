import { Link } from 'wouter'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

const SERVICES = [
  {
    icon: '🚢',
    title: 'Transport maritime',
    desc: 'Organisation complète du fret maritime depuis la Chine vers les DOM-TOM. Conteneurs 20 et 40 pieds, suivi en temps réel de votre cargaison.',
  },
  {
    icon: '✅',
    title: 'Garantie qualité',
    desc: 'Inspection en usine avant expédition, contrôle qualité rigoureux et photos de vérification envoyées avant chaque départ.',
  },
  {
    icon: '🎧',
    title: 'Support dédié',
    desc: 'Un interlocuteur unique pour chaque client. Disponible par téléphone, email et WhatsApp pour répondre à toutes vos questions.',
  },
  {
    icon: '📝',
    title: 'Devis gratuit',
    desc: 'Estimation détaillée sous 24-48h incluant le prix du produit, transport, assurance et frais estimés de dédouanement.',
  },
]

const SOURCING_STEPS = [
  { num: '01', title: 'Identification des fabricants', desc: 'Nous sélectionnons les usines certifiées avec un historique de production éprouvé.' },
  { num: '02', title: 'Négociation des prix', desc: 'Grâce à nos volumes et nos relations directes, nous obtenons les meilleurs tarifs.' },
  { num: '03', title: 'Échantillonnage', desc: 'Tests et validation des échantillons avant toute commande en série.' },
  { num: '04', title: 'Audit qualité', desc: 'Inspections régulières en usine pour maintenir nos standards.' },
]

export default function ServicesPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '0.5rem' }}>Nos Services</h1>
      <p style={{ color: C.gray, marginBottom: '2.5rem', maxWidth: '700px' }}>
        De la sélection du produit à la livraison chez vous, nous gérons tout le processus d'importation.
      </p>

      {/* Service cards */}
      <section style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '3rem',
      }}>
        {SERVICES.map(s => (
          <div key={s.title} style={{
            background: C.white, borderRadius: '12px', padding: '1.8rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderTop: `3px solid ${C.green}`,
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{s.icon}</div>
            <h3 style={{ color: C.navy, margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>{s.title}</h3>
            <p style={{ color: C.gray, margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>{s.desc}</p>
          </div>
        ))}
      </section>

      {/* Sourcing section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Comment nous sélectionnons nos produits
        </h2>
        <p style={{ color: C.gray, marginBottom: '1.5rem' }}>
          Notre bureau en Chine travaille directement avec les fabricants pour garantir qualité et prix compétitifs.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {SOURCING_STEPS.map(step => (
            <div key={step.num} style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              background: C.light, borderRadius: '10px', padding: '1.2rem',
            }}>
              <div style={{
                color: C.orange, fontSize: '1.8rem', fontWeight: 800,
                lineHeight: 1, minWidth: '40px',
              }}>{step.num}</div>
              <div>
                <h4 style={{ color: C.navy, margin: '0 0 0.3rem 0', fontSize: '1rem' }}>{step.title}</h4>
                <p style={{ color: C.gray, margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quality control */}
      <section style={{
        background: C.navy, borderRadius: '12px', padding: '2rem', marginBottom: '3rem', color: C.white,
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem' }}>Controle qualité</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {[
            { title: 'Avant production', desc: 'Vérification des matériaux et validation des spécifications techniques.' },
            { title: 'Pendant production', desc: 'Inspections intermédiaires pour s\'assurer du respect des normes.' },
            { title: 'Avant expédition', desc: 'Contrôle final avec photos et rapport d\'inspection détaillé.' },
          ].map(q => (
            <div key={q.title} style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1.2rem',
            }}>
              <h4 style={{ color: C.orange, margin: '0 0 0.4rem 0' }}>{q.title}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.5 }}>{q.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* After-sales */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.5rem', marginBottom: '1rem' }}>Service après-vente</h2>
        <div style={{
          background: C.light, borderRadius: '12px', padding: '2rem',
          borderLeft: `4px solid ${C.green}`,
        }}>
          <ul style={{ color: C.gray, lineHeight: 2, margin: 0, paddingLeft: '1.2rem', fontSize: '1rem' }}>
            <li>Garantie pièces et main d'oeuvre selon les conditions du fabricant</li>
            <li>Assistance technique par téléphone et WhatsApp</li>
            <li>Envoi de pièces détachées depuis notre stock ou directement depuis la Chine</li>
            <li>Réseau de techniciens partenaires dans les DOM-TOM</li>
            <li>Suivi personnalisé de chaque dossier SAV</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div style={{
        background: C.green, borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: C.white,
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Prêt à lancer votre projet ?</h2>
        <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
          Obtenez un devis gratuit et sans engagement sous 24 à 48 heures.
        </p>
        <Link href="/contact">
          <a style={{
            display: 'inline-block', background: C.orange, color: C.white,
            padding: '0.85rem 2rem', borderRadius: '8px', textDecoration: 'none',
            fontWeight: 700, fontSize: '1rem',
          }}>
            Demander un devis gratuit
          </a>
        </Link>
      </div>
    </div>
  )
}
