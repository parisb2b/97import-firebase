# DIAGNOSTIC CRITIQUE — MS-20-001 et convention Firestore

**Date** : 2026-04-22
**Contexte** : Vérification avant suppression/recréation de MS-20-001

---

## 1️⃣ VÉRIFICATION CONVENTION FIRESTORE (5 produits échantillon)

| Référence   | ID Firestore    | Identique ? | Statut |
|-------------|-----------------|-------------|---------|
| MP-R22-001  | MP-R22-001      | ✅ OUI      | Normal  |
| MS-30-001   | MS-30-001       | ✅ OUI      | Normal  |
| KS-10K-001  | KS-10K-001      | ✅ OUI      | Normal  |
| MP-20-001   | MP-20-001       | ✅ OUI      | Normal  |
| ACC-GD-001  | ACC-GD-001      | ✅ OUI      | Normal  |
| **MS-20-001** | **TntXwKRbgMPL0sXxoFiL** | ❌ **NON** | **ANOMALIE** |

### Conclusion partie 1

**Convention confirmée** : Doc ID Firestore = Référence produit

**MS-20-001 est la SEULE anomalie détectée** (créé avec l'ancien code bugué avant le fix).

---

## 2️⃣ LOGIQUE FICHEPRODUIT.TSX (chargement produit)

### Route
```typescript
const [, params] = useRoute('/admin/produits/:ref');
```
→ Le paramètre de route est `:ref` (la référence)

### Chargement (lecture)
```typescript
const snap = await getDoc(doc(db, 'products', params.ref));
```
→ Utilise `params.ref` comme **ID du document Firestore**

### Sauvegarde (mise à jour)
```typescript
await setDoc(doc(db, 'products', product.reference), {
  ...updates,
  updated_at: serverTimestamp(),
}, { merge: true });
```
→ Utilise `product.reference` comme **ID du document Firestore**

### Suppression
```typescript
await deleteDoc(doc(db, 'products', product.reference));
```
→ Utilise `product.reference` comme **ID du document Firestore**

### Conclusion partie 2

**Architecture globale** : FicheProduit assume que **Doc ID = référence**

**Pas de query Firestore** : Le code ne cherche jamais par `where('reference', '==', ...)`, il accède **directement** au document par son ID.

---

## 3️⃣ IMPACT DU PROBLÈME MS-20-001

### Scénario actuel (ID aléatoire)

1. **Navigation catalogue** :
   - URL : `/admin/produits/MS-20-001`
   - FicheProduit charge : `doc(db, 'products', 'MS-20-001')`
   - **Résultat** : ❌ Produit introuvable (le doc ID est `TntXwKRbgMPL0sXxoFiL`)

2. **Modification impossible** :
   - Même si on ouvre le produit (par accident via l'ancien ID), le `setDoc()` créerait un NOUVEAU document avec ID = `MS-30-001` lors de la sauvegarde

3. **Suppression risquée** :
   - Le bouton "Supprimer" dans la fiche essaie de supprimer `doc(db, 'products', product.reference)`
   - Donc il supprimerait le document `MS-20-001` (qui n'existe pas)
   - Le document `TntXwKRbgMPL0sXxoFiL` resterait orphelin

### État Firestore actuel

```
Document ID : TntXwKRbgMPL0sXxoFiL
├─ reference : "MS-20-001"
├─ nom_fr : "Maison Standard 20 Pieds"
├─ categorie : "maison-modulaire"
└─ ... autres champs
```

**Problème** : Document orphelin, inaccessible via l'interface admin normale.

---

## 4️⃣ VÉRIFICATION COMPLÉMENTAIRE

### Chercher d'autres produits avec IDs aléatoires

```bash
# Récupérer TOUS les produits et comparer ID vs référence
curl -s "https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products?pageSize=300&key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
anomalies = []
for doc in data.get('documents', []):
    doc_id = doc['name'].split('/')[-1]
    ref = doc.get('fields', {}).get('reference', {}).get('stringValue', '')
    if doc_id != ref:
        anomalies.append((doc_id, ref))

if anomalies:
    print(f'⚠️  {len(anomalies)} anomalie(s) détectée(s) :')
    for doc_id, ref in anomalies:
        print(f'  - ID: {doc_id} | Ref: {ref}')
else:
    print('✅ Aucune anomalie détectée (tous les IDs = références)')
"
```

**À exécuter pour confirmer que MS-20-001 est le seul cas.**

---

## 5️⃣ SOLUTION RECOMMANDÉE

### Option A : Suppression + Recréation (RECOMMANDÉ)

**Avantages** :
- ✅ Simple et sûr
- ✅ Utilise le code corrigé de duplication
- ✅ Garantit la cohérence avec les autres produits
- ✅ Pas de migration complexe

**Inconvénients** :
- ⚠️ Perte des métadonnées (duplique_de, duplique_le, created_at) si elles existent
- ⚠️ Si le produit a été modifié après création, les modifs sont perdues

**Procédure** :
```bash
# 1. Supprimer le document orphelin
curl -X DELETE "https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products/TntXwKRbgMPL0sXxoFiL?key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"

# 2. Vérifier suppression
curl -s "https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products/TntXwKRbgMPL0sXxoFiL?key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo" | grep "code"

# 3. Recréer via interface admin (code corrigé)
# → Ouvrir /admin/produits/MS-30-001
# → Cliquer "📋 Dupliquer"
# → Ref : MS-20-001
# → Nom : Maison Standard 20 Pieds
# → Catégorie : maison-modulaire
# → ✅ Créer en désactivé
# → Valider

# 4. Vérifier nouveau document
curl -s "https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products/MS-20-001?key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error' in data:
    print('❌ Produit non trouvé')
else:
    print('✅ Produit créé avec le bon ID')
    print(f'   ID: MS-20-001')
    print(f'   Ref: {data.get(\"fields\", {}).get(\"reference\", {}).get(\"stringValue\", \"\")}')
"
```

### Option B : Migration du document existant

**Avantages** :
- ✅ Préserve les données exactes
- ✅ Préserve les métadonnées (dates, traçabilité)

**Inconvénients** :
- ⚠️ Plus complexe
- ⚠️ Risque d'erreur de copie
- ⚠️ Nécessite script custom

**Procédure** :
```bash
# 1. Exporter le document complet
curl -s "https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products/TntXwKRbgMPL0sXxoFiL?key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo" \
  > /tmp/ms-20-backup.json

# 2. Créer nouveau document avec ID = MS-20-001
cat /tmp/ms-20-backup.json | python3 -c "
import json, sys, subprocess
data = json.load(sys.stdin)
fields = data.get('fields', {})

# Créer avec le bon ID
body = json.dumps({'fields': fields})
subprocess.run([
    'curl', '-s', '-X', 'PATCH',
    '-H', 'Content-Type: application/json',
    '-d', body,
    'https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products/MS-20-001?key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo'
])
"

# 3. Supprimer l'ancien
curl -X DELETE "https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products/TntXwKRbgMPL0sXxoFiL?key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo"
```

---

## 6️⃣ RECOMMANDATION FINALE

### Choix : **Option A (Suppression + Recréation)**

**Justification** :
1. MS-20-001 a probablement été créé **récemment** (test du bouton Dupliquer)
2. Peu de risque de modifications importantes entre-temps
3. Le code corrigé garantit la cohérence future
4. Plus simple, moins de risque d'erreur

### Validation à faire AVANT suppression

```bash
# Vérifier qu'il n'y a qu'UNE SEULE anomalie
curl -s "https://firestore.googleapis.com/v1/projects/importok-6ef77/databases/(default)/documents/products?pageSize=300&key=AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
anomalies = []
for doc in data.get('documents', []):
    doc_id = doc['name'].split('/')[-1]
    ref = doc.get('fields', {}).get('reference', {}).get('stringValue', '')
    if doc_id != ref:
        anomalies.append((doc_id, ref))

print(f'Total anomalies : {len(anomalies)}')
for doc_id, ref in anomalies:
    print(f'  - ID: {doc_id} | Ref: {ref}')
"
```

**Si 1 seule anomalie (MS-20-001)** → Procéder avec Option A
**Si plusieurs anomalies** → Investiguer d'abord la cause

---

## 7️⃣ PROCHAINES ÉTAPES

### Après résolution MS-20-001

1. **Créer les produits MS-20-OPT-XCH** via duplication :
   - MS-20-OPT-1CH (duplication de MS-30-OPT-1CH)
   - MS-20-OPT-2CH (duplication de MS-30-OPT-2CH)
   - MS-20-OPT-3CH (duplication de MS-30-OPT-3CH)

2. **Relancer l'analyse P2-OPT-SEED-V2** :
   ```bash
   cd ~/97import-firebase
   # Relancer Parties A et B du prompt P2-OPT-SEED-V2-CORRIGÉ
   ```

3. **Appliquer le seed** :
   ```bash
   bash scripts/seed-v2-apply.sh
   ```

4. **Vérifier les groupes** dans le front :
   - Ouvrir /catalogue
   - Chercher "Maison Standard"
   - Vérifier dropdown Taille (20/30/40 pieds)
   - Vérifier dropdown Chambres (2/3/4/5)

---

**DIAGNOSTIC TERMINÉ** — En attente de validation Michel avant suppression.
