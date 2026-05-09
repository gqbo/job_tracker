# Frontend — Patterns & Conventions

## State Management

| State Type | Tool | Example |
|---|---|---|
| Server data | TanStack Query | Applications, stats, user profile |
| Auth | React Context | Current user session |
| UI | useState | Modals, toggles, form inputs |

No Redux, no Zustand — TanStack Query covers server state, Context covers auth. Adding a state library would be complexity with zero benefit.

## TanStack Query

Query keys are hierarchical for smart invalidation:
- `['applications']` — all
- `['applications', { status, search }]` — filtered
- `['applications', id]` — single
- `['stats']` — dashboard stats

All data fetching in custom hooks (`hooks/`), never in components directly. Components call hooks → hooks call API functions → API functions call the Supabase JS client directly.

## Component Organization

```
src/
  components/
    ui/                    # shadcn/ui — do not modify after generation
    AuthBrandingPanel.tsx  # Shared left panel for all auth pages
    FieldError.tsx         # AlertCircle icon + message for field errors
    PasswordInput.tsx      # Password input with Eye/EyeOff toggle
    ProtectedLayout.tsx    # Redirects to /login if no Supabase session
  pages/                   # One component per route
  hooks/                   # All data fetching and auth hooks
  lib/
    supabase.ts            # Supabase client — used for auth and all data access
  types/                   # All TypeScript interfaces — never use `any`
  validation/
    schemas/auth.schema.ts # Zod schemas + inferred types
```

Rules:
- Pages use hooks. Components receive data via props.
- Never use `any` — define interfaces in `types/`
- shadcn/ui components in `components/ui/` are NOT modified after generation

## Supabase Client

`lib/supabase.ts` exports a single `supabase` client initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. This client is used for both auth (session, sign-in, sign-out) and all data access (applications, notes). RLS on the Supabase side scopes every query to the authenticated user — no explicit `user_id` filter is needed in frontend code.

`src/api/applications.ts` exposes named functions (`listApplications`, `createApplication`, `getApplication`, `updateApplication`, `deleteApplication`, `listNotes`, `createNote`, `deleteNote`) that call `supabase.from(...)` directly. All throw on Supabase errors. `listApplications` fetches up to 1000 rows ordered by `created_at DESC` — if this limit changes, update this doc.

`VITE_API_URL` is no longer used or required.

## Auth Flow (Frontend)

1. Form submit → Supabase JS SDK handles auth directly
2. Supabase stores JWT in localStorage automatically
3. `AuthContext` listens to `onAuthStateChange`, exposes `user`, `signIn`, `signOut`, `loading`
4. `ProtectedLayout` checks `user` from context — frontend-only, no backend call

## Routing

Uses `createBrowserRouter` + `RouteObject[]` (React Router v7). Defined in `src/routes/routes.tsx`.

- Public: `/login`, `/register` — share `AuthBrandingPanel`, hardcoded to their mode, no toggle state
- Protected: wrapped in `ProtectedLayout`, redirect to `/login` if no session
- `/` redirects to `/dashboard`
- `*` renders `NotFoundPage` (inline in routes.tsx)

## Sprint 2B Patterns

### TanStack Table v8

`createColumns(onUpdate, onOpenNotes, onDelete)` factory pattern — column definitions live outside the component, receive callbacks as args. `useReactTable` lives in the page (`ApplicationsPage`), the resulting `table` instance is passed as a prop to `ApplicationsTable`. This keeps the table component pure: it only renders, never owns state.

### Inline Editing State Machine

```
idle → click → editing → Enter/Blur → save → idle
                       → Escape      → cancel → idle
```

No "saving" state needed — optimistic updates make the UI immediately reflect the change. `InlineEditCell` syncs its draft from props only when NOT editing (prevents clobbering the user's input during an optimistic rollback).

### Optimistic Update Pattern

All mutations in `useApplications.ts` follow: `onMutate` takes a snapshot and applies the change to the cache, `onError` rolls back to the snapshot, `onSettled` invalidates to re-sync. This gives instant UI feedback with automatic recovery.

### Modal State Pattern

Modals that operate on a specific entity use `Application | null` as state — `null` means closed, a value means open on that entity. Boolean modals (like `addModalOpen`) use `useState<boolean>`. Modals render `null` early when closed, and use `createPortal` to mount on `document.body`.

### Toast Notifications

`<Toaster position="top-right" richColors />` mounted once in `main.tsx`. Toasts triggered in mutation callbacks: `toast.success(...)` on `onSuccess`, `toast.error(...)` on `onError`. Never call toasts inside components — always in the handler passed to `mutate`.

### Filter Architecture

Status and modality filters are `useState<string[]>([])` arrays. `columnFilters` for TanStack Table is derived with `useMemo` from these arrays — NOT a separate `useState`. This means `onColumnFiltersChange` is NOT passed to `useReactTable` (filters are controlled externally via the derived value). `FilterDropdown` receives `selected` + `onChange` props and is fully controlled.
