interface DonneeTech {
  // Nouveau schema bilingue
  label_fr?: string;
  label_en?: string;
  label_zh?: string;
  valeur?: string;
  // Ancien schema (rétrocompat lecture uniquement)
  label?: string;
}

interface Caracteristiques {
  donnees_techniques?: DonneeTech[];
  equipements_fr?: string[];
  equipements_en?: string[];
  equipements_zh?: string[];
  // Ancien schema (rétrocompat lecture uniquement)
  equipements?: string[];
}

interface NormalizedDt {
  label_fr: string;
  label_en: string;
  label_zh: string;
  valeur: string;
}

interface NormalizedCaracteristiques {
  donnees_techniques: NormalizedDt[];
  equipements_fr: string[];
  equipements_en: string[];
  equipements_zh: string[];
}

interface Props {
  value?: Caracteristiques | null;
  onChange: (next: NormalizedCaracteristiques) => void;
}

function normalize(value?: Caracteristiques | null): NormalizedCaracteristiques {
  const dt = (value?.donnees_techniques || []).map((d) => ({
    label_fr: d.label_fr ?? d.label ?? '',
    label_en: d.label_en ?? '',
    label_zh: d.label_zh ?? '',
    valeur: d.valeur ?? '',
  }));
  return {
    donnees_techniques: dt,
    equipements_fr: value?.equipements_fr ?? value?.equipements ?? [],
    equipements_en: value?.equipements_en ?? [],
    equipements_zh: value?.equipements_zh ?? [],
  };
}

export default function CaracteristiquesEditor({ value, onChange }: Props) {
  const data = normalize(value);

  const updateDt = (i: number, field: keyof NormalizedDt, v: string) => {
    const next = [...data.donnees_techniques];
    next[i] = { ...next[i], [field]: v };
    onChange({ ...data, donnees_techniques: next });
  };
  const addDt = () => {
    onChange({
      ...data,
      donnees_techniques: [
        ...data.donnees_techniques,
        { label_fr: '', label_en: '', label_zh: '', valeur: '' },
      ],
    });
  };
  const removeDt = (i: number) => {
    onChange({
      ...data,
      donnees_techniques: data.donnees_techniques.filter((_, idx) => idx !== i),
    });
  };

  const updateEq = (lang: 'fr' | 'en' | 'zh', i: number, v: string) => {
    const key = `equipements_${lang}` as const;
    const next = [...data[key]];
    next[i] = v;
    onChange({ ...data, [key]: next });
  };
  const addEq = (lang: 'fr' | 'en' | 'zh') => {
    const key = `equipements_${lang}` as const;
    onChange({ ...data, [key]: [...data[key], ''] });
  };
  const removeEq = (lang: 'fr' | 'en' | 'zh', i: number) => {
    const key = `equipements_${lang}` as const;
    onChange({ ...data, [key]: data[key].filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={subTitleStyle}>Données techniques</div>
        <p style={hintStyle}>
          La valeur (ex: "2 371,5 kg") n'est pas traduite — seul le label l'est. Lancer le script
          <code style={codeStyle}>scripts/translate-products.js --apply</code> pour remplir EN/ZH automatiquement.
        </p>

        {data.donnees_techniques.length === 0 && (
          <div style={emptyHintStyle}>Aucune donnée technique.</div>
        )}

        {data.donnees_techniques.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 36px', gap: 6, marginBottom: 6 }}>
            <span style={colHeadStyle}>Label FR</span>
            <span style={colHeadStyle}>Label EN</span>
            <span style={colHeadStyle}>Label ZH</span>
            <span style={colHeadStyle}>Valeur (universelle)</span>
            <span></span>
          </div>
        )}

        {data.donnees_techniques.map((dt, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 36px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <input style={inputStyle} value={dt.label_fr} onChange={(e) => updateDt(i, 'label_fr', e.target.value)} placeholder="Poids opérationnel" />
            <input style={inputStyle} value={dt.label_en} onChange={(e) => updateDt(i, 'label_en', e.target.value)} placeholder="Operating weight" />
            <input style={inputStyle} value={dt.label_zh} onChange={(e) => updateDt(i, 'label_zh', e.target.value)} placeholder="操作重量" />
            <input style={inputStyle} value={dt.valeur} onChange={(e) => updateDt(i, 'valeur', e.target.value)} placeholder="2 371 kg – 2 439 kg" />
            <button onClick={() => removeDt(i)} style={iconBtnStyle} aria-label="Supprimer">🗑</button>
          </div>
        ))}

        <button onClick={addDt} style={addBtnStyle}>+ Ajouter une donnée technique</button>
      </div>

      <div style={subTitleStyle}>Équipements inclus</div>
      <p style={hintStyle}>3 listes parallèles FR / EN / ZH (1 ligne par équipement, même ordre).</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {(['fr', 'en', 'zh'] as const).map((lang) => (
          <div key={lang}>
            <div style={langHeadStyle(lang)}>{lang.toUpperCase()}</div>
            {data[`equipements_${lang}`].length === 0 && (
              <div style={emptyHintStyle}>Vide.</div>
            )}
            {data[`equipements_${lang}`].map((eq, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={eq}
                  onChange={(e) => updateEq(lang, i, e.target.value)}
                  placeholder={lang === 'fr' ? 'Joystick-pilote' : lang === 'en' ? 'Pilot joystick' : '先导操纵杆'}
                />
                <button onClick={() => removeEq(lang, i)} style={iconBtnStyle} aria-label="Supprimer">🗑</button>
              </div>
            ))}
            <button onClick={() => addEq(lang)} style={{ ...addBtnStyle, padding: '6px 10px', fontSize: 12 }}>+ Ajouter</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const subTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#1565C0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4,
};
const hintStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280', margin: '0 0 10px' };
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace', background: '#F3F4F6', padding: '1px 5px', borderRadius: 4, fontSize: 11, marginLeft: 4,
};
const emptyHintStyle: React.CSSProperties = {
  padding: '8px 12px', background: '#F9FAFB', border: '1px dashed #D1D5DB',
  borderRadius: 6, fontSize: 12, color: '#9CA3AF', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: 6,
  fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  background: '#fff', color: '#111827', width: '100%',
};
const colHeadStyle: React.CSSProperties = {
  fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
};
const iconBtnStyle: React.CSSProperties = {
  background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B',
  borderRadius: 6, padding: '4px 6px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
};
const addBtnStyle: React.CSSProperties = {
  marginTop: 4, padding: '6px 12px', background: '#EEF2FF', color: '#4F46E5',
  border: '1px dashed #C7D2FE', borderRadius: 6, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
const langHeadStyle = (lang: 'fr' | 'en' | 'zh'): React.CSSProperties => {
  const c = { fr: { bg: '#DBEAFE', color: '#1E40AF' }, zh: { bg: '#FEE2E2', color: '#991B1B' }, en: { bg: '#D1FAE5', color: '#065F46' } }[lang];
  return {
    display: 'inline-block', padding: '2px 8px', background: c.bg, color: c.color,
    fontSize: 10, fontWeight: 700, borderRadius: 4, marginBottom: 6,
  };
};
