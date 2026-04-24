# DIAGNOSTIC — Bug dropdowns Maisons + Kits solaires
**Date** : jeu. 23 avr. 2026 12:25:25 CEST
**Contexte** : Les dropdowns fonctionnent pour les mini-pelles mais pas pour les maisons et kits solaires

---

## 1. STRUCTURE FIRESTORE

### Analyse comparative des options_config


═══ MP-R22-001 (MINI-PELLE, OK) ═══
  Nombre de dropdowns : 1

  ── Dropdown 1 : Chenilles (3 choix)
    1. "Chenilles caoutchouc" → ref="MP-R22-001"
    2. "Chenilles métalliques" → ref="MP-R22-002"
    3. "Double chenilles" → ref="MP-R22-003"

═══ MS-20-001 (MAISON, BUG) ═══
  Nombre de dropdowns : 2

  ── Dropdown 1 : Taille (3 choix)
    1. "20 pieds" → ref="MS-20-001"
    2. "30 pieds" → ref="MS-30-001"
    3. "40 pieds" → ref="MS-40-001"

  ── Dropdown 2 : Chambres (12 choix)
    1. "2 chambres (standard)" → ref="MS-20-001" [condition: Taille=20 pieds]
    2. "3 chambres" → ref="MS-20-OPT-1CH" [condition: Taille=20 pieds]
    3. "4 chambres" → ref="MS-20-OPT-2CH" [condition: Taille=20 pieds]
    4. "5 chambres" → ref="MS-20-OPT-3CH" [condition: Taille=20 pieds]
    5. "2 chambres (standard)" → ref="MS-30-001" [condition: Taille=30 pieds]
    6. "3 chambres" → ref="MS-30-OPT-1CH" [condition: Taille=30 pieds]
    7. "4 chambres" → ref="MS-30-OPT-2CH" [condition: Taille=30 pieds]
    8. "5 chambres" → ref="MS-30-OPT-3CH" [condition: Taille=30 pieds]
    9. "2 chambres (standard)" → ref="MS-40-001" [condition: Taille=40 pieds]
    10. "3 chambres" → ref="MS-40-OPT-1CH" [condition: Taille=40 pieds]
    11. "4 chambres" → ref="MS-40-OPT-2CH" [condition: Taille=40 pieds]
    12. "5 chambres" → ref="MS-40-OPT-3CH" [condition: Taille=40 pieds]

═══ KS-10K-001 (KIT SOLAIRE, BUG) ═══
  Nombre de dropdowns : 2

  ── Dropdown 1 : Type de fixation (2 choix)
    1. "Sur toit" → ref="(VIDE)"
    2. "Au sol" → ref="(VIDE)"

  ── Dropdown 2 : Taille panneaux (4 choix)
    1. "Petits panneaux" → ref="KS-10K-001" [condition: Type de fixation=Sur toit]
    2. "Grands panneaux" → ref="KS-10K-002" [condition: Type de fixation=Sur toit]
    3. "Petits panneaux" → ref="KS-10K-003" [condition: Type de fixation=Au sol]
    4. "Grands panneaux" → ref="KS-10K-004" [condition: Type de fixation=Au sol]

### Prix des variantes (devraient TOUS différer pour valider la logique)

- **MP-R22-001** : 11525 €
- **MP-R22-002** : N/A €
- **MP-R22-003** : N/A €
- **MS-20-001** : 2000 €
- **MS-30-001** : 3000 €
- **MS-40-001** : 4000 €
- **KS-10K-001** : 55552 €
- **KS-10K-002** : 0 €
- **KS-10K-003** : 66665 €
- **KS-10K-004** : 0 €

---

## 2. CODE FRONT

### Helper getRefFromSelection (extrait)

```typescript
export function getRefFromSelection(
  optionsConfig: OptionsConfig,
  selection: Record<string, string>  // {dropdownLabel: choiceLabel}
): string | null {
  // Pour un seul dropdown : simple lookup
  if (optionsConfig.dropdowns.length === 1) {
    const dd = optionsConfig.dropdowns[0];
    const choice = dd.choices.find(c => c.label === selection[dd.label]);
    return choice?.ref || null;
  }

  // Pour plusieurs dropdowns : la ref est dans le DERNIER dropdown (le plus spécifique)
  // car les dropdowns précédents filtrent les choix via "condition"
  const lastDropdown = optionsConfig.dropdowns[optionsConfig.dropdowns.length - 1];
  const lastChoice = lastDropdown.choices.find(c => c.label === selection[lastDropdown.label]);
  return lastChoice?.ref || null;
}

/**
 * Détecte les accessoires compatibles avec une ref de mini-pelle.
 * Logique : accessoire ACC-XXX-R22-YYY ou ACC-XXX-R22 → compatible "R22"
 *
 * @param allProducts Tous les produits (accessoires + autres)
 * @param groupeCode Le code du groupe (ex: "R22")
 */
export function getAccessoiresCompatibles(
  allProducts: any[],
  groupeCode: string
): any[] {
  if (!groupeCode) return [];
```

### ProductOptionSelector (extraits clés)

```typescript
  optionsConfig: OptionsConfig;
  onSelectionChange: (ref: string | null, selection: Record<string, string>) => void;
}

export default function ProductOptionSelector({ optionsConfig, onSelectionChange }: Props) {
  // Initialiser avec le premier choix de chaque dropdown (fiche parente)
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const dd of optionsConfig.dropdowns) {
      const firstChoice = dd.choices[0];
      if (firstChoice) initial[dd.label] = firstChoice.label;
    }
    return initial;
  });

  // Notifier la sélection initiale au parent au premier render
  useEffect(() => {
    const ref = getRefFromSelection(optionsConfig, selection);
    onSelectionChange(ref, selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dropdownsVisibles = useMemo(() => {
    return optionsConfig.dropdowns.filter(dd => dropdownEstVisible(dd, selection));
  }, [optionsConfig.dropdowns, selection]);

  function handleChoiceChange(dropdownLabel: string, choiceLabel: string) {
    const newSelection = { ...selection, [dropdownLabel]: choiceLabel };

    // Après changement, certains dropdowns peuvent devenir invisibles ou avoir des choix invalides
    // On s'assure que chaque dropdown a un choix valide
    for (const dd of optionsConfig.dropdowns) {
      const choixValides = filtrerChoixSelonConditions(dd.choices, newSelection);
      if (choixValides.length > 0 && !choixValides.find(c => c.label === newSelection[dd.label])) {
        newSelection[dd.label] = choixValides[0].label;
      }
    }

    setSelection(newSelection);

```

### Produit.tsx — Logique de sélection/chargement

```typescript
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          setUserRole(snap.data()?.role || 'user');
        } catch { setUserRole('user'); }
--
  useEffect(() => {
    if (!selectedRef || allProducts.length === 0) {
      setSelectedProduct(null);
      return;
    }
    const found = allProducts.find(p => p.reference === selectedRef);
    setSelectedProduct(found || null);
  }, [selectedRef, allProducts]);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', params.id));
        if (snap.exists()) {
          const p: any = { id: snap.id, ...snap.data() };
          setProduct(p);
--

  const displayedProduct = selectedProduct || product;

  const pName = (p: any) => {
    const raw = lang === 'zh' ? (p.nom_zh || p.nom_fr) : lang === 'en' ? (p.nom_en || p.nom_fr) : p.nom_fr;
    return (raw || p.nom || p.numero_interne || '').replace(/\s*--\s*/g, ' — ');
  };
  const pDesc = (p: any) =>
    lang === 'zh' ? (p.description_zh || p.description_fr) : lang === 'en' ? (p.description_en || p.description_fr) : p.description_fr;
  const pMat = (p: any) =>
    lang === 'zh' ? (p.matiere_zh || p.matiere_fr) : lang === 'en' ? (p.matiere_en || p.matiere_fr) : p.matiere_fr;

--
  const handleAddToCart = () => {
    const refFinale = selectedRef || product.reference || product.id;
    const produitAAjouter = displayedProduct || product;

    const saved = localStorage.getItem('cart');
    const cart = saved ? JSON.parse(saved) : [];
    const existing = cart.find((c: any) => c.id === produitAAjouter.id);
    if (existing) {
      existing.qte += 1;
    } else {
      cart.push({
        id: produitAAjouter.id,
        ref: refFinale,
--

  // Specs for badges (top 4) - Use displayedProduct for specs
  const badges = [
    displayedProduct.moteur && { icon: '⚙️', label: displayedProduct.moteur, sub: t('product.moteur') },
    displayedProduct.puissance_kw && { icon: '⚡', label: `${displayedProduct.puissance_kw} kW`, sub: t('product.puissance') },
    displayedProduct.poids_net_kg && { icon: '⚖️', label: `${displayedProduct.poids_net_kg} kg`, sub: t('product.poids') },
    displayedProduct.longueur_cm && displayedProduct.largeur_cm && { icon: '📐', label: `${displayedProduct.longueur_cm}×${displayedProduct.largeur_cm} cm`, sub: 'Dimensions' },
  ].filter(Boolean) as { icon: string; label: string; sub: string }[];

  // Full specs table - Use displayedProduct for specs
  const specsTable = [
    { k: t('product.poids'), v: displayedProduct.poids_net_kg ? `${displayedProduct.poids_net_kg} kg` : null },
    { k: t('product.moteur'), v: displayedProduct.moteur },
    { k: t('product.puissance'), v: displayedProduct.puissance_kw ? `${displayedProduct.puissance_kw} kW` : null },
    { k: t('product.longueur'), v: displayedProduct.longueur_cm ? `${displayedProduct.longueur_cm} cm` : null },
    { k: t('product.largeur'), v: displayedProduct.largeur_cm ? `${displayedProduct.largeur_cm} cm` : null },
    { k: t('product.hauteur'), v: displayedProduct.hauteur_cm ? `${displayedProduct.hauteur_cm} cm` : null },
    { k: t('product.marque'), v: displayedProduct.marque },
    { k: t('product.matiere'), v: pMat(displayedProduct) },
    { k: t('product.codeHs'), v: displayedProduct.code_hs },
```

---

## 3. HYPOTHÈSES

### Hypothèse 1 : Dropdowns multiples mal gérés

Pour les mini-pelles : UN SEUL dropdown "Chenilles" avec refs directes. Facile.

Pour les kits solaires : DEUX dropdowns (Type de fixation + Taille panneaux). Le PREMIER dropdown ("Type de fixation") a des choix avec **ref vide** ('') car c'est un dropdown de transition. La ref finale vient du DEUXIÈME dropdown ("Taille panneaux").

Pour les maisons : DEUX dropdowns (Taille + Chambres). Le PREMIER pourrait avoir des refs, mais c'est le DEUXIÈME qui contient les refs finales.

**Question** : \`getRefFromSelection()\` prend-il la ref du DERNIER dropdown quand plusieurs dropdowns sont présents ?

### Hypothèse 2 : Ordre de chargement asynchrone

Si \`allProducts\` n'est pas encore chargé au moment où \`setSelectedRef\` est appelé, \`selectedProduct\` reste null et on reste sur le parent.

### Hypothèse 3 : Le champ prix lu vient du parent

Si dans le JSX, certains prix lisent \`product.prix_achat\` au lieu de \`displayedProduct.prix_achat\`.

---

## 4. DIAGNOSTIC FINAL ATTENDU

Compléter ce tableau :

| Point de contrôle | Mini-pelles | Maisons | Kits solaires |
|-------------------|-------------|---------|---------------|
| options_config présent ? | ✅ | ✅ | ✅ |
| Nombre de dropdowns | 1 | 2 | 2 |
| Refs dans 1er dropdown | OUI | OUI | VIDE (transition) |
| Refs dans 2e dropdown | N/A | OUI | OUI |
| Labels dupliqués avec conditions ? | NON | **OUI** ⚠️ | **OUI** ⚠️ |
| getRefFromSelection() retourne la bonne ref ? | ✅ | ❌ | ❌ |
| Produit.tsx charge selectedProduct ? | ✅ | ✅ | ✅ |
| Prix affiché = prix variante ? | ✅ | ❌ | ❌ |

---

## 5. RECOMMANDATION

(À compléter après exécution du diagnostic complet)


---

## 6. DIAGNOSTIC FINAL (Claude Code)

### 🔴 CAUSE EXACTE IDENTIFIÉE

Le bug se trouve dans la fonction `getRefFromSelection()` du fichier `src/lib/productGroupHelpers.ts` (lignes 72-88).

**Problème** : Pour les dropdowns multiples, la fonction cherche le choix dans le dernier dropdown en utilisant uniquement le label :

```typescript
const lastChoice = lastDropdown.choices.find(c => c.label === selection[lastDropdown.label]);
return lastChoice?.ref || null;
```

**Pourquoi ça casse** :
1. Pour les **Maisons** : le dropdown "Chambres" contient 12 choix, dont 3 ont le MÊME label "2 chambres (standard)" avec des conditions différentes :
   - `{label: "2 chambres (standard)", ref: "MS-20-001", condition: {Taille: "20 pieds"}}`
   - `{label: "2 chambres (standard)", ref: "MS-30-001", condition: {Taille: "30 pieds"}}`
   - `{label: "2 chambres (standard)", ref: "MS-40-001", condition: {Taille: "40 pieds"}}`

2. La méthode `find()` retourne **toujours le premier** choix qui correspond au label, ignorant les conditions.

3. Résultat : peu importe la Taille sélectionnée (20/30/40 pieds), la fonction retourne toujours la même ref (probablement MS-20-001), donc le prix ne change jamais.

**Même problème pour les Kits solaires** :
- "Petits panneaux" apparaît 2 fois avec conditions différentes (Sur toit / Au sol)
- "Grands panneaux" apparaît 2 fois avec conditions différentes

### ✅ SOLUTION

Modifier `getRefFromSelection()` pour **filtrer d'abord les choix selon leurs conditions** avant de chercher par label.

### 📝 FICHIERS À MODIFIER

**Fichier 1** : `src/lib/productGroupHelpers.ts`

**Ligne 72-88** : Remplacer la logique actuelle par :

```typescript
export function getRefFromSelection(
  optionsConfig: OptionsConfig,
  selection: Record<string, string>
): string | null {
  // Pour un seul dropdown : simple lookup
  if (optionsConfig.dropdowns.length === 1) {
    const dd = optionsConfig.dropdowns[0];
    const choice = dd.choices.find(c => c.label === selection[dd.label]);
    return choice?.ref || null;
  }

  // Pour plusieurs dropdowns : filtrer les choix du dernier dropdown selon les conditions
  const lastDropdown = optionsConfig.dropdowns[optionsConfig.dropdowns.length - 1];
  
  // CHANGEMENT : filtrer d'abord par condition, PUIS chercher par label
  const choixValides = filtrerChoixSelonConditions(lastDropdown.choices, selection);
  const lastChoice = choixValides.find(c => c.label === selection[lastDropdown.label]);
  
  return lastChoice?.ref || null;
}
```

**Note** : La fonction `filtrerChoixSelonConditions()` existe déjà dans le même fichier (ligne 128-136) et fait exactement ce qu'il faut : elle garde uniquement les choix dont la condition est satisfaite par la sélection courante.

### 🧪 STRATÉGIE DE TEST APRÈS FIX

1. **Test Maisons Standard (MS)** :
   - Ouvrir `/produit/MS-20-001`
   - Vérifier que le prix initial = 2000 €
   - Sélectionner "Taille: 30 pieds"
   - **Vérifier** : prix change à 3000 € (MS-30-001)
   - Sélectionner "Taille: 40 pieds"
   - **Vérifier** : prix change à 4000 € (MS-40-001)
   - Sélectionner "Taille: 20 pieds" puis "Chambres: 3 chambres"
   - **Vérifier** : ref devient MS-20-OPT-1CH (si elle a un prix défini, vérifier le changement)

2. **Test Kits Solaires (KS)** :
   - Ouvrir `/produit/KS-10K-001`
   - Vérifier que le prix initial = 55552 €
   - Sélectionner "Type de fixation: Au sol" puis "Taille panneaux: Petits panneaux"
   - **Vérifier** : ref devient KS-10K-003, prix = 66665 €
   - Sélectionner "Grands panneaux"
   - **Vérifier** : ref devient KS-10K-004

3. **Test de non-régression Mini-pelles (MP)** :
   - Ouvrir `/produit/MP-R22-001`
   - Vérifier que le système fonctionne toujours (1 seul dropdown, pas impacté par le fix)

### 📊 COMPARAISON AVANT/APRÈS

| Scénario | Avant (bug) | Après (fix) |
|----------|-------------|-------------|
| Sélection MS "30 pieds" | Prix reste 2000 € (MS-20-001) | Prix change à 3000 € (MS-30-001) ✅ |
| Sélection MS "40 pieds" | Prix reste 2000 € (MS-20-001) | Prix change à 4000 € (MS-40-001) ✅ |
| Sélection KS "Au sol + Petits" | Prix reste 55552 € (KS-10K-001) | Prix change à 66665 € (KS-10K-003) ✅ |
| Mini-pelles R22 | ✅ Fonctionne | ✅ Continue de fonctionner |

### ⚠️ POINTS D'ATTENTION

1. **Ordre des dropdowns** : Le fix suppose que les conditions se réfèrent toujours aux dropdowns **précédents**. Si jamais un choix a une condition référençant un dropdown **suivant**, ça ne marcherait pas (mais ce cas n'existe pas dans la config actuelle).

2. **Performance** : `filtrerChoixSelonConditions()` est déjà appelé dans `ProductOptionSelector.tsx` pour l'affichage. L'appeler aussi dans `getRefFromSelection()` n'ajoute pas de coût significatif car les données sont petites (max 12 choix).

3. **Validation** : Après le fix, ajouter un test unitaire pour `getRefFromSelection()` avec des choix conditionnels dupliqués serait idéal.

---

## 7. CONCLUSION

**Root cause** : `getRefFromSelection()` ne filtre pas les choix conditionnels avant de chercher par label, ce qui retourne toujours le premier choix avec ce label (ignorant les conditions).

**Impact** : Mini-pelles (1 dropdown, pas de conditions) fonctionnent. Maisons et Kits (2 dropdowns, conditions multiples, labels dupliqués) sont cassés.

**Fix** : 1 ligne à changer dans `productGroupHelpers.ts` pour utiliser `filtrerChoixSelonConditions()` avant le `find()`.

**Complexité** : Faible (helper déjà existant, logique claire).

**Risque** : Très faible (ne touche qu'à la logique de résolution de ref, pas au rendering).

