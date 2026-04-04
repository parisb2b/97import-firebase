import { useState, useEffect } from 'react'

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 767px)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isMobile
}
