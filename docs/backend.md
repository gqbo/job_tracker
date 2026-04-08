# Backend — Architecture & Patterns

## Layered Architecture

```
HTTP Request
    ↓
┌─────────┐
│ Routers │  app/api/       — Receive request, validate, call service, return response
└────┬────┘
     ↓
┌──────────┐
│ Services │  app/services/  — ALL business logic lives here
└────┬─────┘
     ↓
┌──────────────┐
│ Repositories │  app/repositories/  — ONLY layer that talks to Supabase
└──────────────┘
     ↓
  Supabase (PostgreSQL)
```

### Layer Rules

**Routers** (`app/api/`):
- Receive the request and parse path/query params
- Call the appropriate service method
- Return the response with correct status code
- NEVER contain business logic, data transformation, or direct DB calls
- Use `Depends()` for dependency injection (auth, services)
- Raise `HTTPException` for HTTP-specific errors

**Services** (`app/services/`):
- Contain ALL business logic (validation, transformation, orchestration)
- Receive and return Pydantic models, not raw dicts
- Raise domain-specific exceptions (not HTTPException)
- Can call multiple repositories if needed
- Are the ONLY place where business rules are enforced

**Repositories** (`app/repositories/`):
- ONLY layer that imports and uses supabase-py
- Translate between Supabase responses and Pydantic models
- One repository per database table/entity
- Methods named after operations: `get_by_id()`, `list_by_user()`, `create()`, `update()`, `delete()`
- NEVER contain business logic

### Exception Handling

```
Repository raises → NotFoundException, DatabaseException
Service raises   → DuplicateApplicationException, ExtractionFailedException, etc.
Router catches   → Maps domain exceptions to HTTPException with proper status codes
Global handler   → Catches unhandled exceptions, returns 500 with structured error
```

Domain exceptions defined in `app/core/exceptions.py`. Global exception handler in `app/core/middleware.py`.

## Configuration

All config via `app/core/config.py` using pydantic-settings:

```python
class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    jwt_secret: str
    environment: str = "development"
    # ... etc

    model_config = SettingsConfigDict(env_file=".env")
```

Access via `get_settings()` dependency — never import settings directly in modules.

## Auth Flow

1. Frontend calls Supabase Auth SDK (signup, signin, OAuth)
2. Supabase returns a JWT access token
3. Frontend sends JWT in `Authorization: Bearer <token>` header
4. Backend middleware (`app/core/middleware.py`) verifies JWT with PyJWT
5. Middleware extracts `user_id` from JWT claims
6. `user_id` is available to routers via dependency injection

The backend NEVER handles passwords, OAuth redirects, or token issuance. Supabase Auth does all of that.

## Logging

Structured logging with Python's `logging` module. Never use `print()`.

```python
import logging
logger = logging.getLogger(__name__)

logger.info("Application created", extra={"user_id": user_id, "app_id": app.id})
logger.error("Extraction failed", extra={"url": url, "error": str(e)})
```

## Project Structure

```
backend/
  app/
    __init__.py
    main.py              # FastAPI app factory, middleware registration
    api/
      __init__.py
      health.py          # GET /health
      applications.py    # Application CRUD endpoints
      auth.py            # Auth-related endpoints (if any beyond Supabase)
      stats.py           # Dashboard stats
    core/
      __init__.py
      config.py          # pydantic-settings Settings class
      middleware.py       # JWT auth middleware, exception handlers
      exceptions.py      # Domain exception classes
      dependencies.py    # FastAPI Depends() factories
    models/
      __init__.py
      application.py     # ApplicationCreate, ApplicationUpdate, ApplicationResponse
      auth.py            # TokenPayload, UserContext
      common.py          # PaginatedResponse, ErrorResponse
    services/
      __init__.py
      application.py     # ApplicationService
      auth.py            # AuthService
      extraction.py      # ExtractionService (Sprint 3)
    repositories/
      __init__.py
      application.py     # ApplicationRepository
      user_settings.py   # UserSettingsRepository
    llm/                 # Sprint 3
      __init__.py
      service.py         # LiteLLM wrapper
      scraper.py         # httpx + BeautifulSoup scraper
      prompts.py         # Prompt templates
  tests/
    __init__.py
    conftest.py          # Shared fixtures
    test_api/
      __init__.py
      test_health.py
      test_applications.py
    test_services/
      __init__.py
      test_application.py
  requirements.txt
```
