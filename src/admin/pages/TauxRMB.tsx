import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { fetchRMBRate } from '../../lib/exchange-rate';

interface Params {
  taux_rmb_eur: number;
  taux_rmb_updated: any;
  taux_majoration_user: number;
  taux_majoration_partner: number;
}

export default function TauxRMB() {
  const { t } = useI18n();
  const [params, setParams] = useState<Params | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const docRef = doc(db, 'admin_params', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setParams(snap.data() as Params);
        }
      } catch (err) {
        console.error('Error loading params:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const rate = await fetchRMBRate();

      // Mettre à jour Firestore
      await updateDoc(doc(db, 'admin_params', 'global'), {
        taux_rmb_eur: rate,
        taux_rmb_updated: serverTimestamp(),
      });

      setParams((p) => (p ? { ...p, taux_rmb_eur: rate } : null));
    } catch (err) {
      console.error('Error fetching rate:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  const tauxMajore = params ? params.taux_rmb_eur * 1.02 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.taux')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Taux actuel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm text-gray-500 mb-2">Taux EUR/CNY actuel</h2>
          <p className="text-3xl font-bold text-navy">
            {params?.taux_rmb_eur?.toFixed(4) || '-'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            1 EUR = {params?.taux_rmb_eur?.toFixed(2)} CNY
          </p>
        </div>

        {/* Taux majoré */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <h2 className="text-sm text-gray-500 mb-2">Taux avec marge +2%</h2>
          <p className="text-3xl font-bold text-orange-600">{tauxMajore.toFixed(4)}</p>
          <p className="text-sm text-gray-500 mt-2">
            Utilisé pour les calculs de prix
          </p>
        </div>

        {/* Dernière mise à jour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm text-gray-500 mb-2">Dernière mise à jour</h2>
          <p className="text-lg font-medium">
            {params?.taux_rmb_updated?.toDate?.()?.toLocaleString('fr-FR') || '-'}
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 w-full bg-navy text-white py-2 rounded hover:bg-navy-dark disabled:opacity-50"
          >
            {refreshing ? 'Actualisation...' : 'Actualiser maintenant'}
          </button>
        </div>
      </div>

      {/* Paramètres de majoration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Paramètres de majoration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Majoration clients (coefficient)
            </label>
            <input
              type="number"
              value={params?.taux_majoration_user || 2}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Prix affiché = prix achat × {params?.taux_majoration_user || 2}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Majoration partenaires (coefficient)
            </label>
            <input
              type="number"
              value={params?.taux_majoration_partner || 1.2}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Prix partenaire = prix achat × {params?.taux_majoration_partner || 1.2}
            </p>
          </div>
        </div>
      </div>

      {/* Info API */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-medium text-blue-800">API ExchangeRate</p>
        <p className="text-blue-600 mt-1">
          Les taux sont récupérés automatiquement depuis exchangerate-api.com toutes
          les 24h via une Cloud Function schedulée.
        </p>
      </div>
    </div>
  );
}
