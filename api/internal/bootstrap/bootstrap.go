// Package bootstrap wires the Fiber application the same way for cmd/main (HTTP)
// and cmd/lambda (AWS Lambda + Function URL).
package bootstrap

import (
	adapthttp "github.com/aniqaqill/runners-list/internal/adapter/http"
	"github.com/aniqaqill/runners-list/internal/adapter/middleware"
	"github.com/aniqaqill/runners-list/internal/adapter/repository"
	"github.com/aniqaqill/runners-list/internal/config"
	"github.com/aniqaqill/runners-list/internal/core/service"
	"github.com/aniqaqill/runners-list/internal/platform/cache"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// NewFiberApp builds middleware, handlers, and routes.
func NewFiberApp(db *gorm.DB, cfg *config.Config, cacheClient cache.Client) *fiber.App {
	raceRepo := repository.NewGormRaceRepository(db)
	userRepo := repository.NewGormUserRepository(db)

	raceService := service.NewRaceService(raceRepo)
	userService := service.NewUserService(userRepo, cfg.JWTSecret)

	raceHandler := adapthttp.NewRaceHandler(raceService, cacheClient)
	userHandler := adapthttp.NewUserHandler(userService)

	app := fiber.New(fiber.Config{
		EnablePrintRoutes: false,
	})

	app.Use(middleware.RequestID())
	app.Use(middleware.RequestLogger())

	setupRoutes(app, db, cfg, raceHandler, userHandler)

	return app
}
