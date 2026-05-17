package repository

import (
	"errors"
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
	"github.com/aniqaqill/runners-list/internal/port"
	"gorm.io/gorm"
)

const defaultLimit = 50

// RaceRow is the GORM persistence model for a Race. DB table stays "events"
// (legacy name) until a migration renames it; see CONTEXT.md / ADRs.
//
// Embedding gorm.Model here — not on domain.Race — keeps the domain layer ORM-free.
type RaceRow struct {
	gorm.Model
	Name             string    `gorm:"type:text;not null"`
	Location         string    `gorm:"type:text;not null"`
	State            string    `gorm:"type:text"`
	Distance         string    `gorm:"type:text"`
	Date             time.Time `gorm:"type:date;not null;index"`
	Description      string    `gorm:"type:text"`
	RegistrationURL  string    `gorm:"column:registeration_url;type:text;not null"`
}

func (RaceRow) TableName() string {
	return "events"
}

func raceToDomain(row RaceRow) domain.Race {
	return domain.Race{
		ID:              row.ID,
		Name:            row.Name,
		Location:        row.Location,
		State:           row.State,
		Distance:        row.Distance,
		Date:            row.Date,
		Description:     row.Description,
		RegistrationURL: row.RegistrationURL,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}

func raceRowFromDomain(r domain.Race) RaceRow {
	return RaceRow{
		Model: gorm.Model{
			ID:        r.ID,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
		},
		Name:            r.Name,
		Location:        r.Location,
		State:           r.State,
		Distance:        r.Distance,
		Date:            r.Date,
		Description:     r.Description,
		RegistrationURL: r.RegistrationURL,
	}
}

type GormRaceRepository struct {
	db *gorm.DB
}

func NewGormRaceRepository(db *gorm.DB) port.RaceRepository {
	return &GormRaceRepository{db: db}
}

func (r *GormRaceRepository) Create(race *domain.Race) error {
	row := raceRowFromDomain(*race)
	if err := r.db.Create(&row).Error; err != nil {
		return err
	}
	race.ID = row.ID
	race.CreatedAt = row.CreatedAt
	race.UpdatedAt = row.UpdatedAt
	return nil
}

func (r *GormRaceRepository) FindAll(filter port.RaceFilter) ([]domain.Race, error) {
	var rows []RaceRow

	q := r.db.Model(&RaceRow{})

	if filter.State != "" {
		q = q.Where("LOWER(state) = LOWER(?)", filter.State)
	}
	if !filter.From.IsZero() {
		q = q.Where("date >= ?", filter.From)
	}
	if !filter.To.IsZero() {
		q = q.Where("date <= ?", filter.To)
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = defaultLimit
	}

	err := q.Order("date ASC").Limit(limit).Offset(filter.Offset).Find(&rows).Error
	if err != nil {
		return nil, err
	}

	out := make([]domain.Race, len(rows))
	for i := range rows {
		out[i] = raceToDomain(rows[i])
	}
	return out, nil
}

func (r *GormRaceRepository) FindByID(id uint) (*domain.Race, error) {
	var row RaceRow
	err := r.db.First(&row, id).Error
	if err != nil {
		return nil, err
	}
	d := raceToDomain(row)
	return &d, nil
}

func (r *GormRaceRepository) Delete(race *domain.Race) error {
	if race == nil {
		return errors.New("nil race")
	}
	return r.db.Delete(&RaceRow{}, race.ID).Error
}

// Upsert inserts a new race or updates an existing row matched by name + date.
func (r *GormRaceRepository) Upsert(race *domain.Race) error {
	var existing RaceRow
	err := r.db.Where("name = ? AND date = ?", race.Name, race.Date).First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		return r.Create(race)
	}
	if err != nil {
		return err
	}

	row := raceRowFromDomain(*race)
	row.ID = existing.ID
	row.CreatedAt = existing.CreatedAt
	if saveErr := r.db.Save(&row).Error; saveErr != nil {
		return saveErr
	}
	race.ID = row.ID
	race.CreatedAt = row.CreatedAt
	race.UpdatedAt = row.UpdatedAt
	return nil
}

func (r *GormRaceRepository) RaceNameExists(name string) bool {
	var row RaceRow
	err := r.db.Where("name = ?", name).First(&row).Error
	return err == nil
}

// BulkUpsert inserts or updates multiple races in a single transaction.
func (r *GormRaceRepository) BulkUpsert(races []domain.Race) (inserted int, updated int, err error) {
	err = r.db.Transaction(func(tx *gorm.DB) error {
		for i := range races {
			race := &races[i]

			var existing RaceRow
			findErr := tx.Where("name = ? AND date = ?", race.Name, race.Date).First(&existing).Error

			if findErr == gorm.ErrRecordNotFound {
				row := raceRowFromDomain(*race)
				if createErr := tx.Create(&row).Error; createErr != nil {
					return createErr
				}
				race.ID = row.ID
				race.CreatedAt = row.CreatedAt
				race.UpdatedAt = row.UpdatedAt
				inserted++
			} else if findErr != nil {
				return findErr
			} else {
				row := raceRowFromDomain(*race)
				row.ID = existing.ID
				row.CreatedAt = existing.CreatedAt
				if saveErr := tx.Save(&row).Error; saveErr != nil {
					return saveErr
				}
				race.ID = row.ID
				race.CreatedAt = row.CreatedAt
				race.UpdatedAt = row.UpdatedAt
				updated++
			}
		}
		return nil
	})

	return inserted, updated, err
}
