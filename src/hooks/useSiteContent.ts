import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useSiteContent(section: string) {
  const [content, setContent] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!section) {
      setLoading(false)
      return
    }

    const fetchContent = async () => {
      setLoading(true)
      try {
        const docRef = doc(db, 'site_content', section)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          setContent(snapshot.data() as Record<string, any>)
        } else {
          setContent(null)
        }
      } catch {
        setContent(null)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [section])

  return { content, loading }
}
