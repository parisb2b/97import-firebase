#!/usr/bin/env python3
"""
backup_supabase.py — Exporte les donnees dynamiques Supabase
Usage : python3 backup_supabase.py

Prerequis : pip install supabase python-dotenv
Cree un fichier .env dans le meme dossier avec :
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_KEY=eyJhbG...
"""

import os
import json
import hashlib
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# --- CONFIG (lire depuis .env ou variables d'environnement) ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")  # anon key ou service_role key
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "supabase_export")

TABLES = [
    "profiles",
    "contacts",
    "quotes",
    "orders",
    "products",
    "partners",
    "invoices",
    "delivery_notes",
    "fees",
    "commission_notes",
    "site_content",
    "admin_params",
    "error_logs",
]

def export_table(client, table_name: str, out_dir: str) -> dict:
    """Exporte une table en JSON et retourne les metadonnees."""
    print(f"  Exporting {table_name}...")
    try:
        response = client.table(table_name).select("*").execute()
        data = response.data or []
    except Exception as e:
        print(f"    ERREUR: {e}")
        data = []

    filepath = os.path.join(out_dir, f"{table_name}.json")
    content = json.dumps(data, indent=2, ensure_ascii=False, default=str)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    sha = hashlib.sha256(content.encode("utf-8")).hexdigest()
    size = len(content.encode("utf-8"))

    return {
        "table": table_name,
        "records": len(data),
        "file": filepath,
        "size_bytes": size,
        "sha256": sha,
        "exported_at": datetime.now().isoformat(),
    }


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERREUR: SUPABASE_URL et SUPABASE_KEY doivent etre definis.")
        print("Creez un fichier .env ou exportez les variables d'environnement.")
        return

    try:
        from supabase import create_client
    except ImportError:
        print("ERREUR: pip install supabase python-dotenv")
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Connexion a {SUPABASE_URL}")
    print(f"Export vers {OUT_DIR}\n")

    results = []
    for table in TABLES:
        meta = export_table(client, table, OUT_DIR)
        results.append(meta)

    # Sauvegarder le manifest
    manifest_path = os.path.join(OUT_DIR, "_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "supabase_url": SUPABASE_URL,
            "exported_at": datetime.now().isoformat(),
            "tables": results,
            "total_records": sum(r["records"] for r in results),
        }, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*50}")
    print(f"Export termine : {sum(r['records'] for r in results)} enregistrements")
    for r in results:
        print(f"  {r['table']:20s} : {r['records']:4d} enregistrements")
    print(f"\nManifest : {manifest_path}")


if __name__ == "__main__":
    main()
