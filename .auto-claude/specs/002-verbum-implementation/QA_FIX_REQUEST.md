# QA Fix Request

**Status**: REJECTED
**Date**: 2026-04-02
**QA Session**: 1

## Critical Issues to Fix

### 1. Missing barrel export index files for all UI components
**Problem**: UI components in `frontend/src/components/ui/*/` are imported as barrel imports (e.g., `./ui/accordion`) but no `index.ts` files exist. Both `vite build` and `tsc --noEmit` fail.
**Location**: All 17 folders under `frontend/src/components/ui/`: accordion, badge, button, card, input, label, progress, scroll-area, select, separator, slider, sonner, table, tabs, textarea, toggle-group, toggle, tooltip
**Required Fix**: Add `index.ts` to each folder that re-exports from the component file. Example for `accordion/index.ts`:
```ts
export * from './Accordion';
```
Also check `utils.ts` — it's at `ui/utils.ts` (not in a subfolder), verify it's imported correctly.
**Verification**: `npx vite build` succeeds

### 2. Missing Vite client type declarations
**Problem**: `import.meta.env` causes TS errors in `api.ts`, `streaming.ts`, `useSchedule.ts`
**Location**: `frontend/src/`
**Required Fix**: Create `frontend/src/vite-env.d.ts` containing:
```ts
/// <reference types="vite/client" />
```
**Verification**: `npx tsc --noEmit` reports no `import.meta.env` errors

### 3. TypeScript strict mode violations
**Problem**: Implicit `any` types and unused imports
**Location**: 
- `frontend/src/pages/ContentListPage.tsx:89,108` — `value` param needs `string` type
- `frontend/src/hooks/useGeneration.ts:3` — unused `ContentType` import
**Required Fix**: Add types, remove unused import
**Verification**: `npx tsc --noEmit` passes with 0 errors

## After Fixes

Once fixes are complete:
1. Verify `npx vite build` succeeds
2. Verify `npx tsc --noEmit` passes
3. Commit with message: "fix: add UI component barrel exports and fix TypeScript errors (qa-requested)"
4. QA will automatically re-run
