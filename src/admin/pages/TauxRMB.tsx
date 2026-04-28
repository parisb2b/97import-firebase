import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Kpi, Button } from '../components/Icons';
import { useToast } from '../../front/components/Toast';
import {
  subscribeToRates,
  subscribeToMultipliers,
  fetchApiRates,
  updateGlobalRates,
  updateMultipliers,
  type RatesWithMeta,
  type MultipliersWithMeta,
} from '../services/pricingService';

type Devise = 'CNY' | 'USD' | 'EUR';

const FR_DATE = (ts: any): string => {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : (ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts));
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
};

export default function TauxRMB() {
  const { showToast } = useToast();
  const [rates, setRates] = useState<RatesWithMeta>({ eur_usd: 1.17, eur_cny: 8, usd_cny: 6.84 });
  const [multipliers, setMultipliers] = useState<MultipliersWithMeta>({ client: 2.0, partner: 1.5, vip: 1.5 });
  const [draftRates, setDraftRates] = useState<RatesWithMeta>(rates);
  const [draftMultipliers, setDraftMultipliers] = useState<MultipliersWithMeta>(multipliers);
  const [savingRates, setSavingRates] = useState(false);
  const [savingMult, setSavingMult] = useState(false);
  const [refreshingApi, setRefreshingApi] = useState(false);
  const [apiRates, setApiRates] = useState<RatesWithMeta | null>(null);
  const [convAmount, setConvAmount] = useState<number>(100);
  const [convDevise, setConvDevise] = useState<Devise>('CNY');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubR = subscribeToRates((r) => { setRates(r); setDraftRates(r); setLoaded(true); });
    const unsubM = subscribeToMultipliers((m) => { setMultipliers(m); setDraftMultipliers(m); });
    return () => { unsubR(); unsubM(); };
  }, []);

  // Conversion rapide
  const conversion = useMemo(() => {
    if (!convAmount || convAmount <= 0) return { cny: 0, usd: 0, eur: 0 };
    let cny = 0, usd = 0, eur = 0;
    if (convDevise === 'CNY') { cny = convAmount; eur = convAmount / rates.eur_cny; usd = convAmount / rates.usd_cny; }
    else if (convDevise === 'USD') { usd = convAmount; eur = convAmount / rates.eur_usd; cny = convAmount * rates.usd_cny; }
    else { eur = convAmount; usd = convAmount * rates.eur_usd; cny = convAmount * rates.eur_cny; }
    return { cny: round2(cny), usd: round2(usd), eur: round2(eur) };
  }, [convAmount, convDevise, rates]);

  const conversions6 = useMemo(() => [
    { from: '1 EUR', to: `${rates.eur_usd.toFixed(4)} USD` },
    { from: '1 USD', to: `${(1 / rates.eur_usd).toFixed(4)} EUR` },
    { from: '1 EUR', to: `${rates.eur_cny.toFixed(4)} CNY` },
    { from: '1 CNY', to: `${(1 / rates.eur_cny).toFixed(4)} EUR` },
    { from: '1 USD', to: `${rates.usd_cny.toFixed(4)} CNY` },
    { from: '1 CNY', to: `${(1 / rates.usd_cny).toFixed(4)} USD` },
  ], [rates]);

  const handleSaveRates = useCallback(async () => {
    setSavingRates(true);
    try {
      const usd_cny = draftRates.eur_cny / draftRates.eur_usd;
      await updateGlobalRates({ eur_usd: draftRates.eur_usd, eur_cny: draftRates.eur_cny, usd_cny }, 'admin-taux-page');
      showToast('Taux 97IMPORT sauvegardés', 'success');
    } catch (err: any) {
      showToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSavingRates(false);
    }
  }, [draftRates, showToast]);

  const handleRefreshApi = useCallback(async () => {
    setRefreshingApi(true);
    try {
      const r = await fetchApiRates();
      setApiRates(r);
      showToast(`Taux API actualisés (source : ${r.source})`, 'success');
    } catch (err: any) {
      showToast(`Erreur API : ${err.message}`, 'error');
    } finally {
      setRefreshingApi(false);
    }
  }, [showToast]);

  const handleApplyApiRates = useCallback(async () => {
    if (!apiRates) return;
    setSavingRates(true);
    try {
      await updateGlobalRates({ eur_usd: apiRates.eur_usd, eur_cny: apiRates.eur_cny, usd_cny: apiRates.usd_cny }, apiRates.source);
      showToast('Taux API appliqués comme taux 97IMPORT', 'success');
    } catch (err: any) {
      showToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSavingRates(false);
    }
  }, [apiRates, showToast]);

  const handleSaveMultipliers = useCallback(async () => {
    setSavingMult(true);
    try {
      await updateMultipliers(draftMultipliers, 'admin-taux-page');
      showToast('Multiplicateurs sauvegardés', 'success');
    } catch (err: any) {
      showToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSavingMult(false);
    }
  }, [draftMultipliers, showToast]);

  if (!loaded) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;

  return (
    <>
      {/* KPIs Top — Rubrique 3 résumée */}
      <div className="kgrid">
        <Kpi label="Taux EUR/USD" value={rates.eur_usd.toFixed(4)} color="pu" sub={`1€ = ${rates.eur_usd.toFixed(2)} $`} />
        <Kpi label="Taux EUR/CNY" value={rates.eur_cny.toFixed(4)} color="tl" sub={`1€ = ${rates.eur_cny.toFixed(2)} ¥`} />
        <Kpi label="Taux USD/CNY (auto)" value={rates.usd_cny.toFixed(4)} color="or" sub={`1$ = ${rates.usd_cny.toFixed(2)} ¥`} />
        <Kpi label="Dernière MAJ" value={FR_DATE(rates.derniere_maj_taux)} />
      </div>

      {/* Rubrique 3 — Taux 97IMPORT modifiables */}
      <Card title="3 — Taux moyens utilisés par 97IMPORT (modifiables par Admin)" subtitle={`Source : /admin_params/global · MAJ : ${FR_DATE(rates.derniere_maj_taux)}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16 }}>
          <div className="fg">
            <div className="fl">1 EUR = X USD</div>
            <input className="fi" type="number" step="0.0001" value={draftRates.eur_usd}
              onChange={(e) => setDraftRates({ ...draftRates, eur_usd: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="fg">
            <div className="fl">1 EUR = X CNY</div>
            <input className="fi" type="number" step="0.0001" value={draftRates.eur_cny}
              onChange={(e) => setDraftRates({ ...draftRates, eur_cny: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="fg">
            <div className="fl">1 USD = X CNY (auto)</div>
            <input className="fi" type="number" readOnly value={(draftRates.eur_cny / draftRates.eur_usd || 0).toFixed(4)}
              style={{ background: '#F3F4F6', color: '#6B7280' }} />
          </div>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <Button variant="p" onClick={handleSaveRates} disabled={savingRates}>
            {savingRates ? 'Sauvegarde…' : '💾 Sauvegarder taux 97IMPORT'}
          </Button>
        </div>
      </Card>

      {/* Rubrique 4 — Conversion rapide */}
      <Card title="4 — Conversion rapide" subtitle="Outil de calcul instantané (pas de persistence)">
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, marginBottom: 12 }}>
            <input className="fi" type="number" placeholder="Montant" value={convAmount}
              onChange={(e) => setConvAmount(parseFloat(e.target.value) || 0)} />
            <select className="fsel" value={convDevise} onChange={(e) => setConvDevise(e.target.value as Devise)}>
              <option value="CNY">CNY ¥</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <ConvCell label="CNY ¥" value={`${conversion.cny.toLocaleString('fr-FR')}`} active={convDevise === 'CNY'} />
            <ConvCell label="USD $" value={`${conversion.usd.toLocaleString('fr-FR')}`} active={convDevise === 'USD'} />
            <ConvCell label="EUR €" value={`${conversion.eur.toLocaleString('fr-FR')}`} active={convDevise === 'EUR'} />
          </div>
        </div>
      </Card>

      {/* Rubrique 5 — Taux référence marché (API) */}
      <Card title="5 — Taux de référence marché (API interbancaire)" subtitle={apiRates ? `Source : ${apiRates.source}` : 'Cliquer sur Actualiser pour fetch live'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16 }}>
          <div className="fg">
            <div className="fl">EUR/USD</div>
            <input className="fi" readOnly value={apiRates ? apiRates.eur_usd.toFixed(4) : '—'} style={{ background: '#F3F4F6' }} />
          </div>
          <div className="fg">
            <div className="fl">EUR/CNY</div>
            <input className="fi" readOnly value={apiRates ? apiRates.eur_cny.toFixed(4) : '—'} style={{ background: '#F3F4F6' }} />
          </div>
          <div className="fg">
            <div className="fl">USD/CNY</div>
            <input className="fi" readOnly value={apiRates ? apiRates.usd_cny.toFixed(4) : '—'} style={{ background: '#F3F4F6' }} />
          </div>
        </div>
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
          <Button variant="p" onClick={handleRefreshApi} disabled={refreshingApi}>
            {refreshingApi ? 'Actualisation…' : '🔄 Actualiser les 3 taux API'}
          </Button>
          {apiRates && (
            <Button variant="s" onClick={handleApplyApiRates} disabled={savingRates}>
              {savingRates ? 'Application…' : '✅ Appliquer comme taux 97IMPORT'}
            </Button>
          )}
        </div>
      </Card>

      {/* Rubrique 6 — Multiplicateurs */}
      <Card title="6 — Multiplicateurs (Partenaire / Client)" subtitle={`Source : /admin_params/coefficients_prix · MAJ : ${FR_DATE(multipliers.derniere_maj)}`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
          <div className="fg">
            <div className="fl">6a — Multiplicateur Partenaire</div>
            <input className="fi" type="number" step="0.05" min="1" max="5"
              value={draftMultipliers.partner}
              onChange={(e) => setDraftMultipliers({ ...draftMultipliers, partner: parseFloat(e.target.value) || 1.5 })} />
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
              Prix partenaire = prix_achat_eur × {draftMultipliers.partner}
            </div>
          </div>
          <div className="fg">
            <div className="fl">6b — Multiplicateur Client</div>
            <input className="fi" type="number" step="0.05" min="1" max="10"
              value={draftMultipliers.client}
              onChange={(e) => setDraftMultipliers({ ...draftMultipliers, client: parseFloat(e.target.value) || 2 })} />
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
              Prix public = prix_achat_eur × {draftMultipliers.client}
            </div>
          </div>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <Button variant="p" onClick={handleSaveMultipliers} disabled={savingMult}>
            {savingMult ? 'Sauvegarde…' : '💾 Sauvegarder multiplicateurs'}
          </Button>
        </div>
      </Card>

      {/* Rubrique 7 — 6 conversions en direct */}
      <Card title="7 — Les 6 conversions en direct" subtitle="Calculées depuis Rubrique 3 (taux 97IMPORT)">
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {conversions6.map((c, i) => (
            <div key={i} style={{ padding: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{c.from}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E3A5F', marginTop: 2 }}>{c.to}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="alert am">
        ℹ️ Mise à jour manuelle. APIs disponibles : Frankfurter (gratuit, principal) + exchangerate-api.com (clé requise, fallback). Hardcoded ultime fallback : 1.17 / 8.00.
      </div>
    </>
  );
}

function ConvCell({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div style={{
      padding: 12,
      background: active ? '#FEF3C7' : '#F9FAFB',
      border: `1px solid ${active ? '#FCD34D' : '#E5E7EB'}`,
      borderRadius: 8,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: '#6B7280' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1E3A5F', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
