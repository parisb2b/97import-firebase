interface DonneeTech {
  label: string;
  valeur: string;
}

interface Caracteristiques {
  donnees_techniques: DonneeTech[];
  equipements: string[];
}

interface Props {
  value?: Caracteristiques | null;
  onChange: (next: Caracteristiques) => void;
}

export default function CaracteristiquesEditor({ value, onChange }: Props) {
  const data: Caracteristiques = {
    donnees_techniques: value?.donnees_techniques || [],
    equipements: value?.equipements || [],
  };

  const updateDt = (i: number, field: 'label' | 'valeur', v: string) => {
    const next = [...data.donnees_techniques];
    next[i] = { ...next[i], [field]: v };
    onChange({ ...data, donnees_techniques: next });
  };
  const addDt = () => {
    onChange({ ...data, donnees_techniques: [...data.donnees_techniques, { label: '', valeur: '' }] });
  };
  const removeDt = (i: number) => {
    onChange({ ...data, donnees_techniques: data.donnees_techniques.filter((_, idx) => idx !== i) });
  };

  const updateEq = (i: number, v: string) => {
    const next = [...data.equipements];
    next[i] = v;
    onChange({ ...data, equipements: next });
  };
  const addEq = () => {
    onChange({ ...data, equipements: [...data.equipements, ''] });
  };
  const removeEq = (i: number) => {
    onChange({ ...data, equipements: data.equipements.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={subTitleStyle}>Données techniques</div>
        <p style={hintStyle}>Ex : Poids opérationnel / 2 371,5 kg – 2 439 kg</p>

        {data.donnees_techniques.length === 0 && (
          <div style={emptyHintStyle}>Aucune donnée technique. Cliquer sur "+ Ajouter une donnée" ci-dessous.</div>
        )}

        {data.donnees_techniques.map((dt, i) => (
          <div key={i} style={rowStyle}>
            <input
              value={dt.label}
              onChange={(e) => updateDt(i, 'label', e.target.value)}
              placeholder="Label (ex: Poids opérationnel)"
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              value={dt.valeur}
              onChange={(e) => updateDt(i, 'valeur', e.target.value)}
              placeholder="Valeur (ex: 2 371,5 kg – 2 439 kg)"
              style={{ ...inputStyle, flex: 2 }}
            />
            <button onClick={() => removeDt(i)} style={iconBtnStyle} aria-label="Supprimer">🗑️</button>
          </div>
        ))}

        <button onClick={addDt} style={addBtnStyle}>+ Ajouter une donnée technique</button>
      </div>

      <div>
        <div style={subTitleStyle}>Équipements inclus</div>
        <p style={hintStyle}>Ex : Commande par joystick-pilote / Cabine, Climatisation (A/C)</p>

        {data.equipements.length === 0 && (
          <div style={emptyHintStyle}>Aucun équipement. Cliquer sur "+ Ajouter un équipement" ci-dessous.</div>
        )}

        {data.equipements.map((eq, i) => (
          <div key={i} style={rowStyle}>
            <input
              value={eq}
              onChange={(e) => updateEq(i, e.target.value)}
              placeholder="Ex: Cabine, Climatisation (A/C), Écran multifonction"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => removeEq(i)} style={iconBtnStyle} aria-label="Supprimer">🗑️</button>
          </div>
        ))}

        <button onClick={addEq} style={addBtnStyle}>+ Ajouter un équipement</button>
      </div>
    </div>
  );
}

const subTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#1E3A5F', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4,
};
const hintStyle: React.CSSProperties = {
  fontSize: 12, color: '#6B7280', margin: '0 0 10px',
};
const emptyHintStyle: React.CSSProperties = {
  padding: '10px 14px', background: '#F9FAFB', border: '1px dashed #D1D5DB',
  borderRadius: 8, fontSize: 12, color: '#9CA3AF', marginBottom: 10,
};
const rowStyle: React.CSSProperties = {
  display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  background: '#fff', color: '#111827',
};
const iconBtnStyle: React.CSSProperties = {
  background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B',
  borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
};
const addBtnStyle: React.CSSProperties = {
  marginTop: 4, padding: '8px 14px', background: '#EEF2FF', color: '#4F46E5',
  border: '1px dashed #C7D2FE', borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
