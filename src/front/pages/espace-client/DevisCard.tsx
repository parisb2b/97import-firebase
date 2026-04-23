import { useState } from 'react';
import PopupAcompte from './PopupAcompte';
import PopupSaisieRIB from '../../components/PopupSaisieRIB';
import PopupVerserAcompte from '../../components/PopupVerserAcompte';
import { peutVerserAcompte } from '../../../lib/devisHelpers';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generateDevis, downloadPDF } from '../../../lib/pdf-generator';
import { notifyAcompteDeclare, notifySignatureClient } from '../../../lib/emailService';
import { useToast } from '../../components/Toast';

interface DevisCardProps {
  devis: any;
  profile: any;
  onRefresh: () => void;
  forceOpen?: boolean;
}

export default function DevisCard({ devis, profile, onRefresh, forceOpen = false }: DevisCardProps) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(forceOpen);
  const [showPopupAcompte, setShowPopupAcompte] = useState(false);
  const [showPopupRIB, setShowPopupRIB] = useState(false);
  const [showPopupVerserAcompte, setShowPopupVerserAcompte] = useState(false);

  // Calculs
  const acomptes = Array.isArray(devis.acomptes) ? devis.acomptes : [];
  const acomptesEncaisses = acomptes.filter((a: any) => a.statut === 'encaisse');
  const acomptesDeclares = acomptes.filter((a: any) => a.statut === 'declare');

  const totalEncaisse = acomptesEncaisses.reduce((s: number, a: any) => s + (a.montant || 0), 0);
  const totalDeclare = acomptesDeclares.reduce((s: number, a: any) => s + (a.montant || 0), 0);
  const totalHt = devis.total_ht || 0;
  const soldeRestant = totalHt - totalEncaisse;

  // Badge
  const getBadge = () => {
    if (devis.is_vip) return { label: 'VIP', bg: '#EDE9FE', color: '#7C3AED' };
    switch (devis.statut) {
      case 'nouveau': return { label: 'Nouveau', bg: '#DBEAFE', color: '#1565C0' };
      case 'en_cours': return { label: 'En préparation', bg: '#D1FAE5', color: '#059669' };
      case 'expedie': return { label: 'Expédié', bg: '#FEF3C7', color: '#D97706' };
      case 'livre': return { label: 'Livré', bg: '#D1FAE5', color: '#059669' };
      case 'annule': return { label: 'Annulé', bg: '#FEE2E2', color: '#DC2626' };
      default: return { label: devis.statut || 'Nouveau', bg: '#F3F4F6', color: '#6B7280' };
    }
  };
  const badge = getBadge();

  // Download PDF devis
  const handleDownloadDevis = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (devis.devis_url) {
        window.open(devis.devis_url, '_blank');
        return;
      }
      const emetteurSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      const emetteur = emetteurSnap.exists() ? emetteurSnap.data() : undefined;
      const pdf = generateDevis(devis, emetteur);
      downloadPDF(pdf, `${devis.numero}.pdf`);
    } catch (err) {
      console.error('Erreur PDF:', err);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  // Signature du devis
  const handleSigner = async () => {
    try {
      await updateDoc(doc(db, 'quotes', devis.id), {
        signe_le: serverTimestamp(),
        statut: 'signe',
        updatedAt: serverTimestamp(),
      });

      // Notification email
      try {
        const devisSnap = await getDoc(doc(db, 'quotes', devis.id));
        const devisData = devisSnap.data();
        if (devisData) {
          const devisAJour: any = { id: devis.id, numero: devis.numero, ...devisData };

          // Récupérer le nom du partenaire si existe
          let partenaireName: string | undefined;
          if (devisAJour.partenaire_code) {
            const partenaireSnap = await getDoc(doc(db, 'partners', devisAJour.partenaire_code as string));
            if (partenaireSnap.exists()) {
              partenaireName = `${partenaireSnap.data().prenom || ''} ${partenaireSnap.data().nom || ''}`.trim() || undefined;
            }
          }

          await notifySignatureClient(devisAJour, partenaireName);
        }
      } catch (err) {
        console.error('[DevisCard] Erreur notification signature:', err);
      }

      showToast('✅ Devis signé avec succès !');

      // Passer à l'étape RIB
      setShowPopupRIB(true);
      onRefresh();
    } catch (err) {
      console.error('[DevisCard] Erreur signature:', err);
      showToast('Erreur lors de la signature', 'error');
    }
  };

  // RIB submit
  const handleRIBSubmit = async (data: { hasRib: boolean; iban?: string; bic?: string; nom_banque?: string }) => {
    try {
      if (data.hasRib) {
        await updateDoc(doc(db, 'quotes', devis.id), {
          iban: data.iban,
          bic: data.bic,
          nom_banque: data.nom_banque,
          updatedAt: serverTimestamp(),
        });
      }

      setShowPopupRIB(false);

      // Passer à l'étape acompte
      setShowPopupVerserAcompte(true);
    } catch (err) {
      console.error('[DevisCard] Erreur RIB:', err);
      showToast('Erreur lors de l\'enregistrement du RIB', 'error');
    }
  };

  // Acompte submit (après signature)
  const handleAcompteSignatureSubmit = async (data: { montantAcompte: number; typeCompte: 'perso' | 'pro' }) => {
    try {
      const newAcompte = {
        montant: data.montantAcompte,
        type_compte: data.typeCompte,
        date: new Date().toISOString(),
        statut: 'declare',
        ref_fa: '',
      };

      const updatedAcomptes = [...(devis.acomptes || []), newAcompte];

      await updateDoc(doc(db, 'quotes', devis.id), {
        acomptes: updatedAcomptes,
        updatedAt: serverTimestamp(),
      });

      // Notification email
      try {
        const devisSnap = await getDoc(doc(db, 'quotes', devis.id));
        const devisAJour = { id: devis.id, numero: devis.numero, ...devisSnap.data() };
        await notifyAcompteDeclare(devisAJour, newAcompte);
      } catch (err) {
        console.error('[DevisCard] Erreur notification:', err);
      }

      showToast('✅ Acompte déclaré avec succès !');
      setShowPopupVerserAcompte(false);
      onRefresh();
    } catch (err) {
      console.error('[DevisCard] Erreur acompte:', err);
      showToast('Erreur lors de la déclaration de l\'acompte', 'error');
    }
  };

  // Produit résumé (affiché dans l'entête)
  const produitResume = Array.isArray(devis.lignes) && devis.lignes.length > 0
    ? devis.lignes.map((l: any) => l.nom_fr || l.designation).filter(Boolean).join(', ')
    : '—';

  const dateDevis = devis.date_creation
    ? new Date(devis.date_creation.toDate ? devis.date_creation.toDate() : devis.date_creation).toLocaleDateString('fr-FR')
    : '—';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #E5E7EB',
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Header cliquable */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          borderBottom: open ? '1px solid #E5E7EB' : 'none',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ color: '#1565C0', fontSize: 15 }}>{devis.numero}</strong>
            <span style={{
              background: badge.bg,
              color: badge.color,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>
              {badge.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            {dateDevis} · {produitResume}
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
          {totalHt.toLocaleString('fr-FR')} €
        </div>

        <button
          onClick={handleDownloadDevis}
          style={{
            padding: '8px 14px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          📄 PDF
        </button>

        <span style={{ color: '#9CA3AF', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Détail dépliable */}
      {open && (
        <div style={{ padding: '20px 24px', background: '#FAFBFC' }}>
          {/* Section 1 : Détail commande */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>
              Détail commande
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, fontSize: 13 }}>
              <div>
                <div style={{ color: '#6B7280', marginBottom: 4 }}>Destination :</div>
                <div style={{ color: '#111827', fontWeight: 500 }}>
                  {devis.pays_livraison || devis.destination || '—'}
                </div>
              </div>
              <div>
                <div style={{ color: '#6B7280', marginBottom: 4 }}>Partenaire :</div>
                <div style={{ color: '#111827', fontWeight: 500 }}>
                  {devis.partenaire_code || '—'}
                </div>
              </div>
              <div>
                <div style={{ color: '#6B7280', marginBottom: 4 }}>Paiement :</div>
                <div style={{ color: '#111827', fontWeight: 500 }}>
                  Virement bancaire / LUXENT LIMITED
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Lignes produits */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>
              Produits
            </h3>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px' }}>Réf</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px' }}>Produit</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px' }}>Qté</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px' }}>Prix unit. HT</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px' }}>Total HT</th>
                </tr>
              </thead>
              <tbody>
                {(devis.lignes || []).map((ligne: any, idx: number) => {
                  const ref = ligne.ref || '';
                  const prixPublic = ligne.prix_unitaire || 0;
                  const prixNegocie = devis.prix_negocies?.[ref] ?? prixPublic;
                  const estNegocie = devis.is_vip && prixNegocie !== prixPublic;
                  const qte = ligne.qte || 1;
                  const totalLigne = prixNegocie * qte;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 4px' }}>{ref}</td>
                      <td style={{ padding: '10px 4px' }}>{ligne.nom_fr || ligne.designation}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>{qte}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                        {estNegocie && (
                          <div style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 12 }}>
                            {prixPublic.toLocaleString('fr-FR')} €
                          </div>
                        )}
                        <div style={{ color: estNegocie ? '#7C3AED' : '#111827', fontWeight: estNegocie ? 600 : 400 }}>
                          {prixNegocie.toLocaleString('fr-FR')} €
                        </div>
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 500 }}>
                        {totalLigne.toLocaleString('fr-FR')} €
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={4} style={{ padding: '12px 4px', textAlign: 'right', color: '#1565C0', fontWeight: 600 }}>
                    Total HT
                  </td>
                  <td style={{ padding: '12px 4px', textAlign: 'right', color: '#1565C0', fontWeight: 700, fontSize: 15 }}>
                    {totalHt.toLocaleString('fr-FR')} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3 : Documents (5 slots) */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>
              Documents
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {renderDocSlot('📄', 'Devis', devis.numero, 'Disponible', devis.devis_url)}
              {renderDocSlotMultiFa('Facture acompte', devis.factures_acompte_urls || [])}
              {renderDocSlot('🧾', 'Facture finale', `FF-${devis.numero.slice(4)}`,
                soldeRestant <= 0 ? 'Disponible' : 'Après paiement complet',
                devis.facture_finale_url)}
              {renderDocSlot('🚢', 'Facture logistique', `FL-${devis.numero.slice(4)}`,
                'Au départ du conteneur', devis.facture_logistique_url)}
              {renderDocSlot('📦', 'Bon de livraison', `BL-${devis.numero.slice(4)}`,
                'Après expédition confirmée', devis.bon_livraison_url)}
            </div>
          </div>

          {/* Section 4 : Suivi des paiements (3 cases colorées) */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>
              Suivi des paiements
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{
                padding: 20,
                background: '#D1FAE5',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#065F46', marginBottom: 6 }}>Encaissé</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#065F46' }}>
                  {totalEncaisse.toLocaleString('fr-FR')} €
                </div>
              </div>
              <div style={{
                padding: 20,
                background: '#FEF3C7',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#92400E', marginBottom: 6 }}>Déclaré</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#92400E' }}>
                  {totalDeclare.toLocaleString('fr-FR')} €
                </div>
              </div>
              <div style={{
                padding: 20,
                background: '#DBEAFE',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#1E3A8A', marginBottom: 6 }}>Solde restant</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1E3A8A' }}>
                  {soldeRestant.toLocaleString('fr-FR')} €
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 : Historique des acomptes */}
          {acomptes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>
                Historique des acomptes
              </h3>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <tbody>
                  {acomptes.map((a: any, idx: number) => {
                    const dateA = a.date
                      ? new Date(a.date).toLocaleDateString('fr-FR')
                      : '—';
                    const statutBadge = a.statut === 'encaisse'
                      ? { label: 'Encaissé', bg: '#D1FAE5', color: '#065F46' }
                      : { label: 'Déclaré', bg: '#FEF3C7', color: '#92400E' };

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 0' }}>{dateA}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 500 }}>
                          {(a.montant || 0).toLocaleString('fr-FR')} €
                        </td>
                        <td style={{ padding: '10px 0', textAlign: 'right' }}>
                          <span style={{
                            background: statutBadge.bg,
                            color: statutBadge.color,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            {statutBadge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bouton Signer (si devis_vip_envoye et non signé) */}
          {devis.statut === 'devis_vip_envoye' && !devis.signe_le && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                background: '#FEF3C7',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, color: '#92400E', fontSize: 14, lineHeight: 1.6 }}>
                  🎁 Votre partenaire vous a envoyé une offre VIP avec des prix négociés. Pour accepter cette offre et lancer votre commande, signez le devis ci-dessous.
                </p>
              </div>
              <button
                onClick={handleSigner}
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                ✍️ Je signe ce devis
              </button>
            </div>
          )}

          {/* Message si signé récemment */}
          {devis.statut === 'signe' && devis.signe_le && acomptes.length === 0 && (
            <div style={{
              background: '#D1FAE5',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              textAlign: 'center',
              border: '2px solid #059669',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p style={{ margin: '0 0 8px 0', color: '#065F46', fontSize: 14, fontWeight: 600 }}>
                Devis signé le {devis.signe_le?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}
              </p>
              <p style={{ margin: 0, color: '#059669', fontSize: 13 }}>
                Vous pouvez maintenant verser un acompte pour lancer la production.
              </p>
            </div>
          )}

          {/* Bouton Verser un acompte */}
          {peutVerserAcompte(devis) && (
            <button
              onClick={() => setShowPopupAcompte(true)}
              style={{
                width: '100%',
                padding: 14,
                background: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              💶 Verser un acompte
            </button>
          )}
        </div>
      )}

      {showPopupAcompte && (
        <PopupAcompte
          devisId={devis.id}
          devisNumero={devis.numero}
          clientNom={devis.client_nom || `${profile?.firstName || ''} ${profile?.lastName || ''}`}
          onClose={() => setShowPopupAcompte(false)}
          onAcompteAdded={() => {
            setShowPopupAcompte(false);
            onRefresh();
          }}
        />
      )}

      {showPopupRIB && (
        <PopupSaisieRIB
          isOpen={showPopupRIB}
          onClose={() => setShowPopupRIB(false)}
          onSubmit={handleRIBSubmit}
          initialIban={devis.iban}
          initialBic={devis.bic}
          initialNomBanque={devis.nom_banque}
          title="Coordonnées bancaires"
          description="Pour faciliter le virement de votre acompte, merci de nous communiquer votre IBAN."
        />
      )}

      {showPopupVerserAcompte && (
        <PopupVerserAcompte
          isOpen={showPopupVerserAcompte}
          onClose={() => setShowPopupVerserAcompte(false)}
          onSubmit={handleAcompteSignatureSubmit}
          totalDevis={devis.total_ht}
          title="Déclarer votre acompte"
          minAcomptePct={30}
        />
      )}
    </div>
  );
}

// Helpers internes
function renderDocSlot(icon: string, label: string, numero: string, subLabel: string, url?: string) {
  const disponible = !!url;
  return (
    <div style={{
      padding: 12,
      background: disponible ? '#FFF' : '#F9FAFB',
      border: disponible ? '2px solid #059669' : '1px solid #E5E7EB',
      borderRadius: 10,
      textAlign: 'center',
      opacity: disponible ? 1 : 0.6,
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>{numero}</div>
      {disponible ? (
        <>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: 20,
            fontSize: 10,
            fontWeight: 600,
            marginBottom: 6,
          }}>Disponible</span>
          <div>
            <a href={url} target="_blank" rel="noopener" style={{ marginRight: 8 }}>👁</a>
            <a href={url} download style={{ textDecoration: 'none' }}>⬇️</a>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{subLabel}</div>
      )}
    </div>
  );
}

function renderDocSlotMultiFa(label: string, urls: any[]) {
  const disponible = urls.length > 0;
  return (
    <div style={{
      padding: 12,
      background: disponible ? '#FFF' : '#F9FAFB',
      border: disponible ? '2px solid #059669' : '1px solid #E5E7EB',
      borderRadius: 10,
      textAlign: 'center',
      opacity: disponible ? 1 : 0.6,
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>🧾</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{label}</div>
      {disponible ? (
        <>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>
            {urls.length} {urls.length > 1 ? 'factures' : 'facture'}
          </div>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: 20,
            fontSize: 10,
            fontWeight: 600,
            marginBottom: 6,
          }}>Disponible</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {urls.map((f: any, i: number) => (
              <a key={i} href={f.url} target="_blank" rel="noopener" style={{ fontSize: 11, color: '#1565C0' }}>
                {f.ref_fa}
              </a>
            ))}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: '#6B7280' }}>—</div>
      )}
      {!disponible && (
        <div style={{ fontSize: 10, color: '#9CA3AF' }}>À partir du 1er acompte</div>
      )}
    </div>
  );
}
