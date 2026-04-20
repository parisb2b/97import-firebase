// Types partagés pour les 5 générateurs Excel v35e

export interface InfosClient {
  nom: string;
  prenom?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  siret_tva?: string;
  email?: string;
  telephone?: string;
}

export interface LigneProduit {
  reference: string;
  nom_fr: string;
  nom_zh?: string;
  nom_en?: string;
  marque?: string;
  ref_usine?: string;
  matiere_zh?: string;
  matiere_en?: string;
  prix_achat_eur?: number;
  ce_certification?: string;
  code_hs?: string;
  ville_origine_cn?: string;
  usage_cn?: string;
  longueur_cm?: number;
  largeur_cm?: number;
  hauteur_cm?: number;
  poids_net_kg?: number;
  poids_brut_kg?: number;
  qte_colis?: number;
  qte_pieces?: number;
  num_devis?: string;
  nom_client?: string;
  num_conteneur?: string;
  date_devis?: string;
}

export interface InfosConteneur {
  id: string;
  numero: string;
  type?: string;
  destination?: string;
  port_chargement?: string;
  port_destination?: string;
  num_physique?: string;
  voyage_number?: string;
  bl_number?: string;
  seal_number?: string;
  carrier?: string;
  date_depart?: string;
  prix_fret_eur?: number;
  devis_lies?: string[];
}

// Formater ID Firestore pour affichage : CTN-2604001 → CTN-2604-001
export function formatIdExcel(id: string): string {
  if (!id) return '';
  const match = id.match(/^([A-Z]+)-(\d{4})(\d{3})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return id;
}

// Date aujourd'hui DD/MM/YYYY
export function todayFr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// Calculer volume m³ depuis cm
export function calcVolM3(l?: number, la?: number, h?: number): number | string {
  if (!l || !la || !h || l === 0 || la === 0 || h === 0) return '';
  return parseFloat(((l * la * h) / 1_000_000).toFixed(3));
}

// Valeur string avec fallback "À compléter"
export function strVal(v?: string | null): string {
  if (!v || v.trim() === '') return 'À compléter';
  return v.trim();
}

// Valeur numérique avec fallback 0
export function numVal(v?: number | null): number {
  if (v === undefined || v === null || isNaN(v)) return 0;
  return v;
}

// Télécharger un buffer Excel dans le navigateur
export function downloadExcel(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
