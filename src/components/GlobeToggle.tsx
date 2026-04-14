import { useI18n, Lang } from '../i18n';

export const GlobeToggle = () => {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '中文' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 14 }}>🌐</span>
      {langs.map(l => (
        <button key={l.code} onClick={() => setLang(l.code)}
          style={{
            padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: lang === l.code ? 700 : 400,
            background: lang === l.code ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: lang === l.code ? 'white' : 'rgba(255,255,255,0.6)',
          }}>
          {l.label}
        </button>
      ))}
    </div>
  );
};
