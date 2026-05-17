import React, { useState } from 'react';
import { doc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ROLE_PARTENAIRE } from '../../lib/roleUtils';

interface PromouvoirPartenaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    uid: string;
    email: string;
    nom?: string;
    telephone?: string;
  };
  onSuccess: () => void;
}

export const PromouvoirPartenaireModal: React.FC<PromouvoirPartenaireModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const [codePartenaire, setCodePartenaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePromotionCalculated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codePartenaire.trim()) {
      setError('Le code trigramme du partenaire est obligatoire.');
      return;
    }

    setLoading(true);
    setError(null);
    const codeUpper = codePartenaire.trim().toUpperCase();

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('partenaire_code', '==', codeUpper));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error(`Le code partenaire [${codeUpper}] est déjà attribué à un autre compte.`);
      }

      const batch = writeBatch(db);
      const uid = client.uid;
      const cleanEmail = client.email.trim().toLowerCase();

      const profilePayload = {
        role: ROLE_PARTENAIRE,
        partenaire_code: codeUpper,
        updatedAt: new Date(),
      };

      // Écriture atomique et instantanée sur l'ensemble des chemins d'accès du RBAC
      batch.set(doc(db, 'users', uid), profilePayload, { merge: true });
      batch.set(doc(db, 'clients', uid), profilePayload, { merge: true });

      if (cleanEmail && cleanEmail !== uid) {
        batch.set(doc(db, 'users', cleanEmail), profilePayload, { merge: true });
      }

      // Génération de la fiche d'administration partenaire
      batch.set(doc(db, 'partners', uid), {
        userId: uid,
        email: cleanEmail,
        code: codeUpper,
        active: true,
        nom_entreprise: client.nom || 'Entreprise Individuelle',
        telephone: client.telephone || '',
        createdAt: new Date(),
      }, { merge: true });

      await batch.commit();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[V174] Échec de la transaction groupée partenaire:', err);
      setError(err?.message || 'Erreur d\'accès réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">🤝 Attribution Statut Partenaire</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Le compte <span className="font-semibold text-blue-600 font-mono">{client.email}</span> va recevoir ses accès pour le calcul des grilles tarifaires de gros.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handlePromotionCalculated} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Code Trigramme Partenaire Exclusif
            </label>
            <input
              type="text"
              maxLength={3}
              minLength={3}
              value={codePartenaire}
              onChange={(e) => setCodePartenaire(e.target.value)}
              placeholder="Ex: PAR, LIO, CHN"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              disabled={loading}
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Traitement atomique...' : '✓ Confirmer l\'attribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
