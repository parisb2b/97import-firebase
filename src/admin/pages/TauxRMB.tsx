import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Kpi, Button } from '../components/Icons';
import { useToast } from '../../front/components/Toast';
import { formatDateHeure, formatDateRelatif } from '../../lib/dateHelpers';
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
  const [apiRatesFetchedAt, setApiRatesFetchedAt] = useState<Date | null>(null);
  const [convAmount, setConvAmount] = useState<number>(100);
  const [convDevise, setConvDevise] = useState<Devise>('CNY');
  const [loaded, setLoaded] = useState(false);

  // FIX 4 — mode lecture/édition rubrique 3 + popup VALIDER
  const [modeEdition, setModeEdition] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  useEffect(() => {
    const unsubR = subscribeToRates((r) => { setRates(r); if (!modeEdition) setDraftRates(r); setLoaded(true); });
    const unsubM = subscribeToMultipliers((m) => { setMultipliers(m); if (!savingMult) setDraftMultipliers(m); });
    return () => { unsubR(); unsubM(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX 3 — Auto-fetch API au mount (lecture seule, pas de bouton)
  useEffect(() => {
    fetchApiRates().then((r) => {
      setApiRates(r);
      setApiRatesFetchedAt(new Date());
    });
  }, []);

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

  // FIX 4 — Bascule mode édition. V44-BIS : copie aussi usd_cny pour permettre override manuel.
  const handleStartEdit = useCallback(() => {
    setDraftRates({
      eur_usd: rates.eur_usd,
      eur_cny: rates.eur_cny,
      usd_cny: rates.usd_cny || (rates.eur_cny / rates.eur_usd),
      derniere_maj_taux: rates.derniere_maj_taux,
      derniere_maj_source: rates.derniere_maj_source,
    });
    setModeEdition(true);
  }, [rates]);

  const handleCancelEdit = useCallback(() => {
    setDraftRates({ ...rates });
    setModeEdition(false);
    setShowConfirmPopup(false);
  }, [rates]);

  const handleConfirmSave = useCallback(async () => {
    setSavingRates(true);
    try {
      // V44-BIS FIX 1 : écrire les 3 taux tels que saisis (pas de recalcul auto).
      // Si admin a modifié usd_cny manuellement, on respecte sa saisie.
      const usd_cny = draftRates.usd_cny && draftRates.usd_cny > 0
        ? draftRates.usd_cny
        : draftRates.eur_cny / draftRates.eur_usd;
      await updateGlobalRates(
        { eur_usd: draftRates.eur_usd, eur_cny: draftRates.eur_cny, usd_cny },
        'admin-taux-page',
      );
      // V44-BIS FIX 2 — Optimistic update local du state pour rafraîchir le KPI
      // immédiatement. Sans ça, le KPI affiche '—' pendant que serverTimestamp()
      // n'est pas encore résolu côté client (le sentinel ne passe pas le toDate()).
      // L'onSnapshot Firestore mettra à jour avec la valeur exacte ~quelques ms après.
      setRates((prev) => ({
        ...prev,
        eur_usd: draftRates.eur_usd,
        eur_cny: draftRates.eur_cny,
        usd_cny,
        derniere_maj_taux: new Date(),
        derniere_maj_source: 'admin-taux-page',
      }));
      showToast('Taux 97IMPORT mis à jour avec succès', 'success');
      setModeEdition(false);
      setShowConfirmPopup(false);
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
      setApiRatesFetchedAt(new Date());
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
      await updateGlobalRates(
        { eur_usd: apiRates.eur_usd, eur_cny: apiRates.eur_cny, usd_cny: apiRates.usd_cny },
        apiRates.source,
      );
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
      {/* FIX 5 — KPI Header avec format date FR */}
      <div className="kgrid">
        <Kpi label="Taux EUR/USD" value={rates.eur_usd.toFixed(4)} color="pu" sub={`1€ = ${rates.eur_usd.toFixed(2)} $`} />
        <Kpi label="Taux EUR/CNY" value={rates.eur_cny.toFixed(4)} color="tl" sub={`1€ = ${rates.eur_cny.toFixed(2)} ¥`} />
        <Kpi label="Taux USD/CNY (auto)" value={rates.usd_cny.toFixed(4)} color="or" sub={`1$ = ${rates.usd_cny.toFixed(2)} ¥`} />
        <Kpi label="Dernière MAJ taux" value={formatDateHeure(rates.derniere_maj_taux)} sub={`Source : ${rates.derniere_maj_source ?? '—'}`} />
      </div>

      {/* Rubrique 3 — Taux 97IMPORT (FIX 4 : mode lecture/édition) */}
      <Card title="3 — Taux moyens utilisés par 97IMPORT" subtitle={`Source : /admin_params/global · MAJ : ${formatDateHeure(rates.derniere_maj_taux)}`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 16px', marginBottom: 8 }}>
          {!modeEdition ? (
            <Button variant="p" onClick={handleStartEdit}>✏️ Modifier les taux</Button>
          ) : (
            <>
              <Button variant="out" onClick={handleCancelEdit}>❌ Annuler</Button>
              <Button variant="p" onClick={() => setShowConfirmPopup(true)}>💾 VALIDER</Button>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16 }}>
          <div className="fg">
            <div className="fl">1 EUR = X USD</div>
            <input className="fi" type="number" step="0.0001" value={draftRates.eur_usd}
              disabled={!modeEdition}
              onChange={(e) => setDraftRates({ ...draftRates, eur_usd: parseFloat(e.target.value) || 0 })}
              style={{ background: modeEdition ? '#FFFBEB' : '#F3F4F6' }} />
          </div>
          <div className="fg">
            <div className="fl">1 EUR = X CNY</div>
            <input className="fi" type="number" step="0.0001" value={draftRates.eur_cny}
              disabled={!modeEdition}
              onChange={(e) => setDraftRates({ ...draftRates, eur_cny: parseFloat(e.target.value) || 0 })}
              style={{ background: modeEdition ? '#FFFBEB' : '#F3F4F6' }} />
          </div>
          <div className="fg">
            <div className="fl">
              1 USD = X CNY {modeEdition ? '(auto ou manuel)' : '(auto)'}
            </div>
            <input className="fi" type="number" step="0.0001"
              value={modeEdition ? draftRates.usd_cny : (draftRates.eur_cny / draftRates.eur_usd || 0).toFixed(4)}
              disabled={!modeEdition}
              onChange={(e) => setDraftRates({ ...draftRates, usd_cny: parseFloat(e.target.value) || 0 })}
              style={{ background: modeEdition ? '#FFFBEB' : '#F3F4F6', color: modeEdition ? '#111827' : '#6B7280' }} />
          </div>
        </div>
      </Card>

      {/* Popup confirmation FIX 4 */}
      {showConfirmPopup && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(11,37,69,.6)',
            backdropFilter: 'blur(4px)', zIndex: 9000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => !savingRates && setShowConfirmPopup(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,.28)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#92400E', marginBottom: 12 }}>
              ⚠️ Confirmer la modification des taux
            </h3>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>
              Cette modification sera visible <strong>IMMÉDIATEMENT</strong> sur tous les
              produits du catalogue (visiteur, client, partenaire).
            </p>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 18 }}>
              Les devis <strong>EXISTANTS</strong> ne seront <strong>PAS</strong> impactés.
              Les <strong>NOUVEAUX</strong> devis utiliseront ces nouveaux taux.
            </p>
            <div style={{ background: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 18, fontSize: 12, fontFamily: 'monospace' }}>
              <div>1 EUR = <strong>{draftRates.eur_usd.toFixed(4)}</strong> USD</div>
              <div>1 EUR = <strong>{draftRates.eur_cny.toFixed(4)}</strong> CNY</div>
              <div>1 USD = <strong>{(draftRates.eur_cny / draftRates.eur_usd).toFixed(4)}</strong> CNY (auto)</div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmPopup(false)}
                disabled={savingRates}
                className="v45-trans-fast v45-focus v45-btn-ghost"
                style={{
                  padding: '10px 18px', background: 'transparent', color: '#6B7280',
                  border: '1.5px solid #CBD5E1', borderRadius: 10, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >Annuler</button>
              <button
                onClick={handleConfirmSave}
                disabled={savingRates}
                className="v45-trans-fast v45-focus v45-btn-primary"
                style={{
                  padding: '10px 18px', background: '#1565C0', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: savingRates ? 'wait' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {savingRates && <span className="v45-spinner" aria-hidden />}
                {savingRates ? 'Sauvegarde…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Rubrique 5 — Taux référence marché (FIX 3 : auto-fetch) */}
      <Card title="5 — Taux de référence marché (API interbancaire)" subtitle={apiRatesFetchedAt ? `Actualisé ${formatDateRelatif(apiRatesFetchedAt)} · Source : ${apiRates?.source ?? '—'}` : 'Chargement…'}>
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
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleRefreshApi}
            disabled={refreshingApi}
            title="Refresh manuel API"
            className="v45-trans-fast v45-focus v45-btn-ghost"
            style={{
              background: 'transparent', border: '1px solid #E5E7EB', color: '#6B7280',
              padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {refreshingApi && <span className="v45-spinner" aria-hidden />}
            {refreshingApi ? 'Refresh…' : '🔄 Refresh manuel'}
          </button>
          {apiRates && (
            <Button variant="s" onClick={handleApplyApiRates} disabled={savingRates}>
              {savingRates ? 'Application…' : '✅ Appliquer comme taux 97IMPORT'}
            </Button>
          )}
        </div>
      </Card>

      {/* Rubrique 6 — Multiplicateurs */}
      <Card title="6 — Multiplicateurs (Partenaire / Client)" subtitle={`Source : /admin_params/coefficients_prix · MAJ : ${formatDateHeure(multipliers.derniere_maj)}`}>
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
            <div key={i} className="v45-card" style={{ padding: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, textAlign: 'center' }}>
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
    <div className="v45-card v45-trans-fast" style={{
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
