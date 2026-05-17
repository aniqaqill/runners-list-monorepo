package http

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
	"github.com/aniqaqill/runners-list/internal/platform/cache"
	"github.com/aniqaqill/runners-list/internal/port"
	"github.com/gofiber/fiber/v2"
)

type stubRaceService struct {
	listCalls int
	races     []domain.Race
	listErr   error
}

func (s *stubRaceService) CreateRace(*domain.Race) error { return nil }

func (s *stubRaceService) ListRaces(filter port.RaceFilter) ([]domain.Race, error) {
	s.listCalls++
	return s.races, s.listErr
}

func (s *stubRaceService) DeleteRace(uint) error { return nil }

func (s *stubRaceService) BulkUpsertRaces([]domain.Race) (inserted int, updated int, err error) {
	return 0, 0, nil
}

type recordingCache struct {
	getKey   string
	setKey   string
	delKeys  []string
	canned   string
	getErr   error
	setCalls int
}

func (r *recordingCache) Get(ctx context.Context, key string) (string, error) {
	r.getKey = key
	if r.getErr != nil {
		return "", r.getErr
	}
	return r.canned, nil
}

func (r *recordingCache) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	r.setCalls++
	r.setKey = key
	return nil
}

func (r *recordingCache) Del(ctx context.Context, key string) error {
	r.delKeys = append(r.delKeys, key)
	return nil
}

func (r *recordingCache) Incr(ctx context.Context, key string) (int64, error) { return 0, nil }

func (r *recordingCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return nil
}

func TestListRaces_cacheHit_skipsListService(t *testing.T) {
	t.Parallel()

	svc := &stubRaceService{}
	// Matches json.Marshal on raceListResponse with empty non-nil data slice.
	cachedBody := `{"data":[],"error":false,"limit":50,"offset":0,"total":0}`
	rec := &recordingCache{canned: cachedBody}

	h := NewRaceHandler(svc, rec)
	app := fiber.New()
	app.Get("/races", h.ListRaces)

	req := httptest.NewRequest("GET", "/races", nil)
	resp, err := app.Test(req, 2000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("status=%d", resp.StatusCode)
	}
	if svc.listCalls != 0 {
		t.Fatalf("expected cache hit to skip service, listCalls=%d", svc.listCalls)
	}
	if rec.getKey != cache.KeyRacesAll {
		t.Fatalf("get key: %q", rec.getKey)
	}
	body, _ := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if string(body) != cachedBody {
		t.Fatalf("body=%q want %q", body, cachedBody)
	}
}

func TestListRaces_cacheMiss_populatesFromServiceAndSetsCache(t *testing.T) {
	t.Parallel()

	fixed := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)
	svc := &stubRaceService{
		races: []domain.Race{
			{ID: 1, Name: "X", Date: fixed, CreatedAt: fixed, UpdatedAt: fixed},
		},
	}
	rec := &recordingCache{}

	h := NewRaceHandler(svc, rec)
	app := fiber.New()
	app.Get("/races", h.ListRaces)

	req := httptest.NewRequest("GET", "/races", nil)
	resp, err := app.Test(req, 2000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("status=%d", resp.StatusCode)
	}
	if svc.listCalls != 1 {
		t.Fatalf("expected one DB path, listCalls=%d", svc.listCalls)
	}
	if rec.setCalls != 1 || rec.setKey != cache.KeyRacesAll {
		t.Fatalf("expected Set on %q, setCalls=%d key=%q", cache.KeyRacesAll, rec.setCalls, rec.setKey)
	}
}

func TestListRaces_filteredQuery_skipsCache(t *testing.T) {
	t.Parallel()

	svc := &stubRaceService{}
	rec := &recordingCache{canned: `{"stale":true}`}

	h := NewRaceHandler(svc, rec)
	app := fiber.New()
	app.Get("/races", h.ListRaces)

	req := httptest.NewRequest("GET", "/races?state=Selangor", nil)
	resp, err := app.Test(req, 2000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("status=%d", resp.StatusCode)
	}
	if rec.getKey != "" {
		t.Fatalf("should not read cache for filtered request, got key %q", rec.getKey)
	}
	if svc.listCalls != 1 {
		t.Fatalf("expected service call, listCalls=%d", svc.listCalls)
	}
}

func TestSyncRaces_success_invalidatesCacheKey(t *testing.T) {
	t.Parallel()

	svc := &stubRaceService{}
	rec := &recordingCache{}
	h := NewRaceHandler(svc, rec)
	app := fiber.New()
	app.Post("/internal/sync", h.SyncRaces)

	body := []byte(`{"events":[{"name":"R","location":"L","state":"S","distance":"5k","date":"2026-08-01","description":"d","registration_url":"https://x"}]}`)
	req := httptest.NewRequest("POST", "/internal/sync", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, 2000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("status=%d", resp.StatusCode)
	}
	if len(rec.delKeys) != 1 || rec.delKeys[0] != cache.KeyRacesAll {
		t.Fatalf("del keys: %+v", rec.delKeys)
	}
	var syncResp SyncResponse
	rb, _ := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if err := json.Unmarshal(rb, &syncResp); err != nil {
		t.Fatal(err)
	}
	if !syncResp.Success {
		t.Fatalf("sync: %+v", syncResp)
	}
}

func TestListRaces_nilCache_usesService(t *testing.T) {
	t.Parallel()

	svc := &stubRaceService{races: []domain.Race{}}
	h := NewRaceHandler(svc, nil)
	app := fiber.New()
	app.Get("/races", h.ListRaces)

	req := httptest.NewRequest("GET", "/races", nil)
	resp, err := app.Test(req, 2000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("status=%d", resp.StatusCode)
	}
	if svc.listCalls != 1 {
		t.Fatalf("expected service call, listCalls=%d", svc.listCalls)
	}
}
