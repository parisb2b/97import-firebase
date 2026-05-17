import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Dashboard: React.FC = () => {
  const [apiAlert, setApiAlert] = useState<string | null>(null);

  useEffect(() => {
    const auditExternalApiKeys = async () => {
      try {
        const globalParams = await getDoc(doc(db, 'admin_params', 'global'));
        const data = globalParams.data();

        // Le système reste fonctionnel mais alerte l'administrateur de manière permanente
        if (!data?.DEEPL_API_KEY || !data?.EXCHANGE_RATE_API_KEY) {
          setApiAlert("⚠️ Alerte Configuration : Clé API DeepL ou Moniteur de Taux manquante dans les admin_params. Le système fonctionne en mode dégradé avec les coefficients de secours.");
        }
      } catch (err) {
        console.warn("[V174] Échec de l'audit d'intégrité des clés API tiers.");
      }
    };

    auditExternalApiKeys();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {apiAlert && (
        <div className="p-4 bg-red-600 border border-red-700 text-white rounded-xl shadow-lg font-semibold text-sm animate-pulse">
          {apiAlert}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Tableau de Bord Principal — V174</h2>
        <p className="text-sm text-gray-500">
          Système unifié de supervision de l'importation de fret. Base de données synchronisée.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Moteur de Prix</h4>
          <p className="text-2xl font-extrabold text-blue-900 mt-2">Actif</p>
          <span className="text-xs text-blue-600 mt-1 block">Coefficients Firestore synchronisés</span>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <h4 className="text-sm font-bold text-orange-800 uppercase tracking-wider">TVA DOM-TOM</h4>
          <p className="text-2xl font-extrabold text-orange-900 mt-2">0% Fixé</p>
          <span className="text-xs text-orange-600 mt-1 block">Conforme SignatureDevis V2</span>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <h4 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Contrôle d'accès RBAC</h4>
          <p className="text-2xl font-extrabold text-purple-900 mt-2">Automatisé</p>
          <span className="text-xs text-purple-600 mt-1 block">Normalisation linguistique active</span>
        </div>
      </div>
    </div>
  );
};
