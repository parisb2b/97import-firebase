# 05 — Medias et assets

**Date** : 2026-04-04
**Source** : `public/`

---

## Resume

183 fichiers dans `public/` : 165 images, 12 videos, 6 PDFs.
Les medias sont organises par categorie. Quelques doublons detectes entre sous-dossiers.

---

## Inventaire par categorie

| Dossier | Images | Videos | PDFs | Total |
|---------|--------|--------|------|-------|
| `public/images/accessories/` | 20 | - | - | 20 |
| `public/images/houses/camping_car/` | 10 | 1 | - | 11 |
| `public/images/houses/modular_premium/` | 4 | 2 | - | 6 |
| `public/images/houses/modular_standard/` | 7 | 3 | - | 10 |
| `public/images/products/` (mini-pelles) | 29 | - | - | 29 |
| `public/images/products/camping_car/` | 10 | 1 | - | 11 |
| `public/images/products/modular_premium/` | 4 | 2 | - | 6 |
| `public/images/products/modular_standard/` | 7 | 3 | - | 10 |
| `public/images/portal/` | 10 | - | - | 10 |
| `public/images/solar/` | 10 | - | - | 10 |
| `public/images/solar/solar_kits/` | 10 | - | - | 10 |
| `public/images/logos/` | 8 | - | - | 8 |
| `public/images/logo/` | 3 | - | - | 3 |
| `public/images/` (racine) | 5 | - | - | 5 |
| `public/docs/` | - | - | 1 | 1 |
| `public/documents/` | - | - | 5 | 5 |
| **TOTAL** | **137** | **12** | **6** | **155** |

Note : les images restantes (28) sont des doublons entre `houses/` et `products/` et les logos racine.

---

## Constats

### 1. Doublons images — Risque faible

Les sous-dossiers `houses/` et `products/` contiennent des copies identiques :
- `houses/camping_car/*` = `products/camping_car/*` (11 fichiers)
- `houses/modular_premium/*` = `products/modular_premium/*` (6 fichiers)
- `houses/modular_standard/*` = `products/modular_standard/*` (10 fichiers)

Egalement :
- `images/logo/` et `images/logos/` (doublons partiels)
- `images/logo_import97.png` et `images/logos/logo_import97.png`

**Total doublons estimes : ~30 fichiers**

### 2. Doublons logo — Risque faible

| Fichier | Dossier 1 | Dossier 2 |
|---------|-----------|-----------|
| `logo_import97.png` | `images/` | `images/logos/` |
| `logo_import97_footer.png` | `images/logo/` | `images/logos/` |
| `logo_import97_footer_transparent.png` | `images/` | `images/logos/` |
| `logo_import97_large.png` | `images/` | `images/logos/` |
| `logo_rippa_domtom_transparent.png` | `images/` | `images/logos/` |
| `rippa_dom_tom.svg` | `images/logo/` | `images/logos/` |
| `rippa_logo.webp` | `images/logo/` | `images/logos/` |

### 3. Formats mixtes — Risque faible

Plusieurs produits ont des doublons en format different :
- `agri_tractor.jpeg` + `agri_tractor.jpg`
- `camping_car.jpg` + `camping_car.png`
- `modular_home.png` + `modular_home.webp`
- `r18_pro.png` + `r18_pro.webp`

Pas de strategie claire (WebP partout ou fallback).

### 4. Videos — Risque moyen

12 fichiers `.mp4` (potentiellement volumineux pour un repo git) :
- 3 videos modular_standard
- 2 videos modular_premium
- 1 video camping_car
- Dupliquees entre `houses/` et `products/`

**Impact git** : les videos binaires alourdissent le repo. Devraient etre dans un CDN ou LFS.

### 5. PDFs documents techniques — OK

6 fiches techniques PDF dans `public/documents/` :
- `fiche_technique_maison_modulaire.pdf` (aussi dans `public/docs/`)
- `r18_pro_fiche_technique.pdf`
- `r22_pro_fiche_technique.pdf`
- `r32_pro_fiche_technique.pdf`
- `r57_pro_fiche_technique.pdf`

### 6. Reference Header/Footer

- Header logo : `<img src="/images/logos/logo_import97_large.png">`
- Hero image : `url(/images/portal/hero_ship.png)` dans `HomePage.tsx`

---

## Fichiers concernes

| Element | Risque |
|---------|--------|
| 30 doublons images houses/products | Faible |
| 7 doublons logos | Faible |
| 12 videos .mp4 dans git | Moyen |
| Formats mixtes (jpg+png, png+webp) | Faible |

---

## Niveau de risque : FAIBLE

---

## Recommandation

1. **P3** — Deduper les images : garder soit `houses/` soit `products/`, pas les deux
2. **P3** — Consolider les logos dans `images/logos/` uniquement
3. **P2** — Sortir les videos `.mp4` du repo git (Git LFS ou CDN Firebase Storage)
4. **P3** — Standardiser les formats : privilegier WebP avec fallback JPEG
