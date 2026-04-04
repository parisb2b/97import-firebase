import { useCallback, useRef } from 'react'

/**
 * usePersistFn — Maintient une référence stable vers une fonction
 * même si ses dépendances changent.
 * Utile pour éviter des re-renders inutiles avec des handlers d'événements.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePersistFn<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef<T>(fn)
  fnRef.current = fn

  const persistFn = useCallback((...args: Parameters<T>): ReturnType<T> => {
    return fnRef.current(...args)
  }, []) as T

  return persistFn
}

export default usePersistFn
