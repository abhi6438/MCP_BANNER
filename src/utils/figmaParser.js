import { generateFluidBannerHTML } from './generators/fluidLayout.js';

const WEB_SAFE_FONTS = new Set([
  'Arial','Helvetica','Georgia','Times New Roman','Courier New',
  'Verdana','Tahoma','Trebuchet MS','Impact','Comic Sans MS'
]);

export function extractDesignData(figmaData, nodeId) {
  let node;
  if (nodeId && figmaData.nodes) {
    node = figmaData.nodes[Object.keys(figmaData.nodes)[0]]?.document;
  } else {
    node = figmaData.document?.children?.[0];
  }
  if (!node) throw new Error('No frame found — select a frame in Figma and copy its URL with node-id');

  const rootBB = node.absoluteBoundingBox;
  const rootX = rootBB?.x || 0;
  const rootY = rootBB?.y || 0;
  const imageNodeIds = [];

  const _vTypes = new Set(['VECTOR','BOOLEAN_OPERATION','STAR','POLYGON']);
  function _hasVecDesc(n) {
    if (_vTypes.has(n.type)) return true;
    return n.children?.some(_hasVecDesc) || false;
  }
  function _hasTxtDesc(n) {
    if (n.type === 'TEXT') return true;
    return n.children?.some(_hasTxtDesc) || false;
  }

  function traverse(n, depth) {
    const info = { name: n.name, type: n.type, id: n.id };
    if (n.absoluteBoundingBox) {
      info.size = { w: Math.round(n.absoluteBoundingBox.width), h: Math.round(n.absoluteBoundingBox.height) };
      info.pos = { x: Math.round(n.absoluteBoundingBox.x - rootX), y: Math.round(n.absoluteBoundingBox.y - rootY) };
    }
    if (n.fills?.length) {
      const visibleFills = n.fills.filter(f => f.visible !== false);
      if (n.type !== 'TEXT') {
        const solid = visibleFills.find(f => f.type === 'SOLID');
        if (solid) {
          const op = (solid.opacity ?? 1) * (solid.color.a ?? 1);
          info.fill = `rgba(${Math.round(solid.color.r*255)},${Math.round(solid.color.g*255)},${Math.round(solid.color.b*255)},${op.toFixed(2)})`;
        }
      }
      const grad = visibleFills.find(f => f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL' || f.type === 'GRADIENT_ANGULAR');
      if (grad) {
        const stops = (grad.gradientStops || []).map(s => ({
          color: `rgba(${Math.round(s.color.r*255)},${Math.round(s.color.g*255)},${Math.round(s.color.b*255)},${(s.color.a??1).toFixed(2)})`,
          pos: Math.round(s.position * 100) + '%'
        }));
        let angle = 180;
        if (grad.gradientHandlePositions?.length >= 2) {
          const [p0, p1] = grad.gradientHandlePositions;
          angle = Math.round(Math.atan2(p1.x - p0.x, p0.y - p1.y) * 180 / Math.PI);
        }
        info.gradient = { type: grad.type, angle, stops };
      }
      if (visibleFills.find(f => f.type === 'IMAGE')) {
        info.hasImage = true;
        imageNodeIds.push(n.id);
      }
    }
    if (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'STAR' || n.type === 'POLYGON') {
      info.hasImage = true;
      imageNodeIds.push(n.id);
    }
    if (depth > 0
        && (n.type === 'COMPONENT' || n.type === 'INSTANCE' || n.type === 'GROUP')
        && !info.hasImage
        && _hasVecDesc(n)
        && !_hasTxtDesc(n)) {
      info.hasImage = true;
      imageNodeIds.push(n.id);
      return info;
    }
    if (n.strokes?.length) {
      const s = n.strokes.find(s => s.visible !== false && s.type === 'SOLID');
      if (s) {
        info.stroke = {
          color: `rgba(${Math.round(s.color.r*255)},${Math.round(s.color.g*255)},${Math.round(s.color.b*255)},${(s.color.a??1).toFixed(2)})`,
          width: n.strokeWeight || 1,
          align: n.strokeAlign || 'INSIDE'
        };
      }
    }
    if (n.cornerRadius) info.borderRadius = n.cornerRadius;
    if (n.rectangleCornerRadii) info.cornerRadii = n.rectangleCornerRadii;
    if (n.opacity !== undefined && n.opacity !== 1) info.opacity = parseFloat(n.opacity.toFixed(2));
    if ((n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE') && n.clipsContent) info.clipsContent = true;
    if (n.type === 'TEXT') {
      info.text = n.characters;
      if (n.style) {
        info.fontSize = n.style.fontSize;
        info.fontFamily = n.style.fontFamily;
        info.fontWeight = n.style.fontWeight;
        info.textAlign = n.style.textAlignHorizontal?.toLowerCase() || 'left';
        info.lineHeight = n.style.lineHeightPx ? Math.round(n.style.lineHeightPx) : null;
        info.letterSpacing = n.style.letterSpacing ? parseFloat(n.style.letterSpacing.toFixed(2)) : null;
        info.italic = n.style.italic || false;
        info.textDecoration = n.style.textDecoration || null;
        info.textCase = n.style.textCase || null;
        info.textOverflow = n.style.textTruncation === 'ENDING_ELLIPSIS' ? 'ellipsis' : null;
      }
      const textFill = n.fills?.find(f => f.visible !== false && f.type === 'SOLID');
      if (textFill) {
        const c = textFill.color;
        info.color = `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${(c.a??1).toFixed(2)})`;
      }
      if (n.characterStyleOverrides?.some(i => i !== 0) && n.styleOverrideTable) {
        info.styleOverrides = n.characterStyleOverrides;
        info.styleTable = {};
        for (const [key, s] of Object.entries(n.styleOverrideTable)) {
          const o = {};
          if (s.fontWeight     !== undefined) o.fontWeight     = s.fontWeight;
          if (s.fontSize       !== undefined) o.fontSize       = s.fontSize;
          if (s.italic         !== undefined) o.italic         = s.italic;
          if (s.textDecoration !== undefined) o.textDecoration = s.textDecoration;
          if (s.letterSpacing  !== undefined) o.letterSpacing  = parseFloat(s.letterSpacing.toFixed(2));
          if (s.fills?.[0]?.color) {
            const c = s.fills[0].color;
            o.color = `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${(c.a??1).toFixed(2)})`;
          }
          if (s.hyperlink?.url) o.hyperlink = s.hyperlink.url;
          if (s.openTypeFeatures?.SUPS) o.verticalAlign = 'super';
          if (s.openTypeFeatures?.SUBS) o.verticalAlign = 'sub';
          if (Object.keys(o).length) info.styleTable[key] = o;
        }
        if (n.style?.hyperlink?.url) info.hyperlink = n.style.hyperlink.url;
      }
    }
    if (n.children?.length && depth < 8) {
      info.children = n.children.slice(0, 60).map(c => traverse(c, depth + 1));
    }
    return info;
  }

  const tree = traverse(node, 0);
  const bb = node.absoluteBoundingBox;
  const size = bb ? `${Math.round(bb.width)}x${Math.round(bb.height)}` : null;
  let layerCount = 0;
  function count(n) { layerCount++; if (n.children) n.children.forEach(count); }
  count(node);
  return { tree, size, layerCount, imageNodeIds };
}

export function injectImageUrls(tree, imageMap) {
  if (tree.hasImage && tree.id && imageMap[tree.id]) {
    tree.imageUrl = imageMap[tree.id];
  }
  if (tree.children) tree.children.forEach(c => injectImageUrls(c, imageMap));
}

export function flattenLayers(tree) {
  const rootFill     = tree.fill     || null;
  const rootGradient = tree.gradient || null;
  const layers = [];

  function walk(node, depth) {
    if (depth > 0 && node.pos && node.size) {
      const t = node.type;
      const hasVisual = node.fill || node.gradient || node.hasImage || node.imageUrl ||
                        node.stroke || t === 'TEXT' || t === 'VECTOR' ||
                        t === 'RECTANGLE' || t === 'ELLIPSE' || t === 'POLYGON' || t === 'STAR';
      if (hasVisual) {
        const keep = ['name','type','pos','size','fill','gradient','stroke','borderRadius',
                      'cornerRadii','opacity','clipsContent','hasImage','imageUrl',
                      'text','fontSize','fontFamily','fontWeight','textAlign','lineHeight',
                      'letterSpacing','italic','textDecoration','textCase','textOverflow','color',
                      'hyperlink','styleOverrides','styleTable'];
        const flat = {};
        keep.forEach(k => { if (node[k] !== undefined && node[k] !== null && node[k] !== '') flat[k] = node[k]; });
        layers.push(flat);
      }
    }
    if (node.children) node.children.forEach(c => walk(c, depth + 1));
  }

  walk(tree, 0);
  return { layers, rootFill, rootGradient };
}

export function buildFontMap(layers) {
  const map = {};
  layers.forEach(l => {
    if (!l.fontFamily || WEB_SAFE_FONTS.has(l.fontFamily)) return;
    if (!map[l.fontFamily]) map[l.fontFamily] = new Set();
    map[l.fontFamily].add(l.fontWeight || 400);
    if (l.styleTable) Object.values(l.styleTable).forEach(s => {
      if (s.fontWeight) map[l.fontFamily].add(s.fontWeight);
    });
  });
  return map;
}

export function buildFontLink(fontMap) {
  const params = Object.entries(fontMap).map(([f, ws]) =>
    `family=${f.replace(/ /g, '+')}:wght@${[...ws].sort((a, b) => a - b).join(';')}`
  ).join('&');
  return params
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${params}&display=swap">`
    : '';
}

export function gradientCSS(grad) {
  if (!grad || !grad.stops || !grad.stops.length) return 'transparent';
  const stops = grad.stops.map(s => `${s.color} ${s.pos}`).join(', ');
  if (grad.type === 'GRADIENT_LINEAR') return `linear-gradient(${grad.angle || 180}deg, ${stops})`;
  if (grad.type === 'GRADIENT_RADIAL') return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(180deg, ${stops})`;
}

export function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function linkAttrs(href, plainText) {
  const t = plainText.trim().toLowerCase();
  const h = escapeHTML(href);
  if (t === 'see details' || t === 'see details.')
    return `href="${h}" data-terms-link`;
  return `href="${h}" target="_blank" rel="noopener"`;
}

export function renderTextContent(l, regSpan) {
  const text = l.text || '';
  if (!l.styleOverrides || !l.styleTable || !text.length) {
    const escaped = escapeHTML(text);
    return l.hyperlink
      ? `<a ${linkAttrs(l.hyperlink, text)}>${escaped}</a>`
      : escaped;
  }

  const overrides = l.styleOverrides;
  const table     = l.styleTable;

  const runs = [];
  let start = 0, curIdx = overrides[0] || 0;
  for (let i = 1; i <= text.length; i++) {
    const idx = (i < overrides.length ? overrides[i] : 0) || 0;
    if (idx !== curIdx || i === text.length) {
      runs.push({ chars: text.slice(start, i), idx: curIdx });
      curIdx = idx; start = i;
    }
  }

  return runs.map(run => {
    const s  = run.idx ? (table[run.idx] || {}) : {};
    const sp = [];
    if (s.fontWeight !== undefined) sp.push(`font-weight:${s.fontWeight}`);
    if (s.fontSize !== undefined && l.fontSize)
      sp.push(`font-size:${(s.fontSize / l.fontSize).toFixed(4)}em`);
    else if (s.fontSize !== undefined)
      sp.push(`font-size:${s.fontSize}px`);
    if (s.italic !== undefined) sp.push(`font-style:${s.italic ? 'italic' : 'normal'}`);
    if (s.color)                sp.push(`color:${s.color}`);
    if (s.letterSpacing !== undefined && s.letterSpacing !== 0) {
      const spanFs = s.fontSize || l.fontSize || 16;
      sp.push(`letter-spacing:${(s.letterSpacing / spanFs).toFixed(4)}em`);
    }
    if (s.verticalAlign) sp.push(`vertical-align:${s.verticalAlign};font-size:0.75em`);
    if (s.textDecoration) {
      const td = { UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' }[s.textDecoration]
               || s.textDecoration.toLowerCase();
      sp.push(`text-decoration:${td}`);
    }
    const escaped = escapeHTML(run.chars);
    let inner;
    if (!sp.length)   inner = escaped;
    else if (regSpan) inner = `<span class="${regSpan(sp)}">${escaped}</span>`;
    else              inner = `<span style="${sp.join(';')}">${escaped}</span>`;
    if (s.hyperlink) {
      inner = `<a ${linkAttrs(s.hyperlink, run.chars)}>${inner}</a>`;
    }
    return inner;
  }).join('');
}

export function layerRulesCSS(l, designWidth = null) {
  const u = v => designWidth
    ? `calc(${v} / ${designWidth} * 100cqi)`
    : `${v}px`;

  const r = [
    'position: absolute',
    'box-sizing: border-box',
    `left: ${u(l.pos?.x ?? 0)}`,
    `top: ${u(l.pos?.y ?? 0)}`,
    `width: ${u(l.size?.w ?? 0)}`,
    `height: ${u(l.size?.h ?? 0)}`,
  ];

  if (l.type !== 'TEXT' && !l.hasImage) {
    if (l.gradient) r.push(`background: ${gradientCSS(l.gradient)}`);
    else if (l.fill) r.push(`background: ${l.fill}`);
  }

  if (l.cornerRadii?.length === 4)
    r.push(`border-radius: ${l.cornerRadii.map(v => u(v)).join(' ')}`);
  else if (l.borderRadius)
    r.push(`border-radius: ${u(l.borderRadius)}`);

  if (l.opacity !== undefined && l.opacity !== 1) r.push(`opacity: ${l.opacity}`);

  if (l.stroke) {
    const sw = u(l.stroke.width);
    if (l.stroke.align === 'OUTSIDE') r.push(`outline: ${sw} solid ${l.stroke.color}`);
    else r.push(`border: ${sw} solid ${l.stroke.color}`);
  }

  if (l.clipsContent) r.push('overflow: hidden');

  if (l.type === 'TEXT') {
    if (l.color)      r.push(`color: ${l.color}`);
    if (l.fontSize)   r.push(`font-size: ${u(l.fontSize)}`);
    if (l.fontWeight) r.push(`font-weight: ${l.fontWeight}`);
    if (l.fontFamily) r.push(`font-family: '${l.fontFamily}', sans-serif`);
    if (l.textAlign)  r.push(`text-align: ${l.textAlign}`);
    if (l.lineHeight) r.push(`line-height: ${u(l.lineHeight)}`);
    if (l.letterSpacing && l.letterSpacing !== 0)
      r.push(`letter-spacing: ${u(l.letterSpacing)}`);
    if (l.italic)     r.push('font-style: italic');
    if (l.textDecoration) {
      const td = { UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' }[l.textDecoration]
               || l.textDecoration.toLowerCase();
      r.push(`text-decoration: ${td}`);
    }
    if      (l.textCase === 'UPPER') r.push('text-transform: uppercase');
    else if (l.textCase === 'LOWER') r.push('text-transform: lowercase');
    else if (l.textCase === 'TITLE') r.push('text-transform: capitalize');
    if (l.textOverflow === 'ellipsis')
      r.push('white-space: nowrap', 'overflow: hidden', 'text-overflow: ellipsis');
    else
      r.push('white-space: pre-wrap', 'overflow: hidden');
  }
  return r;
}

const _vcTypes = new Set(['VECTOR','BOOLEAN_OPERATION','STAR','POLYGON','COMPONENT','INSTANCE','GROUP']);

export function layerInner(l, regSpan) {
  if (l.hasImage && l.imageUrl) {
    const fit = _vcTypes.has(l.type) ? 'contain' : 'cover';
    return `<img src="${l.imageUrl}" style="width:100%;height:100%;object-fit:${fit};display:block" alt="">`;
  }
  if (l.type === 'TEXT' && l.text) return renderTextContent(l, regSpan);
  return '';
}

export function generateBannerHTML(layers, rootFill, rootGradient, w, h) {
  return generateFluidBannerHTML(layers, rootFill, rootGradient, w, h);
}

export function buildBannerAssets(banners) {
  const spanMap = {};
  const regSpan = decls => { const k=decls.slice().sort().join(';'); if(!spanMap[k]) spanMap[k]=`s${Object.keys(spanMap).length}`; return spanMap[k]; };
  const sanitizeName = raw => (raw||'layer').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'layer';
  const assignClasses = layers => { const c={}; return layers.map(l => { const b='l-'+sanitizeName(l.name); c[b]=(c[b]||0)+1; return c[b]===1?b:`${b}-${c[b]}`; }); };
  const normText  = t => t.toLowerCase().replace(/\s+/g,' ').trim();
  const alphaText = t => t.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,80);

  const bannerClasses = banners.map(b => assignClasses(b.layers));
  const masterLayers  = banners[0].layers;

  const bannerMaps = banners.map((b,bi) => {
    const byName={}, byText={}, byTextNorm={}, byTextAlpha={};
    b.layers.forEach((l,i) => {
      byName[bannerClasses[bi][i]] = l;
      if(l.type==='TEXT' && l.text) {
        const key=l.text.trim().slice(0,120), norm=normText(l.text).slice(0,120), alpha=alphaText(l.text);
        if(!byText[key]) byText[key]=l;
        if(!byTextNorm[norm]) byTextNorm[norm]=l;
        if(!byTextAlpha[alpha]) byTextAlpha[alpha]=l;
      }
    });
    return {byName, byText, byTextNorm, byTextAlpha};
  });

  const masterTextSet      = new Set(masterLayers.filter(l=>l.type==='TEXT'&&l.text).map(l=>l.text.trim().slice(0,120)));
  const masterTextSetNorm  = new Set(masterLayers.filter(l=>l.type==='TEXT'&&l.text).map(l=>normText(l.text).slice(0,120)));
  const masterTextSetAlpha = new Set(masterLayers.filter(l=>l.type==='TEXT'&&l.text).map(l=>alphaText(l.text)));

  const allClasses = [...bannerClasses[0]];
  bannerClasses.slice(1).forEach((classes,si) => {
    const bi=si+1;
    classes.forEach((cls,j) => {
      if(allClasses.includes(cls)) return;
      const l=banners[bi].layers[j];
      if(l.type==='TEXT'&&l.text) {
        const e=l.text.trim().slice(0,120), n=normText(l.text).slice(0,120), a=alphaText(l.text);
        if(masterTextSet.has(e)||masterTextSetNorm.has(n)||masterTextSetAlpha.has(a)) return;
      }
      allClasses.push(cls);
    });
  });

  const extraLayerContent = {};
  allClasses.forEach(cls => { if(!bannerMaps[0].byName[cls]) bannerMaps.slice(1).find(m=>m.byName[cls]&&(extraLayerContent[cls]=m.byName[cls])); });

  const layerDivs = allClasses.map(cls => {
    const l = bannerMaps[0].byName[cls] ?? extraLayerContent[cls];
    if(!l) return '';
    const inner = l.hasImage ? '' : layerInner(l, regSpan);
    return `      <div class="${cls}">${inner}</div>`;
  }).join('\n');

  const layerDivsJSX = layerDivs.replace(/ class="(l-[^"]+)"/g, ' className="$1"');

  const allFontMap = {};
  banners.forEach(b => Object.entries(buildFontMap(b.layers)).forEach(([f,ws]) => { if(!allFontMap[f]) allFontMap[f]=new Set(); ws.forEach(w=>allFontMap[f].add(w)); }));
  const fontLink     = buildFontLink(allFontMap);
  const fontFamilies = Object.keys(allFontMap);
  const fontImport   = fontFamilies.map(f => `@import url('https://fonts.googleapis.com/css2?family=${f.replace(/ /g,'+')}:wght@300;400;500;600;700;800;900&display=swap');`).join('\n');

  const baseLayerCSS = allClasses.map(cls => `.bv .${cls} { position: absolute; box-sizing: border-box; }`).join('\n');
  const baseLayerCSSFlat = allClasses.map(cls => `.${cls} { position: absolute; box-sizing: border-box; }`).join('\n');

  const containerQueries = banners.map((b,i) => {
    const larger = i>0 ? banners[i-1].w : null;
    const isSmallest = i===banners.length-1;
    let cond;
    if(banners.length===1) cond='';
    else if(!larger) cond=` (width >= ${b.w}px)`;
    else if(isSmallest) cond=` (width < ${larger}px)`;
    else cond=` (${b.w}px <= width < ${larger}px)`;

    const scale=`tan(atan2(100cqi, ${b.w}px))`;
    const map=bannerMaps[i];
    let bgRule='';
    if(b.rootGradient) bgRule=`background: ${gradientCSS(b.rootGradient)};`;
    else if(b.rootFill) bgRule=`background: ${b.rootFill};`;

    const layerCSS = allClasses.map(cls => {
      let l = map.byName[cls];
      if(!l) {
        const mL=bannerMaps[0].byName[cls];
        if(mL?.type==='TEXT'&&mL?.text) {
          const key=mL.text.trim().slice(0,120), norm=normText(mL.text).slice(0,120), alpha=alphaText(mL.text);
          l = map.byText[key]||map.byTextNorm[norm]||map.byTextAlpha[alpha];
        }
      }
      if(!l) return `  .bv .${cls} { display: none; }`;

      let rules = layerRulesCSS(l).filter(r => !r.startsWith('position:') && !r.startsWith('box-sizing:'));
      rules.unshift('display: block');
      const mL=bannerMaps[0].byName[cls];
      if(mL?.type==='TEXT' && l.type!=='TEXT') {
        rules = rules.filter(r => !r.startsWith('background') && r!=='overflow: hidden');
        if(mL.color) rules.push(`color: ${mL.color}`);
        if(mL.fontSize) rules.push(`font-size: ${mL.fontSize}px`);
        if(mL.fontWeight) rules.push(`font-weight: ${mL.fontWeight}`);
        if(mL.fontFamily) rules.push(`font-family: '${mL.fontFamily}', sans-serif`);
        if(mL.textAlign) rules.push(`text-align: ${mL.textAlign}`);
        rules.push('white-space: pre-wrap');
      }
      const zIdx=banners[i].layers.indexOf(l);
      if(zIdx>=0) rules.push(`z-index: ${zIdx}`);
      if(l.hasImage && l.imageUrl) {
        const fit=_vcTypes.has(l.type)?'contain':'cover';
        rules.push(`background-image: url('${l.imageUrl}')`);
        rules.push('background-repeat: no-repeat');
        rules.push(`background-size: ${fit}`);
        rules.push('background-position: center');
      }
      return `  .bv .${cls} { ${rules.join('; ')} }`;
    }).join('\n');
    return `/* ${b.w}×${b.h} */\n@container bco${cond} {\n  .bc { height: calc(${scale} * ${b.h}px); ${bgRule} }\n  .bv { width: ${b.w}px; height: ${b.h}px; scale: ${scale}; }\n${layerCSS}\n}`;
  }).join('\n\n');

  const containerQueriesFlat = containerQueries
    .replace(/  \.bv \./g, '  .')
    .replace(/\.bv \./g, '.');

  const spanCSS = Object.entries(spanMap).map(([decls,cls]) => `.${cls} { ${decls} }`).join('\n');

  return { fontLink, fontImport, fontFamilies, baseLayerCSS, baseLayerCSSFlat, containerQueries, containerQueriesFlat, spanCSS, spanMap, layerDivs, layerDivsJSX, allClasses, bannerMaps, banners };
}
