import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';

interface Log {
  id: string;
  action: string;
  user: string;
  details: Record<string, any>;
  createdAt: any;
}

export default function Logs() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'logs'),
          orderBy('createdAt', sortOrder),
          limit(100)
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Log)));
      } catch (err) {
        console.error('Error loading logs:', err);
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
        <h1 className="text-2xl font-bold">{t('nav.logs')}</h1>
        <SortControl value={sortOrder} onChange={setSortOrder} />
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun log
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium">Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {log.createdAt?.toDate?.()?.toLocaleString('fr-FR') || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.user || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate">
                    {JSON.stringify(log.details)}
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
