import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';
import { DuplicateBtn, duplicateDoc } from '../../components/DuplicateBtn';

interface Container {
  id: string;
  numero: string;
  type: string;
  destination: string;
  statut: string;
  volume_total: number;
  poids_total: number;
  createdAt: any;
}

const STATUTS: Record<string, { label: string; color: string }> = {
  préparation: { label: 'En préparation', color: 'bg-gray-100 text-gray-700' },
  chargé: { label: 'Chargé', color: 'bg-blue-100 text-blue-700' },
  parti: { label: 'En transit', color: 'bg-orange-100 text-orange-700' },
  arrivé: { label: 'Arrivé', color: 'bg-green-100 text-green-700' },
  livré: { label: 'Livré', color: 'bg-green-200 text-green-800' },
};

export default function ListeConteneurs() {
  const { t } = useI18n();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const load = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'containers'),
        orderBy('createdAt', sortOrder)
      );
      const snap = await getDocs(q);
      setContainers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Container)));
    } catch (err) {
      console.error('Error loading containers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sortOrder]);

  const handleDuplicate = async (c: Container) => {
    try {
      await duplicateDoc(c, 'containers', 'CONT');
      load();
    } catch (err) {
      console.error('Error duplicating:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.conteneurs')}</h1>
        <div className="flex items-center gap-4">
          <SortControl value={sortOrder} onChange={setSortOrder} />
          <Link href="/admin/conteneurs/nouveau">
            <a className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90">
              {t('btn.nouveau')}
            </a>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : containers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun conteneur
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Numéro</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Destination</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Volume</th>
                <th className="text-right px-4 py-3 font-medium">Poids</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/conteneurs/${c.id}`}>
                      <a className="text-navy hover:underline font-medium">
                        {c.numero}
                      </a>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3">{c.destination}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        STATUTS[c.statut]?.color || 'bg-gray-100'
                      }`}
                    >
                      {STATUTS[c.statut]?.label || c.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.volume_total?.toFixed(2)} m³
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.poids_total?.toLocaleString('fr-FR')} kg
                  </td>
                  <td className="px-4 py-3">
                    <DuplicateBtn onClick={() => handleDuplicate(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
