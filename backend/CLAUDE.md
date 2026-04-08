# Backend — FastAPI + Python

@../docs/backend.md

## Commands
- Run: `uvicorn app.main:app --reload`
- Test: `pytest`
- Test single: `pytest tests/test_api/test_health.py -v`
- Install deps: `pip install -r requirements.txt`

## Rules
- NEVER put business logic in routers — routers are thin controllers
- ALL Pydantic models go in `app/models/` — never define schemas inline in routers
- Repositories return Pydantic models, not raw dicts or Supabase responses
- Use `raise HTTPException` only in routers — services raise domain exceptions
- Async functions for all I/O operations (Supabase calls, HTTP requests)
- Structured logging with `logging` module, never `print()`
- Settings loaded from `app/core/config.py` via pydantic-settings

## Testing
- Integration tests in `tests/test_api/` — use httpx AsyncClient
- Service unit tests in `tests/test_services/` — mock repositories
- Do NOT test repositories directly (thin wrappers over supabase-py)
- Every endpoint needs at least: happy path + auth failure + validation error tests
