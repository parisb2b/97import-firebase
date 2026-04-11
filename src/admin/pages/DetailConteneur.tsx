import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

interface LigneConteneur {
  ref: string;
  nom_fr: string;
  nom_zh: string;
  qte_colis: number;
  qte_pieces: number;
  l: number;
  L: number;
  h: number;
  volume_m3: number;
  poids_net: number;
}

interface Container {
  id: string;
  numero: string;
  type: string;
  destination: string;
  statut: string;
  date_depart?: any;
  date_arrivee_prevue?: any;
  voyage_number?: string;
  bl_waybill?: string;
  seal?: string;
  port_chargement: string;
  port_destination: string;
  lignes: LigneConteneur[];
  volume_total: number;
  poids_total: number;
}

export default function DetailConteneur() {
  const { t } = useI18n();
  const [, params] = useRoute('/admin/conteneurs/:id');
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const docRef = doc(db, 'containers', params.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setContainer({ id: snap.id, ...snap.data() } as Container);
      }
      setLoading(false);
    };
    load();
  }, [params?.id]);

  const calculateTotals = (lignes: LigneConteneur[]) => {
    const volume_total = lignes.reduce((sum, l) => sum + l.volume_m3, 0);
    const poids_total = lignes.reduce((sum, l) => sum + l.poids_net * l.qte_pieces, 0);
    return { volume_total, poids_total };
  };

  const handleSave = async () => {
    if (!container) return;
    setSaving(true);
    try {
      const totals = calculateTotals(container.lignes);
      await updateDoc(doc(db, 'containers', container.id), {
        ...container,
        ...totals,
        updatedAt: serverTimestamp(),
      });
      setContainer({ ...container, ...totals });
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLigne = () => {
    if (!container) return;
    const newLigne: LigneConteneur = {
      ref: '',
      nom_fr: '',
      nom_zh: '',
      qte_colis: 1,
      qte_pieces: 1,
      l: 0,
      L: 0,
      h: 0,
      volume_m3: 0,
      poids_net: 0,
    };
    setContainer({ ...container, lignes: [...container.lignes, newLigne] });
  };

  const handleLigneChange = (
    index: number,
    field: keyof LigneConteneur,
    value: string | number
  ) => {
    if (!container) return;
    const newLignes = [...container.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };

    // Auto-calcul volume
    if (['l', 'L', 'h'].includes(field)) {
      const { l, L, h } = newLignes[index];
      newLignes[index].volume_m3 = (l * L * h) / 1000000;
    }

    setContainer({ ...container, lignes: newLignes });
  };

  const handleRemoveLigne = (index: number) => {
    if (!container) return;
    setContainer({
      ...container,
      lignes: container.lignes.filter((_, i) => i !== index),
    });
  };

  const handleStatutChange = async (newStatut: string) => {
    if (!container) return;
    try {
      await updateDoc(doc(db, 'containers', container.id), {
        statut: newStatut,
        updatedAt: serverTimestamp(),
      });
      setContainer({ ...container, statut: newStatut });
    } catch (err) {
      console.error('Error updating statut:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  if (!container) {
    return <div className="text-center py-8 text-gray-500">Conteneur non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{container.numero}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? t('loading') : t('btn.enregistrer')}
          </button>
        </div>
      </div>

      {/* Infos conteneur */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4">Informations conteneur</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-500">Type</label>
            <p className="font-medium">{container.type}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Destination</label>
            <p className="font-medium">{container.destination}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Port chargement</label>
            <p className="font-medium">{container.port_chargement}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Port destination</label>
            <p className="font-medium">{container.port_destination}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Statut</label>
            <select
              value={container.statut}
              onChange={(e) => handleStatutChange(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="préparation">En préparation</option>
              <option value="chargé">Chargé</option>
              <option value="parti">Parti du port</option>
              <option value="arrivé">Arrivé</option>
              <option value="livré">Livré</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Volume total</label>
            <p className="font-medium">{container.volume_total?.toFixed(2)} m³</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Poids total</label>
            <p className="font-medium">
              {container.poids_total?.toLocaleString('fr-FR')} kg
            </p>
          </div>
        </div>
      </div>

      {/* Actions export */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4">Documents export</h2>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
            📥 BC CHINE
          </button>
          <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
            📥 BE EXPORT
          </button>
          <button className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">
            📥 BD INVOICE
          </button>
          <button className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">
            📥 BD PACKING LIST
          </button>
          <button className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm">
            📄 BD Invoice PDF
          </button>
        </div>
      </div>

      {/* Lignes */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Contenu du conteneur</h2>
          <button
            onClick={handleAddLigne}
            className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
          >
            + Ajouter une ligne
          </button>
        </div>

        {container.lignes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun produit</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-salmon-light">
                  <th className="text-left py-2 px-2">Réf</th>
                  <th className="text-left py-2 px-2">Nom FR</th>
                  <th className="text-left py-2 px-2">Nom ZH</th>
                  <th className="text-right py-2 px-2 w-16">Colis</th>
                  <th className="text-right py-2 px-2 w-16">Pièces</th>
                  <th className="text-right py-2 px-2 w-16">L cm</th>
                  <th className="text-right py-2 px-2 w-16">l cm</th>
                  <th className="text-right py-2 px-2 w-16">H cm</th>
                  <th className="text-right py-2 px-2 w-20">Vol m³</th>
                  <th className="text-right py-2 px-2 w-20">Poids kg</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {container.lignes.map((ligne, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={ligne.ref}
                        onChange={(e) =>
                          handleLigneChange(index, 'ref', e.target.value)
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={ligne.nom_fr}
                        onChange={(e) =>
                          handleLigneChange(index, 'nom_fr', e.target.value)
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={ligne.nom_zh}
                        onChange={(e) =>
                          handleLigneChange(index, 'nom_zh', e.target.value)
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={ligne.qte_colis}
                        onChange={(e) =>
                          handleLigneChange(index, 'qte_colis', Number(e.target.value))
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm text-right"
                        min={1}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={ligne.qte_pieces}
                        onChange={(e) =>
                          handleLigneChange(index, 'qte_pieces', Number(e.target.value))
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm text-right"
                        min={1}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={ligne.l}
                        onChange={(e) =>
                          handleLigneChange(index, 'l', Number(e.target.value))
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm text-right"
                        min={0}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={ligne.L}
                        onChange={(e) =>
                          handleLigneChange(index, 'L', Number(e.target.value))
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm text-right"
                        min={0}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={ligne.h}
                        onChange={(e) =>
                          handleLigneChange(index, 'h', Number(e.target.value))
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm text-right"
                        min={0}
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      {ligne.volume_m3.toFixed(3)}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={ligne.poids_net}
                        onChange={(e) =>
                          handleLigneChange(index, 'poids_net', Number(e.target.value))
                        }
                        className="w-full border rounded px-1 py-0.5 text-sm text-right"
                        min={0}
                      />
                    </td>
                    <td className="py-2 px-2">
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
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
