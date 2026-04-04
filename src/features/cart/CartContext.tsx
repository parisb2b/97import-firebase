import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const CART_KEY = 'rippa_cart'

export interface CartItem {
  id: string
  name: string
  prixAchat: number
  prixUnitaire: number   // prix affiché selon rôle
  image: string
  quantity: number
  type: 'machine' | 'accessory' | 'solar' | 'house'
  numeroInterne?: string
}

interface CartContextType {
  items: CartItem[]
  total: number
  count: number
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType>({} as CartContextType)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Persister dans localStorage
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  // Clear panier au changement d'utilisateur (connexion/déconnexion)
  useEffect(() => {
    clearCart()
  }, [user?.uid])

  const total = items.reduce((sum, item) => sum + item.prixUnitaire * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  function addToCart(item: Omit<CartItem, 'quantity'>) {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function removeFromCart(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQuantity(id: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(id)
      return
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  function clearCart() {
    setItems([])
    localStorage.removeItem(CART_KEY)
  }

  return (
    <CartContext.Provider value={{
      items, total, count,
      addToCart, removeFromCart, updateQuantity, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
