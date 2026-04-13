import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { Card, Button } from '../components/Icons';

interface SAV {
  id: string;
  numero: string;
  client_id: string;
  quote_id: string;
  produit_ref: string;
  description: string;
  photos: string[];
  statut: string;
  piece_affectee: string;
  createdAt: any;
}

export default function SAVDetail() {
  const { t } = useI18n();
  const [, params] = useRoute('/admin/sav/:id');
  const [, setLocation] = useLocation();
  const [sav, setSav] = useState<SAV | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const snap = await getDoc(doc(db, 'sav', params.id));
      if (snap.exists()) setSav({ id: snap.id, ...snap.data() } as SAV);
      setLoading(false);
    };
    load();
  }, [params?.id]);

  const handleSave = async () => {
    if (!sav) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'sav', sav.id), { ...sav, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!sav) return <div className="alert rd">Ticket SAV introuvable</div>;

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18 }}>{sav.numero}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="out" onClick={() => setLocation('/admin/sav')}>Retour</Button>
          <Button variant="p" onClick={handleSave} disabled={saving}>
            {saving ? t('loading') : t('btn.enregistrer')}
          </Button>
        </div>
      </div>

      <Card title="Informations client">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
          <div className="fg">
            <div className="fl">Produit (réf.)</div>
            <input className="fi" type="text" value={sav.produit_ref || ''}
              onChange={(e) => setSav({ ...sav, produit_ref: e.target.value })} />
          </div>
          <div className="fg">
            <div className="fl">Statut</div>
            <select className="fsel" value={sav.statut}
              onChange={(e) => setSav({ ...sav, statut: e.target.value })}>
              <option value="nouveau">Nouveau</option>
              <option value="en cours">En cours</option>
              <option value="résolu">Résolu</option>
              <option value="fermé">Fermé</option>
            </select>
          </div>
          <div className="fg">
            <div className="fl">Pièce affectée</div>
            <input className="fi" type="text" value={sav.piece_affectee || ''}
              onChange={(e) => setSav({ ...sav, piece_affectee: e.target.value })} />
          </div>
          <div className="fg">
            <div className="fl">Devis lié</div>
            <input className="fi" type="text" value={sav.quote_id || ''}
              onChange={(e) => setSav({ ...sav, quote_id: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card title="Description du problème">
        <div style={{ padding: 16 }}>
          <textarea className="fi" value={sav.description || ''} rows={5}
            onChange={(e) => setSav({ ...sav, description: e.target.value })} />
        </div>
      </Card>

      {sav.photos && sav.photos.length > 0 && (
        <Card title="Photos">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 16 }}>
            {sav.photos.map((url, i) => (
              <img key={i} src={url} alt={`Photo ${i + 1}`}
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
