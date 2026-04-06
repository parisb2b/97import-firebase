/**
 * CartPage — Panier client avec flux complet "Demander un devis"
 *
 * Flux :
 *   1. Clic "Demander un devis" → pop-up choix partenaire [TD] [JM] [MC] [Sans]
 *   2. Generateur numero devis atomique (Firestore transaction) → D2600001
 *   3. Calcul prix selon role (user×2, partner×1.2, vip×1.3, admin×1)
 *   4. Sauvegarde dans Firestore collection 'quotes'
 *   5. Generation PDF (jsPDF + autoTable)
 *   6. Upload PDF dans Firebase Storage devis/{numero_devis}.pdf
 *   7. Telechargement auto du PDF
 *   8. Vider le panier
 *   9. Toast succes
 *  10. Redirection /mon-compte
 *  11. (OPTIONNEL) Email
 */

import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrix, calculerPrix } from '@/utils/calculPrix'
import { getNextDevisNumber } from '@/lib/firebaseHelpers'
import { generateQuotePDF } from '@/features/pdf/templates/quote-pdf'

import { db, storage } from '@/lib/firebase'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// ── Design tokens ────────────────────────────────────────
const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#6B7280',
  gray200: '#E5E7EB',
  red: '#DC2626',
}

// ── Component ────────────────────────────────────────────
export default function CartPage() {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart()
  const { user, profile, role } = useAuth()
  const [, setLocation] = useLocation()

  // Etats devis
  const [showPartenairePopup, setShowPartenairePopup] = useState(false)
  const [selectedPartenaire, setSelectedPartenaire] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ── Helper toast ──
  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  // ══════════════════════════════════════════════════════════
  // HANDLER PRINCIPAL — Flux devis en 12 etapes
  // ══════════════════════════════════════════════════════════
  async function handleDemanderDevis() {
    // ─── GARDES ───
    if (!user) {
      showToast('error', 'Connectez-vous pour demander un devis')
      return
    }
    if (items.length === 0) {
      showToast('error', 'Votre panier est vide')
      return
    }

    setIsLoading(true)
    setShowPartenairePopup(false)

    try {
      // ─── 1. RECUPERER LE PROFIL CLIENT ───
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid))
      const prof = profileSnap.exists() ? profileSnap.data() : (profile || {})

      // ─── 2. ROLE POUR CALCUL PRIX ───
      const userRole = (prof as any)?.role || role || 'user'

      // ─── 3. GENERER LE NUMERO DE DEVIS ───
      const numeroDevis = await getNextDevisNumber(selectedPartenaire || undefined)

      // ─── 4. CONSTRUIRE LES PRODUITS AVEC PRIX SELON ROLE ───
      const produits = items.map(item => {
        const prixCalc = calculerPrix(item.prixAchat, userRole)
        return {
          id: item.id,
          nom: item.name,
          numero_interne: item.numeroInterne || '',
          quantite: item.quantity,
          prix_achat: item.prixAchat || 0,
          prixUnitaire: prixCalc.montant ?? item.prixUnitaire ?? 0,
        }
      })

      const totalHT = produits.reduce(
        (sum, p) => sum + p.prixUnitaire * p.quantite,
        0,
      )

      // ─── 5. SAUVEGARDER DANS FIRESTORE ───
      const devisData = {
        user_id: user.uid,
        numero_devis: numeroDevis,
        statut: 'nouveau' as const,
        produits,
        prix_total_calcule: totalHT,
        partenaire_code: selectedPartenaire || '',
        acomptes: [],
        total_encaisse: 0,
        solde_restant: totalHT,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        // Snapshot client
        client_nom: (prof as any)?.last_name || '',
        client_prenom: (prof as any)?.first_name || '',
        client_email: (prof as any)?.email || user.email || '',
        client_telephone: (prof as any)?.phone || '',
        client_adresse: (prof as any)?.adresse_facturation || '',
        client_ville: (prof as any)?.ville_facturation || '',
        client_cp: (prof as any)?.cp_facturation || '',
        client_pays: (prof as any)?.pays_facturation || 'France',
      }

      const docRef = await addDoc(collection(db, 'quotes'), devisData)

      // ─── 6. GENERER LE PDF ───
      const pdfDoc = generateQuotePDF({
        numero_devis: numeroDevis,
        date: new Date().toLocaleDateString('fr-FR'),
        client: {
          nom: devisData.client_nom,
          prenom: devisData.client_prenom,
          email: devisData.client_email,
          telephone: devisData.client_telephone,
          adresse: devisData.client_adresse,
          ville: devisData.client_ville,
          cp: devisData.client_cp,
          pays: devisData.client_pays,
        },
        produits: produits.map(p => ({
          nom: p.nom,
          numero_interne: p.numero_interne,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire,
        })),
        total_ht: totalHT,
        partenaire_code: selectedPartenaire || undefined,
        lang: 'fr',
      })

      // ─── 7. UPLOAD PDF DANS STORAGE ───
      let pdfUrl = ''
      try {
        const pdfBlob = pdfDoc.output('blob')
        const storageRef = ref(storage, `devis/${numeroDevis}.pdf`)
        await uploadBytes(storageRef, pdfBlob, {
          contentType: 'application/pdf',
        })
        pdfUrl = await getDownloadURL(storageRef)

        // Mettre a jour le devis avec l'URL
        await updateDoc(doc(db, 'quotes', docRef.id), {
          pdf_url: pdfUrl,
        })
      } catch (storageErr) {
        // Storage peut echouer (CORS, permissions) — ne pas bloquer
        console.warn('Upload Storage echoue (non bloquant):', storageErr)
      }

      // ─── 8. TELECHARGEMENT AUTOMATIQUE ───
      pdfDoc.save(`${numeroDevis}.pdf`)

      // ─── 9. VIDER LE PANIER ───
      clearCart()

      // ─── 10. MESSAGE DE SUCCES ───
      showToast('success', `Devis ${numeroDevis} genere avec succes !`)

      // ─── 11. REDIRECTION ───
      setTimeout(() => setLocation('/mon-compte'), 1500)

      // ─── 12. EMAIL (OPTIONNEL — NE PAS BLOQUER) ───
      try {
        console.log('Email non configure — devis sauvegarde dans Firestore')
      } catch (emailError) {
        console.warn('Envoi email echoue (non bloquant):', emailError)
      }
    } catch (error) {
      console.error('Erreur generation devis:', error)
      showToast(
        'error',
        `Erreur lors de la generation du devis. ${
          (error as any)?.message || 'Verifiez la console.'
        }`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════
  // RENDU — Panier vide
  // ══════════════════════════════════════════════════════════
  if (items.length === 0 && !toast) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>&#128722;</div>
        <h1 style={{ color: C.navy, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Votre panier est vide
        </h1>
        <p style={{ color: C.gray, marginBottom: '2rem' }}>
          Decouvrez notre catalogue pour trouver les produits qu'il vous faut.
        </p>
        <Link href="/catalogue">
          <a
            style={{
              background: C.green,
              color: C.white,
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Voir le catalogue
          </a>
        </Link>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // RENDU — Panier avec produits
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem', position: 'relative' }}>
      <h1 style={{ color: C.navy, fontSize: '2rem', marginBottom: '2rem' }}>Mon Panier</h1>

      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '14px 24px',
            borderRadius: '10px',
            color: C.white,
            fontWeight: 600,
            fontSize: '0.95rem',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            background: toast.type === 'success' ? C.green : C.red,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* ── Articles ──────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {items.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              background: C.white,
              borderRadius: '10px',
              padding: '1rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: '90px',
                height: '90px',
                objectFit: 'cover',
                borderRadius: '8px',
                background: C.light,
              }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ color: C.navy, margin: '0 0 0.3rem 0', fontSize: '1.05rem' }}>
                {item.name}
              </h3>
              {item.numeroInterne && (
                <p style={{ color: C.gray, fontSize: '0.85rem', margin: '0 0 0.3rem 0' }}>
                  Ref: {item.numeroInterne}
                </p>
              )}
              <p style={{ color: C.green, fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                {formatPrix(item.prixUnitaire)}
              </p>
            </div>

            {/* Quantite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: `1px solid ${C.navy}20`,
                  borderRadius: '6px',
                  background: C.light,
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                }}
              >
                &#8722;
              </button>
              <span
                style={{
                  minWidth: '30px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: C.navy,
                }}
              >
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: `1px solid ${C.navy}20`,
                  borderRadius: '6px',
                  background: C.light,
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                }}
              >
                +
              </button>
            </div>

            {/* Sous-total */}
            <div style={{ minWidth: '100px', textAlign: 'right' }}>
              <p style={{ fontWeight: 700, color: C.navy, margin: 0 }}>
                {formatPrix(item.prixUnitaire * item.quantity)}
              </p>
            </div>

            {/* Supprimer */}
            <button
              onClick={() => removeFromCart(item.id)}
              title="Supprimer"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.red,
                fontSize: '1.3rem',
                padding: '0.3rem',
              }}
            >
              &#10005;
            </button>
          </div>
        ))}
      </div>

      {/* ── Resume + Actions ──────────────────────── */}
      <div
        style={{
          background: C.white,
          borderRadius: '10px',
          padding: '1.5rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.2rem', color: C.navy, fontWeight: 600 }}>Total HT</span>
          <span style={{ fontSize: '1.5rem', color: C.green, fontWeight: 700 }}>
            {formatPrix(total)}
          </span>
        </div>
        <p style={{ color: C.gray, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Les frais de transport maritime et le dedouanement sont calcules sur devis.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* BOUTON DEVIS — ouvre la pop-up partenaire */}
          <button
            onClick={() => {
              if (!user) {
                showToast('error', 'Connectez-vous pour demander un devis')
                return
              }
              setShowPartenairePopup(true)
            }}
            disabled={isLoading}
            style={{
              flex: 1,
              minWidth: '200px',
              background: isLoading ? C.gray : C.orange,
              color: C.white,
              padding: '0.9rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textAlign: 'center',
            }}
          >
            {isLoading ? 'Generation en cours...' : 'Demander un devis'}
          </button>
          <button
            onClick={clearCart}
            style={{
              padding: '0.9rem 1.5rem',
              borderRadius: '8px',
              border: `1px solid ${C.red}`,
              background: 'transparent',
              color: C.red,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Vider le panier
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* POP-UP CHOIX PARTENAIRE                          */}
      {/* ══════════════════════════════════════════════════ */}
      {showPartenairePopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
          }}
          onClick={() => setShowPartenairePopup(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: '14px',
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              margin: '0 16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: C.navy,
                margin: '0 0 6px 0',
              }}
            >
              Avez-vous un code partenaire ?
            </h3>
            <p style={{ color: C.gray, fontSize: '0.85rem', margin: '0 0 18px 0' }}>
              Si un partenaire vous a recommande 97import, selectionnez son code.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {['TD', 'JM', 'MC'].map(code => (
                <button
                  key={code}
                  onClick={() => setSelectedPartenaire(prev => (prev === code ? '' : code))}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border:
                      selectedPartenaire === code
                        ? `2px solid ${C.navy}`
                        : `1px solid ${C.gray200}`,
                    background: selectedPartenaire === code ? '#EFF6FF' : C.white,
                    fontWeight: selectedPartenaire === code ? 700 : 400,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: C.navy,
                  }}
                >
                  Partenaire {code}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDemanderDevis}
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: C.navy,
                  color: C.white,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading
                  ? 'Generation...'
                  : selectedPartenaire
                    ? `Continuer avec ${selectedPartenaire}`
                    : 'Continuer'}
              </button>
              <button
                onClick={() => {
                  setSelectedPartenaire('')
                  handleDemanderDevis()
                }}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${C.gray200}`,
                  background: C.white,
                  color: C.gray,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Sans partenaire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
