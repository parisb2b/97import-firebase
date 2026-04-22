# RAPPORT D'ANALYSE V2 — Seed corrigé
**Date** : mer. 22 avr. 2026 22:48:27 CEST

## Corrections apportées par rapport au V1

- ✅ Mini-pelles (R18/R22/R32/R57) : inchangé
- ✅ Kits solaires (10K/12K/20K) : inchangé
- 🆕 **Maisons Standard (MS)** : regroupement complet avec Taille + Chambres
- 🆕 **Maisons Premium (MP)** : regroupement complet avec Taille + Chambres (logique sur catégorie Firestore, plus sur préfixe ref)
- ❌ **Pièces détachées solaires** (BAT/OND/FIX/PAN) : EXCLUES du regroupement — restent en cartes individuelles
- ❌ Agricole, Divers, Accessoires, Logistique : non touchés

---

## Configurations détectées


╔══════════════════════════════════════════
║  CONFIGURATIONS V2 CORRIGÉES
╚══════════════════════════════════════════

═══ GROUPE : R18 (mini-pelle-chenilles) ═══
  Parent : MP-R18-001
  Variantes à associer (3) :
    - MP-R18-001 — Mini-pelle R18 PRO — Chenilles caoutchouc
    - MP-R18-002 — Mini-pelle R18 PRO — Chenilles métal
    - MP-R18-003 — Mini-pelle R18 PRO — Double chenilles
  Dropdowns :
    • Chenilles (3 choix)
        "Chenilles caoutchouc" → MP-R18-001
        "Chenilles métalliques" → MP-R18-002
        "Double chenilles" → MP-R18-003

═══ GROUPE : R22 (mini-pelle-chenilles) ═══
  Parent : MP-R22-001
  Variantes à associer (3) :
    - MP-R22-001 — Mini-pelle R22 PRO — Chenilles caoutchouc
    - MP-R22-002 — Mini-pelle R22 PRO — Chenilles métal
    - MP-R22-003 — Mini-pelle R22 PRO — Double chenilles
  Dropdowns :
    • Chenilles (3 choix)
        "Chenilles caoutchouc" → MP-R22-001
        "Chenilles métalliques" → MP-R22-002
        "Double chenilles" → MP-R22-003

═══ GROUPE : R32 (mini-pelle-chenilles) ═══
  Parent : MP-R32-001
  Variantes à associer (3) :
    - MP-R32-001 — Mini-pelle R32 PRO — Chenilles caoutchouc
    - MP-R32-002 — Mini-pelle R32 PRO — Chenilles métal
    - MP-R32-003 — Mini-pelle R32 PRO — Double chenilles
  Dropdowns :
    • Chenilles (3 choix)
        "Chenilles caoutchouc" → MP-R32-001
        "Chenilles métalliques" → MP-R32-002
        "Double chenilles" → MP-R32-003

═══ GROUPE : R57 (mini-pelle-chenilles) ═══
  Parent : MP-R57-001
  Variantes à associer (3) :
    - MP-R57-001 — Mini-pelle R57 PRO — Chenilles caoutchouc
    - MP-R57-002 — Mini-pelle R57 PRO — Chenilles métal
    - MP-R57-003 — Mini-pelle R57 PRO — Double chenilles
  Dropdowns :
    • Chenilles (3 choix)
        "Chenilles caoutchouc" → MP-R57-001
        "Chenilles métalliques" → MP-R57-002
        "Double chenilles" → MP-R57-003

═══ GROUPE : KS-10K (kit-solaire-fixation-panneaux) ═══
  Parent : KS-10K-001
  Variantes à associer (4) :
    - KS-10K-001 — Kit Solaire 10kW — Toiture + Petits panneaux
    - KS-10K-002 — Kit Solaire 10kW — Toiture + Grands panneaux
    - KS-10K-003 — Kit Solaire 10kW — Sol + Petits panneaux
    - KS-10K-004 — Kit Solaire 10kW — Sol + Grands panneaux
  Dropdowns :
    • Type de fixation (2 choix)
        "Sur toit" → (transition)
        "Au sol" → (transition)
    • Taille panneaux (4 choix)
        "Petits panneaux" → KS-10K-001 [si Type de fixation=Sur toit]
        "Grands panneaux" → KS-10K-002 [si Type de fixation=Sur toit]
        "Petits panneaux" → KS-10K-003 [si Type de fixation=Au sol]
        "Grands panneaux" → KS-10K-004 [si Type de fixation=Au sol]

═══ GROUPE : KS-12K (kit-solaire-fixation-panneaux) ═══
  Parent : KS-12K-001
  Variantes à associer (4) :
    - KS-12K-001 — Kit Solaire 12kW — Toiture + Petits panneaux
    - KS-12K-002 — Kit Solaire 12kW — Toiture + Grands panneaux
    - KS-12K-003 — Kit Solaire 12kW — Sol + Petits panneaux
    - KS-12K-004 — Kit Solaire 12kW — Sol + Grands panneaux
  Dropdowns :
    • Type de fixation (2 choix)
        "Sur toit" → (transition)
        "Au sol" → (transition)
    • Taille panneaux (4 choix)
        "Petits panneaux" → KS-12K-001 [si Type de fixation=Sur toit]
        "Grands panneaux" → KS-12K-002 [si Type de fixation=Sur toit]
        "Petits panneaux" → KS-12K-003 [si Type de fixation=Au sol]
        "Grands panneaux" → KS-12K-004 [si Type de fixation=Au sol]

═══ GROUPE : KS-20K (kit-solaire-fixation-panneaux) ═══
  Parent : KS-20K-001
  Variantes à associer (4) :
    - KS-20K-001 — Kit Solaire 20kW — Toiture + Petits panneaux
    - KS-20K-002 — Kit Solaire 20kW — Toiture + Grands panneaux
    - KS-20K-003 — Kit Solaire 20kW — Sol + Petits panneaux
    - KS-20K-004 — Kit Solaire 20kW — Sol + Grands panneaux
  Dropdowns :
    • Type de fixation (2 choix)
        "Sur toit" → (transition)
        "Au sol" → (transition)
    • Taille panneaux (4 choix)
        "Petits panneaux" → KS-20K-001 [si Type de fixation=Sur toit]
        "Grands panneaux" → KS-20K-002 [si Type de fixation=Sur toit]
        "Petits panneaux" → KS-20K-003 [si Type de fixation=Au sol]
        "Grands panneaux" → KS-20K-004 [si Type de fixation=Au sol]

═══ GROUPE : MS (maison-maison-standard) ═══
  Parent : MS-30-001
  Variantes à associer (11) :
    - MS-30-001 — Maison Standard 30 Pieds
    - MS-40-001 — Maison Standard 40 Pieds
    - MS-20-OPT-1CH — Option +1 chambre -- MS-20
    - MS-20-OPT-2CH — Option +2 chambres -- MS-20
    - MS-20-OPT-3CH — Option +3 chambres -- MS-20
    - MS-30-OPT-1CH — Option +1 chambre -- MS-30
    - MS-30-OPT-2CH — Option +2 chambres -- MS-30
    - MS-30-OPT-3CH — Option +3 chambres -- MS-30
    - MS-40-OPT-1CH — Option +1 chambre -- MS-40
    - MS-40-OPT-2CH — Option +2 chambres -- MS-40
    - MS-40-OPT-3CH — Option +3 chambres -- MS-40
  Dropdowns :
    • Taille (2 choix)
        "30 pieds" → MS-30-001
        "40 pieds" → MS-40-001
    • Chambres (8 choix)
        "2 chambres (standard)" → MS-30-001 [si Taille=30 pieds]
        "3 chambres" → MS-30-OPT-1CH [si Taille=30 pieds]
        "4 chambres" → MS-30-OPT-2CH [si Taille=30 pieds]
        "5 chambres" → MS-30-OPT-3CH [si Taille=30 pieds]
        "2 chambres (standard)" → MS-40-001 [si Taille=40 pieds]
        "3 chambres" → MS-40-OPT-1CH [si Taille=40 pieds]
        "4 chambres" → MS-40-OPT-2CH [si Taille=40 pieds]
        "5 chambres" → MS-40-OPT-3CH [si Taille=40 pieds]

═══ GROUPE : MP (maison-maison-premium) ═══
  Parent : MP-20-001
  Variantes à associer (12) :
    - MP-20-001 — Maison Premium 20 Pieds
    - MP-30-001 — Maison Premium 30 Pieds
    - MP-40-001 — Maison Premium 40 Pieds
    - MP-20-OPT-1CH — Option +1 chambre -- MP-20
    - MP-20-OPT-2CH — Option +2 chambres -- MP-20
    - MP-20-OPT-3CH — Option +3 chambres -- MP-20
    - MP-30-OPT-1CH — Option +1 chambre -- MP-30
    - MP-30-OPT-2CH — Option +2 chambres -- MP-30
    - MP-30-OPT-3CH — Option +3 chambres -- MP-30
    - MP-40-OPT-1CH — Option +1 chambre -- MP-40
    - MP-40-OPT-2CH — Option +2 chambres -- MP-40
    - MP-40-OPT-3CH — Option +3 chambres -- MP-40
  Dropdowns :
    • Taille (3 choix)
        "20 pieds" → MP-20-001
        "30 pieds" → MP-30-001
        "40 pieds" → MP-40-001
    • Chambres (12 choix)
        "2 chambres (standard)" → MP-20-001 [si Taille=20 pieds]
        "3 chambres" → MP-20-OPT-1CH [si Taille=20 pieds]
        "4 chambres" → MP-20-OPT-2CH [si Taille=20 pieds]
        "5 chambres" → MP-20-OPT-3CH [si Taille=20 pieds]
        "2 chambres (standard)" → MP-30-001 [si Taille=30 pieds]
        "3 chambres" → MP-30-OPT-1CH [si Taille=30 pieds]
        "4 chambres" → MP-30-OPT-2CH [si Taille=30 pieds]
        "5 chambres" → MP-30-OPT-3CH [si Taille=30 pieds]
        "2 chambres (standard)" → MP-40-001 [si Taille=40 pieds]
        "3 chambres" → MP-40-OPT-1CH [si Taille=40 pieds]
        "4 chambres" → MP-40-OPT-2CH [si Taille=40 pieds]
        "5 chambres" → MP-40-OPT-3CH [si Taille=40 pieds]


═══ VÉRIFICATIONS ═══
  ⚠️  MS-20-001 n'existe PAS — à créer avant le seed (via le bouton Dupliquer)
  ✅ MP-20-001 existe

═══ EXCLUS (cartes individuelles, pas de regroupement) ═══
  - KS-BAT-10K-001 : Batterie 10 kW
  - KS-BAT-12K-001 : Batterie 12 kW
  - KS-BAT-20K-001 : Batterie 20 kW
  - KS-FIX-SOL-001 : Kit fixation sol (structures au sol)
  - KS-FIX-TOIT-001 : Kit fixation toiture (rails alu + crochets + boulons inox)
  - KS-OND-10K-001 : Onduleur 10 kW
  - KS-OND-12K-001 : Onduleur 12 kW
  - KS-OND-20K-001 : Onduleur 20 kW
  - KS-PAN-L-001 : Panneau solaire grand format
  - KS-PAN-S-001 : Panneau solaire petit format

Total configurations V2 : 9

---

## ⚠️ Validation requise par Michel

1. Les **4 groupes mini-pelles** (R18, R22, R32, R57) sont-ils corrects ?
2. Les **3 kits solaires** (KS-10K, KS-12K, KS-20K) sont-ils corrects ?
3. Le groupe **"MS" (Maisons Standard)** avec Taille + Chambres est-il correct ?
4. Le groupe **"MP" (Maisons Premium)** avec Taille + Chambres est-il correct ?
5. Les pièces détachées (KS-BAT/OND/FIX/PAN) doivent bien rester en cartes individuelles ?

## Prérequis avant l'application

- [ ] Le produit `MS-20-001` doit exister en Firestore.
      Si absent → créer via le bouton "Dupliquer" (duplication de MS-30-001).

## Prochaine étape

Si validation OK et MS-20-001 existe :
```bash
bash scripts/seed-v2-apply.sh
```
Le script demande confirmation avant d'écrire en Firestore.
