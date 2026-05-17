# PRD — Runners List Platform: Phase 1 Codebase Cleanup & Lambda Migration

> **Notion page:** https://www.notion.so/3639b95009bd81bc962afdbdb607ff46
> **ADRs:** `docs/adr/0001` through `docs/adr/0004`
> **Glossary:** `CONTEXT.md`

---

## Problem Statement

The Runners List platform is a Malaysian running events aggregator with a working scraper, Go API, and Next.js frontend. The API is currently **offline** — the AWS ECS Fargate deployment was shut down because the ~$5/month cost is unsustainable for a hobby project. Every API deployment also changed the public IP address, forcing a brittle automation to update secrets in two other repos and a Vercel environment variable.

Additionally, the codebase has accumulated technical debt: the core domain entity is named `Events` (plural, vague) when it represents a `Race` (singular, precise); the domain struct is coupled to the ORM via embedded `gorm.Model`; the rate limiter stores state in process memory (broken on serverless runtimes); and there is no Redis caching layer, causing every request to hit the database.

---

## Solution

Phase 1 cleans up the codebase and migrates the API from ECS Fargate to **AWS Lambda with a Function URL** — eliminating the monthly cost entirely (Lambda free tier: 1 million requests/month) and providing a stable HTTPS URL that never changes between deployments.

As part of the cleanup, the domain language is aligned with the project glossary (`CONTEXT.md`), the domain layer is decoupled from the ORM, and Redis (via Upstash serverless) is introduced for caching and rate limiting — both of which require shared external state that in-process memory cannot provide across Lambda invocations.

---

## User Stories

1. As a **runner**, I want the race listing to load quickly, so that I can find upcoming events without waiting for a slow database round-trip on every request.
2. As a **runner**, I want the race listing to be available reliably, so that I'm not blocked by a backend that is turned off to save costs.
3. As a **runner**, I want to browse races filtered by Malaysian state, so that I can find events near me.
4. As a **runner**, I want to browse races filtered by date range, so that I can plan ahead.
5. As a **runner**, I want pagination on the race list, so that the page loads fast even as the dataset grows.
6. As a **developer**, I want the API deployed to a stable HTTPS URL, so that I never need to update Vercel or scraper secrets after a deployment.
7. As a **developer**, I want the deployment to cost $0/month, so that I can leave it running indefinitely without worrying about bills.
8. As a **developer**, I want the domain type to be called `Race` (not `Events`), so that the codebase language matches the agreed glossary in `CONTEXT.md`.
9. As a **developer**, I want the domain struct to be free of ORM tags, so that I can test business logic without GORM as a dependency.
10. As a **developer**, I want a typed config struct loaded at startup, so that missing environment variables cause an immediate, descriptive failure rather than a runtime panic.
11. As a **developer**, I want the rate limiter to use Redis, so that it works correctly across multiple Lambda instances and cold starts.
12. As a **developer**, I want the race list to be cached in Redis, so that repeated requests within 24 hours don't hit the database.
13. As a **developer**, I want the cache to be invalidated when the scraper syncs new races, so that users always see up-to-date data within one sync cycle.
14. As a **scraper operator**, I want the sync endpoint to return per-row errors, so that I can diagnose partial failures without re-running the entire scrape.
15. As a **Super Admin**, I want the internal sync endpoint to require both an API key and an HMAC signature, so that replay attacks are mitigated.
16. As a **Super Admin**, I want the API to respond with structured JSON logs, so that I can query logs in CloudWatch after re-enabling logging.

---

## Implementation Decisions

### 1. Rename `Events` → `Race` throughout the codebase
The domain entity is a publicly listed competitive running event aggregated from an external source. Per `CONTEXT.md`, the canonical term is **Race**. The Go struct, port interface, service, HTTP handler, and repository adapter are all renamed. The database table stays as `events` (via a `TableName()` method on the repository model) until a separate migration renames it.

### 2. Separate domain struct from repository model
`domain.Race` becomes a pure Go struct with no GORM or JSON tags. The repository adapter owns a private `raceRow` struct with GORM column tags and a bidirectional mapper (`toRace` / `fromRace`). This enforces the hexagonal architecture boundary at the type level.

### 3. Repository model retains the `events` table name
The `raceRow` struct implements `TableName() string { return "events" }`. This is a zero-migration change — the DB table is unaffected. The column typo `registeration_url` is preserved via an explicit GORM column tag. The pending migration `001_rename_registration_url.sql` can be run independently.

### 4. AWS Lambda + Function URL replaces ECS Fargate
The existing Fiber app is wrapped with `aws-lambda-go-api-proxy/fiber`. The Lambda handler is the new entrypoint for production; the existing HTTP server remains for local development. Lambda timeout: 30 seconds. Memory: 256MB.

### 5. Terraform for Lambda in `infra/terraform/aws-lambda/`
New Terraform module creates: Lambda function, IAM execution role (least-privilege), Function URL (public, no auth), and Secrets Manager entries for DB credentials and API keys. ECS Terraform is archived. Remote state (S3 + DynamoDB lock) is added.

### 6. CI/CD removes IP-sync automation
The entire IP-sync automation (scraper secret update + Vercel env var update) is removed. Lambda Function URL is stable across all deployments. Scraper and Vercel are updated once and never need changing again.

### 7. Upstash Redis for caching and rate limiting
Upstash is serverless Redis with a free tier of 10,000 commands/day. The `cache.Client` interface is defined in `internal/platform/cache/` with a `go-redis/v9` implementation. A nil client is always safe (handlers fail open).

### 8. Cache key `races:all` with explicit invalidation
`GET /races` checks Redis for `races:all`. Cache hit → return cached JSON. Cache miss → query DB, serialize, store with 24h TTL. `POST /internal/sync` deletes `races:all` after a successful bulk upsert. The constant is defined once in `cache/cache.go`.

### 9. Redis-backed rate limiter (100 req/min per IP)
Replaces the in-memory Fiber limiter. Implementation uses Redis `INCR` + `EXPIRE` (fixed window). Fails open if Redis is unavailable.

### 10. Config struct extended with `RedisURL`
Optional field. Empty string = no Redis, in-memory fallback. Required fields: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `INTERNAL_API_KEY`.

---

## Testing Decisions

**Good tests** verify observable behaviour through the public interface — not which GORM method was called internally. Existing test suite: Ginkgo/Gomega + GoMock.

**Modules with tests:**
- `core/service.RaceService` — existing tests updated to use `domain.Race` and `MockRaceRepository`
- `adapter/middleware.RateLimit` — first 100 requests → 200; 101st → 429 (mock `cache.Client`)
- `platform/cache` — integration test against local Redis, skipped if `REDIS_URL` absent

**Prior art:** `internal/core/service/events_test.go` → `race_test.go`

---

## Out of Scope

- Running Club domain (`RunningClub`, `ClubSession`, `Member`)
- Social publishing (SQS + Lambda workers)
- Strava data pipeline
- Paid model / ads / mobile app
- ALB or custom domain
- Kafka / AutoMQ

---

## Further Notes

- ADRs for all decisions in `docs/adr/`
- GCP Cloud Run Terraform (`infra/terraform/gcp/`) remains archived and functional as a fallback
- `registeration_url` column rename migration to be run separately after Phase 1 deploys
- Redis scaling path: Upstash → Redis Cloud → ElastiCache (connection string only — no code change)
