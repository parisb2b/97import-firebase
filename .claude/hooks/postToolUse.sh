#!/bin/bash
export LANG=C.UTF-8
export LC_ALL=C.UTF-8

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | C:/DATA-MC-2030/python/python.exe -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null)
TOOL_INPUT=$(echo "$INPUT" | C:/DATA-MC-2030/python/python.exe -c "import sys,json; print(json.load(sys.stdin).get('tool_input',''))" 2>/dev/null)

if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
    # Extraire le chemin du fichier depuis le JSON d'entrée
    FILE_PATH=$(echo "$TOOL_INPUT" | C:/DATA-MC-2030/python/python.exe -c "import sys,json; print(json.loads(sys.stdin.read()).get('file_path',''))" 2>/dev/null)
    if [ -n "$FILE_PATH" ]; then
        if [[ "$FILE_PATH" == *".ts" ]] || [[ "$FILE_PATH" == *".tsx" ]] || [[ "$FILE_PATH" == *".json" ]] || [[ "$FILE_PATH" == *".css" ]]; then
            echo "✨ Formatage automatique de $FILE_PATH avec Prettier..."
            npx prettier --write "$FILE_PATH" > /dev/null 2>&1
        fi
    fi
fi

exit 0
