import { CompletudeProduit } from '../../../lib/productHelpers';

interface Props {
  activeTab: 'essentiel' | 'details' | 'medias';
  onChange: (tab: 'essentiel' | 'details' | 'medias') => void;
  completude: CompletudeProduit;
  locked?: boolean;
}

export default function FicheProduitTabs({ activeTab, onChange, completude, locked }: Props) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5E7EB', marginBottom: 24, overflowX: 'auto' }}>
      <TabButton active={activeTab === 'essentiel'} onClick={() => onChange('essentiel')} required count={completude.essentiel} total={12}>Essentiel</TabButton>
      <TabButton active={activeTab === 'details'} onClick={() => !locked && onChange('details')} count={completude.details} total={16} locked={locked}>Détails techniques</TabButton>
      <TabButton active={activeTab === 'medias'} onClick={() => !locked && onChange('medias')} count={completude.medias} total={9} locked={locked}>Médias site web</TabButton>
    </div>
  );
}

function TabButton({ children, active, onClick, required, count, total, locked }: any) {
  const isComplete = count === total;
  const countBg = locked ? '#F3F4F6' : isComplete ? '#D1FAE5' : count > 0 ? '#FEF3C7' : '#FEE2E2';
  const countColor = locked ? '#9CA3AF' : isComplete ? '#065F46' : count > 0 ? '#92400E' : '#991B1B';

  return (
    <button onClick={onClick} disabled={locked}
      style={{
        background: 'transparent', border: 'none', padding: '12px 24px',
        fontSize: 14, cursor: locked ? 'not-allowed' : 'pointer',
        color: active ? '#1E3A5F' : locked ? '#9CA3AF' : '#6B7280',
        fontWeight: active ? 600 : 500,
        display: 'flex', alignItems: 'center', gap: 8,
        position: 'relative', whiteSpace: 'nowrap', opacity: locked ? 0.5 : 1,
        fontFamily: 'inherit', borderRadius: 0,
      }}>
      {required && (
        <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Obligatoire</span>
      )}
      {children}
      <span style={{ background: countBg, color: countColor, fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
        {locked ? '🔒 Après save' : `${count} / ${total}`}
      </span>
      {active && <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: '#EA580C' }} />}
    </button>
  );
}
