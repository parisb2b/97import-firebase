import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { getNextNumber } from '../../lib/counters';

export default function NouveauConteneur() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [numero, setNumero] = useState('');
  const [type, setType] = useState('20ft');
  const [destination, setDestination] = useState('MQ');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNextNumber('CONT').then(setNumero);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = numero.replace(/[^a-zA-Z0-9]/g, '-');
      await setDoc(doc(db, 'containers', id), {
        numero,
        type,
        destination,
        statut: 'préparation',
        lignes: [],
        volume_total: 0,
        poids_total: 0,
        port_chargement: 'NINGBO',
        port_destination:
          destination === 'MQ'
            ? 'FORT-DE-FRANCE'
            : destination === 'GP'
            ? 'POINTE-A-PITRE'
            : destination === 'RE'
            ? 'PORT-REUNION'
            : 'CAYENNE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setLocation(`/admin/conteneurs/${id}`);
    } catch (err) {
      console.error('Error creating container:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Nouveau conteneur</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Numéro</label>
          <input
            type="text"
            value={numero}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type de conteneur</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="20ft">20 pieds</option>
            <option value="40ft">40 pieds</option>
            <option value="40ft-HC">40 pieds High Cube</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="MQ">Martinique</option>
            <option value="GP">Guadeloupe</option>
            <option value="RE">Réunion</option>
            <option value="GF">Guyane</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setLocation('/admin/conteneurs')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            {t('btn.annuler')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-navy text-white rounded hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? t('loading') : t('btn.enregistrer')}
          </button>
        </div>
      </form>
    </div>
  );
}
