// src/front/components/PopupVerserAcompte.tsx
// Popup pour le client, déclenché APRÈS signature du devis VIP
// pour verser le 1er acompte. Réutilisable.

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { montantAcompte: number; typeCompte: 'perso' | 'pro' }) => void;
  totalDevis: number;         // montant total du devis pour suggérer un pourcentage
  restant?: number;           // solde restant si des acomptes ont déjà été versés
  // Props optionnelles
  title?: string;
  minAcomptePct?: number;     // minimum % (défaut : 10)
}

export default function PopupVerserAcompte({
  isOpen,
  onClose,
  onSubmit,
  totalDevis,
  restant,
  title = 'Versement d\'acompte',
  minAcomptePct = 10,
}: Props) {
  const [acomptePct, setAcomptePct] = useState<number>(30);
  const [typeCompte, setTypeCompte] = useState<'perso' | 'pro'>('perso');
  const [montantCustom, setMontantCustom] = useState<string>('');
  const [usePct, setUsePct] = useState(true);
  const [erreur, setErreur] = useState('');

  if (!isOpen) return null;

  const maxPayable = restant !== undefined ? restant : totalDevis;
  const montantCalcule = usePct
    ? Math.round((totalDevis * acomptePct) / 100)
    : parseFloat(montantCustom) || 0;

  function handleSubmit() {
    setErreur('');

    if (montantCalcule <= 0) {
      setErreur('Le montant doit être supérieur à 0.');
      return;
    }
    if (montantCalcule > maxPayable + 0.01) {
      setErreur(`Le montant ne peut pas dépasser ${maxPayable}€.`);
      return;
    }
    const minMontant = (totalDevis * minAcomptePct) / 100;
    if (montantCalcule < minMontant) {
      setErreur(`L'acompte minimum est de ${minMontant.toFixed(2)}€ (${minAcomptePct}%).`);
      return;
    }

    onSubmit({ montantAcompte: montantCalcule, typeCompte });
  }

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1E3A5F' }}>💰 {title}</h2>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={bodyStyle}>
          {/* Infos montants */}
          <div style={infoBoxStyle}>
            <div><strong>Total du devis :</strong> {totalDevis.toFixed(2)} €</div>
            {restant !== undefined && (
              <div><strong>Reste à payer :</strong> {restant.toFixed(2)} €</div>
            )}
          </div>

          {/* Type compte */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <label style={labelStyle}>Type de compte</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  checked={typeCompte === 'perso'}
                  onChange={() => setTypeCompte('perso')}
                  style={{ marginRight: 6 }}
                />
                Personnel
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  checked={typeCompte === 'pro'}
                  onChange={() => setTypeCompte('pro')}
                  style={{ marginRight: 6 }}
                />
                Professionnel
              </label>
            </div>
          </div>

          {/* Mode de saisie */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Mode de saisie</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  checked={usePct}
                  onChange={() => setUsePct(true)}
                  style={{ marginRight: 6 }}
                />
                Par pourcentage
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  checked={!usePct}
                  onChange={() => setUsePct(false)}
                  style={{ marginRight: 6 }}
                />
                Montant exact
              </label>
            </div>
          </div>

          {usePct ? (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Pourcentage : {acomptePct}%</label>
              <input
                type="range"
                min={minAcomptePct}
                max="100"
                step="5"
                value={acomptePct}
                onChange={e => setAcomptePct(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                <span>{minAcomptePct}%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Montant en € *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montantCustom}
                onChange={e => setMontantCustom(e.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>
          )}

          <div style={recapStyle}>
            <div>Montant acompte calculé :</div>
            <div style={recapValueStyle}>{montantCalcule.toFixed(2)} €</div>
          </div>

          {erreur && <div style={erreurStyle}>{erreur}</div>}
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={btnSecondaryStyle}>Annuler</button>
          <button onClick={handleSubmit} style={btnPrimaryStyle}>Confirmer le versement</button>
        </div>
      </div>
    </div>
  );
}

// Styles (mêmes que PopupSaisieRIB + quelques spécifiques)
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 10000, padding: 20,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, maxWidth: 500, width: '100%',
  maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
};
const closeBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', fontSize: 24,
  cursor: 'pointer', color: '#6B7280', padding: 0, lineHeight: 1,
};
const bodyStyle: React.CSSProperties = { padding: 20, flex: 1, overflowY: 'auto' };
const footerStyle: React.CSSProperties = {
  padding: '12px 20px', borderTop: '1px solid #E5E7EB',
  display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#F9FAFB',
};
const infoBoxStyle: React.CSSProperties = {
  padding: 12, background: '#F3F4F6', borderRadius: 6, fontSize: 13,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6,
};
const radioLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
  borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const recapStyle: React.CSSProperties = {
  marginTop: 16, padding: 12, background: '#EEF2FF',
  borderRadius: 6, display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', fontSize: 14,
};
const recapValueStyle: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, color: '#1565C0',
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
