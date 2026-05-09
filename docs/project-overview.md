# JobTrackr — Project Overview

## What It Is

Personal job application tracker. Use the browser extension to save job postings with one click — AI extracts structured data automatically. Or add jobs manually via the web app. Organize everything in a table or Kanban view.

## Goals

- Learn React with TanStack Query and modern patterns
- Explore serverless architecture (Vercel Functions + AI SDK)
- Apply integration + unit testing strategies
- Build a genuinely useful personal tool

## Tech Stack

**Frontend:** React 19, Vite, TypeScript (strict), Tailwind CSS, shadcn/ui, TanStack Query v5, TanStack Table v8, React Router v7, Vitest, Zod, React Hook Form, lucide-react, sonner

**Vercel Function:** Node.js 20, TypeScript, Vercel AI SDK (`ai`), Groq (`@ai-sdk/groq`, Llama 3.3 70B), Zod, `@supabase/supabase-js`

**Browser Extension:** Manifest V3, React + Vite + crxjs/vite-plugin, `@supabase/supabase-js`, TypeScript

**Infra:** Supabase (PostgreSQL + Auth), Vercel (frontend + serverless function), Groq (LLM — free tier)

**Testing:** Vitest, React Testing Library

## Infrastructure Cost

**$0/month** — all services on free/hobby tiers:
- Vercel Hobby: free (frontend + 1 serverless function)
- Supabase free tier: free (DB + Auth)
- Groq free tier: free (LLM extraction)

> **Personal use only.** Commercial deployment requires Vercel Hobby → Pro upgrade. Groq free-tier rate limits (~30 req/min) are acceptable for personal low-frequency use — no retry/backoff implemented.

## Sprint Roadmap

| Sprint | Focus | Key Deliverable |
|--------|-------|-----------------|
| 1A | Project setup | Monorepo, health check, config |
| 1B | Auth (email) | Email/password auth end-to-end ✅ |
| 1C | Auth (Google) | Google OAuth via Supabase |
| 2 | CRUD + Table | Application CRUD, TanStack Table ✅ |
| 3 | Vercel Migration | Remove FastAPI, add Vercel Function + Browser Extension ✅ |
| 4 | Kanban | dnd-kit drag-and-drop board |
| 5 | Dashboard | Stats + Recharts |

## Database Schema

**`auth.users`** — managed by Supabase Auth (id, email, created_at)

**`applications`** — core entity: url, company, role, location, salary, modality, source, status, created_at, updated_at. `user_id` DEFAULT `auth.uid()`.

**`application_notes`** — notes per application: content, application_id, user_id. INSERT policy verifies application ownership.

**Status Enum:** bookmarked → applied → interviewing → accepted → rejected → ghosted

**Modality Enum:** remote | hybrid | on_site

See `.env.example` for required environment variables.

## Environment Variables

| Var | Layer | Purpose |
|-----|-------|---------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anon key |
| `SUPABASE_URL` | Vercel Function | Supabase project URL (server-side) |
| `SUPABASE_ANON_KEY` | Vercel Function | Supabase anon key (server-side) |
| `GROQ_API_KEY` | Vercel Function | Groq API key — NEVER exposed to client |

`SUPABASE_SERVICE_ROLE_KEY` is NOT used anywhere in this project.
