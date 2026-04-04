const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  light: '#F5F5F5',
  gray: '#6B7280',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '2rem',
}

const h2Style: React.CSSProperties = {
  color: C.navy, fontSize: '1.2rem', marginBottom: '0.8rem',
  borderBottom: `2px solid ${C.green}`, paddingBottom: '0.4rem',
}

const pStyle: React.CSSProperties = {
  color: C.gray, lineHeight: 1.7, margin: '0 0 0.5rem 0', fontSize: '0.95rem',
}

export default function LegalPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '2rem' }}>Mentions légales</h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Editeur du site</h2>
        <p style={pStyle}>
          <strong>Raison sociale :</strong> 97import / DOM-TOM Import<br />
          <strong>Forme juridique :</strong> SAS<br />
          <strong>Capital social :</strong> [A compléter]<br />
          <strong>Siège social :</strong> [Adresse complète], Martinique, France<br />
          <strong>SIRET :</strong> [Numéro SIRET]<br />
          <strong>RCS :</strong> [Numéro RCS]<br />
          <strong>Numéro TVA intracommunautaire :</strong> [Numéro TVA]
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Directeur de la publication</h2>
        <p style={pStyle}>
          [Nom du directeur de la publication]<br />
          Email : contact@97import.com
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Hébergement</h2>
        <p style={pStyle}>
          <strong>Hébergeur :</strong> Vercel Inc.<br />
          <strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
          <strong>Site web :</strong> https://vercel.com
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Propriété intellectuelle</h2>
        <p style={pStyle}>
          L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, icônes)
          est la propriété exclusive de 97import / DOM-TOM Import ou de ses partenaires,
          et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
        </p>
        <p style={pStyle}>
          Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie
          des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans
          autorisation écrite préalable de 97import.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Protection des données personnelles (RGPD)</h2>
        <p style={pStyle}>
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
          Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez d'un droit d'accès,
          de rectification, de suppression et d'opposition aux données personnelles vous concernant.
        </p>
        <p style={pStyle}>
          Pour exercer ces droits, vous pouvez nous contacter :<br />
          <strong>Email :</strong> contact@97import.com<br />
          <strong>Courrier :</strong> 97import, [Adresse complète], Martinique, France
        </p>
        <p style={pStyle}>
          Pour plus d'informations, consultez notre{' '}
          <a href="/confidentialite" style={{ color: C.green, textDecoration: 'underline' }}>
            Politique de confidentialité
          </a>.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Cookies</h2>
        <p style={pStyle}>
          Ce site utilise des cookies techniques nécessaires à son fonctionnement
          ainsi que des cookies d'analyse d'audience. Vous pouvez paramétrer vos préférences
          de cookies à tout moment via les paramètres de votre navigateur.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Limitation de responsabilité</h2>
        <p style={pStyle}>
          97import s'efforce de fournir sur le site des informations aussi précises que possible.
          Toutefois, elle ne pourra être tenue responsable des omissions, inexactitudes ou carences
          dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Droit applicable</h2>
        <p style={pStyle}>
          Le présent site et ses mentions légales sont régis par le droit français.
          En cas de litige, les tribunaux français seront compétents.
        </p>
      </div>

      <p style={{ color: C.gray, fontSize: '0.8rem', marginTop: '2rem', fontStyle: 'italic' }}>
        Dernière mise à jour : Avril 2026
      </p>
    </div>
  )
}
