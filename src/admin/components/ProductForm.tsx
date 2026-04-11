import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { OrangeIndicator } from '../../components/OrangeIndicator';
import { translateText } from '../../lib/deepl';

interface ProductFormProps {
  mode: 'new' | 'edit';
  productId?: string;
  initialData: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
}

const CATEGORIES = [
  { value: 'mini-pelles', label: 'Mini-Pelles' },
  { value: 'maisons-modulaires', label: 'Maisons Modulaires' },
  { value: 'solaire', label: 'Solaire' },
  { value: 'machines-agricoles', label: 'Machines Agricoles' },
  { value: 'divers', label: 'Divers' },
  { value: 'services', label: 'Services' },
];

export default function ProductForm({
  mode,
  productId,
  initialData,
  onSave,
}: ProductFormProps) {
  const { t } = useI18n();
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [toast, setToast] = useState('');

  // Debounce auto-save
  useEffect(() => {
    if (mode !== 'edit' || !productId) return;

    const timer = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'products', productId), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        setToast(t('saved'));
        setTimeout(() => setToast(''), 2000);
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [data, mode, productId, t]);

  const handleChange = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setData({
        ...data,
        [parent]: { ...(data[parent] || {}), [child]: value },
      });
    } else {
      setData({ ...data, [key]: value });
    }
  };

  const handleTranslate = async (field: string, targetField: string, lang: 'ZH' | 'EN-GB') => {
    const text = data[field];
    if (!text) return;

    setTranslating(true);
    try {
      const translated = await translateText(text, lang);
      handleChange(targetField, translated);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(data);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Calculs automatiques
  useEffect(() => {
    const dims = data.dimensions || {};
    if (dims.l && dims.L && dims.h) {
      const volume = (dims.l * dims.L * dims.h) / 1000000;
      if (volume !== dims.volume_m3) {
        handleChange('dimensions.volume_m3', Math.round(volume * 100) / 100);
      }
    }
  }, [data.dimensions?.l, data.dimensions?.L, data.dimensions?.h]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {toast} ✓
        </div>
      )}

      {/* Bloc BDD */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4 text-salmon">Données produit</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              N° Interne
              <OrangeIndicator show={!data.numero_interne} />
            </label>
            <input
              type="text"
              value={data.numero_interne || ''}
              onChange={(e) => handleChange('numero_interne', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Catégorie
              <OrangeIndicator show={!data.categorie} />
            </label>
            <select
              value={data.categorie || ''}
              onChange={(e) => handleChange('categorie', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Sélectionner...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sous-catégorie</label>
            <input
              type="text"
              value={data.sous_categorie || ''}
              onChange={(e) => handleChange('sous_categorie', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fournisseur</label>
            <input
              type="text"
              value={data.fournisseur || ''}
              onChange={(e) => handleChange('fournisseur', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Prix achat CNY ¥
              <OrangeIndicator show={!data.prix_achat_cny} />
            </label>
            <input
              type="number"
              value={data.prix_achat_cny || ''}
              onChange={(e) => handleChange('prix_achat_cny', Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prix achat EUR €</label>
            <input
              type="number"
              value={data.prix_achat_eur || ''}
              onChange={(e) => handleChange('prix_achat_eur', Number(e.target.value))}
              className="w-full border rounded px-3 py-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Code HS douanier
              <OrangeIndicator show={!data.code_hs} />
            </label>
            <input
              type="text"
              value={data.code_hs || ''}
              onChange={(e) => handleChange('code_hs', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="ex: 8429.52"
            />
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4 text-salmon">Dimensions</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Longueur (cm)</label>
            <input
              type="number"
              value={data.dimensions?.l || ''}
              onChange={(e) => handleChange('dimensions.l', Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Largeur (cm)</label>
            <input
              type="number"
              value={data.dimensions?.L || ''}
              onChange={(e) => handleChange('dimensions.L', Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hauteur (cm)</label>
            <input
              type="number"
              value={data.dimensions?.h || ''}
              onChange={(e) => handleChange('dimensions.h', Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Volume (m³)</label>
            <input
              type="number"
              value={data.dimensions?.volume_m3 || ''}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Poids net (kg)
              <OrangeIndicator show={!data.dimensions?.poids_net_kg} />
            </label>
            <input
              type="number"
              value={data.dimensions?.poids_net_kg || ''}
              onChange={(e) =>
                handleChange('dimensions.poids_net_kg', Number(e.target.value))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Poids brut (kg)</label>
            <input
              type="number"
              value={data.dimensions?.poids_brut_kg || ''}
              onChange={(e) =>
                handleChange('dimensions.poids_brut_kg', Number(e.target.value))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Bloc Web */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4 text-salmon">Contenu web</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nom FR
              <OrangeIndicator show={!data.nom_fr} />
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.nom_fr || ''}
                onChange={(e) => handleChange('nom_fr', e.target.value)}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={() => {
                  handleTranslate('nom_fr', 'nom_zh', 'ZH');
                  handleTranslate('nom_fr', 'nom_en', 'EN-GB');
                }}
                disabled={translating || !data.nom_fr}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 text-sm"
              >
                Traduire
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom ZH 中文
                <OrangeIndicator show={!data.nom_zh} />
              </label>
              <input
                type="text"
                value={data.nom_zh || ''}
                onChange={(e) => handleChange('nom_zh', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom EN
                <OrangeIndicator show={!data.nom_en} />
              </label>
              <input
                type="text"
                value={data.nom_en || ''}
                onChange={(e) => handleChange('nom_en', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description FR
              <OrangeIndicator show={!data.description_fr} />
            </label>
            <div className="flex gap-2">
              <textarea
                value={data.description_fr || ''}
                onChange={(e) => handleChange('description_fr', e.target.value)}
                className="flex-1 border rounded px-3 py-2"
                rows={3}
              />
              <button
                onClick={() => {
                  handleTranslate('description_fr', 'description_zh', 'ZH');
                  handleTranslate('description_fr', 'description_en', 'EN-GB');
                }}
                disabled={translating || !data.description_fr}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 text-sm h-fit"
              >
                Traduire
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Description ZH</label>
              <textarea
                value={data.description_zh || ''}
                onChange={(e) => handleChange('description_zh', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description EN</label>
              <textarea
                value={data.description_en || ''}
                onChange={(e) => handleChange('description_en', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">URL Vidéo</label>
              <input
                type="text"
                value={data.video_url || ''}
                onChange={(e) => handleChange('video_url', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.actif || false}
                  onChange={(e) => handleChange('actif', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Actif sur le site</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton save pour nouveau produit */}
      {mode === 'new' && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-navy text-white px-6 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? t('loading') : t('btn.enregistrer')}
          </button>
        </div>
      )}
    </div>
  );
}
