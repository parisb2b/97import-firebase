import { useState, useRef } from 'react'

/**
 * useComposition — Gère l'état de composition IME (Input Method Editor)
 * Utile pour les champs de saisie en chinois/japonais/coréen
 * Permet d'éviter le traitement prématuré des touches pendant la composition
 */
export function useComposition() {
  const [isComposing, setIsComposing] = useState(false)
  const composingRef = useRef(false)

  const onCompositionStart = () => {
    setIsComposing(true)
    composingRef.current = true
  }

  const onCompositionEnd = () => {
    setIsComposing(false)
    composingRef.current = false
  }

  return {
    isComposing,
    composingRef,
    compositionHandlers: {
      onCompositionStart,
      onCompositionEnd,
    },
  }
}

export default useComposition
