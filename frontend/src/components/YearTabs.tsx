interface YearTabsProps {
  years: number[];
  selected: number;
  onChange: (year: number) => void;
}

export default function YearTabs({ years, selected, onChange }: YearTabsProps) {
  if (years.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', flexWrap: 'wrap' }}>
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onChange(year)}
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--md-radius-sm)',
            border: selected === year
              ? '2px solid var(--md-sys-light-primary)'
              : '1px solid var(--md-sys-light-outline-variant)',
            background: selected === year
              ? 'var(--md-sys-light-primary-container)'
              : 'var(--md-sys-light-surface-container)',
            color: selected === year
              ? 'var(--md-sys-light-on-primary-container)'
              : 'var(--md-sys-light-on-surface)',
            font: 'var(--md-label-large)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {year}년
        </button>
      ))}
    </div>
  );
}
