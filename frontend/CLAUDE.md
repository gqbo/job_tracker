# Frontend — React + TypeScript + Vite

@../docs/frontend.md

## Commands
- Dev: `npm run dev`
- Test: `npx vitest`
- Test watch: `npx vitest --watch`
- Build: `npm run build`

## Rules
- TanStack Query is the server state manager — NO Redux, NO Zustand
- Local UI state: useState. Auth state: React Context. Server data: TanStack Query.
- All API types in `src/types/` — never use `any`
- Components receive data via props, hooks fetch data
- Supabase client in `src/lib/supabase.ts` — used for auth AND all data access (no axios, no VITE_API_URL)

## Testing
- Vitest + React Testing Library
- Test user interaction, not implementation details
- Use `renderHook` for custom hook tests
- Mock API calls at the `@/api/applications` module level
