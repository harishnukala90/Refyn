# Refyn - Refine Your Prompts

<p align="center">
  <img src="public/logo.png" alt="Refyn logo" width="180" />
</p>

<p align="center">
  <strong>Turn rough prompts into polished, model-ready instructions in seconds.</strong>
</p>

Refyn is a React + Express prompt refinement app that transforms raw ideas into structured, high-signal prompts using the Gemini API, with a resilient local fallback engine when the API key, quota, or network is unavailable.

## Highlights

- Lightning-fast prompt optimization with dynamic refinements
- Clean sidebar history, examples, and theme aware UI
- Built-in fallback synthesis for uninterrupted usage
- Simple local development and production workflow

## Stack

- React 19
- Vite 6
- Tailwind CSS 4
- Express 4
- TypeScript
- `@google/genai`
- `motion`
- `lucide-react`

## Requirements

Install Node.js first. Use the current LTS version from:

```text
https://nodejs.org/
```

After installation, confirm both commands work:

```bash
node -v
npm -v
```

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `.env`:

```env
GEMINI_API_KEY="your_api_key_here"
GEMINI_MODEL="gemini-2.5-flash"
PORT="3000"
```

## Run Locally

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Useful Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run clean
```

## API

Health check:

```bash
curl http://localhost:3000/api/health
```

Refine a prompt:

```bash
curl -X POST http://localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d "{\"rawPrompt\":\"make a responsive react navbar\",\"category\":\"coding\",\"targetModel\":\"gemini\",\"format\":\"detailed\"}"
```

Generate a raw example prompt:

```bash
curl -X POST http://localhost:3000/api/generate-raw-prompt \
  -H "Content-Type: application/json" \
  -d "{\"category\":\"coding\"}"
```

## Project Structure

```text
Refyn/
  server.ts
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  metadata.json
  src/
    App.tsx
    main.tsx
    index.css
    data.ts
    types.ts
    components/
      LoadingSandbox.tsx
      PromptOptimizerMetric.tsx
      Sidebar.tsx
      TypewriterPrompt.tsx
```

## Notes

- If `GEMINI_API_KEY` is missing or the Gemini request fails, the server returns a locally synthesized fallback response with `isOfflineEngine: true`.
- `GEMINI_MODEL` is configurable so you can change model IDs without editing source code.
- The app stores prompt history and theme preference in browser local storage.
