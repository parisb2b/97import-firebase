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
  const [saving, setSaving] = useState(false);
  const [showAcompteModal, setShowAcompteModal] = useState(false);
  const [acompteMontant, setAcompteMontant] = useState(0);

  const isNew = params?.id === 'nouveau';

  useEffect(() => {
    const load = async () => {
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
          setDevis({ id: snap.id, ...snap.data() } as Devis);
        }
      }
      setLoading(false);
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
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? 'Nouveau devis' : devis.numero}
        </h1>
        <div className="flex items-center gap-2">
          {!isNew && devis.statut === 'accepte' && (
            <button
              onClick={() => setShowAcompteModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t('btn.encaisser')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? t('loading') : t('btn.enregistrer')}
          </button>
        </div>
      </div>

      {/* Client info */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4">Informations client</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nom
              <OrangeIndicator show={!devis.client_nom} />
            </label>
            <input
              type="text"
              value={devis.client_nom}
              onChange={(e) =>
                setDevis({ ...devis, client_nom: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
              <OrangeIndicator show={!devis.client_email} />
            </label>
            <input
              type="email"
              value={devis.client_email}
              onChange={(e) =>
                setDevis({ ...devis, client_email: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              type="tel"
              value={devis.client_tel}
              onChange={(e) =>
                setDevis({ ...devis, client_tel: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SIRET</label>
            <input
              type="text"
              value={devis.client_siret}
              onChange={(e) =>
                setDevis({ ...devis, client_siret: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <textarea
              value={devis.client_adresse}
              onChange={(e) =>
                setDevis({ ...devis, client_adresse: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Destination</label>
            <select
              value={devis.destination}
              onChange={(e) =>
                setDevis({ ...devis, destination: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="MQ">Martinique</option>
              <option value="GP">Guadeloupe</option>
              <option value="RE">Réunion</option>
              <option value="GF">Guyane</option>
              <option value="FR">France métropolitaine</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              value={devis.statut}
              onChange={(e) => setDevis({ ...devis, statut: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Lignes du devis</h2>
          <button
            onClick={handleAddLigne}
            className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
          >
            + Ajouter une ligne
          </button>
        </div>

        {devis.lignes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune ligne</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Réf</th>
                <th className="text-left py-2">Désignation</th>
                <th className="text-right py-2 w-20">Qté</th>
                <th className="text-right py-2 w-28">PU HT</th>
                <th className="text-right py-2 w-28">Total HT</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {devis.lignes.map((ligne, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    <input
                      type="text"
                      value={ligne.ref}
                      onChange={(e) =>
                        handleLigneChange(index, 'ref', e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="text"
                      value={ligne.nom_fr}
                      onChange={(e) =>
                        handleLigneChange(index, 'nom_fr', e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={ligne.qte}
                      onChange={(e) =>
                        handleLigneChange(index, 'qte', Number(e.target.value))
                      }
                      className="w-full border rounded px-2 py-1 text-right"
                      min={1}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={ligne.prix_unitaire}
                      onChange={(e) =>
                        handleLigneChange(
                          index,
                          'prix_unitaire',
                          Number(e.target.value)
                        )
                      }
                      className="w-full border rounded px-2 py-1 text-right"
                      min={0}
                    />
                  </td>
                  <td className="py-2 text-right font-medium">
                    {ligne.total.toLocaleString('fr-FR')} €
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => handleRemoveLigne(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={4} className="text-right py-3">
                  Total HT
                </td>
                <td className="text-right py-3">
                  {calculateTotal(devis.lignes).toLocaleString('fr-FR')} €
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Acomptes */}
      {devis.acomptes && devis.acomptes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Acomptes encaissés</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Référence</th>
                <th className="text-right py-2">Montant</th>
              </tr>
            </thead>
            <tbody>
              {devis.acomptes.map((a, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">
                    {new Date(a.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2">{a.ref_fa}</td>
                  <td className="py-2 text-right">
                    {a.montant.toLocaleString('fr-FR')} €
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={2} className="text-right py-3">
                  Solde restant
                </td>
                <td className="text-right py-3">
                  {devis.solde_restant?.toLocaleString('fr-FR')} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal Acompte */}
      {showAcompteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="font-semibold text-lg mb-4">Enregistrer un acompte</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Montant (€)
              </label>
              <input
                type="number"
                value={acompteMontant}
                onChange={(e) => setAcompteMontant(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min={0}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAcompteModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                {t('btn.annuler')}
              </button>
              <button
                onClick={handleEncaisser}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {t('btn.encaisser')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
