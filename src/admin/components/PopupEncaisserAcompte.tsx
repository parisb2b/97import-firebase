import { useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { generateFactureAcompte } from '../../lib/pdf-generator';
import { getNextNumber } from '../../lib/counters';
import { notifyAcompteEncaisse } from '../../lib/emailService';

interface Props {
  devis: any;
  onClose: () => void;
  onSuccess: () => void;  // appelé après encaissement pour rafraîchir la liste parent
}

export default function PopupEncaisserAcompte({ devis, onClose, onSuccess }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acomptesDeclares = (devis.acomptes || [])
    .map((a: any, idx: number) => ({ a, idx }))
    .filter(({ a }: any) => a.statut === 'declare');

  if (acomptesDeclares.length === 0) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#1E3A5F' }}>
            Aucun acompte déclaré
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            Le client n'a pas encore déclaré de virement pour ce devis.
          </p>
          <button onClick={onClose} style={btnSecondaire}>Fermer</button>
        </div>
      </div>
    );
  }

  const confirmer = async () => {
    if (selectedIndex === null) return;
    setLoading(true);
    setError(null);

    try {
      const numeroFA = await getNextNumber('FA');
      const acomptesActuels = [...(devis.acomptes || [])];
      const acompteCible = acomptesActuels[selectedIndex];

      if (!acompteCible || acompteCible.statut !== 'declare') {
        throw new Error('Acompte invalide');
      }

      // MODIFIER (pas ajouter)
      acomptesActuels[selectedIndex] = {
        ...acompteCible,
        statut: 'encaisse',
        ref_fa: numeroFA,
        date_encaissement: new Date().toISOString(),
      };

      // Recalculs
      const totalEncaisse = acomptesActuels
        .filter((a: any) => a.statut === 'encaisse')
        .reduce((sum: number, a: any) => sum + (a.montant || 0), 0);
      const totalHt = devis.total_ht || 0;
      const soldeRestant = totalHt - totalEncaisse;

      let nouveauStatut = devis.statut;
      if (nouveauStatut === 'nouveau' || nouveauStatut === 'brouillon' || nouveauStatut === 'vip_envoye') {
        nouveauStatut = 'en_cours';
      }

      let statutPaiement = 'non_paye';
      if (totalEncaisse >= totalHt && totalHt > 0) statutPaiement = 'paye_complet';
      else if (totalEncaisse > 0) statutPaiement = 'paye_partiel';

      // Générer et uploader PDF FA
      const emetteurSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      const emetteur = emetteurSnap.exists() ? emetteurSnap.data() : undefined;

      const pdfDoc = generateFactureAcompte(
        {
          ...devis,
          acomptes: acomptesActuels,  // ← IMPORTANT : le nouveau tableau
        },
        acomptesActuels[selectedIndex],   // ← acompte cible (modifié)
        emetteur
      );
      const pdfBlob = pdfDoc.output('blob');
      const fileRef = storageRef(storage, `factures_acompte/${numeroFA}.pdf`);
      await uploadBytes(fileRef, pdfBlob, { contentType: 'application/pdf' });
      const pdfUrl = await getDownloadURL(fileRef);

      const facturesAcompteUrls = Array.isArray(devis.factures_acompte_urls)
        ? [...devis.factures_acompte_urls] : [];
      facturesAcompteUrls.push({
        ref_fa: numeroFA,
        url: pdfUrl,
        date: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'quotes', devis.numero || devis.id), {
        acomptes: acomptesActuels,
        total_encaisse: totalEncaisse,
        solde_restant: soldeRestant,
        statut: nouveauStatut,
        statut_paiement: statutPaiement,
        factures_acompte_urls: facturesAcompteUrls,
        facture_acompte_url: pdfUrl,
        updated_at: serverTimestamp(),
      });

      // Notification email
      try {
        const devisAJour = {
          ...devis,
          acomptes: acomptesActuels,  // avec l'acompte modifié
        };
        await notifyAcompteEncaisse(
          devisAJour,
          acomptesActuels[selectedIndex],
          pdfUrl  // l'URL Storage de la FA générée
        );
      } catch (err) {
        console.error('Erreur notification acompte encaissé:', err);
      }

      // Download local pour admin
      pdfDoc.save(`${numeroFA}.pdf`);

      onSuccess();
    } catch (err: any) {
      console.error('Erreur encaissement:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1E3A5F' }}>
          Encaisser un acompte
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
          Devis : <strong>{devis.numero}</strong>
        </p>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
          Sélectionnez l'acompte reçu en banque :
        </p>

        {acomptesDeclares.map(({ a, idx }: any) => (
          <label key={idx} style={{
            display: 'block', padding: 16, marginBottom: 12,
            border: selectedIndex === idx ? '2px solid #1565C0' : '1.5px solid #E5E7EB',
            borderRadius: 12, cursor: 'pointer',
            background: selectedIndex === idx ? '#E3F2FD' : '#fff',
          }}>
            <input
              type="radio" name="acompte"
              checked={selectedIndex === idx}
              onChange={() => setSelectedIndex(idx)}
              style={{ marginRight: 12 }}
            />
            <strong style={{ color: '#1565C0' }}>{a.montant} €</strong>
            {' · '}
            <span style={{ fontSize: 13, color: '#374151' }}>
              Déclaré le {new Date(a.date).toLocaleDateString('fr-FR')}
            </span>
            {' · '}
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              Compte {a.type_compte === 'perso' ? 'personnel' : 'professionnel'}
            </span>
          </label>
        ))}

        {error && (
          <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: 8, color: '#991B1B', fontSize: 13, marginBottom: 12 }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={confirmer}
            disabled={selectedIndex === null || loading}
            style={{
              flex: 1, padding: 14,
              background: (selectedIndex === null || loading) ? '#D3D1C7' : '#1565C0',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 600,
              cursor: (selectedIndex === null || loading) ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'Encaissement...' : 'Encaisser cet acompte'}
          </button>
          <button onClick={onClose} style={btnSecondaire}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 24, padding: 32,
  maxWidth: 540, width: '90%', maxHeight: '80vh', overflow: 'auto',
};
const btnSecondaire: React.CSSProperties = {
  padding: 14, background: 'transparent', color: '#6B7280',
  border: '1.5px solid #E5E7EB', borderRadius: 12,
  fontSize: 14, cursor: 'pointer',
};
