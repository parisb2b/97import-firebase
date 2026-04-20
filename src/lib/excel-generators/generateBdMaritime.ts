import ExcelJS from 'exceljs';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { strVal, numVal, formatIdExcel, todayFr, InfosClient } from './excelTypes';
import { styleOrangeHeader, styleData, styleTotal } from './excelStyles';
import { insertLuxentHeader } from './luxentHeader';

/**
 * Génère le document BD-MARITIME (frais maritimes)
 *
 * @param ctnId - ID du conteneur
 * @param clientNom - Nom du client pour filtrer les lignes
 * @param infosClient - Informations du client destinataire
 * @returns ArrayBuffer du fichier Excel généré
 */
export async function generateBdMaritime(
  ctnId: string,
  clientNom: string,
  infosClient: InfosClient
): Promise<ArrayBuffer> {
  // 1) Charger conteneur
  const ctnSnap = await getDoc(doc(db, 'conteneurs', ctnId));
  if (!ctnSnap.exists()) throw new Error('Conteneur introuvable');
  const ctn = ctnSnap.data();

  // 2) Récupérer les frais maritimes depuis le conteneur
  const fraisMap = ctn.frais_maritimes || {};
  const fraisEntries = Object.entries(fraisMap);

  if (fraisEntries.length === 0) {
    throw new Error('Aucun frais maritime trouvé pour ce conteneur');
  }

  // 3) Créer workbook
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('BD-MARITIME');

  // Largeurs colonnes
  ws.getColumn(1).width = 6;   // N°
  ws.getColumn(2).width = 30;  // Libellé
  ws.getColumn(3).width = 40;  // Description
  ws.getColumn(4).width = 14;  // Montant €

  // 4) Titre (ligne 1)
  ws.mergeCells('A1:D1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'BD-MARITIME — MARITIME COSTS';
  titleCell.font = { bold: true, size: 14, name: 'Arial', color: { argb: 'FFEA580C' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  // 5) En-tête LUXENT
  let row = insertLuxentHeader(ws, 2);

  // 6) Bloc client
  row++;
  ws.mergeCells(`A${row}:D${row}`);
  const clientHeaderCell = ws.getCell(`A${row}`);
  clientHeaderCell.value = 'CLIENT / CONSIGNEE';
  clientHeaderCell.font = { bold: true, size: 10, name: 'Arial' };
  clientHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
  clientHeaderCell.alignment = { horizontal: 'left', vertical: 'middle' };

  row++;
  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = `${infosClient.prenom || ''} ${infosClient.nom}`.trim();
  ws.getCell(`A${row}`).font = { bold: true, size: 10, name: 'Arial' };

  row++;
  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = strVal(infosClient.adresse);
  ws.getCell(`A${row}`).font = { size: 9, name: 'Arial' };

  row++;
  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = `${strVal(infosClient.ville)} - ${strVal(infosClient.pays)}`;
  ws.getCell(`A${row}`).font = { size: 9, name: 'Arial' };

  // 7) Info conteneur
  row += 2;
  ws.mergeCells(`A${row}:B${row}`);
  ws.getCell(`A${row}`).value = `Conteneur : ${formatIdExcel(ctn.numero || ctnId)}`;
  ws.getCell(`A${row}`).font = { bold: true, size: 10 };

  ws.mergeCells(`C${row}:D${row}`);
  ws.getCell(`C${row}`).value = `Date : ${todayFr()}`;
  ws.getCell(`C${row}`).font = { bold: true, size: 10 };
  ws.getCell(`C${row}`).alignment = { horizontal: 'right' };

  // 8) En-têtes tableau
  row += 2;
  const headers = ['N°', 'Libellé', 'Description', 'Montant €'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    styleOrangeHeader(cell, h);
  });
  ws.getRow(row).height = 20;

  // 9) Lignes de frais
  let totalEur = 0;
  row++;

  fraisEntries.forEach(([libelle, montant], idx) => {
    const montantNum = numVal(montant);
    totalEur += montantNum;

    // Description des frais standards
    let description = '';
    const libelleLower = libelle.toLowerCase();
    if (libelleLower.includes('fret') || libelleLower.includes('freight')) {
      description = 'Ocean freight from China to destination port';
    } else if (libelleLower.includes('douane') || libelleLower.includes('customs')) {
      description = 'Customs clearance and documentation fees';
    } else if (libelleLower.includes('manutention') || libelleLower.includes('handling')) {
      description = 'Port handling and terminal charges';
    } else if (libelleLower.includes('assurance') || libelleLower.includes('insurance')) {
      description = 'Marine cargo insurance';
    } else {
      description = 'Miscellaneous maritime charges';
    }

    const cells = [
      { val: idx + 1, center: true },
      { val: libelle, center: false },
      { val: description, center: false },
      { val: montantNum.toFixed(2), center: true },
    ];

    cells.forEach((c, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = c.val;
      styleData(cell, c.center);
    });
    ws.getRow(row).height = 18;
    row++;
  });

  // 10) Ligne TOTAL
  ws.mergeCells(`A${row}:C${row}`);
  const totalLabelCell = ws.getCell(`A${row}`);
  totalLabelCell.value = 'TOTAL MARITIME COSTS';
  styleTotal(totalLabelCell);

  const totalValCell = ws.getCell(`D${row}`);
  totalValCell.value = `€ ${totalEur.toFixed(2)}`;
  styleTotal(totalValCell);
  ws.getRow(row).height = 22;

  // 11) Notes
  row += 2;
  ws.mergeCells(`A${row}:D${row}`);
  const notesCell = ws.getCell(`A${row}`);
  notesCell.value = 'Maritime costs are subject to change based on fuel surcharges and port fees. Final invoice will reflect actual charges.';
  notesCell.font = { italic: true, size: 8, color: { argb: 'FF6B7280' } };
  notesCell.alignment = { wrapText: true };
  ws.getRow(row).height = 30;

  // 12) Générer buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
