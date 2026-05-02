import { useState } from 'react';
import { useLocation } from 'wouter';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import ProductForm from '../components/ProductForm';

export default function NouveauProduit() {
  const [, setLocation] = useLocation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: Record<string, any>) => {
    setSaving(true);
    setError(null);
    try {
      const id = data.numero_interne?.replace(/[^a-zA-Z0-9]/g, '-') || Date.now().toString();
      await setDoc(doc(db, 'products', id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setLocation(`/admin/produits/${id}`);
    } catch (err: any) {
      console.error('Erreur création produit:', err);
      setError(err.message || 'Erreur lors de la création');
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nouveau produit</h1>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {saving && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600">Enregistrement en cours...</p>
        </div>
      )}
      <ProductForm
        mode="new"
        initialData={{
          numero_interne: '',
          categorie: '',
          sous_categorie: '',
          fournisseur: '',
          prix_achat_cny: 0,
          prix_achat_eur: 0,
          dimensions: {},
          code_hs: '',
          nom_fr: '',
          nom_zh: '',
          nom_en: '',
          description_fr: '',
          description_zh: '',
          description_en: '',
          photos: [],
          video_url: '',
          actif: false,
        }}
        onSave={handleSave}
      />
    </div>
  );
}
