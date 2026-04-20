import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LigneProduit, numVal } from './excelTypes';
import { enrichirLigne } from './firestoreHelpers';

/**
 * Agrège toutes les lignes de produits d'un conteneur, regroupées par client
 *
 * @param ctnId - ID du conteneur
 * @param clientNom - (optionnel) si fourni, ne retourne que les lignes de ce client
 * @returns Map<clientNom, LigneProduit[]>
 */
export async function buildLignesCtn(
  ctnId: string,
  clientNom?: string
): Promise<Map<string, LigneProduit[]>> {
  const result = new Map<string, LigneProduit[]>();

  try {
    // 1) Charger le conteneur
    const ctnSnap = await getDoc(doc(db, 'conteneurs', ctnId));
    if (!ctnSnap.exists()) {
      throw new Error('Conteneur introuvable');
    }
    const ctn = ctnSnap.data();

    // 2) Parcourir toutes les listes d'achat liées
    const listesLiees = ctn.devis_lies || [];
    if (listesLiees.length === 0) {
      return result;
    }

    // 3) Pour chaque LA, charger les lignes
    for (const laId of listesLiees) {
      const laSnap = await getDoc(doc(db, 'listes_achat', laId));
      if (!laSnap.exists()) continue;

      const la = laSnap.data();
      const lignes = la.lignes || [];

      // 4) Filtrer les lignes assignées à ce conteneur
      for (const ligne of lignes) {
        if (ligne.conteneur_assigne !== ctnId) continue;

        const client = ligne.client_nom || 'Sans client';

        // Si un client spécifique est demandé, filtrer
        if (clientNom && client !== clientNom) continue;

        // 5) Enrichir la ligne avec les données Firestore
        const ligneEnrichie = await enrichirLigne({
          reference: ligne.ref || '',
          nom_fr: ligne.nom_fr || '',
          nom_zh: ligne.nom_zh || '',
          nom_en: ligne.nom_en || '',
          qte: numVal(ligne.qte),
          marque: ligne.fournisseur || '',
          ref_usine: ligne.ref || '',
          matiere_zh: '',
          matiere_en: '',
          prix_achat_eur: numVal(ligne.prix_achat_unitaire),
          ce_certification: '',
          code_hs: '',
          ville_origine_cn: '',
          usage_cn: '',
          longueur_cm: 0,
          largeur_cm: 0,
          hauteur_cm: 0,
          poids_net_kg: 0,
          poids_brut_kg: 0,
        });

        // 6) Ajouter au résultat groupé par client
        if (!result.has(client)) {
          result.set(client, []);
        }
        result.get(client)!.push(ligneEnrichie);
      }
    }
  } catch (err: any) {
    console.error('Erreur buildLignesCtn:', err);
    throw new Error(`Impossible de charger les lignes du conteneur: ${err.message}`);
  }

  return result;
}
