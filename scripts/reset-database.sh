#!/bin/bash
# scripts/reset-database.sh
# MIGRATION-1: Backup + suppression quotes + reset counters

set -e

PROJECT_ID="importok-6ef77"
API_KEY="AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"
BACKUP_DIR="$HOME/97import-firebase/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M)

echo "════════════════════════════════════════════════"
echo "  MIGRATION-1: Reset base quotes + backup JSON"
echo "════════════════════════════════════════════════"
echo ""

# Créer le dossier backups
mkdir -p "$BACKUP_DIR"

# ═══ 1. BACKUP QUOTES ═══
echo "📦 [1/5] Backup quotes..."
QUOTES_FILE="$BACKUP_DIR/quotes-backup-$TIMESTAMP.json"
curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/quotes?pageSize=100&key=${API_KEY}" > "$QUOTES_FILE"
QUOTES_COUNT=$(cat "$QUOTES_FILE" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('documents',[])))")
echo "   ✅ $QUOTES_COUNT quotes sauvegardés → $QUOTES_FILE"

# ═══ 2. BACKUP PARTNERS ═══
echo "📦 [2/5] Backup partners..."
PARTNERS_FILE="$BACKUP_DIR/partners-backup-$TIMESTAMP.json"
curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/partners?pageSize=50&key=${API_KEY}" > "$PARTNERS_FILE"
PARTNERS_COUNT=$(cat "$PARTNERS_FILE" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('documents',[])))")
echo "   ✅ $PARTNERS_COUNT partners sauvegardés → $PARTNERS_FILE"

# ═══ 3. DELETE QUOTES ═══
echo "🗑️  [3/5] Suppression quotes..."
DELETED_COUNT=0
for doc_path in $(cat "$QUOTES_FILE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for doc in data.get('documents', []):
    name = doc.get('name', '')
    print(name)
"); do
  curl -s -X DELETE "${doc_path}?key=${API_KEY}" > /dev/null
  DELETED_COUNT=$((DELETED_COUNT + 1))
done
echo "   ✅ $DELETED_COUNT quotes supprimés"

# ═══ 4. DELETE COUNTERS DVS_* et FA_* ═══
echo "🗑️  [4/5] Reset counters DVS_* et FA_*..."
COUNTERS=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/counters?key=${API_KEY}")
COUNTERS_DELETED=0
for doc_path in $(echo "$COUNTERS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for doc in data.get('documents', []):
    name = doc.get('name', '')
    doc_id = name.split('/')[-1]
    if doc_id.startswith('DVS_') or doc_id.startswith('FA_'):
        print(name)
"); do
  curl -s -X DELETE "${doc_path}?key=${API_KEY}" > /dev/null
  COUNTERS_DELETED=$((COUNTERS_DELETED + 1))
done
echo "   ✅ $COUNTERS_DELETED compteurs supprimés"

# ═══ 5. RAPPORT FINAL ═══
echo ""
echo "════════════════════════════════════════════════"
echo "  📊 RAPPORT FINAL"
echo "════════════════════════════════════════════════"
echo "  Quotes sauvegardés  : $QUOTES_COUNT"
echo "  Quotes supprimés    : $DELETED_COUNT"
echo "  Partners backupés   : $PARTNERS_COUNT"
echo "  Counters supprimés  : $COUNTERS_DELETED"
echo ""
echo "  Backups:"
echo "    - $QUOTES_FILE"
echo "    - $PARTNERS_FILE"
echo ""
echo "✅ MIGRATION-1 terminée avec succès"
echo "════════════════════════════════════════════════"
