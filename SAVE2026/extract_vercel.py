#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'extraction de données depuis Vercel via l'API REST.
Objectif : Télécharger les fichiers statiques (images, PDF) et générer un rapport.

Auteur : StepFun
Date : Avril 2026
"""

import os
import sys
import requests
import json
from datetime import datetime
from pathlib import Path

# =============================================
# CONFIGURATION
# =============================================

# Project ID (fourni)
PROJECT_ID = "prj_jhYpQpP3WSwMXrsgzQcElM84A4sq"
PROJECT_NAME = "97import-m3e0s8pqz-parisb2bs-projects"
DEPLOYMENT_URL = f"https://{PROJECT_NAME}.vercel.app"
BASE_URL = "https://api.vercel.com"

# Dossiers de sortie
OUTPUT_DIR = Path("C:/DATA-MC-2030/97IMPORT/SAVE2026/04_Site_Structure")
IMAGES_DIR = Path("C:/DATA-MC-2030/97IMPORT/SAVE2026/02_Images/vercel")
PDF_DIR = Path("C:/DATA-MC-2030/97IMPORT/SAVE2026/03_PDF/vercel")
REPORTS_DIR = Path("C:/DATA-MC-2030/97IMPORT/SAVE2026/06_Reports")

# Créer les dossiers
for dir_path in [OUTPUT_DIR, IMAGES_DIR, PDF_DIR, REPORTS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# =============================================
# FONCTIONS UTILITAIRES
# =============================================

def get_vercel_token():
    """Récupérer le token Vercel depuis les variables d'environnement ou l'utilisateur."""
    token = os.getenv("VERCEL_TOKEN")
    
    if not token:
        print("\n" + "=" * 60)
        print("🔐 TOKEN VERCEL REQUIS")
        print("=" * 60)
        print("\nLe token Vercel est nécessaire pour accéder à l'API.")
        print("\nPour obtenir un token :")
        print("  1. Connectez-vous à https://vercel.com/account/tokens")
        print("  2. Cliquez sur 'Create Token'")
        print("  3. Donnez un nom au token (ex: 'Extraction 97import')")
        print("  4. Copiez le token généré")
        print("\n" + "-" * 60)
        token = input("\nEntrez votre token Vercel : ").strip()
        
        if not token:
            print("❌ Token non fourni. Arrêt du script.")
            sys.exit(1)
    
    return token

def get_headers(token):
    """Générer les headers d'authentification pour l'API Vercel."""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def test_connection(token):
    """Tester la connexion à l'API Vercel."""
    print("\n🔌 Test de connexion à l'API Vercel...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/v9/user",
            headers=get_headers(token),
            timeout=10
        )
        response.raise_for_status()
        user_data = response.json()
        
        print(f"✅ Connexion réussie !")
        print(f"   Utilisateur : {user_data.get('user', {}).get('username', 'N/A')}")
        print(f"   Email : {user_data.get('user', {}).get('email', 'N/A')}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Échec de la connexion : {e}")
        if hasattr(e.response, 'status_code'):
            if e.response.status_code == 401:
                print("   → Token invalide ou expiré")
            elif e.response.status_code == 403:
                print("   → Accès refusé (permissions insuffisantes)")
        return False

def get_project(token):
    """Récupérer les informations du projet."""
    print(f"\n📁 Récupération du projet : {PROJECT_ID}")
    
    try:
        response = requests.get(
            f"{BASE_URL}/v9/projects/{PROJECT_ID}",
            headers=get_headers(token),
            timeout=10
        )
        response.raise_for_status()
        project_data = response.json()
        
        print(f"✅ Projet trouvé : {project_data.get('name', 'N/A')}")
        print(f"   Framework : {project_data.get('framework', 'N/A')}")
        print(f"   URL : {project_data.get('latestDeployments', [{}])[0].get('alias', ['N/A'])[0]}")
        
        return project_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur lors de la récupération du projet : {e}")
        return None

def get_deployments(token, limit=10):
    """Récupérer la liste des déploiements du projet."""
    print(f"\n🚀 Récupération des déploiements (limit: {limit})...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/v6/deployments",
            headers=get_headers(token),
            params={
                "projectId": PROJECT_ID,
                "limit": limit
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        deployments = data.get("deployments", [])
        
        print(f"✅ {len(deployments)} déploiement(s) trouvé(s)")
        
        for i, dep in enumerate(deployments[:3], 1):
            print(f"   {i}. {dep.get('id', 'N/A')[:20]}... - {dep.get('state', 'N/A')} - {dep.get('createdAt', 'N/A')}")
        
        return deployments
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur lors de la récupération des déploiements : {e}")
        return []

def get_deployment_files(token, deployment_id):
    """Lister les fichiers d'un déploiement spécifique."""
    print(f"\n📂 Récupération des fichiers du déploiement : {deployment_id[:20]}...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/v6/deployments/{deployment_id}/files",
            headers=get_headers(token),
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        # La réponse peut être une liste ou un dict avec 'files'
        if isinstance(data, list):
            files = data
        else:
            files = data.get("files", [])
        
        print(f"✅ {len(files)} fichier(s) trouvé(s)")
        return files
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur lors de la récupération des fichiers : {e}")
        return []

def download_file(url, output_path):
    """Télécharger un fichier depuis une URL."""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        return True
        
    except Exception as e:
        print(f"   ⚠️  Erreur téléchargement : {e}")
        return False

def extract_static_files(token, deployment_url):
    """Extraire les fichiers statiques (images, PDF) depuis l'URL du déploiement."""
    print(f"\n🌐 Analyse du site : {deployment_url}")
    
    try:
        response = requests.get(deployment_url, timeout=30)
        response.raise_for_status()
        html_content = response.text
        
        # Chercher les URLs d'images et PDF dans le HTML
        import re
        
        # Patterns pour trouver les URLs
        patterns = {
            'images': r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"\'<>]*)?',
            'pdf': r'https?://[^\s"\'<>]+\.(?:pdf)(?:\?[^\s"\'<>]*)?'
        }
        
        found_files = {'images': [], 'pdf': []}
        
        for file_type, pattern in patterns.items():
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            found_files[file_type] = list(set(matches))  # Dédupliquer
            print(f"   📎 {len(found_files[file_type])} {file_type}(s) trouvé(s)")
        
        return found_files
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse du site : {e}")
        return {'images': [], 'pdf': []}

def download_files(files_data):
    """Télécharger les fichiers trouvés."""
    print("\n📥 Téléchargement des fichiers...")
    
    downloaded = []
    
    # Télécharger les images
    for url in files_data.get('images', []):
        filename = os.path.basename(url.split('?')[0])
        if not filename:
            filename = f"image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        
        output_path = IMAGES_DIR / filename
        
        if download_file(url, output_path):
            size = output_path.stat().st_size
            downloaded.append({
                'name': filename,
                'type': 'image',
                'url': url,
                'local_path': str(output_path),
                'size_bytes': size,
                'size_kb': round(size / 1024, 2)
            })
            print(f"   ✅ {filename} ({size / 1024:.1f} Ko)")
    
    # Télécharger les PDF
    for url in files_data.get('pdf', []):
        filename = os.path.basename(url.split('?')[0])
        if not filename:
            filename = f"document_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        output_path = PDF_DIR / filename
        
        if download_file(url, output_path):
            size = output_path.stat().st_size
            downloaded.append({
                'name': filename,
                'type': 'pdf',
                'url': url,
                'local_path': str(output_path),
                'size_bytes': size,
                'size_kb': round(size / 1024, 2)
            })
            print(f"   ✅ {filename} ({size / 1024:.1f} Ko)")
    
    return downloaded

def generate_json_report(files_data, downloaded):
    """Générer un rapport JSON."""
    report = {
        'extraction_date': datetime.now().isoformat(),
        'project_id': PROJECT_ID,
        'project_name': PROJECT_NAME,
        'deployment_url': DEPLOYMENT_URL,
        'summary': {
            'total_files_found': len(files_data.get('images', [])) + len(files_data.get('pdf', [])),
            'images_found': len(files_data.get('images', [])),
            'pdf_found': len(files_data.get('pdf', [])),
            'total_downloaded': len(downloaded),
            'images_downloaded': len([f for f in downloaded if f['type'] == 'image']),
            'pdf_downloaded': len([f for f in downloaded if f['type'] == 'pdf'])
        },
        'files': downloaded
    }
    
    report_path = OUTPUT_DIR / 'vercel_extraction_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n📝 Rapport JSON généré : {report_path}")
    return report_path

def generate_csv_report(downloaded):
    """Générer un rapport CSV."""
    import csv
    
    csv_path = OUTPUT_DIR / 'vercel_files_metadata.csv'
    
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Nom', 'Type', 'Taille (Ko)', 'URL source', 'Chemin local', 'Date'])
        
        for file in downloaded:
            writer.writerow([
                file['name'],
                file['type'],
                file['size_kb'],
                file['url'],
                file['local_path'],
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ])
    
    print(f"📊 Rapport CSV généré : {csv_path}")
    return csv_path

def generate_summary(report):
    """Générer un fichier résumé."""
    summary_path = REPORTS_DIR / 'vercel_extraction_summary.txt'
    
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("RAPPORT D'EXTRACTION VERCEL\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Date : {report['extraction_date']}\n")
        f.write(f"Projet : {report['project_name']}\n")
        f.write(f"URL : {report['deployment_url']}\n\n")
        f.write("-" * 60 + "\n")
        f.write("RÉSUMÉ\n")
        f.write("-" * 60 + "\n\n")
        f.write(f"Fichiers trouvés : {report['summary']['total_files_found']}\n")
        f.write(f"  - Images : {report['summary']['images_found']}\n")
        f.write(f"  - PDF : {report['summary']['pdf_found']}\n\n")
        f.write(f"Fichiers téléchargés : {report['summary']['total_downloaded']}\n")
        f.write(f"  - Images : {report['summary']['images_downloaded']}\n")
        f.write(f"  - PDF : {report['summary']['pdf_downloaded']}\n\n")
        f.write("-" * 60 + "\n")
        f.write("DOSSIERS DE SORTIE\n")
        f.write("-" * 60 + "\n\n")
        f.write(f"Images : {IMAGES_DIR}\n")
        f.write(f"PDF : {PDF_DIR}\n")
        f.write(f"Rapports : {OUTPUT_DIR}\n\n")
        f.write("=" * 60 + "\n")
    
    print(f"📄 Résumé généré : {summary_path}")
    return summary_path

# =============================================
# EXÉCUTION PRINCIPALE
# =============================================

def main():
    """Fonction principale."""
    print("=" * 60)
    print("🚀 EXTRACTION VERCEL - 97import.com")
    print("=" * 60)
    print(f"Project ID : {PROJECT_ID}")
    print(f"URL : {DEPLOYMENT_URL}")
    print("=" * 60)
    
    # Étape 1 : Récupérer le token
    token = get_vercel_token()
    
    # Étape 2 : Tester la connexion
    if not test_connection(token):
        print("\n❌ Impossible de continuer sans connexion valide.")
        sys.exit(1)
    
    # Étape 3 : Récupérer les infos du projet
    project = get_project(token)
    if not project:
        print("\n⚠️  Impossible de récupérer les infos du projet, mais on continue...")
    
    # Étape 4 : Récupérer les déploiements
    deployments = get_deployments(token, limit=5)
    
    # Étape 5 : Extraire les fichiers statiques depuis le site
    files_data = extract_static_files(token, DEPLOYMENT_URL)
    
    # Étape 6 : Télécharger les fichiers
    downloaded = download_files(files_data)
    
    # Étape 7 : Générer les rapports
    print("\n" + "=" * 60)
    print("📝 GÉNÉRATION DES RAPPORTS")
    print("=" * 60)
    
    json_report = generate_json_report(files_data, downloaded)
    csv_report = generate_csv_report(downloaded)
    
    # Charger le rapport JSON pour le résumé
    with open(json_report, 'r', encoding='utf-8') as f:
        report_data = json.load(f)
    summary_report = generate_summary(report_data)
    
    # Afficher le résumé final
    print("\n" + "=" * 60)
    print("✅ EXTRACTION TERMINÉE")
    print("=" * 60)
    print(f"\n📊 Statistiques :")
    print(f"   Fichiers trouvés : {report_data['summary']['total_files_found']}")
    print(f"   Fichiers téléchargés : {report_data['summary']['total_downloaded']}")
    print(f"\n📁 Dossiers :")
    print(f"   Images : {IMAGES_DIR}")
    print(f"   PDF : {PDF_DIR}")
    print(f"   Rapports : {OUTPUT_DIR}")
    print(f"\n📄 Rapports générés :")
    print(f"   JSON : {json_report}")
    print(f"   CSV : {csv_report}")
    print(f"   TXT : {summary_report}")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Extraction interrompue par l'utilisateur.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Erreur fatale : {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
