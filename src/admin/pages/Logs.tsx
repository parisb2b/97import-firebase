import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { adminDb, db as clientDb } from '../../lib/firebase';
import { fetchRecentLogs } from '../../lib/logService';
import { toDate } from '../../lib/dateHelpers';
import { Card, Pill } from '../components/Icons';

interface Log {
  id: string;
  action: string;
  type?: string;
  user: string;
  details: Record<string, any>;
  createdAt: any;
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // V91 — Priorité adminDb (page admin, auth admin est active), fallback clientDb
        // logService ecrit avec db client, mais admin est authentifie sur adminApp
        const sources = [adminDb, clientDb].filter(Boolean);
        let allLogs: Log[] = [];

        for (const firestoreDb of sources) {
          try {
            const q = query(collection(firestoreDb, 'logs'), orderBy('createdAt', 'desc'), limit(100));
            const snap = await getDocs(q);
            console.log(`[Logs] ${firestoreDb === adminDb ? 'adminDb' : 'clientDb'}: ${snap.size} logs trouves`);
            if (!snap.empty) {
              const sourceLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Log));
              allLogs = [...allLogs, ...sourceLogs];
            }
          } catch (err2: any) {
            console.warn(`[Logs] Echec lecture ${firestoreDb === adminDb ? 'adminDb' : 'clientDb'}:`, err2?.code || err2?.message);
          }
        }

        // Dedup par ID, tri par date decroissante
        const seen = new Set<string>();
        const deduped = allLogs.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true; });
        deduped.sort((a, b) => {
          const da = a.createdAt?.toDate?.()?.getTime() || 0;
          const db = b.createdAt?.toDate?.()?.getTime() || 0;
          return db - da;
        });
        setLogs(deduped.slice(0, 100));
      } catch (err) {
        console.error('Error loading logs:', err);
        try {
          const recentLogs = await fetchRecentLogs({ limit: 100 });
          setLogs(recentLogs.map((l: any) => ({ id: l.id, ...l } as Log)));
        } catch (e2) {
          console.error('Fallback logs also failed:', e2);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getTypePill = (log: Log) => {
    const t = (log.type || log.action || '').toLowerCase();
    if (t.includes('error') || t.includes('erreur')) return <Pill variant="rd">Erreur</Pill>;
    if (t.includes('warn')) return <Pill variant="or">Warning</Pill>;
    if (t.includes('success') || t.includes('ok')) return <Pill variant="gr">Succès</Pill>;
    return <Pill variant="bl">Info</Pill>;
  };

  const filtered = logs.filter(l => !filterType || (l.type || l.action || '').toLowerCase().includes(filterType));

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;

  return (
    <>
      <div className="filters">
        <select className="fsel" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tous types</option>
          <option value="error">Erreurs</option>
          <option value="warn">Warnings</option>
          <option value="success">Succès</option>
        </select>
      </div>

      <Card title={`Logs système (${filtered.length})`}>
        <table className="admin-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Action</th><th>Utilisateur</th><th>Détails</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun log</td></tr>
            ) : filtered.map((log) => (
              <tr key={log.id}>
                <td style={{ color: 'var(--tx3)', fontSize: 12 }}>{(toDate(log.createdAt) || new Date()).toLocaleString('fr-FR')}</td>
                <td>{getTypePill(log)}</td>
                <td style={{ fontWeight: 600 }}>{log.action}</td>
                <td>{log.user || '—'}</td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--tx3)', fontSize: 12 }}>
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
