import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

interface SAV {
  id: string;
  numero: string;
  client_id: string;
  quote_id: string;
  produit_ref: string;
  description: string;
  photos: string[];
  statut: string;
  piece_affectee: string;
  createdAt: any;
}

export default function SAVDetail() {
  const { t } = useI18n();
  const [, params] = useRoute('/admin/sav/:id');
  const [sav, setSav] = useState<SAV | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const docRef = doc(db, 'sav', params.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSav({ id: snap.id, ...snap.data() } as SAV);
      }
      setLoading(false);
    };
    load();
  }, [params?.id]);

  const handleSave = async () => {
    if (!sav) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'sav', sav.id), {
        ...sav,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  if (!sav) {
    return <div className="text-center py-8 text-gray-500">Ticket non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{sav.numero}</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy text-white px-4 py-2 rounded hover:bg-navy-dark disabled:opacity-50"
        >
          {saving ? t('loading') : t('btn.enregistrer')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Produit</label>
            <input
              type="text"
              value={sav.produit_ref}
              onChange={(e) => setSav({ ...sav, produit_ref: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              value={sav.statut}
              onChange={(e) => setSav({ ...sav, statut: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="nouveau">Nouveau</option>
              <option value="en cours">En cours</option>
              <option value="résolu">Résolu</option>
              <option value="fermé">Fermé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pièce affectée</label>
            <input
              type="text"
              value={sav.piece_affectee || ''}
              onChange={(e) => setSav({ ...sav, piece_affectee: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Devis lié</label>
            <input
              type="text"
              value={sav.quote_id || ''}
              onChange={(e) => setSav({ ...sav, quote_id: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={sav.description}
              onChange={(e) => setSav({ ...sav, description: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={4}
            />
          </div>
        </div>
      </div>

      {sav.photos && sav.photos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-4 gap-4">
            {sav.photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-32 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
