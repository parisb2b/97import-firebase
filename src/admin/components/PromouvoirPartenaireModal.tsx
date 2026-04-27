import { useState } from 'react';
import { doc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../lib/firebaseUtils';
import { logInfo, logError } from '../../lib/logService';
import { useToast } from '../../front/components/Toast';

interface ClientLite {
  uid?: string;
  id?: string;
  email?: string;
  nom?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  prenom?: string;
}

interface Props {
  client: ClientLite;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromouvoirPartenaireModal({ client, onClose, onSuccess }: Props) {
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [commissionTaux, setCommissionTaux] = useState('0');
  const [ribIban, setRibIban] = useState('');
  const [ribBic, setRibBic] = useState('');
  const [ribBanque, setRibBanque] = useState('');
  const [ribBeneficiaire, setRibBeneficiaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const uid = client.uid || client.id || '';
  const nom = client.nom
    || client.displayName
    || `${client.firstName || client.prenom || ''} ${client.lastName || ''}`.trim()
    || client.email
    || 'Partenaire';

  const handleConfirm = async () => {
    setError('');
    const codeUpper = code.trim().toUpperCase();

    if (!uid) {
      setError("UID client introuvable.");
      return;
    }
    if (!/^[A-Z]{2,3}$/.test(codeUpper)) {
      setError('Le code doit contenir 2 ou 3 lettres en majuscules.');
      return;
    }

    setSubmitting(true);
    try {
      const existingQ = query(collection(db, 'partners'), where('code', '==', codeUpper));
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        setError(`Le code "${codeUpper}" est déjà utilisé.`);
        setSubmitting(false);
        return;
      }

      await updateDoc(doc(db, 'users', uid), { role: 'partner' });

      await setDoc(
        doc(db, 'partners', uid),
        sanitizeForFirestore({
          uid,
          userId: uid,
          nom,
          email: client.email || '',
          code: codeUpper,
          commission_taux: parseFloat(commissionTaux) || 0,
          rib: {
            iban: ribIban.trim(),
            bic: ribBic.trim(),
            banque: ribBanque.trim(),
            beneficiaire: ribBeneficiaire.trim() || nom,
          },
          actif: true,
          createdAt: new Date(),
        }),
      );

      logInfo('partner-promoted', 'Client promu en partenaire', { uid, code: codeUpper });
      showToast(`Partenaire ${codeUpper} créé avec succès`, 'success');
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logError('partner-promoted', 'Échec promotion partenaire', { uid, code: codeUpper }, err);
      setError(`Erreur : ${msg}`);
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(11,37,69,.6)',
        backdropFilter: 'blur(4px)', zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: 28,
          width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,.28)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 8 }}>⭐</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>
          Promouvoir en partenaire
        </h2>
        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 18 }}>
          {nom} ({client.email || '—'})
          <br />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>UID : {uid}</span>
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>Code partenaire (2-3 lettres MAJ)</label>
            <input
              style={inputStyle}
              placeholder="Ex : IMP, ALC, JD"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
            />
          </div>

          <div>
            <label style={labelStyle}>Taux de commission (%)</label>
            <input
              type="number"
              step="0.1"
              style={inputStyle}
              value={commissionTaux}
              onChange={(e) => setCommissionTaux(e.target.value)}
            />
          </div>

          <div style={{ borderTop: '1px solid #E8ECF4', paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              RIB partenaire (versement commissions)
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={labelStyle}>IBAN</label>
                <input style={inputStyle} placeholder="FR76..." value={ribIban} onChange={(e) => setRibIban(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>BIC / SWIFT</label>
                <input style={inputStyle} value={ribBic} onChange={(e) => setRibBic(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Banque</label>
                <input style={inputStyle} value={ribBanque} onChange={(e) => setRibBanque(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Bénéficiaire (laisser vide = nom du partenaire)</label>
                <input style={inputStyle} value={ribBeneficiaire} onChange={(e) => setRibBeneficiaire(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 14, padding: 10, background: '#FEE2E2', border: '1px solid #FCA5A5',
            borderRadius: 8, color: '#991B1B', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1, padding: 12, background: 'transparent', color: '#6B7280',
              border: '1.5px solid #CBD5E1', borderRadius: 10, fontSize: 14, cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || !code}
            style={{
              flex: 2, padding: 12,
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting || !code ? 0.6 : 1,
            }}
          >
            {submitting ? 'Promotion en cours…' : '⭐ Promouvoir partenaire'}
          </button>
        </div>
      </div>
    </div>
  );
}
