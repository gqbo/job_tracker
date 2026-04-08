# Architecture

## System Overview

```
┌──────────────────┐        ┌──────────────────┐       ┌──────────────┐
│                  │  HTTP   │                  │  SDK  │              │
│   React + Vite   │───────→│   FastAPI         │──────→│   Supabase   │
│   (Frontend)     │←───────│   (Backend)       │←──────│   (DB+Auth)  │
│                  │  JSON   │                  │       │              │
└────────┬─────────┘        └──────────────────┘       └──────┬───────┘
         │                                                     │
         │              Supabase Auth SDK                      │
         └─────────────────────────────────────────────────────┘
                    (signup, signin, OAuth, session)
```

The frontend talks to TWO systems:
1. **Supabase Auth SDK** — directly for authentication (signup, signin, OAuth, session management)
2. **FastAPI Backend** — for all application data (CRUD, stats, extraction)

The backend talks to ONE system:
1. **Supabase** — via supabase-py for database operations and JWT verification

## Auth Flow

```
┌──────────┐    1. signup/signin     ┌──────────────┐
│ Frontend │ ──────────────────────→ │ Supabase Auth│
│          │ ←────────────────────── │              │
│          │    2. JWT token          └──────────────┘
│          │
│          │    3. API call + JWT     ┌──────────────┐
│          │ ──────────────────────→ │ FastAPI       │
│          │                         │              │
│          │                         │ 4. Verify JWT│
│          │                         │    (PyJWT)   │
│          │                         │              │
│          │    5. Response           │ 5. Process   │
│          │ ←────────────────────── │    request   │
└──────────┘                         └──────────────┘
```

Key points:
- Backend NEVER issues tokens — Supabase Auth does
- Backend NEVER handles passwords — Supabase Auth does
- Backend ONLY verifies JWTs and extracts user_id from claims
- Frontend stores session via Supabase SDK (localStorage)

## Backend Layered Architecture

```
┌─────────────────────────────────────────────┐
│                  Routers                     │  app/api/
│  Parse request → call service → return JSON  │
└──────────────────┬──────────────────────────┘
                   │ Pydantic models
┌──────────────────▼──────────────────────────┐
│                 Services                     │  app/services/
│  Business logic, validation, orchestration   │
└──────────────────┬──────────────────────────┘
                   │ Pydantic models
┌──────────────────▼──────────────────────────┐
│              Repositories                    │  app/repositories/
│  supabase-py calls, data mapping             │
└──────────────────┬──────────────────────────┘
                   │ supabase-py SDK
┌──────────────────▼──────────────────────────┐
│            Supabase (PostgreSQL)             │
└─────────────────────────────────────────────┘
```

Data flows DOWN as Pydantic models. Repositories translate between Supabase responses and Pydantic models. Services never see raw database responses.

## Frontend Data Flow

```
Page (useApplications hook)
  → TanStack Query (cache, dedup, retry)
    → axios instance (auth header injection)
      → FastAPI endpoint
        → response
      ← JSON
    ← cached data
  ← { data, isLoading, error }
→ render components with data
```

## AI Extraction Flow (Sprint 3)

```
User pastes URL
  → POST /applications/extract-from-url
    → httpx fetches page HTML
      → BeautifulSoup parses HTML
        → Enough content? 
          YES → LLM extracts structured data
          NO  → Return partial/empty → frontend asks user to paste text
    → Pydantic validates LLM output
      → Valid? Pre-fill form
      → Invalid? Fallback to manual entry
```

## Database Migrations

```bash
supabase migration new create_applications_table   # creates SQL file
# Edit the migration SQL
supabase db push                                    # applies to local DB
```

Migrations live in `supabase/migrations/` and are versioned in git. Every schema change goes through a migration — never modify the database manually.
