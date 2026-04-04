const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  gray: '#6B7280',
}

const h2Style: React.CSSProperties = {
  color: C.navy, fontSize: '1.2rem', marginBottom: '0.8rem',
  borderBottom: `2px solid ${C.green}`, paddingBottom: '0.4rem',
}

const pStyle: React.CSSProperties = {
  color: C.gray, lineHeight: 1.7, margin: '0 0 0.5rem 0', fontSize: '0.95rem',
}

const sectionStyle: React.CSSProperties = { marginBottom: '2rem' }

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '0.5rem' }}>Politique de confidentialité</h1>
      <p style={{ color: C.gray, marginBottom: '2rem' }}>
        97import s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit
        comment nous collectons, utilisons et protégeons vos données personnelles.
      </p>

      <div style={sectionStyle}>
        <h2 style={h2Style}>1. Responsable du traitement</h2>
        <p style={pStyle}>
          Le responsable du traitement des données est 97import / DOM-TOM Import,
          [adresse complète], Martinique, France.<br />
          Contact : contact@97import.com
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>2. Données collectées</h2>
        <p style={pStyle}>Nous collectons les données suivantes :</p>
        <ul style={{ color: C.gray, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
          <li><strong>Données de livraison :</strong> adresse postale, ville, code postal, pays</li>
          <li><strong>Données de navigation :</strong> adresse IP, type de navigateur, pages consultées</li>
          <li><strong>Données de commande :</strong> historique d'achats, devis demandés</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>3. Finalités du traitement</h2>
        <p style={pStyle}>Vos données sont utilisées pour :</p>
        <ul style={{ color: C.gray, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li>La gestion de votre compte client</li>
          <li>Le traitement de vos commandes et demandes de devis</li>
          <li>L'envoi de communications commerciales (avec votre consentement)</li>
          <li>L'amélioration de nos services et de notre site</li>
          <li>Le respect de nos obligations légales</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>4. Base légale</h2>
        <p style={pStyle}>
          Le traitement de vos données repose sur : l'exécution d'un contrat (commandes),
          votre consentement (newsletter, cookies non essentiels), notre intérêt légitime
          (amélioration des services) et nos obligations légales (facturation, comptabilité).
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>5. Durée de conservation</h2>
        <p style={pStyle}>
          Vos données sont conservées pendant la durée de votre relation commerciale avec nous,
          augmentée de 3 ans à des fins de prospection. Les données de facturation sont conservées
          10 ans conformément aux obligations comptables.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>6. Cookies</h2>
        <p style={pStyle}>Notre site utilise les cookies suivants :</p>
        <ul style={{ color: C.gray, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (authentification, panier)</li>
          <li><strong>Cookies analytiques :</strong> mesure d'audience (Google Analytics) — désactivables</li>
          <li><strong>Cookies tiers :</strong> Firebase (authentification, base de données)</li>
        </ul>
        <p style={pStyle}>
          Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>7. Services tiers</h2>
        <p style={pStyle}>Nous utilisons les services tiers suivants :</p>
        <ul style={{ color: C.gray, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>Firebase (Google) :</strong> authentification, base de données, hébergement de fichiers</li>
          <li><strong>Vercel :</strong> hébergement du site web</li>
          <li><strong>WhatsApp (Meta) :</strong> service de messagerie client</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>8. Transfert de données</h2>
        <p style={pStyle}>
          Certaines données peuvent être transférées hors de l'Union européenne
          (services Firebase / Google Cloud, hébergement Vercel aux États-Unis).
          Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>9. Vos droits</h2>
        <p style={pStyle}>
          Conformément au RGPD, vous disposez des droits suivants :
        </p>
        <ul style={{ color: C.gray, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
          <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
          <li><strong>Droit à la limitation :</strong> demander la limitation du traitement</li>
        </ul>
        <p style={pStyle}>
          Pour exercer vos droits, contactez-nous à : <strong>contact@97import.com</strong>
        </p>
        <p style={pStyle}>
          Vous pouvez également introduire une réclamation auprès de la CNIL :
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: C.green, marginLeft: '0.3rem' }}>
            www.cnil.fr
          </a>
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>10. Sécurité</h2>
        <p style={pStyle}>
          Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées
          pour protéger vos données : chiffrement SSL/TLS, accès restreints,
          authentification sécurisée via Firebase Auth.
        </p>
      </div>

      <p style={{ color: C.gray, fontSize: '0.8rem', marginTop: '2rem', fontStyle: 'italic' }}>
        Dernière mise à jour : Avril 2026
      </p>
    </div>
  )
}
