#!/bin/bash
export LANG=C.UTF-8
export LC_ALL=C.UTF-8

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | C:/DATA-MC-2030/python/python.exe -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null)
TOOL_INPUT=$(echo "$INPUT" | C:/DATA-MC-2030/python/python.exe -c "import sys,json; print(json.load(sys.stdin).get('tool_input',''))" 2>/dev/null)

# 1. Protection contre les commandes dangereuses
if [ "$TOOL_NAME" = "Bash" ]; then
    if [[ "$TOOL_INPUT" == *"rm -rf"* ]] || [[ "$TOOL_INPUT" == *"git push --force"* ]] || [[ "$TOOL_INPUT" == *"DROP TABLE"* ]]; then
        echo "❌ ERREUR : Commande destructrice bloquée par le hook PreToolUse !"
        exit 1
    fi
fi

# 2. Protection des fichiers sensibles
if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
    if [[ "$TOOL_INPUT" == *".env"* ]] || [[ "$TOOL_INPUT" == *".git"* ]]; then
        echo "❌ ERREUR : Tentative de modification d'un fichier sensible (.env ou .git) bloquée !"
        exit 1
    fi
fi

exit 0
