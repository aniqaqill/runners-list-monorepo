# Copilot Instructions for Runners List Platform

## Architecture Overview

This is a **monorepo** for a Malaysian running events aggregation platform with three distinct services that communicate in a specific pipeline:

```
Python Scraper → Go API (ECS Fargate) → Next.js Frontend (Vercel)
                      ↓
                 Supabase PostgreSQL
```

### Service Boundaries

- **`api/`**: Go 1.24 + Fiber REST API with hexagonal architecture (Ports & Adapters pattern)
  - **Core layer**: `internal/core/domain/` (models), `internal/core/service/` (business logic)
  - **Adapters**: `internal/adapter/http/` (handlers), `internal/adapter/repository/` (data access)
  - **Ports**: `internal/port/` (interfaces connecting core to adapters)
  - Entry point: `cmd/main.go` initializes DB → Repos → Services → Handlers → Routes

- **`client/`**: Next.js 15 with TypeScript, Tailwind, Shadcn UI
  - Uses ISR (Incremental Static Regeneration) with 60s revalidation
  - `src/utils/loadEvents.ts` fetches from API with fallback to empty array

- **`scraper/`**: Python 3.12 + Selenium scraper
  - Posts to API's internal sync endpoint with API key auth
  - Main logic in `src/main.py`, services in `src/services/`

- **`infra/`**: AWS ECS Fargate configs, Terraform IaC

## Critical Developer Workflows

### API Development (Go)
```bash
# From api/ directory
make dev-up          # Start local postgres + API in Docker
make test            # Run all tests
make unit-test       # Run unit tests with coverage
make generate-mocks  # Regenerate mocks after interface changes
make dev-clean       # Stop and wipe database
```

**Testing pattern**: Services use mock repositories (see `internal/port/mocks/`). Always regenerate mocks when port interfaces change.

### Client Development (Next.js)
```bash
# From client/ directory
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run lint         # ESLint check
```

**Data fetching**: `getStaticProps` in `pages/index.tsx` calls `loadEvents()` which hits `NEXT_PUBLIC_API_URL/events`. API must be running or it returns `[]`.

### Scraper Development (Python)
```bash
# From scraper/ directory
python -m src.main                 # Run scraper with defaults
python -m src.main --no-api        # Skip API sync
pytest                             # Run tests
pytest --cov=src --cov-report=html # Coverage report
```

### Local Full Stack
```bash
# From root directory
docker compose up    # Runs postgres + api + client + scraper
# API: localhost:8080/api/v1/events
# Client: localhost:3000
```

## Authentication & Security

### API Key Authentication (Scraper → API)
- Middleware: `internal/adapter/middleware/internal-auth.go`
- Header: `X-Internal-Token: <INTERNAL_API_KEY>`
- Protected route: `POST /api/v1/internal/sync`
- **Never expose this key in client-side code**

### JWT Authentication (Future User Features)
- Middleware: `internal/adapter/middleware/auth.go`
- Protected routes group: `/api/v1/protected/*`
- Example: `POST /protected/events/create-events` requires JWT

## Data Flow Patterns

### Event Sync Pipeline
1. **Scraper** runs daily (GitHub Actions cron at 8 AM UTC)
2. POSTs JSON array to `/internal/sync` with structure:
   ```go
   type SyncEventInput struct {
       Name            string `json:"name" validate:"required"`
       Location        string `json:"location" validate:"required"`
       State           string `json:"state"`
       Distance        string `json:"distance"`
       Date            string `json:"date" validate:"required"` // Format: "2006-01-02"
       RegistrationURL string `json:"registration_url" validate:"required,url"`
   }
   ```
3. **API** upserts events (checks for duplicates by name+date)
4. **Client** auto-refreshes via ISR every 60 seconds

### API Response Structure
All API endpoints return:
```json
{
  "data": [...],  // Actual payload
  "error": false  // or error message string
}
```

## Deployment Mechanics

### API Deployment (AWS ECS Fargate)
- Triggered by push to `main` in `api/` directory
- Workflow: `.github/workflows/deploy-aws.yml`
- Builds Docker image → Pushes to ECR → Updates ECS task definition
- **Critical**: ECS assigns new public IP on each deployment
- Post-deployment: Workflow updates `API_URL` secret in scraper repo + `NEXT_PUBLIC_API_URL` in Vercel

### Client Deployment (Vercel)
- Auto-deploys on push to `main` in `client/` directory
- Build command: `npm run build`
- Environment variable: `NEXT_PUBLIC_API_URL` (auto-updated by API workflow)

### Scraper Runs
- Daily via GitHub Actions cron
- Also runs manually via `workflow_dispatch`
- Workflow: `.github/workflows/scraper.yml`

## Project-Specific Conventions

### Go Code Style
- Use GORM for ORM (models in `internal/core/domain/`)
- Validation with `go-playground/validator` tags
- Fiber handlers always return `fiber.Map{"data": ..., "error": false}`
- Repository pattern: all DB access through interfaces in `internal/port/`

### Next.js Patterns
- **No client-side data fetching** - use `getStaticProps` with ISR
- Event type definition: `src/types/event.ts`
- Date handling: Events are sorted by date ascending (upcoming first)
- `isEventEnded()` util checks if date < today

### Python Scraper
- All scraping logic isolated in `src/services/parser.py`
- Browser management in `src/services/browser.py` (Selenium)
- Validation in `src/utils/validators.py` - always validate before API sync
- Config loaded via environment variables (see `src/config.py`)

### Environment Variables
**API** (`.env` in `api/`):
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
JWT_SECRET
INTERNAL_API_KEY
```

**Client** (Vercel env vars):
```
NEXT_PUBLIC_API_URL
```

**Scraper** (GitHub Secrets):
```
SCRAPE_URL
API_URL
INTERNAL_API_KEY
```

## Common Gotchas

1. **Dynamic IP Problem**: API IP changes on every ECS deployment. Always check Vercel env vars if client can't reach API.

2. **Database Connection**: API uses Supabase Transaction Pooler (port 5432) in production, not default PgBouncer port 6543.

3. **Date Format**: API expects `"2006-01-02"` format. Client receives ISO8601. Scraper must normalize dates before sending.

4. **CORS**: Not configured in API - client makes SSR requests (server-side), not browser requests.

5. **Makefile Targets**: `make dev-up` in `api/` uses `docker-compose.dev.yml` (local dev), while root `docker-compose.yml` runs full stack.

## Key Files Reference

- API route definitions: [`api/cmd/routes.go`](api/cmd/routes.go)
- API main entry: [`api/cmd/main.go`](api/cmd/main.go)
- Event domain model: `api/internal/core/domain/events.go`
- Sync endpoint logic: [`api/internal/adapter/http/sync.go`](api/internal/adapter/http/sync.go)
- Client event fetching: [`client/src/utils/loadEvents.ts`](client/src/utils/loadEvents.ts)
- Scraper main: [`scraper/src/main.py`](scraper/src/main.py)
- Architecture docs: [`project_context.md`](project_context.md), [`technical_docs.md`](technical_docs.md)

## Testing Strategy

- **Go**: Unit tests for services with mocked repositories. Coverage: 46.7%. Run `make coverage` to view HTML report.
- **Python**: Pytest with fixtures in `tests/conftest.py`. Coverage: 58%. Includes browser mocking.
- **Next.js**: No tests currently configured (TODO).

When adding features, maintain the hexagonal architecture: business logic in `core/`, external interactions in `adapters/`, contracts in `ports/`.
