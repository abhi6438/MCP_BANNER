import { useState, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import SlidePanel from './components/SlidePanel.jsx';
import FormPanel from './components/FormPanel/index.jsx';
import PreviewPanel from './components/PreviewPanel/index.jsx';
import { useBannerGenerator } from './hooks/useBannerGenerator.js';

export default function App() {
  const [panelKey, setPanelKey] = useState(null);

  const {
    urls, token, format, status, progress,
    generatedHTML, generatedFiles, previewData, isGenerating,
    addUrl, removeUrl, updateUrl, setToken, setFormat,
    runPipeline, reset, doDownload, doCopy,
  } = useBannerGenerator();

  // sizeTags: derived from previewData if available, else empty strings
  const sizeTags = urls.map((_, i) => {
    if (!previewData) return '';
    return previewData.banners[i]?.size || '';
  });

  const handleCopy = useCallback(async () => {
    const name = await doCopy();
    if (name) {
      // status will be updated in hook — nothing extra needed
    }
  }, [doCopy]);

  return (
    <>
      <Navbar onOpenPanel={setPanelKey} />
      <div className="layout">
        {/* Left: Preview */}
        <PreviewPanel
          previewData={previewData}
          generatedHTML={generatedHTML}
          generatedFiles={generatedFiles}
          format={format}
        />
        {/* Right: Form */}
        <FormPanel
          urls={urls}
          sizeTags={sizeTags}
          token={token}
          format={format}
          status={status}
          progress={progress}
          isGenerating={isGenerating}
          hasGenerated={!!previewData}
          onAddUrl={addUrl}
          onRemoveUrl={removeUrl}
          onUpdateUrl={updateUrl}
          onTokenChange={setToken}
          onFormatChange={setFormat}
          onGenerate={runPipeline}
          onDownload={doDownload}
          onCopy={handleCopy}
          onReset={reset}
        />
      </div>
      <Footer onOpenPanel={setPanelKey} />
      <SlidePanel
        isOpen={!!panelKey}
        panelKey={panelKey}
        onClose={() => setPanelKey(null)}
      />
    </>
  );
}
