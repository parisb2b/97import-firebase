#!/bin/bash
export LANG=C.UTF-8

echo "🔍 Vérification des données Firebase locales..."

# Si le dossier de travail n'existe pas ou est vide, on restaure le Master
if [ ! -d "firebase_data" ] || [ -z "$(ls -A firebase_data 2>/dev/null)" ]; then
    echo "⚠️ firebase_data introuvable ou vide ! Restauration depuis le Master..."
    cp -r firebase_data_master/* firebase_data/ 2>/dev/null || echo "Restauration partielle ou master vide."
else
    echo "✅ firebase_data trouvé."
fi

echo "🔥 Lancement des émulateurs (0.0.0.0)..."
firebase emulators:start --import=./firebase_data --export-on-exit=./firebase_data --project importok-6ef77
