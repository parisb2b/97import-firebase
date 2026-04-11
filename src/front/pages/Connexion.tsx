import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { clientAuth } from '../../lib/firebase';
import { useI18n } from '../../i18n';

export default function Connexion() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(clientAuth, email, password);
      setLocation('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">{t('btn.connexion')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? t('loading') : t('btn.connexion')}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Pas encore de compte ?{' '}
          <Link href="/inscription">
            <a className="text-navy hover:underline">{t('btn.inscription')}</a>
          </Link>
        </p>
      </div>
    </div>
  );
}
