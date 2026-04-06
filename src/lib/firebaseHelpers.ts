import {
  doc, runTransaction, getDoc, getDocs,
  collection, query, where
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Generateur de numeros de documents — Format PREFIX + AA + MM + NNN
 * Exemple : D2604001, F2604002, FA2604001
 * Le compteur repart a 001 chaque nouveau mois.
 * Collection Firestore : counters/{prefix}_{AAMM}
 */
export async function getNextDocNumber(
  prefix: string,
  partenaireCode?: string,
): Promise<string> {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const counterKey = `${prefix}_${yy}${mm}`

  const counterRef = doc(db, 'counters', counterKey)
  const num = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef)
    const current = snap.exists()
      ? (snap.data().value as number) : 0
    t.set(counterRef, { value: current + 1 })
    return current + 1
  })

  const base = `${prefix}${yy}${mm}${String(num).padStart(3, '0')}`
  return partenaireCode
    ? `${base}-${partenaireCode}`
    : base
}

// Raccourcis par type de document
export const getNextDevisNumber = (code?: string) => getNextDocNumber('D', code)
export const getNextFactureNumber = () => getNextDocNumber('F')
export const getNextFactureAcompteNumber = () => getNextDocNumber('FA')
export const getNextAvoirNumber = () => getNextDocNumber('A')
export const getNextCommissionNumber = () => getNextDocNumber('NC')
export const getNextMaritimeNumber = () => getNextDocNumber('FM')
export const getNextDouaneNumber = () => getNextDocNumber('DD')
export const getNextBLNumber = () => getNextDocNumber('BL')

// Enrichir les produits avec numero_interne et prix_achat
export async function enrichProduits(
  produits: any[]
): Promise<any[]> {
  const ids = produits
    .map(p => p.id || p.product_id)
    .filter(Boolean)

  if (ids.length === 0) return produits

  const snaps = await Promise.all(
    ids.map(id => getDoc(doc(db, 'products', id)))
  )

  return produits.map((p, i) => {
    const data = snaps[i]?.data()
    return {
      ...p,
      prix_achat: p.prix_achat || data?.prix_achat,
      numero_interne: p.numero_interne
        || data?.numero_interne
        || '—',
    }
  })
}

// Charger les partenaires actifs
export async function getPartenairesActifs() {
  const q = query(
    collection(db, 'partners'),
    where('actif', '==', true)
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d =>
    ({ id: d.id, ...d.data() }))
}

// Charger les params admin
export async function getAdminParam(key: string) {
  const snap = await getDoc(
    doc(db, 'admin_params', key)
  )
  return snap.exists() ? snap.data() : null
}
