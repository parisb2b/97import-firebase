import { useI18n } from '../i18n';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getNextNumber } from '../lib/counters';

interface DuplicateBtnProps {
  onClick: (e?: any) => void;
}

export const DuplicateBtn = ({ onClick }: DuplicateBtnProps) => {
  const { t } = useI18n();
  return (
    <div className="tooltip-wrapper">
      <button
        onClick={onClick}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-orange-50 text-gray-500"
      >
        ⧉
      </button>
      <span className="tooltip-text">{t('btn.dupliquer')}</span>
    </div>
  );
};

// Logique de duplication générique
export const duplicateDoc = async (
  data: object,
  collectionName: string,
  prefix: string
) => {
  const newNum = await getNextNumber(prefix);
  const { id: _id, ...rest } = data as Record<string, unknown>;
  const copy = {
    ...rest,
    numero: newNum,
    statut: 'brouillon',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collection(db, collectionName), copy);
};
