#!/usr/bin/env python3
"""
validate_backup.py — Verifie l'integrite du MIGRATION_PACKAGE_FINAL
Usage : python3 validate_backup.py
"""

import os
import json
import hashlib

PACKAGE_DIR = os.path.join(os.path.dirname(__file__), "..")
METADATA_PATH = os.path.join(PACKAGE_DIR, "metadata.json")


def validate():
    if not os.path.exists(METADATA_PATH):
        print("ERREUR: metadata.json introuvable.")
        return

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    errors = []
    warnings = []
    ok = 0

    for entry in metadata:
        filepath = os.path.join(PACKAGE_DIR, entry["path"])

        # Fichier existe ?
        if not os.path.exists(filepath):
            errors.append(f"MANQUANT : {entry['path']}")
            continue

        # Taille correcte ?
        actual_size = os.path.getsize(filepath)
        if actual_size != entry["size_bytes"]:
            warnings.append(
                f"TAILLE : {entry['path']} "
                f"(attendu {entry['size_bytes']}, reel {actual_size})"
            )

        # Hash correct ?
        sha = hashlib.sha256()
        with open(filepath, "rb") as fh:
            for chunk in iter(lambda: fh.read(8192), b""):
                sha.update(chunk)

        if sha.hexdigest() != entry["sha256"]:
            errors.append(
                f"HASH MODIFIE : {entry['path']} "
                f"(attendu {entry['sha256'][:16]}..., reel {sha.hexdigest()[:16]}...)"
            )
        else:
            ok += 1

    # Rapport
    print(f"{'='*50}")
    print(f"VALIDATION MIGRATION_PACKAGE_FINAL")
    print(f"{'='*50}")
    print(f"Fichiers verifies : {len(metadata)}")
    print(f"OK                : {ok}")
    print(f"Warnings          : {len(warnings)}")
    print(f"Erreurs           : {len(errors)}")

    if warnings:
        print(f"\n--- WARNINGS ---")
        for w in warnings:
            print(f"  {w}")

    if errors:
        print(f"\n--- ERREURS ---")
        for e in errors:
            print(f"  {e}")
    else:
        print(f"\nTous les fichiers sont valides.")


if __name__ == "__main__":
    validate()
