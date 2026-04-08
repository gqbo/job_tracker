<div align="center">

# JobTrackr

**AI-powered job application tracker with smart extraction, table views, and Kanban boards**

[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-087EA4?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

## What is JobTrackr?

JobTrackr is a fullstack web application that helps you track and manage your job applications in one place. Paste a job posting URL, and AI extracts the key details automatically — company, role, salary, tech stack, and more. Organize everything in a sortable table or a drag-and-drop Kanban board.

## Features

**AI-Powered Extraction**
- Paste a job posting URL and let AI extract structured data automatically
- Dual extraction: URL scraping for static sites, text paste fallback for SPAs (LinkedIn, etc.)
- Configurable LLM model via environment variable — defaults to Gemini Flash (free tier)
- Graceful fallback to manual entry when extraction fails

**Application Management**
- Full CRUD with duplicate detection by URL
- Inline editing of status, excitement rating, dates, and notes
- Global search and filtering by status
- Track applications through 9 stages: Bookmarked → Applying → Applied → Interviewing → Technical Test → Negotiating → Accepted → Rejected → Ghosted

**Dual Views**
- **Table view** — TanStack Table with sorting, filtering, column visibility, and inline editing
- **Kanban view** — drag-and-drop cards between status columns with optimistic updates
- View preference persisted in localStorage

**Dashboard & Analytics**
- Summary cards with total applications, response rate, and status breakdown
- Weekly application trends (bar chart)
- Status distribution (pie chart)
- Recent applications list

**Authentication**
- Email/password and Google OAuth via Supabase Auth
- JWT-verified protected endpoints
- Per-user data isolation

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12+ · FastAPI · Pydantic v2 · supabase-py · PyJWT · LiteLLM · httpx · BeautifulSoup4 |
| **Frontend** | React 18 · TypeScript · Vite · TanStack Query v5 · TanStack Table v8 · dnd-kit · Tailwind CSS · shadcn/ui · Recharts · axios |
| **Database** | Supabase (PostgreSQL) · Supabase Auth |
| **Testing** | pytest · httpx · Vitest · React Testing Library |

## Getting Started

**Requirements:** Python 3.12+, Node.js 18+, [Supabase CLI](https://supabase.com/docs/guides/cli)

### Database

```sh
supabase start
```

### Backend

```sh
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env  # fill in your values
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```sh
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
jobtrackr/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers by feature
│   │   ├── core/           # Config, middleware, exceptions
│   │   ├── models/         # Pydantic schemas (request/response)
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access via supabase-py
│   │   └── llm/            # LiteLLM service, scraper, prompts
│   └── tests/
│       ├── test_api/       # Integration tests
│       └── test_services/  # Unit tests
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-level pages
│       ├── hooks/          # Custom hooks (useApplications, useAuth)
│       ├── lib/            # axios instance, queryClient, supabase client
│       └── types/          # TypeScript interfaces and enums
├── supabase/
│   └── migrations/         # SQL migration files
├── docs/                   # Architecture and convention docs
└── .env.example
```

## Architecture

**Backend** follows a layered architecture: Routers → Services → Repositories. Each layer has a single responsibility — routers handle HTTP, services contain business logic, repositories manage data access.

**Frontend** uses TanStack Query as the server state manager. No global state library — auth state lives in React Context, UI state in useState, and all server data flows through TanStack Query with caching and optimistic updates.

For detailed architecture docs, see the [`docs/`](./docs/) directory.

## Contributing

1. **Fork** the repository
2. **Create a branch** for your feature or fix:
   ```sh
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** and run tests:
   ```sh
   cd backend && pytest
   cd frontend && npx vitest
   ```
4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```sh
   git commit -m "feat: add salary range filter"
   ```
5. **Open a Pull Request** with a clear description

## Contributors

<a href="https://github.com/gqbo">
  <img src="https://github.com/gqbo.png" width="80" height="80" style="border-radius:50%" alt="gqbo" />
</a>
