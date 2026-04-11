import { useI18n, Lang } from '../i18n';

export const GlobeToggle = () => {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1 text-sm">
      <span>🌐</span>
      {(['fr', 'zh', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-0.5 rounded ${
            lang === l ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {l === 'fr' ? 'FR' : l === 'zh' ? '中文' : 'EN'}
        </button>
      ))}
    </div>
  );
};
