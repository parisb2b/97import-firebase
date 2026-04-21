# /api — Vercel Serverless Functions

Ce dossier contient les fonctions serverless déployées automatiquement par Vercel.

## Fichiers

### translate.ts
Proxy vers l'API DeepL pour les traductions FR→ZH/EN.

**Endpoint** : `POST /api/translate`

**Body JSON** :
```json
{
  "text": "Texte à traduire",
  "target_lang": "ZH",
  "source_lang": "FR"
}
```

**Réponse succès (200)** :
```json
{
  "text": "要翻译的文本",
  "target_lang": "ZH",
  "source_lang": "FR"
}
```

**Réponse erreur (4xx/5xx)** :
```json
{
  "error": "Message d'erreur explicite"
}
```

**Pourquoi un proxy ?**
DeepL bloque les appels directs depuis un navigateur (CORS). Cette fonction serverless fait le relais côté serveur, où la clé API est sécurisée dans les variables d'environnement Vercel.

**Configuration requise** :
Variable d'environnement Vercel : `DEEPL_API_KEY` (sans préfixe VITE_)

## Utilisation côté client

```typescript
import { traduireTexte } from '@/lib/deeplService';

const traductionZh = await traduireTexte("Bonjour", "ZH");
const traductionEn = await traduireTexte("Bonjour", "EN");
```
