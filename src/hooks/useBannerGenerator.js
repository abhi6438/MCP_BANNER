import { useState, useCallback } from 'react';
import { parseFigmaUrl, fetchFigmaData, fetchFigmaImages } from '../utils/figmaApi.js';
import { extractDesignData, injectImageUrls, flattenLayers } from '../utils/figmaParser.js';
import { generateBannerHTML } from '../utils/figmaParser.js';
import { generateResponsiveHTML } from '../utils/generators/htmlGenerator.js';
import { generateReactCSSModules } from '../utils/generators/reactCSSModules.js';
import { generateReactTailwind } from '../utils/generators/reactTailwind.js';
import { generateReactInlineStyles } from '../utils/generators/reactInline.jsx';
import { generateVueCSS } from '../utils/generators/vue.js';
import { handleDownload as downloadUtil, handleCopy as copyUtil } from '../utils/download.js';

const FORMAT_LABELS = {
  'html': 'HTML',
  'react-css': 'React + CSS Modules',
  'react-tailwind': 'React + Tailwind',
  'react-inline': 'React + Inline Styles',
  'vue': 'Vue + CSS',
};

async function processBannerUrl(url, token) {
  const parsed = parseFigmaUrl(url);
  if (!parsed?.fileKey) throw new Error('Could not parse Figma URL');
  const figmaData = await fetchFigmaData(parsed.fileKey, parsed.nodeId, token);
  const designData = extractDesignData(figmaData, parsed.nodeId);
  if (designData.imageNodeIds.length > 0) {
    const imageMap = await fetchFigmaImages(parsed.fileKey, designData.imageNodeIds, token);
    injectImageUrls(designData.tree, imageMap);
  }
  const sizeHint = designData.size || '300x250';
  const [w, h] = sizeHint.split('x').map(Number);
  const { layers, rootFill, rootGradient } = flattenLayers(designData.tree);
  return { w, h, size: sizeHint, layers, rootFill, rootGradient };
}

export function useBannerGenerator() {
  const [urls, setUrls] = useState(['']);
  const [token, setTokenState] = useState('');
  const [format, setFormat] = useState('html');
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [progress, setProgress] = useState(1);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [previewData, setPreviewData] = useState(null); // { banners, totalLayers, elapsed }
  const [isGenerating, setIsGenerating] = useState(false);

  const setToken = useCallback((val) => {
    setTokenState(val);
  }, []);

  const addUrl = useCallback(() => setUrls(u => [...u, '']), []);

  const removeUrl = useCallback((idx) => {
    setUrls(u => {
      if (u.length <= 1) {
        const next = [...u]; next[0] = ''; return next;
      }
      return u.filter((_, i) => i !== idx);
    });
  }, []);

  const updateUrl = useCallback((idx, val) => {
    setUrls(u => { const next = [...u]; next[idx] = val; return next; });
  }, []);

  const reset = useCallback(() => {
    setUrls(['']);
    setGeneratedHTML('');
    setGeneratedFiles([]);
    setPreviewData(null);
    setProgress(1);
    setStatus({ msg: '', type: '' });
    setIsGenerating(false);
  }, []);

  const runPipeline = useCallback(async () => {
    const trimmedUrls = urls.map(u => u.trim()).filter(Boolean);
    if (!token) { setStatus({ msg: 'Enter your Figma access token', type: 'error' }); return; }
    if (!trimmedUrls.length) { setStatus({ msg: 'Enter at least one Figma URL', type: 'error' }); return; }

    setIsGenerating(true);
    setGeneratedHTML('');
    setGeneratedFiles([]);
    setPreviewData(null);
    const t0 = Date.now();
    const banners = [];
    const urlStatuses = urls.map(() => 'idle'); // track per-url state

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i].trim();
      if (!url) continue;
      // Small delay between requests to avoid Figma rate limits
      if (i > 0) await new Promise(r => setTimeout(r, 500));
      setStatus({ msg: `Banner ${i + 1}/${trimmedUrls.length}: fetching from Figma…`, type: '' });
      setProgress(2);
      try {
        const banner = await processBannerUrl(url, token);
        banners.push(banner);
        urlStatuses[i] = 'done:' + banner.size;
      } catch (e) {
        urlStatuses[i] = 'error';
        setStatus({ msg: `Banner ${i + 1}: ${e.message}`, type: 'error' });
      }
    }

    if (!banners.length) { setIsGenerating(false); return; }

    const fmtLabel = FORMAT_LABELS[format] || format;
    setStatus({ msg: `Building ${fmtLabel}…`, type: '' });
    setProgress(3);
    banners.sort((a, b) => b.w - a.w);

    let html = '';
    let files = [];

    if (format === 'html') {
      html = banners.length === 1
        ? generateBannerHTML(banners[0].layers, banners[0].rootFill, banners[0].rootGradient, banners[0].w, banners[0].h)
        : generateResponsiveHTML(banners);
      files = [{ name: 'banner.html', content: html }];
    } else if (format === 'react-css') {
      files = generateReactCSSModules(banners);
    } else if (format === 'react-tailwind') {
      files = generateReactTailwind(banners);
    } else if (format === 'react-inline') {
      files = generateReactInlineStyles(banners);
    } else if (format === 'vue') {
      files = generateVueCSS(banners);
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const totalLayers = banners.reduce((s, b) => s + b.layers.length, 0);
    const sizeList = banners.map(b => b.size).join(', ');

    setGeneratedHTML(html);
    setGeneratedFiles(files);
    setPreviewData({ banners, totalLayers, elapsed, sizeList, fmtLabel });
    setProgress(4);
    setStatus({
      msg: `Done! ${banners.length} size${banners.length > 1 ? 's' : ''} (${sizeList}), ${totalLayers} layers — ${fmtLabel}`,
      type: 'success'
    });
    setIsGenerating(false);
  }, [urls, token, format]);

  const doDownload = useCallback(() => {
    return downloadUtil(format, generatedHTML, generatedFiles);
  }, [format, generatedHTML, generatedFiles]);

  const doCopy = useCallback(() => {
    return copyUtil(format, generatedHTML, generatedFiles);
  }, [format, generatedHTML, generatedFiles]);

  return {
    urls, token, format, status, progress,
    generatedHTML, generatedFiles, previewData, isGenerating,
    addUrl, removeUrl, updateUrl, setToken, setFormat,
    runPipeline, reset, doDownload, doCopy,
  };
}
