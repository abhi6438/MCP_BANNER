import { useState, useEffect } from 'react';
import PreviewTopbar from './PreviewTopbar.jsx';
import EmptyState from './EmptyState.jsx';
import CodeViewer from './CodeViewer.jsx';

export default function PreviewPanel({ previewData, generatedHTML, generatedFiles, format }) {
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
