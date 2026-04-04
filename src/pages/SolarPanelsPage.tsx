/**
 * SolarPanelsPage — alias de SolarPage (/solaire)
 * Redirige automatiquement vers /solaire
 */
import { useEffect } from 'react'
import { useLocation } from 'wouter'
import SolarPage from './SolarPage'

export default function SolarPanelsPage() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    // Redirection canonique vers /solaire
    setLocation('/solaire', { replace: true })
  }, [setLocation])

  // Affiche SolarPage pendant la redirection
  return <SolarPage />
}
