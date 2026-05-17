package cache_test

import (
	"testing"

	"github.com/aniqaqill/runners-list/internal/platform/cache"
)

func TestNewRedisClient_emptyURL_isNilSafe(t *testing.T) {
	t.Parallel()
	c, err := cache.NewRedisClient("")
	if err != nil {
		t.Fatal(err)
	}
	if c != nil {
		t.Fatal("expected nil client")
	}
}
