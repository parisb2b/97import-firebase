// V50-BIS Checkpoint I — Loading state uniforme pour pages admin.
//
// Avant V50-BIS : differentes pages utilisaient des spinners/loaders divers
// ("Chargement...", "..."), creant une UX incoherente.
//
// Apres V50-BIS : composant centralise utilisant les classes V45 polish-v45.css
// (.v45-spinner pour l'animation rotation + .v45-fade-in pour entree douce).
//
// Usage :
//   import LoadingState from '@/admin/components/atoms/LoadingState';
//   if (loading) return <LoadingState />;
//   if (loading) return <LoadingState message="Chargement des produits…" />;
//   if (loading) return <LoadingState message="..." style={{ minHeight: 200 }} />;

import { CSSProperties } from 'react';

interface LoadingStateProps {
  message?: string;
  style?: CSSProperties;
}

export default function LoadingState({
  message = 'Chargement…',
  style,
}: LoadingStateProps) {
  return (
    <div
      className="v45-fade-in"
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
        color: '#6B7280',
        fontSize: 14,
        fontFamily: 'inherit',
        ...style,
      }}
    >
      <span className="v45-spinner" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
