import ExcelJS from 'exceljs';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { strVal, numVal, formatIdExcel, todayFr, InfosClient } from './excelTypes';
import { styleOrangeHeader, styleData, styleTotal } from './excelStyles';
import { insertLuxentHeader } from './luxentHeader';
import { buildLignesCtn } from './buildLignesCtn';
import { getTauxRmb } from './firestoreHelpers';

/**
 * Génère le document BD-INVOICE (facture commerciale)
 *
 * @param ctnId - ID du conteneur
 * @param clientNom - Nom du client pour filtrer les lignes
 * @param infosClient - Informations du client destinataire
 * @returns ArrayBuffer du fichier Excel généré
 */
export async function generateBdInvoice(
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

  // 3) Charger taux RMB
  const tauxRmb = await getTauxRmb();

  // 4) Créer workbook
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('BD-INVOICE');

  // Largeurs colonnes
  ws.getColumn(1).width = 6;   // N°
  ws.getColumn(2).width = 16;  // Réf
  ws.getColumn(3).width = 28;  // Nom EN
  ws.getColumn(4).width = 20;  // Marque
  ws.getColumn(5).width = 8;   // Qté
  ws.getColumn(6).width = 12;  // Prix unit
  ws.getColumn(7).width = 14;  // Total

  // 5) Titre (ligne 1)
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'BD-INVOICE — COMMERCIAL INVOICE';
  titleCell.font = { bold: true, size: 14, name: 'Arial', color: { argb: 'FFEA580C' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  // 6) En-tête LUXENT
  let row = insertLuxentHeader(ws, 2);

  // 7) Bloc client
  row++;
  ws.mergeCells(`A${row}:G${row}`);
  const clientHeaderCell = ws.getCell(`A${row}`);
  clientHeaderCell.value = 'CLIENT / CONSIGNEE';
  clientHeaderCell.font = { bold: true, size: 10, name: 'Arial' };
  clientHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
  clientHeaderCell.alignment = { horizontal: 'left', vertical: 'middle' };

  row++;
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = `${infosClient.prenom || ''} ${infosClient.nom}`.trim();
  ws.getCell(`A${row}`).font = { bold: true, size: 10, name: 'Arial' };

  row++;
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = strVal(infosClient.adresse);
  ws.getCell(`A${row}`).font = { size: 9, name: 'Arial' };

  row++;
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = `${strVal(infosClient.ville)} - ${strVal(infosClient.pays)}`;
  ws.getCell(`A${row}`).font = { size: 9, name: 'Arial' };

  row++;
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = `SIRET/TVA : ${strVal(infosClient.siret_tva)}`;
  ws.getCell(`A${row}`).font = { size: 9, name: 'Arial', italic: true, color: { argb: 'FF6B7280' } };

  // 8) Info conteneur
  row += 2;
  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = `Conteneur : ${formatIdExcel(ctn.numero || ctnId)}`;
  ws.getCell(`A${row}`).font = { bold: true, size: 10 };

  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = `Date : ${todayFr()}`;
  ws.getCell(`E${row}`).font = { bold: true, size: 10 };
  ws.getCell(`E${row}`).alignment = { horizontal: 'right' };

  // 9) En-têtes tableau (ligne suivante)
  row += 2;
  const headers = ['N°', 'Réf.', 'Product Name (EN)', 'Brand', 'Qty', 'Unit Price €', 'Total €'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    styleOrangeHeader(cell, h);
  });
  ws.getRow(row).height = 20;

  // 10) Lignes produits
  let totalEur = 0;
  row++;
  const dataStartRow = row;

  for (let idx = 0; idx < lignes.length; idx++) {
    const ligne = lignes[idx];
    const qte = numVal(ligne.qte);
    const prixUnit = numVal(ligne.prix_achat_eur);
    const total = qte * prixUnit;
    totalEur += total;

    const cells = [
      { val: idx + 1, center: true },
      { val: ligne.reference || '', center: false },
      { val: strVal(ligne.nom_en), center: false, placeholder: !ligne.nom_en },
      { val: strVal(ligne.marque), center: false, placeholder: !ligne.marque },
      { val: qte, center: true },
      { val: prixUnit.toFixed(2), center: true },
      { val: total.toFixed(2), center: true },
    ];

    cells.forEach((c, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = c.val;
      styleData(cell, c.center, c.placeholder);
    });
    ws.getRow(row).height = 18;
    row++;
  }

  // 11) Ligne TOTAL
  ws.mergeCells(`A${row}:F${row}`);
  const totalLabelCell = ws.getCell(`A${row}`);
  totalLabelCell.value = 'TOTAL';
  styleTotal(totalLabelCell);

  const totalValCell = ws.getCell(`G${row}`);
  totalValCell.value = `€ ${totalEur.toFixed(2)}`;
  styleTotal(totalValCell);
  ws.getRow(row).height = 22;

  // 12) Conversion CNY
  row++;
  const totalCny = totalEur * tauxRmb;
  ws.mergeCells(`A${row}:F${row}`);
  ws.getCell(`A${row}`).value = `Taux RMB : 1€ = ${tauxRmb.toFixed(2)}¥`;
  ws.getCell(`A${row}`).font = { italic: true, size: 8, color: { argb: 'FF6B7280' } };

  ws.getCell(`G${row}`).value = `≈ ¥${totalCny.toFixed(2)}`;
  ws.getCell(`G${row}`).font = { italic: true, size: 9, color: { argb: 'FF059669' } };
  ws.getCell(`G${row}`).alignment = { horizontal: 'center' };

  // 13) Notes légales
  row += 2;
  ws.mergeCells(`A${row}:G${row}`);
  const notesCell = ws.getCell(`A${row}`);
  notesCell.value = 'This invoice is for customs purposes only. Payment terms as per pro forma invoice.';
  notesCell.font = { italic: true, size: 8, color: { argb: 'FF6B7280' } };
  notesCell.alignment = { wrapText: true };
  ws.getRow(row).height = 24;

  // 14) Générer buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
