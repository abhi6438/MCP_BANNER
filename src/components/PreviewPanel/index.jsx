import { useState, useEffect } from 'react';
import PreviewTopbar from './PreviewTopbar.jsx';
import EmptyState from './EmptyState.jsx';
import CodeViewer from './CodeViewer.jsx';

export default function PreviewPanel({ previewData, generatedHTML, generatedFiles, format, onBackToForm, onDownload, onCopy, onReset }) {
  const [activeSize, setActiveSize] = useState(null);

  useEffect(() => {
    if (previewData?.banners?.length) {
      setActiveSize(previewData.banners[0]);
    }
  }, [previewData]);

  const isHTML = format === 'html';
  const displayFiles = generatedFiles.length
    ? generatedFiles
    : generatedHTML
      ? [{ name: 'banner.html', content: generatedHTML }]
      : [];

  return (
    <div className="preview-panel" id="preview-panel">
      {/* Mobile top bar — back button + actions */}
      {previewData && (
        <div className="mobile-preview-bar">
          <button className="mobile-back-btn" onClick={onBackToForm} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Edit
          </button>
          <div className="mobile-preview-actions">
            <button className="mobile-action-btn" onClick={onDownload} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            <button className="mobile-action-btn" onClick={onCopy} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy
            </button>
            <button className="mobile-action-btn danger" onClick={onReset} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
              </svg>
              Reset
            </button>
          </div>
        </div>
      )}

      <PreviewTopbar
        previewData={previewData}
        format={format}
        activeSize={activeSize}
        onSizeChange={setActiveSize}
      />
      <div className="preview-content">
        {!previewData ? (
          <EmptyState />
        ) : (
          <>
            {isHTML && generatedHTML && activeSize && (
              <div className="preview-card">
                <div className="preview-wrap">
                  <iframe
                    key={`${activeSize.w}x${activeSize.h}`}
                    srcDoc={generatedHTML}
                    style={{ width: activeSize.w, height: activeSize.h, border: 'none' }}
                    title="Banner preview"
                  />
                </div>
              </div>
            )}
            <CodeViewer files={displayFiles} />
          </>
        )}
      </div>
    </div>
  );
}
