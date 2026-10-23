# Get to Know You

A simple two-device web app: pair with a short code, each write 10 questions, the app adds 10 complementary questions from a curated bank, then you both answer the same 30 questions with a wait-and-reveal. Ends with **Next Date? Yes / No**.

## Stack

- **Frontend:** Vite + React + TypeScript  
- **Hosting:** GitHub Pages (free)  
- **Backend:** Firebase Realtime Database (Spark / free tier)

## Setup

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Firebase (free)

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Add a **Web** app and copy the config values into `.env`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. Enable **Realtime Database** (start in test mode, or paste rules from `database.rules.json`).
4. These rules allow anyone who knows a session code to read/write that session. Fine for friends; not for a public production app.

### 3. Run locally

```bash
npm run dev
```

Open the URL on two phones (or two browser profiles) on the same network / internet.

## Deploy to GitHub Pages

1. Push this repo to GitHub (name it `get-to-know` or set `VITE_BASE` to match).
2. In `.env` / GitHub Actions secrets, set:

   ```
   VITE_BASE=/get-to-know/
   ```

   (use `/<your-repo-name>/` for project pages)

3. Add the same `VITE_FIREBASE_*` values as **GitHub Actions secrets** (see `.github/workflows/deploy.yml`).
4. In the repo **Settings → Pages**, set source to **GitHub Actions**.
5. Push to `main` — the workflow builds and deploys `dist/`.

Manual deploy from your machine:

```bash
npm run build
npm run deploy
```

(`deploy` uses `gh-pages` and needs `VITE_BASE` set for project sites.)

## How to play

1. One person **creates** a session and shares the 6-character code.
2. The other **joins** with the code.
3. Each writes **10 questions**.
4. The app adds **10** more from the bank (basic → deeper).
5. Answer all **30** together: submit or skip → wait → reveal both answers → next.
6. Finale: **Next Date?** Yes / No — revealed together.

## Privacy note

Session data lives in your Firebase project. Codes are unguessable enough for casual use among people you trust. Do not treat this as a secure private chat product.
