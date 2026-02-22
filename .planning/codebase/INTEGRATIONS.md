# External Integrations

**Analysis Date:** 2026-02-22

## APIs & External Services

**No External APIs:**
- Application does not integrate with any third-party APIs
- No SDK imports detected (no stripe, supabase, firebase, aws, google, openai, etc.)

## Data Storage

**Databases:**
- Not applicable - No backend database integration

**Browser Storage:**
- localStorage - Primary data persistence mechanism
  - Client: Browser localStorage API (native JavaScript)
  - Keys used:
    - `lax-players` - Array of player names
    - `lax-sessions` - Array of session records
    - `lax-active` - Currently active session object
  - Implementation: `src/App.jsx` lines 12-13 (loadJSON, saveJSON functions)

**File Storage:**
- Local filesystem only - CSV export feature generates downloadable files
  - Export functionality: `src/App.jsx` lines 83-131 (exportSessionCSV, exportAllCSV, downloadCSV)
  - Format: CSV with headers and player performance data

**Caching:**
- None - Application uses React state management with localStorage persistence

## Authentication & Identity

**Auth Provider:**
- Not applicable - No authentication system
- Application has no user accounts or login mechanism
- Data is device-local only

## Monitoring & Observability

**Error Tracking:**
- None - No error tracking service integrated

**Logs:**
- Console only - No structured logging
- Toast notifications for user feedback: `src/App.jsx` line 33 (showToast function)

## CI/CD & Deployment

**Hosting:**
- Vercel - Configured via `.vercel/project.json`
  - Project ID: prj_T64aIJH62kYMsSZFkp84xOfGIzD8
  - Organization ID: team_f3tu2movnjarxp5fbUwJkQaP
  - Project Name: sideline

**CI Pipeline:**
- Vercel automatic deployment - No explicit CI configuration file detected

## Environment Configuration

**Required env vars:**
- None - Application requires no environment variables
- Fully static, client-side application

**Secrets location:**
- Not applicable - Application stores no sensitive secrets

## Webhooks & Callbacks

**Incoming:**
- None - Application has no backend endpoints

**Outgoing:**
- None - Application makes no external API calls

## Data Format & Export

**CSV Export:**
- Single session export: `exportSessionCSV()` function at `src/App.jsx` lines 83-98
  - Headers: Player, category columns (Hustle, Attendance, etc.), Total, Notes
  - Filename format: `{sessionType}_{date}.csv`

- All sessions export: `exportAllCSV()` function at `src/App.jsx` lines 100-119
  - Headers: Date, Type, Player, category columns, Total, Notes
  - Filename format: `all_sessions_{date}.csv`

**Data Structure:**
- Sessions: `{ id, type, date, marks, notes }`
- Players: String array
- Marks: `{ [playerName]: { [categoryName]: [value, value, ...] } }`
- Notes: `{ [playerName]: string }`

---

*Integration audit: 2026-02-22*
