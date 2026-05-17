package http

import "testing"

func TestSyncEventInput_ToRace_validDate(t *testing.T) {
	t.Parallel()
	in := SyncEventInput{
		Name:            "Morning Run",
		Location:        "Park",
		State:           "Selangor",
		Distance:        "10km",
		Date:            "2026-07-01",
		Description:     "easy",
		RegistrationURL: "https://example.com/register",
	}
	got, err := in.ToRace()
	if err != nil {
		t.Fatal(err)
	}
	if got.Name != "Morning Run" || got.Location != "Park" || got.State != "Selangor" {
		t.Fatalf("fields: %+v", got)
	}
	if got.Date.UTC().Format("2006-01-02") != "2026-07-01" {
		t.Fatalf("date got %v", got.Date)
	}
	if got.RegistrationURL != "https://example.com/register" {
		t.Fatalf("url: %q", got.RegistrationURL)
	}
}

func TestSyncEventInput_ToRace_invalidDate(t *testing.T) {
	t.Parallel()
	in := SyncEventInput{
		Name:            "Morning Run",
		Location:        "Park",
		Date:            "not-a-date",
		RegistrationURL: "https://example.com/register",
	}
	_, err := in.ToRace()
	if err == nil {
		t.Fatal("expected parse error")
	}
}
