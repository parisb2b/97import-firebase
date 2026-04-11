import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';

interface Product {
  id: string;
  numero_interne: string;
  categorie: string;
  nom_fr: string;
  nom_zh: string;
  nom_en: string;
  prix_achat_cny: number;
  prix_achat_eur: number;
  photos: string[];
  actif: boolean;
}

const CATEGORIES = [
  'mini-pelles',
  'maisons-modulaires',
  'solaire',
  'machines-agricoles',
  'divers',
  'services',
];

export default function Catalogue() {
  const { t, lang } = useI18n();
  const [, params] = useRoute('/catalogue/:categorie');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const selectedCat = params?.categorie;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let q;
        if (selectedCat && CATEGORIES.includes(selectedCat)) {
          q = query(
            collection(db, 'products'),
            where('actif', '==', true),
            where('categorie', '==', selectedCat),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(
            collection(db, 'products'),
            where('actif', '==', true),
            orderBy('createdAt', 'desc')
          );
        }
        const snap = await getDocs(q);
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCat]);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.nom_fr?.toLowerCase().includes(s) ||
      p.nom_en?.toLowerCase().includes(s) ||
      p.numero_interne?.toLowerCase().includes(s)
    );
  });

  const getProductName = (p: Product) => {
    if (lang === 'zh') return p.nom_zh || p.nom_fr;
    if (lang === 'en') return p.nom_en || p.nom_fr;
    return p.nom_fr;
  };

  const getDisplayPrice = (p: Product) => {
    const user = clientAuth.currentUser;
    if (!user) return null;
    // Prix simplifié - en production, utiliser les custom claims
    return p.prix_achat_eur ? p.prix_achat_eur * 2 : null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('nav.catalogue')}</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="border rounded-lg px-4 py-2 w-full md:w-64"
        />

        <div className="flex flex-wrap gap-2">
          <Link href="/catalogue">
            <a
              className={`px-4 py-2 rounded-lg ${
                !selectedCat
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Tous
            </a>
          </Link>
          {CATEGORIES.map((cat) => (
            <Link key={cat} href={`/catalogue/${cat}`}>
              <a
                className={`px-4 py-2 rounded-lg ${
                  selectedCat === cat
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t(`categorie.${cat}`)}
              </a>
            </Link>
          ))}
        </div>
      </div>

      {/* Produits */}
      {loading ? (
        <div className="text-center py-12">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Aucun produit trouvé</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => {
            const price = getDisplayPrice(p);
            return (
              <Link key={p.id} href={`/produit/${p.id}`}>
                <a className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden group">
                  <div className="aspect-square bg-gray-100 relative">
                    {p.photos?.[0] ? (
                      <img
                        src={p.photos[0]}
                        alt={getProductName(p)}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 mb-1">{p.numero_interne}</p>
                    <h3 className="font-medium line-clamp-2 mb-2">
                      {getProductName(p)}
                    </h3>
                    {price !== null ? (
                      <p className="text-navy font-bold">
                        {price.toLocaleString('fr-FR')} €
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t('prix.non.disponible')}
                      </p>
                    )}
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
