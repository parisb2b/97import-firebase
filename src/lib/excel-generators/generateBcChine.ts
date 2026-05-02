import ExcelJS from 'exceljs';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  LigneProduit, formatIdExcel, todayFr, calcVolM3, strVal, numVal, downloadExcel
} from './excelTypes';
import { styleNavyHeader, styleData, styleTotal, styleWarning, NAVY } from './excelStyles';

// ── Constantes depuis le template BC-CHINE-中国采购单.xlsx ────────────────────

const BC_HEADERS: string[] = [
  '号码\nN°',
  '快递单号\nN° Colis envoi',
  '内部型号\nN° Interne',
  '法语品名\nNom Produit FR',
  '中文品名\nNom Produit ZH',
  '件数\nQté Colis',
  '数量\nQté Pièces Total',
  '长 Longueur\n(cm)',
  '宽 Largeur\n(cm)',
  '高 Hauteur\n(cm)',
  '体积\nVolume (m³)',
  '净重\nPoids Net (kg)',
  '毛重\nPoids Brut (kg)',
  '英语品名\nNom Produit EN',
  '品牌\nMarque',
  '厂家款号\nRéf. Usine',
  '中文材质\nMatière ZH',
  '英语材质\nMatière EN',
  '单价\nPrix Achat (¥)',
  'CE / PDF\nCertification',
  '报价单日期\nDate Devis',
  '报价单号\nN° Devis',
  '客户\nClient',
  '集装箱号\nN° Conteneur'
];

const BC_COL_WIDTHS: number[] = [
  6, 14, 16, 28, 26, 8, 8, 10, 10, 10, 12, 10, 10, 28, 12, 16, 18, 18, 14, 14, 12, 14, 20, 16
];

const BC_ROW_HEIGHTS: Record<number, number> = {
  1: 28,
  2: 16,
  3: 18,
  4: 36
};

// ── Helpers locaux ───────────────────────────────────────────────────────────

async function getTauxRmb(): Promise<number> {
  try {
    const snap = await getDoc(doc(db, 'admin_params', 'taux_rmb'));
    if (snap.exists()) {
      const val = snap.data()?.valeur;
      if (typeof val === 'number' && val > 0) return val;
    }
  } catch {
    console.warn('getTauxRmb: échec lecture Firestore, fallback 7.82');
  }
  return 7.82;
}

async function enrichirLigne(ligne: LigneProduit): Promise<LigneProduit> {
  if (!ligne.reference) return ligne;
  try {
    const snap = await getDoc(doc(db, 'products', ligne.reference));
    if (!snap.exists()) return ligne;
    const p = snap.data();
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

// ── Générateur principal ─────────────────────────────────────────────────────

export async function generateBcChine(laId: string): Promise<void> {
  // 1. Charger la liste d'achat
  const laSnap = await getDoc(doc(db, 'listes_achat', laId));
  if (!laSnap.exists()) throw new Error(`Liste d'achat ${laId} introuvable`);
  const la = laSnap.data();
  const lignesRaw: LigneProduit[] = (la.lignes || []).map(
    (l: any) => ({
      reference: l.ref || '',
      nom_fr: l.nom_fr || '',
      nom_zh: l.nom_zh || '',
      nom_en: l.nom_en || '',
      qte: l.qte || 1,
      qte_colis: l.qte_colis || 1,
      qte_pieces: l.qte_pieces || 1,
      marque: l.marque || l.fournisseur || '',
      ref_usine: l.ref_usine || l.ref || '',
      matiere_zh: l.matiere_zh || '',
      matiere_en: l.matiere_en || '',
      prix_achat_eur: l.prix_achat_unitaire || l.prix_achat_eur || 0,
      ce_certification: l.ce_certification || '',
      longueur_cm: l.longueur_cm || 0,
      largeur_cm: l.largeur_cm || 0,
      hauteur_cm: l.hauteur_cm || 0,
      poids_net_kg: l.poids_net_kg || 0,
      poids_brut_kg: l.poids_brut_kg || 0,
      date_devis: l.date_devis || '',
      num_devis: l.devis_id || l.num_devis || '',
      nom_client: l.client_nom || l.nom_client || '',
      num_conteneur: l.conteneur_assigne || l.num_conteneur || ''
    } as LigneProduit)
  );

  // 2. Enrichir chaque ligne depuis products/
  const taux = await getTauxRmb();
  const lignes = await Promise.all(lignesRaw.map(enrichirLigne));

  // 3. Calculs totaux
  const totalColis = lignes.reduce((s, l) => s + (numVal(l.qte_colis) || 1), 0);
  const totalPieces = lignes.reduce((s, l) => s + (numVal(l.qte_pieces) || 1), 0);
  const totalVolume = lignes.reduce((s, l) => {
    const vol = calcVolM3(l.longueur_cm, l.largeur_cm, l.hauteur_cm);
    return s + (typeof vol === 'number' ? vol : 0);
  }, 0);
  const totalPNet = lignes.reduce((s, l) => s + numVal(l.poids_net_kg), 0);
  const totalPBrut = lignes.reduce((s, l) => s + numVal(l.poids_brut_kg), 0);

  // 4. Créer le workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = '97import.com';
  wb.created = new Date();
  const ws = wb.addWorksheet('BC CHINE 中国采购单');

  // 5. Largeurs colonnes
  BC_COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // 6. Hauteurs lignes
  Object.entries(BC_ROW_HEIGHTS).forEach(([r, h]) => {
    ws.getRow(Number(r)).height = h;
  });

  // 7. Ligne 1 — Titre principal fusionné A1:X1
  ws.mergeCells('A1:X1');
  const titreCell = ws.getCell('A1');
  titreCell.value = `BC CHINE  中国采购单  —  LISTE D'ACHAT ${formatIdExcel(la.numero || laId)}  —  97IMPORT.COM`;
  titreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  titreCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 12 };
  titreCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 8. Ligne 2 — Métadonnées A2:P2 + Note Q2:X2
  const ctnId = la.conteneur_id || la.num_conteneur || '';
  ws.mergeCells('A2:P2');
  ws.getCell('A2').value = `Généré le : ${todayFr()}   |   Conteneur : ${formatIdExcel(ctnId)}   |   Destination : ${la.destination || ''}`;
  ws.getCell('A2').font = { italic: true, name: 'Arial', size: 9, color: { argb: 'FF555555' } };
  ws.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells('Q2:X2');
  ws.getCell('Q2').value = '自动算 Calcul automatique : Volume m³';
  ws.getCell('Q2').font = { italic: true, name: 'Arial', size: 8, color: { argb: 'FF888888' } };
  ws.getCell('Q2').alignment = { horizontal: 'right', vertical: 'middle' };

  // 9. Ligne 3 — Totaux (paires de colonnes fusionnées)
  const totaux3 = [
    { range: 'A3:B3', label: 'TOTAL LIGNES', val: String(lignes.length) },
    { range: 'C3:D3', label: 'TOTAL COLIS', val: String(totalColis) },
    { range: 'E3:F3', label: 'TOTAL PIÈCES', val: String(totalPieces) },
    { range: 'G3:H3', label: 'VOLUME TOTAL m³', val: totalVolume.toFixed(3) },
    { range: 'I3:J3', label: 'POIDS NET TOTAL', val: `${totalPNet.toFixed(1)} kg` },
    { range: 'K3:L3', label: 'POIDS BRUT TOTAL', val: `${totalPBrut.toFixed(1)} kg` }
  ];
  totaux3.forEach(({ range, label, val }) => {
    ws.mergeCells(range);
    const cell = ws.getCell(range.split(':')[0]);
    cell.value = `${label} : ${val}`;
    cell.font = { bold: true, name: 'Arial', size: 9, color: { argb: NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
    };
  });

  // 10. Ligne 4 — En-têtes bilingues navy
  BC_HEADERS.forEach((h, i) => styleNavyHeader(ws.getCell(4, i + 1), h));

  // 11. Lignes de données (à partir de la ligne 5)
  lignes.forEach((ligne, idx) => {
    const rowNum = 5 + idx;
    ws.getRow(rowNum).height = 18;
    const vol = calcVolM3(ligne.longueur_cm, ligne.largeur_cm, ligne.hauteur_cm);
    const prixCny = ligne.prix_achat_eur ? Math.round(ligne.prix_achat_eur * taux) : 0;

    const cells: { v: ExcelJS.CellValue; center: boolean; placeholder?: boolean }[] = [
      { v: idx + 1, center: true },                                                    // A: N°
      { v: '', center: true },                                                         // B: N° Colis (vide)
      { v: ligne.reference || '', center: false },                                     // C: Réf Interne
      { v: ligne.nom_fr || '', center: false },                                        // D: Nom FR
      { v: ligne.nom_zh || ligne.nom_fr || '', center: false },                        // E: Nom ZH
      { v: numVal(ligne.qte_colis) || 1, center: true },                              // F: Qté Colis
      { v: numVal(ligne.qte_pieces) || 1, center: true },                             // G: Qté Pièces
      { v: ligne.longueur_cm ? numVal(ligne.longueur_cm) : '', center: true },        // H: Longueur
      { v: ligne.largeur_cm ? numVal(ligne.largeur_cm) : '', center: true },          // I: Largeur
      { v: ligne.hauteur_cm ? numVal(ligne.hauteur_cm) : '', center: true },          // J: Hauteur
      { v: vol, center: true },                                                        // K: Volume m³
      { v: numVal(ligne.poids_net_kg), center: true },                                 // L: Poids Net
      { v: numVal(ligne.poids_brut_kg), center: true },                                // M: Poids Brut
      { v: ligne.nom_en || ligne.nom_fr || '', center: false },                        // N: Nom EN
      { v: strVal(ligne.marque), center: false, placeholder: !ligne.marque },          // O: Marque
      { v: strVal(ligne.ref_usine), center: false, placeholder: !ligne.ref_usine },    // P: Réf Usine
      { v: strVal(ligne.matiere_zh), center: false, placeholder: !ligne.matiere_zh },  // Q: Matière ZH
      { v: strVal(ligne.matiere_en), center: false, placeholder: !ligne.matiere_en },  // R: Matière EN
      { v: prixCny, center: true },                                                    // S: Prix ¥
      { v: strVal(ligne.ce_certification), center: true, placeholder: !ligne.ce_certification }, // T: CE
      { v: ligne.date_devis || '', center: true },                                     // U: Date Devis
      { v: ligne.num_devis ? formatIdExcel(ligne.num_devis) : '', center: true },     // V: N° Devis
      { v: ligne.nom_client || '', center: false },                                    // W: Client
      { v: ligne.num_conteneur ? formatIdExcel(ligne.num_conteneur) : '', center: true } // X: N° CTN
    ];

    cells.forEach(({ v, center, placeholder }, colIdx) => {
      const cell = ws.getCell(rowNum, colIdx + 1);
      cell.value = v;
      styleData(cell, center, placeholder || false);
    });
  });

  // 12. Ligne TOTAL
  const totalRow = 5 + lignes.length;
  ws.getRow(totalRow).height = 18;
  ws.mergeCells(`A${totalRow}:E${totalRow}`);
  const totalLabelCell = ws.getCell(`A${totalRow}`);
  totalLabelCell.value = `TOTAL — ${lignes.length} ligne(s)`;
  styleTotal(totalLabelCell);

  ws.getCell(`F${totalRow}`).value = totalColis;
  styleTotal(ws.getCell(`F${totalRow}`));
  ws.getCell(`G${totalRow}`).value = totalPieces;
  styleTotal(ws.getCell(`G${totalRow}`));
  // Colonnes H-J vides pour dimensions
  for (let col = 8; col <= 10; col++) {
    ws.getCell(totalRow, col).value = '—';
    styleTotal(ws.getCell(totalRow, col));
  }
  ws.getCell(`K${totalRow}`).value = totalVolume.toFixed(3);
  styleTotal(ws.getCell(`K${totalRow}`));
  ws.getCell(`L${totalRow}`).value = totalPNet.toFixed(1);
  styleTotal(ws.getCell(`L${totalRow}`));
  ws.getCell(`M${totalRow}`).value = totalPBrut.toFixed(1);
  styleTotal(ws.getCell(`M${totalRow}`));
  // Colonnes N-X vides
  for (let col = 14; col <= 24; col++) {
    ws.getCell(totalRow, col).value = '—';
    styleTotal(ws.getCell(totalRow, col));
  }

  // 13. Ligne avertissement fusionnée A:X
  const warnRow = totalRow + 1;
  ws.getRow(warnRow).height = 20;
  ws.mergeCells(`A${warnRow}:X${warnRow}`);
  const warnCell = ws.getCell(`A${warnRow}`);
  styleWarning(warnCell);
  warnCell.value =
    '⚠  Colonnes en jaune = modifiables manuellement avant export  |  Volume (K) calculé automatiquement  |  BC CHINE = Usage INTERNE uniquement — ne pas diffuser';

  // 14. Télécharger
  const buffer = await wb.xlsx.writeBuffer();
  downloadExcel(
    buffer as ArrayBuffer,
    `BC-CHINE-${formatIdExcel(la.numero || laId)}_${todayFr().replace(/\//g, '-')}.xlsx`
  );
}
