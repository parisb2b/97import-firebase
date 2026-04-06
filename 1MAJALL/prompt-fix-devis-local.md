# ════════════════════════════════════════════════════════
# PROMPT CLAUDE CODE — Corriger "Demander un devis" (local + prod)
# Dossier : C:\data-mc-2030\97import
# ════════════════════════════════════════════════════════

## RÈGLE OBLIGATOIRE — À exécuter EN PREMIER, sans exception
```
git fetch origin && git reset --hard origin/main
git tag backup-fix-devis-$(Get-Date -Format "yyyyMMdd-HHmm") && git push origin --tags
git log --oneline -3
```

## CONTEXTE DU PROBLÈME

Le bouton "Demander un devis" dans la page panier (`/cart`) ne génère pas
le devis. Le clic ne produit rien — ni PDF, ni écriture dans Firestore.

Cause probable : le code fait encore référence à Supabase ou à l'envoi
d'email comme prérequis, ou le flux est bloqué par une erreur silencieuse
(ex: `jspdf-autotable` non importé, Firestore transaction qui échoue, etc.)

Le devis DOIT fonctionner même en local (localhost:5173) et même sans
envoi d'email. L'email est un bonus, pas un bloquant.

## DIAGNOSTIC OBLIGATOIRE — LIRE AVANT TOUTE MODIFICATION

Exécuter ces commandes et LIRE ATTENTIVEMENT les résultats :

```powershell
# 1. Trouver le fichier panier / cart
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "Demander un devis|demander.*devis|DevisForm|CartPage|handleDevis" | Select-Object -First 20

# 2. Trouver le composant DevisForm ou équivalent
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "DevisForm|generateQuotePDF|generateDevisPDF|quote-pdf" | Select-Object -First 20

# 3. Trouver le CartContext
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "CartContext|useCart|cartItems|addToCart" | Select-Object -First 20

# 4. Trouver les imports Firestore liés aux devis
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "addDoc.*quotes|collection.*quotes|runTransaction.*devis|counters.*devis" | Select-Object -First 20

# 5. Trouver les imports jsPDF
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "jspdf|jsPDF|autoTable|jspdf-autotable" | Select-Object -First 20

# 6. Vérifier les dépendances installées
npm list jspdf jspdf-autotable 2>$null
```

Après lecture des résultats, AFFICHER un résumé :
```
DIAGNOSTIC :
- Fichier panier : [chemin]
- Fichier DevisForm : [chemin] 
- Fichier PDF devis : [chemin]
- CartContext : [chemin]
- jspdf installé : OUI/NON
- jspdf-autotable installé : OUI/NON
- Écriture Firestore quotes : OUI/NON (et fichier)
- Référence à Supabase dans le flux devis : OUI/NON
```

## CORRECTION — FLUX COMPLET "DEMANDER UN DEVIS"

### Architecture cible (schéma de parcours client Phase 3)

```
Clic "Demander un devis" dans /cart
  ↓
Pop-up choix partenaire [TD] [JM] [MC] [Sans partenaire]
  ↓
Génération numéro devis (D2600001) via Firestore transaction
  ↓
Calcul prix selon rôle :
  - user → prix_achat × 2
  - vip → prix négocié
  - partner → prix_achat × 1.2
  ↓
Création document dans Firestore collection 'quotes'
  ↓
Génération PDF devis (jsPDF + autoTable)
  ↓
Upload PDF dans Firebase Storage (devis/{numero_devis}.pdf)
  ↓
Téléchargement automatique du PDF pour le client
  ↓
Panier vidé automatiquement
  ↓
Toast : "Votre devis {numero} a été généré !"
  ↓
Redirection vers /mon-compte (onglet Mes Devis)
  ↓
(OPTIONNEL — ne PAS bloquer si ça échoue)
Envoi email via Cloud Function ou Resend
```

### ÉTAPE 1 — Installer les dépendances manquantes

```powershell
cd C:\data-mc-2030\97import
npm list jspdf jspdf-autotable 2>$null
# Si manquant :
npm install jspdf jspdf-autotable
```

### ÉTAPE 2 — Vérifier/créer le compteur devis dans Firestore

Vérifier que le fichier qui génère le numéro de devis utilise bien
ce pattern atomique avec Firestore transaction :

```typescript
// src/lib/devisNumber.ts (créer si inexistant)

import { doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'  // import de l'instance Firestore client

export async function getNextDevisNumber(partenaireCode?: string): Promise<string> {
  const counterRef = doc(db, 'counters', 'devis')
  
  const newNum = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef)
    const current = snap.exists() ? snap.data().value : 0
    const next = current + 1
    transaction.set(counterRef, { value: next })
    return next
  })
  
  const yy = new Date().getFullYear().toString().slice(2) // "26"
  const base = `D${yy}${String(newNum).padStart(5, '0')}`  // D2600001
  
  return partenaireCode ? `${base}-${partenaireCode}` : base
}
```

### ÉTAPE 3 — Vérifier/corriger le calcul de prix

Chercher le fichier `calculPrix.ts` ou équivalent :

```powershell
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "calculPrix|getPrix|prixPublic|prix_achat.*\*.*2|multiplicateur" | Select-Object -First 10
```

S'il n'existe pas, créer :

```typescript
// src/utils/calculPrix.ts

export function getPrixAffiche(prixAchat: number, role: string): number {
  switch (role) {
    case 'partner':
      return prixAchat * 1.2
    case 'vip':
      // Pour VIP, le prix négocié est stocké par produit
      // Retourner prix_achat * 2 par défaut si pas de prix négocié
      return prixAchat * 2
    case 'user':
    default:
      return prixAchat * 2
  }
}

export function formatPrix(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant)
}
```

### ÉTAPE 4 — Corriger/réécrire le générateur PDF devis

Chercher le fichier existant :
```powershell
type "src\features\pdf\templates\quote-pdf.ts" 2>$null
# ou
Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "src" | Where-Object { $_.Name -match "quote|devis" -and $_.Name -match "pdf" }
```

Le fichier DOIT utiliser cette structure :

```typescript
// src/features/pdf/templates/quote-pdf.ts

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ProduitDevis {
  nom: string
  numero_interne: string
  quantite: number
  prixUnitaire: number  // prix selon rôle (déjà calculé)
}

interface DevisData {
  numero_devis: string
  date: string
  client: {
    nom: string
    prenom: string
    email: string
    telephone: string
    adresse: string
    ville: string
    cp: string
    pays: string
  }
  produits: ProduitDevis[]
  total_ht: number
  partenaire_code?: string
}

export function generateQuotePDF(data: DevisData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // ═══ EN-TÊTE ÉMETTEUR ═══
  doc.setFontSize(18)
  doc.setTextColor(30, 58, 95) // navy #1E3A5F
  doc.text('97import.com', 14, 20)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('LUXENT LIMITED', 14, 28)
  doc.text('2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD', 14, 33)
  doc.text('RUISLIP HA4 7AE LONDON — UK', 14, 38)
  doc.text('Email : luxent@ltd-uk.eu', 14, 43)
  
  // ═══ TITRE DEVIS ═══
  doc.setFontSize(22)
  doc.setTextColor(30, 58, 95)
  doc.text('DEVIS', 140, 20, { align: 'center' })
  
  doc.setFontSize(11)
  doc.text(`N° ${data.numero_devis}`, 196, 30, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Date : ${data.date}`, 196, 36, { align: 'right' })
  doc.text('Validité : 30 jours', 196, 42, { align: 'right' })
  
  // ═══ INFOS CLIENT ═══
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, 52, 182, 32, 2, 2, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(30, 58, 95)
  doc.text('CLIENT', 18, 60)
  
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  const clientNom = `${data.client.prenom} ${data.client.nom}`
  doc.text(clientNom, 18, 66)
  doc.text(data.client.adresse || '', 18, 71)
  doc.text(`${data.client.cp || ''} ${data.client.ville || ''} — ${data.client.pays || ''}`, 18, 76)
  doc.text(`Email : ${data.client.email}`, 110, 66)
  doc.text(`Tél : ${data.client.telephone || '—'}`, 110, 71)
  
  if (data.partenaire_code) {
    doc.text(`Partenaire : ${data.partenaire_code}`, 110, 76)
  }
  
  // ═══ TABLEAU PRODUITS ═══
  const tableBody = data.produits.map((p, i) => [
    String(i + 1),
    p.numero_interne || '—',
    p.nom,
    String(p.quantite),
    formatEur(p.prixUnitaire),
    formatEur(p.prixUnitaire * p.quantite),
  ])
  
  autoTable(doc, {
    startY: 92,
    head: [['#', 'Réf.', 'Désignation', 'Qté', 'Prix unit. HT', 'Total HT']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 72 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {},
  })
  
  // ═══ TOTAL ═══
  const finalY = (doc as any).lastAutoTable?.finalY || 160
  
  doc.setFillColor(30, 58, 95)
  doc.roundedRect(120, finalY + 5, 76, 14, 2, 2, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL HT :', 125, finalY + 14)
  doc.text(formatEur(data.total_ht), 192, finalY + 14, { align: 'right' })
  
  // ═══ MENTIONS LÉGALES ═══
  const mentionsY = finalY + 30
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Prix HT — hors frais de transport maritime et dédouanement (calculés sur devis).', 14, mentionsY)
  doc.text('Ce devis est valable 30 jours à compter de sa date d\'émission.', 14, mentionsY + 5)
  doc.text('Les frais de livraison et de dédouanement seront précisés dans un document séparé.', 14, mentionsY + 10)
  doc.text('97import.com — LUXENT LIMITED — Company Number 14852122', 14, mentionsY + 20)
  
  return doc
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n)
}
```

### ÉTAPE 5 — Réécrire le handler "Demander un devis" dans le panier

Trouver le fichier panier et le handler du bouton :
```powershell
Get-ChildItem -Recurse -Include "*.tsx" -Path "src" | Select-String -Pattern "Demander un devis|handleDevis|onSubmitDevis" | Select-Object Path, LineNumber, Line
```

Le handler DOIT suivre cette logique EXACTE :

```typescript
const handleDemanderDevis = async () => {
  // ─── GARDES ───
  if (!user) {
    toast.error('Connectez-vous pour demander un devis')
    return
  }
  if (cartItems.length === 0) {
    toast.error('Votre panier est vide')
    return
  }
  
  setIsLoading(true)
  
  try {
    // ─── 1. RÉCUPÉRER LE PROFIL CLIENT ───
    const profileSnap = await getDoc(doc(db, 'profiles', user.uid))
    const profile = profileSnap.exists() ? profileSnap.data() : {}
    
    // ─── 2. RÉCUPÉRER LE RÔLE POUR CALCULER LE PRIX ───
    const role = profile.role || 'user'
    
    // ─── 3. GÉNÉRER LE NUMÉRO DE DEVIS ───
    const numeroDevis = await getNextDevisNumber(selectedPartenaire || undefined)
    
    // ─── 4. CONSTRUIRE LES PRODUITS AVEC PRIX SELON RÔLE ───
    const produits = cartItems.map(item => ({
      id: item.id,
      nom: item.nom,
      numero_interne: item.numero_interne || '',
      quantite: item.quantite,
      prix_achat: item.prix_achat || 0,
      prixUnitaire: getPrixAffiche(item.prix_achat || 0, role),
    }))
    
    const totalHT = produits.reduce(
      (sum, p) => sum + p.prixUnitaire * p.quantite, 0
    )
    
    // ─── 5. SAUVEGARDER DANS FIRESTORE ───
    const devisData = {
      user_id: user.uid,
      numero_devis: numeroDevis,
      statut: 'nouveau' as const,
      produits: produits,
      prix_total_calcule: totalHT,
      partenaire_code: selectedPartenaire || '',
      acomptes: [],
      total_encaisse: 0,
      solde_restant: totalHT,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      // Infos client snapshot
      client_nom: profile.last_name || '',
      client_prenom: profile.first_name || '',
      client_email: profile.email || user.email || '',
      client_telephone: profile.phone || '',
      client_adresse: profile.adresse_facturation || '',
      client_ville: profile.ville_facturation || '',
      client_cp: profile.cp_facturation || '',
      client_pays: profile.pays_facturation || 'France',
    }
    
    const docRef = await addDoc(collection(db, 'quotes'), devisData)
    
    // ─── 6. GÉNÉRER LE PDF ───
    const pdfDoc = generateQuotePDF({
      numero_devis: numeroDevis,
      date: new Date().toLocaleDateString('fr-FR'),
      client: {
        nom: profile.last_name || '',
        prenom: profile.first_name || '',
        email: profile.email || user.email || '',
        telephone: profile.phone || '',
        adresse: profile.adresse_facturation || '',
        ville: profile.ville_facturation || '',
        cp: profile.cp_facturation || '',
        pays: profile.pays_facturation || 'France',
      },
      produits: produits,
      total_ht: totalHT,
      partenaire_code: selectedPartenaire || undefined,
    })
    
    // ─── 7. UPLOAD PDF DANS STORAGE ───
    const pdfBlob = pdfDoc.output('blob')
    const storageRef = ref(storage, `devis/${numeroDevis}.pdf`)
    await uploadBytes(storageRef, pdfBlob, {
      contentType: 'application/pdf'
    })
    const pdfUrl = await getDownloadURL(storageRef)
    
    // Mettre à jour le devis avec l'URL du PDF
    await updateDoc(doc(db, 'quotes', docRef.id), {
      pdf_url: pdfUrl
    })
    
    // ─── 8. TÉLÉCHARGEMENT AUTOMATIQUE ───
    pdfDoc.save(`${numeroDevis}.pdf`)
    
    // ─── 9. VIDER LE PANIER ───
    clearCart()  // fonction du CartContext
    
    // ─── 10. MESSAGE DE SUCCÈS ───
    toast.success(`Devis ${numeroDevis} généré avec succès !`)
    
    // ─── 11. REDIRECTION ───
    // navigate('/mon-compte') ou setLocation('/mon-compte')
    // Adapter selon le router utilisé (wouter)
    
    // ─── 12. EMAIL (OPTIONNEL — NE PAS BLOQUER) ───
    try {
      // Si Cloud Functions configurées :
      // const sendEmailFn = httpsCallable(functions, 'sendEmail')
      // await sendEmailFn({ to: user.email, subject: `Devis ${numeroDevis}`, ... })
      console.log('Email non configuré — devis sauvegardé dans Firestore')
    } catch (emailError) {
      // NE PAS BLOQUER — l'email est un bonus
      console.warn('Envoi email échoué (non bloquant):', emailError)
    }
    
  } catch (error) {
    console.error('Erreur génération devis:', error)
    toast.error('Erreur lors de la génération du devis. Vérifiez la console.')
  } finally {
    setIsLoading(false)
  }
}
```

### ÉTAPE 6 — Pop-up choix partenaire

AVANT d'appeler `handleDemanderDevis`, le bouton "Demander un devis"
doit ouvrir une pop-up simple pour choisir le partenaire :

```tsx
{showPartenairePopup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">
        Avez-vous un code partenaire ?
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Si un partenaire vous a recommandé 97import, sélectionnez son code.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {['TD', 'JM', 'MC'].map(code => (
          <button
            key={code}
            onClick={() => setSelectedPartenaire(code)}
            className={`p-3 rounded-lg border text-left ${
              selectedPartenaire === code
                ? 'border-[#1E3A5F] bg-blue-50 font-semibold'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            Partenaire {code}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowPartenairePopup(false)
            handleDemanderDevis()
          }}
          className="flex-1 bg-[#1E3A5F] text-white py-3 rounded-lg font-semibold"
        >
          {selectedPartenaire ? `Continuer avec ${selectedPartenaire}` : 'Continuer →'}
        </button>
        <button
          onClick={() => {
            setSelectedPartenaire('')
            setShowPartenairePopup(false)
            handleDemanderDevis()
          }}
          className="flex-1 border border-gray-300 py-3 rounded-lg text-gray-600"
        >
          Sans partenaire
        </button>
      </div>
    </div>
  </div>
)}
```

Le bouton "Demander un devis" dans le panier doit faire :
```tsx
<button onClick={() => setShowPartenairePopup(true)}>
  Demander un devis
</button>
```

### ÉTAPE 7 — Vérifier les imports dans le fichier panier

Le fichier panier DOIT avoir ces imports :

```typescript
import { db, storage } from '@/lib/firebase'  // ou chemin correct
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getNextDevisNumber } from '@/lib/devisNumber'
import { generateQuotePDF } from '@/features/pdf/templates/quote-pdf'
import { getPrixAffiche } from '@/utils/calculPrix'
import { useCart } from '@/contexts/CartContext'  // ou chemin correct
```

Vérifier qu'AUCUNE référence à Supabase ne reste dans ce fichier :
```powershell
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" | Select-String -Pattern "supabase|createClient|SUPABASE" | Select-Object Path, LineNumber
```
Si trouvé → SUPPRIMER toutes les références Supabase.

### ÉTAPE 8 — Build et test

```powershell
npm run build

# Si erreurs → les corriger une par une
# Si succès :
npm run dev
```

Tester sur localhost:5173 :
1. Se connecter avec un compte user
2. Ajouter 2 produits au panier
3. Aller sur /cart
4. Cliquer "Demander un devis"
5. Pop-up partenaire s'affiche → choisir ou pas
6. PDF se télécharge automatiquement
7. Vérifier dans Firebase Console → collection 'quotes' → nouveau document créé
8. Vérifier dans Firebase Storage → dossier 'devis/' → PDF uploadé
9. Panier vidé

### ÉTAPE 9 — Commit et push

```powershell
git add -A
git commit -m "fix: flux devis complet — Firestore + PDF + pop-up partenaire + prix user×2"
git push origin main
git tag v5.14-fix-devis
git push origin --tags
```

## IMPORTANT — NE PAS FAIRE
- Ne PAS conditionner la génération du devis à l'envoi d'email
- Ne PAS utiliser Supabase (tout est Firestore maintenant)
- Ne PAS créer de branches — travailler sur main uniquement
- Ne PAS modifier d'autres fichiers que ceux liés au devis
- Ne PAS toucher aux pages admin dans ce prompt

## RAPPORT FINAL ATTENDU

```
DIAGNOSTIC INITIAL :
- Fichier panier : [chemin]
- État avant correction : [description du bug]
- Références Supabase trouvées : OUI/NON

CORRECTIONS EFFECTUÉES :
- [ ] jspdf + jspdf-autotable installés
- [ ] devisNumber.ts créé/corrigé
- [ ] calculPrix.ts créé/corrigé  
- [ ] quote-pdf.ts réécrit
- [ ] Handler devis réécrit dans [fichier]
- [ ] Pop-up partenaire ajouté
- [ ] Imports Firestore/Storage corrigés
- [ ] Références Supabase supprimées

BUILD : ✅/❌
TEST LOCAL : ✅/❌
COMMIT : [hash]
TAG : v5.14-fix-devis
```
