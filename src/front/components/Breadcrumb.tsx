import { Link } from 'wouter';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span>›</span>}
          {item.href ? (
            <Link href={item.href}><span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>{item.label}</span></Link>
          ) : (
            <span style={{ color: 'white', fontWeight: 600 }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
