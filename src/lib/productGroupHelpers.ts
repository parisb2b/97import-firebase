// src/lib/productGroupHelpers.ts
// Helpers pour le système d'options (regroupement + accessoires)

/**
 * Structure d'un dropdown d'options
 */
export interface OptionDropdown {
  label: string;           // "Chenilles"
  choices: OptionChoice[];
}

export interface OptionChoice {
  label: string;           // "Caoutchouc"
  ref: string;             // "MP-R22-001"
  description?: string;    // "Par défaut"
  condition?: {            // Choix conditionnel (ex: visible uniquement si autre dropdown = X)
    dropdown_label: string; // "Type de fixation"
    value: string;          // "Toit"
  };
}

/**
 * Structure options_config stockée dans Firestore
 */
export interface OptionsConfig {
  dropdowns: OptionDropdown[];
}

/**
 * Regroupe les produits par groupe_produit.
 * Retourne UN SEUL produit "parent" par groupe (celui qui a options_config).
 * Les produits sans groupe_produit sont renvoyés tels quels.
 */
export function regrouperProduitsParGroupe(products: any[]): any[] {
  const parents: any[] = [];
  const groupesDejaTraites = new Set<string>();

  for (const p of products) {
    const groupe = p.groupe_produit;

    if (!groupe) {
      // Produit sans groupe → garder tel quel
      parents.push(p);
      continue;
    }

    if (groupesDejaTraites.has(groupe)) continue;

    // Chercher le parent du groupe = celui qui a options_config
    const parentDuGroupe = products.find(
      pr => pr.groupe_produit === groupe && pr.options_config
    );

    if (parentDuGroupe) {
      parents.push(parentDuGroupe);
    } else {
      // Pas de parent explicite → prendre le premier du groupe
      const premier = products.find(pr => pr.groupe_produit === groupe);
      if (premier) parents.push(premier);
    }

    groupesDejaTraites.add(groupe);
  }

  return parents;
}

/**
 * Trouve la ref interne correspondant à une combinaison de choix dans les dropdowns.
 * Ex: {Chenilles: "Caoutchouc"} → "MP-R22-001"
 *
 * IMPORTANT : pour les dropdowns multiples, filtre d'abord les choix du dernier
 * dropdown selon leurs conditions, PUIS cherche par label.
 * Nécessaire quand plusieurs choix ont le même label avec conditions différentes
 * (ex: "2 chambres" × 3 tailles de maison).
 */
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
  // MAIS il faut d'abord filtrer ses choix selon les conditions (sinon plusieurs choix
  // peuvent avoir le même label avec des conditions différentes → find() retourne le mauvais)
  const lastDropdown = optionsConfig.dropdowns[optionsConfig.dropdowns.length - 1];
  const choixValides = filtrerChoixSelonConditions(lastDropdown.choices, selection);
  const lastChoice = choixValides.find(c => c.label === selection[lastDropdown.label]);
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

  const regex = new RegExp(`^ACC-[A-Z0-9]+-${groupeCode}(-|$)`, 'i');

  return allProducts.filter(p => {
    if (!p.reference) return false;
    if (p.actif === false) return false;
    return regex.test(p.reference);
  });
}

/**
 * Extrait le code "groupe" de la référence (ex: "R22" depuis "MP-R22-001").
 * Utilisé pour détecter les accessoires compatibles.
 */
export function extractGroupeCode(reference: string | undefined): string | null {
  if (!reference) return null;
  // Pattern : XX-YYY-ZZZ → on prend YYY
  const match = reference.match(/^[A-Z]+-([A-Z0-9]+)-/i);
  return match ? match[1] : null;
}

/**
 * Filtre les choix d'un dropdown selon les autres sélections en cours.
 * Ex: si le dropdown "Panneaux" a une condition {Type de fixation: "Toit"},
 * il ne s'affiche QUE si la sélection courante de "Type de fixation" est "Toit".
 */
export function filtrerChoixSelonConditions(
  choices: OptionChoice[],
  currentSelection: Record<string, string>
): OptionChoice[] {
  return choices.filter(c => {
    if (!c.condition) return true;
    return currentSelection[c.condition.dropdown_label] === c.condition.value;
  });
}

/**
 * Détermine si un dropdown doit être affiché selon la sélection en cours.
 * Un dropdown est masqué si TOUS ses choix ont une condition non satisfaite.
 */
export function dropdownEstVisible(
  dropdown: OptionDropdown,
  currentSelection: Record<string, string>
): boolean {
  const choixVisibles = filtrerChoixSelonConditions(dropdown.choices, currentSelection);
  return choixVisibles.length > 0;
}
