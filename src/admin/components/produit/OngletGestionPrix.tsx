import { useEffect, useState, useCallback, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { sanitizeForFirestore } from '../../../lib/firebaseUtils';
import { useToast } from '../../../front/components/Toast';
import { formatDateHeure } from '../../../lib/dateHelpers';
import {
  subscribeToRates,
  subscribeToMultipliers,
  fetchApiRates,
  updateGlobalRates,
  updateMultipliers,
  validateProductPrices,
  type RatesWithMeta,
  type MultipliersWithMeta,
} from '../../services/pricingService';
import { usePricingEngine, type Overrides } from '../../hooks/usePricingEngine';

interface Props {
  productId: string;
  product: any;
}

type Devise = 'CNY' | 'USD' | 'EUR';

export default function OngletGestionPrix({ productId, product }: Props) {
  const { showToast } = useToast();

  // ─── State ──────────────────────────────────────────────────────────────
  const [rates, setRates] = useState<RatesWithMeta>({ eur_usd: 1.17, eur_cny: 8, usd_cny: 6.84 });
  const [multipliers, setMultipliers] = useState<MultipliersWithMeta>({ client: 2.0, partner: 1.5, vip: 1.5 });
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [multipliersLoaded, setMultipliersLoaded] = useState(false);

  // Mode édition Rubrique 1
  const [editMode, setEditMode] = useState(false);
  const [draftCny, setDraftCny] = useState<number>(product.prix_achat_cny ?? 0);
  const [validating, setValidating] = useState(false);

  // Rubrique 3 — taux modifiables 97IMPORT
  const [draftRates, setDraftRates] = useState<RatesWithMeta>(rates);
  const [savingRates, setSavingRates] = useState(false);

  // Rubrique 4 — conversion rapide
  const [convAmount, setConvAmount] = useState<number>(100);
  const [convDevise, setConvDevise] = useState<Devise>('CNY');

  // Rubrique 5 — taux API
  const [apiRates, setApiRates] = useState<RatesWithMeta | null>(null);
  const [refreshingApi, setRefreshingApi] = useState(false);

  // Rubrique 6 — multiplicateurs
  const [draftMultipliers, setDraftMultipliers] = useState<MultipliersWithMeta>(multipliers);
  const [savingMultipliers, setSavingMultipliers] = useState(false);

  // FEATURE 6 (Dogme 5) — overrides manuels admin
  const [overridePublicActif, setOverridePublicActif] = useState<boolean>(
    typeof product.prix_public_override === 'number' && product.prix_public_override > 0,
  );
  const [overridePartenaireActif, setOverridePartenaireActif] = useState<boolean>(
    typeof product.prix_partenaire_override === 'number' && product.prix_partenaire_override > 0,
  );
  const [prixPublicOverride, setPrixPublicOverride] = useState<number>(
    product.prix_public_override ?? 0,
  );
  const [prixPartenaireOverride, setPrixPartenaireOverride] = useState<number>(
    product.prix_partenaire_override ?? 0,
  );
  const [savingOverrides, setSavingOverrides] = useState(false);

  // ─── Subscriptions Firestore (temps réel) ─────────────────────────────
  useEffect(() => {
    const unsubRates = subscribeToRates((r) => {
      setRates(r);
      setDraftRates(r);
      setRatesLoaded(true);
    });
    const unsubMult = subscribeToMultipliers((m) => {
      setMultipliers(m);
      setDraftMultipliers(m);
      setMultipliersLoaded(true);
    });
    return () => {
      unsubRates();
      unsubMult();
    };
  }, []);

  // Sync draftCny si le product change (ex: post-validation)
  useEffect(() => {
    if (!editMode) {
      setDraftCny(product.prix_achat_cny ?? 0);
    }
  }, [product.prix_achat_cny, editMode]);

  // ─── Calculs (Rubrique 1+2 + Dogme 5 overrides) ─────────────────────────
  const overridesForEngine: Overrides = useMemo(
    () => ({
      public: overridePublicActif && prixPublicOverride > 0 ? prixPublicOverride : null,
      partner: overridePartenaireActif && prixPartenaireOverride > 0 ? prixPartenaireOverride : null,
    }),
    [overridePublicActif, prixPublicOverride, overridePartenaireActif, prixPartenaireOverride],
  );
  const live = usePricingEngine(
    editMode ? draftCny : (product.prix_achat_cny ?? 0),
    rates,
    { client: multipliers.client, partner: multipliers.partner },
    overridesForEngine,
  );

  // ─── Conversion rapide (Rubrique 4) ─────────────────────────────────────
  const conversion = useMemo(() => {
    if (!convAmount || convAmount <= 0) return { cny: 0, usd: 0, eur: 0 };
    let cny = 0, usd = 0, eur = 0;
    if (convDevise === 'CNY') {
      cny = convAmount;
      eur = convAmount / rates.eur_cny;
      usd = convAmount / rates.usd_cny;
    } else if (convDevise === 'USD') {
      usd = convAmount;
      eur = convAmount / rates.eur_usd;
      cny = convAmount * rates.usd_cny;
    } else {
      eur = convAmount;
      usd = convAmount * rates.eur_usd;
      cny = convAmount * rates.eur_cny;
    }
    return { cny: round2(cny), usd: round2(usd), eur: round2(eur) };
  }, [convAmount, convDevise, rates]);

  // ─── 6 conversions en direct (Rubrique 7) ───────────────────────────────
  const conversions6 = useMemo(() => {
    return [
      { from: '1 EUR', to: `${rates.eur_usd.toFixed(4)} USD` },
      { from: '1 USD', to: `${(1 / rates.eur_usd).toFixed(4)} EUR` },
      { from: '1 EUR', to: `${rates.eur_cny.toFixed(4)} CNY` },
      { from: '1 CNY', to: `${(1 / rates.eur_cny).toFixed(4)} EUR` },
      { from: '1 USD', to: `${rates.usd_cny.toFixed(4)} CNY` },
      { from: '1 CNY', to: `${(1 / rates.usd_cny).toFixed(4)} USD` },
    ];
  }, [rates]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleToggleEdit = useCallback(() => {
    if (editMode) setDraftCny(product.prix_achat_cny ?? 0);
    setEditMode(!editMode);
  }, [editMode, product.prix_achat_cny]);

  const handleValidatePrices = useCallback(async () => {
    if (!productId) {
      showToast('Référence produit manquante', 'error');
      return;
    }
    if (live.prix_cny <= 0) {
      showToast('Le prix CNY doit être > 0', 'error');
      return;
    }
    setValidating(true);
    try {
      await validateProductPrices(productId, live, 'admin-onglet-gestion-prix');
      showToast(`Prix validés : ${live.prix_cny.toLocaleString('fr-FR')} ¥ → ${live.prix_eur.toLocaleString('fr-FR')} € → public ${live.prix_public.toLocaleString('fr-FR')} €`, 'success');
      setEditMode(false);
    } catch (err: any) {
      showToast(`Erreur validation : ${err.message}`, 'error');
    } finally {
      setValidating(false);
    }
  }, [productId, live, showToast]);

  const handleSaveRates = useCallback(async () => {
    setSavingRates(true);
    try {
      const usd_cny = draftRates.eur_cny / draftRates.eur_usd;
      await updateGlobalRates({ eur_usd: draftRates.eur_usd, eur_cny: draftRates.eur_cny, usd_cny }, 'admin');
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
    setSavingMultipliers(true);
    try {
      await updateMultipliers(draftMultipliers, 'admin');
      showToast('Multiplicateurs sauvegardés', 'success');
    } catch (err: any) {
      showToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSavingMultipliers(false);
    }
  }, [draftMultipliers, showToast]);

  // FEATURE 6 — handler sauvegarde overrides
  const handleSaveOverrides = useCallback(async () => {
    if (!productId) return;
    setSavingOverrides(true);
    try {
      const updates = sanitizeForFirestore({
        prix_public_override:
          overridePublicActif && prixPublicOverride > 0 ? prixPublicOverride : null,
        prix_partenaire_override:
          overridePartenaireActif && prixPartenaireOverride > 0 ? prixPartenaireOverride : null,
      });
      await updateDoc(doc(db, 'products', productId), updates);
      showToast('Overrides mis à jour', 'success');
    } catch (err: any) {
      showToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSavingOverrides(false);
    }
  }, [productId, overridePublicActif, prixPublicOverride, overridePartenaireActif, prixPartenaireOverride, showToast]);

  // ─── Render ────────────────────────────────────────────────────────────
  if (!ratesLoaded || !multipliersLoaded) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Chargement des taux et multiplicateurs…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ═══════════ RUBRIQUE 1 — Prix d'achat fournisseur ═══════════ */}
      <Card title="1 — Prix d'achat fournisseur" subtitle={`Dernière validation : ${formatDateHeure(product.date_derniere_validation)}`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button onClick={handleToggleEdit} style={editMode ? styles.btnSecondary : styles.btnPrimary}>
            {editMode ? '👁️ MODE LECTURE' : '✏️ MODE ÉDITION'}
          </button>
          {editMode && (
            <button onClick={handleValidatePrices} disabled={validating} style={styles.btnSuccess}>
              {validating ? 'Validation…' : '✅ VALIDER PRIX'}
            </button>
          )}
          <button
            onClick={() => { setDraftCny(product.prix_achat_cny ?? 0); }}
            style={styles.btnGhost}
            title="Recalcule USD/EUR depuis CNY actuel et taux Rubrique 3"
          >
            🔄 Actualiser selon taux (Rubrique 3)
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <PriceInput label="Prix CNY ¥ *" value={live.prix_cny} editable={editMode} draft={draftCny} onChange={setDraftCny} accent="#DC2626" highlight />
          <PriceInput label="Prix USD $" value={live.prix_usd} editable={false} accent="#2563EB" />
          <PriceInput label="Prix EUR €" value={live.prix_eur} editable={false} accent="#059669" />
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>
          🔁 Source de vérité : <strong>CNY</strong>. USD et EUR recalculés via taux 97IMPORT (Rubrique 3).
        </div>
      </Card>

      {/* ═══════════ RUBRIQUE 2 — Prix de vente calculés ═══════════ */}
      <Card title="2 — Prix de vente (lecture seule)" subtitle={`Dernière validation : ${formatDateHeure(product.date_derniere_validation)}`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <PriceCard
            label={live.override_public_actif ? 'Prix PUBLIC 🎯' : 'Prix PUBLIC'}
            color="#1565C0"
            bg="#DBEAFE"
            value={live.prix_public}
            formula={
              live.override_public_actif
                ? `Override manuel (auto: ${live.prix_public_auto.toLocaleString('fr-FR')} €)`
                : `${live.prix_eur.toLocaleString('fr-FR')} € × ${multipliers.client}`
            }
          />
          <PriceCard
            label={live.override_partenaire_actif ? 'Prix PARTENAIRE 🎯' : 'Prix PARTENAIRE'}
            color="#7C3AED"
            bg="#EDE9FE"
            value={live.prix_partenaire}
            formula={
              live.override_partenaire_actif
                ? `Override manuel (auto: ${live.prix_partenaire_auto.toLocaleString('fr-FR')} €)`
                : `${live.prix_eur.toLocaleString('fr-FR')} € × ${multipliers.partner}`
            }
          />
        </div>
      </Card>

      {/* ═══════════ FEATURE 6 (Dogme 5) — Override manuel admin ═══════════ */}
      <Card title="🎯 Override manuel (optionnel)" subtitle="Force un prix custom qui remplace le calcul automatique. Utile pour promotions ou prix négociés.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Override Public */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={overridePublicActif}
                onChange={(e) => setOverridePublicActif(e.target.checked)}
              />
              <span>Override prix PUBLIC</span>
            </label>
            {overridePublicActif && (
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prixPublicOverride || ''}
                  onChange={(e) => setPrixPublicOverride(parseFloat(e.target.value) || 0)}
                  placeholder={`Calcul auto : ${live.prix_public_auto.toFixed(2)} €`}
                  style={styles.input}
                />
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                  Calcul auto : {live.prix_public_auto.toLocaleString('fr-FR')} €
                </div>
              </div>
            )}
          </div>

          {/* Override Partenaire */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={overridePartenaireActif}
                onChange={(e) => setOverridePartenaireActif(e.target.checked)}
              />
              <span>Override prix PARTENAIRE</span>
            </label>
            {overridePartenaireActif && (
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prixPartenaireOverride || ''}
                  onChange={(e) => setPrixPartenaireOverride(parseFloat(e.target.value) || 0)}
                  placeholder={`Calcul auto : ${live.prix_partenaire_auto.toFixed(2)} €`}
                  style={styles.input}
                />
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                  Calcul auto : {live.prix_partenaire_auto.toLocaleString('fr-FR')} €
                </div>
              </div>
            )}
          </div>
        </div>
        <button onClick={handleSaveOverrides} disabled={savingOverrides} style={{ ...styles.btnPrimary, marginTop: 14 }}>
          {savingOverrides ? 'Sauvegarde…' : '💾 Enregistrer les overrides'}
        </button>
      </Card>

      {/* ═══════════ RUBRIQUE 3 — Taux moyens 97IMPORT ═══════════ */}
      <Card title="3 — Taux moyens utilisés par 97IMPORT (modifiables par Admin)" subtitle={`Dernière modification : ${formatDateHeure(rates.derniere_maj_taux)}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <RateInput label="1 EUR = X USD" value={draftRates.eur_usd} onChange={(v) => setDraftRates({ ...draftRates, eur_usd: v })} />
          <RateInput label="1 EUR = X CNY" value={draftRates.eur_cny} onChange={(v) => setDraftRates({ ...draftRates, eur_cny: v })} />
          <RateInput label="1 USD = X CNY (auto)" value={Number((draftRates.eur_cny / draftRates.eur_usd).toFixed(4))} onChange={() => {}} disabled />
        </div>
        <button onClick={handleSaveRates} disabled={savingRates} style={styles.btnPrimary}>
          {savingRates ? 'Sauvegarde…' : '💾 Sauvegarder taux 97IMPORT'}
        </button>
      </Card>

      {/* ═══════════ RUBRIQUE 4 — Conversion rapide ═══════════ */}
      <Card title="4 — Conversion rapide" subtitle="Outil de calcul instantané (pas de persistence)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 12 }}>
          <input
            type="number"
            value={convAmount}
            onChange={(e) => setConvAmount(parseFloat(e.target.value) || 0)}
            placeholder="Montant"
            style={styles.input}
          />
          <select value={convDevise} onChange={(e) => setConvDevise(e.target.value as Devise)} style={styles.input}>
            <option value="CNY">CNY ¥</option>
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <ConvCell label="CNY" value={`${conversion.cny.toLocaleString('fr-FR')} ¥`} active={convDevise === 'CNY'} />
          <ConvCell label="USD" value={`${conversion.usd.toLocaleString('fr-FR')} $`} active={convDevise === 'USD'} />
          <ConvCell label="EUR" value={`${conversion.eur.toLocaleString('fr-FR')} €`} active={convDevise === 'EUR'} />
        </div>
      </Card>

      {/* ═══════════ RUBRIQUE 5 — Taux référence marché (API) ═══════════ */}
      <Card title="5 — Taux de référence marché (API interbancaire)" subtitle={apiRates ? `Source : ${apiRates.source}` : 'Cliquer sur Actualiser pour fetch live'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <RateInput label="EUR/USD" value={apiRates?.eur_usd ?? 0} disabled />
          <RateInput label="EUR/CNY" value={apiRates?.eur_cny ?? 0} disabled />
          <RateInput label="USD/CNY" value={apiRates?.usd_cny ?? 0} disabled />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleRefreshApi} disabled={refreshingApi} style={styles.btnPrimary}>
            {refreshingApi ? 'Actualisation…' : '🔄 Actualiser les 3 taux API'}
          </button>
          {apiRates && (
            <button onClick={handleApplyApiRates} disabled={savingRates} style={styles.btnSuccess}>
              {savingRates ? 'Application…' : '✅ Appliquer comme taux 97IMPORT'}
            </button>
          )}
        </div>
      </Card>

      {/* ═══════════ RUBRIQUE 6 — Multiplicateurs ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="6a — Multiplicateur Partenaire" subtitle={`Dernière modification : ${formatDateHeure(multipliers.derniere_maj)}`}>
          <RateInput
            label="× Multiplicateur Partenaire"
            value={draftMultipliers.partner}
            onChange={(v) => setDraftMultipliers({ ...draftMultipliers, partner: v })}
          />
          <button onClick={handleSaveMultipliers} disabled={savingMultipliers} style={{ ...styles.btnPrimary, marginTop: 10 }}>
            {savingMultipliers ? 'Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </Card>

        <Card title="6b — Multiplicateur Client" subtitle={`Dernière modification : ${formatDateHeure(multipliers.derniere_maj)}`}>
          <RateInput
            label="× Multiplicateur Client"
            value={draftMultipliers.client}
            onChange={(v) => setDraftMultipliers({ ...draftMultipliers, client: v })}
          />
          <button onClick={handleSaveMultipliers} disabled={savingMultipliers} style={{ ...styles.btnPrimary, marginTop: 10 }}>
            {savingMultipliers ? 'Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </Card>
      </div>

      {/* ═══════════ RUBRIQUE 7 — Les 6 conversions en direct ═══════════ */}
      <Card title="7 — Les 6 conversions en direct" subtitle="Calculées depuis Rubrique 3 (taux 97IMPORT)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {conversions6.map((c, i) => (
            <div key={i} style={{ padding: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{c.from}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E3A5F', marginTop: 2 }}>{c.to}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 18 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1E3A5F' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function PriceInput({ label, value, editable, draft, onChange, accent, highlight }: {
  label: string;
  value: number;
  editable: boolean;
  draft?: number;
  onChange?: (v: number) => void;
  accent: string;
  highlight?: boolean;
}) {
  const display = editable ? (draft ?? 0) : value;
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={display || ''}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value) || 0)}
        disabled={!editable}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${highlight ? accent : '#E5E7EB'}`,
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          color: accent,
          background: editable ? '#FFFBEB' : '#F9FAFB',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  );
}

function PriceCard({ label, color, bg, value, formula }: { label: string; color: string; bg: string; value: number; formula: string }) {
  return (
    <div style={{ padding: 16, background: bg, borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4 }}>
        {value.toLocaleString('fr-FR')} €
      </div>
      <div style={{ fontSize: 11, color, opacity: 0.8, marginTop: 4 }}>{formula}</div>
    </div>
  );
}

function RateInput({ label, value, onChange, disabled }: { label: string; value: number; onChange?: (v: number) => void; disabled?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>{label}</label>
      <input
        type="number"
        step="0.0001"
        min="0"
        value={value || ''}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        style={{
          ...styles.input,
          background: disabled ? '#F3F4F6' : '#fff',
          color: disabled ? '#6B7280' : '#111827',
        }}
      />
    </div>
  );
}

function ConvCell({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div style={{
      padding: 10,
      background: active ? '#FEF3C7' : '#F9FAFB',
      border: `1px solid ${active ? '#FCD34D' : '#E5E7EB'}`,
      borderRadius: 8,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: '#6B7280' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1E3A5F', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const styles: Record<string, React.CSSProperties> = {
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#fff',
    color: '#111827',
  },
  btnPrimary: {
    padding: '8px 14px',
    background: '#1565C0',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSuccess: {
    padding: '8px 14px',
    background: '#10B981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '8px 14px',
    background: '#6B7280',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnGhost: {
    padding: '8px 14px',
    background: 'transparent',
    color: '#1565C0',
    border: '1px solid #1565C0',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
