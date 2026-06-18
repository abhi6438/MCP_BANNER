require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function detectAI() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY)    return 'openai';
  if (process.env.GROQ_API_KEY)      return 'groq';
  if (process.env.GEMINI_API_KEY)    return 'gemini';
  return null;
}

// Extract banner width or height from the size line in the prompt
function extractSize(content, dim) {
  const m = content.match(/BANNER SIZE:\s*(\d+)px\s*×\s*(\d+)px/);
  if (!m) return dim === 'w' ? 300 : 250;
  return dim === 'w' ? m[1] : m[2];
}

async function callAI(messages) {
  const ai = detectAI();
  if (!ai) throw new Error('No API key found in .env — add ANTHROPIC_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY');

  if (ai === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Anthropic error ' + res.status);
    return { html: data.content?.[0]?.text || '', ai: 'Claude (Anthropic)' };
  }

  if (ai === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: 'gpt-4o', max_tokens: 8000, messages: messages.map(m => ({ role: m.role, content: m.content })) })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'OpenAI error ' + res.status);
    return { html: data.choices?.[0]?.message?.content || '', ai: 'GPT-4o (OpenAI)' };
  }

  if (ai === 'groq') {
    // Groq free tier: 12k TPM hard limit. Trim the design tree and use a shorter prompt.
    const groqMessages = messages.map(m => {
      if (m.role !== 'user') return m;
      let content = m.content;

      // Extract the flat layers array from the message and trim it
      const jsonMatch = content.match(/LAYERS \(flat list[^)]*\):\n([\s\S]+?)\n═══/);
      if (jsonMatch) {
        try {
          const layers = JSON.parse(jsonMatch[1]);
          // For Groq: keep only essential fields per layer
          const trimmed = layers.map(l => {
            const slim = { type: l.type, pos: l.pos, size: l.size };
            if (l.zIndex) slim.zIndex = l.zIndex;
            if (l.fill) slim.fill = l.fill;
            if (l.gradient) slim.gradient = { type: l.gradient.type, angle: l.gradient.angle, stops: l.gradient.stops };
            if (l.hasImage) slim.hasImage = true;
            if (l.imageUrl) slim.imageUrl = l.imageUrl;
            if (l.text) slim.text = l.text;
            if (l.color) slim.color = l.color;
            if (l.fontSize) slim.fontSize = l.fontSize;
            if (l.fontWeight) slim.fontWeight = l.fontWeight;
            if (l.fontFamily) slim.fontFamily = l.fontFamily;
            if (l.borderRadius) slim.borderRadius = l.borderRadius;
            return slim;
          });
          content = content.replace(jsonMatch[1], JSON.stringify(trimmed));
        } catch(e) { /* leave as-is if parse fails */ }
      }

      // Shorten the rules section
      const W = extractSize(content,'w'), H = extractSize(content,'h');
      content = content.replace(
        /═══ RULES ═══[\s\S]+?Now output the complete HTML for all \d+ layers:/,
        `═══ RULES ═══\nSingle HTML file, all CSS in <style>, no JS. Root div: width:${W}px;height:${H}px;position:relative;overflow:hidden. Each layer → position:absolute;left:[pos.x]px;top:[pos.y]px;width:[size.w]px;height:[size.h]px;z-index:[zIndex]. fill→background. gradient→linear/radial-gradient CSS. hasImage+imageUrl→<img src=imageUrl style="width:100%;height:100%;object-fit:cover">. TEXT: exact text, all font styles, white-space:pre-wrap. Google Fonts CDN for custom fonts. Return ONLY HTML starting with <!DOCTYPE html>.\nNow output the complete HTML:`
      );
      return { ...m, content };
    });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 6000, messages: groqMessages.map(m => ({ role: m.role, content: m.content })) })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Groq error ' + res.status);
    return { html: data.choices?.[0]?.message?.content || '', ai: 'Llama 3.3 70B (Groq)' };
  }

  if (ai === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: { maxOutputTokens: 8000 }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini error ' + res.status);
    return { html: data.candidates?.[0]?.content?.parts?.[0]?.text || '', ai: 'Gemini 1.5 Flash (Google)' };
  }
}

// Expose config to frontend (localhost only)
app.get('/api/config', (req, res) => {
  res.json({ figmaToken: process.env.FIGMA_API_KEY || '' });
});

// Fetch real image URLs from Figma for image layers
app.post('/api/figma-images', async (req, res) => {
  const { fileKey, nodeIds, token } = req.body;
  if (!fileKey || !nodeIds?.length || !token) return res.status(400).json({ error: 'Missing params' });
  try {
    const ids = nodeIds.join(',');
    const r = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=2`, {
      headers: { 'X-Figma-Token': token }
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.err || 'Figma images error ' + r.status);
    res.json({ images: data.images || {} });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Which AI is active
app.get('/api/status', (req, res) => {
  const ai = detectAI();
  const names = { anthropic: 'Claude (Anthropic)', openai: 'GPT-4o (OpenAI)', groq: 'Llama 3.3 (Groq)', gemini: 'Gemini 1.5 Flash (Google)', null: null };
  res.json({ ai: names[ai] || null, ready: !!ai });
});

app.post('/api/generate', async (req, res) => {
  try {
    const result = await callAI(req.body.messages);
    let html = result.html.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    res.json({ content: [{ text: html }], ai: result.ai });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const ai = detectAI();
  console.log(`\n✅ Banner Generator running at http://localhost:${PORT}`);
  console.log(`🤖 AI: ${ai ? ai.toUpperCase() : 'NONE — add a key to .env'}\n`);
});
