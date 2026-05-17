package middleware

import (
	"time"

	adhttp "github.com/aniqaqill/runners-list/internal/adapter/http"
	"github.com/gofiber/fiber/v2"
)

// ValidateCreateRaceInput validates JSON for POST /protected/races/create-races.
func ValidateCreateRaceInput(c *fiber.Ctx) error {
	var input adhttp.CreateRacePayload
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid input format",
		})
	}

	if err := validate.Struct(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Validation failed",
			"details": err.Error(),
		})
	}

	if input.Date.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Date must be in the future.",
		})
	}

	return c.Next()
}
