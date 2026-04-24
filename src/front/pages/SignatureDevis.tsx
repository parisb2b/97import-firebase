// src/front/pages/SignatureDevis.tsx
import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../components/Toast';
import PopupSaisieRIB from '../components/PopupSaisieRIB';
import PopupVerserAcompte from '../components/PopupVerserAcompte';
import { notifyAcompteDeclare, notifySignatureClient } from '../../lib/emailService';

interface Devis {
  id: string;
  numero: string;
  client_nom: string;
  client_email: string;
  total_ht: number;
  total_ht_public?: number;
  is_vip?: boolean;
  prix_negocies?: Record<string, number>;
  lignes: any[];
  statut: string;
  signature_token?: string;
  signature_token_expiry?: string;
  signature_token_used?: boolean;
  signe_le?: any;
  iban?: string;
  bic?: string;
  nom_banque?: string;
  acomptes?: any[];
}

type Step = 'loading' | 'invalid' | 'deja_signe' | 'apercu' | 'signer' | 'rib' | 'acompte' | 'termine';

export default function SignatureDevis() {
  const [match, params] = useRoute('/signature/:token');
  const [, setLocation] = useLocation();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('loading');
  const [devis, setDevis] = useState<Devis | null>(null);
  const [error, setError] = useState('');

  // Charger le devis via le token
  useEffect(() => {
    if (!match || !params?.token) {
      setStep('invalid');
      setError('Lien invalide');
      return;
    }

    loadDevisByToken(params.token);
  }, [match, params?.token]);

  const loadDevisByToken = async (token: string) => {
    try {
      const q = query(collection(db, 'quotes'), where('signature_token', '==', token));
      const snap = await getDocs(q);

      if (snap.empty) {
        setStep('invalid');
        setError('Ce lien de signature n\'existe pas ou a expiré.');
        return;
      }

      const devisDoc = snap.docs[0];
      const data = devisDoc.data();
      const devisData: Devis = { ...data, id: devisDoc.id } as Devis;

      // Vérifier si déjà utilisé
      if (devisData.signature_token_used) {
        setDevis(devisData);
        setStep('deja_signe');
        return;
      }

      // Vérifier expiration
      if (devisData.signature_token_expiry) {
        const expiry = new Date(devisData.signature_token_expiry);
        if (expiry < new Date()) {
          setStep('invalid');
          setError('Ce lien de signature a expiré. Veuillez contacter votre partenaire.');
          return;
        }
      }

      setDevis(devisData);
      setStep('apercu');
    } catch (err) {
      console.error('[SignatureDevis] Erreur chargement:', err);
      setStep('invalid');
      setError('Erreur lors du chargement du devis.');
    }
  };

  const handleSigner = async () => {
    if (!devis) return;

    try {
      await updateDoc(doc(db, 'quotes', devis.id), {
        signe_le: serverTimestamp(),
        signature_token_used: true,
        statut: 'signe',
        updatedAt: serverTimestamp(),
      });

      // Notification email
      try {
        const devisSnap = await getDoc(doc(db, 'quotes', devis.id));
        const devisData = devisSnap.data();
        if (devisData) {
          const devisAJour: any = { ...devisData, id: devis.id, numero: devis.numero };

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
        console.error('[SignatureDevis] Erreur notification signature:', err);
      }

      // Recharger pour afficher la nouvelle étape
      const updatedSnap = await getDoc(doc(db, 'quotes', devis.id));
      if (updatedSnap.exists()) {
        setDevis({ id: devis.id, ...updatedSnap.data() } as Devis);
      }

      showToast('✅ Devis signé avec succès !');

      // Passer à l'étape RIB
      setStep('rib');
    } catch (err) {
      console.error('[SignatureDevis] Erreur signature:', err);
      showToast('Erreur lors de la signature', 'error');
    }
  };

  const handleRIBSubmit = async (data: { hasRib: boolean; iban?: string; bic?: string; nom_banque?: string }) => {
    if (!devis) return;

    try {
      if (data.hasRib) {
        await updateDoc(doc(db, 'quotes', devis.id), {
          iban: data.iban,
          bic: data.bic,
          nom_banque: data.nom_banque,
          updatedAt: serverTimestamp(),
        });
      }

      setStep('acompte');
    } catch (err) {
      console.error('[SignatureDevis] Erreur RIB:', err);
      showToast('Erreur lors de l\'enregistrement du RIB', 'error');
    }
  };

  const handleAcompteSubmit = async (data: { montantAcompte: number; typeCompte: 'perso' | 'pro' }) => {
    if (!devis) return;

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
        console.error('[SignatureDevis] Erreur notification:', err);
      }

      showToast('✅ Acompte déclaré avec succès !');
      setStep('termine');
    } catch (err) {
      console.error('[SignatureDevis] Erreur acompte:', err);
      showToast('Erreur lors de la déclaration de l\'acompte', 'error');
    }
  };

  // ═══ ÉCRANS ═══

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <p style={{ fontSize: 14, color: '#6B7280' }}>Chargement...</p>
      </div>
    );
  }

  if (step === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 500, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#DC2626', marginBottom: 12 }}>Lien invalide</h1>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{error}</p>
          <button
            onClick={() => setLocation('/espace-client')}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              background: '#1565C0',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Accéder à mon espace client
          </button>
        </div>
      </div>
    );
  }

  if (step === 'deja_signe') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 500, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginBottom: 12 }}>Devis déjà signé</h1>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
            Le devis <strong>{devis?.numero}</strong> a déjà été signé le{' '}
            {devis?.signe_le?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}.
          </p>
          <button
            onClick={() => setLocation('/espace-client')}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              background: '#1565C0',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Accéder à mon espace client
          </button>
        </div>
      </div>
    );
  }

  if (step === 'apercu' && devis) {
    // Calculer les totaux
    const totalHt = devis.total_ht || 0;
    const totalHtPublic = devis.total_ht_public || totalHt;
    const tva = totalHt * 0.20;  // 20% TVA
    const totalTtc = totalHt + tva;
    const economie = totalHtPublic > totalHt ? totalHtPublic - totalHt : 0;

    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: 20 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {/* En-tête */}
          <div style={{ borderBottom: '2px solid #1565C0', paddingBottom: 16, marginBottom: 24 }}>
            <h1 style={{ color: '#1565C0', fontSize: 24, margin: 0 }}>
              ✍️ Signature de votre devis VIP
            </h1>
            <p style={{ color: '#6B7280', fontSize: 14, margin: '8px 0 0' }}>
              Veuillez vérifier les détails ci-dessous avant de signer.
            </p>
          </div>

          {/* Infos devis */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ color: '#6B7280', fontSize: 12 }}>📋 Numéro de devis</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{devis.numero}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#6B7280', fontSize: 12 }}>👤 Destinataire</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{devis.client_nom || '—'}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{devis.client_email || ''}</div>
            </div>
          </div>

          {/* Tableau détaillé des produits */}
          <div style={{ overflow: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#1565C0', color: '#fff' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Référence</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Description</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Qté</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Prix unitaire</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(devis.lignes || []).map((ligne: any, idx: number) => {
                  const ref = ligne.ref || ligne.reference || '';
                  const prixPublic = ligne.prix_unitaire || 0;
                  const prixNegocie = devis.prix_negocies?.[ref] ?? prixPublic;
                  const estNegocie = devis.is_vip && prixNegocie !== prixPublic;
                  const qte = ligne.qte || 1;
                  const totalLigne = prixNegocie * qte;
                  const totalPublic = prixPublic * qte;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: 10, color: '#374151', fontSize: 12 }}>{ref}</td>
                      <td style={{ padding: 10, color: '#374151' }}>
                        {ligne.libelle || ligne.nom || ligne.nom_fr || ligne.designation || '—'}
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}>{qte}</td>
                      <td style={{ padding: 10, textAlign: 'right' }}>
                        {estNegocie && (
                          <div style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 11 }}>
                            {prixPublic.toLocaleString('fr-FR')} €
                          </div>
                        )}
                        <div style={{
                          color: estNegocie ? '#7C3AED' : '#111827',
                          fontWeight: estNegocie ? 700 : 400
                        }}>
                          {prixNegocie.toLocaleString('fr-FR')} €
                        </div>
                      </td>
                      <td style={{ padding: 10, textAlign: 'right' }}>
                        {estNegocie && (
                          <div style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 11 }}>
                            {totalPublic.toLocaleString('fr-FR')} €
                          </div>
                        )}
                        <div style={{
                          color: estNegocie ? '#7C3AED' : '#111827',
                          fontWeight: estNegocie ? 700 : 400
                        }}>
                          {totalLigne.toLocaleString('fr-FR')} €
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 8, marginBottom: 20 }}>
            {economie > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6B7280' }}>Total prix public</span>
                <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>
                  {totalHtPublic.toLocaleString('fr-FR')} €
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#6B7280' }}>Total HT VIP</span>
              <span style={{ fontWeight: 600, color: '#7C3AED' }}>
                {totalHt.toLocaleString('fr-FR')} €
              </span>
            </div>
            {economie > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#10B981', fontWeight: 600 }}>💰 Économie réalisée</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>
                  -{economie.toLocaleString('fr-FR')} €
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#6B7280' }}>TVA (20%)</span>
              <span>{tva.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          borderTop: '1px solid #E5E7EB', paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Total TTC</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#1565C0' }}>
                {totalTtc.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

          {/* Mention légale */}
          <p style={{ color: '#9CA3AF', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginBottom: 20 }}>
            En signant, vous acceptez les conditions commerciales de votre devis.
            Cette signature est définitive.
          </p>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <button
              onClick={handleSigner}
              style={{
                padding: '16px 24px',
                background: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ✍️ Je signe le devis
            </button>

            <button
              onClick={() => setLocation('/espace-client')}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                color: '#1565C0',
                border: '2px solid #1565C0',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              📄 Voir plus de détails dans mon espace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'termine' && devis) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 500, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginBottom: 12 }}>Tout est en ordre !</h1>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 8 }}>
            Votre devis <strong>{devis.numero}</strong> a été signé et votre acompte déclaré.
          </p>
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
            Nous allons vérifier votre virement sous 24-48h. Vous recevrez une confirmation par email dès réception.
          </p>
          <button
            onClick={() => setLocation('/espace-client')}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              background: '#1565C0',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Accéder à mon espace client
          </button>
        </div>
      </div>
    );
  }

  // ═══ POPUPS RIB + ACOMPTE ═══
  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      {devis && (
        <>
          <PopupSaisieRIB
            isOpen={step === 'rib'}
            onClose={() => {}}
            onSubmit={handleRIBSubmit}
            initialIban={devis.iban}
            initialBic={devis.bic}
            initialNomBanque={devis.nom_banque}
            title="Coordonnées bancaires"
            description="Pour faciliter le virement de votre acompte, merci de nous communiquer votre IBAN."
          />

          <PopupVerserAcompte
            isOpen={step === 'acompte'}
            onClose={() => {}}
            onSubmit={handleAcompteSubmit}
            totalDevis={devis.total_ht}
            title="Déclarer votre acompte"
            minAcomptePct={30}
          />
        </>
      )}
    </div>
  );
}
