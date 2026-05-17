#!/bin/bash
set -u
export LANG=C.UTF-8
export LC_ALL=C.UTF-8

OUTPUT="DP/V159-SCAN-INTEGRAL-CODE-SOURCE.md"
MANIFEST="DP/V159-MANIFEST-CODE-SOURCE.csv"
FILELIST="DP/V159-FILELIST.txt"
EXCLUDED="DP/V159-EXCLUDED-FILES.txt"
SUMMARY="DP/v159-summary.log"

mkdir -p DP

detect_lang() {
  case "$1" in
    *.ts|*.tsx) echo "typescript" ;;
    *.js|*.jsx|*.mjs|*.cjs) echo "javascript" ;;
    *.json) echo "json" ;;
    *.rules) echo "javascript" ;;
    *.css|*.scss) echo "css" ;;
    *.html) echo "html" ;;
    *.md) echo "markdown" ;;
    *.yml|*.yaml) echo "yaml" ;;
    *.sh) echo "bash" ;;
    *.ps1) echo "powershell" ;;
    *.env|.env|.env.local|.firebaserc|.gitignore) echo "bash" ;;
    *.csv) echo "csv" ;;
    *.sql) echo "sql" ;;
    *) echo "text" ;;
  esac
}

category_for() {
  case "$1" in
    ./src/*) echo "source" ;;
    ./scripts/*) echo "script" ;;
    ./tests/*) echo "test" ;;
    ./functions/*) echo "functions" ;;
    ./public/*) echo "public" ;;
    ./DP/*) echo "documentation_dp" ;;
    ./firestore.rules|./storage.rules) echo "firebase_rules" ;;
    ./firebase.json|./.firebaserc|./.env|./.env.local) echo "firebase_config" ;;
    ./package.json|./package-lock.json|./vite.config.ts|./tsconfig*.json|./playwright.config.*) echo "project_config" ;;
    *) echo "other_text" ;;
  esac
}

safe_cat_file() {
  local file="$1"
  if [[ "$file" == "./.env" || "$file" == "./.env.local" || "$file" == *.env ]]; then
    awk '
      /^[[:space:]]*#/ { print; next }
      /^[[:space:]]*$/ { print; next }
      /^[[:space:]]*VITE_/ { print; next }
      /^[A-Za-z_][A-Za-z0-9_]*=/ {
        split($0, a, "=");
        key=a[1];
        print key "=[REDACTED_SECRET_IF_PRIVATE]";
        next
      }
      { print }
    ' "$file"
  else
    cat "$file"
  fi
}

is_text_candidate() {
  case "$1" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.rules|*.env|.env|.env.local|.firebaserc|.gitignore|*.md|*.txt|*.csv|*.css|*.scss|*.html|*.yml|*.yaml|*.sh|*.ps1|*.c|*.h|*.sql)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

echo "# V159 — SCAN INTEGRAL DU CODE SOURCE 97IMPORT" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "**Date :** $(date '+%d/%m/%Y %H:%M:%S')" >> "$OUTPUT"
echo "**Projet :** 97import / importok-6ef77" >> "$OUTPUT"
echo "**Emplacement :** C:\\DATA-MC-2030\\97import-firebase\\" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "## 1. Environnement local" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo '```bash' >> "$OUTPUT"
echo "pwd: $(pwd)" >> "$OUTPUT"
echo "date: $(date '+%d/%m/%Y %H:%M:%S')" >> "$OUTPUT"
echo "node: $(node -v 2>/dev/null || echo 'node introuvable')" >> "$OUTPUT"
echo "npm: $(npm -v 2>/dev/null || echo 'npm introuvable')" >> "$OUTPUT"
echo "package version: $(node -p "require('./package.json').version" 2>/dev/null || echo 'package.json introuvable')" >> "$OUTPUT"
echo "git branch: $(git branch --show-current 2>/dev/null || echo 'git indisponible')" >> "$OUTPUT"
echo "git commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'git indisponible')" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "## 2. Git status" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo '```bash' >> "$OUTPUT"
git status --short 2>/dev/null >> "$OUTPUT" || echo "git status indisponible" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
echo "" >> "$OUTPUT"

: > "$EXCLUDED"

find . \
  \( -path "./.git" \
     -o -path "./node_modules" \
     -o -path "./functions/node_modules" \
     -o -path "./dist" \
     -o -path "./build" \
     -o -path "./coverage" \
     -o -path "./.firebase" \
     -o -path "./firebase_data" \
     -o -path "./storage_export" \
     -o -path "./playwright-report" \
     -o -path "./test-results" \
     -o -path "./.cache" \
     -o -path "./.vite" \) -prune -o \
  -type f -print | sort | while IFS= read -r file; do
    base="${file##*/}"

    if [[ "$file" == ./DP/V159-* || "$file" == ./DP/v159-* ]]; then
      echo "$file" >> "$EXCLUDED"
      continue
    fi

    case "$base" in
      *.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.svg|*.pdf|*.doc|*.docx|*.xls|*.xlsx|*.ppt|*.pptx|*.zip|*.rar|*.7z|*.tar|*.gz|*.mp4|*.mov|*.avi|*.ttf|*.otf|*.woff|*.woff2|*.pem|*.key)
        echo "$file" >> "$EXCLUDED"
        continue ;;
    esac

    case "$file" in
      *serviceAccount*|*ServiceAccount*|*SERVICEACCOUNT*)
        echo "$file" >> "$EXCLUDED"
        continue ;;
    esac

    if is_text_candidate "$base"; then
      echo "$file"
    else
      echo "$file" >> "$EXCLUDED"
    fi
  done > "$FILELIST"

echo "path,lines,bytes,sha256,category,status" > "$MANIFEST"

FILES_FOUND=0
TOTAL_LINES=0
TOTAL_BYTES=0
READ_ERRORS=0

echo "## 3. Liste des fichiers scannes" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo '```text' >> "$OUTPUT"
cat "$FILELIST" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "## 4. Contenu complet des fichiers" >> "$OUTPUT"
echo "" >> "$OUTPUT"

while IFS= read -r FILE; do
  [ -z "$FILE" ] && continue

  DISPLAY_PATH="${FILE#./}"
  LANG_CODE="$(detect_lang "$DISPLAY_PATH")"
  CATEGORY="$(category_for "$FILE")"

  if [ -f "$FILE" ] && [ -r "$FILE" ]; then
    LINES="$(wc -l < "$FILE" 2>/dev/null | tr -d ' ' || echo 0)"
    BYTES="$(wc -c < "$FILE" 2>/dev/null | tr -d ' ' || echo 0)"
    HASH="$(sha256sum "$FILE" 2>/dev/null | awk '{print $1}' || echo 'sha256_unavailable')"

    FILES_FOUND=$((FILES_FOUND + 1))
    TOTAL_LINES=$((TOTAL_LINES + LINES))
    TOTAL_BYTES=$((TOTAL_BYTES + BYTES))

    printf '"%s",%s,%s,"%s","%s","OK"\n' "$DISPLAY_PATH" "$LINES" "$BYTES" "$HASH" "$CATEGORY" >> "$MANIFEST"

    echo "## 📄 $DISPLAY_PATH" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    echo "| Metadonnee | Valeur |" >> "$OUTPUT"
    echo "|---|---|" >> "$OUTPUT"
    echo "| Chemin | \`$DISPLAY_PATH\` |" >> "$OUTPUT"
    echo "| Categorie | \`$CATEGORY\` |" >> "$OUTPUT"
    echo "| Lignes | $LINES |" >> "$OUTPUT"
    echo "| Octets | $BYTES |" >> "$OUTPUT"
    echo "| SHA-256 | \`$HASH\` |" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    echo '```'"$LANG_CODE" >> "$OUTPUT"
    safe_cat_file "$FILE" >> "$OUTPUT" 2>/dev/null || {
      echo "[ERREUR_LECTURE_CONTENU]"
      READ_ERRORS=$((READ_ERRORS + 1))
    }
    echo "" >> "$OUTPUT"
    echo '```' >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    echo "---" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
  else
    READ_ERRORS=$((READ_ERRORS + 1))
    printf '"%s",0,0,"","%s","READ_ERROR"\n' "$DISPLAY_PATH" "$CATEGORY" >> "$MANIFEST"
  fi
done < "$FILELIST"

EXCLUDED_COUNT="$(wc -l < "$EXCLUDED" 2>/dev/null | tr -d ' ' || echo 0)"
SCAN_BYTES="$(wc -c < "$OUTPUT" 2>/dev/null | tr -d ' ' || echo 0)"

{
  echo "## 5. Resume final du scan"
  echo ""
  echo "| Indicateur | Valeur |"
  echo "|---|---:|"
  echo "| Fichiers scannes | $FILES_FOUND |"
  echo "| Fichiers exclus | $EXCLUDED_COUNT |"
  echo "| Lignes totales | $TOTAL_LINES |"
  echo "| Octets source totaux | $TOTAL_BYTES |"
  echo "| Erreurs de lecture | $READ_ERRORS |"
  echo "| Taille du Markdown | $SCAN_BYTES octets |"
  echo ""
  echo "### Fichiers exclus"
  echo ""
  echo '```text'
  cat "$EXCLUDED" 2>/dev/null
  echo '```'
} >> "$OUTPUT"

{
  echo "V159_SCAN_OUTPUT=$OUTPUT"
  echo "V159_MANIFEST=$MANIFEST"
  echo "V159_FILELIST=$FILELIST"
  echo "V159_EXCLUDED=$EXCLUDED"
  echo "V159_FILES_FOUND=$FILES_FOUND"
  echo "V159_EXCLUDED_COUNT=$EXCLUDED_COUNT"
  echo "V159_TOTAL_LINES=$TOTAL_LINES"
  echo "V159_TOTAL_BYTES=$TOTAL_BYTES"
  echo "V159_READ_ERRORS=$READ_ERRORS"
  echo "V159_SCAN_BYTES=$SCAN_BYTES"
} > "$SUMMARY"

echo "SCAN DONE: $FILES_FOUND files, $TOTAL_LINES lines, $READ_ERRORS errors"
