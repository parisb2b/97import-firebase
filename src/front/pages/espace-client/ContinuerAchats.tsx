import { useState } from 'react';
import { useLocation } from 'wouter';

const CATEGORIES = [
  { id: 'Mini-Pelle', label: 'Mini-Pelle', icon: '🚜', color: '#FEF3C7' },
  { id: 'Maisons', label: 'Maisons', icon: '🏠', color: '#DBEAFE' },
  { id: 'Solaire', label: 'Solaire', icon: '☀️', color: '#FEF9C3' },
  { id: 'Agricole', label: 'Agricole', icon: '🌾', color: '#DCFCE7' },
  { id: 'Divers', label: 'Divers', icon: '📦', color: '#F3E8FF' },
];

export default function ContinuerAchats() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');

  const filtered = CATEGORIES.filter(c => {
    if (!search) return true;
    return c.label.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Continuer mes achats</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Parcourez notre catalogue par catégorie.</p>

      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher une catégorie..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {filtered.map(cat => (
          <div key={cat.id} onClick={() => navigate(`/catalogue/${cat.id}`)}
            style={{
              background: cat.color, borderRadius: 16, padding: '28px 20px', textAlign: 'center',
              cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>{cat.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1565C0' }}>{cat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
