export function parseFigmaUrl(url) {
  try {
    const u = new URL(url.trim());
    const parts = u.pathname.split('/');
    const idx = ['file','design','board'].map(k => parts.indexOf(k)).find(i => i !== -1);
    const fileKey = idx != null ? parts[idx + 1] : null;
    const raw = u.searchParams.get('node-id');
    const nodeId = raw ? raw.replace('-', ':') : null;
    return { fileKey, nodeId };
  } catch(e) { return null; }
}

export async function fetchFigmaData(fileKey, nodeId, token) {
  const base = 'https://api.figma.com/v1';
  const endpoint = nodeId
    ? `${base}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`
    : `${base}/files/${fileKey}`;
  const res = await fetch(endpoint, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Figma error ' + res.status + (err.err ? ': ' + err.err : ' — check your token'));
  }
  return res.json();
}

export async function fetchFigmaImages(fileKey, nodeIds, token) {
  if (!nodeIds.length) return {};
  try {
    const res = await fetch('/api/figma-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey, nodeIds, token })
    });
    const data = await res.json();
    return data.images || {};
  } catch(e) {
    console.warn('Image fetch failed:', e.message);
    return {};
  }
}
