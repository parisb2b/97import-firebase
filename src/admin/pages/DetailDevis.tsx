import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { getNextNumber } from '../../lib/counters';
import { OrangeIndicator } from '../../components/OrangeIndicator';
import { generateDevis, downloadPDF } from '../../lib/pdf-generator';
import { Card, Button } from '../components/Icons';

interface LigneDevis {
  ref: string;
  nom_fr: string;
  qte: number;
  prix_unitaire: number;
  total: number;
}

interface Devis {
  id?: string;
  numero: string;
  client_id: string;
  client_nom: string;
  client_email: string;
  client_tel: string;
  client_adresse: string;
  client_siret: string;
  partenaire_id: string | null;
  statut: string;
  lignes: LigneDevis[];
  total_ht: number;
  acompte_pct: number;
  acomptes: any[];
  total_encaisse: number;
  solde_restant: number;
  destination: string;
}

const emptyDevis: Devis = {
  numero: '',
  client_id: '',
  client_nom: '',
  client_email: '',
  client_tel: '',
  client_adresse: '',
  client_siret: '',
  partenaire_id: null,
  statut: 'brouillon',
  lignes: [],
  total_ht: 0,
  acompte_pct: 30,
  acomptes: [],
  total_encaisse: 0,
  solde_restant: 0,
  destination: 'MQ',
};

export default function DetailDevis() {
  const { t } = useI18n();
  const [, params] = useRoute('/admin/devis/:id');
  const [, setLocation] = useLocation();
  const [devis, setDevis] = useState<Devis>(emptyDevis);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAcompteModal, setShowAcompteModal] = useState(false);
  const [acompteMontant, setAcompteMontant] = useState(0);
  const [emetteurData, setEmetteurData] = useState<any>(null);

  const isNew = params?.id === 'nouveau';

  useEffect(() => {
    const fetchEmetteur = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin_params', 'emetteur'));
        if (snap.exists()) setEmetteurData(snap.data());
      } catch (e) {
        console.error('Erreur chargement émetteur:', e);
      }
    };
    fetchEmetteur();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (isNew) {
          const numero = await getNextNumber('DVS');
          setDevis({ ...emptyDevis, numero });
          setLoading(false);
          return;
        }

        if (params?.id) {
          const docRef = doc(db, 'quotes', params.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setDevis({
              id: snap.id,
              numero: data.numero || snap.id,
              client_id: data.client_id || '',
              client_nom: data.client_nom || '',
              client_email: data.client_email || '',
              client_tel: data.client_tel || '',
              client_adresse: data.client_adresse || '',
              client_siret: data.client_siret || '',
              partenaire_id: data.partenaire_id || null,
              statut: data.statut || 'brouillon',
              lignes: data.lignes || [],
              total_ht: data.total_ht || 0,
              acompte_pct: data.acompte_pct || 30,
              acomptes: data.acomptes || [],
              total_encaisse: data.total_encaisse || 0,
              solde_restant: data.solde_restant || 0,
              destination: data.destination || 'MQ',
            });
          } else {
            setError(`Devis ${params.id} introuvable`);
          }
        }
      } catch (err: any) {
        console.error('Erreur chargement devis:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id, isNew]);

  const calculateTotal = (lignes: LigneDevis[]) => {
    return lignes.reduce((sum, l) => sum + l.total, 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const total_ht = calculateTotal(devis.lignes);
      const data = {
        ...devis,
        total_ht,
        solde_restant: total_ht - devis.total_encaisse,
        updatedAt: serverTimestamp(),
      };

      if (isNew || !devis.id) {
        const newId = devis.numero.replace(/[^a-zA-Z0-9]/g, '-');
        await setDoc(doc(db, 'quotes', newId), {
          ...data,
          createdAt: serverTimestamp(),
        });
        setLocation(`/admin/devis/${newId}`);
      } else {
        await updateDoc(doc(db, 'quotes', devis.id), data);
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLigne = () => {
    setDevis({
      ...devis,
      lignes: [
        ...devis.lignes,
        { ref: '', nom_fr: '', qte: 1, prix_unitaire: 0, total: 0 },
      ],
    });
  };

  const handleLigneChange = (
    index: number,
    field: keyof LigneDevis,
    value: string | number
  ) => {
    const newLignes = [...devis.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    if (field === 'qte' || field === 'prix_unitaire') {
      newLignes[index].total =
        newLignes[index].qte * newLignes[index].prix_unitaire;
    }
    setDevis({ ...devis, lignes: newLignes });
  };

  const handleRemoveLigne = (index: number) => {
    setDevis({
      ...devis,
      lignes: devis.lignes.filter((_, i) => i !== index),
    });
  };

  const handleEncaisser = async () => {
    if (!devis.id || acompteMontant <= 0) return;

    try {
      const faNumero = await getNextNumber('FA');
      const newAcompte = {
        date: new Date().toISOString(),
        montant: acompteMontant,
        ref_fa: faNumero,
      };

      const newTotalEncaisse = devis.total_encaisse + acompteMontant;

      await updateDoc(doc(db, 'quotes', devis.id), {
        acomptes: arrayUnion(newAcompte),
        total_encaisse: newTotalEncaisse,
        solde_restant: devis.total_ht - newTotalEncaisse,
        updatedAt: serverTimestamp(),
      });

      setDevis({
        ...devis,
        acomptes: [...devis.acomptes, newAcompte],
        total_encaisse: newTotalEncaisse,
        solde_restant: devis.total_ht - newTotalEncaisse,
      });

      setShowAcompteModal(false);
      setAcompteMontant(0);
    } catch (err) {
      console.error('Error adding acompte:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div className="alert rd">
          <strong>Erreur</strong> — {error}
          <br />
          <a href="/admin/devis" style={{ color: 'var(--bl)', marginTop: 8, display: 'inline-block' }}>
            Retour à la liste des devis
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18 }}>
          {isNew ? 'Nouveau devis' : devis.numero}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isNew && devis.statut === 'accepte' && (
            <Button variant="s" onClick={() => setShowAcompteModal(true)}>
              {t('btn.encaisser')}
            </Button>
          )}
          <Button variant="p" onClick={handleSave} disabled={saving}>
            {saving ? t('loading') : t('btn.enregistrer')}
          </Button>
          {!isNew && (
            <Button variant="t" onClick={() => {
              console.log('PDF data:', JSON.stringify(devis, null, 2));
              const pdfDoc = generateDevis(devis, emetteurData);
              downloadPDF(pdfDoc, `${devis.numero}.pdf`);
            }}>
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* Client info */}
      <Card title="Informations client">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
          <div className="fg">
            <div className="fl">Nom <OrangeIndicator show={!devis.client_nom} /></div>
            <input className="fi" type="text" value={devis.client_nom}
              onChange={(e) => setDevis({ ...devis, client_nom: e.target.value })} />
          </div>
          <div className="fg">
            <div className="fl">Email <OrangeIndicator show={!devis.client_email} /></div>
            <input className="fi" type="email" value={devis.client_email}
              onChange={(e) => setDevis({ ...devis, client_email: e.target.value })} />
          </div>
          <div className="fg">
            <div className="fl">Téléphone</div>
            <input className="fi" type="tel" value={devis.client_tel}
              onChange={(e) => setDevis({ ...devis, client_tel: e.target.value })} />
          </div>
          <div className="fg">
            <div className="fl">SIRET</div>
            <input className="fi" type="text" value={devis.client_siret}
              onChange={(e) => setDevis({ ...devis, client_siret: e.target.value })} />
          </div>
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <div className="fl">Adresse</div>
            <textarea className="fi" value={devis.client_adresse} rows={2}
              onChange={(e) => setDevis({ ...devis, client_adresse: e.target.value })} />
          </div>
          <div className="fg">
            <div className="fl">Destination</div>
            <select className="fsel" value={devis.destination}
              onChange={(e) => setDevis({ ...devis, destination: e.target.value })}>
              <option value="MQ">Martinique</option>
              <option value="GP">Guadeloupe</option>
              <option value="RE">Réunion</option>
              <option value="GF">Guyane</option>
              <option value="FR">France métropolitaine</option>
            </select>
          </div>
          <div className="fg">
            <div className="fl">Statut</div>
            <select className="fsel" value={devis.statut}
              onChange={(e) => setDevis({ ...devis, statut: e.target.value })}>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lignes */}
      <Card title="Lignes du devis" actions={
        <Button variant="o" onClick={handleAddLigne} style={{ fontSize: 12 }}>
          + Ajouter une ligne
        </Button>
      }>
        {devis.lignes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--tx3)' }}>Aucune ligne</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Réf</th>
                <th>Désignation</th>
                <th style={{ textAlign: 'right', width: 80 }}>Qté</th>
                <th style={{ textAlign: 'right', width: 110 }}>PU HT</th>
                <th style={{ textAlign: 'right', width: 110 }}>Total HT</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {devis.lignes.map((ligne, index) => (
                <tr key={index}>
                  <td>
                    <input className="fi" type="text" value={ligne.ref}
                      onChange={(e) => handleLigneChange(index, 'ref', e.target.value)} />
                  </td>
                  <td>
                    <input className="fi" type="text" value={ligne.nom_fr}
                      onChange={(e) => handleLigneChange(index, 'nom_fr', e.target.value)} />
                  </td>
                  <td>
                    <input className="fi" type="number" value={ligne.qte} min={1}
                      style={{ textAlign: 'right' }}
                      onChange={(e) => handleLigneChange(index, 'qte', Number(e.target.value))} />
                  </td>
                  <td>
                    <input className="fi" type="number" value={ligne.prix_unitaire} min={0}
                      style={{ textAlign: 'right' }}
                      onChange={(e) => handleLigneChange(index, 'prix_unitaire', Number(e.target.value))} />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {ligne.total.toLocaleString('fr-FR')} €
                  </td>
                  <td>
                    <button onClick={() => handleRemoveLigne(index)}
                      style={{ color: 'var(--rd)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, padding: '12px 8px' }}>
                  Total HT
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 8px' }}>
                  {calculateTotal(devis.lignes).toLocaleString('fr-FR')} €
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>

      {/* Acomptes */}
      {devis.acomptes && devis.acomptes.length > 0 && (
        <Card title="Acomptes encaissés">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Référence</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {devis.acomptes.map((a, i) => (
                <tr key={i}>
                  <td>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                  <td>{a.ref_fa}</td>
                  <td style={{ textAlign: 'right' }}>{a.montant.toLocaleString('fr-FR')} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 700, padding: '12px 8px' }}>
                  Solde restant
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 8px', color: 'var(--or)' }}>
                  {devis.solde_restant?.toLocaleString('fr-FR')} €
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}

      {/* Modal Acompte */}
      {showAcompteModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: 380, padding: 24 }}>
            <div className="ct" style={{ marginBottom: 16 }}>Enregistrer un acompte</div>
            <div className="fg">
              <div className="fl">Montant (€)</div>
              <input className="fi" type="number" value={acompteMontant} min={0}
                onChange={(e) => setAcompteMontant(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button variant="o" onClick={() => setShowAcompteModal(false)}>
                {t('btn.annuler')}
              </Button>
              <Button variant="s" onClick={handleEncaisser}>
                {t('btn.encaisser')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
