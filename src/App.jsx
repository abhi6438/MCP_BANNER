import { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import SlidePanel from './components/SlidePanel.jsx';
import FormPanel from './components/FormPanel/index.jsx';
import PreviewPanel from './components/PreviewPanel/index.jsx';
import { useBannerGenerator } from './hooks/useBannerGenerator.js';

export default function App() {
  const [panelKey, setPanelKey] = useState(null);
  const [mobileView, setMobileView] = useState('form'); // 'form' | 'preview'

  const {
    urls, token, format, status, progress,
    generatedHTML, generatedFiles, previewData, isGenerating,
    addUrl, removeUrl, updateUrl, setToken, setFormat,
    runPipeline, reset, doDownload, doCopy,
  } = useBannerGenerator();

  // Auto-switch to preview on mobile when generation completes
  useEffect(() => {
    if (previewData) setMobileView('preview');
  }, [previewData]);

  const sizeTags = urls.map((_, i) => {
    if (!previewData) return '';
    return previewData.banners[i]?.size || '';
  });

  const handleCopy = useCallback(async () => {
    await doCopy();
  }, [doCopy]);

  const handleReset = useCallback(() => {
    reset();
    setMobileView('form');
  }, [reset]);

  return (
    <>
      <Navbar onOpenPanel={setPanelKey} />
      <div className={`layout mobile-${mobileView}`}>
        {/* Left: Preview */}
        <PreviewPanel
          previewData={previewData}
          generatedHTML={generatedHTML}
          generatedFiles={generatedFiles}
          format={format}
          onBackToForm={() => setMobileView('form')}
          onDownload={doDownload}
          onCopy={handleCopy}
          onReset={handleReset}
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
          onReset={handleReset}
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
