# 97import — Config Claude Code

## Règle de logging obligatoire
Après chaque modification validée, logger dans `C:\DATA-MC-2030\97IMPORT\majall-97import.md` :

```
## [DATE YYYY-MM-DD HH:MM] — vX.XX
### Modifications
- [fichier modifié] : description du changement
### Fichiers touchés
- liste des fichiers ajoutés/modifiés/supprimés
### Statut
- ✅ Committé / ⏳ En attente de test
---
```

## Permissions autorisées
- Lecture/écriture fichiers projet
- Exécution npm/node
- Git add/commit/push