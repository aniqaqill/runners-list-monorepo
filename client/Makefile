# Clean unwanted port bindings (incase port had cache)
clean-port:
	@echo "Cleaning port 3000..."
	@lsof -ti :3000 | xargs kill -9 || echo "Port 3000 is already free."

# Not using docker compose (not recommended)
# Production commands
build-prod:
	@echo "Building production image..."
	docker build -t runners-list-web --target prod .

run-prod: clean-port
	@echo "Running production server..."
	docker run -p 3000:3000 runners-list-web

# Development commands
build-dev:
	@echo "Building development image..."
	docker build -t runners-list-web:dev --target dev .

run-dev: clean-port
	@echo "Running development server..."
	docker run -p 3000:3000 runners-list-web:dev

# Docker Compose commands (recommend)
up-dev:
	@echo "Starting development environment with Docker Compose..."
	docker-compose -f docker-compose.dev.yml up --build

down-dev:
	@echo "Stopping development environment..."
	docker-compose -f docker-compose.dev.yml down

up-prod:
	@echo "Starting production environment with Docker Compose..."
	docker-compose -f docker-compose.prod.yml up --build

down-prod:
	@echo "Stopping production environment..."
	docker-compose -f docker-compose.prod.yml down

# Additional workflows
# Rebuild and restart development environment
rebuild-dev: down-dev build-dev up-dev
	@echo "Development environment rebuilt and restarted."

# Rebuild and restart production environment
rebuild-prod: down-prod build-prod up-prod
	@echo "Production environment rebuilt and restarted."

# Check running containers
ps:
	@echo "Listing running containers..."
	docker ps

# Clean up unused Docker resources
clean:
	@echo "Cleaning up unused Docker resources..."
	docker system prune -f

# Help command to list all available commands
help:
	@echo "Available commands:"
	@echo "  clean-port          - Kill processes using port 3000."
	@echo "  (Not recommended)"
	@echo "  build-prod          - Build the production Docker image."
	@echo "  run-prod            - Run the production container."
	@echo "  build-dev           - Build the development Docker image."
	@echo "  run-dev             - Run the development container."
	@echo "  (Recommended)"
	@echo "  up-dev              - Start the development environment using Docker Compose."
	@echo "  down-dev            - Stop the development environment."
	@echo "  up-prod             - Start the production environment using Docker Compose."
	@echo "  down-prod           - Stop the production environment."
	@echo "  (Extra)"
	@echo "  rebuild-dev         - Rebuild and restart the development environment."
	@echo "  rebuild-prod        - Rebuild and restart the production environment."
	@echo "  ps                  - List running containers."
	@echo "  clean               - Clean up unused Docker resources."
	@echo "  help                - Show this help message."