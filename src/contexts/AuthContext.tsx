import React, { createContext, useContext,
  useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, serverTimestamp
} from 'firebase/firestore'
import {
  authClient, authAdmin,
  googleProvider, db
} from '../lib/firebase'
import { UserProfile, UserRole } from '../types'

interface AuthContextType {
  // Session site (client)
  user: User | null
  profile: UserProfile | null
  role: UserRole
  loading: boolean
  signInClient: (email: string, pw: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUpClient: (email: string, pw: string,
    data: Partial<UserProfile>) => Promise<void>
  signOutClient: () => Promise<void>

  // Session back-office (admin)
  adminUser: User | null
  adminProfile: UserProfile | null
  adminLoading: boolean
  signInAdmin: (email: string, pw: string) => Promise<void>
  signOutAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
)

export function AuthProvider({
  children
}: { children: React.ReactNode }) {

  // ── CLIENT ────────────────────────────────────
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] =
    useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // ── ADMIN ─────────────────────────────────────
  const [adminUser, setAdminUser] =
    useState<User | null>(null)
  const [adminProfile, setAdminProfile] =
    useState<UserProfile | null>(null)
  const [adminLoading, setAdminLoading] = useState(true)

  // Charger le profil Firestore
  async function loadProfile(uid: string):
    Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'profiles', uid))
    if (snap.exists()) {
      return { id: snap.id,
        ...snap.data() } as UserProfile
    }
    return null
  }

  // Observer session CLIENT
  useEffect(() => {
    const unsub = onAuthStateChanged(
      authClient, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const p = await loadProfile(firebaseUser.uid)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Observer session ADMIN
  useEffect(() => {
    const unsub = onAuthStateChanged(
      authAdmin, async (firebaseUser) => {
      setAdminUser(firebaseUser)
      if (firebaseUser) {
        const p = await loadProfile(firebaseUser.uid)
        setAdminProfile(p)
      } else {
        setAdminProfile(null)
      }
      setAdminLoading(false)
    })
    return unsub
  }, [])

  const role: UserRole =
    profile?.role || 'visitor'

  // ── MÉTHODES CLIENT ───────────────────────────

  async function signInClient(
    email: string, pw: string
  ) {
    await signInWithEmailAndPassword(
      authClient, email, pw
    )
  }

  async function signInWithGoogle() {
    const result = await signInWithPopup(
      authClient, googleProvider
    )
    const uid = result.user.uid
    const existing = await loadProfile(uid)
    if (!existing) {
      await setDoc(doc(db, 'profiles', uid), {
        email: result.user.email,
        role: 'user',
        first_name: result.user.displayName
          ?.split(' ')[0] || '',
        last_name: result.user.displayName
          ?.split(' ').slice(1).join(' ') || '',
        phone: '',
        adresse_facturation: '',
        ville_facturation: '',
        cp_facturation: '',
        pays_facturation: 'France',
        adresse_livraison: '',
        ville_livraison: '',
        cp_livraison: '',
        pays_livraison: 'France',
        adresse_livraison_identique: true,
        created_at: serverTimestamp(),
      })
    }
  }

  async function signUpClient(
    email: string,
    pw: string,
    data: Partial<UserProfile>
  ) {
    const result = await createUserWithEmailAndPassword(
      authClient, email, pw
    )
    await setDoc(
      doc(db, 'profiles', result.user.uid), {
      email,
      role: 'user',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      phone: data.phone || '',
      adresse_facturation: '',
      ville_facturation: '',
      cp_facturation: '',
      pays_facturation: 'France',
      adresse_livraison: '',
      ville_livraison: '',
      cp_livraison: '',
      pays_livraison: 'France',
      adresse_livraison_identique: true,
      created_at: serverTimestamp(),
    })
  }

  async function signOutClient() {
    await signOut(authClient)
    setProfile(null)
  }

  // ── MÉTHODES ADMIN ────────────────────────────

  async function signInAdmin(
    email: string, pw: string
  ) {
    const result = await signInWithEmailAndPassword(
      authAdmin, email, pw
    )
    const p = await loadProfile(result.user.uid)
    if (!p || p.role !== 'admin') {
      await signOut(authAdmin)
      throw new Error(
        'Accès refusé — compte non administrateur'
      )
    }
  }

  async function signOutAdmin() {
    await signOut(authAdmin)
    setAdminProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, role, loading,
      signInClient, signInWithGoogle,
      signUpClient, signOutClient,
      adminUser, adminProfile, adminLoading,
      signInAdmin, signOutAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext)
  return {
    adminUser: ctx.adminUser,
    adminProfile: ctx.adminProfile,
    adminLoading: ctx.adminLoading,
    signInAdmin: ctx.signInAdmin,
    signOutAdmin: ctx.signOutAdmin,
    isAdmin: ctx.adminProfile?.role === 'admin',
  }
}
