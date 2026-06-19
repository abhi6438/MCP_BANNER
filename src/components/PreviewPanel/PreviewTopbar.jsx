import { useState } from 'react';

export default function PreviewTopbar({ previewData, format, activeSize, onSizeChange }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const isHTML = format === 'html';

  return (
    <div className="preview-topbar">
      <div className="preview-topbar-title">
        {previewData && <div className="preview-dot" style={{}}></div>}
        Preview
      </div>

      <div className="topbar-controls" id="topbar-controls">
        {previewData && isHTML
          ? previewData.banners.map((b, i) => (
              <button
                key={i}
                className={`size-btn${activeSize?.w === b.w ? ' active' : ''}`}
                onClick={() => onSizeChange(b)}
              >
                {b.size}
              </button>
            ))
          : previewData
            ? <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No live preview for {previewData.fmtLabel}
              </span>
            : null
        }
      </div>

      {previewData && (
        <div className="info-wrap" id="info-wrap">
          <button
            className={`info-btn${infoOpen ? ' active' : ''}`}
            id="info-btn"
            aria-label="Details"
            onClick={e => { e.stopPropagation(); setInfoOpen(o => !o); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
          <div className={`info-popover${infoOpen ? ' open' : ''}`} id="info-popover">
            {[
              ['Size', previewData.sizeList],
              ['Layers', previewData.totalLayers],
              ['Format', previewData.fmtLabel],
              ['Time', previewData.elapsed + 's'],
            ].map(([k, v]) => (
              <div key={k} className="info-row">
                <span className="info-key">{k}</span>
                <span className="info-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
