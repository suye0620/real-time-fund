# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Static export to out/
npm run server           # Start Express server (static files + API)
npm run lint             # ESLint (also runs on pre-commit via husky + lint-staged)
npm run lint:fix         # ESLint auto-fix
jigubao <command>        # CLI tool (direct command via npm link)

# CLI usage (all output is JSON on stdout, for AI agent consumption)
jigubao help       # Detailed help (AI agent reference)
jigubao today      # Quick snapshot: market value, day P&L, confirmed earnings
jigubao list       # List all storage keys
jigubao get <key>  # Get a specific key
jigubao export     # Export all data as JSON
jigubao funds      # List all funds with holdings
jigubao summary    # Portfolio summary with profit/loss
```

## Architecture

**Static SPA + Express API sidecar.** Next.js 16 App Router with `output: 'export'` builds static files to `out/`. An Express server (`server/index.js`) serves both the static files and a REST API backed by SQLite. All financial data fetching bypasses CORS via JSONP/`<script>` injection, hitting Chinese financial APIs (天天基金, 东方财富, 腾讯财经).

**Entry points:**
- `app/layout.jsx` — Root layout: theme init, PWA, Google Analytics, React Query provider, Toaster
- `app/page.jsx` — Monolithic SPA (~7400 lines): all UI state, business logic, fund CRUD, holding P&L, import/export, OCR
- `app/api/fund.js` — External data fetching via JSONP/script injection
- `app/components/ModalsLayer.jsx` — All modal rendering extracted from page.jsx
- `server/index.js` — Express: static file serving + `/api/state` REST API + SPA fallback
- `server/db.js` — SQLite key-value store (`data/state.db`)
- `cli/jigubao.mjs` — Read-only CLI for OpenClaw integration

**Data flow:**
```
Page load → useApiSync fetches GET /api/state → primes localStorage → init* reads → UI renders
User action → storageStore.setItem → onSync callback → 2s debounce → PUT /api/state/:key → SQLite
CLI → reads SQLite directly (readonly) → JSON output
```

**Data is stored server-side in SQLite.** localStorage is a local cache, synced to/from the API. This means data persists across browsers/devices — they all hit the same SQLite database on the server.

**State management:**
- **Zustand** (`app/stores/`): `storageStore` (localStorage + API sync), `modalStore` (modal state), `userStore` (stub)
- **TanStack React Query** (`app/lib/get-query-client.js`): cache layer for external API calls
- **useApiSync** (`app/hooks/useApiSync.js`): on mount pulls data from API, on write pushes to API (2s debounce)

**Dual responsive layout:** `PcFundTable` and `MobileFundTable` switch at 640px breakpoint.

**No test infrastructure** — zero tests, no test framework. ESLint is the only automated check.

**No Docker, no Supabase** — self-hosted single-user deployment. Run `npm run build && npm run server`.

## Key Conventions

- **JavaScript only** — no TypeScript. `jsconfig.json` (not `tsconfig.json`).
- **All localStorage through storageStore** — never use `window.localStorage` directly for business data. This ensures state synchronization and API sync triggering.
- **Modal pattern** — modal open/close state in `modalStore` (Zustand). All modals render in `ModalsLayer.jsx`. Pass page-level callbacks via `modalCbRef` (`useRef({})`). Low-frequency modals use `dynamic(() => import(...), { ssr: false })`.
- **Lodash for type checks** — prefer `_.isArray`, `_.isObject`, `_.isString`, `_.isNumber`, `_.isNil`, `_.isEqual` over native equivalents.
- **React Compiler enabled** — `reactCompiler: true` in next.config.js (auto-memoization).
- **Unit convention (px/rem)** — PC (`> 640px`) uses `px` (auto-converted to `rem` by postcss-pxtorem). Inside `@media (max-width: 640px)`, `px` is preserved. Use `PX` to prevent conversion.
- **shadcn/ui** — new-york style, JSX, Lucide icons, `cn()` from `@/lib/utils`.

## Storage Keys

Data stored in SQLite `state` table (key-value): funds, favorites, groups, collapsedCodes, collapsedTrends, collapsedEarnings, refreshMs, holdings, groupHoldings, pendingTrades, transactions, dcaPlans, customSettings, fundDailyEarnings, tags.

## Notes

- Fund codes are 6-digit strings (e.g., `110022`).
- All user-facing text is Chinese (zh-CN).
- Node >= 20.9.0 required.
- License: AGPL-3.0.
- See `AGENTS.md` for an exhaustive file-level index and anti-patterns catalog.
