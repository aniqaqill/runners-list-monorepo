package http

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
)

func TestRaceToPublicJSON_snakeCaseAndDateShape(t *testing.T) {
	t.Parallel()
	fixed := time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC)
	in := domain.Race{
		ID:              7,
		Name:            "KL Marathon",
		Location:        "Dataran",
		State:           "Wilayah Persekutuan",
		Distance:        "42km",
		Date:            fixed,
		Description:     "test",
		RegistrationURL: "https://example.com/r",
		CreatedAt:       fixed.Add(time.Hour),
		UpdatedAt:       fixed.Add(2 * time.Hour),
	}

	got := raceToPublicJSON(in)
	raw, err := json.Marshal(got)
	if err != nil {
		t.Fatal(err)
	}

	var asMap map[string]any
	if err := json.Unmarshal(raw, &asMap); err != nil {
		t.Fatal(err)
	}
	if _, ok := asMap["registration_url"]; !ok {
		t.Fatalf("expected registration_url key, got keys %v", asMap)
	}
	if asMap["name"] != "KL Marathon" {
		t.Fatalf("name: %#v", asMap["name"])
	}
	if asMap["date"] != "2026-03-15" {
		t.Fatalf("date (YYYY-MM-DD): got %v", asMap["date"])
	}
	if float64(got.ID) != asMap["id"].(float64) {
		t.Fatalf("id mismatch")
	}
}

func TestRacesToPublicJSON_emptySliceNonNil(t *testing.T) {
	t.Parallel()
	out := racesToPublicJSON(nil)
	if out == nil {
		t.Fatal("expected non-nil empty slice")
	}
	if len(out) != 0 {
		t.Fatalf("len=%d", len(out))
	}
}
