# Frontend — Patterns & Conventions

## State Management Strategy

| State Type | Tool | Example |
|------------|------|---------|
| Server data | TanStack Query | Applications list, stats, user profile |
| Auth | React Context | Current user session, login/logout |
| UI | useState | Modal open/close, form inputs, toggles |

### Why No Redux/Zustand
TanStack Query handles server state (fetching, caching, invalidation, optimistic updates). React Context handles the one piece of global client state (auth). Everything else is local to components. Adding a state management library would add complexity with zero benefit for this app.

## TanStack Query Patterns

### Query Keys Convention
```typescript
// Hierarchical keys for smart invalidation
['applications']                    // all applications
['applications', { status, search }] // filtered list
['applications', id]                // single application
['stats']                           // dashboard stats
```

### Custom Hooks
All data fetching happens in custom hooks, never in components directly:

```typescript
// hooks/useApplications.ts
export function useApplications(filters: ApplicationFilters) {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: () => api.getApplications(filters),
  })
}
```

Components call hooks, hooks call API functions, API functions call axios.

### Mutations with Optimistic Updates
```typescript
export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.updateApplication,
    onMutate: async (updated) => {
      // Cancel outgoing queries, snapshot, optimistically update
    },
    onError: (err, updated, context) => {
      // Rollback on error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
```

## Component Organization

```
src/
  components/          # Reusable, generic components
    ui/                # shadcn/ui components (auto-generated)
    ApplicationCard.tsx
    StatusBadge.tsx
    ExcitementStars.tsx
  pages/               # Route-level components (one per route)
    LoginPage.tsx
    DashboardPage.tsx
    ApplicationsPage.tsx
  hooks/               # Custom hooks (data fetching, auth, etc.)
    useApplications.ts
    useAuth.ts
    useStats.ts
  lib/                 # Configuration and utilities
    axios.ts           # Configured axios instance
    queryClient.ts     # TanStack Query client config
    supabase.ts        # Supabase client (auth only)
  types/               # TypeScript interfaces and enums
    application.ts
    auth.ts
    api.ts
```

### Rules
- Pages fetch data (via hooks). Components receive data via props.
- Never import axios directly in components — use the configured instance from `lib/axios.ts`
- Never use `any` type — define interfaces in `types/`
- shadcn/ui components live in `components/ui/` and are NOT modified after generation

## Axios Setup

```typescript
// lib/axios.ts
import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
```

## Auth Flow (Frontend Side)

1. User clicks Login/Register → Supabase JS SDK handles auth
2. Supabase stores session in localStorage automatically
3. axios interceptor reads the token from Supabase session
4. Token is sent as `Authorization: Bearer <token>` on every API call
5. AuthContext provides `user`, `signIn`, `signOut`, `loading` to the app
6. Protected routes redirect to `/login` if no session

## Routing

```typescript
// React Router v6
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedLayout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/applications" element={<ApplicationsPage />} />
  </Route>
</Routes>
```

`ProtectedLayout` checks auth context and redirects to `/login` if not authenticated.
