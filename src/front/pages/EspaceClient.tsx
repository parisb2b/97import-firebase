import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth as clientAuth, db } from '../../lib/firebase';

export const EspaceClient: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (!user) {
        window.location.href = '/connexion';
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'clients', user.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          // Fallback défensif vers la création forcée
          window.location.href = '/profil';
        }
      } catch (err) {
        console.error("[V174] Erreur d'accès à l'Espace Client:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500 animate-pulse">Chargement sécurisé du profil client...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">📦 Bienvenue dans votre Espace Client</h2>
        <p className="text-sm text-gray-500 mt-1 font-mono">ID Compte : {profile?.uid}</p>
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
          👤 Nom enregistré : <span className="font-bold">{profile?.nom || 'Non configuré'}</span>
        </div>
      </div>
    </div>
  );
};
