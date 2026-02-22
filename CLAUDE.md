# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Production build (outputs to `dist/`)
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build locally

No test framework is configured. Both `package-lock.json` and `yarn.lock` exist; use npm.

## Architecture

Single-page React 19 app built with Vite, deployed on Vercel. Tracks lacrosse player performance during practices and games.

**The entire app lives in `src/App.jsx` (~420 lines)** — a single monolithic component using `useState` for all state and localStorage for persistence. There is no router, no external state management, and no component decomposition.

### Data Model

- **players** — array of player name strings (persisted to localStorage)
- **sessions** — array of completed session objects (persisted to localStorage)
- **activeSession** — current in-progress tracking session with `{ id, type, date, marks, notes }`
- **marks** — nested object: `marks[playerName][category] = [+1/-1 values]`

### Views (controlled by `view` state string)

`home` → `tracking` → `review` → `history` | `settings`

### Performance Categories (3 groups)

- Effort/Hustle: Hustle, Attendance, Homework, Intensity
- Presence: Game Awareness, Practice Focus
- Sportsmanship: Humility, Gracious in Defeat, Bar Raiser

### Styling

All styles are inline JavaScript objects defined within App.jsx. No CSS files or CSS-in-JS library.

## ESLint

Flat config in `eslint.config.js`. Uses `@eslint/js` recommended + `react-hooks` + `react-refresh` plugins. Custom rule: `no-unused-vars` ignores uppercase-starting variables (`^[A-Z_]`).
