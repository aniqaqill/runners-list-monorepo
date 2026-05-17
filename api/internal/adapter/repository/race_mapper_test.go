package repository

import (
	"testing"
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
	"gorm.io/gorm"
)

func TestRaceRow_TableName(t *testing.T) {
	t.Parallel()
	var row RaceRow
	if got := row.TableName(); got != "events" {
		t.Fatalf("TableName(): %q", got)
	}
}

func TestRaceRow_domainRoundTripPreservesFields(t *testing.T) {
	t.Parallel()
	d := fixedTime(t)
	row := raceRowFromDomain(d)
	got := raceToDomain(row)

	if got.Name != d.Name || got.Location != d.Location ||
		got.RegistrationURL != d.RegistrationURL || got.ID != d.ID {
		t.Fatalf("round trip mismatch: %+v vs %+v", got, d)
	}
	if !got.Date.Equal(d.Date) || !got.CreatedAt.Equal(d.CreatedAt) {
		t.Fatalf("time fields drift: %+v vs %+v", got, d)
	}
}

func fixedTime(t *testing.T) domain.Race {
	t.Helper()
	ts := time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC)
	return domain.Race{
		ID:        42,
		Name:      "X",
		Location:  "Y",
		State:     "Z",
		Distance:  "5km",
		Date:      ts,
		Description: "d",
		RegistrationURL: "https://example.com/z",
		CreatedAt: ts.Add(time.Minute),
		UpdatedAt: ts.Add(2 * time.Minute),
	}
}

func TestRaceRow_gormIDsPreservedThroughMapper(t *testing.T) {
	t.Parallel()
	base := fixedTime(t)
	row := RaceRow{
		Model: gorm.Model{
			ID:        base.ID,
			CreatedAt: base.CreatedAt,
			UpdatedAt: base.UpdatedAt,
		},
		Name:            base.Name,
		Location:        base.Location,
		State:           base.State,
		Distance:        base.Distance,
		Date:            base.Date,
		Description:     base.Description,
		RegistrationURL: base.RegistrationURL,
	}

	d := raceToDomain(row)
	back := raceRowFromDomain(d)
	if back.ID != row.ID || back.Name != row.Name ||
		back.RegistrationURL != row.RegistrationURL {
		t.Fatalf("%+v vs %+v", back, row)
	}
}
