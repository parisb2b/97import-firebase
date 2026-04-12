import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';

interface Partner {
  id: string;
  nom: string;
  code: string;
  email: string;
  tel: string;
  commission_taux: number;
  actif: boolean;
}

export default function Partenaires() {
  const { t } = useI18n();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'partners'), orderBy('nom', sortOrder));
      const snap = await getDocs(q);
      setPartners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Partner)));
    } catch (err) {
      console.error('Error loading partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    load();
    return () => clearTimeout(timeout);
  }, [sortOrder]);

  const toggleActif = async (partner: Partner) => {
    try {
      await updateDoc(doc(db, 'partners', partner.id), {
        actif: !partner.actif,
      });
      load();
    } catch (err) {
      console.error('Error toggling:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.partenaires')}</h1>
        <div className="flex items-center gap-4">
          <SortControl value={sortOrder} onChange={setSortOrder} />
          <button className="bg-navy text-white px-4 py-2 rounded hover:bg-navy-dark">
            {t('btn.nouveau')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun partenaire
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Téléphone</th>
                <th className="text-right px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Actif</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                      {p.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.nom}</td>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3">{p.tel || '-'}</td>
                  <td className="px-4 py-3 text-right">{p.commission_taux}%</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActif(p)}
                      className={`w-8 h-8 rounded ${
                        p.actif
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {p.actif ? '✓' : '✕'}
                    </button>
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
