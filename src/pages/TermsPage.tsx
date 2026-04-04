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

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '0.5rem' }}>
        Conditions Générales de Vente
      </h1>
      <p style={{ color: C.gray, marginBottom: '2rem' }}>
        Les présentes CGV régissent les ventes de produits par 97import / DOM-TOM Import
        à destination des DOM-TOM français.
      </p>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 1 — Objet</h2>
        <p style={pStyle}>
          Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations
          des parties dans le cadre de la vente de produits importés proposés par 97import
          sur le site 97import.com. Toute commande implique l'acceptation pleine et entière
          des présentes CGV.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 2 — Produits</h2>
        <p style={pStyle}>
          Les produits proposés à la vente sont décrits sur le site avec la plus grande exactitude possible.
          Les photographies sont non contractuelles. 97import se réserve le droit de modifier
          ses gammes de produits à tout moment.
        </p>
        <p style={pStyle}>
          Les produits sont importés de Chine et incluent notamment : mini-pelles, maisons modulaires,
          kits solaires et accessoires divers.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 3 — Commandes</h2>
        <p style={pStyle}>
          La commande se fait par demande de devis via le site ou par contact direct.
          Une commande est considérée comme ferme après acceptation du devis par le client
          et réception de l'acompte convenu. 97import se réserve le droit de refuser toute
          commande pour des motifs légitimes.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 4 — Prix</h2>
        <p style={pStyle}>
          Les prix sont indiqués en euros (EUR) hors taxes (HT). Les prix n'incluent pas
          les frais de transport maritime, d'assurance, de dédouanement, ni les taxes locales.
        </p>
        <p style={pStyle}>
          <strong>Spécificités DOM-TOM :</strong> les produits livrés dans les DOM-TOM sont soumis
          à l'octroi de mer et à la TVA locale au taux applicable (8,5 % en Martinique et Guadeloupe).
          Ces taxes sont à la charge de l'acheteur et ne sont pas incluses dans nos prix.
        </p>
        <p style={pStyle}>
          Les frais de douane et de dédouanement sont variables et estimés sur le devis.
          Le montant définitif dépend de la classification douanière des produits.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 5 — Paiement</h2>
        <p style={pStyle}>
          Le paiement s'effectue selon les modalités suivantes :
        </p>
        <ul style={{ color: C.gray, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li>Acompte de 30 % à la commande (non remboursable après lancement de la fabrication)</li>
          <li>40 % avant expédition, après validation du contrôle qualité</li>
          <li>Solde de 30 % à la réception de la marchandise</li>
        </ul>
        <p style={pStyle}>
          Les paiements sont acceptés par virement bancaire. D'autres modes de paiement
          peuvent être convenus au cas par cas.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 6 — Livraison</h2>
        <p style={pStyle}>
          Les délais de livraison sont donnés à titre indicatif et comprennent :
        </p>
        <ul style={{ color: C.gray, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li>Fabrication : 2 à 4 semaines selon le produit</li>
          <li>Transport maritime : 4 à 6 semaines selon la destination</li>
          <li>Dédouanement : variable selon le port d'arrivée</li>
        </ul>
        <p style={pStyle}>
          Le transfert de risques s'opère au départ du port chinois (conditions FOB).
          Une assurance transport est incluse dans nos devis.
        </p>
        <p style={pStyle}>
          Tout retard de livraison ne pourra donner lieu à des dommages et intérêts ou
          à l'annulation de la commande, sauf si le retard excède 30 jours au-delà
          de la date estimée.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 7 — Réception et réclamations</h2>
        <p style={pStyle}>
          Le client doit vérifier l'état de la marchandise à la réception et émettre
          des réserves écrites auprès du transporteur en cas de dommages apparents.
          Toute réclamation doit être adressée à 97import dans les 7 jours suivant la réception,
          accompagnée de photos et d'une description détaillée.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 8 — Retours et annulations</h2>
        <p style={pStyle}>
          En raison de la nature des produits (importation sur commande), le droit de rétractation
          de 14 jours ne s'applique pas aux commandes personnalisées ou fabriquées sur mesure,
          conformément à l'article L221-28 du Code de la consommation.
        </p>
        <p style={pStyle}>
          Pour les produits en stock, un retour est possible dans les 14 jours suivant la réception,
          à condition que le produit soit dans son état d'origine. Les frais de retour sont
          à la charge de l'acheteur.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 9 — Garantie</h2>
        <p style={pStyle}>
          Les produits bénéficient de la garantie légale de conformité (articles L217-4 et suivants
          du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants
          du Code civil).
        </p>
        <p style={pStyle}>
          En complément, une garantie constructeur est applicable selon les conditions propres
          à chaque fabricant (durée et couverture précisées sur le devis).
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 10 — Responsabilité</h2>
        <p style={pStyle}>
          La responsabilité de 97import ne saurait être engagée en cas de force majeure,
          de retard dû au transport international, de blocage en douane ou de tout événement
          indépendant de sa volonté. La responsabilité de 97import est limitée au montant
          de la commande concernée.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 11 — Données personnelles</h2>
        <p style={pStyle}>
          Les données collectées sont traitées conformément à notre{' '}
          <a href="/confidentialite" style={{ color: C.green }}>Politique de confidentialité</a> et
          au Règlement Général sur la Protection des Données (RGPD).
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 12 — Droit applicable et litiges</h2>
        <p style={pStyle}>
          Les présentes CGV sont soumises au droit français. En cas de litige,
          une solution amiable sera recherchée en priorité. A défaut, les tribunaux
          compétents du ressort du siège social de 97import seront seuls compétents.
        </p>
        <p style={pStyle}>
          Conformément à l'article L612-1 du Code de la consommation, le client peut recourir
          à un médiateur de la consommation en cas de litige non résolu.
        </p>
      </div>

      <p style={{ color: C.gray, fontSize: '0.8rem', marginTop: '2rem', fontStyle: 'italic' }}>
        Dernière mise à jour : Avril 2026
      </p>
    </div>
  )
}
