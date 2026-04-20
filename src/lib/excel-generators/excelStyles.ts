import ExcelJS from 'exceljs';

export const NAVY   = 'FF1E3A5F';
export const ORANGE = 'FFEA580C';
export const GRIS_CLAIR = 'FFE8EEF5';
export const WARN_BG    = 'FFFFF9EB';
export const WARN_FG    = 'FFB45309';
export const VIDE_FG    = 'FF999999';

function borderThin(color: string): Partial<ExcelJS.Borders> {
  const s = { style: 'thin' as const, color: { argb: color } };
  return { top: s, left: s, bottom: s, right: s };
}

// En-tête navy (BC-CHINE)
export function styleNavyHeader(cell: ExcelJS.Cell, value?: string): void {
  if (value !== undefined) cell.value = value;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 9 };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const borders: any = borderThin('FFFFFFFF');
  cell.border = borders;
}

// En-tête orange (BE-EXPORT)
export function styleOrangeHeader(cell: ExcelJS.Cell, value?: string): void {
  if (value !== undefined) cell.value = value;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 9 };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const borders: any = borderThin('FFFFFFFF');
  cell.border = borders;
}

// Cellule de données
export function styleData(cell: ExcelJS.Cell, center = false, isPlaceholder = false): void {
  cell.font = isPlaceholder
    ? { italic: true, color: { argb: VIDE_FG }, name: 'Arial', size: 9 }
    : { name: 'Arial', size: 9 };
  cell.alignment = { horizontal: center ? 'center' : 'left', vertical: 'middle', wrapText: false };
  cell.border = borderThin('FFD0D0D0');
}

// Cellule TOTAL
export function styleTotal(cell: ExcelJS.Cell): void {
  cell.font = { bold: true, name: 'Arial', size: 9 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CLAIR } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top: { style: 'medium', color: { argb: 'FF333333' } },
    bottom: { style: 'medium', color: { argb: 'FF333333' } },
    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  };
}

// Cellule avertissement
export function styleWarning(cell: ExcelJS.Cell): void {
  cell.font = { italic: true, color: { argb: WARN_FG }, name: 'Arial', size: 8 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WARN_BG } };
  cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
}
