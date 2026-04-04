@echo off
chcp 65001 >nul
echo ========================================
echo  EXTRACTION VERCEL - 97import.com
echo ========================================
echo.
echo Ce script va extraire les donnees du site Vercel.
echo.
echo Configuration :
echo   - Project ID : prj_jhYpQpP3WSwMXrsgzQcElM84A4sq
echo   - URL : https://97import-m3e0s8pqz-parisb2bs-projects.vercel.app
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
pip install requests -q
if errorlevel 1 (
    echo ⚠️  Impossible d'installer les dependances automatiquement.
    echo Veuillez executer : pip install requests
    pause
    exit /b 1
)
echo ✅ Dependances OK
echo.

:: Lancer le script Python
echo 🚀 Lancement de l'extraction...
echo.
python "C:\DATA-MC-2030\97IMPORT\SAVE2026\extract_vercel.py"

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
