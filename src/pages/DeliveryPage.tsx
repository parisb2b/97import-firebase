import { Link } from 'wouter'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
}

const SHIPPING = [
  { dest: 'Martinique', c20: '5 500 €', c40: '9 500 €' },
  { dest: 'Guadeloupe', c20: '5 000 €', c40: '8 500 €' },
  { dest: 'Guyane', c20: 'Sur devis', c40: 'Sur devis' },
  { dest: 'Réunion', c20: 'Sur devis', c40: 'Sur devis' },
  { dest: 'Mayotte', c20: 'Sur devis', c40: 'Sur devis' },
]

const STEPS = [
  { num: '1', title: 'Commande', desc: 'Validation de votre devis et paiement de l\'acompte', icon: '📋' },
  { num: '2', title: 'Fabrication', desc: '2 à 4 semaines de production en usine', icon: '🏭' },
  { num: '3', title: 'Transport maritime', desc: '4 à 6 semaines de transit depuis la Chine', icon: '🚢' },
  { num: '4', title: 'Dédouanement', desc: 'Formalités douanières à l\'arrivée', icon: '📦' },
  { num: '5', title: 'Livraison', desc: 'Acheminement jusqu\'à votre adresse', icon: '🚛' },
]

const FAQ = [
  {
    q: 'Combien de temps prend une livraison complète ?',
    a: 'En moyenne, comptez 6 à 10 semaines entre la validation de votre commande et la livraison, selon la destination et la disponibilité du produit.',
  },
  {
    q: 'Les frais de douane sont-ils inclus ?',
    a: 'Non, les frais de douane et taxes (octroi de mer, TVA locale) sont à la charge de l\'acheteur. Nous vous fournissons tous les documents nécessaires au dédouanement.',
  },
  {
    q: 'Puis-je grouper plusieurs produits dans un même conteneur ?',
    a: 'Oui, c\'est même recommandé ! Le groupage permet de réduire significativement le coût de transport par produit.',
  },
  {
    q: 'Que se passe-t-il en cas de dommage pendant le transport ?',
    a: 'Tous nos envois sont assurés. En cas de dommage constaté à la livraison, nous prenons en charge le remplacement ou la réparation.',
  },
  {
    q: 'Livrez-vous en métropole ?',
    a: 'Notre spécialité est le DOM-TOM, mais nous pouvons étudier une livraison en métropole sur demande. Contactez-nous pour un devis.',
  },
]

export default function DeliveryPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '0.5rem' }}>Livraison & Transport</h1>
      <p style={{ color: C.gray, marginBottom: '2.5rem', maxWidth: '700px' }}>
        Nous assurons le transport maritime de vos marchandises depuis la Chine jusqu'aux territoires d'outre-mer.
      </p>

      {/* Shipping table */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.4rem', marginBottom: '1rem' }}>Tarifs transport maritime</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', background: C.white,
            borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            <thead>
              <tr style={{ background: C.navy, color: C.white }}>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontWeight: 600 }}>Destination</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 600 }}>Conteneur 20 pieds</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 600 }}>Conteneur 40 pieds</th>
              </tr>
            </thead>
            <tbody>
              {SHIPPING.map((row, i) => (
                <tr key={row.dest} style={{ background: i % 2 ? C.light : C.white }}>
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: C.navy }}>{row.dest}</td>
                  <td style={{ padding: '0.8rem 1rem', textAlign: 'center', color: row.c20 === 'Sur devis' ? C.orange : C.green, fontWeight: 600 }}>{row.c20}</td>
                  <td style={{ padding: '0.8rem 1rem', textAlign: 'center', color: row.c40 === 'Sur devis' ? C.orange : C.green, fontWeight: 600 }}>{row.c40}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: C.gray, fontSize: '0.85rem', marginTop: '0.8rem' }}>
          * Tarifs indicatifs HT, susceptibles de varier selon le volume et la période. Contactez-nous pour un devis précis.
        </p>
      </section>

      {/* Process steps */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.4rem', marginBottom: '1.5rem' }}>Le processus de livraison</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                background: C.white, borderRadius: '12px', padding: '1.2rem',
                textAlign: 'center', minWidth: '140px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `2px solid ${C.navy}10`,
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{step.icon}</div>
                <div style={{
                  background: C.green, color: C.white, width: '28px', height: '28px',
                  borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem',
                }}>{step.num}</div>
                <h3 style={{ color: C.navy, margin: '0.3rem 0', fontSize: '1rem' }}>{step.title}</h3>
                <p style={{ color: C.gray, margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span style={{ color: C.navy, fontSize: '1.5rem', opacity: 0.3 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: C.navy, fontSize: '1.4rem', marginBottom: '1rem' }}>Questions fréquentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {FAQ.map(item => (
            <details key={item.q} style={{
              background: C.white, borderRadius: '10px', padding: '1rem 1.2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer',
            }}>
              <summary style={{ color: C.navy, fontWeight: 600, fontSize: '1rem', listStyle: 'none' }}>
                {item.q}
              </summary>
              <p style={{ color: C.gray, marginTop: '0.8rem', marginBottom: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{
        background: C.navy, borderRadius: '12px', padding: '2.5rem',
        textAlign: 'center', color: C.white,
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Besoin d'un devis personnalisé ?</h2>
        <p style={{ opacity: 0.85, marginBottom: '1.5rem' }}>
          Contactez-nous pour obtenir un devis gratuit et sans engagement.
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
