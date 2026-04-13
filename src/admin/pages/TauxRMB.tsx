import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { fetchRMBRate } from '../../lib/exchange-rate';
import { Card, Kpi, Button, InfoRow } from '../components/Icons';

interface Params {
  taux_rmb_eur: number;
  taux_rmb_updated: any;
  taux_majoration_user: number;
  taux_majoration_partner: number;
}

export default function TauxRMB() {
  const [params, setParams] = useState<Params | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin_params', 'global'));
        if (snap.exists()) setParams(snap.data() as Params);
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

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;

  const tauxMajore = params ? params.taux_rmb_eur * 1.02 : 0;

  return (
    <>
      <div className="kgrid">
        <Kpi label="Taux EUR/CNY" value={params?.taux_rmb_eur?.toFixed(4) || '—'} color="tl" sub={`1€ = ${params?.taux_rmb_eur?.toFixed(2) || '—'} ¥`} />
        <Kpi label="Taux majoré +2%" value={tauxMajore.toFixed(4)} color="or" sub="Calcul prix" />
        <Kpi label="Dernière MAJ" value={params?.taux_rmb_updated?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} />
      </div>

      <Card title="Actualiser le taux" actions={
        <Button variant="p" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Actualisation...' : 'Actualiser maintenant'}
        </Button>
      }>
        <div style={{ padding: 16 }}>
          <InfoRow label="Source" value="exchangerate-api.com" />
          <InfoRow label="Mise à jour" value="Toutes les 24h via Cloud Function" />
        </div>
      </Card>

      <Card title="Paramètres de majoration">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
          <div className="fg">
            <div className="fl">Majoration clients (coefficient)</div>
            <input className="fi" type="number" value={params?.taux_majoration_user || 2} readOnly style={{ background: 'var(--bg2)' }} />
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>Prix affiché = prix achat × {params?.taux_majoration_user || 2}</div>
          </div>
          <div className="fg">
            <div className="fl">Majoration partenaires (coefficient)</div>
            <input className="fi" type="number" value={params?.taux_majoration_partner || 1.2} readOnly style={{ background: 'var(--bg2)' }} />
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>Prix partenaire = prix achat × {params?.taux_majoration_partner || 1.2}</div>
          </div>
        </div>
      </Card>

      <div className="alert am">
        <strong>API ExchangeRate</strong> — Les taux sont récupérés automatiquement depuis exchangerate-api.com toutes les 24h via une Cloud Function schedulée.
      </div>
    </>
  );
}
