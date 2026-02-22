# Technology Stack

**Analysis Date:** 2026-02-22

## Languages

**Primary:**
- JavaScript (JSX) - Frontend application code in `src/App.jsx` and `src/main.jsx`

**Build/Config:**
- JavaScript - Vite configuration and ESLint configuration files

## Runtime

**Environment:**
- Node.js (version unspecified - no .nvmrc file)

**Package Manager:**
- npm (used for dependency management)
- Lockfile: `package-lock.json` present
- yarn.lock also present (dual lockfile setup)

## Frameworks

**Core:**
- React 19.2.0 - Frontend UI framework for component-based architecture
- Vite 7.3.1 - Build tool and development server with HMR support

**UI/Styling:**
- Inline CSS-in-JS styling - All styles defined as JavaScript objects in `src/App.jsx` (lines 356-420)

**Testing:**
- Not detected - No test framework or test files present

**Build/Dev:**
- @vitejs/plugin-react 5.1.1 - Fast Refresh support for React development

## Key Dependencies

**Critical:**
- react 19.2.0 - UI library for component rendering
- react-dom 19.2.0 - DOM rendering for React

**Development:**
- @types/react 19.2.7 - TypeScript type definitions for React
- @types/react-dom 19.2.3 - TypeScript type definitions for ReactDOM
- eslint 9.39.1 - JavaScript linter
- @eslint/js 9.39.1 - ESLint JavaScript configuration
- eslint-plugin-react-hooks 7.0.1 - ESLint rules for React Hooks compliance
- eslint-plugin-react-refresh 0.4.24 - ESLint rules for React Fast Refresh
- globals 16.5.0 - Global variable definitions for ESLint

## Configuration

**Environment:**
- No .env file detected (client-side only, no secrets required)
- No environment configuration needed - app is fully client-side

**Build:**
- `vite.config.js` - Minimal Vite configuration with React plugin
- `eslint.config.js` - ESLint configuration (flat config format, ECMAScript 2020)
- `package.json` - Project metadata and dependency management
- `index.html` - HTML entry point with root div and module script

**Scripts:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Platform Requirements

**Development:**
- Node.js runtime
- npm or yarn package manager
- No TypeScript compiler needed (JSX transpiled by Vite/Babel)

**Production:**
- Deployment target: Vercel (`.vercel/project.json` present with project configuration)
- Static file hosting sufficient (no backend required)
- Browser support: Modern browsers (ES2020+ JavaScript)

## Browser Support

**Target:**
- Modern browsers with ES2020+ support
- Mobile-optimized UI (viewport meta tag in `index.html`)
- Apple mobile web app capable (meta tags for iOS PWA support)

---

*Stack analysis: 2026-02-22*
