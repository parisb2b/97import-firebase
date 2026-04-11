import { Link } from 'wouter';
import { useI18n } from '../../i18n';

const CATEGORIES = [
  {
    id: 'mini-pelles',
    icon: '🚜',
    color: 'bg-orange-100',
  },
  {
    id: 'maisons-modulaires',
    icon: '🏠',
    color: 'bg-blue-100',
  },
  {
    id: 'solaire',
    icon: '☀️',
    color: 'bg-yellow-100',
  },
  {
    id: 'machines-agricoles',
    icon: '🌾',
    color: 'bg-green-100',
  },
  {
    id: 'divers',
    icon: '📦',
    color: 'bg-gray-100',
  },
  {
    id: 'services',
    icon: '🚢',
    color: 'bg-purple-100',
  },
];

export default function Home() {
  const { t } = useI18n();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {t('home.hero.subtitle')}
          </p>
          <Link href="/catalogue">
            <a className="inline-block bg-white text-navy px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              {t('btn.voir.catalogue')}
            </a>
          </Link>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-8 flex-wrap">
            {['Martinique', 'Guadeloupe', 'Réunion', 'Guyane'].map((dest) => (
              <div
                key={dest}
                className="bg-white rounded-lg px-6 py-3 shadow text-center"
              >
                <span className="font-medium text-navy">{dest}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.categories')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/catalogue/${cat.id}`}>
                <a
                  className={`${cat.color} rounded-xl p-6 text-center hover:shadow-lg transition group`}
                >
                  <span className="text-4xl mb-3 block group-hover:scale-110 transition">
                    {cat.icon}
                  </span>
                  <span className="font-medium text-gray-800">
                    {t(`categorie.${cat.id}`)}
                  </span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 bg-salmon-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <span className="text-4xl mb-4 block">🇨🇳</span>
              <h3 className="font-bold text-lg mb-2">Import direct Chine</h3>
              <p className="text-gray-600">
                Produits sélectionnés directement auprès des fabricants
              </p>
            </div>
            <div className="text-center">
              <span className="text-4xl mb-4 block">🚚</span>
              <h3 className="font-bold text-lg mb-2">Livraison DOM-TOM</h3>
              <p className="text-gray-600">
                Conteneurs réguliers vers Martinique, Guadeloupe, Réunion, Guyane
              </p>
            </div>
            <div className="text-center">
              <span className="text-4xl mb-4 block">🔧</span>
              <h3 className="font-bold text-lg mb-2">SAV assuré</h3>
              <p className="text-gray-600">
                Service après-vente et pièces détachées disponibles
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
