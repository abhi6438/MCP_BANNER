# Banner Generator — Project Summary
> Paste this file to Claude in VS Code (Cline/Continue) and say: "Read PROJECT_SUMMARY.md and continue from here"

---

## What this project is
A local Node.js tool that converts Figma banner designs into production-ready HTML files automatically using AI.

**Problem it solves:** Client sends 5 Figma banners/day. Manual HTML development takes 2-3 days for 2-3 banners. This tool automates the conversion.

---

## Project structure
```
banner-generator/
├── server.js           — Express server (AI proxy + Figma image fetcher)
├── public/
│   └── index.html      — Frontend UI (split layout: preview left, form right)
├── package.json        — Dependencies: express, node-fetch, dotenv
├── .env                — API keys (gitignored)
├── .env.example        — Template for keys
└── README.txt          — Setup instructions
```

---

## How to run
```bash
npm install       # first time only
npm start         # starts server at http://localhost:3000
```

---

## How it works (pipeline)
1. User pastes Figma URL + Figma access token
2. Frontend calls Figma API → fetches design node data
3. `extractDesignData()` parses layers: text, colors, positions (relative to frame), sizes, image node IDs
4. Server calls `/api/figma-images` → fetches real PNG image URLs from Figma API
5. Image URLs injected into design tree
6. Design tree sent to AI with a strict prompt → AI returns HTML
7. HTML previewed in iframe, available for download

---

## AI support (auto-detected from .env)
Priority order: Anthropic → OpenAI → Groq → Gemini
Only ONE key needed. Tool auto-detects which one to use.

| Provider | Key name | Model | Cost |
|---|---|---|---|
| Anthropic | ANTHROPIC_API_KEY | claude-sonnet-4-6 | Paid |
| OpenAI | OPENAI_API_KEY | gpt-4o | Paid |
| Groq | GROQ_API_KEY | llama-3.3-70b-versatile | FREE |
| Google | GEMINI_API_KEY | gemini-2.0-flash | Free tier |

---

## API endpoints (server.js)
- `GET  /api/status`         — returns active AI name
- `POST /api/generate`       — proxies AI call, returns { content: [{ text: html }], ai: string }
- `POST /api/figma-images`   — fetches real image URLs from Figma API
  - body: { fileKey, nodeIds[], token }
  - returns: { images: { nodeId: imageUrl } }

---

## Frontend key functions (public/index.html)

### `extractDesignData(figmaData, nodeId)`
Parses Figma API response into a clean design tree.
Each node has: name, type, id, size{w,h}, pos{x,y} (relative to frame root), fill, color, text, fontSize, fontWeight, fontFamily, lineHeight, borderRadius, hasImage, imageUrl (after injection)

### `fetchFigmaImages(fileKey, nodeIds, token)`
Calls `/api/figma-images` to get real PNG URLs for image layers.

### `injectImageUrls(tree, imageMap)`
Walks the design tree and adds `imageUrl` to nodes that have matching image URLs.

### `callClaudeAPI(designData, bannerSize)`
Sends design tree to AI with strict prompt rules:
- position:absolute layout using pos.x/pos.y
- exact sizes from size.w/size.h
- real image URLs via <img> tags
- exact colors, fonts, text content

### `runPipeline()`
Main flow: fetch Figma → extract → fetch images → generate → preview

---

## Current status
- ✅ Figma API connection works
- ✅ Layer extraction works (text, colors, positions, sizes)
- ✅ Real image extraction from Figma works
- ✅ AI generation works (tested with Groq)
- ✅ Multi-AI support (Anthropic, OpenAI, Groq, Gemini)
- ✅ Preview with size presets (970x90, 728x90, 300x250, 300x600)
- ✅ Download as .html, copy to clipboard, view source
- ⚠️ Output quality needs improvement — AI sometimes misses layout accuracy
- ❌ No batch processing (multiple banners at once) yet
- ❌ No template detection for repeated layouts yet
- ❌ No user authentication (single user tool for now)

---

## Known issues & next improvements
1. **Layout accuracy** — AI-generated HTML doesn't always match Figma pixel-perfectly. Need better prompt tuning or post-processing.
2. **Batch processing** — Client sends 5 banners/day. Should support pasting multiple Figma URLs at once.
3. **Template detection** — Some banners share the same layout. Detect repeated patterns and reuse templates instead of regenerating.
4. **Save history** — Keep a log of generated banners with thumbnails.
5. **Figma token persistence** — Token currently lost on page refresh. Should save to localStorage.

---

## Tech decisions made
- **Node.js + Express** — simple proxy to avoid CORS issues when calling AI APIs from browser
- **Vanilla JS frontend** — no framework needed for MVP, keeps it simple
- **Auto AI detection** — user just adds whatever key they have, tool figures out which AI to use
- **position:absolute layout** — chosen because Figma uses absolute positioning, maps directly to CSS

---

## Figma file being tested
- File key: `X7OuLA1u93b2J66RuOCeMv`
- Project: 5321 Partner Kit of Parts (Sears Home Services / AHM / IHR brands)
- Banner type: 5321 Visa credit card "Get $200 back" offer
- Sizes: 970x90, 728x90, 300x600, 160x600, 250x250

---

## How to continue in VS Code
1. Install **Cline** extension in VS Code (search "Cline" in Extensions)
2. Add your Anthropic or Groq API key to Cline settings
3. Open the `banner-generator` folder in VS Code
4. Start a new Cline chat and say:
   > "Read PROJECT_SUMMARY.md and continue improving the banner generator. Focus on [whatever you want next]."
