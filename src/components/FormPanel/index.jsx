import UrlList from './UrlList.jsx';
import FormatSelector from './FormatSelector.jsx';

const FORMAT_BTN_LABELS = {
  'html': 'Generate responsive HTML',
  'react-css': 'Generate React + CSS Modules',
  'react-tailwind': 'Generate React + Tailwind',
  'react-inline': 'Generate React + Inline Styles',
  'vue': 'Generate Vue + CSS',
};

export default function FormPanel({
  urls, sizeTags, token, format, status, progress, isGenerating, hasGenerated,
  onAddUrl, onRemoveUrl, onUpdateUrl, onTokenChange,
  onFormatChange, onGenerate, onDownload, onCopy, onReset,
}) {
  const progClass = (n) =>
    'prog-seg' + (n < progress ? ' done' : n === progress ? ' active' : '');

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-top">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1>Code Generator <span className="badge">Beta</span></h1>
            <p>Figma frames → production-ready code</p>
          </div>
        </div>
        <div className="pill-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Free Forever · AI-Powered · No Account Needed
        </div>
      </div>

      {/* Body */}
      <div className="form-body">
        <div className="progress" style={{ marginTop: 4 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={progClass(n)} id={`p${n}`}></div>
          ))}
        </div>

        <UrlList
          urls={urls}
          sizeTags={sizeTags}
          onAdd={onAddUrl}
          onRemove={onRemoveUrl}
          onUpdate={onUpdateUrl}
        />

        <div className="field">
          <label>Figma Access Token</label>
          <input
            type="password"
            id="figma-token"
            placeholder="figd_…"
            value={token}
            onChange={e => onTokenChange(e.target.value)}
          />
          <div className="hint">
            Get it at <a href="https://www.figma.com/settings" target="_blank" rel="noopener">figma.com/settings</a> → Personal access tokens
          </div>
        </div>

        <FormatSelector format={format} onChange={onFormatChange} />
      </div>

      {/* Footer */}
      <div className="form-footer">
        <button
          className="btn-generate"
          id="generate-btn"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {FORMAT_BTN_LABELS[format] || 'Generate'}
        </button>

        <div className={`status${status.type ? ' ' + status.type : ''}`}
          dangerouslySetInnerHTML={{ __html: status.msg }}
        />

        {hasGenerated && (
          <div className="post-actions" style={{ marginTop: 12 }}>
            <div className="actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button className="btn-action" onClick={onDownload} style={{ justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
              <button className="btn-action" onClick={onCopy} style={{ justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy
              </button>
              <button className="btn-action" onClick={onReset} style={{ justifyContent: 'center', color: 'var(--red)', borderColor: '#fca5a5' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                </svg>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
