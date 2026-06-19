require('dotenv').config();

function detectAI() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY)    return 'openai';
  if (process.env.GROQ_API_KEY)      return 'groq';
  if (process.env.GEMINI_API_KEY)    return 'gemini';
  return null;
}

export default function handler(req, res) {
  const ai = detectAI();
  const names = {
    anthropic: 'Claude (Anthropic)',
    openai: 'GPT-4o (OpenAI)',
    groq: 'Llama 3.3 (Groq)',
    gemini: 'Gemini 1.5 Flash (Google)',
  };
  res.json({ ai: names[ai] || null, ready: !!ai });
}
