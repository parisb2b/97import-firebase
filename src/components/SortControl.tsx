import { useI18n } from '../i18n';

interface SortControlProps {
  value: 'desc' | 'asc';
  onChange: (v: 'desc' | 'asc') => void;
}

export const SortControl = ({ value, onChange }: SortControlProps) => {
  const { t } = useI18n();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'desc' | 'asc')}
      className="text-sm border rounded px-2 py-1"
    >
      <option value="desc">{t('sort.recent')}</option>
      <option value="asc">{t('sort.oldest')}</option>
    </select>
  );
};
