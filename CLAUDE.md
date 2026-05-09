# JobTrackr

## Docs — Load on demand
Read the relevant doc BEFORE working in that area. Do not load all docs upfront.

| Working on... | Read this |
|---|---|
| Frontend components, routing, state | `docs/frontend.md` + `docs/design-system.md` |
| Vercel Function (`api/`) | `docs/vercel-function.md` |
| Extension (`extension/`) | `extension/README.md` |
| Tests (any layer) | `docs/testing.md` |
| Auth flow, system diagram, cross-cutting | `docs/architecture.md` |
| Roadmap, DB schema, tech stack | `docs/project-overview.md` |

## Commands

- Frontend dev: `cd frontend && npm run dev`
- Frontend tests: `cd frontend && npx vitest`
- Function tests: `npx vitest run api/` (from project root)
- Extension build: `cd extension && npm run build`
- Extension dev: `cd extension && npm run dev`
- DB start: `supabase start`
- DB migration: `supabase migration new <name>`
- DB push: `supabase db push`

## Code Style

- TypeScript: strict mode, interfaces over types for object shapes, named exports
- Function handler: parse → validate → authenticate → execute → respond. Error paths return early.

## Architecture — NON-NEGOTIABLE

**Frontend:**
- Hooks fetch data. Components receive data via props.
- TanStack Query is the server state manager — no Redux, no Zustand.
- Supabase JS client in `src/lib/supabase.ts` — used for auth AND all data access.
- RLS scopes rows to `auth.uid()` — never pass `user_id` explicitly.

**Vercel Function (`api/extract.ts`):**
- Stateless — it ONLY extracts and returns JSON. No DB writes.
- Auth via `supabase.auth.getUser(token)` using the anon key. Service-role key MUST NOT appear here.
- Zod validates the request body before any LLM call.
- Provider swap: change one line in `api/_lib/llm.ts`.

**Browser Extension (`extension/`):**
- MV3, `activeTab` + `storage` + `scripting` permissions only. No broad `host_permissions`.
- Background service worker routes all messages. Popup is purely presentational.
- Session bridge: user clicks "Connect Extension" in the web app sidebar → copies session JSON → pastes once in the popup.
- No `user_id` passed on INSERT — DB DEFAULT `auth.uid()` handles it.

## Workflow

- Run relevant tests after changes (`npx vitest`, not everything unless everything changed)
- Never hardcode config values — use env vars everywhere
- Supabase Auth handles all auth flows. The Vercel Function only VERIFIES JWTs.
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER appear in any file in this repo.

## Docs Maintenance — MANDATORY

After implementing any change that affects the items below, update the corresponding doc file BEFORE committing:

| Change type | File to update |
|---|---|
| Auth flow, system diagram, cross-cutting | `docs/architecture.md` |
| New frontend patterns, state strategy, component structure | `docs/frontend.md` |
| Vercel Function patterns, auth, env vars | `docs/vercel-function.md` |
| Testing strategy, new test patterns, commands | `docs/testing.md` |
| Design tokens, component variants, layout rules | `docs/design-system.md` |
| Sprint roadmap, tech stack changes, DB schema | `docs/project-overview.md` |

If a change doesn't fit any existing doc, ask the user before creating a new one.
