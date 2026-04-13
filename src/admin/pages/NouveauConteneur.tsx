import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { getNextNumber } from '../../lib/counters';
import { Card, Button } from '../components/Icons';

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
        numero, type, destination,
        statut: 'préparation',
        lignes: [],
        volume_total: 0,
        poids_total: 0,
        port_chargement: 'NINGBO',
        port_destination:
          destination === 'MQ' ? 'FORT-DE-FRANCE'
          : destination === 'GP' ? 'POINTE-A-PITRE'
          : destination === 'RE' ? 'PORT-REUNION'
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
    <Card title="Nouveau conteneur">
      <form onSubmit={handleSubmit} style={{ padding: 16 }}>
        <div className="fg">
          <div className="fl">Numéro</div>
          <input className="fi" type="text" value={numero} readOnly style={{ background: 'var(--bg2)' }} />
        </div>
        <div className="fg" style={{ marginTop: 12 }}>
          <div className="fl">Type de conteneur</div>
          <select className="fsel" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="20ft">20 pieds</option>
            <option value="40ft">40 pieds</option>
            <option value="40ft-HC">40 pieds High Cube</option>
          </select>
        </div>
        <div className="fg" style={{ marginTop: 12 }}>
          <div className="fl">Destination</div>
          <select className="fsel" value={destination} onChange={(e) => setDestination(e.target.value)}>
            <option value="MQ">Martinique</option>
            <option value="GP">Guadeloupe</option>
            <option value="RE">Réunion</option>
            <option value="GF">Guyane</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button variant="out" onClick={() => setLocation('/admin/conteneurs')}>
            {t('btn.annuler')}
          </Button>
          <Button variant="p" disabled={saving}>
            {saving ? t('loading') : 'Créer'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
