# Deploy to Vercel

## One-time setup

**1. Install Vercel CLI**
```bash
npm install -g vercel
```

**2. Login to Vercel**
```bash
vercel login
```

## Deploy

From inside the `banner-generator` folder:
```bash
cd "/Users/ashriva/Documents/New project/banner-generator"
vercel
```

Follow the prompts — accept all defaults. Vercel will give you a live URL like `https://banner-generator-xxxx.vercel.app`.

## Set environment variables

Your API keys live in `.env` locally but must be added to Vercel separately (never commit `.env`).

Go to: **vercel.com → your project → Settings → Environment Variables**

Add whichever keys you use:

| Name | Value |
|---|---|
| `FIGMA_API_KEY` | your Figma personal access token |
| `ANTHROPIC_API_KEY` | your Anthropic key (if using Claude) |
| `OPENAI_API_KEY` | your OpenAI key (if using GPT-4o) |
| `GROQ_API_KEY` | your Groq key (if using Llama) |
| `GEMINI_API_KEY` | your Gemini key (if using Gemini) |

After adding env vars, redeploy:
```bash
vercel --prod
```

## Future deploys

Every time you make changes:
```bash
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard for automatic deploys on every push.

## Notes

- The `/api/config` endpoint exposes your Figma token to the frontend — fine for personal use, but set Vercel's **Protection** settings if you want to restrict access.
- Vercel's free tier (Hobby) is plenty for this app.
