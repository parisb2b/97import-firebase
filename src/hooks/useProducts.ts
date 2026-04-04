import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Product {
  id: string
  nom: string
  nom_chinois?: string
  slug: string
  categorie: string
  prix_achat: number
  description?: string
  description_longue?: string
  features?: string[]
  images: string[]
  specs?: Record<string, string>
  detailed_specs?: Record<string, Record<string, string>>
  actif: boolean
  numero_interne?: string
  poids?: number
  dimensions?: { longueur: number; largeur: number; hauteur: number }
}

export function useProducts(categorie?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const productsRef = collection(db, 'products')
        const constraints = [where('actif', '==', true)]
        if (categorie) {
          constraints.push(where('categorie', '==', categorie))
        }
        const q = query(productsRef, ...constraints)
        const snapshot = await getDocs(q)
        const results = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Product[]
        setProducts(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des produits')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categorie])

  return { products, loading, error }
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const docRef = doc(db, 'products', id)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          setProduct({ id: snapshot.id, ...snapshot.data() } as Product)
        } else {
          setError('Produit non trouvé')
          setProduct(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du produit')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  return { product, loading, error }
}
