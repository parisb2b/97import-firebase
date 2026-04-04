import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface ProfileData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
}

const emptyProfile: ProfileData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
}

export default function ProfileTab() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData>(emptyProfile)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      setLoading(true)
      try {
        const docRef = doc(db, 'profiles', user.uid)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          const data = snapshot.data()
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            postal_code: data.postal_code || '',
          })
        } else {
          setProfile({ ...emptyProfile, email: user.email || '' })
        }
      } catch {
        setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMessage(null)

    try {
      const docRef = doc(db, 'profiles', user.uid)
      await updateDoc(docRef, { ...profile, updatedAt: new Date() })
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
      setEditing(false)
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setMessage(null)
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Chargement du profil...</div>
  }

  const fields: { key: keyof ProfileData; label: string; type?: string }[] = [
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Téléphone', type: 'tel' },
    { key: 'address', label: 'Adresse' },
    { key: 'city', label: 'Ville' },
    { key: 'postal_code', label: 'Code postal' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Mon Profil</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors"
          >
            Modifier
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label, type }) => (
          <div key={key} className={key === 'address' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {editing ? (
              <input
                type={type || 'text'}
                value={profile[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                {profile[key] || <span className="text-gray-400 italic">Non renseigné</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
