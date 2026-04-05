# 02 — Sources de verite

**Date** : 2026-04-04
**Branche** : `feat/firebase-migration`

---

## Resume

Le projet dispose de multiples sources de verite pour les prix, les traductions, les configurations et les donnees produit. Certaines sont coherentes, d'autres sont redondantes ou contradictoires.

---

## Constats

### 1. PRIX — Source unique : `src/utils/calculPrix.ts`

| Element | Valeur | Statut |
|---------|--------|--------|
| TAUX_EUR_RMB | 8 | OK — coherent avec `src/data/settings.json` |
| Multiplicateur user | x2.0 | OK |
| Multiplicateur partner | x1.2 | OK |
| Multiplicateur vip | x1.3 | OK |
| Multiplicateur admin | x1.0 (implicite) | OK |

**Risque : Faible** — `calculerPrix()` est la source unique, utilisee partout.

### 2. PRIX STATIQUES — `src/data/pricing.ts`

Prix d'achat HT en dur :
- Mini-pelles : R18=9538, R22=12150, R32=14296, R57=19923 EUR
- Kits solaires : 10kW=6146, 12kW=6915, 20kW=14608 EUR
- Maisons modulaires standard : 20ft=4308, 30ft=5692, 40ft=7077 EUR
- Maisons modulaires premium : 20ft=7631, 30ft=8231, 40ft=10231 EUR
- Camping-car : 41269 EUR
- Accessoires : 346-1154 EUR

**Risque : Moyen** — Ces prix sont en dur dans le code. Si les produits sont aussi dans Firestore (`products` collection), il y a double source de verite. A verifier lors du deploiement.

### 3. TRADUCTIONS — Triple source

| Fichier | Format | Cles | Utilise par |
|---------|--------|------|-------------|
| `src/contexts/LanguageContext.tsx` | Objet TS inline | ~80 cles FR/ZH | `useLang()` / `t()` — utilise dans tout le frontend |
| `src/data/translations.json` | JSON { "key": { fr, zh } } | ~138 cles FR/ZH | **Non importe nulle part dans src/** |
| `src/data/site-content.json` | JSON sections (hero, banner, about, categories) | ~20 cles FR/ZH | **Non importe nulle part dans src/** |

**Risque : Moyen** — `translations.json` et `site-content.json` sont des fichiers orphelins. Seul `LanguageContext.tsx` est effectivement utilise. Les traductions JSON sont plus completes (138 vs 80 cles) mais ne sont pas branchees.

### 4. CONFIGURATION SITE — `src/data/settings.json`

```json
{
  "whatsapp": "33663284908",
  "siteName": "97import",
  "primaryColor": "#1B2A4A",
  "secondaryColor": "#2D7D46",
  "logoUrl": "/images/logo_import97_large.png",
  "tauxEurRmb": 8,
  "tvaRate": 0.085,
  "contactEmail": "contact@97import.com",
  "adminEmail": "parisb2b@gmail.com"
}
```

**Risque : Faible** — Valeurs coherentes avec le code. Mais ce fichier n'est pas importe dans le code applicatif directement (les valeurs sont dupliquees dans `calculPrix.ts` et dans les composants).

### 5. DONNEES PRODUIT — Supabase backup

`97import2026_siteweb/supabase/products.json` — 2041 lignes, contient les produits Supabase d'origine.
`97import2026_siteweb/supabase/profiles.json` — 64 lignes
`97import2026_siteweb/supabase/quotes.json` — 52 lignes
`97import2026_siteweb/supabase/admin_params.json` — 107 lignes

**Risque : Faible** — Ce sont des donnees de reference/backup, pas des sources actives.

### 6. TYPES — `src/types/index.ts`

Definit les interfaces Firestore : `UserProfile`, `Product`, `Quote`, `Partner`, `Invoice`, `Lead`, `ContactMessage`, `SiteContent`, `AdminParams`, `ShippingRate`, `PricingResult`.

**Risque : Moyen** — Ces types referent `FirestoreDate = Timestamp | Date | null` (Firebase). Si retour vers Supabase, toutes les interfaces doivent etre adaptees.

### 7. ROLES — Double definition

| Fichier | Roles definis |
|---------|--------------|
| `src/types/index.ts` | `'visitor' \| 'user' \| 'vip' \| 'partner' \| 'admin'` |
| `src/hooks/useRole.ts` | `'admin' \| 'partner' \| 'vip' \| 'user' \| 'public'` |
| MAJALL.TXT | `visitor \| user \| vip \| partner \| collaborateur \| admin` |

**Risque : Moyen** — `visitor` vs `public`, absence de `collaborateur` dans le code. L'enum MAJALL n'est pas respectee.

---

## Fichiers concernes

| Fichier | Role | Risque |
|---------|------|--------|
| `src/utils/calculPrix.ts` | Source prix unique | Faible |
| `src/data/pricing.ts` | Prix statiques en dur | Moyen |
| `src/contexts/LanguageContext.tsx` | i18n actif (80 cles) | Faible |
| `src/data/translations.json` | i18n orphelin (138 cles) | Moyen |
| `src/data/site-content.json` | CMS orphelin | Moyen |
| `src/data/settings.json` | Config non importee | Moyen |
| `src/types/index.ts` | Types Firestore | Moyen |
| `src/hooks/useRole.ts` | Roles divergents de MAJALL | Moyen |

---

## Niveau de risque : MOYEN

---

## Recommandation

1. **P1** — Brancher `translations.json` (plus complet) ou fusionner dans `LanguageContext.tsx`
2. **P2** — Unifier les roles : ajouter `collaborateur`, harmoniser `visitor`/`public`
3. **P2** — Decider si les prix statiques (`pricing.ts`) ou Firestore sont la source de verite
4. **P3** — Importer `settings.json` dans le code au lieu de dupliquer les valeurs
5. **P3** — Nettoyer `site-content.json` s'il reste orphelin
