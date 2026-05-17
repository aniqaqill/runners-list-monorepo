package service

import (
	"errors"
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
	"github.com/aniqaqill/runners-list/internal/port"
)

var (
	ErrRaceDateInPast    = errors.New("race date must be in the future")
	ErrRaceNameNotUnique = errors.New("race name must be unique")
)

type RaceService struct {
	repo port.RaceRepository
}

func NewRaceService(repo port.RaceRepository) *RaceService {
	return &RaceService{repo: repo}
}

func (s *RaceService) CreateRace(race *domain.Race) error {
	if !isRaceDateInFuture(race.Date) {
		return ErrRaceDateInPast
	}

	if s.repo.RaceNameExists(race.Name) {
		return ErrRaceNameNotUnique
	}

	return s.repo.Create(race)
}

func (s *RaceService) ListRaces(filter port.RaceFilter) ([]domain.Race, error) {
	return s.repo.FindAll(filter)
}

func (s *RaceService) DeleteRace(id uint) error {
	race, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(race)
}

func (s *RaceService) UpsertRace(race *domain.Race) error {
	return s.repo.Upsert(race)
}

func (s *RaceService) BulkUpsertRaces(races []domain.Race) (inserted int, updated int, err error) {
	return s.repo.BulkUpsert(races)
}

func isRaceDateInFuture(date time.Time) bool {
	return date.After(time.Now())
}
