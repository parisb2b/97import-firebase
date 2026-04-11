import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

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
}

export default function Parametres() {
  const { t } = useI18n();
  const [global, setGlobal] = useState<GlobalParams | null>(null);
  const [emetteur, setEmetteur] = useState<Emetteur | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [globalSnap, emetteurSnap] = await Promise.all([
          getDoc(doc(db, 'admin_params', 'global')),
          getDoc(doc(db, 'admin_params', 'emetteur')),
        ]);

        if (globalSnap.exists()) {
          setGlobal(globalSnap.data() as GlobalParams);
        }
        if (emetteurSnap.exists()) {
          setEmetteur(emetteurSnap.data() as Emetteur);
        }
      } catch (err) {
        console.error('Error loading params:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (global) {
        await updateDoc(doc(db, 'admin_params', 'global'), { ...global });
      }
      if (emetteur) {
        await updateDoc(doc(db, 'admin_params', 'emetteur'), { ...emetteur });
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.parametres')}</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
        >
          {saving ? t('loading') : t('btn.enregistrer')}
        </button>
      </div>

      {/* Paramètres globaux */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4">Paramètres globaux</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Acompte par défaut (%)
            </label>
            <input
              type="number"
              value={global?.acompte_pct_defaut || 30}
              onChange={(e) =>
                setGlobal((g) =>
                  g ? { ...g, acompte_pct_defaut: Number(e.target.value) } : null
                )
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Validité devis (jours)
            </label>
            <input
              type="number"
              value={global?.delai_validite_devis || 30}
              onChange={(e) =>
                setGlobal((g) =>
                  g ? { ...g, delai_validite_devis: Number(e.target.value) } : null
                )
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Coef. majoration clients
            </label>
            <input
              type="number"
              step="0.1"
              value={global?.taux_majoration_user || 2}
              onChange={(e) =>
                setGlobal((g) =>
                  g ? { ...g, taux_majoration_user: Number(e.target.value) } : null
                )
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Coef. majoration partenaires
            </label>
            <input
              type="number"
              step="0.1"
              value={global?.taux_majoration_partner || 1.2}
              onChange={(e) =>
                setGlobal((g) =>
                  g ? { ...g, taux_majoration_partner: Number(e.target.value) } : null
                )
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Informations émetteur */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4">Informations émetteur (factures)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom société</label>
            <input
              type="text"
              value={emetteur?.nom || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, nom: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N° Company</label>
            <input
              type="text"
              value={emetteur?.company_number || ''}
              onChange={(e) =>
                setEmetteur((em) =>
                  em ? { ...em, company_number: e.target.value } : null
                )
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input
              type="text"
              value={emetteur?.adresse || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, adresse: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ville</label>
            <input
              type="text"
              value={emetteur?.ville || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, ville: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pays</label>
            <input
              type="text"
              value={emetteur?.pays || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, pays: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={emetteur?.email || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, email: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tél France</label>
            <input
              type="tel"
              value={emetteur?.tel_fr || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, tel_fr: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tél Chine</label>
            <input
              type="tel"
              value={emetteur?.tel_cn || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, tel_cn: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IBAN</label>
            <input
              type="text"
              value={emetteur?.iban || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, iban: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SWIFT/BIC</label>
            <input
              type="text"
              value={emetteur?.swift || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, swift: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Banque</label>
            <input
              type="text"
              value={emetteur?.banque || ''}
              onChange={(e) =>
                setEmetteur((em) => (em ? { ...em, banque: e.target.value } : null))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
