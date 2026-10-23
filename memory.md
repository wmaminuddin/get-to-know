# Get to Know You — development memory

Handoff doc so you can continue on another device or fork without losing direction.  
**Repo stays public.** Do not commit secrets (`.env` is gitignored).

---

## What this is

A mobile-first **two-device** web app for a get-to-know / date-style evening:

1. Host creates a room: picks a **session mode**, optional Yes/No **finale prompt** (or AI suggest), and how many questions each person writes (3–15, default 10).
2. Guest joins with a **6-character matching code**.
3. Each person writes **N** questions; the app adds **N** complementary questions (mode-tuned depth/tone).
4. Both answer the **same sequence** (total `3N`): submit or skip → wait for partner → **mutual reveal** → next.
5. Finale: host’s Yes/No prompt — revealed together when both have answered.

Design choice for reveal UX: per-question mutual reveal (not one-way instant, not end-only). System questions: **OpenRouter** complementary generation when `VITE_OPENROUTER_API_KEY` is set, with the **curated bank** as fill/fallback.

---

## Live links

| What | URL / id |
|------|----------|
| GitHub repo | https://github.com/wmaminuddin/get-to-know |
| GitHub Pages | https://wmaminuddin.github.io/get-to-know/ |
| Firebase project | `get-to-know-8275d` |
| Firebase console | https://console.firebase.google.com/project/get-to-know-8275d |
| RTDB region | **asia-southeast1** |
| Correct RTDB URL host | `https://get-to-know-8275d-default-rtdb.asia-southeast1.firebasedatabase.app` |

Local project path (original machine): `C:\Users\User\Projects\get-to-know`

---

## Stack

- **Frontend:** Vite + React + TypeScript
- **Backend:** Firebase Realtime Database (Spark / free)
- **Hosting:** GitHub Pages via `.github/workflows/deploy.yml`
- **Base path for Pages:** `VITE_BASE=/get-to-know/` (set in the workflow)

No custom server. Client writes/listens to `sessions/{code}/…`.

---

## Core flow and data model

### Session status

`lobby` → `writing` → `answering` → `finale` → `done`

### Important fields (`sessions/{code}`)

- `hostId`, `questionsPerPerson` (N each writes; system adds N)
- `sessionMode`: `casual` | `friends` | `besties` | `dating` | `deep` (default dating for old rooms)
- `finalePrompt`: Yes/No question text shown in Finale (default `"Next Date?"` for old rooms)
- `players/{playerId}`: `name`, `questions[]`, `questionsReady`, …
- `questions[]`: shared deck `{ id, text, source: 'a'|'b'|'system' }`
- `answers/{questionIndex}/{playerId}`: `{ text, skipped, at }`
- `progress/{playerId}`: `{ currentIndex }`
- `finale/{playerId}`: `{ nextDate, at }` (boolean answer; field name kept for compat)
- `deckBuilt`: boolean (transaction-safe deck assembly)

### Answer / reveal sync

- You submit/skip for index `i` → wait until partner has too → show both answers.
- **Next** advances your `currentIndex`; if partner is behind, you wait (“Waiting for them to continue…”).
- Local identity (code + playerId + name) lives in `sessionStorage` (`gtk_identity`).

### Question bank + AI

- File: `src/data/systemQuestions.ts` (~48 questions, depth 1–3, themes).
- Modes: `src/lib/sessionModes.ts` — depth mixes + AI tone + default finale prompts.
- Picker: `src/lib/deck.ts` — low overlap with user questions; depth mix from session mode.
- AI: `src/lib/aiQuestions.ts` — OpenRouter chat completions (primary `google/gemma-4-31b-it:free`, fallback `~z-ai/glm-flash-latest`); `resolveSystemQuestionTexts` prefers AI, fills gaps from bank; `generateFinalePrompt` for create-time Yes/No suggestion.
- Count helpers: `src/lib/questionCount.ts` (clamp 3–15; `depthTargetsForMode`).
- Env: `VITE_OPENROUTER_API_KEY` (+ optional `VITE_OPENROUTER_MODEL`) in local `.env` + Actions secrets for Pages. Key is client-visible in the bundle.

---

## Key files

| Path | Role |
|------|------|
| `src/App.tsx` | Routes by session status; lobby→writing promote; deck build trigger |
| `src/screens/Home.tsx` | Create / join; mode, finale prompt, `questionsPerPerson` |
| `src/screens/Lobby.tsx` | Share code; show mode, finale, round size |
| `src/screens/WriteQuestions.tsx` | Enter N questions |
| `src/screens/PlayRound.tsx` | Answer / wait / reveal loop |
| `src/screens/Finale.tsx` | Custom Yes/No finale prompt |
| `src/lib/sessionApi.ts` | Firebase create/join/subscribe/answers/deck |
| `src/lib/sessionModes.ts` | Mode labels, depth mixes, default finales |
| `src/firebase.ts` | Config from `VITE_FIREBASE_*` |
| `src/data/systemQuestions.ts` | Curated bank (fallback) |
| `src/lib/aiQuestions.ts` | OpenRouter complementary + finale suggest |
| `database.rules.json` | Open session read/write (friends toy app) |
| `.github/workflows/deploy.yml` | Build with secrets → GitHub Pages |
| `.env.example` | Template for local env |
| `README.md` | Setup / deploy / play instructions |

---

## Setup on a new device

1. Clone: `git clone https://github.com/wmaminuddin/get-to-know.git`
2. `npm install`
3. `cp .env.example .env` (Windows: `copy .env.example .env`)
4. Fill Firebase values from:
   - Firebase Console → Project settings → Your apps, **and**
   - Realtime Database → copy the **exact** database URL (must include region if not US default)
5. Or copy `.env` from a machine that already works (never commit it).
6. GitHub Actions already has secrets named `VITE_FIREBASE_*` for Pages deploys — recreate them on a fork.
7. `npm run dev` → open on two browsers/phones.

### Secrets policy

- **Do not** put API keys in this file or in git.
- Local: `.env`
- CI: repo **Settings → Secrets and variables → Actions**
- Source of truth for URL: Firebase console (region-specific)

---

## Gotchas (learned the hard way)

1. **Wrong RTDB URL hangs “Creating…”**  
   `https://…-default-rtdb.firebaseio.com` returned **404** for this project.  
   Correct: `https://get-to-know-8275d-default-rtdb.asia-southeast1.firebasedatabase.app`  
   Create path now has a ~12s timeout with a clearer error if the URL is wrong.

2. **Vite only reads `.env` on startup** — restart `npm run dev` after changing env.

3. **Pages base path** — assets break if `VITE_BASE` is not `/get-to-know/` for this repo name.

4. **Question count is per person** — total answered = `3 × questionsPerPerson` (you + them + system).

5. **Security** — rules are permissive for anyone who knows a session path; codes are for trusted pairs, not production privacy.

6. **Repo visibility** — intentionally left **public** so GitHub Pages on Free stays simple.

---

## Conversation / decision log

### 2026-10-23 — Product and build

- Idea: two phones, matching code, each asks 10, app adds 10 complementary, both answer 30 with live reveal, end with Next Date? Yes/No.
- Chose **curated bank** over AI for v1 (simpler, free, no API keys for LLM).
- Stack: Vite/React/TS + Firebase RTDB + GitHub Pages.
- Implemented full flow in `C:\Users\User\Projects\get-to-know`.
- UI: mobile-first, dark green / coral accent (avoid purple-SaaS / cream-terracotta clichés).

### 2026-10-23 — Firebase

- Project `get-to-know-8275d` created; web app config put in local `.env`.
- Create room stuck until RTDB URL fixed to **asia-southeast1** `.firebasedatabase.app`.

### 2026-10-23 — Configurable round size

- Host can set questions each person writes (3–15).
- System adds the same count; lobby shows total `3N`.

### 2026-10-23 — Publish

- Repo: `wmaminuddin/get-to-know` (public).
- Actions deploy succeeded; site live at GitHub Pages URL above.
- Firebase values stored as Actions secrets (not in git).

### 2026-10-23 — Handoff

- User asked to make repo private + `memory.md`; then decided **keep public**, only add this `memory.md`.

### 2026-10-23 — AI complementary questions

- Deck build calls OpenRouter before the Firebase transaction; curated bank fills gaps or full fallback.
- Switched from Gemini direct API (credits depleted) to OpenRouter.
- Models: primary `google/gemma-4-31b-it:free`, fallback `~z-ai/glm-flash-latest` (tilde is part of the OpenRouter slug).
- Local: `VITE_OPENROUTER_API_KEY` in `.env` (gitignored). Pages: add same name as Actions secret.
- Gotcha: `VITE_OPENROUTER_MODEL=…:batch` breaks chat completions → silent bank fallback. Use a chat model or omit the secret.
- Host-only deck build so a failed AI race cannot commit the bank first.
- No secrets in `memory.md` or git. Rotate any key that was pasted into chat.

### 2026-10-24 — Session modes + custom finale

- Tester feedback: some questions too deep for light usage.
- Host picks mode on create: Casual / Friends / Besties / Dating / Deep — steers bank depth mix + AI tone.
- Finale stays Yes/No; host edits the prompt or uses “Suggest with AI” (falls back to mode default).
- Old sessions without `sessionMode` / `finalePrompt` behave like Dating + “Next Date?”.

---

## Suggested next work

- [x] AI-generated complementary questions (OpenRouter + bank fallback) — client-side key for now; optional later: tiny serverless proxy
- [x] Session modes + customizable Yes/No finale prompt
- [ ] Tighter Firebase rules / session TTL / cleanup of old sessions
- [ ] Shareable summary or “copy answers” at the end
- [ ] Phone network testing: `npm run dev -- --host` for LAN
- [ ] Keep this `memory.md` updated when making product decisions

---

## Quick commands

```bash
npm install
npm run dev
npm run build
# deploy is automatic on push to main (GitHub Actions → Pages)
```
