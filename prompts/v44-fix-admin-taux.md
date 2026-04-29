# Mission V44 Fix — /admin/taux + Dogme 5 Override Manuel
## VERSION RÉVISÉE (post-audit nommage réel)

## 📋 Contexte
Suite audit lecture seule : la convention de nommage des taux dans Firestore
diffère du LIVRABLE 1 initial. Cette version utilise les NOMS RÉELS validés.

**État Firestore RÉEL au 2026-04-29 :**
- `/admin_params/global` existe avec : `taux_eur_usd`, `taux_rmb_eur`, `taux_usd_cny`, `derniere_maj_taux`, `derniere_maj_source` (+ champs legacy `taux_majoration_user/partner`).
- `/admin_params/coefficients_prix` n'existe **pas encore** (migration FIX 0 à lancer).
- `/admin_params/pricing` legacy à laisser tel quel.

**Convention nommage RÉELLE à utiliser partout :**
| Champ Firestore | Sens |
|---|---|
| `taux_eur_usd` | 1 EUR = X USD (ex: 1.15) |
| `taux_rmb_eur` | 1 EUR = X CNY (nom historique RMB) |
| `taux_usd_cny` | 1 USD = X CNY (auto-déduit) |
| `derniere_maj_taux` | Timestamp dernière modif |
| `derniere_maj_source` | "admin-taux-page" / "frankfurter" / etc |

**❌ NE PAS introduire les noms `taux_cny_usd`, `taux_usd_eur`, `date_maj_taux`** (proposés dans le LIVRABLE 1 mais qui n'existent pas).

## ⚠️ Procédure obligatoire AVANT modification

```bash
cd ~/97import-firebase
git fetch origin && git status
git log --oneline -5
git tag backup-pre-v44fix-$(date +%Y%m%d-%H%M)
git push origin --tags
```

## 🎯 Objectifs (1 migration + 5 fixes + 1 feature)

---

### FIX 0 — Migration /admin_params/coefficients_prix (PRIORITÉ 1)

```bash
node scripts/migrate-admin-params.js          # dry-run
# Si OK :
node scripts/migrate-admin-params.js --apply
```

Vérifier après apply que `/admin_params/coefficients_prix` contient :
```
{
  coefficient_public  : 2.0
  coefficient_partner : 1.5
  coefficient_vip     : 1.5
  canonical           : true
  derniere_maj        : <Timestamp>
}
```

Aussi : `/admin_params/global` enrichi avec `_coefficients_canonical: 'coefficients_prix'`
et `/admin_params/pricing` marqué `_deprecated: true`.

---

### FIX 1 — Helper format date français

**Créer** : `src/lib/dateHelpers.ts`

```typescript
import { Timestamp } from 'firebase/firestore';

type DateInput = Date | Timestamp | string | number | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  if (input && typeof input === 'object' && 'toDate' in input) {
    return (input as Timestamp).toDate();
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  return null;
}

/** Format "JJ-M-AAAA HHhMM" — ex: "29-4-2026 08h45" */
export function formatDateHeure(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  const jour = d.getDate();
  const mois = d.getMonth() + 1;
  const annee = d.getFullYear();
  const heures = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${jour}-${mois}-${annee} ${heures}h${minutes}`;
}

export function formatDateCourt(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  const mois = ['janvier','février','mars','avril','mai','juin',
                'juillet','août','septembre','octobre','novembre','décembre'];
  return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateRelatif(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const heures = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (heures < 24) return `il y a ${heures}h`;
  if (jours < 2) return 'hier';
  if (jours < 7) return `il y a ${jours} jours`;
  return formatDateCourt(input);
}
```

---

### FIX 2 — Remplacer "Invalid Date" sur /admin/taux

**Fichier** : `src/admin/pages/TauxRMB.tsx`

⚠️ **NOMS RÉELS À UTILISER** :
- Lecture date principale : `rates.derniere_maj_taux` (PAS `date_maj_taux`)
- Source MAJ : `rates.derniere_maj_source` (déjà exposée par `subscribeToRates`)

```tsx
import { formatDateHeure, formatDateRelatif } from '../../lib/dateHelpers';

// Remplacer TOUS les affichages bruts par :
{formatDateHeure(rates?.derniere_maj_taux)}

// Pour les KPI courts :
{formatDateRelatif(rates?.derniere_maj_taux)}
```

Le helper local `FR_DATE` actuel dans `TauxRMB.tsx` peut être SUPPRIMÉ.

---

### FIX 3 — Rubrique 5 : auto-fetch + suppression bouton manuel

**Fichier** : `src/admin/pages/TauxRMB.tsx`

1. Localiser bouton "🔄 Actualiser les 3 taux API" → SUPPRIMER (ou rendre optionnel/discret).
2. Ajouter `useEffect` qui appelle `fetchApiRates()` au mount :
```tsx
useEffect(() => {
  fetchApiRates().then((r) => {
    setApiRates(r);
    setApiRatesFetchedAt(new Date());
  });
}, []);
```
3. Stocker la date du dernier fetch en state local :
```tsx
const [apiRatesFetchedAt, setApiRatesFetchedAt] = useState<Date | null>(null);
```
4. Afficher "Actualisé il y a X min" via `formatDateRelatif(apiRatesFetchedAt)`.
5. Bouton 🔄 discret pour refresh manuel (optionnel).

⚠️ Cette date n'est PAS persistée en Firestore (state local uniquement).

---

### FIX 4 — Rubrique 3 : mode lecture/édition + popup VALIDER

**Fichier** : `src/admin/pages/TauxRMB.tsx`

**State** :
```tsx
const [modeEdition, setModeEdition] = useState(false);
const [tauxEnEdition, setTauxEnEdition] = useState({
  eur_usd: 0,
  eur_cny: 0,
  usd_cny: 0,
});
const [showConfirmPopup, setShowConfirmPopup] = useState(false);
```

**Logique** :
- MODE LECTURE par défaut → inputs `disabled={!modeEdition}`
- Bouton "✏️ Modifier les taux" → `setModeEdition(true)` + copie taux actuels dans `tauxEnEdition`
- Bouton "💾 VALIDER" → `setShowConfirmPopup(true)`
- Bouton "❌ Annuler" → `setModeEdition(false)`

**Popup confirmation** (utiliser un composant existant ou modal inline) :
```tsx
{showConfirmPopup && (
  <ConfirmDialog
    title="⚠️ Confirmer la modification des taux"
    message={
      `Cette modification sera visible IMMÉDIATEMENT sur tous les
       produits du catalogue (visiteur, client, partenaire).

       Les devis EXISTANTS ne seront PAS impactés.
       Les NOUVEAUX devis utiliseront ces nouveaux taux.

       Continuer ?`
    }
    onConfirm={async () => {
      // Mapping interface → Firestore (déjà géré par updateGlobalRates)
      await updateGlobalRates(
        {
          eur_usd: tauxEnEdition.eur_usd,
          eur_cny: tauxEnEdition.eur_cny,
          usd_cny: tauxEnEdition.usd_cny,
        },
        'admin-taux-page',
      );
      setModeEdition(false);
      setShowConfirmPopup(false);
      showToast('Taux mis à jour avec succès', 'success');
    }}
    onCancel={() => setShowConfirmPopup(false)}
  />
)}
```

⚠️ **CRITIQUE** : `updateGlobalRates` n'écrit QUE dans `/admin_params/global` (champs `taux_eur_usd`, `taux_rmb_eur`, `taux_usd_cny`, `derniere_maj_taux`, `derniere_maj_source`). AUCUN recalcul des produits (lazy compute).

Si aucun composant `ConfirmDialog` n'existe, créer une modal inline simple via state local + JSX.

---

### FIX 5 — KPI Header "Dernière MAJ"

**Fichier** : `src/admin/pages/TauxRMB.tsx`

Localiser le KPI "Dernière MAJ" en haut de page et utiliser :
```tsx
<Kpi
  label="Dernière MAJ taux"
  value={formatDateHeure(rates.derniere_maj_taux)}
  sub={`Source : ${rates.derniere_maj_source ?? '—'}`}
/>
```

---

### FEATURE 6 — Dogme 5 : Override manuel admin

**Schéma `/products/{ref}`** (nouveaux champs nullable) :
```typescript
prix_public_override     : number | null
prix_partenaire_override : number | null
```

**Fichier** : `src/admin/components/produit/OngletGestionPrix.tsx`

Ajouter section après la Rubrique 2 "Prix de vente calculés" :

```tsx
<section className="border-t pt-6 mt-6">
  <h3 className="text-lg font-semibold mb-4">
    🎯 Override manuel (optionnel)
  </h3>

  <p className="text-sm text-gray-600 mb-4">
    Active l'override pour FORCER un prix custom qui remplace
    le calcul automatique. Utile pour promotions ou prix spéciaux.
  </p>

  {/* Override Public */}
  <div className="mb-4">
    <label className="flex items-center gap-2 mb-2">
      <input
        type="checkbox"
        checked={overridePublicActif}
        onChange={(e) => setOverridePublicActif(e.target.checked)}
      />
      <span className="font-medium">Override prix PUBLIC</span>
    </label>

    {overridePublicActif && (
      <div className="ml-6">
        <input
          type="number"
          step="0.01"
          value={prixPublicOverride ?? ''}
          onChange={(e) => setPrixPublicOverride(parseFloat(e.target.value))}
          placeholder={`Calcul auto : ${prixPublicAuto.toFixed(2)} €`}
          className="border rounded px-3 py-2 w-48"
        />
        <span className="ml-2 text-sm text-gray-500">€</span>
      </div>
    )}
  </div>

  {/* Override Partenaire — même structure */}
  <div className="mb-4">
    <label className="flex items-center gap-2 mb-2">
      <input
        type="checkbox"
        checked={overridePartenaireActif}
        onChange={(e) => setOverridePartenaireActif(e.target.checked)}
      />
      <span className="font-medium">Override prix PARTENAIRE</span>
    </label>

    {overridePartenaireActif && (
      <div className="ml-6">
        <input
          type="number"
          step="0.01"
          value={prixPartenaireOverride ?? ''}
          onChange={(e) => setPrixPartenaireOverride(parseFloat(e.target.value))}
          placeholder={`Calcul auto : ${prixPartenaireAuto.toFixed(2)} €`}
          className="border rounded px-3 py-2 w-48"
        />
        <span className="ml-2 text-sm text-gray-500">€</span>
      </div>
    )}
  </div>

  <button
    onClick={handleSaveOverrides}
    className="bg-blue-600 text-white px-4 py-2 rounded"
  >
    💾 Enregistrer les overrides
  </button>
</section>
```

**Sauvegarde** :
```typescript
async function handleSaveOverrides() {
  const updates: any = {
    prix_public_override:
      overridePublicActif && prixPublicOverride > 0 ? prixPublicOverride : null,
    prix_partenaire_override:
      overridePartenaireActif && prixPartenaireOverride > 0
        ? prixPartenaireOverride
        : null,
  };

  await updateDoc(doc(db, 'products', productId), sanitizeForFirestore(updates));
  showToast('Overrides mis à jour', 'success');
}
```

**Adapter `usePricingEngine`** : ajouter prise en compte des overrides
```typescript
export interface PricingResult {
  prix_cny: number;
  prix_usd: number;
  prix_eur: number;
  prix_public: number;
  prix_partenaire: number;
  prix_public_auto: number;       // sans override
  prix_partenaire_auto: number;   // sans override
  override_public_actif: boolean;
  override_partenaire_actif: boolean;
}

export function usePricingEngine(
  prixCny: number,
  rates: Rates,
  multipliers: Multipliers,
  overrides: { public: number | null; partner: number | null } = { public: null, partner: null },
): PricingResult {
  return useMemo(() => {
    if (!prixCny || prixCny <= 0 || !rates.eur_cny) {
      return EMPTY;
    }
    const prix_eur = prixCny / rates.eur_cny;
    const prix_usd = prix_eur * rates.eur_usd;
    const prix_public_auto = prix_eur * multipliers.client;
    const prix_partenaire_auto = prix_eur * multipliers.partner;

    const prix_public = (overrides.public !== null && overrides.public > 0)
      ? overrides.public
      : prix_public_auto;
    const prix_partenaire = (overrides.partner !== null && overrides.partner > 0)
      ? overrides.partner
      : prix_partenaire_auto;

    return {
      prix_cny: round2(prixCny),
      prix_usd: round2(prix_usd),
      prix_eur: round2(prix_eur),
      prix_public: round2(prix_public),
      prix_partenaire: round2(prix_partenaire),
      prix_public_auto: round2(prix_public_auto),
      prix_partenaire_auto: round2(prix_partenaire_auto),
      override_public_actif: overrides.public !== null && overrides.public > 0,
      override_partenaire_actif: overrides.partner !== null && overrides.partner > 0,
    };
  }, [prixCny, rates, multipliers, overrides]);
}
```

**Adapter Rubrique 2 (Prix de vente)** : afficher icône 🎯 quand override actif
```tsx
{live.override_public_actif && (
  <span style={{ marginLeft: 6 }} title="Override manuel actif">🎯</span>
)}
```

Mettre à jour le call de `usePricingEngine(...)` dans OngletGestionPrix pour passer les overrides du produit :
```tsx
const live = usePricingEngine(
  editMode ? draftCny : (product.prix_achat_cny ?? 0),
  rates,
  { client: multipliers.client, partner: multipliers.partner },
  { public: product.prix_public_override ?? null, partner: product.prix_partenaire_override ?? null },
);
```

---

## 🧪 Tests post-build

1. ✅ `npm run build` passe sans erreur TypeScript.
2. ✅ `/admin/taux` → toutes les dates au format "29-4-2026 14h32" (plus aucun "Invalid Date").
3. ✅ Bouton "✏️ Modifier les taux" → bascule en mode édition (inputs débloqués).
4. ✅ "💾 VALIDER" → popup → confirme → écrit `/admin_params/global` avec champs `taux_eur_usd`, `taux_rmb_eur`, `taux_usd_cny`, `derniere_maj_taux`.
5. ✅ Vérifier en console Firestore que les bons champs sont mis à jour (PAS de `taux_cny_usd`, PAS de `date_maj_taux`).
6. ✅ Rubrique 5 : taux API affichés au mount, "Actualisé il y a X min".
7. ✅ `/admin/produits/MP-R22-001` → onglet 💰 GESTION DES PRIX → activer override public à `21500` → sauvegarder.
8. ✅ Front public : MP-R22-001 affiché à `21 500,00 €` (au lieu du calcul auto ~23 033 €).
9. ✅ Désactiver override → retour calcul auto.
10. ✅ Vérifier qu'aucun devis existant n'a changé de prix.

## 📝 Commits granulaires (1 par fix)

```bash
git commit -m "chore(migration): exec migrate-admin-params --apply"
git commit -m "feat(lib): add dateHelpers (formatDateHeure, formatDateRelatif)"
git commit -m "fix(admin/taux): use derniere_maj_taux + formatDateHeure"
git commit -m "fix(admin/taux): rubrique 5 auto-fetch + remove manual button"
git commit -m "feat(admin/taux): rubrique 3 mode lecture/edition + popup VALIDER"
git commit -m "fix(admin/taux): KPI header date format + source"
git commit -m "feat(admin/produit): Dogme 5 override manuel prix_public/partenaire"
git commit -m "feat(hooks): usePricingEngine support override params"
git push origin v2
```

## 📋 Rapport `MAJ-V44-FIX.txt` attendu

À écrire dans `~/97import-firebase/MAJ-V44-FIX.txt` :
- Migration admin_params : OK / KO
- Liste fichiers modifiés
- Hashes commits
- Tests effectués + résultats
- Anomalies rencontrées
- Statut final + URL Vercel preview

## 🚨 Règles permanentes

- ❌ NE PAS exécuter `migrate-product-prices.js` (lazy compute, non pertinent).
- ❌ NE PAS toucher aux champs legacy (`taux_majoration_user`, `taux_majoration_partner`, `prix_achat_eur` produits, etc.).
- ❌ NE PAS introduire les noms `taux_cny_usd` / `taux_usd_eur` (utiliser convention RÉELLE).
- ✅ Utiliser exclusivement : `taux_eur_usd`, `taux_rmb_eur`, `taux_usd_cny`, `derniere_maj_taux`, `derniere_maj_source`.
- ✅ Branche `v2` uniquement.
- ✅ Format date : "JJ-M-AAAA HHhMM".
- ✅ Lazy compute partout : aucun recalcul stocké dans les produits.
