require('dotenv').config();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileKey, nodeIds, token } = req.body || {};
  if (!fileKey || !nodeIds?.length || !token) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const ids = nodeIds.join(',');
    const r = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=2`,
      { headers: { 'X-Figma-Token': token } }
    );
    const data = await r.json();
    if (!r.ok) throw new Error(data.err || 'Figma images error ' + r.status);
    res.json({ images: data.images || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
