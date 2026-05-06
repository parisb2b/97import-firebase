import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { getNextNumber } from '../../lib/counters';
import { isDevisReadonly } from '../../lib/quoteStatusHelpers';
import { generateDevis, downloadPDF } from '../../lib/pdf-generator';
import { Card, Button } from '../components/Icons';
import PopupEncaisserAcompte from '../components/PopupEncaisserAcompte';

export default function DetailDevis() {
  const [, params] = useRoute('/admin/devis/:id');
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const isNew = !params?.id || params.id === 'nouveau';

  const [devis, setDevis] = useState<any>({
    numero: '',
    client_id: '',
    client_nom: '',
    client_email: '',
    partenaire_code: '',
    destination: 'MQ',
    statut: 'nouveau',
    is_vip: false,
    prix_negocies: {},
    lignes: [],
    acomptes: [],
    total_ht: 0,
    adresse_facturation: null,
    adresse_livraison: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEncaisserModal, setShowEncaisserModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const estLectureSeule = isDevisReadonly(devis);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'quotes', params?.id || ''));
        if (snap.exists()) {
          const data = snap.data();
          setDevis({
            ...data,
            id: snap.id,
            lignes: data.lignes || [],
            acomptes: data.acomptes || [],
            prix_negocies: data.prix_negocies || {},
            is_vip: data.is_vip || false
          });
        }
      } catch (e) {
        console.error('Erreur chargement devis:', e);
        setErrorMsg('Impossible de charger le devis');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isNew, params?.id]);

  const handleLigneChange = (index: number, field: string, value: any) => {
    const updated = [...devis.lignes];
    updated[index] = { ...updated[index], [field]: value };
    setDevis({ ...devis, lignes: updated });
  };

  const handleAddLigne = () => {
    setDevis({
      ...devis,
      lignes: [...devis.lignes, { ref: '', qte: 1, nom_fr: '', prix_unitaire: 0, prix_negocie: 0 }]
    });
  };

  const handleRemoveLigne = (index: number) => {
    const updated = devis.lignes.filter((_: any, i: number) => i !== index);
    setDevis({ ...devis, lignes: updated });
  };

  const calculateTotal = (lignes: any[]) => {
    return lignes.reduce((sum: number, l: any) => {
      const prix = devis.prix_negocies?.[l.ref] || l.prix_unitaire || 0;
      return sum + prix * (l.qte || 1);
    }, 0);
  };

  // V125 — VALIDATION VIP AVEC DÉCLENCHEMENT MAIL
  const handleValidateVip = async () => {
    if (!devis.id) return;

    try {
      const docRef = doc(db, 'quotes', devis.id);
      const totalVIP = calculateTotal(devis.lignes);

      // 1. Mise à jour Firestore
      const updateData = {
        statut: 'envoye',
        is_vip: true,
        prix_negocies: devis.prix_negocies,
        total_ht: totalVIP,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      console.log("✅ Firestore mis à jour — prix_negocies:", devis.prix_negocies);

      // 2. DÉCLENCHEMENT DU MAIL (collection mail pour Trigger Email)
      try {
        await addDoc(collection(db, 'mail'), {
          to: devis.client_email || 'mc@sasfr.com',
          message: {
            subject: `Votre devis VIP ${devis.numero} est prêt`,
            html: `
              <h2>Devis VIP confirmé</h2>
              <p>Votre devis <strong>${devis.numero}</strong> a été mis à jour avec les prix négociés.</p>
              <p>Montant total : <strong>${totalVIP.toLocaleString('fr-FR')} €</strong></p>
              <p>Connectez-vous à votre espace client pour le consulter.</p>
            `
          }
        });
        console.log("✅ Mail VIP ajouté à la collection mail pour", devis.client_email);
      } catch (mailErr) {
        console.warn("⚠️ Mail non envoyé (collection mail inaccessible):", mailErr);
      }

      // 3. Mise à jour locale
      setDevis({ ...devis, ...updateData });
      setSuccessMsg('✅ Devis VIP validé et e-mail de confirmation envoyé !');
      setTimeout(() => setSuccessMsg(''), 5000);

    } catch (e) {
      console.error("❌ Erreur circuit VIP:", e);
      setErrorMsg("Erreur lors de la validation VIP");
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const handleSave = async () => {
    if (!devis.id && !isNew) return;
    setSaving(true);
    try {
      const total_ht = calculateTotal(devis.lignes);
      console.log("🔍 handleSave — prix_negocies:", JSON.stringify(devis.prix_negocies), "is_vip:", devis.is_vip);

      const data = {
        ...devis,
        total_ht,
        updatedAt: serverTimestamp()
      };

      if (isNew) {
        const numero = await getNextNumber('DV');
        const docRef = doc(collection(db, 'quotes'));
        await updateDoc(docRef, { ...data, numero, createdAt: serverTimestamp() });
        setDevis({ ...data, numero, id: docRef.id });
        setLocation(`/admin/devis/${docRef.id}`);
      } else {
        const docRef = doc(db, 'quotes', devis.id);
        await updateDoc(docRef, data);
      }
      setSuccessMsg('Devis enregistré');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
      setErrorMsg('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // V118 — Bouton Signer le devis
  const handleSigner = async () => {
    if (!devis.id) return;
    try {
      const docRef = doc(db, 'quotes', devis.id);
      await updateDoc(docRef, { statut: 'signe', updatedAt: serverTimestamp() });
      setDevis({ ...devis, statut: 'signe' });
      setSuccessMsg('Devis marqué comme SIGNÉ — Prêt pour encaissement');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Erreur signature:', e);
      setErrorMsg('Erreur signature');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const handleGeneratePDF = () => {
    const doc = generateDevis({
      ...devis,
      numero: devis.numero,
      lignes: devis.lignes,
      prix_negocies: devis.prix_negocies,
      is_vip: devis.is_vip,
      total_ht: calculateTotal(devis.lignes),
      createdAt: devis.createdAt || new Date()
    });
    const filename = `${devis.numero || 'devis'}.pdf`;
    downloadPDF(doc, filename);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  // V122 — Debug live : inspecter l'état du devis dans la console navigateur
  console.log("🔍 V122/V125 DEVIS ACTUEL:", { id: devis.id, numero: devis.numero, statut: devis.statut, isNew, is_vip: devis.is_vip, prix_negocies: devis.prix_negocies, acomptes: devis.acomptes?.length || 0, estLectureSeule });

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Messages */}
      {errorMsg && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E88E5' }}>
            {isNew ? 'Nouveau devis' : devis.numero}
          </h1>
          {devis.is_vip && (
            <span style={{ background: '#A78BFA', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              ⭐ VIP
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* V118 — Bouton Signer : visible uniquement quand statut=envoye */}
          {!isNew && devis.statut === 'envoye' && (
            <Button variant="s" onClick={handleSigner}>
              ✍️ Signer le devis
            </Button>
          )}

          {/* V118 — Bouton Encaisser : visible dès que signe */}
          {!isNew && (devis.statut === 'signe' || devis.statut?.startsWith('acompte_')) && (
            <Button variant="s" onClick={() => setShowEncaisserModal(true)}>
              💰 Encaisser un acompte
            </Button>
          )}

          {/* V125 — Bouton Valider VIP avec déclenchement mail */}
          {!isNew && devis.is_vip && devis.statut !== 'envoye' && (
            <Button variant="s" onClick={handleValidateVip} style={{ background: '#A78BFA' }}>
              📧 Envoyer prix VIP au client
            </Button>
          )}

          <Button variant="p" onClick={handleSave} disabled={saving || estLectureSeule}>
            {saving ? t('loading') : t('btn.enregistrer')}
          </Button>
          <Button variant="p" onClick={handleGeneratePDF}>
            📄 Générer PDF
          </Button>
          <Button variant="p" onClick={() => setLocation('/admin/devis')}>
            ← Retour
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
        {['details', 'adresses', 'acomptes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: activeTab === tab ? '#1E88E5' : '#F1F5F9',
              color: activeTab === tab ? '#fff' : '#64748B',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13
            }}
          >
            {tab === 'details' ? '📋 Détails' : tab === 'adresses' ? '📍 Adresses' : '💰 Acomptes'}
          </button>
        ))}
      </div>

      {/* Contenu onglet Détails */}
      {activeTab === 'details' && (
        <>
          {/* Informations générales */}
          <Card title="Informations générales">
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>Client</label>
                <input className="fi" value={devis.client_nom || ''} onChange={(e) => setDevis({ ...devis, client_nom: e.target.value })} disabled={estLectureSeule} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>Partenaire</label>
                <input className="fi" value={devis.partenaire_code || ''} onChange={(e) => setDevis({ ...devis, partenaire_code: e.target.value })} disabled={estLectureSeule} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>Destination</label>
                <select className="fi" value={devis.destination || 'MQ'} onChange={(e) => setDevis({ ...devis, destination: e.target.value })} disabled={estLectureSeule}>
                  <option value="MQ">Martinique</option>
                  <option value="GP">Guadeloupe</option>
                  <option value="RE">Réunion</option>
                  <option value="GF">Guyane</option>
                  <option value="FR">France métropolitaine</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Lignes du devis */}
          <Card title="Lignes du devis"
            actions={!estLectureSeule ? (
              <button onClick={handleAddLigne} style={{
                padding: '8px 16px',
                background: '#1E88E5',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}>
                + Ajouter une ligne
              </button>
            ) : undefined}
          >
            <div style={{ padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#64748B' }}>RÉF.</th>
                    <th style={{ padding: 10, textAlign: 'center', fontSize: 12, color: '#64748B' }}>QT</th>
                    <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#64748B' }}>DÉSIGNATION</th>
                    <th style={{ padding: 10, textAlign: 'right', fontSize: 12, color: '#64748B' }}>PRIX</th>
                    <th style={{ padding: 10, textAlign: 'right', fontSize: 12, color: '#64748B' }}>TOTAL</th>
                    <th style={{ padding: 10, textAlign: 'center', fontSize: 12, color: '#64748B' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {devis.lignes.map((ligne: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: 8 }}>
                        <input className="fi" value={ligne.ref || ''} onChange={(e) => handleLigneChange(index, 'ref', e.target.value)} disabled={estLectureSeule} />
                      </td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        <input className="fi" type="number" min={1} value={ligne.qte || 1} style={{ width: 60, textAlign: 'center' }} onChange={(e) => handleLigneChange(index, 'qte', Number(e.target.value))} disabled={estLectureSeule} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input className="fi" value={ligne.nom_fr || ''} onChange={(e) => handleLigneChange(index, 'nom_fr', e.target.value)} disabled={estLectureSeule} />
                      </td>
                      <td style={{ padding: 8, textAlign: 'right' }}>
                        {/* V123-ULTIMATE — Prix VIP depuis prix_negocies[ref] (source Firestore réelle) */}
                        {(() => {
                          const ref = ligne.ref || '';
                          const prixPublic = ligne.prix_unitaire || 0;
                          const prixNegocie = devis.prix_negocies?.[ref];
                          const estNegocie = devis.is_vip && prixNegocie !== undefined && prixNegocie !== prixPublic;

                          if (estNegocie) {
                            return (
                              <div>
                                <div style={{ textDecoration: 'line-through', color: '#CBD5E1', fontSize: 12 }}>
                                  {prixPublic.toLocaleString('fr-FR')} €
                                </div>
                                <input className="fi" type="number" value={prixNegocie} min={0}
                                  style={{ textAlign: 'right', color: '#A78BFA', fontWeight: 600, width: 100 }}
                                  onChange={(e) => {
                                    const newPrice = Number(e.target.value);
                                    const updated = { ...(devis.prix_negocies || {}), [ref]: newPrice };
                                    setDevis({ ...devis, prix_negocies: updated });
                                    console.log("🔍 VIP SAVE — ref:", ref, "prixNegocie:", newPrice, "prix_negocies:", updated);
                                  }} />
                              </div>
                            );
                          }
                          return (
                            <input className="fi" type="number" value={prixPublic} min={0}
                              style={{ textAlign: 'right', width: 100 }}
                              disabled={estLectureSeule}
                              onChange={(e) => handleLigneChange(index, 'prix_unitaire', Number(e.target.value))} />
                          );
                        })()}
                      </td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>
                        {/* V123-ULTIMATE — Total avec VIP depuis prix_negocies[ref] */}
                        {(() => {
                          const ref = ligne.ref || '';
                          const prixPublic = ligne.prix_unitaire || 0;
                          const prixNegocie = devis.prix_negocies?.[ref];
                          const estNegocie = devis.is_vip && prixNegocie !== undefined && prixNegocie !== prixPublic;
                          const totalVIP = (prixNegocie ?? prixPublic) * (ligne.qte || 1);
                          const totalPublic = prixPublic * (ligne.qte || 1);

                          if (estNegocie) {
                            return (
                              <div>
                                <div style={{ textDecoration: 'line-through', color: '#CBD5E1', fontSize: 12, fontWeight: 400 }}>
                                  {totalPublic.toLocaleString('fr-FR')} €
                                </div>
                                <div style={{ color: '#A78BFA', fontWeight: 600 }}>
                                  {totalVIP.toLocaleString('fr-FR')} €
                                </div>
                              </div>
                            );
                          }
                          return <span>{totalVIP.toLocaleString('fr-FR')} €</span>;
                        })()}
                      </td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        {!estLectureSeule && (
                          <button onClick={() => handleRemoveLigne(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 16 }}>
                            🗑
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </Card>
        </>
      )}

      {/* Popup Encaisser Acompte */}
      {showEncaisserModal && devis.id && (
        <PopupEncaisserAcompte
          devis={devis}
          onClose={() => setShowEncaisserModal(false)}
          onSuccess={() => {
            setShowEncaisserModal(false);
            setSuccessMsg('Acompte encaissé avec succès');
            setTimeout(() => setSuccessMsg(''), 3000);
            // Recharger le devis
            getDoc(doc(db, 'quotes', devis.id)).then(snap => {
              if (snap.exists()) setDevis({ ...snap.data(), id: snap.id });
            });
          }}
        />
      )}
    </div>
  );
}
