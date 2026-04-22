#!/bin/bash
# Script d'application V2 — Écriture Firestore des configurations corrigées
set -e

PROJECT_ID="importok-6ef77"
API_KEY="AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"

if [ ! -f /tmp/seed-v2/configs-v2.json ]; then
  echo "❌ /tmp/seed-v2/configs-v2.json introuvable. Relancer l'analyse d'abord."
  exit 1
fi

echo "═══════════════════════════════════════════"
echo "  APPLICATION V2 — FIRESTORE"
echo "═══════════════════════════════════════════"
echo ""
echo "Ce script va :"
echo "  1. Ajouter groupe_produit sur les variantes (mini-pelles + kits solaires + maisons)"
echo "  2. Ajouter options_config sur les produits parents"
echo "  3. NE PAS TOUCHER aux pièces détachées solaires"
echo ""
read -p "Continuer ? (yes/no) : " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Annulé."
  exit 0
fi

python3 << 'PYEOF'
import json
import subprocess

PROJECT_ID = "importok-6ef77"
API_KEY = "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"

with open('/tmp/seed-v2/configs-v2.json') as f:
    configs = json.load(f)

results = {'success': [], 'errors': []}

def dict_to_firestore(d):
    out = {}
    for k, v in d.items():
        if isinstance(v, bool):
            out[k] = {'booleanValue': v}
        elif isinstance(v, (int, float)):
            out[k] = {'doubleValue': v}
        elif isinstance(v, str):
            out[k] = {'stringValue': v}
        elif isinstance(v, list):
            out[k] = {'arrayValue': {'values': [item_to_firestore(x) for x in v]}}
        elif isinstance(v, dict):
            out[k] = {'mapValue': {'fields': dict_to_firestore(v)}}
        elif v is None:
            out[k] = {'nullValue': None}
        else:
            out[k] = {'stringValue': str(v)}
    return out

def item_to_firestore(item):
    if isinstance(item, bool):
        return {'booleanValue': item}
    if isinstance(item, (int, float)):
        return {'doubleValue': item}
    if isinstance(item, str):
        return {'stringValue': item}
    if isinstance(item, dict):
        return {'mapValue': {'fields': dict_to_firestore(item)}}
    return {'nullValue': None}

def firestore_patch(doc_id, fields_dict):
    fields_query = '&'.join([f'updateMask.fieldPaths={k}' for k in fields_dict.keys()])
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/products/{doc_id}?key={API_KEY}&{fields_query}"

    firestore_fields = {}
    for key, val in fields_dict.items():
        if isinstance(val, str):
            firestore_fields[key] = {'stringValue': val}
        elif isinstance(val, dict):
            firestore_fields[key] = {'mapValue': {'fields': dict_to_firestore(val)}}

    body = json.dumps({'fields': firestore_fields})
    result = subprocess.run(
        ['curl', '-s', '-X', 'PATCH', '-H', 'Content-Type: application/json', '-d', body, url],
        capture_output=True, text=True
    )
    return result.stdout

for config in configs:
    group_key = config['group_key']
    parent_id = config['parent_id']
    parent_ref = config['parent_ref']

    print(f"\n═══ {group_key} ({config['detected_type']}) ═══")

    for variant in config['all_variants']:
        print(f"  → {variant['ref']} : groupe_produit={group_key}")
        response = firestore_patch(variant['id'], {'groupe_produit': group_key})
        if '"error"' in response and '"code"' in response:
            results['errors'].append(f"{variant['ref']}: {response[:200]}")
        else:
            results['success'].append(f"{variant['ref']} ← groupe_produit={group_key}")

    print(f"  → {parent_ref} (PARENT) : options_config")
    options_config = {'dropdowns': config['dropdowns']}
    response = firestore_patch(parent_id, {'options_config': options_config})
    if '"error"' in response and '"code"' in response:
        results['errors'].append(f"PARENT {parent_ref}: {response[:200]}")
    else:
        results['success'].append(f"{parent_ref} ← options_config (parent)")

print("\n\n═══════════════════════════════════════════")
print("  RAPPORT D'APPLICATION V2")
print("═══════════════════════════════════════════")
print(f"\n✅ Succès : {len(results['success'])}")
for s in results['success'][:20]:
    print(f"  {s}")
if len(results['success']) > 20:
    print(f"  ... et {len(results['success']) - 20} de plus")

print(f"\n❌ Erreurs : {len(results['errors'])}")
for e in results['errors']:
    print(f"  {e}")

with open('SEED-APPLY-REPORT-V2.md', 'w') as f:
    f.write("# RAPPORT D'APPLICATION V2 — Seed options\n\n")
    f.write(f"## ✅ Succès ({len(results['success'])})\n\n")
    for s in results['success']:
        f.write(f"- {s}\n")
    f.write(f"\n## ❌ Erreurs ({len(results['errors'])})\n\n")
    for e in results['errors']:
        f.write(f"- {e}\n")

print("\n📄 Rapport : SEED-APPLY-REPORT-V2.md")
PYEOF

echo ""
echo "═══════════════════════════════════════════"
echo "  APPLICATION V2 TERMINÉE"
echo "═══════════════════════════════════════════"
