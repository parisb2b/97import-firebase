import { useEffect } from 'react'

interface SEOProps {
  title: string
  description?: string
}

export default function SEO({ title, description }: SEOProps) {
  useEffect(() => {
    document.title = `${title} | 97import.com`

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }
  }, [title, description])

  return null
}
