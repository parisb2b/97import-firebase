import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import ProductForm from '../components/ProductForm';

export default function EditProduit() {
  const { t } = useI18n();
  const [, params] = useRoute('/admin/produits/:id');
  const [product, setProduct] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const docRef = doc(db, 'products', params.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    load();
  }, [params?.id]);

  const handleSave = async (data: Record<string, any>) => {
    if (!params?.id) return;
    await updateDoc(doc(db, 'products', params.id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  if (!product) {
    return <div className="text-center py-8 text-gray-500">Produit non trouvé</div>;
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
