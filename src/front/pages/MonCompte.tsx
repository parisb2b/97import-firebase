import { useState, useEffect } from 'react';
import { useRoute, Link, Redirect } from 'wouter';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

interface Devis {
  id: string;
  numero: string;
  statut: string;
  total_ht: number;
  createdAt: any;
}

const TABS = [
  { id: 'devis', label: 'Mes devis', icon: '📋' },
  { id: 'factures', label: 'Mes factures', icon: '🧾' },
  { id: 'livraison', label: 'Suivi livraison', icon: '🚚' },
  { id: 'sav', label: 'SAV', icon: '🔧' },
];

export default function MonCompte() {
  const { t } = useI18n();
  const [, params] = useRoute('/mon-compte/:tab?');
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);

  const user = clientAuth.currentUser;
  const currentTab = params?.tab || 'devis';

  useEffect(() => {
    if (!user) return;

    const loadDevis = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'quotes'),
          where('client_id', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setDevis(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Devis)));
      } catch (err) {
        console.error('Error loading devis:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDevis();
  }, [user]);

  if (!user) {
    return <Redirect to="/connexion" />;
  }

  const getStatutClass = (statut: string) => {
    switch (statut) {
      case 'accepte':
        return 'bg-green-100 text-green-700';
      case 'envoye':
        return 'bg-blue-100 text-blue-700';
      case 'refuse':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mon compte</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-64">
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <p className="font-medium">{user.displayName || 'Client'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <nav className="bg-white rounded-xl shadow overflow-hidden">
            {TABS.map((tab) => (
              <Link key={tab.id} href={`/mon-compte/${tab.id}`}>
                <a
                  className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 ${
                    currentTab === tab.id
                      ? 'bg-navy text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </a>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">
          {currentTab === 'devis' && (
            <div className="bg-white rounded-xl shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Mes devis</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center">{t('loading')}</div>
              ) : devis.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun devis
                </div>
              ) : (
                <div className="divide-y">
                  {devis.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{d.numero}</p>
                        <p className="text-sm text-gray-500">
                          {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${getStatutClass(
                            d.statut
                          )}`}
                        >
                          {t(`statut.${d.statut}`)}
                        </span>
                        <p className="font-semibold mt-1">
                          {d.total_ht?.toLocaleString('fr-FR')} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentTab === 'factures' && (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              Les factures apparaîtront ici après validation de vos devis
            </div>
          )}

          {currentTab === 'livraison' && (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              Le suivi de livraison apparaîtra ici après expédition
            </div>
          )}

          {currentTab === 'sav' && (
            <div className="bg-white rounded-xl shadow p-8">
              <h2 className="font-semibold text-lg mb-4">Service après-vente</h2>
              <p className="text-gray-500 mb-4">
                Pour toute demande SAV, contactez-nous :
              </p>
              <div className="space-y-2">
                <p>
                  📧 <a href="mailto:luxent@ltd-uk.eu" className="text-navy hover:underline">luxent@ltd-uk.eu</a>
                </p>
                <p>📞 France: +33 620 607 448</p>
                <p>📞 Chine: +86 135 6627 1902</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
