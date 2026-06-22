import { buildBannerAssets, generateBannerHTML, gradientCSS, layerRulesCSS, layerInner, buildFontMap, buildFontLink } from '../figmaParser.js';
import { generateFluidBannerSection } from './fluidLayout.js';

const _vcTypes = new Set(['VECTOR','BOOLEAN_OPERATION','STAR','POLYGON','COMPONENT','INSTANCE','GROUP']);

const TERMS_MODAL_CSS = `
.terms-modal { display: none; position: fixed; inset: 0; z-index: 2147483647; font-family: 'Montserrat', sans-serif; }
.terms-modal.is-open { display: block; }
.terms-modal__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.55); }
.terms-modal__dialog { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(92vw,900px); height: min(90vh,720px); background: #FFF; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,.3); overflow: hidden; display: flex; flex-direction: column; }
.terms-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #E5E7EB; background: #FAF7F5; flex-shrink: 0; }
.terms-modal__title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700; color: #132122; margin: 0; }
.terms-modal__close { width: 32px; height: 32px; border: none; background: transparent; font-size: 24px; line-height: 1; cursor: pointer; color: #132122; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.terms-modal__close:hover { background: rgba(0,0,0,.06); }
.terms-modal__body { flex: 1; position: relative; min-height: 0; background: #FFF; }
.terms-modal__frame { width: 100%; height: 100%; border: 0; display: block; }`;

const TERMS_MODAL_HTML = `  <div id="terms-modal" class="terms-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
    <div class="terms-modal__backdrop" data-terms-close></div>
    <div class="terms-modal__dialog" role="document">
      <div class="terms-modal__header">
        <h2 id="terms-modal-title" class="terms-modal__title">Terms &amp; Conditions</h2>
        <button type="button" class="terms-modal__close" aria-label="Close" data-terms-close>&#xD7;</button>
      </div>
      <div class="terms-modal__body">
        <iframe class="terms-modal__frame" title="Terms and Conditions" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  </div>`;

const TERMS_MODAL_SCRIPT = `(function(){var m=document.getElementById('terms-modal');if(!m)return;var f=m.querySelector('.terms-modal__frame');function open(u){f.src=u;m.classList.add('is-open');m.setAttribute('aria-hidden','false');}function close(){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');f.src='about:blank';}document.addEventListener('click',function(e){var l=e.target.closest&&e.target.closest('a[data-terms-link]');if(!l)return;e.preventDefault();open(l.href);});m.addEventListener('click',function(e){if(e.target&&e.target.hasAttribute&&e.target.hasAttribute('data-terms-close'))close();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&m.classList.contains('is-open'))close();});})();`;

export function generateResponsiveHTML(banners) {
  // Shared span map so common inline text styles get deduplicated across banners
  const spanMap = {};
  const regSpan = decls => {
    const key = decls.slice().sort().join(';');
    if (!spanMap[key]) spanMap[key] = `s${Object.keys(spanMap).length}`;
    return spanMap[key];
  };

  // Build combined font map across all banners
  const allFontMap = {};
  banners.forEach(b => {
    Object.entries(buildFontMap(b.layers)).forEach(([f, ws]) => {
      if (!allFontMap[f]) allFontMap[f] = new Set();
      ws.forEach(w => allFontMap[f].add(w));
    });
  });
  const fontLink = buildFontLink(allFontMap);

  // Generate a separate flex-layout section for each banner size
  const sections = banners.map((b, i) =>
    generateFluidBannerSection(b.layers, b.rootFill, b.rootGradient, b.w, b.h, `b${i}`, regSpan)
  );

  // Container-query show/hide: banners sorted largest→smallest
  // b0 shows at width >= b0.w, b1 shows at b1.w <= width < b0.w, etc.
  // Default (no query): show b0, hide rest
  const defaultVisibility = banners.map((_, i) =>
    i === 0 ? `.b${i} { display: flex; }` : `.b${i} { display: none; }`
  ).join('\n');

  const showHideQueries = banners.map((b, i) => {
    const larger     = i > 0 ? banners[i - 1].w : null;
    const isSmallest = i === banners.length - 1;

    let cond;
    if (!larger)      cond = `(width >= ${b.w}px)`;
    else if (isSmallest) cond = `(width < ${larger}px)`;
    else               cond = `(${b.w}px <= width < ${larger}px)`;

    // When this size is active: show it, hide all others
    const rules = banners.map((_, j) =>
      j === i ? `  .b${j} { display: flex; }` : `  .b${j} { display: none; }`
    ).join('\n');

    return `@container bco ${cond} {\n${rules}\n}`;
  }).join('\n\n');

  const spanCSS = Object.entries(spanMap).map(([decls, cls]) => `.${cls} { ${decls} }`).join('\n');

  const bgCSS = sections.map(s => s.bgCSS).filter(Boolean).join('\n');

  const sectionHTML = sections.map(s => s.html).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${fontLink}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: transparent; }

.bco {
  container-type: inline-size;
  container-name: bco;
  width: 100%;
}

${defaultVisibility}

${showHideQueries}

${bgCSS}

${spanCSS}

${TERMS_MODAL_CSS}
</style>
</head>
<body>
<div class="bco">
${sectionHTML}
${TERMS_MODAL_HTML}
</div>
<script> ${TERMS_MODAL_SCRIPT} <\/script>
</body>
</html>
`;
}
