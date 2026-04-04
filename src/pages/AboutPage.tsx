import { Link } from 'wouter'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

const STATS = [
  { value: '200+', label: 'Clients satisfaits' },
  { value: '500+', label: 'Produits livrés' },
  { value: '5', label: 'Territoires desservis' },
  { value: '2024', label: 'Année de création' },
]

const VALUES = [
  { icon: '🤝', title: 'Transparence', desc: 'Des prix clairs, sans surprise. Vous savez exactement ce que vous payez.' },
  { icon: '✅', title: 'Qualité', desc: 'Chaque produit est inspecté avant expédition pour garantir votre satisfaction.' },
  { icon: '🌍', title: 'Proximité', desc: 'Basés dans les DOM-TOM, nous comprenons vos besoins spécifiques.' },
  { icon: '⚡', title: 'Réactivité', desc: 'Un interlocuteur dédié pour répondre à toutes vos questions rapidement.' },
]

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: C.navy, fontSize: '2.2rem', marginBottom: '0.8rem' }}>
          Qui sommes-nous ?
        </h1>
        <p style={{ color: C.gray, maxWidth: '700px', margin: '0 auto', lineHeight: 1.7, fontSize: '1.05rem' }}>
          <strong style={{ color: C.navy }}>97import</strong> est spécialisé dans l'importation directe
          de produits industriels et de construction depuis la Chine vers les DOM-TOM.
          Mini-pelles, maisons modulaires, kits solaires, accessoires : nous sélectionnons
          les meilleurs produits à des prix compétitifs pour les professionnels et particuliers d'outre-mer.
        </p>
      </section>

      {/* Stats */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
        marginBottom: '3rem',
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: C.navy, color: C.white, borderRadius: '12px',
            padding: '1.5rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: C.orange }}>{s.value}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.3rem' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.5rem', marginBottom: '1rem' }}>Notre mission</h2>
        <div style={{
          background: C.light, borderRadius: '12px', padding: '2rem',
          borderLeft: `4px solid ${C.green}`,
        }}>
          <p style={{ color: C.navy, margin: 0, lineHeight: 1.7, fontSize: '1.05rem' }}>
            Rendre accessible aux territoires d'outre-mer des équipements de qualité
            à des prix justes, en supprimant les intermédiaires inutiles.
            Nous travaillons directement avec les fabricants chinois pour vous offrir
            le meilleur rapport qualité-prix, avec un accompagnement de A à Z :
            du sourcing au dédouanement, en passant par le transport maritime.
          </p>
        </div>
      </section>

      {/* Values */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Nos valeurs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {VALUES.map(v => (
            <div key={v.title} style={{
              background: C.white, borderRadius: '12px', padding: '1.5rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{v.icon}</div>
              <h3 style={{ color: C.navy, margin: '0 0 0.4rem 0', fontSize: '1.1rem' }}>{v.title}</h3>
              <p style={{ color: C.gray, margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.5rem', marginBottom: '1rem' }}>Notre équipe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { name: 'Direction', role: 'Fondateur & Gérant', icon: '👔' },
            { name: 'Bureau Chine', role: 'Sourcing & Qualité', icon: '🏗️' },
            { name: 'Support Client', role: 'Relation client DOM-TOM', icon: '🎧' },
          ].map(m => (
            <div key={m.role} style={{
              background: C.light, borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
            }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: C.navy, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '2rem', margin: '0 auto 0.8rem',
              }}>{m.icon}</div>
              <h3 style={{ color: C.navy, margin: '0 0 0.2rem 0', fontSize: '1.05rem' }}>{m.name}</h3>
              <p style={{ color: C.gray, margin: 0, fontSize: '0.9rem' }}>{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{
        background: C.green, borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: C.white,
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Un projet ? Parlons-en !</h2>
        <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
          Notre équipe est disponible pour étudier votre besoin et vous proposer la meilleure solution.
        </p>
        <Link href="/contact">
          <a style={{
            display: 'inline-block', background: C.orange, color: C.white,
            padding: '0.85rem 2rem', borderRadius: '8px', textDecoration: 'none',
            fontWeight: 700, fontSize: '1rem',
          }}>
            Nous contacter
          </a>
        </Link>
      </div>
    </div>
  )
}
