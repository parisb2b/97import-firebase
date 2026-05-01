// src/front/components/PopupSaisieRIB.tsx
// Popup réutilisable pour saisie du RIB client.
// Utilisé après signature du devis VIP pour débloquer le 1er acompte.

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { hasRib: boolean; iban?: string; bic?: string; nom_banque?: string }) => void;
  // Props optionnelles pour pré-remplir si RIB déjà saisi précédemment
  initialIban?: string;
  initialBic?: string;
  initialNomBanque?: string;
  // Texte/titre personnalisable selon contexte
  title?: string;
  description?: string;
}

export default function PopupSaisieRIB({
  isOpen,
  onClose,
  onSubmit,
  initialIban = '',
  initialBic = '',
  initialNomBanque = '',
  title = 'Informations bancaires',
  description = 'Merci de renseigner vos coordonnées bancaires pour la facturation.',
}: Props) {
  const [hasRib, setHasRib] = useState<boolean>(!!initialIban);
  const [iban, setIban] = useState(initialIban);
  const [bic, setBic] = useState(initialBic);
  const [nomBanque, setNomBanque] = useState(initialNomBanque);
  const [erreur, setErreur] = useState('');

  if (!isOpen) return null;

  function handleSubmit() {
    setErreur('');

    if (hasRib) {
      // Validation basique IBAN
      const ibanClean = iban.replace(/\s/g, '').toUpperCase();
      if (ibanClean.length < 15 || ibanClean.length > 34) {
        setErreur('L\'IBAN doit faire entre 15 et 34 caractères.');
        return;
      }
      if (!bic.trim()) {
        setErreur('Le BIC/SWIFT est obligatoire.');
        return;
      }
    }

    onSubmit({
      hasRib,
      iban: hasRib ? iban.replace(/\s/g, '').toUpperCase() : undefined,
      bic: hasRib ? bic.trim().toUpperCase() : undefined,
      nom_banque: hasRib ? nomBanque.trim() : undefined,
    });
  }

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1565C0' }}>🏦 {title}</h2>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={bodyStyle}>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 0 }}>{description}</p>

          <div style={choiceStyle}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                checked={hasRib}
                onChange={() => setHasRib(true)}
                style={{ marginRight: 8 }}
              />
              J'ai un RIB et je souhaite le communiquer
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                checked={!hasRib}
                onChange={() => setHasRib(false)}
                style={{ marginRight: 8 }}
              />
              Je le communiquerai plus tard
            </label>
          </div>

          {hasRib && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>IBAN *</label>
                <input
                  type="text"
                  value={iban}
                  onChange={e => setIban(e.target.value)}
                  placeholder="FR76 3000 4000 5000 6000 7000 123"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>BIC / SWIFT *</label>
                <input
                  type="text"
                  value={bic}
                  onChange={e => setBic(e.target.value)}
                  placeholder="BNPAFRPP"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom de la banque (optionnel)</label>
                <input
                  type="text"
                  value={nomBanque}
                  onChange={e => setNomBanque(e.target.value)}
                  placeholder="BNP Paribas"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {erreur && (
            <div style={erreurStyle}>{erreur}</div>
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={btnSecondaryStyle}>Annuler</button>
          <button onClick={handleSubmit} style={btnPrimaryStyle}>Valider</button>
        </div>
      </div>
    </div>
  );
}

// Styles inline
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 10000, padding: 20,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12,
  maxWidth: 500, width: '100%', maxHeight: '90vh',
  display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
};
const closeBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none',
  fontSize: 24, cursor: 'pointer', color: '#6B7280', padding: 0, lineHeight: 1,
};
const bodyStyle: React.CSSProperties = {
  padding: 20, flex: 1, overflowY: 'auto',
};
const footerStyle: React.CSSProperties = {
  padding: '12px 20px', borderTop: '1px solid #E5E7EB',
  display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#F9FAFB',
};
const choiceStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
  background: '#F9FAFB', borderRadius: 6,
};
const radioLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 14,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#374151', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #D1D5DB', borderRadius: 6,
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const erreurStyle: React.CSSProperties = {
  padding: 10, background: '#FEE2E2', borderLeft: '4px solid #DC2626',
  borderRadius: 4, marginTop: 12, color: '#991B1B', fontSize: 13,
};
const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 20px', background: '#1565C0', color: '#fff',
  border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
const btnSecondaryStyle: React.CSSProperties = {
  padding: '10px 20px', background: '#E5E7EB', color: '#374151',
  border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
