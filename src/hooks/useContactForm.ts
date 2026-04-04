import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

export function useContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Veuillez remplir les champs obligatoires (nom, email, message)')
      }

      await addDoc(collection(db, 'contacts'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new',
      })

      setSuccess(true)
      setFormData(initialFormData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du message")
    } finally {
      setLoading(false)
    }
  }

  return { formData, setField, submit, loading, success, error }
}
