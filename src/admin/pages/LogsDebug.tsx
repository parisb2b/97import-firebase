// src/admin/pages/LogsDebug.tsx
// MISSION-V43 / Mini-étape M1 — Page de debug : tous niveaux + filtres.
// Complémentaire à /admin/logs (qui se concentre sur les erreurs).

import { Fragment, useState, useEffect } from 'react';
import { fetchRecentLogs, type LogLevel } from '../../lib/logService';
import { Card, Pill } from '../components/Icons';

interface DebugLog {
  id: string;
  level?: LogLevel | string;
  category?: string;
  message?: string;
  context?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: 'admin' | 'client' | 'anonymous' | string;
  url?: string | null;
  stack?: string | null;
  user_agent?: string | null;
  schema_version?: number;
  // legacy (compat Logs.tsx)
  action?: string;
  type?: string;
  user?: string;
  details?: any;
  createdAt: any;
}

const LEVELS: ('' | LogLevel)[] = ['', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
const ROLES: ('' | 'admin' | 'client' | 'anonymous')[] = ['', 'admin', 'client', 'anonymous'];

function levelPill(log: DebugLog) {
  const lvl = (log.level || log.type || '').toString().toUpperCase();
  if (lvl === 'ERROR' || lvl === 'ERROR') return <Pill variant="rd">ERROR</Pill>;
  if (lvl === 'WARN' || lvl === 'WARNING') return <Pill variant="or">WARN</Pill>;
  if (lvl === 'DEBUG') return <Pill variant="bl">DEBUG</Pill>;
  return <Pill variant="gr">INFO</Pill>;
}

function rolePill(role?: string) {
  if (!role) return null;
  const variant = role === 'admin' ? 'or' : role === 'client' ? 'bl' : 'gr';
  return <Pill variant={variant as any}>{role}</Pill>;
}

export default function LogsDebug() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'' | LogLevel>('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRole, setFilterRole] = useState<'' | 'admin' | 'client' | 'anonymous'>('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const docs = await fetchRecentLogs({
          limit: 300,
          level: filterLevel || undefined,
        });
        setLogs(docs as DebugLog[]);
      } catch (err: any) {
        console.error('[V97 LogsDebug] Erreur Firestore :', err);
        setError(`Erreur Firestore : ${err?.message || err?.code || 'inconnue'}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterLevel]);

  // Récupérer toutes les categories distinctes pour proposer un select
  const categories = Array.from(new Set(
    logs.map(l => l.category).filter((c): c is string => !!c)
  )).sort();

  const filtered = logs.filter(l => {
    if (filterCategory && l.category !== filterCategory) return false;
    if (filterRole && l.user_role !== filterRole) return false;
    if (search) {
      const haystack = `${l.message || l.action || ''} ${l.category || ''} ${l.context || ''}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const formatDate = (ts: any): string => {
    try {
      const d = ts?.toDate?.() ?? (typeof ts === 'string' ? new Date(ts) : null);
      return d ? d.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : '—';
    } catch {
      console.warn('formatDate: échec parsing date');
      return '—';
    }
  };

  return (
    <>
      {error && (
        <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}
      <div className="filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select className="fsel" value={filterLevel} onChange={e => setFilterLevel(e.target.value as any)}>
          <option value="">Tous niveaux</option>
          {LEVELS.filter(l => l).map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <select className="fsel" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select className="fsel" value={filterRole} onChange={e => setFilterRole(e.target.value as any)}>
          <option value="">Tous rôles</option>
          {ROLES.filter(r => r).map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <input
          className="fi"
          type="text"
          placeholder="🔍 Recherche message / contexte"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: 200 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>
      ) : (
        <Card title={`Logs Debug (${filtered.length}/${logs.length})`}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>Date</th>
                <th>Level</th>
                <th>Catégorie</th>
                <th>Rôle</th>
                <th>Message</th>
                <th>User</th>
                <th>URL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun log</td></tr>
              ) : filtered.map(log => {
                const expanded = expandedId === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr onClick={() => setExpandedId(expanded ? null : log.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--tx3)', fontSize: 12 }}>{formatDate(log.createdAt)}</td>
                      <td>{levelPill(log)}</td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569' }}>{log.category || '—'}</td>
                      <td>{rolePill(log.user_role)}</td>
                      <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                        {log.message || log.action || '—'}
                      </td>
                      <td style={{ fontSize: 11, color: '#64748B' }}>{log.user_email || log.user || '—'}</td>
                      <td style={{ fontSize: 11, color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.url ? new URL(log.url, 'https://x').pathname : '—'}
                      </td>
                      <td style={{ color: '#94A3B8' }}>{expanded ? '▾' : '▸'}</td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={8} style={{ background: '#F8FAFC', padding: 16, fontSize: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
                            <strong>Message</strong>
                            <span>{log.message || log.action || '—'}</span>

                            <strong>Catégorie</strong>
                            <span style={{ fontFamily: 'monospace' }}>{log.category || '—'}</span>

                            <strong>User ID</strong>
                            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{log.user_id || '—'}</span>

                            <strong>URL</strong>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{log.url || '—'}</span>

                            {log.user_agent && (
                              <>
                                <strong>User-Agent</strong>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{log.user_agent}</span>
                              </>
                            )}

                            {log.context && (
                              <>
                                <strong>Context</strong>
                                <pre style={{ margin: 0, fontSize: 11, background: '#fff', padding: 8, borderRadius: 4, maxHeight: 240, overflow: 'auto' }}>
                                  {log.context}
                                </pre>
                              </>
                            )}

                            {log.stack && (
                              <>
                                <strong>Stack</strong>
                                <pre style={{ margin: 0, fontSize: 11, background: '#fff', padding: 8, borderRadius: 4, maxHeight: 240, overflow: 'auto' }}>
                                  {log.stack}
                                </pre>
                              </>
                            )}

                            <strong>Schema</strong>
                            <span style={{ fontSize: 11 }}>v{log.schema_version || 1}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
