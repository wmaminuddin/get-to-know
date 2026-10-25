# Changelog

All notable changes to **Get to Know You** are documented here.

Versioning matches the in-app stamp: `v1.0.0` is the first commit; each later commit on `main` bumps the patch (`1.0.1`, `1.0.2`, …). See `vite.config.ts`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.10] — 2026-10-25

### Added

- `CHANGELOG.md` with backdated history from `1.0.0` through current release.
- Links to the changelog from `README.md` and `memory.md`.

## [1.0.9] — 2026-10-25

### Changed

- Complementary-question AI uses a per-mode **do/don’t brief** (`aiComplementaryBrief`) instead of a soft “mix depth: X%” line.
- System prompt tells the model to obey the mode brief strictly (lighter when Casual, deeper when Deep).
- Bank depth mixes unchanged (still the fallback mix).

## [1.0.8] — 2026-10-24

### Added

- Session **modes** on create: Casual, Friends, Besties, Dating, Deep — steers bank depth mix and AI tone.
- Customizable Yes/No **finale prompt** (host edits text, or “Suggest with AI”).
- Lobby shows mode + finale prompt; Finale UI uses the session prompt with mode-neutral yes/no copy.

### Changed

- Older sessions without `sessionMode` / `finalePrompt` behave like Dating + “Next Date?”.

## [1.0.7] — 2026-10-23

### Changed

- OpenRouter primary model set to `google/gemma-4-31b-it:free`, with `~z-ai/glm-flash-latest` as fallback.

## [1.0.6] — 2026-10-23

### Fixed

- AI deck generation ignored when `VITE_OPENROUTER_MODEL` used an invalid `:batch` slug — reject unusable chat models and fall through the model chain / bank.

## [1.0.5] — 2026-10-23

### Fixed

- GitHub Pages version stamp stuck at `1.0.0` — CI checkout now uses full git history (`fetch-depth: 0`).

## [1.0.4] — 2026-10-23

### Added

- Commit-based app **version footer** in the UI.

### Changed

- Softened the skip control styling (less prominent).

## [1.0.3] — 2026-10-23

### Changed

- Tightened AI prompts and near-duplicate filters so complementary questions avoid repeating what players already wrote.

## [1.0.2] — 2026-10-23

### Added

- OpenRouter **AI complementary questions** at deck build time, with curated bank fill/fallback.
- Env: `VITE_OPENROUTER_API_KEY` (+ optional `VITE_OPENROUTER_MODEL`).

## [1.0.1] — 2026-10-23

### Added

- `memory.md` development handoff for continuing on other devices / forks.

## [1.0.0] — 2026-10-23

### Added

- Initial release: two-device get-to-know evening on Vite + React + TypeScript.
- Firebase Realtime Database sessions (create/join via matching code).
- Each player writes N questions (host sets 3–15); app adds N from curated bank.
- Shared deck with wait-and-reveal answers; finale **Next Date?** Yes/No.
- GitHub Pages deploy workflow.
