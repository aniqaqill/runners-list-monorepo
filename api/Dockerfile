# =============================================================================
# Stage 1 — build
# =============================================================================
FROM golang:1.24-alpine AS build

WORKDIR /app

# Download dependencies first for better layer caching
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO_ENABLED=0 produces a fully static binary — no libc dependency, safe for
# distroless/scratch base images and for AWS Lambda custom runtime (bootstrap).
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o runners-list-api ./cmd
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -tags lambda.norpc -o bootstrap ./cmd/lambda

# =============================================================================
# Stage 2 — Lambda zip (optional: docker build --target lambda-bundle …)
# =============================================================================
#   docker build --target lambda-bundle -t runners-list-lambda .
#   id=$(docker create runners-list-lambda) && docker cp "$id":/out/function.zip . && docker rm "$id"
FROM alpine:3.21 AS lambda-bundle
RUN apk add --no-cache zip ca-certificates
WORKDIR /out
COPY --from=build /app/bootstrap ./bootstrap
RUN zip -q /out/function.zip bootstrap

# =============================================================================
# Stage 3 — runtime (distroless) — default image target
# =============================================================================
# gcr.io/distroless/static-debian12:nonroot ships:
#   - CA certificates       (needed for TLS to Supabase)
#   - tzdata                (needed for Asia/Singapore timezone)
#   - no shell, no package manager, minimal attack surface
#
# The ":nonroot" tag sets the default USER to uid 65532 (nonroot).
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=build /app/runners-list-api .

# Cloud Run injects $PORT at runtime (default 8080). Our Go binary reads it
# from config.Load() → cfg.Port. Declaring it here is documentation only.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/app/runners-list-api"]
