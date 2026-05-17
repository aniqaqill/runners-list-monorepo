package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aniqaqill/runners-list/internal/adapter/database"
	"github.com/aniqaqill/runners-list/internal/bootstrap"
	"github.com/aniqaqill/runners-list/internal/config"
	"github.com/aniqaqill/runners-list/internal/platform/cache"
	"github.com/aniqaqill/runners-list/internal/platform/logging"
	"github.com/joho/godotenv"
)

func main() {
	// Structured JSON logging via stdlib slog — Cloud Logging parses this for free
	logging.Init()

	// .env is optional: present in dev, absent in production (env vars injected by Cloud Run / ECS)
	if err := godotenv.Load(); err != nil {
		slog.Info("no .env file found, using system environment variables")
	}

	// Load and validate all required configuration once at startup
	cfg, err := config.Load()
	if err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	// Open database connection (sslmode=require, no global variable)
	db, err := database.Connect(cfg)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	cacheClient, cerr := cache.NewRedisClient(cfg.RedisURL)
	if cerr != nil {
		slog.Warn("redis unavailable, running without cache", "error", cerr)
		cacheClient = nil
	} else if cacheClient != nil {
		defer func() {
			if c, ok := cacheClient.(interface{ Close() error }); ok {
				if err := c.Close(); err != nil {
					slog.Warn("redis close", "error", err)
				}
			}
		}()
	}

	app := bootstrap.NewFiberApp(db, cfg, cacheClient)

	// Graceful shutdown: wait for SIGTERM (sent by Cloud Run / ECS on stop)
	// or SIGINT (Ctrl+C in dev) before closing.
	//
	//   signal.NotifyContext creates a context that is cancelled when the OS
	//   delivers the named signal. The defer stop() deregisters the handler.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	// Start server in a goroutine so the main goroutine can block on the signal.
	go func() {
		addr := ":" + cfg.Port
		slog.Info("server starting", "addr", addr)
		if err := app.Listen(addr); err != nil {
			slog.Error("server error", "error", err)
		}
	}()

	// Block until the signal fires
	<-ctx.Done()
	slog.Info("shutdown signal received, draining connections")

	// Give in-flight requests up to 10 seconds to finish before forceful close
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		slog.Error("error during shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped cleanly")
}
