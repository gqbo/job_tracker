# Testing Strategy

## Philosophy

- Test behavior, not implementation
- Integration tests provide the most value per effort
- Don't test library code (Supabase JS, React internals)
- Every function/component: happy path + auth failure + validation error at minimum

## Commands

```bash
# Frontend (from frontend/)
npx vitest          # watch mode
npx vitest --run    # CI mode

# Vercel Function unit tests (from project root)
npx vitest run api/

# Extension lib unit tests (from extension/)
npx vitest run
```

## Frontend

**Component tests:** test what the user sees and does — use `render` + `screen` queries. Not implementation details.

**Hook tests:** use `renderHook` from React Testing Library.

**What NOT to test:** shadcn/ui components, TanStack Query caching, React Router navigation, CSS/styling, Supabase SDK behavior.

Mock at the `@/api/applications` module boundary — don't mock individual Supabase calls.

## Vercel Function (`api/`)

Unit tests live in `api/__tests__/`. They mock:
- `ai` → `generateObject` (returns fixed Zod-valid object)
- `../\_lib/supabase` → `createServerClient` (returns mock with `auth.getUser`)
- `../\_lib/llm` → `extractionModel` (string stub)

Coverage targets:
- 405 for non-POST
- 401 for missing/invalid token
- 400 for missing/empty html, invalid url
- 200 with correct schema shape
- 502 on LLM throw
- No `supabase.from()` call in any path (stateless assertion)

## Browser Extension (`extension/`)

**Unit tests** (`extension/src/lib/__tests__/`): pure functions only. `clean-html.test.ts` covers all four strip operations + truncation + LinkedIn-style combined scenario.

**Manual E2E** (required before Slice 3 PR): load sideloaded extension in Chrome and verify end-to-end on:
- LinkedIn job posting
- Indeed job posting
- Greenhouse-hosted board
- Lever-hosted board

Screenshot each result. All 4 must pass before the PR is merged.

## E2E (Web App)

Not currently automated. Can add Playwright for critical flows in a future sprint.

## File Naming

- Frontend: `<Component>.test.tsx` or `<hook>.test.ts` — next to source or in `__tests__/`
- Function: `__tests__/extract.test.ts`
- Extension: `src/lib/__tests__/<file>.test.ts`
