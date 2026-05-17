// Lambda entrypoint for production (AWS Lambda Function URL, HTTP API v2 payload).
// Local development continues to use cmd/main.go with a normal TCP listener.
package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	fiberadapter "github.com/awslabs/aws-lambda-go-api-proxy/fiber"
	"github.com/aniqaqill/runners-list/internal/adapter/database"
	"github.com/aniqaqill/runners-list/internal/bootstrap"
	"github.com/aniqaqill/runners-list/internal/config"
	"github.com/aniqaqill/runners-list/internal/platform/cache"
	"github.com/aniqaqill/runners-list/internal/platform/logging"
	"github.com/joho/godotenv"
)

var fiberLambda *fiberadapter.FiberLambda

func init() {
	logging.Init()

	if err := godotenv.Load(); err != nil {
		slog.Info("no .env file in lambda package, using process env only")
	}

	cfg, err := config.Load()
	if err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	db, err := database.Connect(cfg)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	cacheClient, cerr := cache.NewRedisClient(cfg.RedisURL)
	if cerr != nil {
		slog.Warn("redis unavailable, running without cache", "error", cerr)
		cacheClient = nil
	}

	app := bootstrap.NewFiberApp(db, cfg, cacheClient)
	fiberLambda = fiberadapter.New(app)
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return fiberLambda.ProxyWithContextV2(ctx, req)
}

func main() {
	lambda.Start(handler)
}
