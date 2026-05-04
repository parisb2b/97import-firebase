import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';
import { montantAcompteParDefaut } from '../../../lib/devisHelpers';
import { notifyAcompteDeclare } from '../../../lib/emailService';
import { validerNouveauPaiement, prochainPaiementEstSolde } from '../../../lib/quoteStatusHelpers';
import { sanitizeForFirestore } from '../../../lib/firebaseUtils';

/** V85 — Restant à payer = Total HT − TOUS les acomptes (déclarés + encaissés, hors solde forcé).
 *  Différent de getSoldeRestant() qui ne compte que les encaissés. */
function getRestantAPayer(totalHt: number, acomptes: any[]): number {
  const totalDejaPaye = (acomptes || [])
    .filter((a: any) => !a.is_solde)
    .reduce((s: number, a: any) => s + (a.montant || 0), 0);
  return Math.max(0, totalHt - totalDejaPaye);
}

interface Props {
  devisId: string;
  devisNumero: string;
  clientNom: string;
  montantInitial?: number;
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

export default function PopupAcompte({ devisId, devisNumero, clientNom, montantInitial, onClose, onAcompteAdded }: Props) {
  const { showToast } = useToast();
  const [typeCompte, setTypeCompte] = useState<'perso' | 'pro'>('perso');
  const [montant, setMontant] = useState(montantInitial ?? 500);
  const [submitting, setSubmitting] = useState(false);
  const [devisCharge, setDevisCharge] = useState<any>(null); // v43-E3.2

  const rib = RIB_DATA[typeCompte];

  // v43-E3.2 : dérivés pour la logique limite 3 acomptes + montant forcé au solde
  const acomptesCharges = devisCharge?.acomptes || [];
  const soldeRestant = devisCharge ? getRestantAPayer(devisCharge.total_ht || 0, acomptesCharges) : 0;
  const estSolde = prochainPaiementEstSolde(acomptesCharges);

  // Calculer le montant par défaut adapté au solde restant
  useEffect(() => {
    const fetchDefaultMontant = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'quotes'), where('__name__', '==', devisId)));
        const devisData = snap.docs[0]?.data();
        if (devisData) {
          setDevisCharge(devisData);
          // v43-E3.2 V3 : si montantInitial fourni par le parent (ex: clic "Payer le Solde"),
          // ne PAS écraser le montant — on garde la valeur transmise.
          if (montantInitial !== undefined) return;
          const acomptesEnBase = devisData.acomptes || [];
          if (prochainPaiementEstSolde(acomptesEnBase)) {
            // Forcer au montant exact du solde restant
            setMontant(getRestantAPayer(devisData.total_ht || 0, acomptesEnBase));
          } else {
            setMontant(montantAcompteParDefaut(devisData));
          }
        }
      } catch (err) {
        console.error('Error fetching devis for default montant:', err);
      }
    };
    fetchDefaultMontant();
  }, [devisId, montantInitial]);

  const handleConfirm = async () => {
    if (montant <= 0) { showToast('Montant invalide', 'error'); return; }
    if (!devisCharge) {
      showToast('Devis non chargé, attendez quelques secondes', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const devisRef = doc(db, 'quotes', devisId);
      const snap = await getDocs(query(collection(db, 'quotes'), where('__name__', '==', devisId)));
      const currentData = snap.docs[0]?.data();
      const currentAcomptes = currentData?.acomptes || [];
      const totalHt = currentData?.total_ht || 0;

      // v43-E3.2 : forcer le montant au solde restant si c'est le 4e paiement
      const estSoldeFresh = prochainPaiementEstSolde(currentAcomptes);
      const soldeRestantFresh = getRestantAPayer(totalHt, currentAcomptes);
      const montantFinal = estSoldeFresh ? soldeRestantFresh : montant;

      // v43-E3.2 : validation centralisée (min 50€, max solde, 4e = solde forcé)
      const validation = validerNouveauPaiement(totalHt, currentAcomptes, montantFinal);
      if (!validation.ok) {
        showToast(validation.erreur || 'Validation échouée', 'error');
        setSubmitting(false);
        return;
      }

      const nouvelAcompte = {
        numero: estSoldeFresh ? 0 : (currentAcomptes.length + 1),
        montant: montantFinal,
        date_reception: new Date().toISOString(),
        reference_virement: undefined,
        facture_acompte_numero: undefined,
        facture_acompte_pdf_url: undefined,
        is_solde: estSoldeFresh,                     // v43-E3.2 : marqueur solde
        encaisse: false,
        created_at: new Date().toISOString(),
        created_by: 'client',
        type_compte: typeCompte,
        iban_utilise: rib.iban,
      };

      // V94.1 — Snapshot des adresses client dans le devis (fige au 1er acompte)
      const adressesSnapshot: any = {};
      if (!currentData?.adresse_facturation || !currentData?.adresse_livraison) {
        try {
          const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentData?.client_id || '')));
          const userData = userSnap.docs[0]?.data();
          if (userData) {
            // Chercher les adresses marquees facturation/livraison
            const adresses = userData.adresses || [];
            const facturation = adresses.find((a: any) => a.type === 'facturation');
            const livraison = adresses.find((a: any) => a.type === 'livraison');
            if (facturation) adressesSnapshot.adresse_facturation = facturation;
            if (livraison) adressesSnapshot.adresse_livraison = livraison;
            // Fallback : adresse par defaut ou premiere adresse
            if (!facturation && adresses.length > 0) adressesSnapshot.adresse_facturation = adresses.find((a: any) => a.par_defaut) || adresses[0];
            if (!livraison && adresses.length > 0) adressesSnapshot.adresse_livraison = adresses.find((a: any) => a.par_defaut) || adresses[0];
          }
        } catch (e) { console.warn('[V94.1] Snapshot adresses impossible, continue sans'); }
      }

      await updateDoc(devisRef, sanitizeForFirestore({
        acomptes: [...currentAcomptes, nouvelAcompte],
        updatedAt: new Date(),
        ...adressesSnapshot,
      }));

      // Notification email
      try {
        const devisData = { numero: devisNumero, ...currentData };
        await notifyAcompteDeclare(devisData, nouvelAcompte);
      } catch (err) {
        console.error('Erreur notification acompte déclaré:', err);
      }

      showToast(`${estSoldeFresh ? 'Solde' : 'Acompte'} de ${montantFinal.toLocaleString('fr-FR')} € déclaré ✅`);
      onAcompteAdded();
      onClose();
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(`Erreur: ${errorMsg}`, 'error');
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

        {/* v43-E3.2 : bandeau Solde si 4e paiement */}
        {estSolde && (
          <div style={{
            background: '#D1FAE5',
            border: '1px solid #10B981',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏁 Paiement du Solde
            </div>
            <div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>
              Le montant est verrouillé à <strong>{soldeRestant.toFixed(2)} €</strong> (solde restant exact).
            </div>
          </div>
        )}

        {/* Montant */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: estSolde ? '#D1FAE5' : '#E0F2F1', border: `2px solid ${estSolde ? '#10B981' : '#26A69A'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: estSolde ? '#065F46' : '#00897B', fontWeight: 600, flex: 1 }}>{estSolde ? '🏁 Solde' : '💶 Montant'}</label>
          <input type="number" value={estSolde ? soldeRestant.toFixed(2) : montant} onChange={e => setMontant(Number(e.target.value))}
            disabled={estSolde}
            style={{ width: 90, padding: '7px 10px', border: 'none', background: 'rgba(255,255,255,.8)', borderRadius: 8, fontSize: 17, fontWeight: 700, color: estSolde ? '#065F46' : '#00897B', textAlign: 'center', cursor: estSolde ? 'not-allowed' : 'text' }} />
          <span style={{ fontSize: 10, color: estSolde ? '#065F46' : '#00897B', background: estSolde ? 'rgba(6,95,70,.12)' : 'rgba(0,137,123,.12)', padding: '2px 8px', borderRadius: 20 }}>{estSolde ? 'verrouillé' : 'modifiable'}</span>
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
