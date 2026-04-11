import * as XLSX from 'xlsx';

interface LigneConteneur {
  ref: string;
  nom_fr: string;
  nom_zh: string;
  qte_colis: number;
  qte_pieces: number;
  l: number;
  L: number;
  h: number;
  volume_m3: number;
  poids_net: number;
  poids_brut?: number;
  code_hs?: string;
  prix_usd?: number;
}

interface Container {
  numero: string;
  type: string;
  destination: string;
  port_chargement: string;
  port_destination: string;
  voyage_number?: string;
  bl_waybill?: string;
  seal?: string;
  lignes: LigneConteneur[];
  volume_total: number;
  poids_total: number;
}

// BC CHINE — Liste d'achat
export const generateBCChine = (container: Container): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    ['BC CHINE 中国采购单 — LISTE D\'ACHAT MICHEL — 97IMPORT.COM'],
    [],
    [
      'Date',
      new Date().toLocaleDateString('fr-FR'),
      '',
      'Conteneur',
      container.numero,
      '',
      'Destination',
      container.destination,
    ],
    [
      'Total lignes',
      container.lignes.length,
      '',
      'Total colis',
      container.lignes.reduce((s, l) => s + l.qte_colis, 0),
      '',
      'Total pièces',
      container.lignes.reduce((s, l) => s + l.qte_pieces, 0),
      '',
      'Volume m³',
      container.volume_total.toFixed(2),
      '',
      'Poids kg',
      container.poids_total,
    ],
    [],
    [
      'N°',
      'N° Colis',
      'N° Interne',
      'Nom FR',
      'Nom ZH 中文',
      'Qté',
      'L cm',
      'l cm',
      'H cm',
      'Volume m³',
      'Poids net kg',
      'Poids brut kg',
    ],
  ];

  // Ajouter les lignes
  container.lignes.forEach((ligne, i) => {
    data.push([
      i + 1,
      ligne.qte_colis,
      ligne.ref,
      ligne.nom_fr,
      ligne.nom_zh,
      ligne.qte_pieces,
      ligne.l,
      ligne.L,
      ligne.h,
      ligne.volume_m3.toFixed(3),
      ligne.poids_net,
      ligne.poids_brut || '',
    ]);
  });

  // Totaux
  data.push([]);
  data.push([
    '',
    '',
    '',
    'TOTAL',
    '',
    container.lignes.reduce((s, l) => s + l.qte_pieces, 0),
    '',
    '',
    '',
    container.volume_total.toFixed(2),
    container.poids_total,
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'BC CHINE');
  return wb;
};

// BE EXPORT — Douane chinoise
export const generateBEExport = (container: Container): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    ['BE EXPORT 出口单 — DOUANE CHINOISE — 97IMPORT.COM'],
    [],
    [
      'Date export',
      new Date().toLocaleDateString('fr-FR'),
      '',
      'Conteneur',
      container.numero,
      '',
      'Port chargement',
      container.port_chargement,
    ],
    [
      'Voyage',
      container.voyage_number || '',
      '',
      'B/L',
      container.bl_waybill || '',
      '',
      'Seal',
      container.seal || '',
    ],
    [],
    [
      'N°',
      'HS Code',
      'N° Interne',
      'Description EN',
      'Description ZH',
      'Qty',
      'Unit',
      'Net Weight kg',
      'Gross Weight kg',
      'Volume m³',
    ],
  ];

  container.lignes.forEach((ligne, i) => {
    data.push([
      i + 1,
      ligne.code_hs || '8429.52',
      ligne.ref,
      ligne.nom_fr,
      ligne.nom_zh,
      ligne.qte_pieces,
      'PCS',
      ligne.poids_net * ligne.qte_pieces,
      (ligne.poids_brut || ligne.poids_net * 1.05) * ligne.qte_pieces,
      ligne.volume_m3,
    ]);
  });

  data.push([]);
  data.push([
    '',
    '',
    '',
    'TOTAL',
    '',
    container.lignes.reduce((s, l) => s + l.qte_pieces, 0),
    '',
    container.poids_total,
    '',
    container.volume_total.toFixed(2),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'BE EXPORT');
  return wb;
};

// BD PACKING LIST — Liste de colisage trilingue
export const generateBDPackingList = (container: Container): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    ['PACKING LIST / 装箱单 / LISTE DE COLISAGE'],
    [],
    ['LUXENT LIMITED'],
    ['2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD'],
    ['RUISLIP HA4 7AE — LONDON, UNITED KINGDOM'],
    [],
    [
      'Container / 集装箱 / Conteneur:',
      container.numero,
      '',
      'Type:',
      container.type,
    ],
    [
      'Loading Port / 装货港 / Port chargement:',
      container.port_chargement,
      '',
      'Destination Port / 卸货港 / Port destination:',
      container.port_destination,
    ],
    ['B/L:', container.bl_waybill || '', '', 'Seal:', container.seal || ''],
    [],
    [
      'No.',
      'Carton No.',
      'Item No.',
      'Description EN',
      'Description ZH 中文',
      'Qty',
      'L cm',
      'W cm',
      'H cm',
      'CBM',
      'N.W. kg',
      'G.W. kg',
    ],
  ];

  container.lignes.forEach((ligne, i) => {
    data.push([
      i + 1,
      ligne.qte_colis,
      ligne.ref,
      ligne.nom_fr,
      ligne.nom_zh,
      ligne.qte_pieces,
      ligne.l,
      ligne.L,
      ligne.h,
      ligne.volume_m3.toFixed(3),
      ligne.poids_net,
      ligne.poids_brut || Math.round(ligne.poids_net * 1.05),
    ]);
  });

  data.push([]);
  data.push([
    '',
    'TOTAL',
    '',
    '',
    '',
    container.lignes.reduce((s, l) => s + l.qte_pieces, 0),
    '',
    '',
    '',
    container.volume_total.toFixed(2),
    container.poids_total,
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'PACKING LIST');
  return wb;
};

// BD INVOICE — Facture export trilingue
export const generateBDInvoiceExcel = (container: Container): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    ['COMMERCIAL INVOICE / 商业发票 / FACTURE COMMERCIALE'],
    [],
    ['LUXENT LIMITED'],
    ['2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD'],
    ['RUISLIP HA4 7AE — LONDON, UNITED KINGDOM'],
    ['Company No: 14852122'],
    [],
    [
      'Invoice No / 发票号 / N° Facture:',
      `BD-${container.numero}`,
      '',
      'Date:',
      new Date().toLocaleDateString('fr-FR'),
    ],
    [
      'Container / 集装箱 / Conteneur:',
      container.numero,
      '',
      'Port of Loading:',
      container.port_chargement,
    ],
    ['B/L:', container.bl_waybill || '', '', 'Port of Discharge:', container.port_destination],
    [],
    [
      'No.',
      'HS Code',
      'Item No.',
      'Description',
      'Qty',
      'Unit',
      'Unit Price USD',
      'Amount USD',
    ],
  ];

  let totalUSD = 0;
  container.lignes.forEach((ligne, i) => {
    const unitPrice = ligne.prix_usd || Math.round(ligne.poids_net * 0.5); // Prix estimé si non fourni
    const amount = unitPrice * ligne.qte_pieces;
    totalUSD += amount;

    data.push([
      i + 1,
      ligne.code_hs || '8429.52',
      ligne.ref,
      ligne.nom_fr,
      ligne.qte_pieces,
      'PCS',
      unitPrice,
      amount,
    ]);
  });

  data.push([]);
  data.push([
    '',
    '',
    '',
    'TOTAL / 合计 / TOTAL',
    container.lignes.reduce((s, l) => s + l.qte_pieces, 0),
    '',
    '',
    totalUSD,
  ]);

  data.push([]);
  data.push(['Terms: FOB ' + container.port_chargement]);
  data.push(['Payment: T/T in advance']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 15 },
    { wch: 35 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'INVOICE');
  return wb;
};

// Download helper
export const downloadExcel = (wb: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(wb, filename);
};
