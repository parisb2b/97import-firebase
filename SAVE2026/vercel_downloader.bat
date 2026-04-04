@echo off
chcp 65001 >nul
echo ========================================
echo  EXTRACTION VERCEL - SANS TOKEN
echo ========================================
echo.
echo Ce script va telecharger toutes les donnees
echo publiques depuis le site Vercel.
echo.
echo URL : https://97import-m3e0s8pqz-parisb2bs-projects.vercel.app
echo.
echo ========================================
echo.

:: Verifier si Python est installe
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installe ou n'est pas dans le PATH.
    echo.
    echo Veuillez installer Python depuis :
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ Python detecte
echo.

:: Installer les dependances si necessaire
echo 📦 Verification des dependances...
echo    - requests
echo    - beautifulsoup4
pip install requests beautifulsoup4 -q
if errorlevel 1 (
    echo ⚠️  Impossible d'installer les dependances automatiquement.
    echo Veuillez executer : pip install requests beautifulsoup4
    pause
    exit /b 1
)
echo ✅ Dependances OK
echo.

:: Lancer le script Python
echo 🚀 Lancement de l'extraction...
echo.
python "C:\DATA-MC-2030\97IMPORT\SAVE2026\vercel_downloader.py"

if errorlevel 1 (
    echo.
    echo ❌ L'extraction a rencontre une erreur.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Extraction terminee !
echo ========================================
echo.
pause
