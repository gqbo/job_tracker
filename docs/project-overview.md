# JobTrackr — Project Overview

## What It Is
Fullstack web application for tracking job applications. The user pastes a job posting URL, AI extracts structured data automatically, and saves it to a personal dashboard with table and Kanban views.

## Goals
- Learn Python and FastAPI with best practices
- Learn React with TanStack Query, modern patterns
- Apply layered architecture principles
- Understand testing strategies (integration + unit)
- Build a genuinely useful tool

## Tech Stack

### Backend
- Python 3.12+
- FastAPI (latest)
- Layered Architecture: routers → services → repositories
- Supabase (PostgreSQL) for database + auth
- supabase-py SDK for data access
- PyJWT for JWT verification in middleware
- pydantic-settings for configuration
- Pydantic v2 for request/response validation
- LiteLLM for LLM abstraction (model configurable via env)
- httpx for async HTTP requests (scraping)
- BeautifulSoup4 for HTML parsing
- slowapi for rate limiting
- pytest + httpx for testing

### Frontend
- React 18 + Vite + TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- TanStack Table v8 (sorting, filtering, inline editing)
- TanStack Query v5 (server state, caching, optimistic updates)
- dnd-kit for Kanban drag and drop
- React Router v6
- Recharts for dashboard charts
- axios for HTTP calls to backend
- Vitest + React Testing Library for testing

### State Management (Frontend)
- Server state: TanStack Query (applications, stats, any data from API)
- Auth state: React Context (user session from Supabase)
- UI state: useState (modals, toggles, form inputs)
- NO Redux, NO Zustand — not needed for this scope

### Infrastructure
- Supabase CLI for local development (`supabase start`)
- uvicorn for backend dev server
- Vite for frontend dev server
- Docker for production-like environments only (not for daily dev)

## Sprint Roadmap

| Sprint | Focus | Key Deliverable |
|--------|-------|-----------------|
| 1A | Project setup | Monorepo structure, health check, config |
| 1B | Auth (email) | Email/password auth end-to-end |
| 1C | Auth (Google) | Google OAuth via Supabase config |
| 2 | CRUD + Table | Application CRUD, TanStack Table with inline editing |
| 3 | AI Extraction | URL scraping + LLM extraction + text paste fallback |
| 4 | Kanban | dnd-kit Kanban board with drag-and-drop status changes |
| 5 | Dashboard | Stats endpoint + Recharts dashboard |
| 6 | Google Sheets | OAuth2 account linking + Sheets export (optional) |

## Database Schema

### Supabase Auth (automatic)
- `auth.users`: id, email, created_at — managed 100% by Supabase

### user_settings
- user_id (FK → auth.users), ai_extractions_today, ai_extractions_reset_at
- daily_ai_limit (default 50), google_access_token, google_refresh_token
- created_at, updated_at

### applications
- id (uuid), user_id (FK), url, company, role, location
- salary_min, salary_max, tech_stack (text[]), is_remote
- status (enum), excitement (1-5), date_saved, date_applied
- deadline, follow_up_date, notes, source
- created_at, updated_at

### Status Enum
Bookmarked → Applying → Applied → Interviewing → Technical Test → Negotiating → Accepted → Rejected → Ghosted

## Environment Variables
See `.env.example` at project root for complete list with descriptions.
