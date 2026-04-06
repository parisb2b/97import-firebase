# -*- coding: utf-8 -*-
"""
ÉTAPE 1 — Scan inventaire images locales
Scanne 97import2026_siteweb/vercel/images/ (tous sous-dossiers)
Génère : scripts/images-inventory.json
Lecture seule — ne modifie rien.
"""

import os
import json
import sys
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
IMAGES_ROOT  = PROJECT_ROOT / "97import2026_siteweb" / "vercel" / "images"
OUTPUT_JSON  = SCRIPT_DIR / "images-inventory.json"

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}

# ── Scanner ────────────────────────────────────────────────────────────────
def scan_images(root: Path) -> list[dict]:
    inventory = []
    for filepath in sorted(root.rglob("*")):
        if filepath.is_file() and filepath.suffix.lower() in IMAGE_EXTENSIONS:
            rel = filepath.relative_to(root)
            parts = rel.parts
            subdir = parts[0] if len(parts) > 1 else "root"
            subsubdir = str(Path(*parts[:-1])) if len(parts) > 2 else (parts[0] if len(parts) > 1 else "root")

            inventory.append({
                "nom":       filepath.name,
                "nom_sans_ext": filepath.stem,
                "extension": filepath.suffix.lower(),
                "sous_dossier": subdir,
                "chemin_relatif": str(rel).replace("\\", "/"),
                "chemin_absolu": str(filepath),
                "taille_ko": round(filepath.stat().st_size / 1024, 1),
                "mots_cles": extraire_mots_cles(filepath.stem),
            })
    return inventory


def extraire_mots_cles(stem: str) -> list[str]:
    """Décompose le nom de fichier en mots-clés pour le matching."""
    # Remplacer séparateurs par espace, lowercase
    texte = stem.lower().replace("_", " ").replace("-", " ").replace(".", " ")
    mots = [m for m in texte.split() if len(m) >= 2]
    return mots


# ── Statistiques ───────────────────────────────────────────────────────────
def stats(inventory: list[dict]) -> dict:
    by_subdir: dict[str, int] = {}
    by_ext: dict[str, int] = {}
    for item in inventory:
        sd = item["sous_dossier"]
        by_subdir[sd] = by_subdir.get(sd, 0) + 1
        ext = item["extension"]
        by_ext[ext] = by_ext.get(ext, 0) + 1
    return {
        "total": len(inventory),
        "par_sous_dossier": by_subdir,
        "par_extension": by_ext,
    }


# ── Main ───────────────────────────────────────────────────────────────────
def main():
    if not IMAGES_ROOT.exists():
        print(f"❌ Dossier introuvable : {IMAGES_ROOT}", file=sys.stderr)
        sys.exit(1)

    print(f"[SCAN] {IMAGES_ROOT}")
    inventory = scan_images(IMAGES_ROOT)

    result = {
        "meta": {
            "source": str(IMAGES_ROOT),
            "date_scan": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        },
        "statistiques": stats(inventory),
        "images": inventory,
    }

    OUTPUT_JSON.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    st = result["statistiques"]
    print(f"\n[OK] Inventaire genere : {OUTPUT_JSON}")
    print(f"[INFO] {st['total']} images trouvees")
    for sd, n in sorted(st["par_sous_dossier"].items()):
        print(f"   * {sd:20s} -> {n} fichiers")
    print(f"\nExtensions : {dict(sorted(st['par_extension'].items()))}")


if __name__ == "__main__":
    main()
