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
    const totalHt = devis.total_ht || 0;
    const lignes = devis.lignes || [];

    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: 20 }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, marginBottom: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1565C0', marginBottom: 8 }}>Signature de devis</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Devis {devis.numero}</p>
          </div>

          {/* Devis */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E3A5F', marginBottom: 20 }}>Récapitulatif</h2>

            {lignes.map((l: any, i: number) => {
              const prixUnit = l.prix_negocie || l.prix_unitaire || 0;
              const qte = l.qte || 1;
              const total = prixUnit * qte;

              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 4 }}>{l.nom_fr || l.ref}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {qte}× {prixUnit.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{total.toLocaleString('fr-FR')} €</p>
                </div>
              );
            })}

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '2px solid #1565C0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1E3A5F' }}>Total HT</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#1565C0' }}>{totalHt.toLocaleString('fr-FR')} €</p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>
              En signant ce devis, vous acceptez les conditions générales de vente et vous vous engagez à verser un acompte pour lancer la commande.
            </p>
            <button
              onClick={handleSigner}
              style={{
                width: '100%',
                padding: '16px 0',
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✍️ Je signe ce devis
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
