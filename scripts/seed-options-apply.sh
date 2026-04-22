#!/bin/bash
# Script d'application des configurations Firestore
# À lancer UNIQUEMENT après validation du rapport SEED-ANALYSIS-REPORT.md

set -e

PROJECT_ID="importok-6ef77"
API_KEY="AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"

if [ ! -f /tmp/seed-work/configs.json ]; then
  echo "❌ /tmp/seed-work/configs.json introuvable. Relancer l'analyse d'abord."
  exit 1
fi

echo "═══════════════════════════════════════════"
echo "  APPLICATION DES CONFIGURATIONS FIRESTORE"
echo "═══════════════════════════════════════════"
echo ""
echo "Vous allez écrire dans la collection 'products'."
echo "Champs ajoutés : groupe_produit, options_config"
echo ""
read -p "Continuer ? (yes/no) : " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Annulé."
  exit 0
fi

# Script Python pour l'écriture
python3 << 'PYEOF'
import json
import subprocess
import os

PROJECT_ID = "importok-6ef77"
API_KEY = "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"

with open('/tmp/seed-work/configs.json') as f:
    configs = json.load(f)

results = {'success': [], 'errors': []}

def firestore_patch(doc_id, fields):
    """Patch un document Firestore avec updateMask."""
    fields_query = '&updateMask.fieldPaths=' + '&updateMask.fieldPaths='.join(fields.keys())
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/products/{doc_id}?key={API_KEY}{fields_query}"

    # Construire le body Firestore
    firestore_fields = {}
    for key, val in fields.items():
        if isinstance(val, str):
            firestore_fields[key] = {'stringValue': val}
        elif isinstance(val, dict):
            firestore_fields[key] = {'mapValue': {'fields': dict_to_firestore(val)}}
        else:
            firestore_fields[key] = {'stringValue': str(val)}

    body = json.dumps({'fields': firestore_fields})

    result = subprocess.run(
        ['curl', '-s', '-X', 'PATCH', '-H', 'Content-Type: application/json', '-d', body, url],
        capture_output=True, text=True
    )
    return result.stdout

def dict_to_firestore(d):
    """Convertit un dict Python en format Firestore fields."""
    out = {}
    for k, v in d.items():
        if isinstance(v, str):
            out[k] = {'stringValue': v}
        elif isinstance(v, list):
            out[k] = {'arrayValue': {'values': [item_to_firestore(x) for x in v]}}
        elif isinstance(v, dict):
            out[k] = {'mapValue': {'fields': dict_to_firestore(v)}}
        elif isinstance(v, bool):
            out[k] = {'booleanValue': v}
        elif isinstance(v, (int, float)):
            out[k] = {'doubleValue': v}
        else:
            out[k] = {'nullValue': None}
    return out

def item_to_firestore(item):
    if isinstance(item, str):
        return {'stringValue': item}
    if isinstance(item, dict):
        return {'mapValue': {'fields': dict_to_firestore(item)}}
    if isinstance(item, bool):
        return {'booleanValue': item}
    if isinstance(item, (int, float)):
        return {'doubleValue': item}
    return {'nullValue': None}

for config in configs:
    group_key = config['group_key']
    parent_id = config['parent_id']
    parent_ref = config['parent_ref']

    print(f"\n═══ Traitement groupe {group_key} ═══")

    # 1. Ajouter groupe_produit sur TOUTES les variantes
    for variant in config['all_variants']:
        try:
            print(f"  → {variant['ref']} : groupe_produit={group_key}")
            response = firestore_patch(variant['id'], {'groupe_produit': group_key})
            if 'error' in response.lower() and '"code"' in response:
                results['errors'].append(f"{variant['ref']}: {response[:200]}")
            else:
                results['success'].append(f"{variant['ref']} → groupe_produit={group_key}")
        except Exception as e:
            results['errors'].append(f"{variant['ref']}: {e}")

    # 2. Ajouter options_config UNIQUEMENT sur la variante parent
    try:
        print(f"  → {parent_ref} (PARENT) : options_config")
        options_config = {'dropdowns': config['dropdowns']}
        response = firestore_patch(parent_id, {'options_config': options_config})
        if 'error' in response.lower() and '"code"' in response:
            results['errors'].append(f"PARENT {parent_ref}: {response[:200]}")
        else:
            results['success'].append(f"{parent_ref} → options_config (parent)")
    except Exception as e:
        results['errors'].append(f"PARENT {parent_ref}: {e}")

# Rapport
print("\n\n═══════════════════════════════════════════")
print("  RAPPORT D'APPLICATION")
print("═══════════════════════════════════════════")
print(f"\nSuccès : {len(results['success'])}")
for s in results['success']:
    print(f"  ✅ {s}")
print(f"\nErreurs : {len(results['errors'])}")
for e in results['errors']:
    print(f"  ❌ {e}")

# Sauvegarder rapport
with open('SEED-APPLY-REPORT.md', 'w') as f:
    f.write(f"# RAPPORT D'APPLICATION — Seed options\n\n")
    f.write(f"## Succès ({len(results['success'])})\n\n")
    for s in results['success']:
        f.write(f"- ✅ {s}\n")
    f.write(f"\n## Erreurs ({len(results['errors'])})\n\n")
    for e in results['errors']:
        f.write(f"- ❌ {e}\n")

print("\nRapport sauvegardé : SEED-APPLY-REPORT.md")
PYEOF

echo ""
echo "═══════════════════════════════════════════"
echo "  APPLICATION TERMINÉE"
echo "═══════════════════════════════════════════"
echo "  Voir : SEED-APPLY-REPORT.md"
