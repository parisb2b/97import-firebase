import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { doc, getDoc } from 'firebase/firestore';
import { db, clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';

interface Product {
  id: string;
  numero_interne: string;
  categorie: string;
  nom_fr: string;
  nom_zh: string;
  nom_en: string;
  description_fr: string;
  description_zh: string;
  description_en: string;
  prix_achat_cny: number;
  prix_achat_eur: number;
  dimensions: {
    l: number;
    L: number;
    h: number;
    volume_m3: number;
    poids_net_kg: number;
    poids_brut_kg: number;
  };
  code_hs: string;
  fournisseur: string;
  photos: string[];
  video_url: string;
  options_payantes: Array<{
    ref: string;
    nom_fr: string;
    nom_zh: string;
    nom_en: string;
    surcout_eur: number;
  }>;
}

export default function Produit() {
  const { t, lang } = useI18n();
  const [, params] = useRoute('/produit/:id');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      try {
        const docRef = doc(db, 'products', params.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        }
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id]);

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Produit non trouvé</p>
        <Link href="/catalogue">
          <a className="text-navy hover:underline">Retour au catalogue</a>
        </Link>
      </div>
    );
  }

  const getName = () => {
    if (lang === 'zh') return product.nom_zh || product.nom_fr;
    if (lang === 'en') return product.nom_en || product.nom_fr;
    return product.nom_fr;
  };

  const getDescription = () => {
    if (lang === 'zh') return product.description_zh || product.description_fr;
    if (lang === 'en') return product.description_en || product.description_fr;
    return product.description_fr;
  };

  const getDisplayPrice = () => {
    const user = clientAuth.currentUser;
    if (!user) return null;
    return product.prix_achat_eur ? product.prix_achat_eur * 2 : null;
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.id === product.id);
    if (existing) {
      existing.qte += 1;
    } else {
      cart.push({
        id: product.id,
        ref: product.numero_interne,
        nom_fr: product.nom_fr,
        prix: getDisplayPrice() || 0,
        qte: 1,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Produit ajouté au panier');
  };

  const price = getDisplayPrice();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/catalogue">
          <a className="hover:text-navy">{t('nav.catalogue')}</a>
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/catalogue/${product.categorie}`}>
          <a className="hover:text-navy">{t(`categorie.${product.categorie}`)}</a>
        </Link>
        <span className="mx-2">/</span>
        <span>{product.numero_interne}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Photos */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            {product.photos?.[selectedPhoto] ? (
              <img
                src={product.photos[selectedPhoto]}
                alt={getName()}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                📦
              </div>
            )}
          </div>
          {product.photos && product.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPhoto(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedPhoto === i ? 'border-navy' : 'border-transparent'
                  }`}
                >
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          <p className="text-gray-400 text-sm mb-2">{product.numero_interne}</p>
          <h1 className="text-3xl font-bold mb-4">{getName()}</h1>

          {price !== null ? (
            <p className="text-3xl font-bold text-navy mb-6">
              {price.toLocaleString('fr-FR')} €
            </p>
          ) : (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-gray-600">{t('prix.non.disponible')}</p>
              <Link href="/connexion">
                <a className="text-navy hover:underline font-medium">
                  {t('btn.connexion')}
                </a>
              </Link>
            </div>
          )}

          {price !== null && (
            <button
              onClick={addToCart}
              className="w-full bg-navy text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 mb-6"
            >
              {t('btn.ajouter.panier')}
            </button>
          )}

          {/* Description */}
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{getDescription()}</p>
          </div>

          {/* Dimensions */}
          {product.dimensions && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold mb-3">Dimensions</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.dimensions.l && (
                  <div>
                    <span className="text-gray-500">Longueur:</span>{' '}
                    {product.dimensions.l} cm
                  </div>
                )}
                {product.dimensions.L && (
                  <div>
                    <span className="text-gray-500">Largeur:</span>{' '}
                    {product.dimensions.L} cm
                  </div>
                )}
                {product.dimensions.h && (
                  <div>
                    <span className="text-gray-500">Hauteur:</span>{' '}
                    {product.dimensions.h} cm
                  </div>
                )}
                {product.dimensions.volume_m3 && (
                  <div>
                    <span className="text-gray-500">Volume:</span>{' '}
                    {product.dimensions.volume_m3} m³
                  </div>
                )}
                {product.dimensions.poids_net_kg && (
                  <div>
                    <span className="text-gray-500">Poids net:</span>{' '}
                    {product.dimensions.poids_net_kg} kg
                  </div>
                )}
                {product.dimensions.poids_brut_kg && (
                  <div>
                    <span className="text-gray-500">Poids brut:</span>{' '}
                    {product.dimensions.poids_brut_kg} kg
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          {product.options_payantes && product.options_payantes.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">Options disponibles</h2>
              <div className="space-y-2">
                {product.options_payantes.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <span>
                      {lang === 'zh'
                        ? opt.nom_zh || opt.nom_fr
                        : lang === 'en'
                        ? opt.nom_en || opt.nom_fr
                        : opt.nom_fr}
                    </span>
                    <span className="font-medium text-navy">
                      +{opt.surcout_eur} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
