# ════════════════════════════════════════════════════════
# PROMPT STEPFUN / PYTHON — Audit images + Export Excel
# À exécuter sur la machine Windows de Michel
# ════════════════════════════════════════════════════════

# ÉTAPE 1 — Lister la structure complète du dossier images

import os
import json

BASE_PATH = r"C:\DATA-MC-2030\97IMPORT\97import2026_siteweb\vercel"

def scan_directory(path, indent=0):
    """Affiche l'arborescence complète"""
    result = []
    try:
        for entry in sorted(os.listdir(path)):
            full = os.path.join(path, entry)
            if os.path.isdir(full):
                result.append(("DIR", full, entry))
                result.extend(scan_directory(full, indent + 1))
            elif entry.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.svg')):
                size_kb = os.path.getsize(full) / 1024
                result.append(("IMG", full, entry, round(size_kb, 1)))
    except PermissionError:
        pass
    return result

# Scanner tout le dossier vercel
print("=" * 60)
print("SCAN DU DOSSIER VERCEL — IMAGES")
print("=" * 60)

all_items = scan_directory(BASE_PATH)

# Afficher les dossiers
dirs = [item for item in all_items if item[0] == "DIR"]
imgs = [item for item in all_items if item[0] == "IMG"]

print(f"\n📁 {len(dirs)} dossiers trouvés")
print(f"🖼️  {len(imgs)} images trouvées\n")

print("ARBORESCENCE DES DOSSIERS :")
for item in dirs:
    rel_path = os.path.relpath(item[1], BASE_PATH)
    depth = rel_path.count(os.sep)
    print(f"{'  ' * depth}📁 {item[2]}")

print(f"\n{'=' * 60}")
print("TOUTES LES IMAGES :")
print(f"{'=' * 60}")
for item in imgs:
    rel_path = os.path.relpath(item[1], BASE_PATH)
    print(f"  {rel_path}  ({item[3]} Ko)")

# Sauvegarder le résultat en JSON pour l'étape 2
scan_result = {
    "base_path": BASE_PATH,
    "total_dirs": len(dirs),
    "total_images": len(imgs),
    "images": [
        {
            "filename": item[2],
            "full_path": item[1],
            "relative_path": os.path.relpath(item[1], BASE_PATH),
            "size_kb": item[3],
            "parent_folder": os.path.basename(os.path.dirname(item[1]))
        }
        for item in imgs
    ]
}

json_path = r"C:\DATA-MC-2030\97IMPORT\scan_images_vercel.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(scan_result, f, ensure_ascii=False, indent=2)

print(f"\n✅ Résultat sauvegardé dans : {json_path}")
print(f"\n⏭️  COPIE-COLLE le résultat ci-dessus dans le chat,")
print(f"   puis lance l'ÉTAPE 2 pour générer l'Excel.")
