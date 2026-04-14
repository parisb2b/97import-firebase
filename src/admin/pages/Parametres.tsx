import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { Card, Button } from '../components/Icons';

interface GlobalParams {
  taux_rmb_eur: number;
  taux_majoration_user: number;
  taux_majoration_partner: number;
  acompte_pct_defaut: number;
  delai_validite_devis: number;
}

interface Emetteur {
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  company_number: string;
  email: string;
  tel_cn: string;
  tel_fr: string;
  iban: string;
  swift: string;
  banque: string;
  type?: string;
}

export default function Parametres() {
  const { t } = useI18n();
  const [global, setGlobal] = useState<GlobalParams | null>(null);
  const [emetteur, setEmetteur] = useState<Emetteur | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [globalSnap, emetteurSnap] = await Promise.all([
          getDoc(doc(db, 'admin_params', 'global')),
          getDoc(doc(db, 'admin_params', 'emetteur')),
        ]);
        if (globalSnap.exists()) setGlobal(globalSnap.data() as GlobalParams);
        if (emetteurSnap.exists()) setEmetteur(emetteurSnap.data() as Emetteur);
      } catch (err) {
        console.error('Error loading params:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (global && (global.taux_majoration_user <= 0 || global.taux_majoration_partner <= 0)) {
      setErrorMsg('Les coefficients de majoration doivent être supérieurs à 0');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setSaving(true);
    try {
      if (global) await updateDoc(doc(db, 'admin_params', 'global'), { ...global });
      if (emetteur) await updateDoc(doc(db, 'admin_params', 'emetteur'), { ...emetteur });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18 }}>Paramètres</div>
        <Button variant="p" onClick={handleSave} disabled={saving}>
          {saving ? t('loading') : t('btn.enregistrer')}
        </Button>
      </div>

      {saved && <div className="alert gr">Paramètres enregistrés avec succès</div>}
      {errorMsg && <div className="alert rd">{errorMsg}</div>}

      <Card title="Paramètres globaux">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: 16 }}>
          <div className="fg">
            <div className="fl">Acompte par défaut (%)</div>
            <input className="fi" type="number" value={global?.acompte_pct_defaut || 30}
              onChange={(e) => setGlobal(g => g ? { ...g, acompte_pct_defaut: Number(e.target.value) } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Validité devis (jours)</div>
            <input className="fi" type="number" value={global?.delai_validite_devis || 30}
              onChange={(e) => setGlobal(g => g ? { ...g, delai_validite_devis: Number(e.target.value) } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Coef. majoration clients</div>
            <input className="fi" type="number" min="0.1" max="10" step="0.1" value={global?.taux_majoration_user || 2}
              onChange={(e) => setGlobal(g => g ? { ...g, taux_majoration_user: Number(e.target.value) } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Coef. majoration partenaires</div>
            <input className="fi" type="number" min="0.1" max="10" step="0.1" value={global?.taux_majoration_partner || 1.2}
              onChange={(e) => setGlobal(g => g ? { ...g, taux_majoration_partner: Number(e.target.value) } : null)} />
          </div>
        </div>
      </Card>

      <Card title="Émetteur (LUXENT)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
          <div className="fg">
            <div className="fl">Nom société</div>
            <input className="fi" value={emetteur?.nom || ''} onChange={(e) => setEmetteur(em => em ? { ...em, nom: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">N° entreprise</div>
            <input className="fi" value={emetteur?.company_number || ''} onChange={(e) => setEmetteur(em => em ? { ...em, company_number: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Adresse</div>
            <input className="fi" value={emetteur?.adresse || ''} onChange={(e) => setEmetteur(em => em ? { ...em, adresse: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Ville</div>
            <input className="fi" value={emetteur?.ville || ''} onChange={(e) => setEmetteur(em => em ? { ...em, ville: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Pays</div>
            <input className="fi" value={emetteur?.pays || ''} onChange={(e) => setEmetteur(em => em ? { ...em, pays: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Email</div>
            <input className="fi" type="email" value={emetteur?.email || ''} onChange={(e) => setEmetteur(em => em ? { ...em, email: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Tél. Chine</div>
            <input className="fi" value={emetteur?.tel_cn || ''} onChange={(e) => setEmetteur(em => em ? { ...em, tel_cn: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Tél. France</div>
            <input className="fi" value={emetteur?.tel_fr || ''} onChange={(e) => setEmetteur(em => em ? { ...em, tel_fr: e.target.value } : null)} />
          </div>
        </div>
      </Card>

      <Card title="Coordonnées bancaires">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
          <div className="fg">
            <div className="fl">IBAN</div>
            <input className="fi" value={emetteur?.iban || ''} onChange={(e) => setEmetteur(em => em ? { ...em, iban: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">SWIFT / BIC</div>
            <input className="fi" value={emetteur?.swift || ''} onChange={(e) => setEmetteur(em => em ? { ...em, swift: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Banque</div>
            <input className="fi" value={emetteur?.banque || ''} onChange={(e) => setEmetteur(em => em ? { ...em, banque: e.target.value } : null)} />
          </div>
          <div className="fg">
            <div className="fl">Type (pro/prive)</div>
            <select className="fsel" value={emetteur?.type || 'pro'} onChange={(e) => setEmetteur(em => em ? { ...em, type: e.target.value } : null)}>
              <option value="pro">PRO (LUXENT)</option>
              <option value="prive">PRIVÉ (Michel Chen)</option>
            </select>
          </div>
        </div>
      </Card>
    </>
  );
}
