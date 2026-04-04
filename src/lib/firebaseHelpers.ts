import {
  doc, runTransaction, getDoc, getDocs,
  collection, query, where
} from 'firebase/firestore'
import { db } from './firebase'

// Générateur numéro devis atomique
export async function getNextDevisNumber(
  partenaireCode?: string
): Promise<string> {
  const counterRef = doc(db, 'counters', 'devis')
  const num = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef)
    const current = snap.exists()
      ? (snap.data().value as number) : 0
    t.set(counterRef, { value: current + 1 })
    return current + 1
  })
  const yy = new Date().getFullYear()
    .toString().slice(2)
  const base = `D${yy}${String(num).padStart(5, '0')}`
  return partenaireCode
    ? `${base}-${partenaireCode}`
    : base
}

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
