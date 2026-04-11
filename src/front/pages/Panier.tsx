import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { clientAuth, db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useI18n } from '../../i18n';
import { getNextNumber } from '../../lib/counters';

interface CartItem {
  id: string;
  ref: string;
  nom_fr: string;
  prix: number;
  qte: number;
}

export default function Panier() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [destination, setDestination] = useState('MQ');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQte = (id: string, qte: number) => {
    if (qte < 1) return;
    saveCart(cart.map((item) => (item.id === id ? { ...item, qte } : item)));
  };

  const removeItem = (id: string) => {
    saveCart(cart.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.prix * item.qte, 0);

  const handleSubmitDevis = async () => {
    const user = clientAuth.currentUser;
    if (!user) {
      setLocation('/connexion');
      return;
    }

    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const numero = await getNextNumber('DVS');
      const lignes = cart.map((item) => ({
        ref: item.ref,
        nom_fr: item.nom_fr,
        qte: item.qte,
        prix_unitaire: item.prix,
        total: item.prix * item.qte,
      }));

      const devisId = numero.replace(/[^a-zA-Z0-9]/g, '-');

      await setDoc(doc(db, 'quotes', devisId), {
        numero,
        client_id: user.uid,
        client_email: user.email,
        client_nom: user.displayName || '',
        statut: 'brouillon',
        lignes,
        total_ht: total,
        acompte_pct: 30,
        acomptes: [],
        total_encaisse: 0,
        solde_restant: total,
        destination,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Vider le panier
      localStorage.removeItem('cart');
      setCart([]);

      // Rediriger vers l'espace client
      setLocation(`/mon-compte/devis`);
    } catch (err) {
      console.error('Error creating quote:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🛒 Panier</h1>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Votre panier est vide</p>
          <Link href="/catalogue">
            <a className="text-navy hover:underline">{t('btn.voir.catalogue')}</a>
          </Link>
        </div>
      ) : (
        <>
          {/* Liste articles */}
          <div className="bg-white rounded-xl shadow mb-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{item.ref}</p>
                  <p className="font-medium">{item.nom_fr}</p>
                  <p className="text-navy font-semibold">
                    {item.prix.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQte(item.id, item.qte - 1)}
                    className="w-8 h-8 border rounded hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.qte}</span>
                  <button
                    onClick={() => updateQte(item.id, item.qte + 1)}
                    className="w-8 h-8 border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right font-semibold">
                  {(item.prix * item.qte).toLocaleString('fr-FR')} €
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Destination */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <label className="block font-medium mb-2">Destination</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="MQ">Martinique</option>
              <option value="GP">Guadeloupe</option>
              <option value="RE">Réunion</option>
              <option value="GF">Guyane</option>
              <option value="FR">France métropolitaine</option>
            </select>
          </div>

          {/* Total + CTA */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg">Total HT</span>
              <span className="text-2xl font-bold text-navy">
                {total.toLocaleString('fr-FR')} €
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Acompte demandé : 30% soit {(total * 0.3).toLocaleString('fr-FR')} €
            </p>
            <button
              onClick={handleSubmitDevis}
              disabled={submitting}
              className="w-full bg-navy text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50"
            >
              {submitting ? t('loading') : t('btn.demander.devis')}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Un conseiller vous contactera pour finaliser votre commande
            </p>
          </div>
        </>
      )}
    </div>
  );
}
