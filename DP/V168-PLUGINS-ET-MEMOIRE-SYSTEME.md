# V168 — AUDIT COMPLET ENVIRONNEMENT CLAUDE CODE WINDOWS 11

**Date :** 12/05/2026
**OS :** Windows 11 Pro 10.0.26200
**Projet :** 97import-firebase (`C:\DATA-MC-2030\97import-firebase\`)
**Utilisateur Windows :** `miche`

---

## 1. PLUGINS INSTALLÉS (GLOBAL)

### 1.1 Liste complète des plugins activés

Fichier source : `C:\Users\miche\.claude\settings.json` → `enabledPlugins`

| # | Plugin ID | Source | Rôle |
|---|-----------|--------|------|
| 1 | `pyright-lsp@claude-plugins-official` | Marketplace officielle | LSP TypeScript/Python (diagnostic en temps réel) |
| 2 | `typescript-lsp@claude-plugins-official` | Marketplace officielle | LSP TypeScript dédié |
| 3 | `superpowers@claude-plugins-official` | Marketplace officielle | Skills de workflow : brainstorming, TDD, debugging, subagent-driven-dev, writing/executing plans, git worktrees, code review |
| 4 | `ui-ux-pro-max@ui-ux-pro-max-skill` | GitHub: nextlevelbuilder/ui-ux-pro-max-skill | Design UI/UX : 50+ styles, 161 palettes, 57 font pairings, shadcn/ui |
| 5 | `claude-mem@thedotmack` | GitHub: thedotmack/claude-mem | Mémoire persistante cross-session : search, timeline, corpus, observations |
| 6 | `frontend-design@claude-plugins-official` | Marketplace officielle | Création d'interfaces web distinctives (React, Next.js, Tailwind, etc.) |
| 7 | `code-simplifier@claude-plugins-official` | Marketplace officielle | Simplification et raffinement de code |
| 8 | `context7@claude-plugins-official` | Marketplace officielle | Documentation up-to-date (résolution library ID + query docs) |
| 9 | `playwright@claude-plugins-official` | Marketplace officielle | MCP Playwright : navigate, click, snapshot, screenshot, test |
| 10 | `github@claude-plugins-official` | Marketplace officielle | MCP GitHub : PR, issues, commits, API |
| 11 | `claude-md-management@claude-plugins-official` | Marketplace officielle | Gestion CLAUDE.md : audit, amélioration, création |
| 12 | `code-review@claude-plugins-official` | Marketplace officielle | Revue de code structurée |
| 13 | `skill-creator@claude-plugins-official` | Marketplace officielle | Création et optimisation de skills personnalisés |
| 14 | `vercel@claude-plugins-official` | Marketplace officielle | Déploiement Vercel, env vars, AI SDK, Next.js, storage, firewall |
| 15 | `sentry@claude-plugins-official` | Marketplace officielle | MCP Sentry : erreurs, issues, debugging production |
| 16 | `feature-dev@claude-plugins-official` | Marketplace officielle | Développement feature guidé (architecte, explorateur, reviewer) |
| 17 | `security-guidance@claude-plugins-official` | Marketplace officielle | Conseils de sécurité |
| 18 | `claude-code-setup` | Marketplace officielle | Recommandations d'automatisation (hooks, MCP, plugins, skills) |

### 1.2 Marketplaces externes configurées

```json
{
  "ui-ux-pro-max-skill": {
    "source": { "source": "github", "repo": "nextlevelbuilder/ui-ux-pro-max-skill" }
  },
  "thedotmack": {
    "source": { "source": "github", "repo": "thedotmack/claude-mem" }
  }
}
```

### 1.3 Plugins avec MCP servers actifs

| Plugin | MCP Server | Outils exposés |
|--------|-----------|---------------|
| `playwright` | `plugin:playwright:playwright` | browser_navigate, browser_click, browser_snapshot, browser_take_screenshot, browser_evaluate, browser_fill_form, etc. (~20 outils) |
| `context7` | `plugin:context7:context7` | resolve-library-id, query-docs |
| `github` | `plugin:github:github` | Gist, GitHub API |
| `sentry` | `plugin:sentry:sentry` | Authentification OAuth (non activée) |
| `vercel` | `plugin:vercel:vercel` | Authentification OAuth (non activée) |
| `claude-mem` | `plugin:claude-mem:mcp-search` | search, timeline, get_observations, smart_search, smart_outline, build_corpus, query_corpus |
| `Gmail` | `claude_ai:Gmail` | create_draft, search_threads, get_thread, list_labels, label_message, etc. |
| `Google Calendar` | `claude_ai:Google_Calendar` | create_event, list_events, get_event, suggest_time, etc. |
| `Google Drive` | `claude_ai:Google_Drive` | Authentification OAuth (non activée) |

### 1.4 Skills disponibles (via superpowers + autres plugins)

**Superpowers (processus) :**
- `superpowers:brainstorming` — Design et exploration avant implémentation
- `superpowers:writing-plans` — Plans d'implémentation multi-étapes
- `superpowers:executing-plans` — Exécution de plans avec checkpoints
- `superpowers:subagent-driven-development` — Exécution par sous-agents avec review
- `superpowers:test-driven-development` — TDD systématique
- `superpowers:systematic-debugging` — Debugging structuré
- `superpowers:finishing-a-development-branch` — Finalisation de branche
- `superpowers:requesting-code-review` — Demande de revue de code
- `superpowers:receiving-code-review` — Traitement de feedback de revue
- `superpowers:using-git-worktrees` — Isolation par worktrees git
- `superpowers:using-superpowers` — Méta-skill d'orientation
- `superpowers:verification-before-completion` — Vérification avant de déclarer terminé
- `superpowers:dispatching-parallel-agents` — Agents parallèles pour tâches indépendantes
- `superpowers:writing-skills` — Création de skills personnalisés

**Claude-mem :**
- `claude-mem:mem-search` — Recherche dans la mémoire persistante
- `claude-mem:make-plan` — Plan d'implémentation avec découverte de documentation
- `claude-mem:do` — Exécution de plan par sous-agents
- `claude-mem:learn-codebase` — Apprentissage complet du codebase
- `claude-mem:smart-explore` — Recherche structurelle par AST (tree-sitter)
- `claude-mem:timeline-report` — Rapport narratif d'historique de projet
- `claude-mem:knowledge-agent` — Base de connaissances interrogeable
- `claude-mem:pathfinder` — Cartographie de features et unification
- `claude-mem:version-bump` — Versionnement sémantique automatisé
- `claude-mem:how-it-works` — Explication du fonctionnement de claude-mem

**Vercel :**
- `vercel:deploy`, `vercel:env`, `vercel:status`, `vercel:bootstrap`, `vercel:marketplace`
- `vercel:nextjs`, `vercel:ai-sdk`, `vercel:shadcn`, `vercel:vercel-functions`, etc.

**Autres :**
- `frontend-design:frontend-design` — Création d'interfaces web
- `code-review:code-review` — Revue de PR
- `feature-dev:feature-dev` — Développement feature guidé
- `ui-ux-pro-max:ui-ux-pro-max` — Design UI/UX
- `sentry:sentry-sdk-setup`, `sentry:sentry-feature-setup`, `sentry:sentry-workflow`
- `claude-md-management:revise-claude-md`, `claude-md-management:claude-md-improver`
- `skill-creator:skill-creator` — Création de skills
- `code-simplifier:code-simplifier` — Simplification de code

---

## 2. FICHIERS DE MÉMOIRE LOCALE

### 2.1 Projet 97import-firebase

| Fichier | Emplacement | Contenu |
|---------|------------|---------|
| `CLAUDE.md` | `C:\DATA-MC-2030\97import-firebase\CLAUDE.md` | Règles de logging, permissions, workflow git |
| `CLAUDE.md` (racine) | `C:\DATA-MC-2030\CLAUDE.md` | Configuration globale : OS, Python, UTF-8, Git, anti-duplication |
| `.claude/settings.json` | Projet | Permissions (Bash, Read, Write, Edit, MultiEdit), 3 plugins activés |
| `.claude/settings.local.json` | Projet | Permissions PowerShell spécifiques, modèle deepseek-v4-pro[1m], clé API DeepSeek |
| `.claude/launch.json` | Projet | Configuration de lancement |
| `DP/dp97importmaj.txt` | Projet | Journal principal (1800+ lignes) — historique de toutes les missions |

### 2.2 Mémoire Claude Code (sessions)

| Emplacement | Contenu |
|------------|---------|
| `C:\Users\miche\.claude\projects\C--DATA-MC-2030-97import-firebase\` | 50+ fichiers JSONL (sessions passées + sous-agents + tool results) |
| `C:\Users\miche\.claude\todos\` | Fichiers de tâches temporaires (50+ fichiers JSON) |
| `C:\Users\miche\.claude\telemetry\` | Événements de télémétrie |

### 2.3 Mémoire claude-mem (observations cross-session)

Le plugin `claude-mem` stocke ses observations dans sa propre base :
- Les observations sont accessibles via `mem-search` et `get_observations()`
- Le système d'injection de contexte affiche les observations récentes en début de session
- ~50 observations pour 97import-firebase couvrant la période 05-12/05/2026

### 2.4 Fichiers de configuration globaux

| Fichier | Emplacement |
|---------|------------|
| `settings.json` | `C:\Users\miche\.claude\settings.json` |
| `plugins/blocklist.json` | `C:\Users\miche\.claude\plugins\blocklist.json` |
| `plugins/.install-manifests/` | 1 manifeste : `pyright-lsp@claude-plugins-official.json` |
| `plugins/cache/` | Caches des plugins (context7, github, playwright, pyright-lsp) |

---

## 3. MODÈLE ET API

### Configuration actuelle

```json
{
  "model": "deepseek-v4-pro[1m]",
  "api": {
    "baseUrl": "https://api.deepseek.com/anthropic",
    "apiKey": "sk-26f5843af15b442f8bd4088af34e804b"
  },
  "subagentModel": "deepseek-v4-flash"
}
```

Source : `C:\DATA-MC-2030\97import-firebase\.claude\settings.local.json`

**Global fallback :** `C:\Users\miche\.claude\settings.json`
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "sk-51ee8c5d81994daf978fc3a1e40d6b95"
  }
}
```

---

## 4. PROCÉDURE DE RÉINSTALLATION SUR MAC MINI

### 4.1 Prérequis

```bash
# Installer Node.js 22 LTS
brew install node@22

# Installer Claude Code
npm install -g @anthropic-ai/claude-code
```

### 4.2 Restauration des settings globaux

```bash
# Créer le dossier .claude
mkdir -p ~/.claude

# Copier le contenu de C:\Users\miche\.claude\settings.json
cat > ~/.claude/settings.json <<'EOF'
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "sk-51ee8c5d81994daf978fc3a1e40d6b95"
  },
  "enabledPlugins": {
    "pyright-lsp@claude-plugins-official": true,
    "superpowers@claude-plugins-official": true,
    "ui-ux-pro-max@ui-ux-pro-max-skill": true,
    "claude-mem@thedotmack": true,
    "frontend-design@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true,
    "code-simplifier@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "playwright@claude-plugins-official": true,
    "github@claude-plugins-official": true,
    "claude-md-management@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "skill-creator@claude-plugins-official": true,
    "vercel@claude-plugins-official": true,
    "sentry@claude-plugins-official": true,
    "feature-dev@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true
  },
  "extraKnownMarketplaces": {
    "ui-ux-pro-max-skill": {
      "source": {
        "source": "github",
        "repo": "nextlevelbuilder/ui-ux-pro-max-skill"
      }
    },
    "thedotmack": {
      "source": {
        "source": "github",
        "repo": "thedotmack/claude-mem"
      }
    }
  },
  "autoUpdatesChannel": "latest",
  "skipDangerousModePermissionPrompt": true,
  "agentPushNotifEnabled": true
}
EOF
```

### 4.3 Restauration des settings projet

```bash
# Dans le dossier du projet cloné
cd /path/to/97import-firebase
mkdir -p .claude

cat > .claude/settings.json <<'EOF'
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "MultiEdit(*)"
    ],
    "deny": []
  },
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "ui-ux-pro-max@ui-ux-pro-max-skill": true,
    "claude-mem@thedotmack": true
  }
}
EOF
```

### 4.4 Restauration du fichier settings.local.json

```bash
# ⚠️ ADAPTER l'API key et le modèle selon la config Mac Mini
cat > .claude/settings.local.json <<'EOF'
{
  "model": "deepseek-v4-pro[1m]",
  "api": {
    "baseUrl": "https://api.deepseek.com/anthropic",
    "apiKey": "sk-26f5843af15b442f8bd4088af34e804b"
  },
  "subagentModel": "deepseek-v4-flash"
}
EOF
```

### 4.5 Restauration des CLAUDE.md

```bash
# Copier CLAUDE.md depuis le repo (déjà inclus dans le clone git)
# Le fichier C:\DATA-MC-2030\97import-firebase\CLAUDE.md fait partie du repo

# Le fichier racine C:\DATA-MC-2030\CLAUDE.md doit être copié manuellement
# car il n'est pas dans le repo git
```

### 4.6 Restauration des hooks

Le fichier `.claude/settings.local.json` du projet contient des permissions spécifiques pour PowerShell et Bash. Sur Mac :
- Remplacer `PowerShell(...)` par les équivalents Bash
- Conserver les permissions `Bash(...)`

### 4.7 Plugins à réinstaller

Au premier lancement de Claude Code dans le dossier du projet, les plugins listés dans `enabledPlugins` seront automatiquement téléchargés depuis :
- `claude-plugins-official` (marketplace officielle)
- `ui-ux-pro-max-skill` (GitHub: nextlevelbuilder/ui-ux-pro-max-skill)
- `thedotmack` (GitHub: thedotmack/claude-mem)

### 4.8 Vérification post-installation

```bash
# Vérifier les plugins installés
claude /plugin list

# Vérifier la mémoire claude-mem
claude /mem-search "état du projet 97import"

# Vérifier que les skills sont disponibles
# Au lancement, le system prompt listera les skills disponibles
```

---

## 5. RÉSUMÉ

| Catégorie | Quantité |
|-----------|----------|
| Plugins globaux activés | 18 |
| Plugins projet activés | 3 (superpowers, ui-ux-pro-max, claude-mem) |
| Marketplaces externes | 2 (ui-ux-pro-max-skill, thedotmack) |
| MCP servers | 9 (playwright, context7, github, sentry, vercel, claude-mem, Gmail, Calendar, Drive) |
| Skills disponibles | ~50 |
| Fichiers CLAUDE.md | 2 (racine C:\DATA-MC-2030\ + projet 97import-firebase) |
| Fichiers settings | 3 (global settings.json, projet settings.json, settings.local.json) |
| Fichiers .claude/ projet | 3 (settings.json, settings.local.json, launch.json) |
| Sessions JSONL | 50+ dans `~/.claude/projects/C--DATA-MC-2030-97import-firebase/` |
| Modèle principal | deepseek-v4-pro[1m] |
| Modèle sous-agents | deepseek-v4-flash |
| API endpoint | https://api.deepseek.com/anthropic |
```
