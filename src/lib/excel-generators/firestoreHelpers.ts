import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LigneProduit, InfosClient } from './excelTypes';

// Lire le taux RMB depuis admin_params/taux_rmb
export async function getTauxRmb(): Promise<number> {
  try {
    const snap = await getDoc(doc(db, 'admin_params', 'taux_rmb'));
    if (snap.exists()) {
      const val = snap.data()?.valeur;
      if (typeof val === 'number' && val > 0) return val;
    }
  } catch {
    console.warn('getTauxRmb: échec lecture Firestore, fallback 7.82');
  }
  return 7.82; // Fallback si document absent
}

// Enrichir une ligne produit avec les données Firestore
export async function enrichirLigne(ligne: LigneProduit): Promise<LigneProduit> {
  if (!ligne.reference) return ligne;
  try {
    const snap = await getDoc(doc(db, 'products', ligne.reference));
    if (!snap.exists()) return ligne;
    const p = snap.data();
    // pick : garde la valeur de la ligne si non vide, sinon celle du produit
    const pick = <T>(a: T | undefined | null, b: T | undefined): T | undefined =>
      (a !== undefined && a !== null && a !== '') ? a : b;
    return {
      ...ligne,
      nom_zh:           pick(ligne.nom_zh,           p.nom_zh),
      nom_en:           pick(ligne.nom_en,           p.nom_en),
      marque:           pick(ligne.marque,           p.marque ?? p.fournisseur),
      ref_usine:        pick(ligne.ref_usine,        p.ref_usine ?? p.reference),
      matiere_zh:       pick(ligne.matiere_zh,       p.matiere_zh),
      matiere_en:       pick(ligne.matiere_en,       p.matiere_en),
      prix_achat_eur:   pick(ligne.prix_achat_eur,   p.prix_achat),
      ce_certification: pick(ligne.ce_certification, p.ce_certification ?? p.certification),
      code_hs:          pick(ligne.code_hs,          p.code_hs),
      ville_origine_cn: pick(ligne.ville_origine_cn, p.ville_origine_cn),
      usage_cn:         pick(ligne.usage_cn,         p.usage_cn),
      longueur_cm:      pick(ligne.longueur_cm,      p.longueur_cm ?? p.longueur),
      largeur_cm:       pick(ligne.largeur_cm,       p.largeur_cm  ?? p.largeur),
      hauteur_cm:       pick(ligne.hauteur_cm,       p.hauteur_cm  ?? p.hauteur),
      poids_net_kg:     pick(ligne.poids_net_kg,     p.poids_net_kg ?? p.poids_net ?? p.poids_kg),
      poids_brut_kg:    pick(ligne.poids_brut_kg,    p.poids_brut_kg ?? p.poids_brut),
    };
  } catch {
    console.warn('enrichirLigne: échec enrichissement', ligne.reference);
    return ligne;
  }
}

// Lire les infos client depuis un devis
export async function getInfosClientDevis(devisId: string): Promise<InfosClient | null> {
  try {
    const snap = await getDoc(doc(db, 'quotes', devisId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      nom:       d.client_nom       ?? d.nom_client       ?? '',
      prenom:    d.client_prenom    ?? d.prenom_client     ?? '',
      adresse:   d.client_adresse   ?? d.adresse_client   ?? '',
      ville:     d.client_ville     ?? d.ville_client      ?? '',
      pays:      d.client_pays      ?? d.pays_client       ?? 'France',
      siret_tva: d.client_siret     ?? d.siret            ?? '',
      email:     d.client_email     ?? d.email_client     ?? '',
      telephone: d.client_telephone ?? d.telephone_client ?? '',
    };
  } catch {
    console.warn('getInfosClientDevis: échec lecture devis', devisId);
    return null;
  }
}
