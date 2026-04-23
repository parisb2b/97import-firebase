#!/bin/bash
# Script de suppression MS-20-001 orphelin (ID aléatoire)
# Date : 2026-04-23
# Contexte : Document créé avec ancien code bugué avant fix duplication

set -e

PROJECT_ID="importok-6ef77"
API_KEY="AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"
DOC_ID="TntXwKRbgMPL0sXxoFiL"

echo "═══════════════════════════════════════════"
echo "  FIX MS-20-001 — Suppression document orphelin"
echo "═══════════════════════════════════════════"
echo ""
echo "Ce script va supprimer le document Firestore avec ID aléatoire"
echo "afin de permettre la recréation via le bouton Dupliquer (corrigé)."
echo ""

# ═══════════════════════════════════════════════════
# ÉTAPE 1 : Vérifier que le document existe
# ═══════════════════════════════════════════════════

echo "ÉTAPE 1/5 : Vérification existence document..."
echo ""

RESPONSE=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${DOC_ID}?key=${API_KEY}")

if echo "$RESPONSE" | grep -q '"code": 5'; then
  echo "❌ ERREUR : Le document ${DOC_ID} n'existe pas en Firestore."
  echo ""
  echo "Possible causes :"
  echo "  - Déjà supprimé"
  echo "  - ID incorrect"
  echo ""
  echo "Vérification dans la base :"
  curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "structuredQuery": {
        "from": [{"collectionId": "products"}],
        "where": {
          "fieldFilter": {
            "field": {"fieldPath": "reference"},
            "op": "EQUAL",
            "value": {"stringValue": "MS-20-001"}
          }
        }
      }
    }' | python3 -c "
import json, sys
data = json.load(sys.stdin)
for r in data:
    if 'document' in r:
        doc_id = r['document']['name'].split('/')[-1]
        ref = r['document'].get('fields', {}).get('reference', {}).get('stringValue', '')
        nom = r['document'].get('fields', {}).get('nom_fr', {}).get('stringValue', '')
        print(f'  Trouvé : ID={doc_id}, ref={ref}, nom={nom}')
    else:
        print('  Aucun produit MS-20-001 trouvé')
"
  exit 1
fi

echo "✅ Document trouvé : ${DOC_ID}"
echo ""

# ═══════════════════════════════════════════════════
# ÉTAPE 2 : Afficher les données (DRY-RUN)
# ═══════════════════════════════════════════════════

echo "ÉTAPE 2/5 : Affichage des données du document..."
echo ""

echo "$RESPONSE" | python3 << 'PYEOF'
import json, sys

data = json.load(sys.stdin)
fields = data.get('fields', {})

def extract(key):
    v = fields.get(key, {})
    return (v.get('stringValue') or
            v.get('integerValue') or
            v.get('doubleValue') or
            v.get('booleanValue') or
            '(non défini)')

print("╔═══════════════════════════════════════════╗")
print("║  DONNÉES DU DOCUMENT À SUPPRIMER          ║")
print("╚═══════════════════════════════════════════╝")
print("")
print(f"  ID Firestore      : TntXwKRbgMPL0sXxoFiL")
print(f"  Référence        : {extract('reference')}")
print(f"  Nom FR           : {extract('nom_fr')}")
print(f"  Catégorie        : {extract('categorie')}")
print(f"  Sous-catégorie   : {extract('sous_categorie')}")
print(f"  Prix achat       : {extract('prix_achat')}")
print(f"  Actif            : {extract('actif')}")
print(f"  Dupliqué de      : {extract('duplique_de')}")
print("")
print("⚠️  PROBLÈME : ID Firestore ≠ référence")
print("   Le document est orphelin, inaccessible via /admin/produits/MS-20-001")
print("")
PYEOF

# ═══════════════════════════════════════════════════
# ÉTAPE 3 : Demander confirmation
# ═══════════════════════════════════════════════════

echo "ÉTAPE 3/5 : Confirmation..."
echo ""
echo "⚠️  ATTENTION : Cette action est IRRÉVERSIBLE"
echo ""
echo "Après suppression, vous devrez recréer MS-20-001 via le bouton"
echo "'📋 Dupliquer' (qui utilise maintenant le code corrigé)."
echo ""
read -p "Confirmer la suppression du document ${DOC_ID} ? (yes/no) : " CONFIRM
echo ""

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Suppression annulée par l'utilisateur."
  echo ""
  echo "Aucune modification effectuée en Firestore."
  exit 0
fi

# ═══════════════════════════════════════════════════
# ÉTAPE 4 : Exécuter la suppression
# ═══════════════════════════════════════════════════

echo "ÉTAPE 4/5 : Suppression en cours..."
echo ""

DELETE_RESPONSE=$(curl -s -X DELETE \
  "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${DOC_ID}?key=${API_KEY}")

# Vérifier les erreurs
if echo "$DELETE_RESPONSE" | grep -q '"error"'; then
  echo "❌ ERREUR lors de la suppression :"
  echo ""
  echo "$DELETE_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    error = data.get('error', {})
    print(f\"  Code : {error.get('code', 'inconnu')}\")
    print(f\"  Message : {error.get('message', 'Erreur inconnue')}\")
except:
    print('  Impossible de parser la réponse')
"
  exit 1
fi

echo "✅ Commande de suppression exécutée"
echo ""

# ═══════════════════════════════════════════════════
# ÉTAPE 5 : Vérifier que la suppression a réussi
# ═══════════════════════════════════════════════════

echo "ÉTAPE 5/5 : Vérification suppression..."
echo ""
sleep 1

VERIFY_RESPONSE=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${DOC_ID}?key=${API_KEY}")

if echo "$VERIFY_RESPONSE" | grep -q '"code": 5'; then
  echo "✅ CONFIRMÉ : Document ${DOC_ID} supprimé avec succès"
  echo ""
else
  echo "⚠️  AVERTISSEMENT : Le document semble toujours exister"
  echo ""
  echo "Réponse Firestore :"
  echo "$VERIFY_RESPONSE" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))" | head -20
  echo ""
  echo "Possible délai de propagation. Attendez 10 secondes et revérifiez."
  exit 1
fi

# ═══════════════════════════════════════════════════
# SUCCÈS : Afficher les prochaines étapes
# ═══════════════════════════════════════════════════

echo "═══════════════════════════════════════════"
echo "  ✅ SUPPRESSION RÉUSSIE"
echo "═══════════════════════════════════════════"
echo ""
echo "Le document orphelin TntXwKRbgMPL0sXxoFiL a été supprimé."
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  PROCHAINES ÉTAPES (OBLIGATOIRES)         ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "1️⃣  RECRÉER MS-20-001 via le bouton Dupliquer"
echo ""
echo "    a. Ouvrir : http://localhost:5173/admin/produits/MS-30-001"
echo "    b. Cliquer : '📋 Dupliquer'"
echo "    c. Remplir :"
echo "        - Nouvelle référence : MS-20-001"
echo "        - Nouveau nom : Maison Standard 20 Pieds"
echo "        - Catégorie : maison-modulaire"
echo "        - ✅ Créer en désactivé (coché)"
echo "    d. Valider"
echo ""
echo "    Résultat attendu :"
echo "      → Document Firestore créé avec ID = MS-20-001 ✅"
echo "      → Redirection vers /admin/produits/MS-20-001 fonctionne ✅"
echo ""
echo "2️⃣  CRÉER les options MS-20-OPT-XCH (3 produits)"
echo ""
echo "    Pour chaque option (1CH, 2CH, 3CH) :"
echo "    a. Ouvrir : /admin/produits/MS-30-OPT-XCH"
echo "    b. Cliquer : '📋 Dupliquer'"
echo "    c. Changer référence : MS-30 → MS-20"
echo "    d. Valider"
echo ""
echo "    Produits à créer :"
echo "      - MS-20-OPT-1CH (Option +1 chambre -- MS-20)"
echo "      - MS-20-OPT-2CH (Option +2 chambres -- MS-20)"
echo "      - MS-20-OPT-3CH (Option +3 chambres -- MS-20)"
echo ""
echo "3️⃣  RELANCER le seed V2 (après création des 4 produits MS-20)"
echo ""
echo "    cd ~/97import-firebase"
echo "    # Relancer parties A et B du prompt P2-OPT-SEED-V2-CORRIGÉ"
echo "    # pour recalculer les configs avec MS-20 complet"
echo ""
echo "4️⃣  APPLIQUER le seed"
echo ""
echo "    bash scripts/seed-v2-apply.sh"
echo ""
echo "═══════════════════════════════════════════"
echo ""
echo "Script terminé avec succès."
echo "Fichier : scripts/fix-ms-20-001.sh"
echo ""
