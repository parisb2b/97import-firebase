import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { adminAuth, adminDb as db } from '../lib/firebase';
import { useI18n } from '../i18n';
import { GlobeToggle } from '../components/GlobeToggle';
import ForgotPasswordModal from './components/ForgotPasswordModal';

export default function AdminLogin() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // V50-BIS Checkpoint B — modal mot de passe oublie.
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(adminAuth, email, password);
      // Check admin role
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      const role = userSnap.data()?.role;
      if (role !== 'admin') {
        await adminAuth.signOut();
        setError('Accès refusé. Ce compte n\'a pas les droits administrateur.');
        return;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="h-14 bg-white border-b flex items-center justify-end px-4">
        <GlobeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-navy">97import</h1>
            <p className="text-gray-500">{t('admin.login.title')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.login.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white py-2 rounded font-medium hover:bg-navy-dark disabled:opacity-50"
            >
              {loading ? t('loading') : t('admin.login.submit')}
            </button>

            {/* V50-BIS Checkpoint B — lien Mot de passe oublie */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-[#1565C0] hover:underline focus:outline-none focus:underline"
                style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* V50-BIS Checkpoint B — Modal reset password */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={email}
      />
    </div>
  );
}
