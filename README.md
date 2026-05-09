<div align="center">

# JobTrackr

**AI-powered job application tracker — browser extension + web dashboard**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-087EA4?style=for-the-badge&logo=react)](https://react.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Functions-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

## What is JobTrackr?

JobTrackr is a personal job application tracker. Install the browser extension, click it on any job posting, and AI extracts the key details automatically — company, role, salary, modality, and more. Or add jobs manually via the web app. Organize everything in a sortable table or Kanban board.

**Infrastructure cost: $0/month** (Vercel Hobby + Supabase free tier + Groq free tier).

## Features

**Browser Extension (MV3)**
- One-click extraction from any job posting (LinkedIn, Indeed, Greenhouse, Lever, etc.)
- AI extracts: company, role, modality, location, salary, source
- Review and edit before saving
- No broad permissions — `activeTab` only

**Web Dashboard**
- Full CRUD with inline editing
- Table and Kanban views
- Manual add form with all fields
- "Connect Extension" button to link your session in one click

**AI Extraction**
- Vercel Function (Node.js 20) calls Groq (Llama 3.3 70B) via Vercel AI SDK
- Stateless — function extracts only, extension handles the Supabase INSERT
- Provider-swappable: change one line in `api/_lib/llm.ts`

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite · TanStack Query v5 · Tailwind CSS · shadcn/ui |
| **Vercel Function** | Node.js 20 · TypeScript · AI SDK · Groq (Llama 3.3 70B) · Zod |
| **Browser Extension** | MV3 · React · Vite · crxjs/vite-plugin · Supabase JS |
| **Database** | Supabase (PostgreSQL + Auth + RLS) |
| **Testing** | Vitest · React Testing Library |

## Getting Started

**Requirements:** Node.js 18+, [Supabase CLI](https://supabase.com/docs/guides/cli), a [Groq API key](https://console.groq.com/) (free)

### Database

```sh
supabase start
supabase db push
```

### Frontend

```sh
cd frontend
npm install
# Create frontend/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Vercel Function (local dev)

```sh
# Install Vercel CLI: npm i -g vercel
# Create .env.local at root with SUPABASE_URL, SUPABASE_ANON_KEY, GROQ_API_KEY
vercel dev
```

### Browser Extension

```sh
cd extension
npm install
# Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL as env vars
npm run build
# Load extension/dist/ in Chrome via chrome://extensions → Load unpacked
```

See `extension/README.md` for detailed sideload + connect instructions.

## Project Structure

```
job_tracker/
├── api/
│   ├── extract.ts          # POST /api/extract — LLM extraction
│   ├── _lib/
│   │   ├── schema.ts       # Zod schema for ExtractedJob
│   │   ├── llm.ts          # AI SDK provider (swap in one line)
│   │   └── supabase.ts     # Server-side Supabase client
│   └── __tests__/
│       └── extract.test.ts # Unit tests (mocked LLM + Supabase)
├── extension/
│   ├── manifest.json       # MV3, activeTab only
│   ├── src/
│   │   ├── popup.tsx       # React popup UI (state machine)
│   │   ├── background.ts   # Service worker: message router
│   │   ├── content.ts      # Injected: reads + cleans DOM
│   │   └── lib/
│   │       ├── clean-html.ts   # Pure: strip scripts/styles/comments/data-uris
│   │       └── supabase.ts     # Extension Supabase client (chrome.storage)
│   └── README.md           # Build + sideload instructions
├── frontend/               # React web app
│   └── src/
│       ├── api/
│       │   └── applications.ts # Supabase JS client calls
│       ├── components/
│       │   └── ConnectExtensionButton.tsx  # Copies session to clipboard
│       ├── hooks/
│       │   └── useApplications.ts
│       └── lib/
│           └── supabase.ts     # Supabase client (anon key + JWT)
├── supabase/
│   └── migrations/         # SQL migration files
├── docs/                   # Architecture and convention docs
├── vercel.json             # Vercel deployment config
└── package.json            # Workspace root (frontend, extension)
```

## Architecture

See `docs/architecture.md` for the full system diagram. In short:

- **Extension** reads DOM → cleans HTML → calls Vercel Function with JWT → user reviews → Supabase INSERT
- **Web app** talks directly to Supabase (no intermediary layer)
- **RLS** on Supabase scopes all rows to `auth.uid()` — no `user_id` needed in client code

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make changes and run tests: `cd frontend && npx vitest`
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
5. Open a Pull Request

## Contributors

<a href="https://github.com/gqbo">
  <img src="https://github.com/gqbo.png" width="80" height="80" style="border-radius:50%" alt="gqbo" />
</a>
