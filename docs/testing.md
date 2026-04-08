# Testing Strategy

## Philosophy
- Test behavior, not implementation
- Integration tests provide the most value per effort
- Don't test library code (supabase-py, axios, React internals)
- Every endpoint: happy path + auth failure + validation error at minimum

## Backend Testing (pytest + httpx)

### Commands
```bash
cd backend
pytest                                    # run all tests
pytest tests/test_api/ -v                 # integration tests only
pytest tests/test_services/ -v            # unit tests only
pytest tests/test_api/test_health.py -v   # single file
pytest -k "test_create_application" -v    # single test by name
```

### Integration Tests (`tests/test_api/`)
Test the full request cycle: HTTP request → router → service → repository → response.

```python
# tests/test_api/test_health.py
from httpx import AsyncClient

async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

Use `conftest.py` fixtures for:
- `client`: httpx AsyncClient with the FastAPI app
- `authenticated_client`: client with valid JWT in headers
- `test_user_id`: a known user ID for test data

### Service Unit Tests (`tests/test_services/`)
Test business logic in isolation with mocked repositories.

```python
# tests/test_services/test_application.py
async def test_create_application_detects_duplicate(
    application_service, mock_repo
):
    mock_repo.get_by_url.return_value = existing_app
    with pytest.raises(DuplicateApplicationError):
        await application_service.create(app_data)
```

### What NOT to Test
- Repository methods (they're thin wrappers over supabase-py)
- Pydantic model validation (Pydantic is already tested)
- FastAPI dependency injection mechanics
- Supabase SDK behavior

## Frontend Testing (Vitest + React Testing Library)

### Commands
```bash
cd frontend
npx vitest              # run all tests
npx vitest --watch      # watch mode
npx vitest --run        # CI mode (no watch)
```

### Component Tests
Test what the user sees and does, not component internals.

```typescript
// __tests__/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../components/StatusBadge'

test('renders the correct status text', () => {
  render(<StatusBadge status="Applied" />)
  expect(screen.getByText('Applied')).toBeInTheDocument()
})
```

### Hook Tests
Test custom hooks with `renderHook`.

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useApplications } from '../hooks/useApplications'

test('fetches applications', async () => {
  const { result } = renderHook(() => useApplications({}), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toHaveLength(3)
})
```

### What NOT to Test
- shadcn/ui components (they're maintained externally)
- TanStack Query caching behavior (TanStack tests this)
- React Router navigation mechanics
- CSS/styling

## E2E Testing
Not in scope for initial sprints. Playwright can be added later for critical flows (login → create application → verify in table).

## Test File Naming
- Backend: `test_<module>.py` in `tests/test_api/` or `tests/test_services/`
- Frontend: `<Component>.test.tsx` or `<hook>.test.ts` next to source files or in `__tests__/`
