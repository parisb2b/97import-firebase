interface OrangeIndicatorProps {
  show: boolean;
}

export const OrangeIndicator = ({ show }: OrangeIndicatorProps) =>
  show ? (
    <span
      className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-1"
      title="Champ manquant"
    />
  ) : null;

// Champs requis pour le score de complétude produit
const REQUIRED = [
  'categorie',
  'prix_achat_cny',
  'nom_fr',
  'nom_zh',
  'nom_en',
  'description_fr',
  'code_hs',
  'poids_net_kg',
  'photos',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const scoreCompletude = (p: any): number => {
  const filled = REQUIRED.filter((k) => {
    const v = p[k];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '' && v !== 0;
  });
  return Math.round((filled.length / REQUIRED.length) * 100);
};
