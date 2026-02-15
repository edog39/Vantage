# Gemini API Key Setup (Website Scan)

The website scan feature uses **Google Gemini** to analyze a user’s site and suggest tasks. To enable it, you need a Gemini API key and to add it to your environment (e.g. **Vercel**).

---

## 1. Get a Gemini API key

1. Go to **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account.
3. Click **“Create API key”** (and pick a Google Cloud project if prompted).
4. Copy the key and store it somewhere safe. You won’t be able to see it again in full.

---

## 2. Add the key in Vercel (production / preview)

So the key is available to your deployed app (and not in code):

1. Open your project in the **Vercel dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select the **Vantage** project (or the one that hosts the website).
3. Go to **Settings → Environment Variables**.
4. Click **Add New**.
5. Set:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your Gemini API key (paste it).
   - **Environments:** check Production (and Preview if you want it in preview deployments).
6. Save.
7. **Redeploy** the project (e.g. **Deployments → … → Redeploy**) so the new variable is picked up.

After this, the scan API will use Gemini when users finish onboarding with a website URL.

---

## 3. Optional: different Gemini model

Default model is `gemini-1.5-flash`. To use another model (e.g. `gemini-1.5-pro`):

1. In Vercel, add another environment variable:
   - **Name:** `GEMINI_MODEL`
   - **Value:** `gemini-1.5-pro` (or another [supported model](https://ai.google.dev/gemini-api/docs/models/gemini))
2. Redeploy.

---

## 4. Local development

For local runs (e.g. `npm run dev` with Vite), Vercel CLI can inject env vars from your project, or you can use a `.env` file in the **website** folder.

**Option A – Vercel CLI**

- Run `vercel dev` in the website (or repo) root so it uses your Vercel env vars (including `GEMINI_API_KEY`).

**Option B – `.env` in `website/`**

1. In `website/`, create a file named `.env` (or `.env.local`).
2. Add one line:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
3. Do **not** commit `.env` (it should be in `.gitignore`). Only commit `.env.example` if you add one.

If you use a different local server (e.g. custom Node server), make sure it loads env from this file or from your shell so `process.env.GEMINI_API_KEY` is set when the API route runs.

---

## Summary

| Where        | What to do |
|-------------|------------|
| **Vercel**  | Settings → Environment Variables → Add `GEMINI_API_KEY` → Redeploy |
| **Local**   | Add `GEMINI_API_KEY=...` to `website/.env` or use `vercel dev` |

The scan API reads `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`). If the key is missing, the app still works and uses built-in fallback task suggestions instead of Gemini.
