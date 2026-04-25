// src/lib/logService.ts
// MISSION-V43 / Mini-étape M1 — Service unifié de logs.
//
// 4 niveaux : ERROR / WARN / INFO / DEBUG.
// Schéma backward-compatible avec Logs.tsx (action / type / user / details / createdAt)
// + nouveau schéma enrichi (level / category / message / context / url / stack / …).
// Anti-récursion (flag isLogging) + dédup 5s (Map mémoire).
//
// Helpers publics :
//   logError(category, message, context?, err?)
//   logWarn(category, message, context?)
//   logInfo(category, message, context?)
//   logDebug(category, message, context?)
//   fetchRecentLogs({ limit?, level?, category? })

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit as fsLimit,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, clientAuth, adminAuth } from './firebase';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export interface LogEntry {
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, any> | null;
  stack?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  url?: string | null;
}

// ─── Anti-récursion : si writeLog plante, on ne se rappelle pas ─────────────
let isLogging = false;

// ─── Dédup 5s en mémoire ────────────────────────────────────────────────────
const dedupCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000;

function levelToType(level: LogLevel): 'error' | 'warn' | 'info' {
  switch (level) {
    case 'ERROR': return 'error';
    case 'WARN':  return 'warn';
    case 'INFO':  return 'info';
    case 'DEBUG': return 'info';   // DEBUG mappé sur 'info' pour compat Logs.tsx
    default:      return 'info';
  }
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (_k, v) => {
      if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack };
      if (typeof v === 'function') return '[fn]';
      return v;
    });
  } catch {
    try { return String(obj); } catch { return '[unserializable]'; }
  }
}

type UserRole = 'admin' | 'client' | 'anonymous';

function getCurrentUser(): { user_id: string | null; user_email: string | null; user_role: UserRole } {
  try {
    // Priorité ADMIN (si les 2 sessions sont actives dans le même onglet, l'admin gagne)
    if (adminAuth?.currentUser) {
      return {
        user_id: adminAuth.currentUser.uid,
        user_email: adminAuth.currentUser.email || null,
        user_role: 'admin',
      };
    }
    if (clientAuth?.currentUser) {
      return {
        user_id: clientAuth.currentUser.uid,
        user_email: clientAuth.currentUser.email || null,
        user_role: 'client',
      };
    }
    return { user_id: null, user_email: null, user_role: 'anonymous' };
  } catch {
    return { user_id: null, user_email: null, user_role: 'anonymous' };
  }
}

function buildDedupKey(level: LogLevel, category: string, message: string): string {
  return `${level}:${category}:${String(message).slice(0, 200)}`;
}

function shouldDedup(key: string): boolean {
  const now = Date.now();
  const last = dedupCache.get(key);
  if (last !== undefined && (now - last) < DEDUP_WINDOW_MS) return true;
  dedupCache.set(key, now);
  // GC : si la map dépasse 200 entrées, on supprime celles plus vieilles que 60s
  if (dedupCache.size > 200) {
    const cutoff = now - 60_000;
    for (const [k, ts] of dedupCache) {
      if (ts < cutoff) dedupCache.delete(k);
    }
  }
  return false;
}

async function writeLog(entry: LogEntry): Promise<void> {
  if (isLogging) return;
  isLogging = true;
  try {
    const dedupKey = buildDedupKey(entry.level, entry.category, entry.message);
    if (shouldDedup(dedupKey)) return;

    const userInfo = getCurrentUser();
    const message = String(entry.message).slice(0, 1000);

    const docPayload: Record<string, any> = {
      // COMPAT avec Logs.tsx existant
      action: message,
      type: levelToType(entry.level),
      user: entry.user_email || entry.user_id || userInfo.user_email || userInfo.user_id || 'anonymous',
      details: entry.context || {},
      createdAt: serverTimestamp(),

      // Schéma enrichi V43-M1
      level: entry.level,
      category: entry.category,
      message,
      context: entry.context ? safeStringify(entry.context).slice(0, 5000) : null,
      user_id: entry.user_id || userInfo.user_id || null,
      user_email: entry.user_email || userInfo.user_email || null,
      // user_role : priorité à l'override explicite, sinon détection automatique admin/client/anonymous
      user_role: entry.user_role || userInfo.user_role,
      url: entry.url || (typeof window !== 'undefined' ? window.location.href : null),
      stack: entry.stack ? String(entry.stack).slice(0, 5000) : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
      schema_version: 2,
    };

    await addDoc(collection(db, 'logs'), docPayload);
  } catch (err) {
    // Fallback : on n'écrit pas en boucle dans Firestore — juste console
    // eslint-disable-next-line no-console
    console.error('[logService] write failed:', err, entry);
  } finally {
    isLogging = false;
  }
}

// ─── Helpers publics ───────────────────────────────────────────────────────

export function logError(
  category: string,
  message: string,
  context?: Record<string, any> | null,
  err?: unknown,
): void {
  let stack: string | null = null;
  if (err instanceof Error) stack = err.stack || null;
  else if (err) stack = safeStringify(err);
  void writeLog({ level: 'ERROR', category, message, context: context || null, stack });
}

export function logWarn(
  category: string,
  message: string,
  context?: Record<string, any> | null,
): void {
  void writeLog({ level: 'WARN', category, message, context: context || null });
}

export function logInfo(
  category: string,
  message: string,
  context?: Record<string, any> | null,
): void {
  void writeLog({ level: 'INFO', category, message, context: context || null });
}

export function logDebug(
  category: string,
  message: string,
  context?: Record<string, any> | null,
): void {
  void writeLog({ level: 'DEBUG', category, message, context: context || null });
}

// ─── Fetch pour les pages admin (Logs / LogsDebug) ─────────────────────────

export interface FetchLogsOptions {
  limit?: number;
  level?: LogLevel;
  category?: string;
}

export async function fetchRecentLogs(options: FetchLogsOptions = {}): Promise<any[]> {
  const max = options.limit ?? 200;

  // Pas de combinaison level + category dans la même requête (limitation Firestore index simple).
  // On choisit la priorité : level > category > all.
  let q;
  if (options.level) {
    q = query(
      collection(db, 'logs'),
      where('level', '==', options.level),
      orderBy('createdAt', 'desc'),
      fsLimit(max),
    );
  } else if (options.category) {
    q = query(
      collection(db, 'logs'),
      where('category', '==', options.category),
      orderBy('createdAt', 'desc'),
      fsLimit(max),
    );
  } else {
    q = query(
      collection(db, 'logs'),
      orderBy('createdAt', 'desc'),
      fsLimit(max),
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
