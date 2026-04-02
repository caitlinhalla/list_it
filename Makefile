.PHONY: setup start stop test clean db-reset db-up

db-up: ## Start Postgres
	docker compose up -d db
	@echo "Waiting for Postgres to be healthy..."
	@until docker compose exec db pg_isready -U list_it > /dev/null 2>&1; do sleep 1; done
	@echo "Postgres is ready."

setup: db-up ## Install deps and set up databases
	cd backend && make setup
	cd frontend && make setup

start: db-up ## Start all services (backend + frontend)
	cd backend && make server &
	cd frontend && make dev

stop: ## Stop all services
	docker compose down
	-pkill -f "mix phx.server" 2>/dev/null
	-pkill -f "vite" 2>/dev/null

test: db-up ## Run all tests
	cd backend && make test

clean: ## Clean build artifacts
	cd backend && rm -rf _build deps
	cd frontend && rm -rf node_modules dist

db-reset: db-up ## Reset database
	cd backend && mix ecto.reset
