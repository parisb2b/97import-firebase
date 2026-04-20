import ExcelJS from 'exceljs';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { strVal, numVal, formatIdExcel, todayFr } from './excelTypes';
import { styleNavyHeader, styleData, styleTotal } from './excelStyles';

export async function generateBcChine(laId: string, tauxRmb: number): Promise<ArrayBuffer> {
  // Charger LA
  const laSnap = await getDoc(doc(db, 'listes_achat', laId));
  if (!laSnap.exists()) throw new Error('Liste d\'achat introuvable');
  const la = laSnap.data();

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('BC-CHINE');

  // Largeurs colonnes
  ws.getColumn(1).width = 6;   // N°
  ws.getColumn(2).width = 16;  // Réf
  ws.getColumn(3).width = 28;  // Nom FR
  ws.getColumn(4).width = 28;  // Nom ZH
  ws.getColumn(5).width = 8;   // Qté
  ws.getColumn(6).width = 20;  // Fournisseur
  ws.getColumn(7).width = 12;  // Prix unit
  ws.getColumn(8).width = 14;  // Total

  // Titre (ligne 1)
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'BC-CHINE 中国采购单 — BON DE COMMANDE CHINE — 97IMPORT.COM';
  titleCell.font = { bold: true, size: 12, name: 'Arial', color: { argb: 'FF1E3A5F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  // Info LA (ligne 2)
  ws.mergeCells('A2:D2');
  ws.getCell('A2').value = `Liste : ${formatIdExcel(la.numero || laId)}`;
  ws.getCell('A2').font = { bold: true, size: 10 };

  ws.mergeCells('E2:H2');
  ws.getCell('E2').value = `Date : ${todayFr()}`;
  ws.getCell('E2').font = { bold: true, size: 10 };
  ws.getCell('E2').alignment = { horizontal: 'right' };
  ws.getRow(2).height = 18;

  // En-têtes (ligne 4)
  const headers = ['N°', 'Réf.', 'Nom FR', 'Nom ZH 中文', 'Qté', 'Fournisseur', 'Prix unit. ¥', 'Total ¥'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(4, i + 1);
    styleNavyHeader(cell, h);
  });
  ws.getRow(4).height = 20;

  // Lignes de produits
  const lignes = (la.lignes || []);
  let totalCny = 0;

  for (let idx = 0; idx < lignes.length; idx++) {
    const ligne = lignes[idx];
    const rowNum = 5 + idx;

    // Enrichir avec données produit si possible
    let nomZh = ligne.nom_zh || '';
    let fournisseur = ligne.fournisseur || '';
    let prixUnit = numVal(ligne.prix_achat_unitaire);

    try {
      const prodSnap = await getDoc(doc(db, 'products', ligne.ref));
      if (prodSnap.exists()) {
        const prod = prodSnap.data();
        nomZh = nomZh || prod.nom_zh || '';
        fournisseur = fournisseur || prod.fournisseur || '';
        prixUnit = prixUnit || numVal(prod.prix_achat);
      }
    } catch (e) {
      // Ignorer erreurs
    }

    const qte = numVal(ligne.qte);
    const total = qte * prixUnit;
    totalCny += total;

    // Cellules
    const cells = [
      { val: idx + 1, center: true },
      { val: ligne.ref || '', center: false },
      { val: ligne.nom_fr || '', center: false },
      { val: strVal(nomZh), center: false, placeholder: !nomZh },
      { val: qte, center: true },
      { val: strVal(fournisseur), center: false, placeholder: !fournisseur },
      { val: prixUnit.toFixed(2), center: true },
      { val: total.toFixed(2), center: true },
    ];

    cells.forEach((c, i) => {
      const cell = ws.getCell(rowNum, i + 1);
      cell.value = c.val;
      styleData(cell, c.center, c.placeholder);
    });
    ws.getRow(rowNum).height = 18;
  }

  // Ligne TOTAL
  const totalRow = 5 + lignes.length;
  ws.mergeCells(`A${totalRow}:G${totalRow}`);
  const totalLabelCell = ws.getCell(`A${totalRow}`);
  totalLabelCell.value = 'TOTAL 总计';
  styleTotal(totalLabelCell);

  const totalValCell = ws.getCell(`H${totalRow}`);
  totalValCell.value = `¥ ${totalCny.toFixed(2)}`;
  styleTotal(totalValCell);
  ws.getRow(totalRow).height = 22;

  // Conversion EUR (ligne suivante)
  const convRow = totalRow + 1;
  ws.mergeCells(`A${convRow}:G${convRow}`);
  ws.getCell(`A${convRow}`).value = `Taux RMB : 1€ = ${tauxRmb.toFixed(2)}¥`;
  ws.getCell(`A${convRow}`).font = { italic: true, size: 8, color: { argb: 'FF6B7280' } };

  const totalEur = totalCny / tauxRmb;
  ws.getCell(`H${convRow}`).value = `≈ ${totalEur.toFixed(2)}€`;
  ws.getCell(`H${convRow}`).font = { italic: true, size: 9, color: { argb: 'FF059669' } };
  ws.getCell(`H${convRow}`).alignment = { horizontal: 'center' };

  // Notes (si présentes)
  if (la.notes && la.notes.trim()) {
    const notesRow = convRow + 2;
    ws.mergeCells(`A${notesRow}:H${notesRow}`);
    const notesCell = ws.getCell(`A${notesRow}`);
    notesCell.value = `Notes : ${la.notes}`;
    notesCell.font = { italic: true, size: 9 };
    notesCell.alignment = { wrapText: true };
    ws.getRow(notesRow).height = 30;
  }

  // Générer buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
