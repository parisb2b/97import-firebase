import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';

interface StockItem {
  id: string;
  ref_piece: string;
  nom: string;
  compatible: string[];
  qte: number;
  seuil_alerte: number;
}

export default function Stock() {
  const { t } = useI18n();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'stock'), orderBy('ref_piece', sortOrder));
        const snap = await getDocs(q);
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockItem)));
      } catch (err) {
        console.error('Error loading stock:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.stock')}</h1>
        <div className="flex items-center gap-4">
          <SortControl value={sortOrder} onChange={setSortOrder} />
          <button className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90">
            {t('btn.nouveau')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucune pièce en stock
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Référence</th>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Compatible avec</th>
                <th className="text-right px-4 py-3 font-medium">Quantité</th>
                <th className="text-right px-4 py-3 font-medium">Seuil</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.ref_piece}</td>
                  <td className="px-4 py-3">{item.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {item.compatible?.join(', ') || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">{item.qte}</td>
                  <td className="px-4 py-3 text-right">{item.seuil_alerte}</td>
                  <td className="px-4 py-3">
                    {item.qte <= item.seuil_alerte ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                        Alerte
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                        OK
                      </span>
                    )}
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
