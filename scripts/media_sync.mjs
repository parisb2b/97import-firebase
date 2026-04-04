// Script de synchronisation medias - 97import.com
import { readdirSync, statSync, existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, basename, extname, dirname, relative } from 'path';

const PROD_PUB = 'C:/DATA-MC-2030/97IMPORT/public';
const VV = 'C:/DATA-MC-2030/97IMPORT/97import2026_siteweb/vercel';
const EXTS = new Set(['.pdf', '.jpeg', '.jpg', '.png', '.webp', '.mp4', '.svg']);

function walkDir(dir, excludeDirs = []) {
  const results = [];
  if (!existsSync(dir)) return results;
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) walk(full);
      } else if (EXTS.has(extname(entry.name).toLowerCase())) {
        const st = statSync(full);
        results.push({
          path: full,
          rel: relative(dir, full).replace(/\\/g, '/'),
          name: entry.name,
          size: st.size,
          mtime: new Date(st.mtimeMs).toISOString()
        });
      }
    }
  }
  walk(dir);
  return results;
}

function classify(path) {
  const p = path.toLowerCase();
  if (p.includes('r18')) return ['Mini-pelle R18 PRO', 'MP-R18-001'];
  if (p.includes('r22')) return ['Mini-pelle R22 PRO', 'MP-R22-001'];
  if (p.includes('r32')) return ['Mini-pelle R32 PRO', 'MP-R32-001'];
  if (p.includes('r57')) return ['Mini-pelle R57 PRO', 'MP-R57-001'];
  if (p.includes('r10')) return ['Mini-pelle R10 ECO', 'MP-R10-001'];
  if (p.includes('r13')) return ['Mini-pelle R13 PRO', 'MP-R13-001'];
  if (p.includes('r15')) return ['Mini-pelle R15 ECO', 'MP-R15-001'];
  if (p.includes('modular_standard')) return ['Maison Standard', 'MS-20-001'];
  if (p.includes('modular_premium')) return ['Maison Premium', 'MP-20-001'];
  if (p.includes('camping_car')) return ['Camping Car BYD', 'CC-BYD-001'];
  if (['solar', 'solaire', 'jinko', 'deye', 'battery', 'panel'].some(k => p.includes(k))) return ['Kits Solaires', 'SOL-KIT'];
  if (p.includes('tooth_bucket') || p.includes('godet_dent')) return ['Godet Dente', 'ACC-GD-001'];
  if (p.includes('flat_bucket') || p.includes('godet_lisse')) return ['Godet Lisse', 'ACC-GC-001'];
  if (p.includes('godet_cribleur')) return ['Godet Cribleur', 'ACC-GCR-001'];
  if (p.includes('tilt_bucket') || p.includes('godet_inclinable')) return ['Godet Inclinable', 'ACC-GI-001'];
  if (p.includes('grappin') || p.includes('grapple')) return ['Grappin', 'ACC-GP-001'];
  if (p.includes('marteau') || p.includes('hammer')) return ['Marteau Hydraulique', 'ACC-MH-001'];
  if (p.includes('tariere') || p.includes('auger')) return ['Tariere', 'ACC-TA-001'];
  if (p.includes('rake') || p.includes('rateau')) return ['Rateau', 'ACC-RT-001'];
  if (p.includes('ripper')) return ['Ripper', 'ACC-RP-001'];
  if (p.includes('fourche')) return ['Fourche', 'ACC-FR-001'];
  if (p.includes('logo') || p.includes('rippa') || p.includes('direxport')) return ['Logos site', 'LOGO'];
  if (p.includes('portal') || p.includes('hero')) return ['Images portail', 'PORTAL'];
  if (p.includes('fiche_technique') || p.includes('document')) return ['Documents PDF', 'DOC'];
  if (p.includes('video')) return ['Videos', 'VID'];
  return ['Non classe', 'NC'];
}

function mapDest(relPath) {
  const p = relPath.replace(/\\/g, '/');
  if (p.startsWith('images/accessories/')) return 'images/accessories';
  if (p.startsWith('images/products/r18_pro/')) return 'images/products/r18_pro';
  if (p.startsWith('images/products/r22_pro/')) return 'images/products/r22_pro';
  if (p.startsWith('images/products/r32_pro/')) return 'images/products/r32_pro';
  if (p.startsWith('images/products/r57_pro/')) return 'images/products/r57_pro';
  if (p.startsWith('images/products/camping_car/')) return 'images/houses/camping_car';
  if (p.startsWith('images/products/modular_premium/')) return 'images/houses/modular_premium';
  if (p.startsWith('images/products/modular_standard/')) return 'images/houses/modular_standard';
  if (p.startsWith('images/products/solar_kits/')) return 'images/solar/solar_kits';
  if (p.startsWith('images/products/')) return 'images/products';
  if (p.startsWith('images/solar/')) return 'images/solar';
  if (p.startsWith('images/portal/')) return 'images/portal';
  if (p.startsWith('images/logo/')) return 'images/logos';
  if (p.startsWith('images/logo_') || p.startsWith('images/direxport') || p.startsWith('images/rippa')) return 'images/logos';
  if (p.startsWith('documents/') || p.startsWith('docs/')) return 'documents';
  return dirname(p);
}

// === SCAN ===
console.log('=== ETAPE 1: Inventaire ===');
const prodFiles = walkDir(PROD_PUB);
const vvFiles = walkDir(VV);
console.log(`  PROD (public/): ${prodFiles.length} fichiers`);
console.log(`  VERCEL_VERCEL: ${vvFiles.length} fichiers`);

// === COMPARE & COPY ===
console.log('\n=== ETAPE 3: Comparaison & Copie ===');
let sync = 0, diff = 0, missing = 0, copied = 0;
const copyLog = [];

for (const vf of vvFiles) {
  const destSubdir = mapDest(vf.rel);
  const destDir = join(PROD_PUB, destSubdir);
  const destFile = join(destDir, vf.name);

  if (existsSync(destFile)) {
    const prodSize = statSync(destFile).size;
    if (prodSize === vf.size) {
      sync++;
    } else {
      diff++;
      console.log(`  DIFFERENT: ${vf.name} (VV:${vf.size}B vs PROD:${prodSize}B)`);
    }
  } else {
    missing++;
    mkdirSync(destDir, { recursive: true });
    try {
      copyFileSync(vf.path, destFile);
      copied++;
      console.log(`  COPIE: ${vf.rel} -> ${destSubdir}/${vf.name}`);
      copyLog.push({ source: vf.rel, dest: `${destSubdir}/${vf.name}`, size: vf.size, status: 'OK' });
    } catch (e) {
      console.log(`  ERREUR: ${vf.name} - ${e.message}`);
      copyLog.push({ source: vf.rel, dest: `${destSubdir}/${vf.name}`, size: vf.size, status: `ERREUR: ${e.message}` });
    }
  }
}

console.log(`\n  Synchronises: ${sync}`);
console.log(`  Differents: ${diff}`);
console.log(`  Manquants: ${missing}`);
console.log(`  Copies: ${copied}`);

// === ONLY IN PROD ===
console.log('\n=== ETAPE 4: Uniquement en PROD ===');
const vvNames = new Set(vvFiles.map(f => f.name));
const onlyProd = prodFiles.filter(f => !vvNames.has(f.name));
console.log(`  ${onlyProd.length} fichiers uniquement en PROD`);
onlyProd.slice(0, 10).forEach(f => console.log(`     ${f.rel}`));

// === PRODUCT ASSOCIATION ===
console.log('\n=== ETAPE 2: Association produits ===');
const productStats = {};
for (const f of [...prodFiles, ...vvFiles]) {
  const [prodName, prodRef] = classify(f.rel);
  if (!productStats[prodRef]) {
    productStats[prodRef] = { name: prodName, ref: prodRef, images: 0, pdf: 0, videos: 0, files: [] };
  }
  const ext = extname(f.name).toLowerCase();
  if (ext === '.pdf') productStats[prodRef].pdf++;
  else if (ext === '.mp4') productStats[prodRef].videos++;
  else productStats[prodRef].images++;
  productStats[prodRef].files.push(f.name);
}

for (const [ref, data] of Object.entries(productStats).sort()) {
  console.log(`  ${data.name.padEnd(30)} (${ref.padEnd(12)}) : ${String(data.images).padStart(2)} img, ${String(data.pdf).padStart(2)} pdf, ${String(data.videos).padStart(2)} vid`);
}

// === VERIFICATION ===
console.log('\n=== ETAPE 6: Verification images dans public/ ===');
const checks = [
  ['images/products/r18_pro', 'R18 PRO', 4, 0],
  ['images/products/r22_pro', 'R22 PRO', 4, 0],
  ['images/products/r32_pro', 'R32 PRO', 2, 0],
  ['images/products/r57_pro', 'R57 PRO', 1, 0],
  ['images/houses/modular_standard', 'Modulaire Standard', 4, 1],
  ['images/houses/modular_premium', 'Modulaire Premium', 4, 1],
  ['images/houses/camping_car', 'Camping Car', 4, 1],
  ['images/solar', 'Solar', 3, 0],
  ['images/solar/solar_kits', 'Solar Kits', 3, 0],
];

for (const [subdir, label, minImg, minVid] of checks) {
  const d = join(PROD_PUB, subdir);
  if (!existsSync(d)) {
    console.log(`  [MANQUANT] ${label}: dossier absent`);
    continue;
  }
  const entries = readdirSync(d, { withFileTypes: true }).filter(e => e.isFile());
  const imgs = entries.filter(e => ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(e.name).toLowerCase())).length;
  const vids = entries.filter(e => extname(e.name).toLowerCase() === '.mp4').length;
  const ok = imgs >= minImg && (minVid === 0 || vids >= minVid);
  console.log(`  [${ok ? 'OK' : 'WARN'}] ${label.padEnd(25)}: ${imgs} images, ${vids} videos`);
}

console.log('\nLogos:');
for (const f of ['logo_import97_large.png', 'logo_import97.png']) {
  console.log(`  [${existsSync(join(PROD_PUB, 'images/logos', f)) ? 'OK' : 'MANQUANT'}] ${f}`);
}

console.log('\nPortal:');
for (const f of ['hero_ship.png', 'modular_home.webp']) {
  console.log(`  [${existsSync(join(PROD_PUB, 'images/portal', f)) ? 'OK' : 'MANQUANT'}] ${f}`);
}

// === GENERATE REPORTS ===
console.log('\n=== ETAPE 5: Generation rapports ===');
const finalFiles = walkDir(PROD_PUB);
const finalCount = finalFiles.length;

const inventory = {
  date: new Date().toISOString(),
  summary: {
    total_scanned: prodFiles.length + vvFiles.length,
    synchronized: sync,
    different: diff,
    missing_in_prod: missing,
    only_in_prod: onlyProd.length,
    copied,
    final_count: finalCount
  },
  products: {},
  copies: copyLog,
  prod_files: finalFiles.map(f => ({ name: f.name, rel: f.rel, size: f.size }))
};
for (const [ref, d] of Object.entries(productStats)) {
  inventory.products[ref] = { name: d.name, ref: d.ref, images: d.images, pdf: d.pdf, videos: d.videos, files: [...new Set(d.files)] };
}
writeFileSync('C:/DATA-MC-2030/97IMPORT/medias-inventory.json', JSON.stringify(inventory, null, 2), 'utf-8');
console.log('  medias-inventory.json genere');

const now = new Date().toLocaleString('fr-FR');
const md = `# Rapport Medias - 97import.com
## Date : ${now}

## Resume
- Total fichiers scannes : ${prodFiles.length + vvFiles.length}
- Fichiers synchronises : ${sync}
- Fichiers differents : ${diff}
- Fichiers manquants en prod : ${missing}
- Fichiers uniquement en prod : ${onlyProd.length}
- Fichiers copies vers public/ : ${copied}
- **Total final dans public/ : ${finalCount}**

## Bug corrige
- \`public/images/houses/houses/\` (dossier double) fusionne dans \`public/images/houses/\`

## Association Produits
| Produit | Reference | Nb images | Nb PDF | Nb videos | Statut |
|---------|-----------|-----------|--------|-----------|--------|
${Object.entries(productStats).sort().map(([ref, d]) => `| ${d.name} | ${d.ref} | ${d.images} | ${d.pdf} | ${d.videos} | ${d.images > 0 ? 'OK' : 'MANQUANT'} |`).join('\n')}

${copyLog.length ? `## Fichiers copies
| Source | Destination | Taille | Statut |
|--------|-------------|--------|--------|
${copyLog.map(c => `| ${c.source} | ${c.dest} | ${c.size.toLocaleString()} B | ${c.status} |`).join('\n')}` : ''}

${onlyProd.length ? `## Fichiers uniquement en PROD
| Fichier | Taille |
|---------|--------|
${onlyProd.map(f => `| ${f.rel} | ${f.size.toLocaleString()} B |`).join('\n')}` : ''}

## Verification finale
- Total fichiers dans public/ : **${finalCount}**
`;

writeFileSync('C:/DATA-MC-2030/97IMPORT/RAPPORT-MEDIAS.md', md, 'utf-8');
console.log('  RAPPORT-MEDIAS.md genere');

console.log(`\n=== TERMINE - ${finalCount} fichiers dans public/ ===`);
