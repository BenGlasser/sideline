# Coding Conventions

**Analysis Date:** 2026-02-22

## Naming Patterns

**Files:**
- JSX components use PascalCase: `App.jsx`, `main.jsx`
- Entry point file follows framework convention: `main.jsx`
- Extension: `.jsx` for React files with JSX

**Functions:**
- Exported components use PascalCase: `App`, `defaultPlayers`
- Helper/utility functions use camelCase: `getGroupForCategory()`, `loadJSON()`, `saveJSON()`, `showToast()`, `recordMark()`, `undoLast()`, `getPlayerTotal()`, `getPlayerCategoryTotal()`, `endSession()`, `updateNotes()`, `deleteSession()`, `exportSessionCSV()`, `exportAllCSV()`, `downloadCSV()`

**Variables:**
- State variables and regular variables use camelCase: `players`, `sessions`, `activeSession`, `view`, `selectedPlayer`, `detailSession`, `editingPlayerIndex`, `editingName`, `toast`, `lastAction`
- Constants that are immutable use camelCase or UPPERCASE for configuration: `CATEGORIES` (data array), `ALL_CATEGORIES` (derived constant)
- Private/nested variables use camelCase: `session`, `total`, `p` (player iterator), `hasMark`, `catTotal`

**Types:**
- No TypeScript used; plain JavaScript objects
- Object properties use camelCase: `id`, `type`, `date`, `marks`, `notes`, `color`, `group`, `items`

## Code Style

**Formatting:**
- No auto-formatter configured (no `.prettierrc` or `prettier` config)
- Code uses consistent spacing: 2 spaces for indentation in configuration files
- Line length varies, some lines are long (200+ characters) in inline style objects

**Linting:**
- ESLint enabled with flat config (`eslint.config.js`)
- Framework: ESLint 9.39.1 with flat config format
- Rules applied:
  - `@eslint/js` recommended rules
  - `eslint-plugin-react-hooks` recommended rules for hooks
  - `eslint-plugin-react-refresh` for React Refresh support
  - Custom rule: `no-unused-vars` with varsIgnorePattern for uppercase identifiers (components, constants)

## Import Organization

**Order:**
1. React/library imports: `import React from 'react'`, `import ReactDOM from 'react-dom/client'`
2. Local imports: `import App from './App.jsx'`

**Path Aliases:**
- No path aliases configured; uses relative imports only

**Pattern:**
- Simple relative imports: `'./App.jsx'`, `'./main.jsx'`
- Named imports from libraries: `import { useState, useEffect, useCallback } from "react"`
- Uses destructuring for multiple imports

## Error Handling

**Patterns:**
- Try-catch blocks used for risky operations: `loadJSON()` and `saveJSON()` wrap localStorage access
- Silent catch fallbacks: `catch { return fallback; }` in `loadJSON()`, `catch {}` in `saveJSON()`
- No error logging to console; errors are caught but suppressed
- Null checks used before operations: `if (!lastAction || !activeSession) return`, `if (!session?.marks?.[player])`, `if (detailSession?.id === id)`
- Optional chaining used extensively: `activeSession?.marks?.[player]`, `session?.notes?.[p]`

## Logging

**Framework:** No logging framework; uses `console` implicitly available but not actively used in code

**Patterns:**
- No debug logging visible in codebase
- No error logging configured
- No analytics or monitoring calls

## Comments

**When to Comment:**
- No comments in code; convention appears to be self-documenting variable names
- No JSDoc comments observed

**JSDoc/TSDoc:**
- Not used; no TypeScript and no JSDoc annotations in source

## Function Design

**Size:**
- Functions vary from very small (2-3 lines) to large (50+ lines)
- Main `App()` component is 236 lines with all logic inline
- Helper functions stay small: `getGroupForCategory()` is 1 line, `loadJSON()` is 2 lines

**Parameters:**
- Minimal parameters; functions receive only what they need
- Arrow functions preferred for inline event handlers: `onClick={() => startSession("Practice")}`
- Destructuring not heavily used for parameters

**Return Values:**
- Functions return values directly or implicitly undefined
- Hooks return state and setters: `const [players, setPlayers] = useState(...)`
- Some functions return computed values: `getPlayerTotal()` returns number, `loadJSON()` returns object or fallback

## Module Design

**Exports:**
- Default export for App component: `export default function App()`
- One component per file convention
- Single entry point through `main.jsx`

**Barrel Files:**
- Not used; only two files in src directory (`main.jsx`, `App.jsx`)

---

*Convention analysis: 2026-02-22*
