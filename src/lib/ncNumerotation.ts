// src/lib/ncNumerotation.ts
// Génération des numéros de Note de Commission au format NC-AAMM-NNN
// Réutilise le système de compteurs Firestore (pattern identique DVS-, FA-, LA-)

import { db } from './firebase';
import {
  doc, runTransaction, serverTimestamp
} from 'firebase/firestore';

/**
 * Génère le prochain numéro NC au format NC-AAMM-NNN
 * Le compteur est reset chaque mois (atomique via transaction Firestore)
 *
 * Exemple : NC-2604-001 pour avril 2026, premier NC du mois
 */
export async function genererNumeroNC(): Promise<string> {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2); // "26"
  const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // "04"
  const aamm = `${yy}${mm}`; // "2604"

  const counterId = `nc_${aamm}`;
  const counterRef = doc(db, 'counters', counterId);

  try {
    const newNum = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      const current = snap.exists() ? (snap.data().value || 0) : 0;
      const next = current + 1;

      transaction.set(counterRef, {
        value: next,
        prefix: 'NC',
        period: aamm,
        updated_at: serverTimestamp(),
      }, { merge: true });

      return next;
    });

    const numeroNNN = newNum.toString().padStart(3, '0');
    return `NC-${aamm}-${numeroNNN}`;
  } catch (err) {
    console.error('Erreur génération numéro NC:', err);
    throw new Error('Impossible de générer le numéro NC');
  }
}
