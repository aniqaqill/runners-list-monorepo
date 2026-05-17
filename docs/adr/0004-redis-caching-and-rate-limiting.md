# Use Upstash Redis for caching and rate limiting

The API uses Redis for two concerns: caching the `GET /events` (Race list) response and rate limiting public endpoints. The Redis instance is hosted on Upstash (serverless Redis, free up to 10,000 commands/day).

The in-memory rate limiter in `middleware/rate-limit.go` is broken on Lambda — each cold start is a fresh process and concurrent invocations have independent in-memory state. Redis as a shared, external store fixes this correctly.

Cache invalidation is explicit (Option B): when `POST /internal/sync` completes successfully, the handler deletes the `races:all` cache key. The next `GET /events` repopulates it from the DB. TTL is set to 24h as a safety fallback.

## Migration path

Upstash → Redis Cloud → AWS ElastiCache → ElastiCache Cluster Mode. Each step is a connection string swap in Secrets Manager. The `go-redis` client and all Redis commands remain identical across all tiers.

## Consequences

The sync handler and the list handler must share a canonical cache key constant (`races:all`). Define it in a shared `cache/keys.go` file inside the `race` package.
