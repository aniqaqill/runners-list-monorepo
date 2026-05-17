package port

import (
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
)

// RaceFilter holds optional query parameters for listing races.
// Zero values mean "no filter" for that field.
type RaceFilter struct {
	State  string
	From   time.Time // races on or after this date
	To     time.Time // races on or before this date
	Limit  int       // page size (default 50)
	Offset int       // page offset (default 0)
}

type RaceRepository interface {
	Create(race *domain.Race) error
	FindAll(filter RaceFilter) ([]domain.Race, error)
	FindByID(id uint) (*domain.Race, error)
	Delete(race *domain.Race) error
	RaceNameExists(name string) bool
	Upsert(race *domain.Race) error
	BulkUpsert(races []domain.Race) (inserted int, updated int, err error)
}
