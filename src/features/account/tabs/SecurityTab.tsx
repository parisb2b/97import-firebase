import { useState } from 'react'
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'

export default function SecurityTab() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const providers = user?.providerData.map((p) => p.providerId) || []
  const hasEmailProvider = providers.includes('password')

  const lastLogin = user?.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Inconnue'

  const providerLabels: Record<string, string> = {
    'password': 'Email / Mot de passe',
    'google.com': 'Google',
    'facebook.com': 'Facebook',
    'github.com': 'GitHub',
    'twitter.com': 'Twitter',
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!user || !hasEmailProvider) return

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }

    setLoading(true)

    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Mot de passe actuel incorrect' })
      } else if (err.code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: 'Trop de tentatives. Veuillez réessayer plus tard.' })
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du mot de passe' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sécurité</h2>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Fournisseurs d'authentification</h3>
          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => (
              <span
                key={provider}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
              >
                {providerLabels[provider] || provider}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Dernière connexion</h3>
          <p className="text-sm text-gray-900">{lastLogin}</p>
        </div>
      </div>

      {hasEmailProvider && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h3>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </form>
        </div>
      )}

      {!hasEmailProvider && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Votre compte utilise une authentification externe. La modification du mot de passe n'est pas disponible.
          </p>
        </div>
      )}
    </div>
  )
}
