import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { generateFactureAcomptePDF } from '../../lib/generateInvoiceAcompte';
import { validerNouveauPaiement, prochainPaiementEstSolde, getNbAcomptesEncaisses, generateNumeroDocument } from '../../lib/quoteStatusHelpers';
import { notifyAcompteEncaisse } from '../../lib/emailService';
import { creerCommissionDevis } from '../../lib/commissionHelpers';
import { logError, logWarn } from '../../lib/logService';
import { sanitizeForFirestore } from '../../lib/firebaseUtils';

/**
 * v43-E3.2 — Cascade best-effort à exécuter quand un devis passe à `solde_paye`.
 * Génère la facture finale globale, crée la commission, envoie les emails.
 * N'est PAS bloquant pour le flux principal d'encaissement.
 */
async function traiterCascadeSoldePaye(devis: any): Promise<void> {
  console.log('[V43-E3.2] === CASCADE SOLDE_PAYE ===', devis.numero);
  const devisId = devis.id || devis.numero;

  // ÉTAPE 1 : Génération facture finale globale (FA-AAMM-NNN) + PDF + Storage
  let factureFinaleNumero: string | null = null;
  let factureFinalePdfUrl: string | null = null;
  try {
    const { generateNumeroDocument } = await import('../../lib/quoteStatusHelpers');
    factureFinaleNumero = await generateNumeroDocument('facture_finale');

    try {
      const { generateFactureFinalePDF } = await import('../../lib/generateInvoiceFinale');
      const pdfBlob = await generateFactureFinalePDF({
        numero: factureFinaleNumero,
        devis_numero: devis.numero,
        date_emission: new Date().toISOString(),
        client: {
          nom: devis.client_nom || '',
          email: devis.client_email || '',
          adresse: devis.client_adresse,
          ville: devis.client_ville,
          cp: devis.client_cp,
          pays: devis.destination,
        },
        lignes: devis.lignes || [],
        total_ht: devis.total_ht || 0,
        acomptes: devis.acomptes || [],
        date_solde_paye: new Date().toISOString(),
      });

      const fileRef = storageRef(storage, `factures/${factureFinaleNumero}.pdf`);
      await uploadBytes(fileRef, pdfBlob, { contentType: 'application/pdf' });
      factureFinalePdfUrl = await getDownloadURL(fileRef);
    } catch (pdfErr: any) {
      console.warn('[V43-E3.2] PDF facture finale non généré (continue sans PDF) :', pdfErr?.message || pdfErr);
      logWarn('cascade-e3.2-facture', 'PDF facture finale non généré', { devisNumero: devis.numero, factureFinaleNumero });
    }

    await updateDoc(doc(db, 'quotes', devisId), sanitizeForFirestore({
      facture_finale: {
        numero: factureFinaleNumero,
        pdf_url: factureFinalePdfUrl,
        date_emission: new Date().toISOString(),
        total: devis.total_ht || 0,
      },
    }));
    console.log('[V43-E3.2] Facture finale créée :', factureFinaleNumero);
  } catch (err: any) {
    console.error('[V43-E3.2] Génération facture finale échouée :', err);
    logError('cascade-e3.2-facture', 'Génération facture finale échouée', { devisNumero: devis.numero }, err);
  }

  // ÉTAPE 2 : Création commission + email partenaire
  try {
    const commissionResult = await creerCommissionDevis({ devis });
    console.log('[V43-E3.2] Résultat commission :', commissionResult);

    if (commissionResult.ok && !commissionResult.skipped && commissionResult.numeroNC) {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const partnersQuery = query(
          collection(db, 'partners'),
          where('code', '==', devis.partenaire_code)
        );
        const partnersSnap = await getDocs(partnersQuery);

        if (!partnersSnap.empty) {
          const partner = partnersSnap.docs[0].data() as any;

          // v43-E3.2-fix V1 : guard contre partenaire sans email valide (évite faux positifs)
          if (!partner.email || typeof partner.email !== 'string' || !partner.email.includes('@')) {
            console.warn('[V43-E3.2-fix] Partenaire sans email valide, code=', devis.partenaire_code, 'partner=', partner);
            logWarn('cascade-e3.2-email', 'Partenaire sans email valide', { partenaire_code: devis.partenaire_code, devisNumero: devis.numero });
            // Pas d'envoi email mais cascade continue
          } else {
            const { envoyerEmailCommissionPartenaire } = await import('../../lib/emailService');
            await envoyerEmailCommissionPartenaire({
              partenaireEmail: partner.email,
              partenaireNom: `${partner.prenom || ''} ${partner.nom || ''}`.trim() || partner.code || 'Partenaire',
              devisNumero: devis.numero,
              clientNom: devis.client_nom || 'Client',
              montantCommission: commissionResult.totalCommission!,
              noteCommissionNumero: commissionResult.numeroNC,
              whatsappLink: partner.whatsapp ? `https://wa.me/${String(partner.whatsapp).replace(/\D/g, '')}` : undefined,
            });
            console.log('[V43-E3.2] Email partenaire envoyé à', partner.email);
          }
        } else {
          console.warn('[V43-E3.2] Partenaire introuvable code=', devis.partenaire_code);
        }
      } catch (emailErr) {
        console.error('[V43-E3.2] Email commission partenaire échoué (non bloquant) :', emailErr);
        logError('cascade-e3.2-email', 'Email commission partenaire échoué', { devisNumero: devis.numero, partenaire_code: devis.partenaire_code }, emailErr);
      }
    }
  } catch (err: any) {
    console.error('[V43-E3.2] Cascade commission échouée :', err);
    logError('cascade-e3.2-commission', 'Cascade commission échouée', { devisNumero: devis.numero }, err);
  }

  // ÉTAPE 3 : Email client facture finale
  if (factureFinaleNumero) {
    try {
      const { envoyerEmailFactureFinale } = await import('../../lib/emailService');
      await envoyerEmailFactureFinale({
        clientEmail: devis.client_email,
        clientNom: devis.client_nom || 'Client',
        factureFinaleNumero,
        devisNumero: devis.numero,
        total: devis.total_ht || 0,
        pdfUrl: factureFinalePdfUrl || '',
      });
      console.log('[V43-E3.2] Email client facture finale envoyé');
    } catch (emailErr) {
      console.error('[V43-E3.2] Email client facture finale échoué (non bloquant) :', emailErr);
      logError('cascade-e3.2-email', 'Email client facture finale échoué', { devisNumero: devis.numero, factureFinaleNumero }, emailErr);
    }
  }

  console.log('[V43-E3.2] === CASCADE TERMINÉE ===', devis.numero);
}

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
    .filter(({ a }: any) => a.encaisse === false);

  if (acomptesDeclares.length === 0) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#1565C0' }}>
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
      const acomptesActuels = [...(devis.acomptes || [])];
      const acompteCible = acomptesActuels[selectedIndex];

      if (!acompteCible || acompteCible.encaisse !== false) {
        throw new Error('Acompte invalide');
      }

      // VALIDATION du montant
      const validation = validerNouveauPaiement(
        devis.total_ht || devis.total || 0,
        acomptesActuels.filter((a: any) => a.encaisse === true),
        acompteCible.montant
      );
      if (!validation.ok) {
        setError(validation.erreur || 'Montant invalide');
        setLoading(false);
        return;
      }

      // Calculs
      const nbPartiels = getNbAcomptesEncaisses(acomptesActuels);
      const estSolde = prochainPaiementEstSolde(acomptesActuels);
      const numeroFA = await generateNumeroDocument('facture_acompte');

      // Mettre à jour l'acompte avec la nouvelle structure P3-COMPLET
      acomptesActuels[selectedIndex] = {
        numero: estSolde ? 0 : (nbPartiels + 1),
        montant: acompteCible.montant,
        date_reception: acompteCible.date || new Date().toISOString(),
        reference_virement: acompteCible.reference_virement || undefined,
        facture_acompte_numero: numeroFA,
        facture_acompte_pdf_url: '',  // sera rempli après upload
        is_solde: estSolde,
        encaisse: true,
        created_at: acompteCible.created_at || new Date().toISOString(),
        created_by: acompteCible.created_by || 'admin',
      };

      // Générer PDF avec nouveau générateur
      const pdfBlob = await generateFactureAcomptePDF({
        numero: numeroFA,
        devis_numero: devis.numero,
        statut_devis: devis.statut || 'nouveau',
        date_emission: new Date().toISOString(),
        acompte_numero: estSolde ? 0 : (nbPartiels + 1),
        acompte_est_solde: estSolde,
        montant: acompteCible.montant,
        total_devis: devis.total_ht || devis.total || 0,
        client: {
          nom: devis.client_nom || '',
          email: devis.client_email || '',
          adresse: devis.client_adresse,
          ville: devis.client_ville,
          cp: devis.client_cp,
        },
        historique_acomptes: acomptesActuels,
        reference_virement: acompteCible.reference_virement,
      });
      const fileRef = storageRef(storage, `factures_acompte/${numeroFA}.pdf`);
      await uploadBytes(fileRef, pdfBlob, { contentType: 'application/pdf' });
      const pdfUrl = await getDownloadURL(fileRef);

      // Mettre à jour l'URL dans l'acompte
      acomptesActuels[selectedIndex].facture_acompte_pdf_url = pdfUrl;

      // Recalculs
      const totalEncaisse = acomptesActuels
        .filter((a: any) => a.encaisse === true)
        .reduce((sum: number, a: any) => sum + (a.montant || 0), 0);
      const totalHt = devis.total_ht || devis.total || 0;
      const soldeRestant = totalHt - totalEncaisse;

      // Déterminer le nouveau statut du devis (v43-E3.1 : option b, atomique intégré)
      const nbEncaissesAvant = (devis.acomptes || []).filter((a: any) => a.encaisse === true).length;
      const nbEncaissesApres = nbEncaissesAvant + 1;
      const estPremierEncaissement = nbEncaissesAvant === 0;
      const statutsAvances = [
        'commande_ferme', 'en_production', 'embarque_chine',
        'arrive_port_domtom', 'livre', 'termine',
      ];

      let nouveauStatut = devis.statut;
      let nouvelleDateCommande = devis.date_commande;

      if (Math.abs(soldeRestant) < 0.01) {
        nouveauStatut = 'solde_paye';
      } else if (estPremierEncaissement && !statutsAvances.includes(devis.statut)) {
        // v43-E3.1 : bascule directe Devis → Commande au premier acompte encaissé
        nouveauStatut = 'commande_ferme';
        nouvelleDateCommande = new Date().toISOString();
      } else if (devis.statut === 'nouveau' || devis.statut === 'brouillon') {
        if (nbEncaissesApres === 1) nouveauStatut = 'acompte_1';
        else if (nbEncaissesApres === 2) nouveauStatut = 'acompte_2';
        else if (nbEncaissesApres === 3) nouveauStatut = 'acompte_3';
      }

      const updatePayload: any = {
        acomptes: acomptesActuels,
        total_encaisse: totalEncaisse,
        solde_restant: soldeRestant,
        statut: nouveauStatut,
        updated_at: serverTimestamp(),
      };
      if (nouvelleDateCommande !== devis.date_commande) {
        updatePayload.date_commande = nouvelleDateCommande;
      }

      await updateDoc(doc(db, 'quotes', devis.id || devis.numero), sanitizeForFirestore(updatePayload));

      // v43-E3.1 : email best-effort si transition vers commande_ferme
      if (nouveauStatut === 'commande_ferme' && devis.statut !== 'commande_ferme') {
        try {
          const { notifyCommandeFerme } = await import('../../lib/emailService');
          await notifyCommandeFerme({
            clientEmail: devis.client_email,
            clientNom: devis.client_nom || 'Client',
            devisNumero: devis.numero,
            clientWhatsApp: devis.client_whatsapp || devis.client_tel,
          });
        } catch (emailErr) {
          console.error('[V43-E3.1] Email commande_ferme échoué (non bloquant) :', emailErr);
        }
      }

      // Notification email
      try {
        const devisAJour = {
          ...devis,
          acomptes: acomptesActuels,
          statut: nouveauStatut,
        };
        await notifyAcompteEncaisse(
          devisAJour,
          acomptesActuels[selectedIndex],
          pdfUrl
        );
      } catch (err) {
        console.error('Erreur notification acompte encaissé:', err);
      }

      // v43-E3.2 : Cascade solde_paye (best-effort, non bloquant)
      if (nouveauStatut === 'solde_paye') {
        const devisFinal = {
          ...devis,
          acomptes: acomptesActuels,
          total_encaisse: totalEncaisse,
          solde_restant: soldeRestant,
          statut: nouveauStatut,
        };
        // v43-E3.2-fix2 : await pour ne pas être tué par le window.location.reload()
        // que onSuccess() déclenche dans le parent. Best-effort = on log mais on
        // ne propage pas l'erreur (le flux d'encaissement principal a réussi).
        try {
          await traiterCascadeSoldePaye(devisFinal);
        } catch (err: any) {
          console.error('[V43-E3.2] Cascade solde_paye échouée (non bloquant) :', err);
          logError('cascade-e3.2', 'Cascade solde_paye échouée (top-level)', { devisNumero: devis.numero }, err);
        }
      }

      // Download local pour admin
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${numeroFA}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

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
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1565C0' }}>
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
              Déclaré le {new Date(a.date_reception || a.date || a.created_at).toLocaleDateString('fr-FR')}
            </span>
            {a.reference_virement && (
              <>
                {' · '}
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  Réf: {a.reference_virement}
                </span>
              </>
            )}
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
