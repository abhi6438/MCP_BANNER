const FORMATS = [
  { value: 'html',           label: 'HTML + CSS',         sub: 'Standalone file' },
  { value: 'react-css',      label: 'React + CSS Modules', sub: '.jsx + .module.css' },
  { value: 'react-tailwind', label: 'React + Tailwind',    sub: '.jsx + banner.css' },
  { value: 'react-inline',   label: 'React + Inline',      sub: 'Single .jsx, no CSS' },
  { value: 'vue',            label: 'Vue + CSS',           sub: 'Single .vue SFC' },
];

export default function FormatSelector({ format, onChange }) {
  return (
    <div className="field">
      <div className="section-label">Output Format</div>
      <div className="format-grid">
        {FORMATS.map(f => (
          <div key={f.value} className="format-opt">
            <input
              type="radio"
              name="fmt"
              id={`fmt-${f.value}`}
              value={f.value}
              checked={format === f.value}
              onChange={() => onChange(f.value)}
            />
            <label htmlFor={`fmt-${f.value}`}>
              {f.label}
              <small>{f.sub}</small>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
