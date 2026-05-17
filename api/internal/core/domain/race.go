package domain

import "time"

// Race is a publicly listed competitive running event aggregated from an
// external source (e.g. a Blogger page). The platform does not organise Races
// — it only discovers and lists them.
//
// This is a pure domain struct: no GORM tags, no JSON tags, no ORM coupling.
// Persistence concerns live in the repository layer (adapter/repository).
type Race struct {
	ID              uint
	Name            string
	Location        string
	State           string
	Distance        string
	Date            time.Time
	Description     string
	RegistrationURL string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
