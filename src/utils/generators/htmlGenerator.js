import { buildBannerAssets, generateBannerHTML, gradientCSS, layerRulesCSS, layerInner, buildFontMap, buildFontLink } from '../figmaParser.js';

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
  const spanMap = {};
  function regSpan(decls) {
    const key = decls.slice().sort().join(';');
    if (!spanMap[key]) spanMap[key] = `s${Object.keys(spanMap).length}`;
    return spanMap[key];
  }

  function sanitizeName(raw) {
    return (raw || 'layer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'layer';
  }

  function assignClasses(layers) {
    const counts = {};
    return layers.map(l => {
      const base = 'l-' + sanitizeName(l.name);
      counts[base] = (counts[base] || 0) + 1;
      return counts[base] === 1 ? base : `${base}-${counts[base]}`;
    });
  }

  const bannerClasses = banners.map(b => assignClasses(b.layers));
  const masterClasses = bannerClasses[0];
  const masterLayers  = banners[0].layers;

  const normText  = t => t.toLowerCase().replace(/\s+/g, ' ').trim();
  const alphaText = t => t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
  const bannerMaps = banners.map((b, bi) => {
    const byName = {}, byText = {}, byTextNorm = {}, byTextAlpha = {};
    b.layers.forEach((l, i) => {
      byName[bannerClasses[bi][i]] = l;
      if (l.type === 'TEXT' && l.text) {
        const key   = l.text.trim().slice(0, 120);
        const norm  = normText(l.text).slice(0, 120);
        const alpha = alphaText(l.text);
        if (!byText[key])       byText[key]       = l;
        if (!byTextNorm[norm])  byTextNorm[norm]  = l;
        if (!byTextAlpha[alpha]) byTextAlpha[alpha] = l;
      }
    });
    return { byName, byText, byTextNorm, byTextAlpha };
  });

  const masterTextSet      = new Set(masterLayers.filter(l => l.type === 'TEXT' && l.text).map(l => l.text.trim().slice(0, 120)));
  const masterTextSetNorm  = new Set(masterLayers.filter(l => l.type === 'TEXT' && l.text).map(l => normText(l.text).slice(0, 120)));
  const masterTextSetAlpha = new Set(masterLayers.filter(l => l.type === 'TEXT' && l.text).map(l => alphaText(l.text)));

  const allClasses = [...masterClasses];
  bannerClasses.slice(1).forEach((classes, si) => {
    const bi = si + 1;
    classes.forEach((cls, j) => {
      if (allClasses.includes(cls)) return;
      const l = banners[bi].layers[j];
      if (l.type === 'TEXT' && l.text) {
        const exact = l.text.trim().slice(0, 120);
        const norm  = normText(l.text).slice(0, 120);
        const alpha = alphaText(l.text);
        if (masterTextSet.has(exact) || masterTextSetNorm.has(norm) || masterTextSetAlpha.has(alpha)) return;
      }
      allClasses.push(cls);
    });
  });

  const extraLayerContent = {};
  allClasses.forEach(cls => {
    if (!bannerMaps[0].byName[cls]) {
      bannerMaps.slice(1).find(m => m.byName[cls] && (extraLayerContent[cls] = m.byName[cls]));
    }
  });

  const layerDivs = allClasses.map(cls => {
    const l = bannerMaps[0].byName[cls] ?? extraLayerContent[cls];
    if (!l) return '';
    const inner = l.hasImage ? '' : layerInner(l, regSpan);
    return `      <div class="${cls}">${inner}</div>`;
  }).join('\n');

  const allFontMap = {};
  banners.forEach(b => {
    Object.entries(buildFontMap(b.layers)).forEach(([f, ws]) => {
      if (!allFontMap[f]) allFontMap[f] = new Set();
      ws.forEach(w => allFontMap[f].add(w));
    });
  });
  const fontLink = buildFontLink(allFontMap);

  const baseLayerCSS = allClasses.map(cls => `.bv .${cls} { position: absolute; box-sizing: border-box; }`).join('\n');

  const containerQueries = banners.map((b, i) => {
    const larger    = i > 0 ? banners[i - 1].w : null;
    const isSmallest = i === banners.length - 1;

    let cond;
    if (banners.length === 1) cond = '';
    else if (!larger)         cond = ` (width >= ${b.w}px)`;
    else if (isSmallest)      cond = ` (width < ${larger}px)`;
    else                      cond = ` (${b.w}px <= width < ${larger}px)`;

    const scale = `tan(atan2(100cqi, ${b.w}px))`;
    const map   = bannerMaps[i];

    let bgRule = '';
    if (b.rootGradient) bgRule = `background: ${gradientCSS(b.rootGradient)};`;
    else if (b.rootFill) bgRule = `background: ${b.rootFill};`;

    const layerCSS = allClasses.map(cls => {
      let l = map.byName[cls];
      if (!l) {
        const masterL = bannerMaps[0].byName[cls];
        if (masterL?.type === 'TEXT' && masterL?.text) {
          const key   = masterL.text.trim().slice(0, 120);
          const norm  = normText(masterL.text).slice(0, 120);
          const alpha = alphaText(masterL.text);
          l = map.byText[key] || map.byTextNorm[norm] || map.byTextAlpha[alpha];
        }
      }
      if (!l) return `  .bv .${cls} { display: none; }`;

      let rules = layerRulesCSS(l).filter(r => !r.startsWith('position:') && !r.startsWith('box-sizing:'));
      rules.unshift('display: block');

      const masterL = bannerMaps[0].byName[cls];
      if (masterL?.type === 'TEXT' && l.type !== 'TEXT') {
        rules = rules.filter(r => !r.startsWith('background') && r !== 'overflow: hidden');
        if (masterL.color)      rules.push(`color: ${masterL.color}`);
        if (masterL.fontSize)   rules.push(`font-size: ${masterL.fontSize}px`);
        if (masterL.fontWeight) rules.push(`font-weight: ${masterL.fontWeight}`);
        if (masterL.fontFamily) rules.push(`font-family: '${masterL.fontFamily}', sans-serif`);
        if (masterL.textAlign)  rules.push(`text-align: ${masterL.textAlign}`);
        rules.push('white-space: pre-wrap');
      }

      const zIdx = banners[i].layers.indexOf(l);
      if (zIdx >= 0) rules.push(`z-index: ${zIdx}`);

      if (l.hasImage && l.imageUrl) {
        const fit = _vcTypes.has(l.type) ? 'contain' : 'cover';
        rules.push(`background-image: url('${l.imageUrl}')`);
        rules.push('background-repeat: no-repeat');
        rules.push(`background-size: ${fit}`);
        rules.push('background-position: center');
      }

      return `  .bv .${cls} { ${rules.join('; ')} }`;
    }).join('\n');

    return `/* ${b.w}×${b.h} */\n@container bco${cond} {\n  .bc { height: calc(${scale} * ${b.h}px); ${bgRule} }\n  .bv { width: ${b.w}px; height: ${b.h}px; scale: ${scale}; }\n${layerCSS}\n}`;
  }).join('\n\n');

  const spanCSS = Object.entries(spanMap).map(([decls, cls]) => `.${cls} { ${decls} }`).join('\n');

  const debugComment = banners.map((b, i) => {
    const map = bannerMaps[i];
    const pairs = allClasses.map(cls => {
      const byName = map.byName[cls];
      if (byName) return `  ${cls} ✓name "${byName.name || '?'}"`;
      const masterL = bannerMaps[0].byName[cls];
      if (masterL?.type === 'TEXT' && masterL?.text) {
        const key  = masterL.text.trim().slice(0, 120);
        const norm = normText(masterL.text).slice(0, 120);
        if (map.byText[key])      return `  ${cls} ✓text "${map.byText[key].name || '?'}"`;
        if (map.byTextNorm[norm]) return `  ${cls} ✓norm "${map.byTextNorm[norm].name || '?'}"`;
      }
      return `  ${cls} ✗hidden`;
    }).join('\n');
    return `Banner ${i} (${b.w}×${b.h}):\n${pairs}`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${fontLink}
<!--
LAYER CLASS DEBUG — view source to diagnose missing layers
${debugComment}
-->
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: transparent; }

.bc-outer {
  container-type: inline-size;
  container-name: bco;
  width: 100%;
}

.bc {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.bv {
  position: absolute;
  top: 0; left: 0;
  transform-origin: top left;
  overflow: hidden;
}

${baseLayerCSS}

${containerQueries}

${spanCSS}

${TERMS_MODAL_CSS}
</style>
</head>
<body>
<div class="bc-outer">
  <div class="bc">
    <div class="bv">
${layerDivs}
    </div>
  </div>
${TERMS_MODAL_HTML}
</div>
<script> ${TERMS_MODAL_SCRIPT} <\/script>
</body>
</html>
`;
}
