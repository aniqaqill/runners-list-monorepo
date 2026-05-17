package http

import "time"

// CreateRacePayload is the JSON body for POST /protected/races/create-races.
type CreateRacePayload struct {
	Name            string    `json:"name" validate:"required"`
	Location        string    `json:"location" validate:"required"`
	State           string    `json:"state"`
	Distance        string    `json:"distance"`
	Date            time.Time `json:"date" validate:"required"`
	Description     string    `json:"description" validate:"omitempty"`
	RegistrationURL string    `json:"registration_url" validate:"required,url"`
}
