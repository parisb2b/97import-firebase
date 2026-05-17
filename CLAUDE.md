# 97IMPORT — ENCADREMENT ET LIMITES DE L'ENVIRONNEMENT DE TRAVAIL (CLAUDE.md)

## 🎯 OBJECTIFS ET PROJET TARGET
- **Projet Firebase Actif :** `importok-6ef77` (Ne jamais modifier, écraser ou lier à un autre projet)
- **Branche de Production de Travail :** `v2` (Déploiement exclusif Vercel.com)
- **Branche Main :** Sanctuarisée, liée à Supabase (Interdiction absolue de pousser ou modifier)

## 🛠️ CONSIGNES DE SÉCURITÉ ET DROITS REQUIS
- **Compte Administrateur Sacré :** `parisb2b@gmail.com` (UID: UYI68ThdrTZwkuA2TutwK2KUpU92). Ce compte doit conserver son rôle 'admin' à vie.
- **Règles de Remplacement :** Toute modification de fichier doit être effectuée via un **Remplacement Intégral** du code source. Les snippets ou modifications partielles sont interdits pour éviter la perte de fonctions secondaires.
- **Encodage de Fichiers :** Forcer nativement l'encodage `UTF-8` avec gestion des fins de lignes (LF) lors de chaque écriture ou lecture de script.

## ⚙️ VÉRIFICATIONS SYSTÉMIQUES DE CONFORMITÉ
- Avant chaque commit, la validation TypeScript complète doit être exécutée sans erreur : `npx tsc --noEmit`.
- L'utilisation des Émulateurs locaux est obligatoire pour valider les flux multi-comptes avant publication en production.
- Les rôles d'utilisateurs au sein de l'application doivent impérativement être validés via le module centralisé de normalisation `src/lib/roleUtils.ts`.

## 📊 SUIVI DE L'HISTORIQUE DES MISES À JOUR
- Chaque clôture d'étape ou de mission validée doit faire l'objet d'un rapport synthétique inscrit directement dans le fichier de log global `dp97geminimaj.txt`.