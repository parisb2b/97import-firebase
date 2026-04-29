// src/lib/dateHelpers.ts
// V44 — Helpers de formatage de dates en français.
// Tolère tous les types d'inputs : Date, Firestore Timestamp, string ISO, number epoch ms.

import { Timestamp } from 'firebase/firestore';

type DateInput = Date | Timestamp | string | number | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;

  // Firestore Timestamp ou objet { _seconds, _nanoseconds }
  if (typeof input === 'object') {
    if ('toDate' in input && typeof (input as Timestamp).toDate === 'function') {
      return (input as Timestamp).toDate();
    }
    if ('_seconds' in (input as any)) {
      const seconds = (input as any)._seconds as number;
      return new Date(seconds * 1000);
    }
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input;
    }
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/** Format "JJ-M-AAAA HHhMM" — ex: "29-4-2026 08h45" */
export function formatDateHeure(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  const jour = d.getDate();
  const mois = d.getMonth() + 1;
  const annee = d.getFullYear();
  const heures = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${jour}-${mois}-${annee} ${heures}h${minutes}`;
}

/** Format "JJ mois AAAA" — ex: "29 avril 2026" */
export function formatDateCourt(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format relatif court — "il y a 5 min", "il y a 2h", "hier" */
export function formatDateRelatif(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const heures = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (heures < 24) return `il y a ${heures}h`;
  if (jours < 2) return 'hier';
  if (jours < 7) return `il y a ${jours} jours`;
  return formatDateCourt(input);
}
