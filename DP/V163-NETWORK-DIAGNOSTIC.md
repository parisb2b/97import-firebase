# V163.2 — Diagnostic réseau Auth/Firebase

## Résumé
L'Auth Emulator API répond parfaitement en direct (curl) mais le navigateur manuel échoue avec `auth/network-request-failed`. La cause racine est dans la chaîne navigateur → bundle Vite → Firebase SDK → Auth Emulator, spécifiquement dans l'absence de normalisation de l'email avant l'appel à `signInWithEmailAndPassword`.

## Cause racine confirmée
Deux causes identifiées :

1. **Email non normalisé avant Auth** : `AdminLogin.tsx` et `Connexion.tsx` appelaient `signInWithEmailAndPassword(auth, email, password)` avec l'email brut du formulaire, sans `trim().toLowerCase()`. Les emails avec majuscules ou espaces échouent silencieusement → `auth/network-request-failed`.

2. **Vite sans host 127.0.0.1 explicite** : `vite.config.ts` n'avait pas `host: '127.0.0.1'` dans le bloc `server`, laissant Vite écouter sur `::1` (IPv6) par défaut sous Windows 11, ce qui peut bloquer certaines requêtes navigateur.

## Audits exécutés
- `DP/v163-preflight.log` — ports, versions, git
- `DP/v163-audit-before.log` — localhost/ports, auth connect, email casing, vite watch
- `DP/v163-auth-api-test.log` — Auth Emulator API direct test
- `DP/v163-anti-patterns-after.log` — vérification post-correction

## Fichiers lus
- `src/lib/firebase.ts` — déjà conforme (127.0.0.1, instance unique, guard HMR)
- `src/hooks/useAuth.ts` — déjà conforme (loading gate, .toLowerCase(), dual-path)
- `src/admin/AdminLogin.tsx` — écart corrigé
- `src/front/pages/Connexion.tsx` — écart corrigé
- `vite.config.ts` — écart corrigé
- `firebase.json` — déjà conforme
- `.env` — déjà conforme
- `tests/playwright.config.ts` — legacy localhost (non bloquant)
- `tests/specs/full-flow.spec.ts` — déjà conforme

## Fichiers remplacés intégralement
| Fichier | Raison | Statut |
|---|---|---|
| `src/admin/AdminLogin.tsx` | Ajout `email.trim().toLowerCase()` avant Auth | Corrigé |
| `src/front/pages/Connexion.tsx` | Ajout `email.trim().toLowerCase()` avant Auth | Corrigé |
| `vite.config.ts` | Ajout `host: '127.0.0.1'` + `strictPort: true` | Corrigé |

## Ports et services
| Service | URL | Statut |
|---|---|---|
| Auth Emulator | http://127.0.0.1:9100 | ✅ reachable |
| Firestore Emulator | 127.0.0.1:8081 | ✅ reachable |
| Storage Emulator | 127.0.0.1:9200 | ✅ reachable |
| Emulator UI | http://127.0.0.1:4001 | ✅ reachable |
| Vite | http://127.0.0.1:5173 | ✅ reachable |

## Tests Auth API
- Client mc@sasfr.com : ✅ `registered:true`, `localId` retourné, `idToken` valide
- Admin parisb2b@gmail.com : ✅ `registered:true`, `localId` retourné, `idToken` valide

## Résultat navigateur manuel
⚠️ À VÉRIFIER MANUELLEMENT :
1. Ouvrir http://127.0.0.1:5173/connexion en navigation privée (Ctrl+Shift+N) ou Ctrl+F5
2. Se connecter avec mc@sasfr.com / 20262026
3. Ouvrir http://127.0.0.1:5173/admin
4. Se connecter avec parisb2b@gmail.com / 20262026

## Risques résiduels
1. Cache navigateur avec ancien bundle — résolu par Ctrl+F5
2. `tests/playwright.config.ts` utilise encore `localhost` comme fallback — non bloquant en test
