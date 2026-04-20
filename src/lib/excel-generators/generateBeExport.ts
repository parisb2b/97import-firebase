import ExcelJS from 'exceljs';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { strVal, numVal, formatIdExcel, todayFr } from './excelTypes';
import { styleOrangeHeader, styleData, styleTotal } from './excelStyles';
import { buildLignesCtn } from './buildLignesCtn';
import { getTauxRmb } from './firestoreHelpers';

/**
 * Génère le document BE-EXPORT (déclaration d'exportation douanière)
 *
 * @param ctnId - ID du conteneur
 * @param clientNom - Nom du client pour filtrer les lignes
 * @returns ArrayBuffer du fichier Excel généré
 */
export async function generateBeExport(
  ctnId: string,
  clientNom: string
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
  const ws = workbook.addWorksheet('BE-EXPORT');

  // Largeurs colonnes
  ws.getColumn(1).width = 6;   // N°
  ws.getColumn(2).width = 16;  // Réf
  ws.getColumn(3).width = 32;  // Nom ZH
  ws.getColumn(4).width = 18;  // Code HS
  ws.getColumn(5).width = 8;   // Qté
  ws.getColumn(6).width = 20;  // Usage CN
  ws.getColumn(7).width = 16;  // Ville origine
  ws.getColumn(8).width = 12;  // Prix unit ¥
  ws.getColumn(9).width = 14;  // Total ¥

  // 5) Titre (ligne 1)
  ws.mergeCells('A1:I1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'BE-EXPORT 出口报关单 — EXPORT DECLARATION — 97IMPORT.COM';
  titleCell.font = { bold: true, size: 12, name: 'Arial', color: { argb: 'FFEA580C' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  // 6) Info conteneur (ligne 2)
  ws.mergeCells('A2:E2');
  ws.getCell('A2').value = `Conteneur : ${formatIdExcel(ctn.numero || ctnId)}`;
  ws.getCell('A2').font = { bold: true, size: 10 };

  ws.mergeCells('F2:I2');
  ws.getCell('F2').value = `Date : ${todayFr()}`;
  ws.getCell('F2').font = { bold: true, size: 10 };
  ws.getCell('F2').alignment = { horizontal: 'right' };
  ws.getRow(2).height = 18;

  // 7) En-têtes tableau (ligne 4)
  const headers = [
    'N°',
    'Réf.',
    'Nom ZH 中文',
    'Code HS',
    'Qté',
    'Usage CN 用途',
    'Ville origine 产地',
    'Prix unit. ¥',
    'Total ¥'
  ];
  headers.forEach((h, i) => {
    const cell = ws.getCell(4, i + 1);
    styleOrangeHeader(cell, h);
  });
  ws.getRow(4).height = 20;

  // 8) Lignes produits
  let totalCny = 0;
  let row = 5;

  for (let idx = 0; idx < lignes.length; idx++) {
    const ligne = lignes[idx];
    const qte = numVal(ligne.qte);
    const prixUnitEur = numVal(ligne.prix_achat_eur);
    const prixUnitCny = prixUnitEur * tauxRmb;
    const total = qte * prixUnitCny;
    totalCny += total;

    const cells = [
      { val: idx + 1, center: true },
      { val: ligne.reference || '', center: false },
      { val: strVal(ligne.nom_zh), center: false, placeholder: !ligne.nom_zh },
      { val: strVal(ligne.code_hs), center: true, placeholder: !ligne.code_hs },
      { val: qte, center: true },
      { val: strVal(ligne.usage_cn), center: false, placeholder: !ligne.usage_cn },
      { val: strVal(ligne.ville_origine_cn), center: false, placeholder: !ligne.ville_origine_cn },
      { val: prixUnitCny.toFixed(2), center: true },
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

  // 9) Ligne TOTAL
  ws.mergeCells(`A${row}:H${row}`);
  const totalLabelCell = ws.getCell(`A${row}`);
  totalLabelCell.value = 'TOTAL 总计';
  styleTotal(totalLabelCell);

  const totalValCell = ws.getCell(`I${row}`);
  totalValCell.value = `¥ ${totalCny.toFixed(2)}`;
  styleTotal(totalValCell);
  ws.getRow(row).height = 22;

  // 10) Conversion EUR
  row++;
  const totalEur = totalCny / tauxRmb;
  ws.mergeCells(`A${row}:H${row}`);
  ws.getCell(`A${row}`).value = `Taux RMB : 1€ = ${tauxRmb.toFixed(2)}¥`;
  ws.getCell(`A${row}`).font = { italic: true, size: 8, color: { argb: 'FF6B7280' } };

  ws.getCell(`I${row}`).value = `≈ ${totalEur.toFixed(2)}€`;
  ws.getCell(`I${row}`).font = { italic: true, size: 9, color: { argb: 'FF059669' } };
  ws.getCell(`I${row}`).alignment = { horizontal: 'center' };

  // 11) Notes douanières
  row += 2;
  ws.mergeCells(`A${row}:I${row}`);
  const notesCell = ws.getCell(`A${row}`);
  notesCell.value = 'Documents requis : Code HS, Usage CN, Ville origine CN, Certificat CE (si applicable). À compléter avant export.';
  notesCell.font = { italic: true, size: 9, color: { argb: 'FFB45309' } };
  notesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9EB' } };
  notesCell.alignment = { wrapText: true };
  ws.getRow(row).height = 30;

  // 12) Générer buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
