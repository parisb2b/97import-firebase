import { useLocation } from 'wouter';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProductForm from '../components/ProductForm';

export default function NouveauProduit() {
  const [, setLocation] = useLocation();

  const handleSave = async (data: Record<string, any>) => {
    const id = data.numero_interne?.replace(/[^a-zA-Z0-9]/g, '-') || Date.now().toString();
    await setDoc(doc(db, 'products', id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setLocation(`/admin/produits/${id}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nouveau produit</h1>
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
