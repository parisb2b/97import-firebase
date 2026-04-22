// src/admin/components/produit/OngletOptions.tsx
// Onglet back-office pour définir le groupe + options d'un produit

import { useState, useEffect } from 'react';
import { OptionsConfig, OptionDropdown, OptionChoice } from '../../../lib/productGroupHelpers';

interface Props {
  product: any;
  onUpdate: (updates: { groupe_produit?: string; options_config?: OptionsConfig | null }) => void;
}

export default function OngletOptions({ product, onUpdate }: Props) {
  const [groupe, setGroupe] = useState<string>(product.groupe_produit || '');
  const [config, setConfig] = useState<OptionsConfig>(
    product.options_config || { dropdowns: [] }
  );
  const [hasOptions, setHasOptions] = useState<boolean>(!!product.options_config);

  useEffect(() => {
    setGroupe(product.groupe_produit || '');
    setConfig(product.options_config || { dropdowns: [] });
    setHasOptions(!!product.options_config);
  }, [product]);

  function save() {
    onUpdate({
      groupe_produit: groupe.trim() || undefined,
      options_config: hasOptions ? config : null,
    });
    alert('Options sauvegardées ✅');
  }

  function addDropdown() {
    setConfig({
      ...config,
      dropdowns: [
        ...config.dropdowns,
        { label: 'Nouvelle option', choices: [{ label: 'Choix 1', ref: '' }] },
      ],
    });
  }

  function removeDropdown(idx: number) {
    if (!confirm('Supprimer ce dropdown ?')) return;
    setConfig({
      ...config,
      dropdowns: config.dropdowns.filter((_, i) => i !== idx),
    });
  }

  function updateDropdown(idx: number, updates: Partial<OptionDropdown>) {
    const newDropdowns = [...config.dropdowns];
    newDropdowns[idx] = { ...newDropdowns[idx], ...updates };
    setConfig({ ...config, dropdowns: newDropdowns });
  }

  function addChoice(ddIdx: number) {
    const dd = config.dropdowns[ddIdx];
    updateDropdown(ddIdx, {
      choices: [...dd.choices, { label: 'Nouveau choix', ref: '' }],
    });
  }

  function updateChoice(ddIdx: number, choiceIdx: number, updates: Partial<OptionChoice>) {
    const dd = config.dropdowns[ddIdx];
    const newChoices = [...dd.choices];
    newChoices[choiceIdx] = { ...newChoices[choiceIdx], ...updates };
    updateDropdown(ddIdx, { choices: newChoices });
  }

  function removeChoice(ddIdx: number, choiceIdx: number) {
    if (!confirm('Supprimer ce choix ?')) return;
    const dd = config.dropdowns[ddIdx];
    updateDropdown(ddIdx, {
      choices: dd.choices.filter((_, i) => i !== choiceIdx),
    });
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Groupe de produit + Options</h3>

      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
        Pour regrouper plusieurs variantes en une seule fiche (ex: R22 caoutchouc/métal/double chenilles),
        remplissez le champ "Groupe produit" sur CHAQUE variante avec la même valeur.<br/>
        Puis, sur UNE SEULE variante (la fiche parente), activez les options et configurez les dropdowns.
      </p>

      {/* Groupe */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Groupe produit (ex: R22, MS-STANDARD, KS-10K)</label>
        <input
          type="text"
          value={groupe}
          onChange={e => setGroupe(e.target.value)}
          placeholder="Laisser vide si pas de regroupement"
          style={inputStyle}
        />
      </div>

      {/* Toggle options */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasOptions}
            onChange={e => setHasOptions(e.target.checked)}
          />
          <span style={{ fontWeight: 600 }}>Cette variante est la fiche parente (affiche les dropdowns d'options)</span>
        </label>
      </div>

      {/* Dropdowns */}
      {hasOptions && (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, background: '#F9FAFB' }}>
          <h4 style={{ marginTop: 0 }}>Dropdowns d'options</h4>

          {config.dropdowns.map((dd, ddIdx) => (
            <div key={ddIdx} style={dropdownCardStyle}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <input
                  type="text"
                  value={dd.label}
                  onChange={e => updateDropdown(ddIdx, { label: e.target.value })}
                  placeholder="Label dropdown (ex: Chenilles, Type de fixation)"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={() => removeDropdown(ddIdx)} style={btnDangerStyle}>× Supprimer dropdown</button>
              </div>

              <div style={{ paddingLeft: 20, borderLeft: '3px solid #D1D5DB' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Choix</div>
                {dd.choices.map((c, choiceIdx) => (
                  <div key={choiceIdx} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={c.label}
                        onChange={e => updateChoice(ddIdx, choiceIdx, { label: e.target.value })}
                        placeholder="Label choix"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <input
                        type="text"
                        value={c.ref}
                        onChange={e => updateChoice(ddIdx, choiceIdx, { ref: e.target.value })}
                        placeholder="Ref Firestore (ex: MP-R22-001)"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <input
                        type="text"
                        value={c.description || ''}
                        onChange={e => updateChoice(ddIdx, choiceIdx, { description: e.target.value })}
                        placeholder="Description (optionnel)"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button onClick={() => removeChoice(ddIdx, choiceIdx)} style={btnDangerStyle}>×</button>
                    </div>

                    {/* Condition UI */}
                    <div style={conditionWrapStyle}>
                      <label style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!c.condition}
                          onChange={e => {
                            if (e.target.checked) {
                              // Activer la condition avec des valeurs par défaut
                              const otherDropdowns = config.dropdowns.filter((_, i) => i !== ddIdx);
                              const firstOther = otherDropdowns[0];
                              if (!firstOther) {
                                alert('Ajoutez d\'abord un autre dropdown pour créer une condition');
                                return;
                              }
                              const firstOtherChoice = firstOther.choices[0];
                              updateChoice(ddIdx, choiceIdx, {
                                condition: {
                                  dropdown_label: firstOther.label,
                                  value: firstOtherChoice?.label || '',
                                },
                              });
                            } else {
                              // Désactiver la condition
                              updateChoice(ddIdx, choiceIdx, { condition: undefined });
                            }
                          }}
                        />
                        Ce choix est visible uniquement si un autre dropdown vaut une certaine valeur
                      </label>

                      {c.condition && (
                        <div style={conditionFieldsStyle}>
                          <span style={{ fontSize: 12, color: '#374151' }}>Visible si</span>

                          {/* Sélecteur dropdown de référence */}
                          <select
                            value={c.condition.dropdown_label}
                            onChange={e => {
                              const newDropdown = e.target.value;
                              const targetDropdown = config.dropdowns.find(d => d.label === newDropdown);
                              const firstChoice = targetDropdown?.choices[0];
                              updateChoice(ddIdx, choiceIdx, {
                                condition: {
                                  dropdown_label: newDropdown,
                                  value: firstChoice?.label || '',
                                },
                              });
                            }}
                            style={conditionSelectStyle}
                          >
                            {config.dropdowns
                              .filter((_, i) => i !== ddIdx)
                              .map(d => (
                                <option key={d.label} value={d.label}>{d.label}</option>
                              ))}
                          </select>

                          <span style={{ fontSize: 12, color: '#374151' }}>=</span>

                          {/* Sélecteur valeur */}
                          <select
                            value={c.condition.value}
                            onChange={e => {
                              updateChoice(ddIdx, choiceIdx, {
                                condition: {
                                  ...c.condition!,
                                  value: e.target.value,
                                },
                              });
                            }}
                            style={conditionSelectStyle}
                          >
                            {config.dropdowns
                              .find(d => d.label === c.condition?.dropdown_label)
                              ?.choices.map(choice => (
                                <option key={choice.label} value={choice.label}>{choice.label}</option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button onClick={() => addChoice(ddIdx)} style={btnSmallStyle}>+ Ajouter un choix</button>
              </div>
            </div>
          ))}

          <button onClick={addDropdown} style={btnPrimaryStyle}>+ Ajouter un dropdown</button>
        </div>
      )}

      {/* Bouton sauvegarder */}
      <div style={{ marginTop: 20 }}>
        <button onClick={save} style={{ ...btnPrimaryStyle, fontSize: 15 }}>
          💾 Sauvegarder le groupe et les options
        </button>
      </div>

      {/* Aperçu JSON (pour debug) */}
      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>Voir le JSON stocké</summary>
        <pre style={{ background: '#F3F4F6', padding: 12, fontSize: 11, overflow: 'auto' }}>
          {JSON.stringify({ groupe_produit: groupe, options_config: hasOptions ? config : null }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#374151', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid #D1D5DB',
  borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

const dropdownCardStyle: React.CSSProperties = {
  background: '#fff', padding: 16, borderRadius: 8,
  marginBottom: 12, border: '1px solid #E5E7EB',
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 16px', background: '#1E3A5F',
  color: '#fff', border: 'none', borderRadius: 6,
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnSmallStyle: React.CSSProperties = {
  padding: '6px 12px', background: '#E5E7EB',
  color: '#374151', border: 'none', borderRadius: 6,
  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};

const btnDangerStyle: React.CSSProperties = {
  padding: '6px 10px', background: '#FEE2E2',
  color: '#991B1B', border: 'none', borderRadius: 6,
  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};

const conditionWrapStyle: React.CSSProperties = {
  marginTop: 6,
  marginLeft: 20,
  padding: 8,
  background: '#FEF3C7',
  borderLeft: '3px solid #F59E0B',
  borderRadius: 4,
};

const conditionFieldsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 6,
};

const conditionSelectStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #D1D5DB',
  borderRadius: 4,
  fontSize: 12,
  fontFamily: 'inherit',
  background: '#fff',
  cursor: 'pointer',
};
