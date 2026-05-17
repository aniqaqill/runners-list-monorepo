package http

import (
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
)

// raceListResponse is the JSON envelope for GET /races (stable field order for Redis cache bytes).
type raceListResponse struct {
	Data    []racePublicJSON `json:"data"`
	Error   bool             `json:"error"`
	Limit   int              `json:"limit"`
	Offset  int              `json:"offset"`
	Total   int              `json:"total"`
}

// racePublicJSON matches the snake_case JSON shape consumed by the Next.js client.
type racePublicJSON struct {
	ID               uint   `json:"id"`
	Name             string `json:"name"`
	Location         string `json:"location"`
	State            string `json:"state"`
	Distance         string `json:"distance"`
	Date             string `json:"date"`
	Description      string `json:"description"`
	RegistrationURL string `json:"registration_url"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
}

func racesToPublicJSON(races []domain.Race) []racePublicJSON {
	out := make([]racePublicJSON, len(races))
	for i := range races {
		out[i] = raceToPublicJSON(races[i])
	}
	return out
}

func raceToPublicJSON(r domain.Race) racePublicJSON {
	return racePublicJSON{
		ID:               r.ID,
		Name:             r.Name,
		Location:         r.Location,
		State:            r.State,
		Distance:         r.Distance,
		Date:             r.Date.UTC().Format("2006-01-02"),
		Description:      r.Description,
		RegistrationURL: r.RegistrationURL,
		CreatedAt:        r.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:        r.UpdatedAt.UTC().Format(time.RFC3339),
	}
}
