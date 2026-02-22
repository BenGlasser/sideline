# Architecture

**Analysis Date:** 2026-02-22

## Pattern Overview

**Overall:** Single-Page Application (SPA) with client-side state management

**Key Characteristics:**
- React 19 with hooks-based state management (no Redux/Context API)
- Browser localStorage for data persistence
- Direct DOM manipulation and inline styles (no CSS files)
- Mobile-first responsive design (max-width 480px)
- Monolithic component approach with view-based navigation

## Layers

**Presentation Layer:**
- Purpose: Render UI and capture user interactions
- Location: `src/App.jsx`
- Contains: React components for 5 main views (home, tracking, review, history, settings)
- Depends on: Local state hooks, browser APIs
- Used by: Browser DOM

**State Management Layer:**
- Purpose: Manage application state and persist to localStorage
- Location: `src/App.jsx` (lines 17-31)
- Contains: useState hooks for players, sessions, activeSession, view, selectedPlayer, toast, lastAction
- Depends on: React hooks, localStorage API
- Used by: Presentation layer components

**Data Layer:**
- Purpose: Persist and retrieve data from browser storage
- Location: `src/App.jsx` (lines 12-13)
- Contains: loadJSON/saveJSON helper functions
- Depends on: Browser localStorage API
- Used by: State management layer

**Business Logic Layer:**
- Purpose: Calculate aggregates and transform session data
- Location: `src/App.jsx` (lines 11, 65-71, 83-131)
- Contains: Helper functions for category lookup, player totals, CSV export
- Depends on: Data structures and calculations
- Used by: Event handlers and render logic

## Data Flow

**Session Creation and Tracking:**

1. User clicks "Practice" or "Game" button on home view
2. `startSession()` creates new session object with timestamp and empty marks
3. User navigates to tracking view, selects player
4. User taps category buttons (+ or -) to record marks
5. `recordMark()` updates activeSession.marks[player][category] array
6. Mark is persisted to localStorage via useEffect dependency
7. Toast notification displays feedback to user

**Session Completion:**

1. User reviews session on review view, adds notes per player via `updateNotes()`
2. User clicks "Save & End"
3. `endSession()` moves activeSession to sessions array
4. activeSession is cleared from localStorage
5. View returns to home

**History Viewing:**

1. User navigates to history view
2. Sessions displayed in reverse chronological order
3. Clicking a session loads detail view with player breakdown
4. User can export single session or all sessions as CSV
5. User can delete sessions

**State Management:**

- **Transient state:** view, selectedPlayer, detailSession, editingPlayerIndex, toast, lastAction
- **Persistent state:** players, sessions, activeSession
- **Ephemeral state:** editingName (cleared when edit completes)

**localStorage Keys:**
- `lax-players`: Array of player names
- `lax-sessions`: Array of completed session objects
- `lax-active`: Current active session (removed when ended)

## Key Abstractions

**Session Object:**
- Purpose: Encapsulates a tracking session (practice or game)
- Structure: `{ id, type, date, marks, notes }`
- Examples: Created in `startSession()`, used throughout tracking views
- Pattern: Plain JavaScript objects with nested structure

**Mark Records:**
- Purpose: Track individual +1/-1 actions per player per category
- Structure: `session.marks[player][category] = [1, -1, 1]` (array of scores)
- Pattern: Allows tracking multiple entries and computing sum via `reduce()`

**Player Totals Calculation:**
- Purpose: Aggregate marks across categories for a player
- Pattern: `Object.values(marks[player]).flat().reduce((a,b)=>a+b, 0)`
- Used in: Player cards, review cards, export

**Category Grouping:**
- Purpose: Organize scoring categories by semantic group (effort, presence, sportsmanship)
- Examples: CATEGORIES constant maps groups to colored item arrays
- Pattern: Used for UI organization and breakdown display in review view

## Entry Points

**Application Bootstrap:**
- Location: `src/main.jsx`
- Triggers: Page load via `<script src="/src/main.jsx">` in index.html
- Responsibilities: Mount React app to DOM root element, configure React.StrictMode

**Main Component:**
- Location: `src/App.jsx` (default export)
- Triggers: Rendered by main.jsx
- Responsibilities: Manage all app state, render appropriate view based on view state, handle all user actions

**View Components:**
- Location: `src/App.jsx` (conditional renders within App)
- Types: home, tracking (player selection and tracking), review (notes), history, settings
- Pattern: Each view is a conditional JSX block within the same function

## Error Handling

**Strategy:** Defensive with silent fallback

**Patterns:**
- localStorage operations wrapped in try-catch blocks that silently fail (lines 12-13)
- Null/optional chaining used throughout to prevent crashes on missing data (`session?.marks?.[player]`)
- Empty state checks prevent rendering invalid data (e.g., history with no sessions)
- Undo functionality guards against invalid state with `lastAction` timestamp check

## Cross-Cutting Concerns

**Logging:** None detected. No debug logging or error tracking.

**Validation:** Minimal inline validation
- Player name editing prevents empty names (fallback to original)
- Roster requires at least one player (delete disabled if only one remains)
- Session deletion guards against rendering deleted session details

**Authentication:** Not applicable (single-user mobile app)

**Persistence:** Implicit throughout via useEffect hooks watching state
- Players, sessions, activeSession automatically saved to localStorage on change
- Restored on app mount via loadJSON with fallback defaults

---

*Architecture analysis: 2026-02-22*
