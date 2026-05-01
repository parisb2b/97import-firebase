// V46 Checkpoint F — Composant SearchInput reutilisable.
// SVG inline pour eviter d'introduire une dependance lucide-react/heroicons.
// Styles via polish-v45.css (.v46-search-wrapper / .v46-search-input).

import { CSSProperties } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  inputStyle?: CSSProperties;
  autoFocus?: boolean;
  ariaLabel?: string;
}

/**
 * Champ de recherche avec icone loupe a gauche.
 *
 * Usage :
 *   <SearchInput
 *     value={searchTerm}
 *     onChange={setSearchTerm}
 *     placeholder="Rechercher par numero, produit ou statut..."
 *     style={{ flex: 1, minWidth: 250 }}
 *   />
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
  style,
  inputStyle,
  autoFocus,
  ariaLabel,
}: SearchInputProps) {
  return (
    <div className={`v46-search-wrapper ${className}`} style={style}>
      <svg
        className="v46-search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={ariaLabel || placeholder}
        className="v46-search-input v45-trans-fast"
        style={inputStyle}
      />
    </div>
  );
}
