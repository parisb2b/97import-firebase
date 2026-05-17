#!/bin/bash
set -u
export LANG=C.UTF-8
export LC_ALL=C.UTF-8

cd /c/DATA-MC-2030/97import-firebase || exit 1
mkdir -p DP

echo "=== V163.2 restart clean ===" | tee DP/v163-restart-clean.log
date '+%d/%m/%Y %H:%M:%S' | tee -a DP/v163-restart-clean.log

# Nettoyage cache Vite uniquement.
rm -rf node_modules/.vite

# Diagnostic ciblé des ports du projet.
netstat -ano 2>/dev/null | grep -E ':9100|:8081|:9200|:4001|:5173' | tee -a DP/v163-restart-clean.log || true

# Relance Firebase Emulator Suite en local.
(npx firebase emulators:start --import=./firebase_data --export-on-exit --project=importok-6ef77 > DP/firebase-v163.log 2>&1 &)

# Attente UI emulator.
for i in $(seq 1 60); do
  if curl -sS --max-time 2 http://127.0.0.1:4001/ >/dev/null 2>&1; then
    echo "Firebase Emulator UI ready" | tee -a DP/v163-restart-clean.log
    break
  fi
  sleep 1
done

# Relance Vite en IPv4 strict.
(npm run dev -- --host 127.0.0.1 --port 5173 --strictPort > DP/vite-v163.log 2>&1 &)

for i in $(seq 1 60); do
  if curl -sS --max-time 2 http://127.0.0.1:5173/ >/dev/null 2>&1; then
    echo "Vite ready" | tee -a DP/v163-restart-clean.log
    break
  fi
  sleep 1
done

echo "URL application: http://127.0.0.1:5173" | tee -a DP/v163-restart-clean.log
echo "URL emulator UI: http://127.0.0.1:4001" | tee -a DP/v163-restart-clean.log
