import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';

interface Client {
  id: string;
  email: string;
  nom: string;
  role: string;
  createdAt: any;
}

const ROLES: Record<string, { label: string; color: string }> = {
  user: { label: 'Client', color: 'bg-gray-100 text-gray-700' },
  vip: { label: 'VIP', color: 'bg-purple-100 text-purple-700' },
  partner: { label: 'Partenaire', color: 'bg-blue-100 text-blue-700' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
};

export default function Clients() {
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'profiles'), orderBy('createdAt', sortOrder));
        const snap = await getDocs(q);
        setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client)));
      } catch (err) {
        console.error('Error loading clients:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.clients')}</h1>
        <SortControl value={sortOrder} onChange={setSortOrder} />
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun client
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Rôle</th>
                <th className="text-left px-4 py-3 font-medium">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.nom || '-'}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        ROLES[c.role]?.color || 'bg-gray-100'
                      }`}
                    >
                      {ROLES[c.role]?.label || c.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {c.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '-'}
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
