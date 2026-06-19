export async function handleDownload(format, generatedHTML, generatedFiles) {
  if (format === 'html' && generatedHTML) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([generatedHTML], { type: 'text/html' }));
    a.download = 'banner.html';
    a.click();
    return;
  }
  if (!generatedFiles.length) return;
  if (generatedFiles.length === 1) {
    const f = generatedFiles[0];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([f.content], { type: 'text/plain' }));
    a.download = f.name;
    a.click();
    return;
  }
  // Multi-file → ZIP
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  generatedFiles.forEach(f => zip.file(f.name, f.content));
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'banner-component.zip';
  a.click();
}

export function handleCopy(format, generatedHTML, generatedFiles) {
  const files = generatedFiles.length
    ? generatedFiles
    : (generatedHTML ? [{ name: 'banner.html', content: generatedHTML }] : []);
  const primary = files.find(f => !f.name.endsWith('.md')) || files[0];
  if (!primary) return Promise.resolve(null);
  return navigator.clipboard.writeText(primary.content).then(() => primary.name);
}
