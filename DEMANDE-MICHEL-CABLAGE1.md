# DEMANDE — CABLAGE-1 Scope insuffisant

## 🚨 Problème rencontré

Le prompt `cablage-1-fix-acomptes.md` autorise uniquement la modification de 2 fichiers :
1. `src/front/pages/Panier.tsx`
2. `src/front/pages/espace-partenaire/GestionDevisPartner.tsx`

**MAIS** : le bug "acomptes au format ancien `statut: 'declare'`" se trouve dans **3 autres fichiers** :

| Fichier | Ligne | Code problématique |
|---------|-------|-------------------|
| `src/front/pages/espace-client/PopupAcompte.tsx` | 71 | `statut: 'declare'` |
| `src/front/pages/espace-client/DevisCard.tsx` | 139 | `statut: 'declare'` |
| `src/front/pages/SignatureDevis.tsx` | 172 | `statut: 'declare'` |

Ces fichiers ne sont **pas dans la liste autorisée** du prompt.

---

## 📋 Analyse détaillée

### Panier.tsx (autorisé)
Actuellement, `Panier.tsx` :
- Crée le devis avec `acomptes: []` (ligne 161)
- **N'ajoute AUCUN acompte** lors de la création
- Le statut initial est `'en_negociation_partenaire'` (ligne 154)

### Où les acomptes sont créés (NON autorisés)

**1. PopupAcompte.tsx** (principal flux client)
```typescript
// Ligne 71
const nouvelAcompte = {
  montant: parseFloat(montant),
  date: new Date().toISOString(),
  statut: 'declare',  // ← ANCIEN FORMAT
  type_compte: typeCompte,
  iban_utilise: iban,
};
```

**2. DevisCard.tsx** (déclaration rapide)
```typescript
// Ligne 139
{
  montant: montantAcompte,
  date: new Date().toISOString(),
  statut: 'declare',  // ← ANCIEN FORMAT
  type_compte: 'perso',
}
```

**3. SignatureDevis.tsx** (signature + acompte)
```typescript
// Ligne 172
statut: 'declare',  // ← ANCIEN FORMAT
```

---

## 🎯 Solutions possibles

### Option A — Élargir le scope du prompt (recommandée)
Ajouter à la liste des fichiers autorisés :
- `src/front/pages/espace-client/PopupAcompte.tsx`
- `src/front/pages/espace-client/DevisCard.tsx`
- `src/front/pages/SignatureDevis.tsx`

**Avantage** : Fix complet du bug "aucun acompte à encaisser"
**Inconvénient** : 3 fichiers supplémentaires à modifier

### Option B — Fix partiel (Panier + GestionDevisPartner uniquement)
Ne modifier que les 2 fichiers autorisés :
- `Panier.tsx` : ajouter structure lignes avec `prix_partenaire` ✅
- `GestionDevisPartner.tsx` : migrer `prix_negocies` → `lignes[*].prix_vip_negocie` ✅

**Avantage** : Respecte strictement le scope
**Inconvénient** : Le bug acomptes `statut: 'declare'` **persiste** (pas fixé)

### Option C — Créer un CABLAGE-1-BIS séparé
Séparer en 2 prompts :
- **CABLAGE-1** : Fix structure lignes (prix_partenaire, prix_vip_negocie) → 2 fichiers
- **CABLAGE-1-BIS** : Fix format acomptes (encaisse: boolean) → 3 fichiers clients

**Avantage** : Clarté, séparation des concerns
**Inconvénient** : 2 prompts au lieu d'1

---

## 💡 Recommandation

**Option A** : Élargir le scope en ajoutant les 3 fichiers clients.

Le bug "aucun acompte à encaisser" est **critique** (bloquant pour la prod). Les 3 fichiers (PopupAcompte, DevisCard, SignatureDevis) sont tous dans `src/front/pages/espace-client/` donc cohérents avec le scope "front client".

**Modification du prompt** suggérée :

```markdown
### FICHIERS AUTORISÉS À MODIFIER (liste exhaustive)
1. src/front/pages/Panier.tsx
2. src/front/pages/espace-partenaire/GestionDevisPartner.tsx
3. src/front/pages/espace-client/PopupAcompte.tsx         ← AJOUT
4. src/front/pages/espace-client/DevisCard.tsx            ← AJOUT
5. src/front/pages/SignatureDevis.tsx                     ← AJOUT
```

---

## 📊 Impact si non corrigé

Si on ne fixe que `Panier.tsx` + `GestionDevisPartner.tsx` :

| Fonctionnalité | État après CABLAGE-1 |
|----------------|----------------------|
| Structure lignes (prix_partenaire, prix_vip_negocie) | ✅ Fixé |
| Négociation partenaire (GestionDevisPartner) | ✅ Fixé |
| Acomptes déclarés par client (PopupAcompte) | ❌ Encore format ancien |
| Bug "Aucun acompte à encaisser" | ❌ Persiste |
| Commission calculable | ✅ Fixé (si prix_partenaire existe) |

→ **Le bug principal du CABLAGE-1 n'est pas résolu** si on respecte strictement le scope initial.

---

## ⏸️ État actuel

**STOP** : Exécution suspendue après audit préalable.

**Tag backup créé** : `backup-cablage-1-20260424-1748`

**Aucune modification** n'a encore été faite au code.

---

## ❓ Question

Quelle option choisir ?
- [ ] **Option A** : Élargir scope (+ 3 fichiers) → je continue avec les 5 fichiers
- [ ] **Option B** : Scope strict (2 fichiers) → bug acomptes non fixé
- [ ] **Option C** : Scinder en CABLAGE-1 + CABLAGE-1-BIS

**Attente de votre décision avant de continuer.**
