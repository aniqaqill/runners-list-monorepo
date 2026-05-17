package http

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
	"github.com/aniqaqill/runners-list/internal/core/service"
	"github.com/aniqaqill/runners-list/internal/platform/cache"
	"github.com/aniqaqill/runners-list/internal/port"
	"github.com/gofiber/fiber/v2"
)

// raceService is the RaceHandler-facing subset of core/service.RaceService (stubs in tests).
type raceService interface {
	CreateRace(race *domain.Race) error
	ListRaces(filter port.RaceFilter) ([]domain.Race, error)
	DeleteRace(id uint) error
	BulkUpsertRaces(races []domain.Race) (inserted int, updated int, err error)
}

const raceListCacheTTL = 24 * time.Hour

type RaceHandler struct {
	raceService raceService
	cache       cache.Client
}

func NewRaceHandler(svc raceService, c cache.Client) *RaceHandler {
	return &RaceHandler{raceService: svc, cache: c}
}

func listRacesResponseCacheable(f port.RaceFilter) bool {
	return f.State == "" && f.From.IsZero() && f.To.IsZero() && f.Offset == 0 && f.Limit == 50
}

// CreateRace handles creation of a new race (scraped aggregation record).
func (h *RaceHandler) CreateRace(c *fiber.Ctx) error {
	var payload CreateRacePayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "invalid input format",
		})
	}

	race := domain.Race{
		Name:            payload.Name,
		Location:        payload.Location,
		State:           payload.State,
		Distance:        payload.Distance,
		Date:            payload.Date,
		Description:     payload.Description,
		RegistrationURL: payload.RegistrationURL,
	}

	if err := h.raceService.CreateRace(&race); err != nil {
		switch err {
		case service.ErrRaceDateInPast:
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   true,
				"message": "race date must be in the future",
			})
		case service.ErrRaceNameNotUnique:
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":   true,
				"message": "race name must be unique",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   true,
				"message": "failed to create race",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"error":   false,
		"message": "race created successfully",
	})
}

// ListRaces returns races with optional filtering and pagination.
//
// Query parameters (all optional):
//
//	state=Selangor          — filter by state (case-insensitive)
//	from=2026-01-01         — races on or after date (YYYY-MM-DD)
//	to=2026-12-31           — races on or before date (YYYY-MM-DD)
//	limit=50                — max results (default 50)
//	offset=0                — skip N results (for paging)
func (h *RaceHandler) ListRaces(c *fiber.Ctx) error {
	filter := port.RaceFilter{
		State:  c.Query("state"),
		Limit:  parseIntQuery(c, "limit", 50),
		Offset: parseIntQuery(c, "offset", 0),
	}

	if from := c.Query("from"); from != "" {
		if t, err := time.Parse("2006-01-02", from); err == nil {
			filter.From = t
		}
	}
	if to := c.Query("to"); to != "" {
		if t, err := time.Parse("2006-01-02", to); err == nil {
			filter.To = t
		}
	}

	cacheable := listRacesResponseCacheable(filter)
	ctx := c.UserContext()
	if ctx == nil {
		ctx = context.Background()
	}

	if cacheable && h.cache != nil {
		cached, gerr := h.cache.Get(ctx, cache.KeyRacesAll)
		if gerr == nil && cached != "" {
			c.Set("Cache-Control", "public, max-age=60, s-maxage=60")
			c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSONCharsetUTF8)
			return c.Status(fiber.StatusOK).SendString(cached)
		}
	}

	races, err := h.raceService.ListRaces(filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "failed to retrieve races",
		})
	}

	resp := raceListResponse{
		Error:  false,
		Data:   racesToPublicJSON(races),
		Total:  len(races),
		Limit:  filter.Limit,
		Offset: filter.Offset,
	}

	if cacheable && h.cache != nil {
		if raw, merr := json.Marshal(resp); merr == nil {
			_ = h.cache.Set(ctx, cache.KeyRacesAll, string(raw), raceListCacheTTL)
		}
	}

	c.Set("Cache-Control", "public, max-age=60, s-maxage=60")

	return c.Status(fiber.StatusOK).JSON(resp)
}

// SyncRaces handles bulk race synchronization from the scraper.
func (h *RaceHandler) SyncRaces(c *fiber.Ctx) error {
	var syncReq SyncRequest
	if err := c.BodyParser(&syncReq); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(SyncResponse{
			Success: false,
			Error:   "invalid request format",
		})
	}

	if len(syncReq.Events) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(SyncResponse{
			Success: false,
			Error:   "no races provided",
		})
	}

	var (
		races     []domain.Race
		rowErrors []SyncRowError
	)

	for i, input := range syncReq.Events {
		race, err := input.ToRace()
		if err != nil {
			rowErrors = append(rowErrors, SyncRowError{
				Index:  i,
				Reason: "invalid date format: " + err.Error(),
			})
			continue
		}
		races = append(races, race)
	}

	inserted, updated, err := h.raceService.BulkUpsertRaces(races)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(SyncResponse{
			Success: false,
			Error:   "failed to sync races: " + err.Error(),
		})
	}

	syncCtx := c.UserContext()
	if syncCtx == nil {
		syncCtx = context.Background()
	}
	if h.cache != nil {
		_ = h.cache.Del(syncCtx, cache.KeyRacesAll)
	}

	return c.Status(fiber.StatusOK).JSON(SyncResponse{
		Success:   true,
		Inserted:  inserted,
		Updated:   updated,
		Total:     len(syncReq.Events),
		RowErrors: rowErrors,
	})
}

// DeleteRace handles deletion of a race by ID.
func (h *RaceHandler) DeleteRace(c *fiber.Ctx) error {
	id := c.Params("id")
	raceID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "invalid race ID",
		})
	}
	if err := h.raceService.DeleteRace(uint(raceID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "failed to delete race",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"error":   false,
		"message": "race deleted successfully",
	})
}

func parseIntQuery(c *fiber.Ctx, key string, def int) int {
	v := c.Query(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 0 {
		return def
	}
	return n
}
