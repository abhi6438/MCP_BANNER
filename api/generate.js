require('dotenv').config();

function detectAI() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY)    return 'openai';
  if (process.env.GROQ_API_KEY)      return 'groq';
  if (process.env.GEMINI_API_KEY)    return 'gemini';
  return null;
}

function extractSize(content, dim) {
  const m = content.match(/BANNER SIZE:\s*(\d+)px\s*×\s*(\d+)px/);
  if (!m) return dim === 'w' ? 300 : 250;
  return dim === 'w' ? m[1] : m[2];
}

async function callAI(messages) {
  const ai = detectAI();
  if (!ai) throw new Error('No API key found — add ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to environment variables');

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
    const groqMessages = messages.map(m => {
      if (m.role !== 'user') return m;
      let content = m.content;
      const jsonMatch = content.match(/LAYERS \(flat list[^)]*\):\n([\s\S]+?)\n═══/);
      if (jsonMatch) {
        try {
          const layers = JSON.parse(jsonMatch[1]);
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
        } catch(e) {}
      }
      const W = extractSize(content, 'w'), H = extractSize(content, 'h');
      content = content.replace(
        /═══ RULES ═══[\s\S]+?Now output the complete HTML for all \d+ layers:/,
        `═══ RULES ═══\nSingle HTML file, all CSS in <style>, no JS. Root div: width:${W}px;height:${H}px;position:relative;overflow:hidden. Each layer → position:absolute. Return ONLY HTML starting with <!DOCTYPE html>.\nNow output the complete HTML:`
      );
      return { ...m, content };
    });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
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
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 8000 }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini error ' + res.status);
    return { html: data.candidates?.[0]?.content?.parts?.[0]?.text || '', ai: 'Gemini 1.5 Flash (Google)' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const result = await callAI(req.body.messages);
    let html = result.html.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    res.json({ content: [{ text: html }], ai: result.ai });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
