import { CompletudeProduit, CHAMPS_ESSENTIEL, CHAMPS_DETAILS, CHAMPS_MEDIAS } from '../../../lib/productHelpers';

export type TabId = 'prix' | 'essentiel' | 'details' | 'medias' | 'options';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  completude: CompletudeProduit;
  locked?: boolean;
}

export default function FicheProduitTabs({ activeTab, onChange, completude, locked }: Props) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5E7EB', marginBottom: 24, overflowX: 'auto' }}>
      <TabButton active={activeTab === 'prix'} onClick={() => !locked && onChange('prix')} locked={locked} noCount>
        💰 GESTION DES PRIX
      </TabButton>
      <TabButton active={activeTab === 'essentiel'} onClick={() => onChange('essentiel')} required count={completude.essentiel} total={CHAMPS_ESSENTIEL.length}>Essentiel</TabButton>
      <TabButton active={activeTab === 'details'} onClick={() => !locked && onChange('details')} count={completude.details} total={CHAMPS_DETAILS.length} locked={locked}>Détails techniques</TabButton>
      <TabButton active={activeTab === 'medias'} onClick={() => !locked && onChange('medias')} count={completude.medias} total={CHAMPS_MEDIAS.length} locked={locked}>Médias site web</TabButton>
      <TabButton active={activeTab === 'options'} onClick={() => !locked && onChange('options')} locked={locked} noCount>⚙️ Options</TabButton>
    </div>
  );
}

function TabButton({ children, active, onClick, required, count, total, locked, noCount }: any) {
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
      {!noCount && (
        <span style={{ background: countBg, color: countColor, fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
          {locked ? '🔒 Après save' : `${count} / ${total}`}
        </span>
      )}
      {active && <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: '#EA580C' }} />}
    </button>
  );
}
