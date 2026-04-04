#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script de synchronisation medias - 97import.com"""

import os, shutil, json
from datetime import datetime
from pathlib import Path

PROD_PUB = Path("C:/DATA-MC-2030/97IMPORT/public")
VV = Path("C:/DATA-MC-2030/97IMPORT/97import2026_siteweb/vercel")
VERCEL = Path("C:/DATA-MC-2030/97IMPORT/97import2026_siteweb")
EXTS = {'.pdf', '.jpeg', '.jpg', '.png', '.webp', '.mp4', '.svg'}

def get_media_files(root, exclude_dirs=None):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        if exclude_dirs:
            dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for f in filenames:
            if Path(f).suffix.lower() in EXTS:
                full = Path(dirpath) / f
                try:
                    st = full.stat()
                    files.append({
                        'path': str(full),
                        'rel': str(full.relative_to(root)),
                        'name': f,
                        'size': st.st_size,
                        'mtime': datetime.fromtimestamp(st.st_mtime).isoformat()
                    })
                except:
                    pass
    return files

def classify(path):
    p = path.lower()
    if 'r18' in p: return ('Mini-pelle R18 PRO', 'MP-R18-001')
    if 'r22' in p: return ('Mini-pelle R22 PRO', 'MP-R22-001')
    if 'r32' in p: return ('Mini-pelle R32 PRO', 'MP-R32-001')
    if 'r57' in p: return ('Mini-pelle R57 PRO', 'MP-R57-001')
    if 'r10' in p: return ('Mini-pelle R10 ECO', 'MP-R10-001')
    if 'r13' in p: return ('Mini-pelle R13 PRO', 'MP-R13-001')
    if 'r15' in p: return ('Mini-pelle R15 ECO', 'MP-R15-001')
    if 'modular_standard' in p: return ('Maison Standard', 'MS-20-001')
    if 'modular_premium' in p: return ('Maison Premium', 'MP-20-001')
    if 'camping_car' in p: return ('Camping Car BYD', 'CC-BYD-001')
    if any(k in p for k in ['solar', 'solaire', 'jinko', 'deye', 'battery', 'panel']): return ('Kits Solaires', 'SOL-KIT')
    if 'tooth_bucket' in p or 'godet_dent' in p: return ('Godet Dente', 'ACC-GD-001')
    if 'flat_bucket' in p or 'godet_lisse' in p: return ('Godet Lisse', 'ACC-GC-001')
    if 'godet_cribleur' in p: return ('Godet Cribleur', 'ACC-GCR-001')
    if 'tilt_bucket' in p or 'godet_inclinable' in p: return ('Godet Inclinable', 'ACC-GI-001')
    if 'grappin' in p or 'grapple' in p: return ('Grappin', 'ACC-GP-001')
    if 'marteau' in p or 'hammer' in p: return ('Marteau Hydraulique', 'ACC-MH-001')
    if 'tariere' in p or 'auger' in p: return ('Tariere', 'ACC-TA-001')
    if 'rake' in p or 'rateau' in p: return ('Rateau', 'ACC-RT-001')
    if 'ripper' in p: return ('Ripper', 'ACC-RP-001')
    if 'fourche' in p: return ('Fourche', 'ACC-FR-001')
    if 'logo' in p or 'rippa' in p or 'direxport' in p: return ('Logos site', 'LOGO')
    if 'portal' in p or 'hero' in p: return ('Images portail', 'PORTAL')
    if 'fiche_technique' in p or 'document' in p: return ('Documents PDF', 'DOC')
    if 'video' in p: return ('Videos', 'VID')
    return ('Non classe', 'NC')

def map_dest(rel_path):
    p = rel_path.replace('\\', '/')
    if p.startswith('images/accessories/'): return 'images/accessories'
    if p.startswith('images/products/r18_pro/'): return 'images/products/r18_pro'
    if p.startswith('images/products/r22_pro/'): return 'images/products/r22_pro'
    if p.startswith('images/products/r32_pro/'): return 'images/products/r32_pro'
    if p.startswith('images/products/r57_pro/'): return 'images/products/r57_pro'
    if p.startswith('images/products/camping_car/'): return 'images/houses/camping_car'
    if p.startswith('images/products/modular_premium/'): return 'images/houses/modular_premium'
    if p.startswith('images/products/modular_standard/'): return 'images/houses/modular_standard'
    if p.startswith('images/products/solar_kits/'): return 'images/solar/solar_kits'
    if p.startswith('images/products/'): return 'images/products'
    if p.startswith('images/solar/'): return 'images/solar'
    if p.startswith('images/portal/'): return 'images/portal'
    if p.startswith('images/logo/'): return 'images/logos'
    if p.startswith('images/logo_') or p.startswith('images/direxport') or p.startswith('images/rippa'): return 'images/logos'
    if p.startswith('documents/') or p.startswith('docs/'): return 'documents'
    return os.path.dirname(p)

# === SCAN ===
print("=== ETAPE 1: Inventaire ===")
prod_files = get_media_files(PROD_PUB)
vv_files = get_media_files(VV)

print(f"  PROD (public/): {len(prod_files)} fichiers")
print(f"  VERCEL_VERCEL: {len(vv_files)} fichiers")

# === COMPARE & COPY ===
print("\n=== ETAPE 3: Comparaison & Copie ===")
sync = diff = missing = copied = 0
copy_log = []

for vf in vv_files:
    dest_subdir = map_dest(vf['rel'])
    dest_dir = PROD_PUB / dest_subdir
    dest_file = dest_dir / vf['name']

    if dest_file.exists():
        prod_size = dest_file.stat().st_size
        if prod_size == vf['size']:
            sync += 1
        else:
            diff += 1
            print(f"  DIFFERENT: {vf['name']} (VV:{vf['size']}B vs PROD:{prod_size}B)")
    else:
        missing += 1
        dest_dir.mkdir(parents=True, exist_ok=True)
        try:
            shutil.copy2(vf['path'], str(dest_file))
            copied += 1
            print(f"  COPIE: {vf['rel']} -> {dest_subdir}/{vf['name']}")
            copy_log.append({'source': vf['rel'], 'dest': f"{dest_subdir}/{vf['name']}", 'size': vf['size'], 'status': 'OK'})
        except Exception as e:
            print(f"  ERREUR: {vf['name']} - {e}")
            copy_log.append({'source': vf['rel'], 'dest': f"{dest_subdir}/{vf['name']}", 'size': vf['size'], 'status': f'ERREUR: {e}'})

print(f"\n  Synchronises: {sync}")
print(f"  Differents: {diff}")
print(f"  Manquants: {missing}")
print(f"  Copies: {copied}")

# === ONLY IN PROD ===
print("\n=== ETAPE 4: Uniquement en PROD ===")
vv_names = {f['name'] for f in vv_files}
only_prod = [f for f in prod_files if f['name'] not in vv_names]
print(f"  {len(only_prod)} fichiers uniquement en PROD")
for f in only_prod[:10]:
    print(f"     {f['rel']}")

# === PRODUCT ASSOCIATION ===
print("\n=== ETAPE 2: Association produits ===")
all_files_combined = prod_files + vv_files
product_stats = {}
for f in all_files_combined:
    prod_name, prod_ref = classify(f['rel'])
    if prod_ref not in product_stats:
        product_stats[prod_ref] = {'name': prod_name, 'ref': prod_ref, 'images': 0, 'pdf': 0, 'videos': 0, 'files': []}
    ext = Path(f['name']).suffix.lower()
    if ext == '.pdf':
        product_stats[prod_ref]['pdf'] += 1
    elif ext == '.mp4':
        product_stats[prod_ref]['videos'] += 1
    else:
        product_stats[prod_ref]['images'] += 1
    product_stats[prod_ref]['files'].append(f['name'])

for ref, data in sorted(product_stats.items()):
    print(f"  {data['name']:30s} ({ref:12s}) : {data['images']:2d} img, {data['pdf']:2d} pdf, {data['videos']:2d} vid")

# === VERIFICATION ===
print("\n=== ETAPE 6: Verification images dans public/ ===")
checks = [
    ('images/products/r18_pro', 'R18 PRO', 4, 0),
    ('images/products/r22_pro', 'R22 PRO', 4, 0),
    ('images/products/r32_pro', 'R32 PRO', 2, 0),
    ('images/products/r57_pro', 'R57 PRO', 1, 0),
    ('images/houses/modular_standard', 'Modulaire Standard', 4, 1),
    ('images/houses/modular_premium', 'Modulaire Premium', 4, 1),
    ('images/houses/camping_car', 'Camping Car', 4, 1),
    ('images/solar', 'Solar', 3, 0),
    ('images/solar/solar_kits', 'Solar Kits', 3, 0),
]
for subdir, label, min_img, min_vid in checks:
    d = PROD_PUB / subdir
    if not d.exists():
        print(f"  MANQUANT: {label}: dossier absent")
        continue
    imgs = len([f for f in d.iterdir() if f.suffix.lower() in {'.jpg','.jpeg','.png','.webp'} and f.is_file()])
    vids = len([f for f in d.iterdir() if f.suffix.lower() == '.mp4' and f.is_file()])
    ok = imgs >= min_img and (min_vid == 0 or vids >= min_vid)
    status = "OK" if ok else "WARN"
    print(f"  [{status}] {label:25s}: {imgs} images, {vids} videos")

print("\nLogos:")
for f in ['logo_import97_large.png', 'logo_import97.png']:
    exists = (PROD_PUB / 'images/logos' / f).exists()
    print(f"  [{'OK' if exists else 'MANQUANT'}] {f}")

print("\nPortal:")
for f in ['hero_ship.png', 'modular_home.webp']:
    exists = (PROD_PUB / 'images/portal' / f).exists()
    print(f"  [{'OK' if exists else 'MANQUANT'}] {f}")

# === GENERATE REPORTS ===
print("\n=== ETAPE 5: Generation rapports ===")
final_files = get_media_files(PROD_PUB)
final_count = len(final_files)

inventory = {
    'date': datetime.now().isoformat(),
    'summary': {
        'total_scanned': len(prod_files) + len(vv_files),
        'synchronized': sync,
        'different': diff,
        'missing_in_prod': missing,
        'only_in_prod': len(only_prod),
        'copied': copied,
        'final_count': final_count
    },
    'products': {},
    'copies': copy_log,
    'prod_files': [{'name': f['name'], 'rel': f['rel'], 'size': f['size']} for f in final_files]
}
for ref, d in product_stats.items():
    inventory['products'][ref] = {
        'name': d['name'], 'ref': d['ref'],
        'images': d['images'], 'pdf': d['pdf'], 'videos': d['videos'],
        'files': list(set(d['files']))
    }

with open('C:/DATA-MC-2030/97IMPORT/medias-inventory.json', 'w', encoding='utf-8') as jf:
    json.dump(inventory, jf, indent=2, ensure_ascii=False)
print("  medias-inventory.json genere")

now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
md_lines = [
    f"# Rapport Medias - 97import.com",
    f"## Date : {now}",
    "",
    "## Resume",
    f"- Total fichiers scannes : {len(prod_files) + len(vv_files)}",
    f"- Fichiers synchronises : {sync}",
    f"- Fichiers differents : {diff}",
    f"- Fichiers manquants en prod : {missing}",
    f"- Fichiers uniquement en prod : {len(only_prod)}",
    f"- Fichiers copies vers public/ : {copied}",
    f"- **Total final dans public/ : {final_count}**",
    "",
    "## Bug corrige",
    "- `public/images/houses/houses/` (dossier double) fusionne dans `public/images/houses/`",
    "",
    "## Association Produits",
    "| Produit | Reference | Nb images | Nb PDF | Nb videos | Statut |",
    "|---------|-----------|-----------|--------|-----------|--------|",
]

for ref, d in sorted(product_stats.items()):
    status = "OK" if d['images'] > 0 else "MANQUANT"
    md_lines.append(f"| {d['name']} | {d['ref']} | {d['images']} | {d['pdf']} | {d['videos']} | {status} |")

if copy_log:
    md_lines.extend(["", "## Fichiers copies", "| Source | Destination | Taille | Statut |", "|--------|-------------|--------|--------|"])
    for c in copy_log:
        md_lines.append(f"| {c['source']} | {c['dest']} | {c['size']:,} B | {c['status']} |")

if only_prod:
    md_lines.extend(["", "## Fichiers uniquement en PROD", "| Fichier | Taille |", "|---------|--------|"])
    for f in only_prod:
        md_lines.append(f"| {f['rel']} | {f['size']:,} B |")

md_lines.extend(["", f"## Verification finale", f"- Total fichiers dans public/ : **{final_count}**"])

with open('C:/DATA-MC-2030/97IMPORT/RAPPORT-MEDIAS.md', 'w', encoding='utf-8') as mf:
    mf.write('\n'.join(md_lines))
print("  RAPPORT-MEDIAS.md genere")

print(f"\n=== TERMINE - {final_count} fichiers dans public/ ===")
