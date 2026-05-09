# Architecture

## System Diagram

```
                       ┌────────────────────────┐
                       │  Supabase (Auth + DB)  │
                       │  RLS = authorization   │
                       └───────▲────────▲───────┘
                               │        │
   (a) Auth + (c,d) CRUD       │        │ (b3) INSERT row
   (anon key + JWT)            │        │ (anon key + JWT)
                               │        │
       ┌───────────────────────┴──┐  ┌──┴──────────────────────────┐
       │   React Web App (Vite)   │  │  Browser Extension (MV3)    │
       │   frontend/              │  │  extension/                 │
       │   - Login (Supabase)     │  │  - popup, content, bg sw    │
       │   - List/Edit/Delete     │  │  - reads active tab DOM     │
       │   - Manual Add Form (c)  │  │  - posts cleaned HTML+URL   │
       └──────────────────────────┘  └──┬──────────────────────────┘
                                        │ (b1) POST /api/extract
                                        │      Authorization: Bearer <JWT>
                                        │      Body: { html, url }
                                        ▼
                            ┌──────────────────────────┐
                            │  Vercel Function         │
                            │  api/extract.ts (Node)   │
                            │  1. Verify JWT (getUser) │
                            │  2. Zod-validate body    │
                            │  3. AI SDK generateObject│──── Groq (Llama 3.3 70B)
                            │  4. Return { data: job } │     GROQ_API_KEY (server only)
                            └──────────────────────────┘
                                        │ (b2) { data: ExtractedJob }
                                        ▼
                                  back to Extension
```

**No FastAPI layer.** The backend has been removed entirely.

### Flows

- **(a) Auth**: React app uses Supabase JS SDK directly. Session (JWT) stored in browser localStorage by Supabase.
- **(b) Extension capture**: popup → content script (reads + cleans DOM) → POST `/api/extract` with Bearer JWT → JSON → user reviews editable form → `supabase.from('applications').insert(...)`.
- **(c) Manual add**: form in web app → `supabase.from('applications').insert(...)`. No LLM, no function call.
- **(d) View/Edit/Delete**: web app calls Supabase JS client; RLS scopes all rows to `auth.uid()`.

## Auth Flow

```
User → Supabase Auth (email/password or OAuth) → JWT stored in browser
React App → reads JWT from session → passes to Supabase client for all CRUD
Extension → receives JWT via "Connect Extension" clipboard bridge → stores in chrome.storage.local
Extension → sends JWT as Bearer token to /api/extract
Vercel Function → calls supabase.auth.getUser(token) to validate JWT
```

- No backend issues tokens. Supabase Auth handles all auth flows.
- The Vercel Function uses the **anon key** + `getUser()` — NOT the service role key.
- `SUPABASE_SERVICE_ROLE_KEY` must never appear anywhere in this codebase.

## Frontend Data Flow

```
Page → custom hook → TanStack Query → Supabase JS client (+ JWT via session) → Supabase DB
```

RLS on the Supabase side scopes every query to `auth.uid()` — no explicit `user_id` filter needed in frontend code.

## Extension Auth Bridge

Extension auth uses the user's existing Supabase session (Option A — clipboard bridge):

1. Web app has a "Connect Extension" button in the sidebar (bottom, user section).
2. On click: `supabase.auth.getSession()` → copies `{ access_token, refresh_token, expires_at }` JSON to clipboard.
3. User opens extension popup once → pastes JSON → extension calls `chrome.storage.local.set({ supabaseSession })` and `supabase.auth.setSession()`.
4. Supabase JS client auto-refreshes the token via the stored refresh token.
5. If session expires/revokes: popup shows "Reconnect extension via web app" and disables Extract.

No `host_permissions` needed. No separate OAuth flow. The extension reuses the exact same session the web app has.

## Database Migrations

```bash
supabase migration new <name>   # create SQL file in supabase/migrations/
supabase db push                # apply to remote DB
supabase start                  # start local Supabase
```

Never modify the database manually — always go through migrations.

## RLS Policy Design

Every table enforces row-level security scoped to `auth.uid()`:

- `applications`: SELECT/UPDATE/DELETE check `user_id = auth.uid()`. INSERT check `auth.uid() = user_id`. DEFAULT on `user_id` is `auth.uid()`.
- `application_notes`: INSERT requires that the target `application_id` belongs to the authenticated user (EXISTS subquery). Other policies match `applications` pattern. DEFAULT on `user_id` is `auth.uid()`.

Clients NEVER pass `user_id` explicitly — the DB DEFAULT handles it (REQ-INV-003).

## Deployment

- **Frontend + Function**: deployed to Vercel. `vercel.json` at project root configures build, output, function runtime, and SPA rewrites.
- **Extension**: sideloaded locally in Chrome (not deployed by Vercel). See `extension/README.md`.
- **Database**: Supabase hosted project (free tier).

> **Personal use only.** Commercial deployment requires a Vercel Hobby → Pro upgrade (for team members and increased limits). Groq free tier is used for LLM extraction; rate limits are acceptable for personal low-frequency use. No retry/backoff is implemented.
