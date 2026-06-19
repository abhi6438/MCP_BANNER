# Code Generator — Setup

## One-time setup

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version) and install.

### Step 2 — Get an API key (pick ONE — you only need one)

  Option A: Groq — FREE, no credit card
  → https://console.groq.com → API Keys → Create Key

  Option B: Google Gemini — FREE tier available
  → https://aistudio.google.com/apikey → Create API Key

  Option C: Anthropic Claude
  → https://console.anthropic.com → API Keys → Create Key

  Option D: OpenAI GPT-4o
  → https://platform.openai.com → API Keys → Create Key

### Step 3 — Install dependencies
Open Terminal in this folder and run:

    npm install

### Step 4 — Add your API key
Copy .env.example → rename to .env
Uncomment the line for your chosen AI and paste your key.

## Every time you use it

    npm start

Then open: http://localhost:3000

The tool auto-detects which AI key you have.
To switch AI — update .env and restart with npm start.
