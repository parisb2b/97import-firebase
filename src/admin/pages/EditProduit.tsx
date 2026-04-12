import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProductForm from '../components/ProductForm';

export default function EditProduit() {
  const [, params] = useRoute('/admin/produits/:id');
  const [product, setProduct] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) {
        setError('ID du produit manquant');
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'products', params.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        } else {
          setError(`Produit ${params.id} introuvable`);
        }
      } catch (err: any) {
        console.error('Erreur chargement produit:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id]);

  const handleSave = async (data: Record<string, any>) => {
    if (!params?.id) return;
    try {
      await updateDoc(doc(db, 'products', params.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      alert('Erreur lors de la sauvegarde: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 text-lg font-bold">Erreur</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <a href="/admin/produits" className="mt-4 inline-block text-blue-600 underline">
            Retour au catalogue
          </a>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Produit non trouvé</p>
          <a href="/admin/produits" className="mt-4 inline-block text-blue-600 underline">
            Retour au catalogue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{product.numero_interne}</h1>
      <ProductForm
        mode="edit"
        productId={params?.id}
        initialData={product}
        onSave={handleSave}
      />
    </div>
  );
}
