// ═══════════════════════════════════════════════════════════
// M1009 CERTIFIÉ — Hook central auth : loading gate + .toLowerCase() + dual-path
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isUserPartenaire } from '../lib/roleUtils';

export interface AuthState {
  user: User | null;
  role: string | null;
  loading: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  normalizedEmail: string | null;
}

/**
 * V157 — Hook central d'authentification.
 * Résout la Race Condition Admin :
 *   - `loading` reste `true` tant que le rôle Firestore n'est pas résolu.
 *   - L'UI admin doit attendre `loading === false` avant de vérifier `isAdmin`.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser?.email) {
        setUser(currentUser);
        try {
          const normalizedEmail = currentUser.email.toLowerCase();
          const userDoc = await getDoc(doc(db, 'users', normalizedEmail));
          if (userDoc.exists()) {
            setRole(userDoc.data().role || 'user');
          } else {
            // Fallback ancien chemin users/{uid}
            const fallbackDoc = await getDoc(doc(db, 'users', currentUser.uid));
            setRole(fallbackDoc.exists() ? fallbackDoc.data().role || 'user' : 'user');
          }
        } catch (err) {
          console.error('[useAuth] Erreur lecture rôle :', err);
          setRole('user');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isPartner = useMemo(() => isUserPartenaire(role), [role]);
  const normalizedEmail = useMemo(() => user?.email?.toLowerCase() || null, [user]);

  return { user, role, loading, isAdmin, isPartner, normalizedEmail };
}
