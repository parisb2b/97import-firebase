import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

interface Stats {
  devisCount: number;
  devisEnAttente: number;
  facturesCount: number;
  produitsCount: number;
  clientsCount: number;
  conteneursEnCours: number;
}

export default function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats>({
    devisCount: 0,
    devisEnAttente: 0,
    facturesCount: 0,
    produitsCount: 0,
    clientsCount: 0,
    conteneursEnCours: 0,
  });
  const [recentDevis, setRecentDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Chargement des stats
        const [devisSnap, facturesSnap, produitsSnap, clientsSnap, conteneursSnap] =
          await Promise.all([
            getDocs(collection(db, 'quotes')),
            getDocs(collection(db, 'invoices')),
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'profiles')),
            getDocs(
              query(
                collection(db, 'containers'),
                where('statut', 'in', ['préparation', 'chargé', 'parti'])
              )
            ),
          ]);

        const devisEnAttenteSnap = await getDocs(
          query(collection(db, 'quotes'), where('statut', '==', 'brouillon'))
        );

        setStats({
          devisCount: devisSnap.size,
          devisEnAttente: devisEnAttenteSnap.size,
          facturesCount: facturesSnap.size,
          produitsCount: produitsSnap.size,
          clientsCount: clientsSnap.size,
          conteneursEnCours: conteneursSnap.size,
        });

        // Derniers devis
        const recentQuery = query(
          collection(db, 'quotes'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnap = await getDocs(recentQuery);
        setRecentDevis(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label={t('nav.devis')} value={stats.devisCount} icon="📋" />
        <StatCard
          label="En attente"
          value={stats.devisEnAttente}
          icon="⏳"
          highlight
        />
        <StatCard label={t('nav.factures')} value={stats.facturesCount} icon="🧾" />
        <StatCard label={t('nav.produits')} value={stats.produitsCount} icon="🛒" />
        <StatCard label={t('nav.clients')} value={stats.clientsCount} icon="👥" />
        <StatCard
          label="Conteneurs actifs"
          value={stats.conteneursEnCours}
          icon="📦"
        />
      </div>

      {/* Derniers devis */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4">Derniers devis</h2>
        {recentDevis.length === 0 ? (
          <p className="text-gray-500">Aucun devis</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Numéro</th>
                <th className="text-left py-2">Client</th>
                <th className="text-left py-2">Statut</th>
                <th className="text-right py-2">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {recentDevis.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2">{d.numero}</td>
                  <td className="py-2">{d.client_nom || '-'}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        d.statut === 'accepte'
                          ? 'bg-green-100 text-green-700'
                          : d.statut === 'envoye'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t(`statut.${d.statut}`)}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {d.total_ht?.toLocaleString('fr-FR')} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-4 ${
        highlight ? 'border-l-4 border-orange-500' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-gray-500 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
