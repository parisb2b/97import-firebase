import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';
import { montantAcompteParDefaut } from '../../../lib/devisHelpers';
import { notifyAcompteDeclare } from '../../../lib/emailService';

interface Props {
  devisId: string;
  devisNumero: string;
  clientNom: string;
  onClose: () => void;
  onAcompteAdded: () => void;
}

const RIB_DATA = {
  perso: {
    label: 'Compte personnel',
    icon: '👤',
    banque: 'N26 Bank GmbH — Berlin',
    iban: 'DE93 1001 1001 2625 2584 23',
    bic: 'NTSBDEB1XXX',
  },
  pro: {
    label: 'Compte professionnel',
    icon: '🏢',
    banque: 'Banking Circle S.A. — Munich',
    iban: 'DE76 2022 0800 0059 5688 30',
    bic: 'SXPYDEHH',
  },
};

export default function PopupAcompte({ devisId, devisNumero, clientNom, onClose, onAcompteAdded }: Props) {
  const { showToast } = useToast();
  const [typeCompte, setTypeCompte] = useState<'perso' | 'pro'>('perso');
  const [montant, setMontant] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  const rib = RIB_DATA[typeCompte];

  // Calculer le montant par défaut adapté au solde restant
  useEffect(() => {
    const fetchDefaultMontant = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'quotes'), where('__name__', '==', devisId)));
        const devisData = snap.docs[0]?.data();
        if (devisData) {
          const defaultAmount = montantAcompteParDefaut(devisData);
          setMontant(defaultAmount);
        }
      } catch (err) {
        console.error('Error fetching devis for default montant:', err);
      }
    };
    fetchDefaultMontant();
  }, [devisId]);

  const handleConfirm = async () => {
    if (montant <= 0) { showToast('Montant invalide', 'error'); return; }
    setSubmitting(true);
    try {
      const devisRef = doc(db, 'quotes', devisId);
      const snap = await getDocs(query(collection(db, 'quotes'), where('__name__', '==', devisId)));
      const currentData = snap.docs[0]?.data();
      const currentAcomptes = currentData?.acomptes || [];

      const nouvelAcompte = {
        numero: 1,
        montant,
        date_reception: new Date().toISOString(),
        reference_virement: undefined,
        facture_acompte_numero: undefined,
        facture_acompte_pdf_url: undefined,
        is_solde: false,
        encaisse: false,
        created_at: new Date().toISOString(),
        created_by: 'client',
        type_compte: typeCompte,
        iban_utilise: rib.iban,
      };

      await updateDoc(devisRef, {
        acomptes: [...currentAcomptes, nouvelAcompte],
        updatedAt: new Date(),
      });

      // Notification email
      try {
        const devisData = { numero: devisNumero, ...currentData };
        await notifyAcompteDeclare(devisData, nouvelAcompte);
      } catch (err) {
        console.error('Erreur notification acompte déclaré:', err);
      }

      showToast(`Acompte de ${montant.toLocaleString('fr-FR')} € déclaré ✅`);
      onAcompteAdded();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la déclaration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,69,.6)', backdropFilter: 'blur(5px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 490, boxShadow: '0 24px 64px rgba(0,0,0,.28)' }}>
        <div style={{ fontSize: 26, marginBottom: 14 }}>🏦</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1565C0', marginBottom: 6 }}>Coordonnées bancaires</h2>
        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>Effectuez votre virement puis cliquez sur Confirmer.</p>

        {/* Type de compte */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Type de compte</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {(['perso', 'pro'] as const).map(type => (
            <div key={type} onClick={() => setTypeCompte(type)} style={{
              padding: 12, borderRadius: 12, border: `2px solid ${typeCompte === type ? '#0D9488' : '#E8ECF4'}`,
              background: typeCompte === type ? '#E0F2F1' : '#fff', cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{RIB_DATA[type].icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1565C0' }}>{RIB_DATA[type].label}</div>
            </div>
          ))}
        </div>

        {/* Montant */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#E0F2F1', border: '2px solid #26A69A', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#00897B', fontWeight: 600, flex: 1 }}>💶 Montant</label>
          <input type="number" value={montant} onChange={e => setMontant(Number(e.target.value))}
            style={{ width: 90, padding: '7px 10px', border: 'none', background: 'rgba(255,255,255,.8)', borderRadius: 8, fontSize: 17, fontWeight: 700, color: '#00897B', textAlign: 'center' }} />
          <span style={{ fontSize: 10, color: '#00897B', background: 'rgba(0,137,123,.12)', padding: '2px 8px', borderRadius: 20 }}>modifiable</span>
        </div>

        {/* RIB Card */}
        <div style={{ background: '#F5F7FA', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#1565C0', marginBottom: 12, fontSize: 14 }}>LUXENT LIMITED — {rib.label}</div>
          {[
            { k: 'IBAN', v: rib.iban },
            { k: 'BIC/SWIFT', v: rib.bic },
            { k: 'Banque', v: rib.banque },
            { k: 'Bénéficiaire', v: 'LUXENT LIMITED' },
            { k: 'Référence', v: `${devisNumero} / ${clientNom}` },
            { k: 'Montant', v: `${montant.toLocaleString('fr-FR')} €`, highlight: true },
          ].map((row: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: i < 5 ? '1px solid #E8ECF4' : 'none' }}>
              <span style={{ color: '#6B7280', fontSize: 12, minWidth: 90 }}>{row.k}</span>
              <span style={{ fontWeight: 600, color: row.highlight ? '#00897B' : '#1565C0', fontSize: row.highlight ? 16 : 13 }}>{row.v}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          style={{
            width: '100%', padding: 14, background: 'linear-gradient(135deg, #1565C0, #1E88E5)', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1, marginBottom: 8,
          }}
        >
          ✅ J'ai effectué le virement — Confirmer
        </button>
        <button onClick={onClose} style={{
          width: '100%', padding: 14, background: 'transparent', color: '#6B7280',
          border: '1.5px solid #CBD5E1', borderRadius: 12, fontSize: 14, cursor: 'pointer',
        }}>
          Fermer — Je virerai plus tard
        </button>
      </div>
    </div>
  );
}
