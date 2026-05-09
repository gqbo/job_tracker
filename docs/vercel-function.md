# Vercel Function — `api/extract.ts`

## Overview

`POST /api/extract` is a stateless Vercel Function (Node.js 20) that accepts cleaned job-posting HTML and returns structured job data extracted by an LLM. It does not write to the database — the caller (browser extension) handles the Supabase INSERT.

## Auth Flow

```
Extension → POST /api/extract
  Authorization: Bearer <JWT>
  Body: { html: string, url: string }

Handler:
  1. Extract Bearer token from Authorization header → missing → 401
  2. supabase.auth.getUser(token) using anon key → invalid → 401
  3. Zod-validate body → failure → 400
  4. generateObject(model, schema, prompt) → 200 with { data: ExtractedJob }
  5. LLM error → 502
```

The function uses the **anon key**, not the service role key. JWT verification is delegated to Supabase's `getUser()` API — no key derivation or PyJWT needed.

## Zod Schema — `api/_lib/schema.ts`

```ts
const ExtractedJobSchema = z.object({
  company:  z.string().nullable(),
  role:     z.string().nullable(),
  modality: z.enum(['remote', 'hybrid', 'on_site']).nullable(),
  location: z.string().nullable(),
  salary:   z.string().nullable(),
  source:   z.string().nullable(),
})
```

`status` is intentionally absent — the extension defaults to `'bookmarked'` on INSERT.

## LLM Provider Swap — `api/_lib/llm.ts`

```ts
import { groq } from '@ai-sdk/groq'
export const extractionModel = groq('llama-3.3-70b-versatile')
```

To swap providers: change this one export. All other code remains unchanged. Commented imports for Google, Anthropic, and OpenAI are in the file for reference.

## Environment Variables

| Var | Where | Purpose |
|-----|-------|---------|
| `SUPABASE_URL` | Vercel project env | Supabase project URL (public) |
| `SUPABASE_ANON_KEY` | Vercel project env | Anon key — used for `getUser()` |
| `GROQ_API_KEY` | Vercel project env | LLM provider — NEVER exposed to client |

`SUPABASE_SERVICE_ROLE_KEY` is NOT present anywhere. The function uses `getUser()` with the anon key.

## Constraints

- **10-second max duration** (Vercel Hobby limit). LLM calls target p95 < 8s.
- **Stateless** — no DB writes. The extension performs the Supabase INSERT after user review.
- **No retry/backoff** — personal tool; Groq free-tier rate limits are acceptable for low-frequency personal use.

## Testing

Unit tests live in `api/__tests__/extract.test.ts`. Run with:

```bash
# From project root (after npm install)
npx vitest run api/
```

Tests mock `generateObject` and `createServerClient` — no real LLM or Supabase calls needed.

## File Layout

```
api/
  extract.ts          # POST /api/extract handler
  _lib/
    schema.ts         # Zod schema for ExtractedJob + RequestBody
    llm.ts            # AI SDK model (groq by default)
    supabase.ts       # Server-side Supabase client factory
  __tests__/
    extract.test.ts   # Unit tests
  vitest.config.ts
  tsconfig.json
```
