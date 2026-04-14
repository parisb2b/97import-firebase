import { useI18n } from '../../i18n';

const DESTINATIONS = [
  { flag: '🇲🇶', name: 'Martinique', code: 'MQ' },
  { flag: '🇬🇵', name: 'Guadeloupe', code: 'GP' },
  { flag: '🇷🇪', name: 'Reunion', code: 'RE' },
  { flag: '🇬🇫', name: 'Guyane', code: 'GF' },
];

export default function Services() {
  const { t } = useI18n();

  const SERVICES = [
    { icon: '🚢', title: t('services.fret'), desc: t('services.fretDesc') },
    { icon: '📋', title: t('services.dedouanement'), desc: t('services.dedouanementDesc') },
    { icon: '🔧', title: t('services.coordination'), desc: t('services.coordinationDesc') },
    { icon: '📦', title: t('services.surMesure'), desc: t('services.surMesureDesc') },
    { icon: '💶', title: t('services.devisGratuit'), desc: t('services.devisGratuitDesc') },
    { icon: '🛠', title: t('services.sav'), desc: t('services.savDesc') },
  ];
  return (
    <>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0B2545, #1E3A5F)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{t('services.title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
            {t('services.subtitle')}
          </p>
        </div>
      </div>

      {/* Services grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {SERVICES.map(s => (
            <div key={s.title} style={{
              background: 'white', borderRadius: 16, padding: 28,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <span style={{ fontSize: 36 }}>{s.icon}</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B2545', marginTop: 12, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Destinations */}
      <div style={{ background: '#F9FAFB', padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0B2545', textAlign: 'center', marginBottom: 32 }}>
            {t('services.destinations')}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {DESTINATIONS.map(d => (
              <div key={d.code} style={{
                background: 'white', borderRadius: 16, padding: '24px 40px', textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minWidth: 160,
              }}>
                <span style={{ fontSize: 40 }}>{d.flag}</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0B2545', marginTop: 8 }}>{d.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{
          border: '1px solid #E5E7EB', borderRadius: 12, padding: 20,
          background: '#FFFBEB', fontSize: 13, color: '#92400E', lineHeight: 1.6, textAlign: 'center',
        }}>
          ⚠️ {t('services.mentionObligatoire')}
        </div>
      </div>
    </>
  );
}
