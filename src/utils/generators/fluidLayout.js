/**
 * Layout inference: convert absolute Figma layers → flex rows
 * so generated HTML reflows at any container width.
 */
import { gradientCSS, layerInner, buildFontMap, buildFontLink } from '../figmaParser.js';

/**
 * Group layers into horizontal rows by vertical overlap.
 * Returns { background: Layer[], rows: Row[] }
 * Row = { layers: Layer[], minY, maxY }
 */
export function inferRows(layers, containerW, containerH) {
  // Layers that span ≥80% of container width AND start near y=0 → background
  const isBg = l =>
    l.pos.x <= containerW * 0.1 &&
    l.size.w >= containerW * 0.8 &&
    l.pos.y <= containerH * 0.2 &&
    l.size.h >= containerH * 0.6;

  const bg = layers.filter(isBg);
  const content = layers.filter(l => !isBg(l));

  if (!content.length) return { background: bg, rows: [] };

  // Sort content layers by y then x
  const sorted = [...content].sort((a, b) =>
    a.pos.y !== b.pos.y ? a.pos.y - b.pos.y : a.pos.x - b.pos.x
  );

  const rows = [];
  for (const layer of sorted) {
    const ly0 = layer.pos.y;
    const ly1 = layer.pos.y + layer.size.h;

    // Find a row this layer overlaps with vertically
    let placed = false;
    for (const row of rows) {
      const ry0 = row.minY;
      const ry1 = row.maxY;
      // Overlap if they share at least 20% of the smaller height
      const overlapH = Math.min(ly1, ry1) - Math.max(ly0, ry0);
      const minH = Math.min(ly1 - ly0, ry1 - ry0);
      if (overlapH >= minH * 0.2) {
        row.layers.push(layer);
        row.minY = Math.min(row.minY, ly0);
        row.maxY = Math.max(row.maxY, ly1);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push({ layers: [layer], minY: ly0, maxY: ly1 });
  }

  // Sort layers within each row by x
  rows.forEach(r => r.layers.sort((a, b) => a.pos.x - b.pos.x));

  return { background: bg, rows };
}

/**
 * Generate fully fluid HTML using flex rows + cqi units.
 * No position:absolute — elements reflow naturally.
 */
export function generateFluidBannerHTML(layers, rootFill, rootGradient, w, h) {
  const fontMap = buildFontMap(layers);
  const fontLink = buildFontLink(fontMap);
  const spanMap = {};
  const regSpan = decls => {
    const key = decls.slice().sort().join(';');
    if (!spanMap[key]) spanMap[key] = `s${Object.keys(spanMap).length}`;
    return spanMap[key];
  };

  const cqi  = v => `calc(${(v / w * 100).toFixed(4)}cqi)`;       // scales with container width
  const pct  = (v, base) => `${(v / base * 100).toFixed(3)}%`;    // percentage of base

  const { background: bgLayers, rows } = inferRows(layers, w, h);

  // Root background
  let bgCSS = '';
  if (rootGradient) bgCSS = gradientCSS(rootGradient);
  else if (rootFill) bgCSS = rootFill;

  // Background layers → stacked absolutely behind content
  const bgLayerCSS = bgLayers.map((l, i) => {
    const styles = [
      'position:absolute', `left:${pct(l.pos.x, w)}`, `top:${pct(l.pos.y, h)}`,
      `width:${pct(l.size.w, w)}`, `height:${pct(l.size.h, h)}`,
    ];
    if (l.gradient) styles.push(`background:${gradientCSS(l.gradient)}`);
    else if (l.fill) styles.push(`background:${l.fill}`);
    if (l.borderRadius) styles.push(`border-radius:${cqi(l.borderRadius)}`);
    return `.bg${i}{${styles.join(';')}}`;
  }).join('\n');

  const bgLayerHTML = bgLayers.map((l, i) =>
    `<div class="bg${i}">${layerInner(l, regSpan)}</div>`
  ).join('\n');

  // Content rows → flex layout
  let prevMaxY = 0;
  const rowsHTML = rows.map((row, ri) => {
    const rowH    = row.maxY - row.minY;
    const gapTop  = row.minY - prevMaxY;          // vertical space before this row
    prevMaxY      = row.maxY;

    // Horizontal gaps between layers in this row
    const rowLayers = row.layers;
    const gaps = [];
    for (let i = 1; i < rowLayers.length; i++) {
      const prev = rowLayers[i - 1];
      const curr = rowLayers[i];
      const gap  = curr.pos.x - (prev.pos.x + prev.size.w);
      gaps.push(Math.max(0, gap));
    }
    const gapBetween = gaps.length
      ? gaps.reduce((a, b) => a + b, 0) / gaps.length
      : 0;

    const paddingLeft = rowLayers.length ? rowLayers[0].pos.x : 0;

    const rowStyle = [
      'display:flex',
      'align-items:center',
      'flex-wrap:wrap',
      `gap:${cqi(gapBetween)}`,
      `padding-left:${cqi(paddingLeft)}`,
      gapTop > 0 ? `margin-top:${cqi(gapTop)}` : '',
      `min-height:${cqi(rowH)}`,
    ].filter(Boolean).join(';');

    const layersHTML = rowLayers.map(l => {
      const styles = [
        `width:${cqi(l.size.w)}`,
        `height:${cqi(l.size.h)}`,
        'flex-shrink:0',
        'box-sizing:border-box',
      ];

      if (l.type !== 'TEXT' && !l.hasImage) {
        if (l.gradient) styles.push(`background:${gradientCSS(l.gradient)}`);
        else if (l.fill) styles.push(`background:${l.fill}`);
      }
      if (l.borderRadius) styles.push(`border-radius:${cqi(l.borderRadius)}`);
      if (l.opacity !== undefined && l.opacity !== 1) styles.push(`opacity:${l.opacity}`);
      if (l.clipsContent) styles.push('overflow:hidden');

      if (l.type === 'TEXT') {
        if (l.color)      styles.push(`color:${l.color}`);
        if (l.fontSize)   styles.push(`font-size:${cqi(l.fontSize)}`);
        if (l.fontWeight) styles.push(`font-weight:${l.fontWeight}`);
        if (l.fontFamily) styles.push(`font-family:'${l.fontFamily}',sans-serif`);
        if (l.textAlign)  styles.push(`text-align:${l.textAlign}`);
        if (l.lineHeight) styles.push(`line-height:${cqi(l.lineHeight)}`);
        styles.push('white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis');
      }

      return `<div style="${styles.join(';')}">${layerInner(l, regSpan)}</div>`;
    }).join('');

    return `<div style="${rowStyle}">${layersHTML}</div>`;
  });

  const spanCSS = Object.entries(spanMap).map(([k, cls]) => `.${cls}{${k}}`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${fontLink}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:transparent}
.bc-outer{container-type:inline-size;width:100%}
.bc{
  width:100%;
  aspect-ratio:${w}/${h};
  position:relative;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  ${bgCSS ? `background:${bgCSS};` : ''}
}
${bgLayerCSS}
${spanCSS}
</style>
</head>
<body>
<div class="bc-outer"><div class="bc">
${bgLayerHTML}
${rowsHTML.join('\n')}
</div></div>
</body>
</html>`;
}
