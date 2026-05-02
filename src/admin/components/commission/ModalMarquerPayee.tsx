import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '@/lib/firebase';

interface Props {
  commission: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalMarquerPayee({ commission, onClose, onSuccess }: Props) {
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  );
  const [methode, setMethode] = useState<'virement' | 'cheque' | 'especes' | 'autre'>('virement');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!reference.trim() && methode !== 'especes') {
      alert('⚠️ La référence est recommandée pour traçabilité (ignorer uniquement si paiement en espèces)');
      if (!confirm('Continuer sans référence ?')) return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'commissions', commission.id), {
        statut: 'payee',
        paiement: {
          date: datePaiement,
          methode,
          reference: reference.trim() || null,
          note: note.trim() || null,
          marque_paye_at: serverTimestamp(),
        },
        updated_at: serverTimestamp(),
      });
      alert('✅ Commission marquée comme payée');
      onSuccess();
    } catch (err: any) {
      alert('❌ Erreur : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16,
          width: '100%', maxWidth: 500,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 20, borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1565C0' }}>
            Marquer comme payée
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            {commission.numero} — {commission.partenaire_nom} — {commission.total_commission?.toFixed(2)} €
          </p>
        </div>

        <div style={{ padding: 20 }}>
          {/* Date paiement */}
          <Field label="Date du paiement *">
            <input
              type="date"
              value={datePaiement}
              onChange={e => setDatePaiement(e.target.value)}
              style={inputStyle}
            />
          </Field>

          {/* Méthode */}
          <div style={{ marginTop: 16 }}>
            <Field label="Méthode de paiement *">
              <select
                value={methode}
                onChange={e => setMethode(e.target.value as any)}
                style={inputStyle}
              >
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
          </div>

          {/* Référence */}
          <div style={{ marginTop: 16 }}>
            <Field
              label={
                methode === 'virement' ? 'Référence virement (recommandé)' :
                methode === 'cheque' ? 'Numéro du chèque' :
                methode === 'especes' ? 'Reçu de caisse (optionnel)' :
                'Référence paiement'
              }
            >
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder={
                  methode === 'virement' ? 'Ex: VIR-20260421-12345' :
                  methode === 'cheque' ? 'Ex: 1234567' :
                  'Ex: REÇU-001'
                }
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Note optionnelle */}
          <div style={{ marginTop: 16 }}>
            <Field label="Note (optionnel)">
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Informations complémentaires..."
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              />
            </Field>
          </div>
        </div>

        <div style={{
          padding: 16,
          borderTop: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: '#F9FAFB',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', background: '#fff',
              color: '#374151', border: '1px solid #E5E7EB',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saving ? '#D1D5DB' : '#10B981',
              color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Enregistrement...' : '✓ Confirmer le paiement'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, color: '#6B7280',
        marginBottom: 6, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E5E7EB', borderRadius: 10,
  fontSize: 14, background: '#fff',
  fontFamily: 'inherit', color: '#111827',
  outline: 'none', boxSizing: 'border-box',
};
