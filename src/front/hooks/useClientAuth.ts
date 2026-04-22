import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { clientAuth, db } from '@/lib/firebase';

export type UserRole = 'visitor' | 'user' | 'vip' | 'partner' | 'admin';

export interface ClientAuthState {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export function useClientAuth(): ClientAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('visitor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, async (u) => {
      setUser(u);

      if (!u) {
        setRole('visitor');
        setLoading(false);
        return;
      }

      try {
        // 1. Vérifier si partenaire
        const partnerSnap = await getDocs(
          query(collection(db, 'partners'), where('userId', '==', u.uid))
        );
        if (!partnerSnap.empty) {
          setRole('partner');
          setLoading(false);
          return;
        }

        // 2. Sinon lire users/{uid}
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole((data.role || 'user') as UserRole);
        } else {
          setRole('user');
        }
      } catch (err) {
        console.error('Erreur récupération rôle:', err);
        setRole('user');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}
