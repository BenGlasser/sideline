# Codebase Concerns

**Analysis Date:** 2026-02-22

## Tech Debt

**Monolithic Component Architecture:**
- Issue: The entire application is a single 420-line component with all state, logic, and rendering in one file
- Files: `src/App.jsx`
- Impact: Nearly impossible to test, maintain, or refactor. Any bug fix or feature requires touching the entire component. Logic reuse is impossible.
- Fix approach: Break into smaller, composable components (e.g., `SessionSelector`, `PlayerTracking`, `SessionHistory`, `RosterManager`). Extract reusable logic into hooks (e.g., `useSession`, `usePlayers`). Consider a state management solution if complexity grows further.

**Inline Styling:**
- Issue: All styling is defined as inline JavaScript objects in the component (~65 lines of `const styles = {...}`)
- Files: `src/App.jsx` (lines 356-420)
- Impact: Styles are tightly coupled to logic, difficult to reuse, no separation of concerns. Styling errors affect the entire app. No theming capability.
- Fix approach: Extract styles to CSS files or consider a CSS-in-JS library (styled-components, Tailwind). Create a theme system.

**No Abstraction Layer for localStorage:**
- Issue: Multiple components directly call `localStorage.getItem()`, `localStorage.setItem()`, and JSON operations scattered throughout (lines 12-13, 29-31)
- Files: `src/App.jsx` (lines 12-13, 29-31)
- Impact: If localStorage API changes or migration to a different storage backend is needed, all code must be updated. No single source of truth for storage logic. Error handling in catch blocks silently fails.
- Fix approach: Create a custom hook `useLocalStorage()` or a storage service module that encapsulates all persistence logic.

**Try-Catch Silent Failures:**
- Issue: `loadJSON()` (line 12) and `saveJSON()` (line 13) catch errors but silently return fallback or do nothing
- Files: `src/App.jsx` (lines 12-13)
- Impact: Storage errors are invisible. Users won't know if data isn't being saved. Debugging is nearly impossible.
- Fix approach: At minimum, log errors to console. Consider sending to error tracking service. Provide user feedback when persistence fails.

**No Input Validation:**
- Issue: Player names, notes, and all user inputs are stored directly without validation
- Files: `src/App.jsx` (lines 15, 255, 331, 338-339, 343-344)
- Impact: Empty player names can be created. Notes can be malformed. CSV export can break with special characters despite quote escaping. No safeguards against XSS if data is ever exposed.
- Fix approach: Validate and sanitize all user inputs. Reject empty names. Limit text lengths. Use proper escaping for CSV export.

**Magic Strings and Hardcoded Values:**
- Issue: View names (`"home"`, `"tracking"`, `"review"`, `"history"`, `"settings"`), localStorage keys (`"lax-players"`, `"lax-sessions"`, `"lax-active"`), and color codes hardcoded throughout
- Files: `src/App.jsx` (multiple lines)
- Impact: Refactoring view names breaks the app. Changing localStorage schema requires careful search-replace. Colors must be duplicated in multiple places. No centralized configuration.
- Fix approach: Create constants file `src/constants.ts` with `VIEWS`, `STORAGE_KEYS`, `COLORS`, `CATEGORIES`. Import and use throughout.

**No Loading States:**
- Issue: localStorage operations appear synchronous and instant. No indication of what happens if storage fails or is slow
- Files: `src/App.jsx` (lines 29-31)
- Impact: If storage becomes async (e.g., IndexedDB), the app will need major refactoring. No loading spinners for data persistence.
- Fix approach: Add loading states. Plan for async storage operations.

## Known Bugs

**Array Mutation in State Updates:**
- Issue: `recordMark()` (line 47), `updateNotes()` (line 77), and other functions directly mutate nested objects via `.push()` before calling setState
- Files: `src/App.jsx` (lines 44-48, 74-78, 56-62)
- Impact: React may not detect state changes properly due to referential equality checks. Array mutations can cause re-render issues. Undo functionality (line 53-63) relies on mutable state.
- Example: Line 47 uses `updated.marks[player][category].push(value)` then `setActiveSession(updated)`. The array is mutated in place.
- Fix approach: Use immutable patterns: `...spread`, `.concat()`, or `.map()` instead of `.push()`. Or use Immer library for immutable updates.

**Undo Only Tracks Last Action:**
- Issue: `undoLast()` (line 53-63) only remembers the most recent action in `lastAction` state. Multiple consecutive actions can't be undone individually.
- Files: `src/App.jsx` (lines 49, 53-63)
- Impact: User accidentally marks multiple points and can only undo the last one. Previous marks are lost forever.
- Fix approach: Maintain an undo stack instead of single `lastAction`. Or implement a proper undo/redo system.

**No Confirmation Before Delete:**
- Issue: `deleteSession()` (line 81) immediately removes a session from history without confirmation
- Files: `src/App.jsx` (line 81)
- Impact: User can accidentally delete weeks of tracked data with a single click. No recovery possible (except localStorage recovery).
- Fix approach: Show a confirmation dialog before deletion. Consider soft deletes or a trash bin.

**Minimum Player Check Only for Delete:**
- Issue: Line 344 prevents deleting players if only 1 remains, but allows adding unlimited players and creating empty names
- Files: `src/App.jsx` (line 344)
- Impact: Can create roster of "Player 1", "Player 2", ... "Player 100". No validation that player has a real name.
- Fix approach: Add minimum/maximum roster size. Require non-empty names. Prevent duplicate names.

**CSV Special Character Escaping Incomplete:**
- Issue: Line 91 and 112 escape double quotes with `replace(/"/g, '""')`, but don't escape newlines or other CSV delimiters
- Files: `src/App.jsx` (lines 91, 112)
- Impact: Notes with newlines or commas will break CSV format. Exported data becomes unparseable.
- Fix approach: Use a proper CSV library (csv-stringify, papaparse) or quote all values properly.

## Security Considerations

**No Authentication/Authorization:**
- Risk: Single-user app without login. If deployed on shared device, any user can access all player data
- Files: Entire app
- Current mitigation: None. localStorage is browser-specific but accessible to all scripts on the domain
- Recommendations: Add user authentication if deployed publicly. Use sessionStorage + secure HTTP-only cookies if multi-user. Consider encrypted localStorage.

**No CSRF/CORS Protection:**
- Risk: If app is embedded in iframe or accessed from cross-origin, no protection against malicious actions
- Files: Not applicable (no API calls)
- Current mitigation: App is client-only, no server endpoints
- Recommendations: If APIs are added, implement CSRF tokens and validate CORS headers.

**XSS Vulnerability in Future API Integrations:**
- Risk: Inline styles and direct HTML rendering don't protect against XSS if user data is fetched from external sources
- Files: `src/App.jsx` (player names, notes rendered directly)
- Current mitigation: Data is only from localStorage
- Recommendations: Always sanitize user input. Use DOMPurify if data comes from API. Never use `dangerouslySetInnerHTML`.

**Exported CSV Data Exposure:**
- Risk: CSV export contains all player performance data. If emailed or shared insecurely, sensitive sports data is exposed
- Files: `src/App.jsx` (lines 83-98, 100-119)
- Current mitigation: Downloads locally only, user responsibility
- Recommendations: Add encryption option for exported files. Warn user about sensitive data.

## Performance Bottlenecks

**O(n²) History Filtering:**
- Problem: Line 309 and 310 iterate sessions to find active players, then render them. If 100 sessions exist, this creates DOM render for each.
- Files: `src/App.jsx` (lines 309-318)
- Impact: Scrolling history becomes jittery with 50+ sessions
- Improvement path: Memoize session summaries. Use React.memo() on history cards. Pre-calculate active player count.

**No Pagination in History:**
- Problem: All sessions render at once. With 100+ sessions, renders thousands of DOM nodes
- Files: `src/App.jsx` (lines 300-322)
- Impact: Browser memory usage grows linearly with session count. Initial load time becomes slow. Scrolling is choppy.
- Improvement path: Implement virtual scrolling or pagination. Load 20 sessions at a time.

**Inline Styles Recalculation:**
- Problem: Line 356-420 creates new style objects on every render. React compares references and may trigger unnecessary re-renders of styled elements.
- Files: `src/App.jsx` (lines 356-420)
- Impact: Subtle performance degradation in tracking view with rapid clicks. Component re-renders more often than needed.
- Improvement path: Move styles outside component or memoize with useMemo().

**No Memoization of Expensive Calculations:**
- Problem: `getPlayerTotal()` (line 65-68) and `getPlayerCategoryTotal()` (line 70) are called multiple times per render with no caching
- Files: `src/App.jsx` (lines 65-70, 185-189, 241, 278, 284)
- Impact: With 30 players × 9 categories × 100 sessions, totals are recalculated hundreds of times. Noticeable lag in history view.
- Improvement path: Use useMemo() to cache player totals. Recalculate only when activeSession changes.

## Fragile Areas

**Nested Data Structure (marks):**
- Files: `src/App.jsx` (lines 36, 43-50, 65-70)
- Why fragile: `marks[playerName][category]` is deeply nested with no validation. Accessing non-existent player crashes if guard checks are missed (e.g., `activeSession?.marks?.[player]`). Optional chaining masks errors.
- Safe modification: Always use optional chaining and null coalescing. Add a data validation function before saving. Consider flattening structure to array of `{ playerId, category, value }` objects.
- Test coverage: No tests. Any change to marks structure is untested.

**Player Deletion Logic:**
- Files: `src/App.jsx` (lines 334-346)
- Why fragile: Deleting a player doesn't clean up historical session marks. Old sessions still reference deleted player names (orphaned data). If player is re-added with same name, marks from old sessions reappear.
- Safe modification: When deleting a player, decide: (a) delete from all old sessions, (b) keep as read-only in history, or (c) archive instead of delete. Add a migration function.
- Test coverage: No tests.

**Session Type Assumptions:**
- Files: `src/App.jsx` (lines 35, 95, 156, 313)
- Why fragile: Session type is hardcoded as `"Practice"` or `"Game"` (lines 153, 156). Styling assumes only these two (line 313). Adding a third type breaks UI.
- Safe modification: Define session types as enum or constant array. Use type to look up styling, not hardcode.
- Test coverage: No tests.

**View Navigation State:**
- Files: `src/App.jsx` (lines 21, 133-353)
- Why fragile: View logic is giant if-else chain (lines 133-353). Adding new view requires understanding entire control flow. Missing view breaks with `return null` (line 353). No route protection.
- Safe modification: Move view components to separate files. Create a view router. Use switch statement or map for clarity.
- Test coverage: No tests. Every view change is untested.

## Scaling Limits

**localStorage Quota (~5-10MB):**
- Current capacity: Approximately 50,000 sessions with full marks data before exceeding storage quota
- Limit: localStorage is per-origin and has hard 5-10MB limit. App will crash silently when quota exceeded.
- Scaling path: (1) Archive old sessions to server, (2) Compress marks data with run-length encoding, (3) Migrate to IndexedDB (100MB+), (4) Add server-side persistence.

**Single-Page Memory:**
- Current capacity: Browser memory becomes noticeably tight with 200+ sessions in memory. Mobile browsers hit 100-session limit.
- Limit: Keeping all sessions in `sessions` state array causes memory bloat. No pagination or lazy loading.
- Scaling path: Implement pagination. Load sessions on-demand. Move to backend database.

**Player Roster Size:**
- Current capacity: 100+ players in roster becomes sluggish. Tracking view grid becomes unwieldy.
- Limit: Grid layout has no scrolling or pagination for player list. Too many players breaks mobile UI.
- Scaling path: Add player search/filter. Use virtual list. Organize players into teams.

## Missing Critical Features

**No Data Persistence Beyond Browser:**
- Problem: If user clears browser data or switches device, all data is lost forever
- Blocks: Syncing data across devices. Using app on multiple phones. Long-term data retention.
- Fix: Add backend API with authentication. Implement cloud sync.

**No Backup/Export Capability (except CSV):**
- Problem: Only CSV export available. No option to backup entire app state as JSON. Importing data is not possible.
- Blocks: Recovering from data loss. Migrating data between devices.
- Fix: Add JSON export/import. Consider automated cloud backup.

**No Multi-Device Sync:**
- Problem: Data is locked to single browser/device
- Blocks: Coach using multiple devices. Team assistant access.
- Fix: Add real-time sync via WebSocket or cloud service.

**No Search/Filter in History:**
- Problem: With 50+ sessions, finding a specific date or session type requires scrolling endlessly
- Blocks: Quick data retrieval. Historical analysis.
- Fix: Add date picker, session type filter, player search.

**No Analytics/Stats:**
- Problem: No way to see trends (e.g., player improving over time). No season summaries.
- Blocks: Identifying weak performers. Tracking progress.
- Fix: Add stats dashboard with charts (Chart.js or Recharts).

**No Notes for Session-Level Feedback:**
- Problem: Notes are player-by-player only. Can't add session-level notes (e.g., "weather was cold", "played short game")
- Blocks: Context for decisions.
- Fix: Add session-level notes field.

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: `getPlayerTotal()`, `getPlayerCategoryTotal()`, `recordMark()`, `undoLast()`, `deleteSession()`
- Files: `src/App.jsx` (all logic functions)
- Risk: Any refactoring breaks logic silently. Bug fixes introduce regressions. Calculation errors go unnoticed.
- Priority: High — These are core business logic functions. Marks calculation must be correct.

**No Integration Tests:**
- What's not tested: View transitions (home → tracking → review → history). Session lifecycle (start → record → end → view history).
- Files: `src/App.jsx` (all view logic)
- Risk: Bug in view flow (e.g., endSession doesn't clear activeSession) goes unnoticed. Navigation breaks silently.
- Priority: High — User workflows are critical.

**No Component Tests:**
- What's not tested: Player roster management (add, edit, delete). CSV export formatting. Undo button state.
- Files: `src/App.jsx` (specific view sections)
- Risk: UI interactions fail silently. Special character handling breaks. Buttons don't work.
- Priority: Medium — Most UI bugs are caught during manual testing.

**No E2E Tests:**
- What's not tested: Full user flow from launch to export. Cross-browser compatibility.
- Files: Entire app
- Risk: Mobile browsers render differently. Older React versions have different behavior. Deployment breaks without notice.
- Priority: Medium — Deploy to Vercel but no tests verify deployment works.

---

*Concerns audit: 2026-02-22*
