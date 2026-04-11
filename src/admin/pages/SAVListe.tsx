import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';

interface SAV {
  id: string;
  numero: string;
  client_id: string;
  quote_id: string;
  produit_ref: string;
  description: string;
  statut: string;
  createdAt: any;
}

const STATUTS: Record<string, { label: string; color: string }> = {
  nouveau: { label: 'Nouveau', color: 'bg-red-100 text-red-700' },
  'en cours': { label: 'En cours', color: 'bg-orange-100 text-orange-700' },
  résolu: { label: 'Résolu', color: 'bg-green-100 text-green-700' },
  fermé: { label: 'Fermé', color: 'bg-gray-100 text-gray-500' },
};

export default function SAVListe() {
  const { t } = useI18n();
  const [savList, setSavList] = useState<SAV[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'sav'), orderBy('createdAt', sortOrder));
        const snap = await getDocs(q);
        setSavList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SAV)));
      } catch (err) {
        console.error('Error loading SAV:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, [sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.sav')}</h1>
        <SortControl value={sortOrder} onChange={setSortOrder} />
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : savList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun ticket SAV
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Numéro</th>
                <th className="text-left px-4 py-3 font-medium">Produit</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Devis lié</th>
              </tr>
            </thead>
            <tbody>
              {savList.map((sav) => (
                <tr key={sav.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/sav/${sav.id}`}>
                      <a className="text-navy hover:underline font-medium">
                        {sav.numero}
                      </a>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{sav.produit_ref}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {sav.description}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        STATUTS[sav.statut]?.color || 'bg-gray-100'
                      }`}
                    >
                      {STATUTS[sav.statut]?.label || sav.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sav.quote_id || '-'}
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
