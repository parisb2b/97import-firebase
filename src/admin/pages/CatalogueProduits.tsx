import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';
import { DuplicateBtn, duplicateDoc } from '../../components/DuplicateBtn';
import { OrangeIndicator, scoreCompletude } from '../../components/OrangeIndicator';

interface Product {
  id: string;
  numero_interne: string;
  categorie: string;
  nom_fr: string;
  prix_achat_cny: number;
  prix_achat_eur: number;
  actif: boolean;
  photos: string[];
  createdAt: any;
}

const CATEGORIES: Record<string, string> = {
  'mini-pelles': 'Mini-Pelles',
  'maisons-modulaires': 'Maisons Modulaires',
  solaire: 'Solaire',
  'machines-agricoles': 'Machines Agricoles',
  divers: 'Divers',
  services: 'Services',
};

export default function CatalogueProduits() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterCat, setFilterCat] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', sortOrder));
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sortOrder]);

  const handleDuplicate = async (p: Product) => {
    try {
      const num = p.numero_interne.split('-');
      const prefix = num.slice(0, -1).join('-');
      await duplicateDoc(p, 'products', prefix);
      load();
    } catch (err) {
      console.error('Error duplicating:', err);
    }
  };

  const filtered =
    filterCat === 'all'
      ? products
      : products.filter((p) => p.categorie === filterCat);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.produits')}</h1>
        <div className="flex items-center gap-4">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="all">Toutes catégories</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <SortControl value={sortOrder} onChange={setSortOrder} />
          <Link href="/admin/produits/nouveau">
            <a className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90">
              {t('btn.nouveau')}
            </a>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun produit
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Réf</th>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Catégorie</th>
                <th className="text-right px-4 py-3 font-medium">Prix CNY</th>
                <th className="text-right px-4 py-3 font-medium">Prix EUR</th>
                <th className="px-4 py-3 font-medium">Complétude</th>
                <th className="px-4 py-3 font-medium">Actif</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const score = scoreCompletude(p);
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/produits/${p.id}`}>
                        <a className="text-navy hover:underline font-medium">
                          {p.numero_interne}
                        </a>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {p.nom_fr}
                      <OrangeIndicator show={!p.nom_fr} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {CATEGORIES[p.categorie] || p.categorie}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.prix_achat_cny?.toLocaleString('fr-FR')} ¥
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.prix_achat_eur?.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              score >= 80
                                ? 'bg-green-500'
                                : score >= 50
                                ? 'bg-orange-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.actif ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DuplicateBtn onClick={() => handleDuplicate(p)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
