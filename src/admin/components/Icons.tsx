// SVG Icons for Admin v4
export const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const EuroIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="12" r="9" />
    <text x="8.5" y="16.5" fontSize="11" fill="currentColor" stroke="none" fontWeight="bold">
      €
    </text>
  </svg>
);

export const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export const ExcelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export const PlaneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const DollarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

export const ShipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 17l9 4 9-4M3 12l9 4 9-4M3 7l9-4 9 4" />
  </svg>
);

export const TruckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 17H5a2 2 0 00-2 2 2 2 0 002 2h14a2 2 0 002-2 2 2 0 00-2-2h-4" />
    <polyline points="12 12 12 19" />
    <path d="M5 12H2a10 10 0 0020 0h-3" />
  </svg>
);

export const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

export const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
  </svg>
);

// Icon Button Component
interface IconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  variant?: 'eye' | 'dl' | 'send' | 'vip' | 'eur' | 'nc' | 'edit' | 'xl' | 'rd' | 'tl';
  onClick?: () => void;
  paid?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = ({
  icon,
  tooltip,
  variant = 'eye',
  onClick,
  paid,
  size = 'md',
}: IconButtonProps) => {
  const variantClass = `ib-${variant}${paid ? ' paid' : ''}`;
  const sizeStyle =
    size === 'lg'
      ? { width: 40, height: 40 }
      : size === 'sm'
        ? { width: 28, height: 28 }
        : {};

  return (
    <button
      className={`ico-btn ${variantClass}`}
      onClick={onClick}
      style={sizeStyle}
    >
      {icon}
      <span className="tt">{tooltip}</span>
    </button>
  );
};

// Pill Component
interface PillProps {
  children: React.ReactNode;
  variant?: 'tl' | 'or' | 'bl' | 'pu' | 'gr' | 'rd' | 'gy' | 'am' | 'nv';
  small?: boolean;
}

export const Pill = ({ children, variant = 'gy', small }: PillProps) => (
  <span className={`pl p-${variant}`} style={small ? { fontSize: 9 } : undefined}>
    {children}
  </span>
);

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'p' | 's' | 'o' | 'u' | 't' | 'r' | 'a' | 'out';
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Button = ({
  children,
  variant = 'p',
  onClick,
  disabled,
  style,
}: ButtonProps) => (
  <button
    className={`btn ${variant}`}
    onClick={onClick}
    disabled={disabled}
    style={style}
  >
    {children}
  </button>
);

// KPI Card Component
interface KpiProps {
  label: string;
  value: string | number;
  color?: 'tl' | 'or' | 'pu' | 'gr' | 'rd';
  sub?: string;
}

export const Kpi = ({ label, value, color, sub }: KpiProps) => (
  <div className="kpi">
    <div className="kpi-l">{label}</div>
    <div className={`kpi-v${color ? ` ${color}` : ''}`}>{value}</div>
    {sub && <div className="kpi-s">{sub}</div>}
  </div>
);

// Card Component
interface CardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  subtitle?: string;
}

export const Card = ({ title, children, actions, subtitle }: CardProps) => (
  <div className="card">
    <div className="ch">
      <div className="ct">{title}</div>
      {subtitle && (
        <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{subtitle}</span>
      )}
      {actions && <div className="ca">{actions}</div>}
    </div>
    {children}
  </div>
);

// Alert Component
interface AlertProps {
  children: React.ReactNode;
  variant?: 'am' | 'gr' | 'pu' | 'rd';
}

export const Alert = ({ children, variant = 'am' }: AlertProps) => (
  <div className={`alert ${variant}`}>{children}</div>
);

// Progress Bar Component
interface ProgressProps {
  value: number;
  max: number;
  color?: string;
}

export const Progress = ({ value, max, color }: ProgressProps) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="prog-w">
      <div
        className="prog-f"
        style={{
          width: `${pct}%`,
          background: color || (pct >= 100 ? 'var(--gr)' : 'var(--tl)'),
        }}
      />
    </div>
  );
};

// Info Block Component
interface InfoBlockProps {
  title: string;
  children: React.ReactNode;
}

export const InfoBlock = ({ title, children }: InfoBlockProps) => (
  <div className="iblk">
    <h4>{title}</h4>
    {children}
  </div>
);

// Info Row Component
interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

export const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="ir">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

// Form Group Component
interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export const FormGroup = ({ label, children, required }: FormGroupProps) => (
  <div className="fg">
    <div className="fl">
      {label}
      {required && ' *'}
    </div>
    {children}
  </div>
);
