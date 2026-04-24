# DEMANDE D'AUTORISATION — P3-COMPLET PART 1

## Contexte
Implémentation de la Partie B (commissionHelpers.ts) selon le prompt p3-complet-strict-part1.md

## Problème rencontré
Le nouveau `src/lib/commissionHelpers.ts` (selon spécifications du prompt) remplace l'ancien API, mais 2 fichiers NON AUTORISÉS dépendent de l'ancien :

### Fichiers en erreur TypeScript :
1. `src/admin/components/commission/ModalNouvelleCommission.tsx`
   - Utilise `calculateCommission` (n'existe plus)
   - Utilise `estEligibleCommission` (n'existe plus)

2. `src/front/pages/espace-partenaire/MesCommissionsPartner.tsx`
   - Utilise `calculateCommission` (n'existe plus)
   - Utilise `estEligibleCommission` (n'existe plus)

### Nouveau API (selon prompt) :
- `calculerCommissionLigne(ligne: QuoteLine)`
- `calculerCommissionDevis(lignes: QuoteLine[])`
- `creerCommissionDevis(params)`

## Options

### Option A : Garder rétrocompatibilité
Ajouter des fonctions wrapper dans commissionHelpers.ts pour mapper l'ancien API vers le nouveau :
```typescript
// Backward compatibility
export async function calculateCommission(devis: any) { ... }
export function estEligibleCommission(devis: any) { ... }
```

**Problème** : Ce n'est pas dans le prompt → violation RÈGLE 3 (pas de code non spécifié)

### Option B : Modifier les fichiers non autorisés
Mettre à jour ModalNouvelleCommission.tsx et MesCommissionsPartner.tsx pour utiliser le nouveau API.

**Problème** : Violation RÈGLE 1 (fichiers interdits)

### Option C : Supprimer/désactiver les fichiers
Git checkout ou commenter les fichiers problématiques temporairement.

**Problème** : Casse des fonctionnalités existantes

## Recommandation
**Option A** semble la plus pragmatique : ajouter des wrappers de compatibilité dans commissionHelpers.ts permet de :
- Respecter l'esprit du prompt (nouveau code fonctionnel)
- Ne pas casser l'existant
- Ne pas toucher aux fichiers interdits

Mais cela nécessite votre validation car ce n'est pas explicitement dans le prompt.

## État actuel
- ✅ Partie A committée (036a6ce)
- ⏸️ Partie B : commissionHelpers.ts créé mais build échoue
- ⏸️ En attente de directive avant de continuer

## Question
Quelle option préférez-vous pour débloquer la situation ?
