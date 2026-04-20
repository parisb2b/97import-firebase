import ExcelJS from 'exceljs';

/**
 * Insère le bloc d'en-tête LUXENT (société) dans une feuille Excel
 * pour les documents BD-INVOICE, BD-PACKINGLIST, BD-MARITIME
 *
 * @param ws - la feuille de calcul ExcelJS
 * @param startRow - ligne de début (par défaut 1)
 * @returns le numéro de la ligne suivante disponible
 */
export function insertLuxentHeader(ws: ExcelJS.Worksheet, startRow = 1): number {
  let row = startRow;

  // Ligne 1 : Titre document (sera personnalisé par l'appelant)
  // On laisse vide, l'appelant mettra son titre

  // Ligne 2 : LUXENT FRANCE
  row++;
  ws.mergeCells(`A${row}:F${row}`);
  const luxentCell = ws.getCell(`A${row}`);
  luxentCell.value = 'LUXENT FRANCE';
  luxentCell.font = { bold: true, size: 14, name: 'Arial', color: { argb: 'FF1E3A5F' } };
  luxentCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Ligne 3 : Adresse
  row++;
  ws.mergeCells(`A${row}:F${row}`);
  const adresseCell = ws.getCell(`A${row}`);
  adresseCell.value = '12 Rue de la Paix, 75002 Paris, France';
  adresseCell.font = { size: 10, name: 'Arial' };
  adresseCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Ligne 4 : Contact
  row++;
  ws.mergeCells(`A${row}:F${row}`);
  const contactCell = ws.getCell(`A${row}`);
  contactCell.value = 'contact@luxent.fr • +33 1 23 45 67 89';
  contactCell.font = { size: 10, name: 'Arial' };
  contactCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Ligne 5 : SIRET / TVA
  row++;
  ws.mergeCells(`A${row}:F${row}`);
  const siretCell = ws.getCell(`A${row}`);
  siretCell.value = 'SIRET : 123 456 789 00012 • TVA : FR12345678901';
  siretCell.font = { size: 9, name: 'Arial', italic: true, color: { argb: 'FF6B7280' } };
  siretCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Retourne la ligne suivante disponible (après l'en-tête)
  return row + 1;
}
