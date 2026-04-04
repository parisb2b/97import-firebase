#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour télécharger toutes les données publiques depuis Vercel.
Site : https://97import-m3e0s8pqz-parisb2bs-projects.vercel.app
Sans authentification (site public).

Auteur : StepFun
Date : Avril 2026
"""

import os
import sys
import requests
import json
import csv
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from datetime import datetime
from pathlib import Path
import re

# =============================================
# CONFIGURATION
# =============================================
BASE_URL = "https://97import-m3e0s8pqz-parisb2bs-projects.vercel.app"
OUTPUT_DIR = Path("C:/DATA-MC-2030/97IMPORT/SAVE2026")

# Sous-dossiers
SUBDIRS = {
    "html": OUTPUT_DIR / "04_Site_Structure" / "html",
    "css": OUTPUT_DIR / "04_Site_Structure" / "css",
    "js": OUTPUT_DIR / "04_Site_Structure" / "js",
    "images": OUTPUT_DIR / "02_Images" / "vercel",
    "pdf": OUTPUT_DIR / "03_PDF" / "vercel",
    "catalogue": OUTPUT_DIR / "04_Site_Structure" / "catalogue",
    "data": OUTPUT_DIR / "04_Site_Structure" / "data"
}

# Extensions de fichiers à télécharger
FILE_EXTENSIONS = {
    'images': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.ico'],
    'pdf': ['.pdf'],
    'css': ['.css'],
    'js': ['.js'],
    'data': ['.json', '.xml', '.csv']
}

# =============================================
# FONCTIONS UTILITAIRES
# =============================================

def create_directories():
    """Créer tous les sous-dossiers nécessaires."""
    print("📁 Création des dossiers...")
    for subdir in SUBDIRS.values():
        subdir.mkdir(parents=True, exist_ok=True)
        print(f"   ✅ {subdir}")

def download_file(url, output_path, file_type=""):
    """Télécharger un fichier depuis une URL."""
    try:
        # Vérifier si le fichier existe déjà
        if output_path.exists():
            print(f"   ⏭️  Déjà présent : {output_path.name}")
            return True
        
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        size = output_path.stat().st_size
        size_str = f"{size/1024:.1f} Ko" if size < 1024*1024 else f"{size/(1024*1024):.2f} Mo"
        print(f"   ✅ {file_type} : {output_path.name} ({size_str})")
        return True
        
    except Exception as e:
        print(f"   ❌ Échec : {url} -> {e}")
        return False

def get_file_extension(url):
    """Extraire l'extension d'un fichier depuis son URL."""
    parsed = urlparse(url)
    path = parsed.path
    return os.path.splitext(path)[1].lower()

def get_filename_from_url(url):
    """Extraire le nom de fichier depuis une URL."""
    parsed = urlparse(url)
    path = parsed.path
    filename = os.path.basename(path)
    # Nettoyer le nom de fichier
    filename = re.sub(r'[^\w\-\.]', '_', filename)
    if not filename:
        filename = f"file_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    return filename

def determine_file_type(url):
    """Déterminer le type de fichier basé sur l'extension."""
    ext = get_file_extension(url)
    
    for file_type, extensions in FILE_EXTENSIONS.items():
        if ext in extensions:
            return file_type
    
    return None

def scrape_page(url, visited=None):
    """Scraper une page et extraire tous les liens et ressources."""
    if visited is None:
        visited = set()
    
    if url in visited:
        return []
    
    visited.add(url)
    
    print(f"\n🔍 Analyse : {url}")
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        resources = {
            'images': [],
            'css': [],
            'js': [],
            'pdf': [],
            'data': [],
            'links': []
        }
        
        # 1. Extraire les images
        for tag in soup.find_all(['img', 'source']):
            for attr in ['src', 'srcset', 'data-src']:
                src = tag.get(attr)
                if src:
                    # Gérer srcset (plusieurs URLs)
                    if attr == 'srcset':
                        urls = [u.strip().split()[0] for u in src.split(',')]
                    else:
                        urls = [src]
                    
                    for img_url in urls:
                        full_url = urljoin(url, img_url)
                        if determine_file_type(full_url) == 'images':
                            resources['images'].append(full_url)
        
        # 2. Extraire les CSS
        for tag in soup.find_all('link', rel='stylesheet'):
            href = tag.get('href')
            if href:
                full_url = urljoin(url, href)
                resources['css'].append(full_url)
        
        # 3. Extraire les JS
        for tag in soup.find_all('script', src=True):
            src = tag.get('src')
            if src:
                full_url = urljoin(url, src)
                resources['js'].append(full_url)
        
        # 4. Extraire les liens (PDF, pages, etc.)
        for tag in soup.find_all('a', href=True):
            href = tag.get('href')
            if href:
                full_url = urljoin(url, href)
                
                # Vérifier si c'est un PDF
                if determine_file_type(full_url) == 'pdf':
                    resources['pdf'].append(full_url)
                # Vérifier si c'est une page interne
                elif full_url.startswith(BASE_URL) and full_url not in visited:
                    resources['links'].append(full_url)
        
        # 5. Extraire les URLs depuis les styles inline (background-image, etc.)
        style_tags = soup.find_all(style=True)
        for tag in style_tags:
            style = tag.get('style', '')
            urls = re.findall(r'url\(["\']?([^"\')]+)["\']?\)', style)
            for img_url in urls:
                full_url = urljoin(url, img_url)
                if determine_file_type(full_url) == 'images':
                    resources['images'].append(full_url)
        
        # Dédupliquer
        for key in resources:
            resources[key] = list(set(resources[key]))
        
        print(f"   📊 Trouvé : {len(resources['images'])} images, {len(resources['css'])} CSS, {len(resources['js'])} JS, {len(resources['pdf'])} PDF, {len(resources['links'])} liens")
        
        return resources
        
    except Exception as e:
        print(f"   ❌ Erreur : {e}")
        return {'images': [], 'css': [], 'js': [], 'pdf': [], 'links': []}

def download_resources(resources):
    """Télécharger toutes les ressources trouvées."""
    downloaded = []
    
    # Télécharger les images
    print(f"\n📥 Téléchargement des images ({len(resources['images'])} trouvées)...")
    for img_url in resources['images']:
        filename = get_filename_from_url(img_url)
        output_path = SUBDIRS['images'] / filename
        if download_file(img_url, output_path, "IMG"):
            downloaded.append({
                'url': img_url,
                'filename': filename,
                'type': 'image',
                'local_path': str(output_path)
            })
    
    # Télécharger les CSS
    print(f"\n📥 Téléchargement des CSS ({len(resources['css'])} trouvés)...")
    for css_url in resources['css']:
        filename = get_filename_from_url(css_url)
        if not filename.endswith('.css'):
            filename += '.css'
        output_path = SUBDIRS['css'] / filename
        if download_file(css_url, output_path, "CSS"):
            downloaded.append({
                'url': css_url,
                'filename': filename,
                'type': 'css',
                'local_path': str(output_path)
            })
    
    # Télécharger les JS
    print(f"\n📥 Téléchargement des JS ({len(resources['js'])} trouvés)...")
    for js_url in resources['js']:
        filename = get_filename_from_url(js_url)
        if not filename.endswith('.js'):
            filename += '.js'
        output_path = SUBDIRS['js'] / filename
        if download_file(js_url, output_path, "JS"):
            downloaded.append({
                'url': js_url,
                'filename': filename,
                'type': 'js',
                'local_path': str(output_path)
            })
    
    # Télécharger les PDF
    print(f"\n📥 Téléchargement des PDF ({len(resources['pdf'])} trouvés)...")
    for pdf_url in resources['pdf']:
        filename = get_filename_from_url(pdf_url)
        if not filename.endswith('.pdf'):
            filename += '.pdf'
        output_path = SUBDIRS['pdf'] / filename
        if download_file(pdf_url, output_path, "PDF"):
            downloaded.append({
                'url': pdf_url,
                'filename': filename,
                'type': 'pdf',
                'local_path': str(output_path)
            })
    
    return downloaded

def save_html_page(url, output_path):
    """Sauvegarder une page HTML."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"   ✅ HTML : {output_path.name}")
        return True
        
    except Exception as e:
        print(f"   ❌ Échec HTML : {e}")
        return False

def generate_reports(downloaded, all_resources):
    """Générer les rapports."""
    print("\n" + "=" * 60)
    print("📝 GÉNÉRATION DES RAPPORTS")
    print("=" * 60)
    
    # 1. Rapport JSON
    report = {
        'extraction_date': datetime.now().isoformat(),
        'base_url': BASE_URL,
        'summary': {
            'total_downloaded': len(downloaded),
            'images': len([f for f in downloaded if f['type'] == 'image']),
            'css': len([f for f in downloaded if f['type'] == 'css']),
            'js': len([f for f in downloaded if f['type'] == 'js']),
            'pdf': len([f for f in downloaded if f['type'] == 'pdf'])
        },
        'files': downloaded
    }
    
    json_path = SUBDIRS['catalogue'] / 'vercel_extraction_report.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"✅ Rapport JSON : {json_path}")
    
    # 2. Rapport CSV
    csv_path = SUBDIRS['catalogue'] / 'vercel_files_metadata.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Nom', 'Type', 'URL source', 'Chemin local'])
        for file in downloaded:
            writer.writerow([file['filename'], file['type'], file['url'], file['local_path']])
    print(f"✅ Rapport CSV : {csv_path}")
    
    # 3. Résumé texte
    summary_path = OUTPUT_DIR / '06_Reports' / 'vercel_extraction_summary.txt'
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("RAPPORT D'EXTRACTION VERCEL (SANS TOKEN)\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Date : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"URL : {BASE_URL}\n\n")
        f.write("-" * 60 + "\n")
        f.write("RÉSUMÉ\n")
        f.write("-" * 60 + "\n\n")
        f.write(f"Total téléchargé : {len(downloaded)}\n")
        f.write(f"  Images : {report['summary']['images']}\n")
        f.write(f"  CSS : {report['summary']['css']}\n")
        f.write(f"  JS : {report['summary']['js']}\n")
        f.write(f"  PDF : {report['summary']['pdf']}\n\n")
        f.write("-" * 60 + "\n")
        f.write("RESSOURCES TROUVÉES (non téléchargées)\n")
        f.write("-" * 60 + "\n\n")
        f.write(f"Liens internes : {len(all_resources.get('links', []))}\n")
        for link in all_resources.get('links', [])[:10]:  # Limiter à 10
            f.write(f"  - {link}\n")
        if len(all_resources.get('links', [])) > 10:
            f.write(f"  ... et {len(all_resources['links']) - 10} autres\n")
        f.write("\n" + "=" * 60 + "\n")
    
    print(f"✅ Résumé : {summary_path}")
    
    return report

def main():
    """Fonction principale."""
    print("=" * 60)
    print("🚀 EXTRACTION VERCEL - SANS TOKEN")
    print("=" * 60)
    print(f"URL : {BASE_URL}")
    print(f"Dossier : {OUTPUT_DIR}")
    print("=" * 60)
    
    # 1. Créer les dossiers
    create_directories()
    
    # 2. Scraper la page principale
    print("\n" + "=" * 60)
    print("🔍 ANALYSE DU SITE")
    print("=" * 60)
    
    resources = scrape_page(BASE_URL)
    
    # 3. Sauvegarder la page HTML principale
    print("\n💾 Sauvegarde de la page HTML...")
    save_html_page(BASE_URL, SUBDIRS['html'] / 'index.html')
    
    # 4. Télécharger les ressources
    print("\n" + "=" * 60)
    print("📥 TÉLÉCHARGEMENT DES RESSOURCES")
    print("=" * 60)
    
    downloaded = download_resources(resources)
    
    # 5. Explorer les liens internes (limité à 5 pages pour éviter la boucle infinie)
    visited = {BASE_URL}
    links_to_visit = [url for url in resources.get('links', [])[:5] if url not in visited]
    
    for link in links_to_visit:
        if len(visited) >= 10:  # Limite de sécurité
            break
        
        link_resources = scrape_page(link, visited)
        link_downloaded = download_resources(link_resources)
        downloaded.extend(link_downloaded)
        
        # Sauvegarder la page HTML
        page_name = get_filename_from_url(link)
        if not page_name.endswith('.html'):
            page_name += '.html'
        save_html_page(link, SUBDIRS['html'] / page_name)
    
    # 6. Générer les rapports
    report = generate_reports(downloaded, resources)
    
    # 7. Afficher le résumé final
    print("\n" + "=" * 60)
    print("✅ EXTRACTION TERMINÉE")
    print("=" * 60)
    print(f"\n📊 Statistiques :")
    print(f"   Total téléchargé : {len(downloaded)}")
    print(f"   Images : {report['summary']['images']}")
    print(f"   CSS : {report['summary']['css']}")
    print(f"   JS : {report['summary']['js']}")
    print(f"   PDF : {report['summary']['pdf']}")
    print(f"\n📁 Dossiers :")
    for name, path in SUBDIRS.items():
        count = len(list(path.glob('*'))) if path.exists() else 0
        print(f"   {name} : {count} fichiers")
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
