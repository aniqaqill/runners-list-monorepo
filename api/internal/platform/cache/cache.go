// Package cache defines the caching interface and shared key constants.
// The interface is satisfied by the Redis implementation; pass nil to disable
// caching (handlers fail open — they skip the cache and always hit the DB).
package cache

import (
	"context"
	"time"
)

// KeyRacesAll is the canonical cache key for the full Race list response.
// Used by the list handler (to read/write) and the sync handler (to invalidate).
// Keeping the constant here ensures both sides stay in sync.
const KeyRacesAll = "races:all"

// Client is the minimal Redis surface the application needs.
// A nil Client is always safe: callers must check for nil before use.
type Client interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key, value string, ttl time.Duration) error
	Del(ctx context.Context, key string) error
	// Incr atomically increments key and returns the new value.
	Incr(ctx context.Context, key string) (int64, error)
	// Expire sets a TTL on key. No-op if key does not exist.
	Expire(ctx context.Context, key string, ttl time.Duration) error
}
