import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, Button, FormGroup } from '../components/Icons';

interface SiteParams {
  hero_titre: string;
  hero_soustitre: string;
  whatsapp: string;
  email: string;
  tiktok: string;
}

export default function GestionSite() {
  const [params, setParams] = useState<SiteParams>({
    hero_titre: "L'importation simplifiee de la Chine vers les Antilles.",
    hero_soustitre: 'Mini-pelles, maisons modulaires, kit solaire. Prix usine, DOM-TOM.',
    whatsapp: '+33 6 63 28 49 08',
    email: 'parisb2b@gmail.com',
    tiktok: '@direxport',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin_params', 'site'));
        if (snap.exists()) {
          setParams((p) => ({ ...p, ...snap.data() }));
        }
      } catch (e) {
        console.error('Error loading site params:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'admin_params', 'site'), { ...params });
      alert('Parametres enregistres !');
    } catch (e) {
      console.error('Error saving:', e);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <div className="g2">
      {/* Page accueil */}
      <Card
        title="🌐 Page accueil"
        actions={
          <Button variant="s" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        }
      >
        <div style={{ padding: 12 }}>
          <FormGroup label="Titre hero">
            <input
              className="fi"
              value={params.hero_titre}
              onChange={(e) => setParams((p) => ({ ...p, hero_titre: e.target.value }))}
            />
          </FormGroup>
          <FormGroup label="Sous-titre">
            <input
              className="fi"
              value={params.hero_soustitre}
              onChange={(e) => setParams((p) => ({ ...p, hero_soustitre: e.target.value }))}
            />
          </FormGroup>
        </div>
      </Card>

      {/* Coordonnees */}
      <Card
        title="Coordonnees"
        actions={
          <Button variant="p" onClick={handleSave} disabled={saving}>
            Sauvegarder
          </Button>
        }
      >
        <div style={{ padding: 12 }}>
          <FormGroup label="WhatsApp">
            <input
              className="fi"
              value={params.whatsapp}
              onChange={(e) => setParams((p) => ({ ...p, whatsapp: e.target.value }))}
            />
          </FormGroup>
          <FormGroup label="Email">
            <input
              className="fi"
              type="email"
              value={params.email}
              onChange={(e) => setParams((p) => ({ ...p, email: e.target.value }))}
            />
          </FormGroup>
          <FormGroup label="TikTok">
            <input
              className="fi"
              value={params.tiktok}
              onChange={(e) => setParams((p) => ({ ...p, tiktok: e.target.value }))}
            />
          </FormGroup>
        </div>
      </Card>
    </div>
  );
}
