const SERVICES = [
  { icon: '🚢', title: 'Fret Maritime', desc: 'Transport conteneur depuis Shanghai, Ningbo et Guangzhou vers les DOM-TOM. Groupage ou conteneur complet.' },
  { icon: '📋', title: 'Dedouanement', desc: 'Gestion des formalites douanieres, declaration en douane, droits et taxes. Tout est inclus dans nos devis.' },
  { icon: '🔧', title: 'Service & Coordination', desc: 'Suivi de A a Z, controle qualite en usine, interlocuteur unique. Vous ne gerez rien, on s\'occupe de tout.' },
  { icon: '📦', title: 'Importation Sur Mesure', desc: 'Tout produit depuis la Chine sur demande. Utilisez le formulaire "produit sur mesure" dans le panier.' },
  { icon: '💶', title: 'Devis Gratuit', desc: 'Generation automatique de devis. PDF envoye par email. Reponse sous 24h pour les demandes specifiques.' },
  { icon: '🛠', title: 'Service Apres-Vente', desc: 'Garantie constructeur, pieces detachees disponibles, support technique. Nous restons a vos cotes apres la livraison.' },
];

const DESTINATIONS = [
  { flag: '🇲🇶', name: 'Martinique', code: 'MQ' },
  { flag: '🇬🇵', name: 'Guadeloupe', code: 'GP' },
  { flag: '🇷🇪', name: 'Reunion', code: 'RE' },
  { flag: '🇬🇫', name: 'Guyane', code: 'GF' },
];

export default function Services() {
  return (
    <>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0B2545, #1E3A5F)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Nos Services</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
            Import clef en main de la Chine vers les DOM-TOM
          </p>
        </div>
      </div>

      {/* Services grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {SERVICES.map(s => (
            <div key={s.title} style={{
              background: 'white', borderRadius: 16, padding: 28,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <span style={{ fontSize: 36 }}>{s.icon}</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B2545', marginTop: 12, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Destinations */}
      <div style={{ background: '#F9FAFB', padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0B2545', textAlign: 'center', marginBottom: 32 }}>
            4 destinations DOM-TOM
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {DESTINATIONS.map(d => (
              <div key={d.code} style={{
                background: 'white', borderRadius: 16, padding: '24px 40px', textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minWidth: 160,
              }}>
                <span style={{ fontSize: 40 }}>{d.flag}</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0B2545', marginTop: 8 }}>{d.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{
          border: '1px solid #E5E7EB', borderRadius: 12, padding: 20,
          background: '#FFFBEB', fontSize: 13, color: '#92400E', lineHeight: 1.6, textAlign: 'center',
        }}>
          ⚠️ Les prix des frais logistiques sont indicatifs. Montant definitif a confirmer avec votre partenaire 97import.
        </div>
      </div>
    </>
  );
}
