import { useState } from 'react';
import { useI18n } from '../../i18n';

interface FraisLigne {
  destination: string;
  type_conteneur: string;
  fret_maritime: number;
  dechargement: number;
  douane: number;
  livraison: number;
  total: number;
}

const FRAIS_DATA: FraisLigne[] = [
  {
    destination: 'MQ',
    type_conteneur: '20ft',
    fret_maritime: 2800,
    dechargement: 450,
    douane: 200,
    livraison: 350,
    total: 3800,
  },
  {
    destination: 'MQ',
    type_conteneur: '40ft',
    fret_maritime: 4200,
    dechargement: 650,
    douane: 350,
    livraison: 500,
    total: 5700,
  },
  {
    destination: 'GP',
    type_conteneur: '20ft',
    fret_maritime: 2900,
    dechargement: 480,
    douane: 220,
    livraison: 380,
    total: 3980,
  },
  {
    destination: 'GP',
    type_conteneur: '40ft',
    fret_maritime: 4400,
    dechargement: 700,
    douane: 380,
    livraison: 550,
    total: 6030,
  },
  {
    destination: 'RE',
    type_conteneur: '20ft',
    fret_maritime: 3200,
    dechargement: 520,
    douane: 250,
    livraison: 400,
    total: 4370,
  },
  {
    destination: 'RE',
    type_conteneur: '40ft',
    fret_maritime: 4800,
    dechargement: 750,
    douane: 420,
    livraison: 600,
    total: 6570,
  },
  {
    destination: 'GF',
    type_conteneur: '20ft',
    fret_maritime: 3500,
    dechargement: 550,
    douane: 280,
    livraison: 450,
    total: 4780,
  },
  {
    destination: 'GF',
    type_conteneur: '40ft',
    fret_maritime: 5200,
    dechargement: 800,
    douane: 480,
    livraison: 680,
    total: 7160,
  },
];

const DESTINATIONS: Record<string, string> = {
  MQ: 'Martinique',
  GP: 'Guadeloupe',
  RE: 'Réunion',
  GF: 'Guyane',
};

export default function FraisLogistique() {
  const { t } = useI18n();
  const [filterDest, setFilterDest] = useState<string>('all');

  const filteredData =
    filterDest === 'all'
      ? FRAIS_DATA
      : FRAIS_DATA.filter((f) => f.destination === filterDest);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.frais')}</h1>
        <select
          value={filterDest}
          onChange={(e) => setFilterDest(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">Toutes destinations</option>
          {Object.entries(DESTINATIONS).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-salmon-light">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Destination</th>
              <th className="text-left px-4 py-3 font-medium">Conteneur</th>
              <th className="text-right px-4 py-3 font-medium">Fret maritime</th>
              <th className="text-right px-4 py-3 font-medium">Déchargement</th>
              <th className="text-right px-4 py-3 font-medium">Douane</th>
              <th className="text-right px-4 py-3 font-medium">Livraison</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((f, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{DESTINATIONS[f.destination]}</td>
                <td className="px-4 py-3">{f.type_conteneur}</td>
                <td className="px-4 py-3 text-right">
                  {f.fret_maritime.toLocaleString('fr-FR')} €
                </td>
                <td className="px-4 py-3 text-right">
                  {f.dechargement.toLocaleString('fr-FR')} €
                </td>
                <td className="px-4 py-3 text-right">
                  {f.douane.toLocaleString('fr-FR')} €
                </td>
                <td className="px-4 py-3 text-right">
                  {f.livraison.toLocaleString('fr-FR')} €
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {f.total.toLocaleString('fr-FR')} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500">
        * Ces tarifs sont indicatifs et peuvent varier selon les conditions du marché.
      </p>
    </div>
  );
}
