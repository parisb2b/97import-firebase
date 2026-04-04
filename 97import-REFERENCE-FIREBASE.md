C'est parfaitement noté. La source des fichiers (la toute dernière version) est dans `C:\DATA-MC-2030\97IMPORT\97import2026_siteweb` et Claude Code doit appliquer ces mises à jour dans la destination `C:\DATA-MC-2030\97IMPORT`.

Voici le fichier **`97import-firebase.md`** finalisé avec cette précision cruciale sur les répertoires.  

***

```markdown
# 97import.com — Document de référence complet
## Architecture technologique : React 19 + Firebase + TypeScript
## Environnement : Windows local → déploiement Vercel

---

## 1. CHEMINS ET RÉPERTOIRES (TRÈS IMPORTANT)

* **Source (Dernière version exportée) :** `C:\DATA-MC-2030\97IMPORT\97import2026_siteweb`
* **Destination (Dossier de travail actif) :** `C:\DATA-MC-2030\97IMPORT`

*Note pour Claude Code : Tu dois analyser les fichiers de la **Source** pour mettre à jour ou remplacer les fichiers dans la **Destination**.*

---

## 2. ARCHITECTURE TECHNIQUE

* **Front-end :** React 19 + Vite 7 + TypeScript 
* **Interface Utilisateur (UI) :** shadcn/ui + styles intégrés ADMIN_COLORS (pour le back-office) 
* **Routage :** wouter 
* **Base de données et Serveur :** Firebase (Authentification + Firestore + Storage + Functions) 
* **Hébergement :** Vercel (déploiement direct après validation locale)
* **Messagerie :** Resend API via Firebase Cloud Functions 
* **Génération PDF :** jsPDF + jspdf-autotable 
* **Génération Excel :** SheetJS (xlsx) 
* **Nom de domaine :** 97import.com 

---

## 3. RÈGLES DE DÉVELOPPEMENT ABSOLUES (POUR CLAUDE CODE)

1. **ENCODAGE STRICT (UTF-8) :** Je dois forcer systématiquement l'encodage UTF-8 pour toutes les entrées/sorties console et lors de toute manipulation de fichiers (lecture ou écriture). Tous les scripts et processus doivent supporter nativement les caractères chinois (中文) et les accents français dans les chemins d'accès, les noms de fichiers et le code source.
2. **INTERDICTION DE PYTHON :** Aucun script Python ne doit être utilisé pour la migration ou la copie de fichiers. Toute refactorisation ou mise à jour depuis la **Source** vers la **Destination** doit être effectuée directement via tes capacités d'analyse et de manipulation de fichiers TypeScript/React.
3. **ESPACE DE TRAVAIL :** Ton terminal s'exécute dans la **Destination** (`C:\DATA-MC-2030\97IMPORT`).
4. **VALIDATION LOCALE :** Tester en local avant tout déploiement (`npm run dev`).
5. **COMPILATION :** La commande `npm run build` doit s'exécuter sans aucune erreur TypeScript avant de passer à l'hébergement.
6. **DÉPLOIEMENT :** Après validation locale, le déploiement se fait sur Vercel.

---

## 4. COMPTES DE TEST BACK-OFFICE 

| Email | Rôle | Mot de passe |
|-------|------|-----|
| parisb2b@gmail.com | admin | — |
| u1@sasfr.com | user | 20262026 |
| vip1@sasfr.com | vip | 20262026 |
| p1@sasfr.com | partner | 20262026 |

---

## 5. PLAN DE MISE À JOUR ET DE DÉPLOIEMENT

### PHASE 1 — Synchronisation Source -> Destination
```text
Claude Code doit comparer le code de C:\DATA-MC-2030\97IMPORT\97import2026_siteweb avec C:\DATA-MC-2030\97IMPORT.
Il doit intégrer les optimisations React 19 et écraser les fichiers obsolètes de la destination.
```

### PHASE 2 — Configuration Firebase
```powershell
# S'assurer que le .env.local pointe bien vers le projet Firebase en production.
# Vérifier les règles Storage (read: if true) et les données Firestore (multiplicateur x8 pour RMB).
```

### PHASE 3 — Compilation et Déploiement Vercel
```powershell
# 1. Vérification stricte des erreurs dans la Destination
npm run build

# 2. Installation de l'outil Vercel (si nécessaire)
npm install -g vercel

# 3. Connexion à Vercel
vercel login

# 4. Déploiement final en production
vercel --prod
```
```

Dès que vous avez sauvegardé ce fichier dans votre répertoire, vous pourrez donner un dernier prompt à Claude Code : 
> *"Lis attentivement le fichier `97import-firebase.md`. Analyse le code dans le répertoire Source et mets à jour le projet dans le répertoire Destination selon tes instructions."*