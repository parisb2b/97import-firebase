import ExcelJS from 'exceljs';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { strVal, numVal, formatIdExcel, todayFr, InfosClient } from './excelTypes';
import { styleOrangeHeader, styleData, styleTotal } from './excelStyles';
import { insertLuxentHeader } from './luxentHeader';
import { buildLignesCtn } from './buildLignesCtn';

/**
 * Génère le document BD-PACKINGLIST (liste de colisage)
 *
 * @param ctnId - ID du conteneur
 * @param clientNom - Nom du client pour filtrer les lignes
 * @param infosClient - Informations du client destinataire
 * @returns ArrayBuffer du fichier Excel généré
 */
export async function generateBdPackingList(
  ctnId: string,
  clientNom: string,
  infosClient: InfosClient
): Promise<ArrayBuffer> {
  // 1) Charger conteneur
  const ctnSnap = await getDoc(doc(db, 'conteneurs', ctnId));
  if (!ctnSnap.exists()) throw new Error('Conteneur introuvable');
  const ctn = ctnSnap.data();

  // 2) Charger lignes du client
  const lignesMap = await buildLignesCtn(ctnId, clientNom);
  const lignes = lignesMap.get(clientNom) || [];
  if (lignes.length === 0) {
    throw new Error(`Aucune ligne trouvée pour le client ${clientNom}`);
  }

  // 3) Créer workbook
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('BD-PACKINGLIST');

  // Largeurs colonnes
  ws.getColumn(1).width = 6;   // N°
  ws.getColumn(2).width = 16;  // Réf
  ws.getColumn(3).width = 28;  // Nom EN
  ws.getColumn(4).width = 8;   // Qté
  ws.getColumn(5).width = 10;  // L cm
  ws.getColumn(6).width = 10;  // l cm
  ws.getColumn(7).width = 10;  // h cm
  ws.getColumn(8).width = 10;  // Net kg
  ws.getColumn(9).width = 10;  // Brut kg

  // 4) Titre (ligne 1)
  ws.mergeCells('A1:I1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'BD-PACKINGLIST — PACKING LIST';
  titleCell.font = { bold: true, size: 14, name: 'Arial', color: { argb: 'FFEA580C' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  // 5) En-tête LUXENT
  let row = insertLuxentHeader(ws, 2);

  // 6) Bloc client
  row++;
  ws.mergeCells(`A${row}:I${row}`);
  const clientHeaderCell = ws.getCell(`A${row}`);
  clientHeaderCell.value = 'CLIENT / CONSIGNEE';
  clientHeaderCell.font = { bold: true, size: 10, name: 'Arial' };
  clientHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
  clientHeaderCell.alignment = { horizontal: 'left', vertical: 'middle' };

  row++;
  ws.mergeCells(`A${row}:I${row}`);
  ws.getCell(`A${row}`).value = `${infosClient.prenom || ''} ${infosClient.nom}`.trim();
  ws.getCell(`A${row}`).font = { bold: true, size: 10, name: 'Arial' };

  row++;
  ws.mergeCells(`A${row}:I${row}`);
  ws.getCell(`A${row}`).value = strVal(infosClient.adresse);
  ws.getCell(`A${row}`).font = { size: 9, name: 'Arial' };

  row++;
  ws.mergeCells(`A${row}:I${row}`);
  ws.getCell(`A${row}`).value = `${strVal(infosClient.ville)} - ${strVal(infosClient.pays)}`;
  ws.getCell(`A${row}`).font = { size: 9, name: 'Arial' };

  // 7) Info conteneur
  row += 2;
  ws.mergeCells(`A${row}:E${row}`);
  ws.getCell(`A${row}`).value = `Conteneur : ${formatIdExcel(ctn.numero || ctnId)}`;
  ws.getCell(`A${row}`).font = { bold: true, size: 10 };

  ws.mergeCells(`F${row}:I${row}`);
  ws.getCell(`F${row}`).value = `Date : ${todayFr()}`;
  ws.getCell(`F${row}`).font = { bold: true, size: 10 };
  ws.getCell(`F${row}`).alignment = { horizontal: 'right' };

  // 8) En-têtes tableau
  row += 2;
  const headers = ['N°', 'Réf.', 'Product Name (EN)', 'Qty', 'L (cm)', 'W (cm)', 'H (cm)', 'Net (kg)', 'Gross (kg)'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    styleOrangeHeader(cell, h);
  });
  ws.getRow(row).height = 20;

  // 9) Lignes produits
  let totalQte = 0;
  let totalNet = 0;
  let totalBrut = 0;
  row++;

  for (let idx = 0; idx < lignes.length; idx++) {
    const ligne = lignes[idx];
    const qte = numVal(ligne.qte);
    const poidsNet = numVal(ligne.poids_net_kg);
    const poidsBrut = numVal(ligne.poids_brut_kg);

    totalQte += qte;
    totalNet += poidsNet * qte;
    totalBrut += poidsBrut * qte;

    const cells = [
      { val: idx + 1, center: true },
      { val: ligne.reference || '', center: false },
      { val: strVal(ligne.nom_en), center: false, placeholder: !ligne.nom_en },
      { val: qte, center: true },
      { val: numVal(ligne.longueur_cm) || 'À compléter', center: true, placeholder: !ligne.longueur_cm },
      { val: numVal(ligne.largeur_cm) || 'À compléter', center: true, placeholder: !ligne.largeur_cm },
      { val: numVal(ligne.hauteur_cm) || 'À compléter', center: true, placeholder: !ligne.hauteur_cm },
      { val: poidsNet ? poidsNet.toFixed(2) : 'À compléter', center: true, placeholder: !poidsNet },
      { val: poidsBrut ? poidsBrut.toFixed(2) : 'À compléter', center: true, placeholder: !poidsBrut },
    ];

    cells.forEach((c, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = c.val;
      styleData(cell, c.center, c.placeholder);
    });
    ws.getRow(row).height = 18;
    row++;
  }

  // 10) Ligne TOTAL
  ws.mergeCells(`A${row}:C${row}`);
  const totalLabelCell = ws.getCell(`A${row}`);
  totalLabelCell.value = 'TOTAL';
  styleTotal(totalLabelCell);

  const totalQteCell = ws.getCell(`D${row}`);
  totalQteCell.value = totalQte;
  styleTotal(totalQteCell);

  // Colonnes dimensions vides pour total
  for (let col = 5; col <= 7; col++) {
    const cell = ws.getCell(row, col);
    cell.value = '—';
    styleTotal(cell);
  }

  const totalNetCell = ws.getCell(`H${row}`);
  totalNetCell.value = totalNet.toFixed(2);
  styleTotal(totalNetCell);

  const totalBrutCell = ws.getCell(`I${row}`);
  totalBrutCell.value = totalBrut.toFixed(2);
  styleTotal(totalBrutCell);

  ws.getRow(row).height = 22;

  // 11) Notes
  row += 2;
  ws.mergeCells(`A${row}:I${row}`);
  const notesCell = ws.getCell(`A${row}`);
  notesCell.value = 'All measurements are approximate. Actual weight may vary. Please verify dimensions upon receipt.';
  notesCell.font = { italic: true, size: 8, color: { argb: 'FF6B7280' } };
  notesCell.alignment = { wrapText: true };
  ws.getRow(row).height = 24;

  // 12) Générer buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
