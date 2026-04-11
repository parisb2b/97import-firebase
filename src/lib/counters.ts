import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

export const getNextNumber = async (prefix: string): Promise<string> => {
  const now = new Date();
  const aa = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const aamm = `${aa}${mm}`;
  const counterId = `${prefix}_${aamm}`;
  const ref = doc(db, 'counters', counterId);

  const newVal = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? snap.data().valeur : 0;
    tx.set(ref, { valeur: current + 1 });
    return current + 1;
  });

  return `${prefix}-${aamm}${String(newVal).padStart(3, '0')}`;
};

// Préfixes : DVS | FA | F | NC | CONT | SAV | LA | STK
// Exemples : DVS-2604001 | FA-2604001 | NC-2604001
