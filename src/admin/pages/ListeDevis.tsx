import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';
import { DuplicateBtn, duplicateDoc } from '../../components/DuplicateBtn';

interface Devis {
  id: string;
  numero: string;
  client_nom: string;
  client_email: string;
  statut: string;
  total_ht: number;
  createdAt: any;
}

export default function ListeDevis() {
  const { t } = useI18n();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const loadDevis = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'quotes'),
        orderBy('createdAt', sortOrder)
      );
      const snap = await getDocs(q);
      setDevis(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Devis)));
    } catch (err) {
      console.error('Error loading devis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevis();
  }, [sortOrder]);

  const handleDuplicate = async (d: Devis) => {
    try {
      await duplicateDoc(d, 'quotes', 'DVS');
      loadDevis();
    } catch (err) {
      console.error('Error duplicating:', err);
    }
  };

  const getStatutClass = (statut: string) => {
    switch (statut) {
      case 'accepte':
        return 'bg-green-100 text-green-700';
      case 'envoye':
        return 'bg-blue-100 text-blue-700';
      case 'refuse':
        return 'bg-red-100 text-red-700';
      case 'annule':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.devis')}</h1>
        <div className="flex items-center gap-4">
          <SortControl value={sortOrder} onChange={setSortOrder} />
          <Link href="/admin/devis/nouveau">
            <a className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90">
              {t('btn.nouveau')}
            </a>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : devis.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun devis
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Numéro</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Total HT</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {devis.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/devis/${d.id}`}>
                      <a className="text-navy hover:underline font-medium">
                        {d.numero}
                      </a>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{d.client_nom || '-'}</div>
                    <div className="text-sm text-gray-500">{d.client_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${getStatutClass(
                        d.statut
                      )}`}
                    >
                      {t(`statut.${d.statut}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.total_ht?.toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-4 py-3">
                    <DuplicateBtn onClick={() => handleDuplicate(d)} />
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
